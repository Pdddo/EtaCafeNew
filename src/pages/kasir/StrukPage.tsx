// HALAMAN : StrukPage (Kasir)
// PERAN   : Menampilkan dan mencetak struk transaksi resmi Kasir
//           Diadaptasi 100% dari format struk KOT Dapur (AntrianPage.tsx) untuk konsistensi visual dan fungsionalitas

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { KasirAPI } from '../../api/client';
import Loading from '../../components/common/Loading';
import type { Order } from '../../types';

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

export default function StrukPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  const loadOrder = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setErrorNotice(null);

    try {
      // 1. Coba ambil struk resmi dari backend
      const receiptData = await KasirAPI.getReceipt(id);
      if (receiptData) {
        setOrder(receiptData);
        return;
      }
    } catch {
      // Jika receipt endpoint gagal (misal jika struk belum siap atau backend beda format),
      // coba ambil detail pesanan langsung
      try {
        const orderData = await KasirAPI.getOrderDetail(id);
        if (orderData) {
          setOrder(orderData);
          return;
        }
      } catch (err: any) {
        console.warn('Gagal memuat detail pesanan untuk struk:', err);
      }
      setErrorNotice(
        'Struk belum dapat dicetak karena pesanan belum dikonfirmasi oleh Kasir (Aturan Bisnis BR-08).'
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  if (loading) {
    return (
      <div style={{ padding: '80px 0', textAlign: 'center' }}>
        <Loading />
        <p style={{ marginTop: '16px', color: '#666' }}>Menyiapkan struk transaksi...</p>
      </div>
    );
  }

  // Jika pesanan belum dikonfirmasi (BR-08)
  if (errorNotice || !order) {
    return (
      <div
        style={{
          maxWidth: '500px',
          margin: '40px auto',
          background: '#ffffff',
          borderRadius: '20px',
          padding: '36px',
          border: '1px solid #ebdccb',
          boxShadow: '0 8px 24px rgba(44, 24, 16, 0.08)',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#2c1810', margin: '0 0 12px 0' }}>
          Struk Belum Dapat Dicetak
        </h2>
        <p style={{ color: '#665c54', fontSize: '14px', lineHeight: 1.6, marginBottom: '24px' }}>
          {errorNotice || 'Pesanan ini belum dikonfirmasi oleh Kasir (BR-08). Silakan konfirmasi pesanan terlebih dahulu sebelum mencetak bukti transaksi.'}
        </p>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button
            type="button"
            className="kasir-order-btn primary"
            onClick={() => navigate(`/kasir/orders/${id}`)}
          >
            Konfirmasi Pesanan
          </button>
          <button
            type="button"
            className="kasir-order-btn"
            onClick={() => navigate('/kasir/orders')}
          >
            Kembali
          </button>
        </div>
      </div>
    );
  }

  // Ekstraksi data kompatibel dengan format Dapur & backend
  const orderNumber = order.no_pesanan || order.orderNumber || order.order_number || `#${id}`;
  const tableNumber = order.meja || order.tableNumber || order.table_number;
  const customerName = order.pelanggan || order.customerName || order.customer_name || 'Umum';
  const createdAt = order.waktu_pesan || order.createdAt || order.created_at;
  const confirmedAt = order.waktu_konfirmasi || order.confirmedAt || order.confirmed_at;
  const status = order.status_pesanan || order.status || 'Dikonfirmasi';

  const rawItems = order.items || [];
  const items = rawItems.map((it: any, idx: number) => ({
    name: it.nama_menu || it.item_name || it.menuItemName || it.name || `Item ${idx + 1}`,
    quantity: it.jumlah || it.quantity || 1,
    price: it.harga_satuan ?? it.price ?? 0,
    subtotal: it.subtotal ?? ((it.harga_satuan ?? it.price ?? 0) * (it.jumlah || it.quantity || 1)),
    notes: it.catatan || it.notes,
  }));

  const subtotal = order.subtotal ?? items.reduce((acc: number, curr: any) => acc + curr.subtotal, 0);
  const discount = order.diskon || order.discount_amount || order.discountAmount || 0;
  const tax = order.pajak_10_persen || order.tax_amount || order.taxAmount || 0;
  const service = order.biaya_layanan_5_persen || order.service_fee || order.serviceFee || 0;
  const total = order.total_bayar || order.total_amount || order.totalAmount || (subtotal - discount + tax + service);

  const paymentMethod = order.metode_pembayaran || order.paymentMethod || order.payment_method || 'QRIS';
  const paymentStatus = order.status_pembayaran || order.paymentStatus || order.payment_status || 'Berhasil';

  return (
    <div className="kasir-receipt-container">
      {/* Kartu Struk Thermal (Sama Persis dengan Format Dapur) */}
      <div className="kasir-receipt-card">
        {/* Header Struk */}
        <div className="kasir-receipt-header">
          <h2 className="kasir-receipt-shop-name">Coffee Shop</h2>
          <div className="kasir-receipt-subtitle">one Stop | one Heart | one Cup</div>
          <div className="kasir-receipt-badge">
            BUKTI TRANSAKSI PEMBAYARAN KASIR
          </div>
        </div>

        {/* Metadata Transaksi */}
        <div className="kasir-receipt-meta">
          <div>
            <strong>No. Pesanan:</strong> {orderNumber}
          </div>
          <div>
            <strong>Meja:</strong> {tableNumber ? (tableNumber.toString().toLowerCase().includes('meja') ? tableNumber : `Meja ${tableNumber}`) : 'Take Away / Langsung'}
          </div>
          <div>
            <strong>Pelanggan:</strong> {customerName}
          </div>
          <div>
            <strong>Waktu Pesan:</strong> {createdAt ? new Date(createdAt).toLocaleString('id-ID') : '-'}
          </div>
          {confirmedAt && (
            <div>
              <strong>Waktu Konfirmasi:</strong> {new Date(confirmedAt).toLocaleString('id-ID')}
            </div>
          )}
          <div>
            <strong>Status:</strong>{' '}
            <span style={{ textTransform: 'uppercase', fontWeight: 'bold', color: '#166534' }}>
              {status}
            </span>
          </div>
        </div>

        {/* Rincian Item Pesanan */}
        <div className="kasir-receipt-items">
          <div style={{ fontWeight: 700, marginBottom: '8px', fontSize: '13px', color: '#2c1810' }}>
            RINCIAN PESANAN:
          </div>
          {items.length > 0 ? (
            items.map((item: any, idx: number) => (
              <div key={idx} style={{ marginBottom: '6px' }}>
                <div className="kasir-receipt-item-row">
                  <span>
                    {item.quantity}x {item.name}
                  </span>
                  <span>{formatRupiah(item.subtotal)}</span>
                </div>
                {item.notes && (
                  <div style={{ fontSize: '11px', color: '#666', fontStyle: 'italic', paddingLeft: '14px' }}>
                    * Catatan: {item.notes}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="kasir-receipt-item-row">
              <span>1x Pesanan</span>
              <span>{formatRupiah(total)}</span>
            </div>
          )}
        </div>

        {/* Rincian Biaya */}
        <div className="kasir-receipt-totals">
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
            <span>Subtotal:</span>
            <span>{formatRupiah(subtotal)}</span>
          </div>

          {discount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#16a34a' }}>
              <span>Diskon Promo:</span>
              <span>- {formatRupiah(discount)}</span>
            </div>
          )}

          {tax > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span>Pajak Resto (10%):</span>
              <span>{formatRupiah(tax)}</span>
            </div>
          )}

          {service > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span>Biaya Layanan (5%):</span>
              <span>{formatRupiah(service)}</span>
            </div>
          )}

          <div className="kasir-receipt-total-main">
            <span>TOTAL BAYAR:</span>
            <span>{formatRupiah(total)}</span>
          </div>

          <div style={{ fontSize: '12px', marginTop: '6px', color: '#555' }}>
            Metode Bayar: <strong>{paymentMethod}</strong> ({paymentStatus})
          </div>
        </div>

        {/* Tombol Aksi */}
        <div className="kasir-receipt-actions no-print">
          <button
            type="button"
            className="kasir-receipt-btn-back"
            onClick={() => navigate('/kasir/dashboard')}
          >
            ← Kembali ke Kasir
          </button>
          <button
            type="button"
            className="kasir-receipt-btn-print"
            onClick={() => window.print()}
          >
            🖨️ Cetak Struk
          </button>
        </div>
      </div>
    </div>
  );
}
