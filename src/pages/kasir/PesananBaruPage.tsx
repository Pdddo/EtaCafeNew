// HALAMAN : PesananBaruPage (Kasir)
// PERAN   : Kasir membuat pesanan langsung di meja kasir (Point of Sale / POS)
//           Otomatis menghitung subtotal, pajak, biaya layanan, dan mengirim pesanan ke Dapur

import React, { useState, useEffect, useMemo } from 'react';
import { KasirAPI } from '../../api/client';
import RupiahText from '../../components/common/RupiahText';
import Loading from '../../components/common/Loading';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import type { MenuItem } from '../../types';

interface CartEntry {
  menuItem: MenuItem;
  quantity: number;
  notes: string;
}

export default function PesananBaruPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [loading, setLoading] = useState(true);

  // Form input pemesanan
  const [customerName, setCustomerName] = useState('Pelanggan Kasir');
  const [customerPhone, setCustomerPhone] = useState('');
  const [orderType, setOrderType] = useState<'langsung' | 'qr_meja'>('langsung');
  const [tableNumber, setTableNumber] = useState('Meja 1');
  const [paymentMethod, setPaymentMethod] = useState<'QRIS' | 'Tunai' | 'Kartu'>('QRIS');
  const [autoConfirmToKitchen, setAutoConfirmToKitchen] = useState(true);

  // Cart
  const [cart, setCart] = useState<CartEntry[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load Categories & Menu
  useEffect(() => {
    if (!isAuthenticated || authLoading) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const [catData, menuData] = await Promise.all([
          KasirAPI.getCategories(),
          KasirAPI.getMenu(),
        ]);

        if (Array.isArray(catData)) {
          setCategories(catData);
        }
        if (Array.isArray(menuData)) {
          setMenuItems(menuData);
        }
      } catch (err: any) {
        console.error('Gagal memuat data menu/kategori:', err);
        setErrorMessage(err?.message || 'Gagal memuat data menu.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isAuthenticated, authLoading]);

  // Filter Menu
  const filteredMenu = useMemo(() => {
    return menuItems.filter((item: any) => {
      const matchCat =
        selectedCategoryId === null ||
        item.category_id === selectedCategoryId ||
        item.categoryId === selectedCategoryId;

      const matchSearch =
        !searchKeyword ||
        item.name.toLowerCase().includes(searchKeyword.toLowerCase());

      return matchCat && matchSearch;
    });
  }, [menuItems, selectedCategoryId, searchKeyword]);

  // Perhitungan Biaya
  const subtotal = useMemo(() => {
    return cart.reduce((acc, curr) => acc + curr.menuItem.price * curr.quantity, 0);
  }, [cart]);

  const taxAmount = Math.round(subtotal * 0.1); // Pajak 10%
  const serviceFee = subtotal > 0 ? Math.round(subtotal * 0.05) : 0; // Biaya Layanan 5%
  const grandTotal = subtotal + taxAmount + serviceFee;

  // Cart Actions
  const handleAddToCart = (menuItem: MenuItem) => {
    setCart((prev) => {
      const idx = prev.findIndex((c) => String(c.menuItem.id) === String(menuItem.id));
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], quantity: updated[idx].quantity + 1 };
        return updated;
      } else {
        return [...prev, { menuItem, quantity: 1, notes: '' }];
      }
    });
  };

  const handleUpdateQty = (menuId: string | number, delta: number) => {
    setCart((prev) => {
      return prev
        .map((entry) => {
          if (String(entry.menuItem.id) === String(menuId)) {
            const nextQty = entry.quantity + delta;
            return nextQty > 0 ? { ...entry, quantity: nextQty } : null;
          }
          return entry;
        })
        .filter(Boolean) as CartEntry[];
    });
  };

  const handleUpdateNotes = (menuId: string | number, notes: string) => {
    setCart((prev) =>
      prev.map((entry) =>
        String(entry.menuItem.id) === String(menuId) ? { ...entry, notes } : entry
      )
    );
  };

  const handleRemoveItem = (menuId: string | number) => {
    setCart((prev) => prev.filter((entry) => String(entry.menuItem.id) !== String(menuId)));
  };

  // Submit Order
  const handleCheckout = async () => {
    if (cart.length === 0) {
      setErrorMessage('Keranjang masih kosong. Pilih menu terlebih dahulu.');
      return;
    }

    if (!customerName.trim()) {
      setErrorMessage('Nama pelanggan wajib diisi.');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    const payload = {
      customer_name: customerName.trim(),
      customer_phone: customerPhone.trim() || undefined,
      order_type: orderType,
      table_number: orderType === 'qr_meja' ? tableNumber : (tableNumber || 'Kasir'),
      payment_method: paymentMethod,
      items: cart.map((entry) => ({
        menu_item_id: Number(entry.menuItem.id),
        quantity: entry.quantity,
        notes: entry.notes.trim() || undefined,
        custom_notes: entry.notes.trim() || undefined,
      })),
    };

    try {
      // 1. Buat pesanan di backend
      const createdOrder = await KasirAPI.createOrder(payload);
      const orderId = createdOrder.id;

      // 2. Jika opsi 'Otomatis Konfirmasi' aktif: langsung konfirmasi sehingga masuk ke Dapur
      if (autoConfirmToKitchen) {
        await KasirAPI.confirmOrder(orderId);
      }

      // 3. Arahkan kasir ke struk pembayaran untuk dicetak
      if (autoConfirmToKitchen) {
        navigate(`/kasir/struk/${orderId}`);
      } else {
        navigate(`/kasir/orders/${orderId}`);
      }
    } catch (err: any) {
      console.error('Checkout gagal:', err);
      setErrorMessage(err?.message || 'Gagal membuat pesanan. Cek koneksi backend.');
      setSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Silakan login terlebih dahulu...</div>;
  }

  return (
    <div className="kasir-pos-wrapper" style={{ paddingBottom: '90px' }}>
      {/* Header Halaman */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, margin: 0, color: '#2c1810' }}>
            Pesanan Baru (POS Kasir)
          </h1>
          <p style={{ margin: '4px 0 0', color: '#665c54', fontSize: '14px' }}>
            Input pesanan langsung dari meja kasir, proses pembayaran dan teruskan ke dapur
          </p>
        </div>

        <button
          type="button"
          className="kasir-order-btn"
          onClick={() => navigate('/kasir/orders')}
        >
          Lihat Daftar Pesanan
        </button>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div
          style={{
            padding: '12px 18px',
            marginBottom: '20px',
            borderRadius: '10px',
            backgroundColor: '#fee2e2',
            color: '#991b1b',
            border: '1px solid #fca5a5',
            fontSize: '14px',
            fontWeight: 600,
          }}
        >
          {errorMessage}
        </div>
      )}

      {/* Layout Grid POS: Kiri Katalog Menu | Kanan Keranjang & Kasir */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '32px', alignItems: 'flex-start' }}>
        {/* ================= KOLOM KIRI: KATALOG MENU ================= */}
        <div>
          {/* Search & Kategori Bar */}
          <div style={{ background: '#fff', borderRadius: '16px', padding: '16px 20px', border: '1px solid #ebdccb', marginBottom: '20px' }}>
            <div style={{ marginBottom: '12px' }}>
              <input
                type="text"
                placeholder="🔍 Cari nama kopi atau makanan..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  borderRadius: '9999px',
                  border: '1px solid #d4c5b9',
                  fontSize: '14px',
                  outline: 'none',
                  backgroundColor: '#faf6f0',
                }}
              />
            </div>

            {/* Pill Kategori */}
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
              <button
                type="button"
                onClick={() => setSelectedCategoryId(null)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '9999px',
                  border: '1px solid #2c1810',
                  backgroundColor: selectedCategoryId === null ? '#2c1810' : '#fff',
                  color: selectedCategoryId === null ? '#fff' : '#2c1810',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                Semua
              </button>

              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategoryId(cat.id)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '9999px',
                    border: '1px solid #2c1810',
                    backgroundColor: selectedCategoryId === cat.id ? '#2c1810' : '#fff',
                    color: selectedCategoryId === cat.id ? '#fff' : '#2c1810',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Grid Menu Cards */}
          {loading ? (
            <div style={{ padding: '60px 0', textAlign: 'center' }}>
              <Loading />
              <p style={{ marginTop: '12px', color: '#777' }}>Memuat katalog menu...</p>
            </div>
          ) : filteredMenu.length === 0 ? (
            <div className="kasir-empty-state">
              <p>Tidak ada menu yang sesuai dengan filter.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
              {filteredMenu.map((item: any) => {
                const img = item.image_url || item.imageUrl || 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400';
                return (
                  <div
                    key={item.id}
                    style={{
                      background: '#fff',
                      borderRadius: '16px',
                      overflow: 'hidden',
                      border: '1px solid #ebdccb',
                      boxShadow: '0 2px 8px rgba(44,24,16,0.04)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      transition: 'transform 0.2s',
                    }}
                  >
                    <div style={{ height: '110px', backgroundColor: '#e6ded5', overflow: 'hidden' }}>
                      <img
                        src={img}
                        alt={item.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e: any) => {
                          e.target.src = 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400';
                        }}
                      />
                    </div>

                    <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                      <div>
                        <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 700, color: '#2c1810' }}>
                          {item.name}
                        </h4>
                        <div style={{ fontSize: '13px', fontWeight: 800, color: '#844c1c', marginBottom: '8px' }}>
                          <RupiahText amount={item.price} />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAddToCart(item)}
                        style={{
                          width: '100%',
                          padding: '7px 0',
                          borderRadius: '8px',
                          border: 'none',
                          backgroundColor: '#2c1810',
                          color: '#fff',
                          fontWeight: 700,
                          fontSize: '12px',
                          cursor: 'pointer',
                        }}
                      >
                        + Tambah ke Keranjang
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ================= KOLOM KANAN: FORM & KERANJANG ================= */}
        <div
          style={{
            background: '#fff',
            borderRadius: '20px',
            padding: '24px',
            border: '1px solid #ebdccb',
            boxShadow: '0 8px 24px rgba(44,24,16,0.06)',
            position: 'sticky',
            top: '80px',
          }}
        >
          <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 800, color: '#2c1810', borderBottom: '2px solid #2c1810', paddingBottom: '10px' }}>
            Rincian Pesanan
          </h3>

          {/* Form Pemesan */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#555', display: 'block', marginBottom: '4px' }}>
                Nama Pelanggan
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d4c5b9', fontSize: '13px' }}
                placeholder="Contoh: Budi Santoso"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#555', display: 'block', marginBottom: '4px' }}>
                  Tipe Pesanan
                </label>
                <select
                  value={orderType}
                  onChange={(e: any) => setOrderType(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d4c5b9', fontSize: '13px', backgroundColor: '#fff' }}
                >
                  <option value="langsung">Takeaway / Langsung</option>
                  <option value="qr_meja">Dine In (Meja)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#555', display: 'block', marginBottom: '4px' }}>
                  No. Meja
                </label>
                <input
                  type="text"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d4c5b9', fontSize: '13px' }}
                  placeholder="Meja 1"
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#555', display: 'block', marginBottom: '4px' }}>
                Metode Pembayaran
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                {(['QRIS', 'Tunai', 'Kartu'] as const).map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    style={{
                      padding: '8px 4px',
                      borderRadius: '8px',
                      border: `1.5px solid ${paymentMethod === method ? '#2c1810' : '#d4c5b9'}`,
                      backgroundColor: paymentMethod === method ? '#2c1810' : '#faf6f0',
                      color: paymentMethod === method ? '#fff' : '#2c1810',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #ebdccb', margin: '16px 0' }} />

          {/* Daftar Item Keranjang */}
          <div style={{ maxHeight: '240px', overflowY: 'auto', marginBottom: '16px', paddingRight: '4px' }}>
            {cart.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#999', fontSize: '13px', padding: '24px 0' }}>
                Keranjang masih kosong. Klik "+ Tambah" pada menu di sebelah kiri.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {cart.map((entry) => {
                  const itemTotal = entry.menuItem.price * entry.quantity;
                  return (
                    <div
                      key={entry.menuItem.id}
                      style={{
                        padding: '10px',
                        borderRadius: '10px',
                        backgroundColor: '#faf6f0',
                        border: '1px solid #ebdccb',
                        fontSize: '13px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: '#2c1810' }}>
                        <span>{entry.menuItem.name}</span>
                        <span><RupiahText amount={itemTotal} /></span>
                      </div>

                      {/* Controls Qty & Note */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => handleUpdateQty(entry.menuItem.id, -1)}
                            style={{ width: '24px', height: '24px', borderRadius: '4px', border: '1px solid #ccc', background: '#fff', cursor: 'pointer', fontWeight: 700 }}
                          >
                            -
                          </button>
                          <span style={{ fontWeight: 700, minWidth: '18px', textAlign: 'center' }}>
                            {entry.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateQty(entry.menuItem.id, 1)}
                            style={{ width: '24px', height: '24px', borderRadius: '4px', border: '1px solid #ccc', background: '#fff', cursor: 'pointer', fontWeight: 700 }}
                          >
                            +
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveItem(entry.menuItem.id)}
                          style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '11px', fontWeight: 600 }}
                        >
                          Hapus
                        </button>
                      </div>

                      <input
                        type="text"
                        placeholder="Catatan khusus (misal: less sugar)..."
                        value={entry.notes}
                        onChange={(e) => handleUpdateNotes(entry.menuItem.id, e.target.value)}
                        style={{
                          width: '100%',
                          marginTop: '6px',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          border: '1px solid #e0d5c8',
                          fontSize: '11px',
                          backgroundColor: '#fff',
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #ebdccb', margin: '16px 0' }} />

          {/* Rincian Total */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', color: '#666', marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Subtotal</span>
              <span><RupiahText amount={subtotal} /></span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Pajak (10%)</span>
              <span><RupiahText amount={taxAmount} /></span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Biaya Layanan (5%)</span>
              <span><RupiahText amount={serviceFee} /></span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '16px',
                fontWeight: 800,
                color: '#2c1810',
                borderTop: '2px solid #2c1810',
                paddingTop: '10px',
                marginTop: '4px',
              }}
            >
              <span>Total Bayar</span>
              <span><RupiahText amount={grandTotal} /></span>
            </div>
          </div>

          {/* Opsi Langsung Teruskan ke Dapur */}
          <div style={{ marginBottom: '16px', fontSize: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#2c1810', fontWeight: 600 }}>
              <input
                type="checkbox"
                checked={autoConfirmToKitchen}
                onChange={(e) => setAutoConfirmToKitchen(e.target.checked)}
              />
              Otomatis Konfirmasi Pembayaran &amp; Kirim ke Dapur
            </label>
            <span style={{ display: 'block', fontSize: '11px', color: '#777', marginLeft: '22px', marginTop: '2px' }}>
              Pesanan akan langsung diterima di Kitchen Display Dapur dan struk siap dicetak.
            </span>
          </div>

          {/* Tombol Checkout */}
          <button
            type="button"
            className="kasir-order-btn primary"
            onClick={handleCheckout}
            disabled={submitting || cart.length === 0}
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: '#15803d',
              borderColor: '#15803d',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 800,
            }}
          >
            {submitting ? 'Memproses Pesanan...' : '✓ Selesaikan Pesanan & Bayar'}
          </button>
        </div>
      </div>
    </div>
  );
}
