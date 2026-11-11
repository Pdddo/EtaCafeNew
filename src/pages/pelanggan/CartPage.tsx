// ============================================================
// HALAMAN : CartPage
// PERAN   : pelanggan
// ROUTE   : /pelanggan/cart
// PIC     : (isi nama pengerjanya)
//
// ATURAN (baca sebelum mengerjakan, juga jika memakai AI):
// 1. Panggil backend HANYA lewat fungsi di src/api/*.ts, jangan fetch langsung di sini.
// 2. Gunakan tipe dari src/types/index.ts, jangan buat tipe ganda.
// 3. Pakai komponen di src/components/common sebelum membuat komponen baru.
// 4. Jangan membuat folder atau file di luar struktur ini tanpa persetujuan tim.
// 5. Hanya React + TypeScript, tanpa HTML/JS terpisah.
// ============================================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart, formatRupiah } from '../../context/CartContext';
import { PelangganAPI, PromoData } from '../../api/pelanggan';
import './CartPage.css';

export default function CartPage() {
  const { user, logout: onLogout } = useAuth();
  const { cart, updateQuantity, clearCart, subtotal } = useCart();
  const navigate = useNavigate();
  const userName = user?.name ?? 'Pelanggan';
  const [tableNumber, setTableNumber] = useState('Meja 1');
  const [orderType, setOrderType] = useState<'qr_meja' | 'langsung'>('qr_meja');
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [availablePromos, setAvailablePromos] = useState<PromoData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    PelangganAPI.getPromos()
      .then((data) => setAvailablePromos(data.filter((p) => p.is_active)))
      .catch((err) => console.warn('Gagal memuat promo:', err));
  }, []);

  // Perhitungan Biaya
  // Pajak dihitung dari subtotal SETELAH diskon (konsisten dengan backend)
  const taxableBase = Math.max(0, subtotal - discountAmount);
  const taxAmount = Math.round(taxableBase * 0.1); // Pajak 10%
  const serviceFee = subtotal > 0 ? 3000 : 0; // Biaya layanan / kemasan
  const totalAmount = Math.max(0, taxableBase + taxAmount + serviceFee);

  const handleApplyPromo = (codeToApply?: string) => {
    const code = (codeToApply || promoCode).trim().toUpperCase();
    if (!code) return;

    const matched = availablePromos.find((p) => p.code.toUpperCase() === code);
    if (!matched) {
      setError('Kode promo tidak valid atau telah berakhir.');
      return;
    }

    const minOrder = Number(matched.min_order || 0);
    if (subtotal < minOrder) {
      setError(`Kupon ${matched.code} membutuhkan minimal order ${formatRupiah(minOrder)}`);
      return;
    }

    let disc = 0;
    if (matched.discount_type === 'percentage' || matched.discount_type === 'persentase') {
      disc = Math.round((subtotal * Number(matched.discount_value)) / 100);
    } else {
      disc = Math.min(Number(matched.discount_value), subtotal);
    }

    setDiscountAmount(disc);
    setAppliedPromo(matched.code);
    setError(null);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      setError('Keranjang Anda masih kosong. Silakan pilih menu terlebih dahulu.');
      return;
    }

    setLoading(true);
    setError(null);

    const payload = {
      customer_name: userName,
      customer_phone: '08123456789',
      order_type: orderType,
      table_number: orderType === 'qr_meja' ? tableNumber : undefined,
      payment_method: 'qris' as const,
      promo_code: appliedPromo || undefined,
      items: cart.map((i) => ({
        menu_item_id: i.menu_item_id,
        quantity: i.quantity,
        custom_notes: i.notes || '',
      })),
    };

    try {
      const result = await PelangganAPI.checkoutOrder(payload);
      clearCart();
      navigate('/pelanggan/success', { state: { orderData: result } });
    } catch (err: any) {
      console.warn('Checkout gagal:', err);
      // Tampilkan error ke pengguna; biarkan mereka mencoba lagi
      setError(err?.message ?? 'Checkout gagal, coba lagi nanti.');
      // Tidak mengosongkan keranjang, tidak navigate ke halaman success
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="receipt-page-wrapper">
        <div className="receipt-container">
          {/* ─── KOLOM KIRI: LOKASI & MEJA ─── */}
          <div className="receipt-left">
            <div className="closest-cafe-box">
              <div className="cafe-header">
                <span className="cafe-title">Lokasi Kafe:</span>
              </div>
              <div className="cafe-name">EtaCafe Unhas Baraya</div>
              <div className="cafe-address">
                Jl. Perintis Kemerdekaan KM 10, Tamalanrea, Makassar (FMIPA Universitas Hasanuddin)
              </div>
            </div>

            <hr className="receipt-divider" />

            <div className="table-box">
              <div className="table-header">
                <span className="table-title">Informasi Pesanan:</span>
              </div>

              <div className="table-content mb-3">
                <span>Tipe Pemesanan:</span>
                <select
                  value={orderType}
                  onChange={(e) => setOrderType(e.target.value as any)}
                  className="table-select"
                >
                  <option value="qr_meja">Pesan di Meja (Dine In)</option>
                  <option value="langsung">Bawa Pulang (Take Away)</option>
                </select>
              </div>

              {orderType === 'qr_meja' && (
                <div className="table-content">
                  <span>Nomor Meja:</span>
                  <select
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    className="table-select"
                  >
                    {[...Array(10)].map((_, i) => (
                      <option key={i + 1} value={`Meja ${i + 1}`}>Meja {i + 1}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="back-order-wrapper">
              <button
                type="button"
                className="btn-back-order"
                onClick={() => navigate('/pelanggan/products')}
              >
                &lt; Tambah Menu Lain
              </button>
            </div>
          </div>

          {/* ─── KOLOM KANAN: RINGKASAN PESANAN ─── */}
          <div className="receipt-right">
            <div className="your-order-title">Pesanan Anda:</div>

            {cart.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-xl border border-[#ece4dc] text-stone-500 mb-6">
                Keranjang belanja masih kosong.
              </div>
            ) : (
              <div className="order-items-list">
                {cart.map((item) => (
                  <div key={item.menu_item_id} className="order-item-row">
                    <div className="order-item-main">
                      <div className="order-item-desc">
                        <div className="order-item-qty-controls">
                          <button
                            type="button"
                            className="btn-qty-mini"
                            onClick={() => updateQuantity(item.menu_item_id, item.quantity - 1)}
                          >
                            −
                          </button>
                          <span className="order-item-qty">{item.quantity}</span>
                          <button
                            type="button"
                            className="btn-qty-mini"
                            onClick={() => updateQuantity(item.menu_item_id, item.quantity + 1)}
                          >
                            +
                          </button>
                        </div>
                        <span className="order-item-name">{item.name}</span>
                      </div>
                      <span className="order-item-price">{formatRupiah(item.subtotal)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* KODE PROMO */}
            <div className="promo-box">
              <div className="promo-input-row">
                <input
                  type="text"
                  placeholder="Masukkan Kode Voucher"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  className="promo-input"
                />
                <button
                  type="button"
                  className="btn-use-promo"
                  onClick={() => handleApplyPromo()}
                >
                  Gunakan
                </button>
              </div>
              {availablePromos.length > 0 && (
                <div className="promo-tag-hint">
                  Kupon tersedia:
                  {availablePromos.map((p) => (
                    <span
                      key={p.id}
                      className="promo-chip"
                      onClick={() => {
                        setPromoCode(p.code);
                        handleApplyPromo(p.code);
                      }}
                      title={`${p.description} (Min. Order ${formatRupiah(p.min_order)})`}
                    >
                      {p.code}
                    </span>
                  ))}
                </div>
              )}
              {appliedPromo && (
                <div className="text-xs text-emerald-700 font-semibold mt-2">
                  ✓ Voucher {appliedPromo} berhasil digunakan (-{formatRupiah(discountAmount)})
                </div>
              )}
            </div>

            {/* RINCIAN HARGA */}
            <div className="cost-breakdown">
              <div className="cost-row">
                <span>Subtotal Produk</span>
                <span>{formatRupiah(subtotal)}</span>
              </div>
              <div className="cost-row">
                <span>Pajak Restoran (10%)</span>
                <span>{formatRupiah(taxAmount)}</span>
              </div>
              <div className="cost-row">
                <span>Biaya Layanan</span>
                <span>{formatRupiah(serviceFee)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="cost-row text-emerald-700 font-semibold">
                  <span>Diskon Promo ({appliedPromo})</span>
                  <span>-{formatRupiah(discountAmount)}</span>
                </div>
              )}
              <div className="cost-row total-row">
                <span>Total Pembayaran</span>
                <span>{formatRupiah(totalAmount)}</span>
              </div>
            </div>

            {error && <div className="auth-error mb-4">{error}</div>}

            <button
              type="button"
              className="btn-pay-now"
              disabled={loading || cart.length === 0}
              onClick={handleCheckout}
            >
              {loading ? 'Memproses Pesanan...' : 'Pesan & Bayar Sekarang'}
            </button>
          </div>
        </div>
      </div>
  );
}
