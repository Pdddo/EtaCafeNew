// ============================================================
// HALAMAN : AntrianPage (Kitchen Display System - Role Dapur)
// PERAN   : Dapur
// REF SRS : FR-19, FR-22, FR-23, FR-24, FR-25, BR-09, BR-10
// DESAIN  : Sesuai 3 Desain Figma (Dikonfirmasi, Proses, Selesai)
// ============================================================

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { DapurAPI } from '../../api/dapur';
import { useAuth } from '../../context/AuthContext';
import type { Order } from '../../types';
import './AntrianPage.css';

// ---- Type Tab Aktif ----
type DapurTab = 'dikonfirmasi' | 'proses' | 'selesai';

const COMPLETED_STORAGE_KEY = 'etacafe_dapur_completed_orders';

// ---- Format Currency Rupiah ----
function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

// ---- Format Jam (Lokal) ----
function formatTime(isoString?: string | null): string {
  if (!isoString) return '-';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '-';
  }
}

// ---- Ekstraksi Tanggal Lokal (YYYY-MM-DD) Sesuai Zona Waktu Browser ----
function getLocalDateString(dateInput?: string | Date | null): string {
  if (!dateInput) return '';
  try {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch {
    return '';
  }
}

function getTodayString(): string {
  return getLocalDateString(new Date());
}

// ---- Normalisasi Objek Pesanan (Menangani snake_case Backend & camelCase) ----
function normalizeOrder(o: any): Order {
  const items = Array.isArray(o.items)
    ? o.items.map((it: any, idx: number) => ({
        id: String(it.id ?? idx),
        menuItemId: String(it.menuItemId || it.menu_item_id || idx),
        menuItemName: it.menuItemName || it.item_name || it.name || 'Item Menu',
        price: Number(it.price || 0),
        quantity: Number(it.quantity || 1),
        notes: it.notes || '',
        subtotal: Number(it.subtotal || (Number(it.price || 0) * Number(it.quantity || 1))),
      }))
    : [];

  return {
    ...o,
    id: String(o.id),
    orderNumber: o.orderNumber || o.order_number || `ORD-${o.id}`,
    customerName: o.customerName || o.customer_name || 'Pelanggan',
    customerPhone: o.customerPhone || o.customer_phone || '',
    orderType: o.orderType || o.order_type || 'langsung',
    tableNumber: o.tableNumber ?? o.table_number ?? null,
    items,
    subtotal: Number(o.subtotal || o.totalAmount || o.total_amount || 0),
    discountAmount: Number(o.discountAmount || o.discount_amount || 0),
    taxAmount: Number(o.taxAmount || o.tax_amount || 0),
    serviceFee: Number(o.serviceFee || o.service_fee || 0),
    totalAmount: Number(o.totalAmount || o.total_amount || o.subtotal || 0),
    paymentMethod: o.paymentMethod || o.payment_method || 'QRIS',
    paymentStatus: o.paymentStatus || o.payment_status || 'Berhasil',
    status: o.status || 'Dikonfirmasi',
    createdAt: o.createdAt || o.created_at || new Date().toISOString(),
    confirmedAt: o.confirmedAt || o.confirmed_at || null,
    processingAt: o.processingAt || o.processing_at || null,
    completedAt: o.completedAt || o.completed_at || null,
    cancelledAt: o.cancelledAt || o.cancelled_at || null,
  };
}

export default function AntrianPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  // Tab aktif: 'dikonfirmasi' | 'proses' | 'selesai'
  const [activeTab, setActiveTab] = useState<DapurTab>('dikonfirmasi');

  // State Semua Pesanan (Real Data dari Backend)
  const [orders, setOrders] = useState<Order[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [filterDate, setFilterDate] = useState<string>(getTodayString());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal Struk
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Sinkronisasi Tab dengan Path URL
  useEffect(() => {
    if (location.pathname.includes('proses') || location.pathname.includes('antrian-pesanan')) {
      setActiveTab('proses');
    } else if (location.pathname.includes('selesai')) {
      setActiveTab('selesai');
    }
  }, [location.pathname]);

  // ---- Fetch Pesanan Real dari Backend ----
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const [queueData, completedData] = await Promise.allSettled([
        DapurAPI.getKitchenQueue(),
        DapurAPI.getCompletedOrdersToday(filterDate),
      ]);

      const queueList =
        queueData.status === 'fulfilled' && Array.isArray(queueData.value)
          ? queueData.value.map(normalizeOrder)
          : [];

      const completedList =
        completedData.status === 'fulfilled' && Array.isArray(completedData.value)
          ? completedData.value.map(normalizeOrder)
          : [];

      const orderMap = new Map<string, Order>();
      queueList.forEach((o) => orderMap.set(String(o.id), o));
      completedList.forEach((o) => orderMap.set(String(o.id), o));

      setOrders(Array.from(orderMap.values()));
    } catch (err) {
      console.error('[Dapur] Gagal memuat pesanan:', err);
    } finally {
      setLoading(false);
    }
  }, [filterDate]);

  // Polling berkala setiap 7 detik
  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 7000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  // ---- Filter Pesanan Berdasarkan Tab Aktif & Tanggal Selesai ----
  const filteredOrders = useMemo(() => {
    if (activeTab === 'dikonfirmasi') {
      return orders.filter((o) => {
        const s = (o.status || '').toLowerCase();
        return s === 'dikonfirmasi' || s === 'menunggu proses';
      });
    }

    if (activeTab === 'proses') {
      return orders.filter((o) => {
        const s = (o.status || '').toLowerCase();
        return s.includes('proses') || s === 'sedang diproses';
      });
    }

    if (activeTab === 'selesai') {
      return orders.filter((o) => {
        const s = (o.status || '').toLowerCase();
        if (!s.includes('selesai')) return false;

        if (filterDate) {
          const orderDate = getLocalDateString(
            (o as any).completed_at || o.completedAt || (o as any).created_at || o.createdAt
          );
          return orderDate === filterDate;
        }
        return true;
      });
    }

    return [];
  }, [orders, activeTab, filterDate]);

  // ---- Handler: Mulai Proses Pesanan (Dikonfirmasi -> Proses) ----
  const handleStartProcessing = async (order: Order) => {
    try {
      await DapurAPI.startProcessing(order.id);
      showToast(`Pesanan #${order.orderNumber} (Meja ${order.tableNumber || '-'}) mulai diproses!`);
      setActiveTab('proses');
      await fetchOrders();
    } catch (err: any) {
      alert(`Gagal memproses pesanan: ${err?.message || 'Terjadi kesalahan'}`);
    }
  };

  // ---- Handler: Selesaikan Pesanan (Proses -> Selesai) ----
  const handleCompleteOrder = async (order: Order) => {
    try {
      await DapurAPI.completeOrder(order.id);
      showToast(`Pesanan #${order.orderNumber} (Meja ${order.tableNumber || '-'}) telah SELESAI siap disajikan!`);
      setActiveTab('selesai');
      await fetchOrders();
    } catch (err: any) {
      alert(`Gagal menyelesaikan pesanan: ${err?.message || 'Terjadi kesalahan'}`);
    }
  };

  // ---- Handler Logout ----
  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  // ---- Hitung Jumlah Antrean Tiap Tab ----
  const dikonfirmasiCount = useMemo(
    () => orders.filter((o) => o.status === 'Dikonfirmasi').length,
    [orders]
  );
  const prosesCount = useMemo(
    () =>
      orders.filter(
        (o) => o.status === 'Sedang Diproses' || o.status === 'Diproses'
      ).length,
    [orders]
  );
  const selesaiCount = useMemo(
    () => orders.filter((o) => o.status === 'Selesai').length,
    [orders]
  );

  return (
    <div style={{ paddingBottom: '40px' }}>
      {/* 1. HEADER HALAMAN (Selaras dengan Kasir & Manajer) */}
      <div className="dapur-page-header">
        <div>
          <h1 className="dapur-page-title">Antrean Pesanan Dapur (KDS)</h1>
          <p className="dapur-page-subtitle">
            Kitchen Display System • Kelola antrean pesanan masuk, proses hidangan, dan sajian
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="dapur-btn dapur-btn-secondary"
            onClick={fetchOrders}
            title="Perbarui Pesanan"
          >
            🔄 Refresh Antrean
          </button>
          <button
            type="button"
            className="dapur-btn dapur-btn-primary"
            onClick={() => navigate('/dapur/dashboard')}
          >
            📊 Kembali ke Dashboard
          </button>
        </div>
      </div>

      {/* 2. SUBNAV / TABS STATUS UTAMA (Konsisten dengan Kasir & Manajer) */}
      <div className="dapur-subnav">
        <button
          type="button"
          className={`dapur-subnav-pill ${activeTab === 'dikonfirmasi' ? 'active' : ''}`}
          onClick={() => setActiveTab('dikonfirmasi')}
        >
          🛎️ Siap Dimasak <span className="badge">{dikonfirmasiCount}</span>
        </button>

        <button
          type="button"
          className={`dapur-subnav-pill ${activeTab === 'proses' ? 'active' : ''}`}
          onClick={() => setActiveTab('proses')}
        >
          🍳 Sedang Diproses <span className="badge">{prosesCount}</span>
        </button>

        <button
          type="button"
          className={`dapur-subnav-pill ${activeTab === 'selesai' ? 'active' : ''}`}
          onClick={() => setActiveTab('selesai')}
        >
          ✅ Selesai Disajikan <span className="badge">{selesaiCount}</span>
        </button>
      </div>

      {/* 3. FILTER TANGGAL (Hanya Tampil di Tab "Selesai") */}
      {activeTab === 'selesai' && (
        <div className="dapur-date-filter-bar" style={{ marginBottom: '20px' }}>
          <div className="dapur-date-filter-label">
            📅 Riwayat Pesanan Selesai:
            {filterDate ? (
              <span style={{ fontWeight: 400, marginLeft: '6px', color: '#7b4a1e' }}>
                ({filterDate === getTodayString() ? 'Hari Ini' : filterDate})
              </span>
            ) : (
              <span style={{ fontWeight: 400, marginLeft: '6px', color: '#7b4a1e' }}>
                (Semua Tanggal)
              </span>
            )}
          </div>
          <div className="dapur-date-filter-controls">
            <input
              type="date"
              className="dapur-date-input"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              title="Pilih tanggal pesanan selesai"
            />
            <button
              type="button"
              className="dapur-date-btn-today"
              onClick={() => setFilterDate(getTodayString())}
              style={{
                backgroundColor: filterDate === getTodayString() ? '#844c1c' : '#ebdccb',
                color: filterDate === getTodayString() ? '#ffffff' : '#2c1810',
              }}
            >
              Hari Ini
            </button>
            <button
              type="button"
              className="dapur-date-btn-today"
              onClick={() => setFilterDate('')}
              style={{
                backgroundColor: filterDate === '' ? '#844c1c' : '#ebdccb',
                color: filterDate === '' ? '#ffffff' : '#2c1810',
              }}
            >
              Semua Tanggal
            </button>
          </div>
        </div>
      )}

      {/* 4. MAIN CONTENT AREA */}
      <main className="dapur-main-content">
        {/* Notifikasi Toast */}
        {toastMessage && (
          <div className="dapur-toast">
            <span>✨ {toastMessage}</span>
            <button
              onClick={() => setToastMessage(null)}
              style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && orders.length === 0 && (
          <div className="dapur-empty-state">
            <div className="dapur-empty-icon">⏳</div>
            <div className="dapur-empty-title">Memuat Antrian Dapur...</div>
          </div>
        )}

        {/* Empty State jika tidak ada pesanan di tab ini */}
        {!loading && filteredOrders.length === 0 && (
          <div className="dapur-empty-state">
            <div className="dapur-empty-icon">
              {activeTab === 'dikonfirmasi' ? '🛎️' : activeTab === 'proses' ? '🍳' : '✅'}
            </div>
            <div className="dapur-empty-title">
              {activeTab === 'dikonfirmasi'
                ? 'Tidak ada pesanan menunggu konfirmasi kasir'
                : activeTab === 'proses'
                ? 'Tidak ada pesanan yang sedang dimasak'
                : filterDate
                ? `Tidak ada pesanan selesai pada tanggal ${filterDate}`
                : 'Belum ada pesanan yang diselesaikan'}
            </div>
            <div className="dapur-empty-subtitle">
              {activeTab === 'dikonfirmasi'
                ? 'Pesanan yang telah dikonfirmasi oleh Kasir akan otomatis muncul di sini.'
                : activeTab === 'proses'
                ? 'Klik tombol "Proses" pada pesanan di tab Dikonfirmasi untuk mulai memasak.'
                : filterDate
                ? 'Klik tombol "Semua Tanggal" di atas untuk melihat seluruh riwayat pesanan selesai.'
                : 'Pesanan yang telah diselesaikan akan otomatis tersimpan di sini.'}
            </div>
          </div>
        )}

        {/* DAFTAR KARTU PESANAN (FIGMA EXACT DESIGN) */}
        {filteredOrders.map((order) => {
          const totalAmount = order.totalAmount ?? order.subtotal ?? 0;
          const displayTable = order.tableNumber ? `Meja ${order.tableNumber}` : 'Take Away';

          return (
            <div key={order.id} className="dapur-card">
              {/* SISI KIRI: Kotak Meja (Figma: Meja 2, Meja 4, Meja 5) */}
              <div className="dapur-card-left-box">
                <span className="dapur-card-table-text">{displayTable}</span>
                <span className="dapur-card-order-type">
                  {order.orderType === 'qr_meja' ? 'QR Table' : 'Dine In / Kasir'}
                </span>
                <span className="dapur-card-time">
                  🕒 {formatTime((order as any).completed_at || order.completedAt || (order as any).confirmed_at || order.confirmedAt || order.createdAt)}
                </span>
              </div>

              {/* SISI KANAN: Detail Pesanan */}
              <div className="dapur-card-right-content">
                <div>
                  <h3 className="dapur-card-title">Detail Pesanan</h3>

                  {/* List Item */}
                  <div className="dapur-card-items-list">
                    {order.items && order.items.length > 0 ? (
                      order.items.map((item: any, idx: number) => (
                        <div key={item.id ?? idx}>
                          <div className="dapur-card-item-row">
                            <span className="dapur-card-item-name">
                              {item.quantity}x {item.menuItemName ?? item.item_name ?? item.name ?? 'Item Menu'}
                            </span>
                            <span className="dapur-card-item-price">
                              {formatRupiah(item.price ?? 0)}
                            </span>
                          </div>
                          {item.notes && (
                            <div className="dapur-card-item-notes">
                              Catatan: {item.notes}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="dapur-card-item-row">
                        <span className="dapur-card-item-name">1x Pesanan Menu</span>
                        <span className="dapur-card-item-price">{formatRupiah(totalAmount)}</span>
                      </div>
                    )}
                  </div>

                  {/* Baris Total */}
                  <div className="dapur-card-total-row">
                    <span>Total</span>
                    <span>{formatRupiah(totalAmount)}</span>
                  </div>
                </div>

                {/* TOMBOL AKSI SESUAI STATE FIGMA */}
                <div className="dapur-card-actions">
                  {/* Tab Dikonfirmasi: Tombol "Proses" & "Lihat Struk" */}
                  {activeTab === 'dikonfirmasi' && (
                    <>
                      <button
                        type="button"
                        className="dapur-btn-action btn-primary-action"
                        onClick={() => handleStartProcessing(order)}
                      >
                        Proses
                      </button>
                      <button
                        type="button"
                        className="dapur-btn-action"
                        onClick={() => setReceiptOrder(order)}
                      >
                        Lihat Struk
                      </button>
                    </>
                  )}

                  {/* Tab Proses: Tombol "Selesai" & "Lihat Struk" */}
                  {activeTab === 'proses' && (
                    <>
                      <button
                        type="button"
                        className="dapur-btn-action btn-primary-action"
                        onClick={() => handleCompleteOrder(order)}
                      >
                        Selesai
                      </button>
                      <button
                        type="button"
                        className="dapur-btn-action"
                        onClick={() => setReceiptOrder(order)}
                      >
                        Lihat Struk
                      </button>
                    </>
                  )}

                  {/* Tab Selesai: Hanya Tombol "Lihat Struk" */}
                  {activeTab === 'selesai' && (
                    <button
                      type="button"
                      className="dapur-btn-action"
                      onClick={() => setReceiptOrder(order)}
                    >
                      Lihat Struk
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </main>



      {/* 6. MODAL STRUK PESANAN (POPUP LIHAT STRUK) */}
      {receiptOrder && (
        <div className="dapur-modal-backdrop" onClick={() => setReceiptOrder(null)}>
          <div className="dapur-receipt-card" onClick={(e) => e.stopPropagation()}>
            <div className="dapur-receipt-header">
              <h2 className="dapur-receipt-shop-name">Coffee Shop</h2>
              <div className="dapur-receipt-subtitle">one Stop | one Heart | one Cup</div>
              <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>
                KITCHEN ORDER TICKET (KOT)
              </div>
            </div>

            <div className="dapur-receipt-meta">
              <div><strong>No. Pesanan:</strong> #{receiptOrder.orderNumber}</div>
              <div><strong>Meja:</strong> {receiptOrder.tableNumber ? `Meja ${receiptOrder.tableNumber}` : 'Take Away'}</div>
              <div><strong>Pelanggan:</strong> {receiptOrder.customerName || 'Umum'}</div>
              <div><strong>Waktu:</strong> {new Date(receiptOrder.createdAt).toLocaleString('id-ID')}</div>
              <div><strong>Status:</strong> <span style={{ textTransform: 'uppercase', fontWeight: 'bold' }}>{receiptOrder.status}</span></div>
            </div>

            <div className="dapur-receipt-items">
              <div style={{ fontWeight: 700, marginBottom: '8px', fontSize: '13px' }}>
                RINCIAN PESANAN:
              </div>
              {receiptOrder.items && receiptOrder.items.length > 0 ? (
                receiptOrder.items.map((item: any, idx: number) => (
                  <div key={idx} style={{ marginBottom: '6px' }}>
                    <div className="dapur-receipt-item-row">
                      <span>{item.quantity}x {item.menuItemName ?? item.item_name ?? item.name}</span>
                      <span>{formatRupiah(item.subtotal ?? (item.price * item.quantity))}</span>
                    </div>
                    {item.notes && (
                      <div style={{ fontSize: '11px', color: '#666', fontStyle: 'italic', paddingLeft: '14px' }}>
                        * Catatan: {item.notes}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="dapur-receipt-item-row">
                  <span>1x Pesanan</span>
                  <span>{formatRupiah(receiptOrder.totalAmount)}</span>
                </div>
              )}
            </div>

            <div className="dapur-receipt-totals">
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span>Subtotal:</span>
                <span>{formatRupiah(receiptOrder.subtotal ?? receiptOrder.totalAmount)}</span>
              </div>
              {receiptOrder.taxAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span>Pajak (10%):</span>
                  <span>{formatRupiah(receiptOrder.taxAmount)}</span>
                </div>
              )}
              {receiptOrder.serviceFee > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span>Service (5%):</span>
                  <span>{formatRupiah(receiptOrder.serviceFee)}</span>
                </div>
              )}
              <div className="dapur-receipt-total-main">
                <span>TOTAL:</span>
                <span>{formatRupiah(receiptOrder.totalAmount)}</span>
              </div>
              <div style={{ fontSize: '12px', marginTop: '4px', color: '#555' }}>
                Metode Bayar: {receiptOrder.paymentMethod} ({receiptOrder.paymentStatus})
              </div>
            </div>

            <div className="dapur-receipt-actions">
              <button
                type="button"
                className="dapur-receipt-btn-close"
                onClick={() => setReceiptOrder(null)}
              >
                Tutup
              </button>
              <button
                type="button"
                className="dapur-receipt-btn-print"
                onClick={() => window.print()}
              >
                🖨️ Cetak Struk
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
