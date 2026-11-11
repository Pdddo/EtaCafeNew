// HALAMAN : PembayaranPage (Kasir)
// PERAN   : Kasir memproses transaksi pembayaran pesanan (QRIS, Tunai, Kartu)
//           Setelah pembayaran sukses, sistem mengonfirmasi pesanan (FR-18 & FR-20)
//           dan otomatis meneruskan data ke Dapur (BR-02 & BR-09).

import React, { useEffect, useState, useCallback } from 'react';
import { KasirAPI } from '../../api/client';
import Loading from '../../components/common/Loading';
import RupiahText from '../../components/common/RupiahText';
import StatusBadge from '../../components/common/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import type { Order } from '../../types';

export default function PembayaranPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<'QRIS' | 'Tunai' | 'Kartu'>('QRIS');
  const [cashGiven, setCashGiven] = useState<string>('');
  const [processing, setProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadOrder = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      const data = await KasirAPI.getOrderDetail(id);
      if (data) {
        setOrder(data as Order);
        if ((data as any).payment_method) {
          const pm = (data as any).payment_method;
          if (pm === 'QRIS' || pm === 'Tunai' || pm === 'Kartu') {
            setPaymentMethod(pm);
          }
        }
      }
    } catch (error: any) {
      console.error('Gagal memuat pesanan:', error);
      setErrorMessage(error?.message || 'Gagal memuat data pesanan.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!isAuthenticated || authLoading) return;
    loadOrder();
  }, [id, isAuthenticated, authLoading, loadOrder]);

  if (!isAuthenticated) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Silakan login terlebih dahulu...</div>;
  }

  if (authLoading || loading) {
    return (
      <div style={{ padding: '60px 0', textAlign: 'center' }}>
        <Loading />
        <p style={{ marginTop: '12px', color: '#777' }}>Memuat halaman pembayaran...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="kasir-empty-state" style={{ padding: '60px 20px' }}>
        <p style={{ fontSize: '18px', fontWeight: 600 }}>Pesanan tidak ditemukan.</p>
        <button
          type="button"
          className="kasir-order-btn"
          onClick={() => navigate('/kasir/orders')}
          style={{ marginTop: '12px' }}
        >
          Kembali ke Daftar Pesanan
        </button>
      </div>
    );
  }

  const o = order as any;
  const orderNum = o.order_number || o.orderNumber || `#${o.id}`;
  const customer = o.customer_name || o.customerName || 'Pelanggan';
  const tableNo = o.table_number || o.tableNumber || (o.order_type === 'langsung' ? 'Kasir' : '-');
  const total = o.total_amount ?? o.totalAmount ?? 0;
  const subtotal = o.subtotal ?? 0;
  const tax = o.tax_amount ?? o.taxAmount ?? 0;
  const service = o.service_fee ?? o.serviceFee ?? 0;
  const discount = o.discount_amount ?? o.discountAmount ?? 0;
  const status = o.status || 'Menunggu Konfirmasi Kasir';
  const isPending = status === 'Menunggu Konfirmasi Kasir' || status === 'MENUNGGU_KONFIRMASI_KASIR';
  const items = o.items || [];

  // Hitung Kembalian Tunai
  const cashGivenNumber = parseFloat(cashGiven.replace(/\D/g, '')) || 0;
  const kembalian = Math.max(0, cashGivenNumber - total);
  const isCashInsufficient = paymentMethod === 'Tunai' && cashGivenNumber > 0 && cashGivenNumber < total;

  // Selesaikan Pembayaran & Konfirmasi ke Dapur
  const handleCompletePayment = async () => {
    if (paymentMethod === 'Tunai' && cashGivenNumber < total) {
      setErrorMessage(`Uang tunai yang diterima (Rp ${cashGivenNumber.toLocaleString()}) kurang dari total tagihan!`);
      return;
    }

    setProcessing(true);
    setErrorMessage(null);
    try {
      // 1. Panggil konfirmasi pesanan kasir (status berubah jadi 'Dikonfirmasi')
      await KasirAPI.confirmOrder(id!);

      // 2. Langsung arahkan ke halaman cetak struk
      navigate(`/kasir/struk/${id}`);
    } catch (err: any) {
      console.error('Pembayaran / konfirmasi gagal:', err);
      setErrorMessage(err?.message || 'Gagal memproses pembayaran. Coba lagi.');
      setProcessing(false);
    }
  };

  return (
    <div className="kasir-pembayaran-wrapper" style={{ maxWidth: '840px', margin: '0 auto', paddingBottom: '90px' }}>
      {/* Header Halaman */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <button
            type="button"
            onClick={() => navigate('/kasir/orders')}
            style={{
              background: 'none',
              border: 'none',
              color: '#844c1c',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: '14px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '6px',
              padding: 0,
            }}
          >
            ← Kembali ke Daftar Pesanan
          </button>
          <h1 style={{ fontSize: '26px', fontWeight: 800, margin: 0, color: '#2c1810' }}>
            Kasir: Pembayaran Pesanan {orderNum}
          </h1>
        </div>

        <StatusBadge status={status} />
      </div>

      {/* Error Notice */}
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

      {/* Card Utama Pembayaran */}
      <div
        style={{
          background: '#fff',
          borderRadius: '24px',
          padding: '36px',
          border: '1px solid #ebdccb',
          boxShadow: '0 8px 32px rgba(44, 24, 16, 0.08)',
        }}
      >
        {/* Info Ringkas Pesanan */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', paddingBottom: '20px', borderBottom: '1px solid #f0e6dc', marginBottom: '24px' }}>
          <div>
            <span style={{ fontSize: '12px', color: '#777', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pelanggan</span>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#2c1810', marginTop: '2px' }}>{customer}</div>
          </div>
          <div>
            <span style={{ fontSize: '12px', color: '#777', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Meja / Antrean</span>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#844c1c', marginTop: '2px' }}>Meja {tableNo}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '12px', color: '#777', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Tagihan</span>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#2c1810', marginTop: '2px' }}>
              <RupiahText amount={total} />
            </div>
          </div>
        </div>

        {/* Pilihan Metode Pembayaran */}
        <div style={{ marginBottom: '28px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#2c1810', margin: '0 0 14px 0' }}>
            Pilih Metode Pembayaran
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            {(['QRIS', 'Tunai', 'Kartu'] as const).map((method) => {
              const isSelected = paymentMethod === method;
              return (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
                  style={{
                    padding: '16px',
                    borderRadius: '14px',
                    border: `2px solid ${isSelected ? '#2c1810' : '#e0d5c8'}`,
                    backgroundColor: isSelected ? '#faf6f0' : '#fff',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ fontSize: '24px', marginBottom: '4px' }}>
                    {method === 'QRIS' ? '📱' : method === 'Tunai' ? '💵' : '💳'}
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#2c1810' }}>{method}</div>
                  <div style={{ fontSize: '11px', color: '#777', marginTop: '2px' }}>
                    {method === 'QRIS' ? 'Instant QR Code' : method === 'Tunai' ? 'Uang Pas / Kembalian' : 'Debit / Kredit'}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Detail Input Pembayaran Spesifik */}
        {paymentMethod === 'Tunai' && (
          <div style={{ background: '#faf6f0', borderRadius: '16px', padding: '20px', border: '1px solid #ebdccb', marginBottom: '24px' }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 700, color: '#2c1810' }}>
              Kalkulator Uang Tunai
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#555', display: 'block', marginBottom: '6px' }}>
                  Jumlah Uang Diterima (Rp)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 50000"
                  value={cashGiven}
                  onChange={(e) => setCashGiven(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #d4c5b9',
                    fontSize: '16px',
                    fontWeight: 700,
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#555', display: 'block', marginBottom: '6px' }}>
                  Kembalian Pelanggan
                </label>
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    backgroundColor: '#fff',
                    border: '1px solid #d4c5b9',
                    fontSize: '18px',
                    fontWeight: 800,
                    color: isCashInsufficient ? '#dc2626' : '#15803d',
                  }}
                >
                  {isCashInsufficient ? (
                    <span style={{ fontSize: '13px' }}>Kurang <RupiahText amount={total - cashGivenNumber} /></span>
                  ) : (
                    <RupiahText amount={kembalian} />
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {paymentMethod === 'QRIS' && (
          <div style={{ background: '#faf6f0', borderRadius: '16px', padding: '20px', border: '1px solid #ebdccb', marginBottom: '24px', textAlign: 'center' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#2c1810', marginBottom: '8px' }}>
              Scan QRIS Pembayaran EtaCafe
            </div>
            <div
              style={{
                width: '140px',
                height: '140px',
                margin: '0 auto 10px',
                backgroundColor: '#fff',
                border: '2px dashed #844c1c',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '48px',
              }}
            >
              🏁
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              Pastikan pelanggan telah melakukan pembayaran di aplikasi m-banking / e-wallet.
            </div>
          </div>
        )}

        {paymentMethod === 'Kartu' && (
          <div style={{ background: '#faf6f0', borderRadius: '16px', padding: '20px', border: '1px solid #ebdccb', marginBottom: '24px', textAlign: 'center' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#2c1810', marginBottom: '6px' }}>
              Mesin EDC Kartu Debit/Kredit
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              Gesek / masukkan kartu di mesin EDC sebesar <strong><RupiahText amount={total} /></strong>.
            </div>
          </div>
        )}

        {/* Ringkasan Biaya Transaksi */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', color: '#555', marginBottom: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Subtotal Items ({items.length})</span>
            <span><RupiahText amount={subtotal} /></span>
          </div>
          {discount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a', fontWeight: 600 }}>
              <span>Diskon Promo</span>
              <span>- <RupiahText amount={discount} /></span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Pajak Restoran (10%)</span>
            <span><RupiahText amount={tax} /></span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Biaya Layanan (5%)</span>
            <span><RupiahText amount={service} /></span>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '18px',
              fontWeight: 800,
              color: '#2c1810',
              borderTop: '2px solid #2c1810',
              paddingTop: '12px',
              marginTop: '4px',
            }}
          >
            <span>TOTAL BAYAR</span>
            <span><RupiahText amount={total} /></span>
          </div>
        </div>

        {/* Tombol Aksi */}
        <div style={{ display: 'flex', gap: '16px' }}>
          <button
            type="button"
            className="kasir-order-btn"
            onClick={() => navigate('/kasir/orders')}
            style={{ flex: 1, padding: '14px 0', textAlign: 'center' }}
          >
            Batal
          </button>

          <button
            type="button"
            className="kasir-order-btn primary"
            onClick={handleCompletePayment}
            disabled={processing || isCashInsufficient}
            style={{
              flex: 2,
              padding: '14px 0',
              backgroundColor: '#15803d',
              borderColor: '#15803d',
              color: '#fff',
              fontSize: '15px',
              fontWeight: 800,
            }}
          >
            {processing ? 'Memproses Konfirmasi...' : '✓ Selesaikan Pembayaran & Kirim ke Dapur'}
          </button>
        </div>
      </div>
    </div>
  );
}
