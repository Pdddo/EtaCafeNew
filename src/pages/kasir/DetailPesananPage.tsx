// HALAMAN : DetailPesananPage (Kasir)
// PERAN   : Menampilkan rincian pesanan, konfirmasi pembayaran, dan teruskan ke Dapur (FR-17, FR-18, FR-20, BR-02, BR-09)

import React, { useEffect, useState, useCallback } from 'react';
import { KasirAPI } from '../../api/client';
import Loading from '../../components/common/Loading';
import StatusBadge from '../../components/common/StatusBadge';
import RupiahText from '../../components/common/RupiahText';
import { useAuth } from '../../context/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import type { Order } from '../../types';

export default function DetailPesananPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadOrder = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await KasirAPI.getOrderDetail(id);
      if (data) {
        setOrder(data as Order);
      }
    } catch (error: any) {
      console.error('Gagal memuat detail pesanan:', error);
      setFeedback({ type: 'error', message: error?.message || 'Gagal memuat detail pesanan.' });
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
        <p style={{ marginTop: '12px', color: '#777' }}>Memuat rincian pesanan...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="kasir-empty-state" style={{ padding: '60px 20px' }}>
        <p style={{ fontSize: '18px', fontWeight: 600 }}>Pesanan tidak ditemukan</p>
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
  const phone = o.customer_phone || o.customerPhone || '-';
  const tableNo = o.table_number || o.tableNumber || (o.order_type === 'langsung' ? 'Langsung di Kasir' : '-');
  const orderType = o.order_type || o.orderType || 'langsung';
  const status = o.status || 'Menunggu Konfirmasi Kasir';
  const subtotal = o.subtotal ?? 0;
  const discount = o.discount_amount ?? o.discountAmount ?? 0;
  const tax = o.tax_amount ?? o.taxAmount ?? 0;
  const service = o.service_fee ?? o.serviceFee ?? 0;
  const total = o.total_amount ?? o.totalAmount ?? 0;
  const paymentMethod = o.payment_method || o.paymentMethod || 'QRIS';
  const paymentStatus = o.payment_status || o.paymentStatus || 'Berhasil (Simulasi)';
  const createdAt = o.created_at || o.createdAt;
  const confirmedAt = o.confirmed_at || o.confirmedAt;
  const items = o.items || [];

  const isPending = status === 'Menunggu Konfirmasi Kasir' || status === 'MENUNGGU_KONFIRMASI_KASIR';

  // Handler Konfirmasi Pesanan: mengubah status ke 'Dikonfirmasi' dan otomatis diteruskan ke Dapur (FR-18 & BR-09)
  const handleConfirm = async () => {
    if (!id) return;
    setConfirming(true);
    setFeedback(null);
    try {
      const updated = await KasirAPI.confirmOrder(id);
      setOrder(updated as Order);
      setFeedback({
        type: 'success',
        message: `Pesanan ${orderNum} BERHASIL DIKONFIRMASI! Status kini 'Dikonfirmasi' dan data telah otomatis diterima di antrean Dapur.`,
      });
    } catch (err: any) {
      console.error('Konfirmasi gagal:', err);
      setFeedback({
        type: 'error',
        message: err?.message || 'Gagal mengonfirmasi pesanan. Cek koneksi backend.',
      });
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="kasir-detail-page-wrapper" style={{ maxWidth: '960px', margin: '0 auto', paddingBottom: '90px' }}>
      {/* Header Halaman */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
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
              padding: 0,
              fontSize: '14px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '6px',
            }}
          >
            ← Kembali ke Daftar Pesanan
          </button>
          <h1 style={{ fontSize: '26px', fontWeight: 800, margin: 0, color: '#2c1810' }}>
            Detail Pesanan {orderNum}
          </h1>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          {isPending && (
            <button
              type="button"
              className="kasir-order-btn primary"
              onClick={handleConfirm}
              disabled={confirming}
              style={{ backgroundColor: '#15803d', borderColor: '#15803d', color: '#fff', padding: '10px 22px' }}
            >
              {confirming ? 'Memproses...' : '✓ Konfirmasi & Teruskan ke Dapur'}
            </button>
          )}

          {!isPending && (
            <button
              type="button"
              className="kasir-order-btn"
              onClick={() => navigate(`/kasir/struk/${id}`)}
              style={{ padding: '10px 22px' }}
            >
              🖨️ Cetak Struk
            </button>
          )}
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          style={{
            padding: '14px 20px',
            marginBottom: '24px',
            borderRadius: '12px',
            backgroundColor: feedback.type === 'success' ? '#dcfce7' : '#fee2e2',
            color: feedback.type === 'success' ? '#166534' : '#991b1b',
            border: `1px solid ${feedback.type === 'success' ? '#86efac' : '#fca5a5'}`,
            fontSize: '14px',
            fontWeight: 600,
          }}
        >
          {feedback.message}
        </div>
      )}

      {/* Grid Informasi & Status */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {/* Card Info Pemesan */}
        <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #ebdccb', boxShadow: '0 4px 12px rgba(44,24,16,0.05)' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 700, color: '#2c1810', borderBottom: '1px solid #f0e6dc', paddingBottom: '8px' }}>
            Informasi Pemesan
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#666' }}>Nama Pelanggan</span>
              <strong style={{ color: '#2c1810' }}>{customer}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#666' }}>Nomor Telepon</span>
              <span style={{ color: '#333' }}>{phone}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#666' }}>Meja / Lokasi</span>
              <strong style={{ color: '#844c1c' }}>{tableNo}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#666' }}>Tipe Pemesanan</span>
              <span style={{ textTransform: 'capitalize' }}>{orderType.replace('_', ' ')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#666' }}>Waktu Order</span>
              <span>{createdAt ? new Date(createdAt).toLocaleString('id-ID') : '-'}</span>
            </div>
          </div>
        </div>

        {/* Card Info Status & Pembayaran */}
        <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #ebdccb', boxShadow: '0 4px 12px rgba(44,24,16,0.05)' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 700, color: '#2c1810', borderBottom: '1px solid #f0e6dc', paddingBottom: '8px' }}>
            Status &amp; Pembayaran
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#666' }}>Status Pesanan</span>
              <StatusBadge status={status} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#666' }}>Metode Pembayaran</span>
              <strong>{paymentMethod}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#666' }}>Status Bayar</span>
              <span style={{ color: '#16a34a', fontWeight: 600 }}>{paymentStatus}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#666' }}>Waktu Konfirmasi</span>
              <span>{confirmedAt ? new Date(confirmedAt).toLocaleString('id-ID') : '(Belum dikonfirmasi)'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabel Item Pesanan */}
      <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #ebdccb', boxShadow: '0 4px 12px rgba(44,24,16,0.05)', marginBottom: '24px' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 700, color: '#2c1810', borderBottom: '1px solid #f0e6dc', paddingBottom: '8px' }}>
          Item Pesanan ({items.length})
        </h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e6ded5', color: '#665c54', textAlign: 'left' }}>
              <th style={{ padding: '10px 12px' }}>Menu</th>
              <th style={{ padding: '10px 12px', textAlign: 'center' }}>Qty</th>
              <th style={{ padding: '10px 12px', textAlign: 'right' }}>Harga Satuan</th>
              <th style={{ padding: '10px 12px', textAlign: 'right' }}>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it: any, idx: number) => {
              const name = it.item_name || it.menuItemName || it.nama_menu || 'Menu';
              const qty = it.quantity || it.jumlah || 1;
              const price = it.price ?? it.harga_satuan ?? 0;
              const sub = it.subtotal ?? (price * qty);
              const note = it.notes || it.catatan;

              return (
                <tr key={it.id || idx} style={{ borderBottom: '1px solid #f0e6dc' }}>
                  <td style={{ padding: '12px' }}>
                    <div style={{ fontWeight: 600, color: '#2c1810' }}>{name}</div>
                    {note && (
                      <div style={{ fontSize: '12px', color: '#888', fontStyle: 'italic', marginTop: '2px' }}>
                        Catatan: "{note}"
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center', fontWeight: 700 }}>
                    {qty}x
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', color: '#555' }}>
                    <RupiahText amount={price} />
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', fontWeight: 700, color: '#2c1810' }}>
                    <RupiahText amount={sub} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Ringkasan Biaya */}
      <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #ebdccb', boxShadow: '0 4px 12px rgba(44,24,16,0.05)' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 700, color: '#2c1810', borderBottom: '1px solid #f0e6dc', paddingBottom: '8px' }}>
          Ringkasan Transaksi
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px', maxWidth: '420px', marginLeft: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#666' }}>Subtotal Menu</span>
            <span><RupiahText amount={subtotal} /></span>
          </div>
          {discount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a' }}>
              <span>Diskon Promo</span>
              <span>- <RupiahText amount={discount} /></span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#666' }}>Pajak Restoran (10%)</span>
            <span><RupiahText amount={tax} /></span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#666' }}>Biaya Layanan (5%)</span>
            <span><RupiahText amount={service} /></span>
          </div>
          <div style={{ borderTop: '2px solid #2c1810', paddingTop: '12px', marginTop: '4px', display: 'flex', justifyContent: 'space-between', fontSize: '17px', fontWeight: 800, color: '#2c1810' }}>
            <span>Total Bayar</span>
            <span><RupiahText amount={total} /></span>
          </div>
        </div>
      </div>
    </div>
  );
}
