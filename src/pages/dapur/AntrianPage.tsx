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

// ---- Data Mock Realistis Awal ----
const INITIAL_MOCK_ORDERS: Order[] = [
  {
    id: '101',
    orderNumber: 'ORD-2026-001',
    customerName: 'Ahmad Faisal',
    orderType: 'qr_meja',
    tableNumber: '2',
    items: [
      { id: '1', menuItemId: '1', menuItemName: 'Iced Coffee Sweet Heaven', price: 24000, quantity: 1, subtotal: 24000, notes: 'Sedotan kertas' },
      { id: '2', menuItemId: '2', menuItemName: 'Iced Coffee Americano', price: 25000, quantity: 1, subtotal: 25000, notes: 'Less sugar' },
    ],
    subtotal: 49000,
    discountAmount: 0,
    taxAmount: 4900,
    serviceFee: 2450,
    totalAmount: 49000,
    paymentMethod: 'QRIS',
    paymentStatus: 'Berhasil',
    status: 'Dikonfirmasi',
    createdAt: new Date().toISOString(),
    confirmedAt: new Date().toISOString(),
  },
  {
    id: '102',
    orderNumber: 'ORD-2026-002',
    customerName: 'Nurhaliza',
    orderType: 'qr_meja',
    tableNumber: '4',
    items: [
      { id: '3', menuItemId: '1', menuItemName: 'Iced Coffee Sweet Heaven', price: 24000, quantity: 1, subtotal: 24000, notes: '' },
      { id: '4', menuItemId: '2', menuItemName: 'Iced Coffee Americano', price: 25000, quantity: 1, subtotal: 25000, notes: 'Extra ice' },
    ],
    subtotal: 49000,
    discountAmount: 0,
    taxAmount: 4900,
    serviceFee: 2450,
    totalAmount: 49000,
    paymentMethod: 'Tunai',
    paymentStatus: 'Berhasil',
    status: 'Sedang Diproses',
    createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
    confirmedAt: new Date(Date.now() - 12 * 60000).toISOString(),
    processingAt: new Date(Date.now() - 5 * 60000).toISOString(),
  },
  {
    id: '103',
    orderNumber: 'ORD-2026-003',
    customerName: 'Dimas Pratama',
    orderType: 'qr_meja',
    tableNumber: '5',
    items: [
      { id: '5', menuItemId: '1', menuItemName: 'Iced Coffee Sweet Heaven', price: 24000, quantity: 1, subtotal: 24000, notes: '' },
      { id: '6', menuItemId: '2', menuItemName: 'Iced Coffee Americano', price: 25000, quantity: 1, subtotal: 25000, notes: '' },
    ],
    subtotal: 49000,
    discountAmount: 0,
    taxAmount: 4900,
    serviceFee: 2450,
    totalAmount: 49000,
    paymentMethod: 'Kartu Debit',
    paymentStatus: 'Berhasil',
    status: 'Selesai',
    createdAt: new Date(Date.now() - 30 * 60000).toISOString(),
    confirmedAt: new Date(Date.now() - 25 * 60000).toISOString(),
    processingAt: new Date(Date.now() - 20 * 60000).toISOString(),
    completedAt: new Date().toISOString(), // Selesai hari ini
  },
];

export default function AntrianPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  // Tab aktif: 'dikonfirmasi' | 'proses' | 'selesai'
  const [activeTab, setActiveTab] = useState<DapurTab>('dikonfirmasi');

  // State Semua Pesanan
  const [orders, setOrders] = useState<Order[]>(() => {
    // Muat pesanan tersimpan di localStorage (jika ada)
    try {
      const saved = localStorage.getItem(COMPLETED_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const map = new Map<string, Order>();
          INITIAL_MOCK_ORDERS.forEach((o) => map.set(String(o.id), normalizeOrder(o)));
          parsed.forEach((o) => map.set(String(o.id), normalizeOrder(o)));
          return Array.from(map.values());
        }
      }
    } catch {
      // Abaikan
    }
    return INITIAL_MOCK_ORDERS.map(normalizeOrder);
  });

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

  // Simpan Pesanan Selesai ke LocalStorage agar tidak hilang
  const persistCompletedOrders = useCallback((allOrders: Order[]) => {
    try {
      const completedOnly = allOrders.filter((o) =>
        (o.status || '').toLowerCase().includes('selesai')
      );
      localStorage.setItem(COMPLETED_STORAGE_KEY, JSON.stringify(completedOnly));
    } catch {
      // Abaikan
    }
  }, []);

  // ---- Fetch Pesanan dari Backend ----
  const fetchOrders = useCallback(async () => {
    try {
      const [queueData, completedData] = await Promise.allSettled([
        DapurAPI.getKitchenQueue(),
        DapurAPI.getCompletedOrdersToday(filterDate),
      ]);

      const queueList = queueData.status === 'fulfilled' && Array.isArray(queueData.value)
        ? queueData.value.map(normalizeOrder)
        : [];

      const completedList = completedData.status === 'fulfilled' && Array.isArray(completedData.value)
        ? completedData.value.map(normalizeOrder)
        : [];

      if (queueList.length > 0 || completedList.length > 0) {
        setOrders((prev) => {
          const orderMap = new Map<string, Order>();

          // Masukkan data sebelumnya yang sudah tersimpan
          prev.forEach((o) => orderMap.set(String(o.id), o));

          // Timpa dengan data terbaru dari backend
          queueList.forEach((o) => orderMap.set(String(o.id), o));
          completedList.forEach((o) => orderMap.set(String(o.id), o));

          const merged = Array.from(orderMap.values());
          persistCompletedOrders(merged);
          return merged;
        });
      }
    } catch (err) {
      console.warn('[Dapur] Menggunakan data lokal (backend offline / data sinkron)');
    } finally {
      setLoading(false);
    }
  }, [filterDate, persistCompletedOrders]);

  // Polling berkala setiap 7 detik
  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 7000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  // ---- Filter Pesanan Berdasarkan Tab Aktif & Tanggal ----
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

        // Jika filterDate ada (misal "2026-11-05"), cocokkan tanggal lokal
        if (filterDate) {
          const orderDate = getLocalDateString(
            (o as any).completed_at || o.completedAt || (o as any).created_at || o.createdAt
          );
          return orderDate === filterDate;
        }
        // Jika filterDate kosong, tampilkan semua pesanan selesai
        return true;
      });
    }

    return [];
  }, [orders, activeTab, filterDate]);

  // ---- Handler: Mulai Proses Pesanan (Dikonfirmasi -> Proses) ----
  const handleStartProcessing = async (order: Order) => {
    try {
      await DapurAPI.startProcessing(order.id);
    } catch {
      console.warn('[Dapur] startProcessing backend fallback to client-state');
    }

    const updated = orders.map((o) =>
      String(o.id) === String(order.id)
        ? {
            ...o,
            status: 'Sedang Diproses',
            processingAt: new Date().toISOString(),
          }
        : o
    );
    setOrders(updated);
    persistCompletedOrders(updated);

    showToast(`Pesanan #${order.orderNumber} (Meja ${order.tableNumber || '-'}) mulai diproses!`);
    setActiveTab('proses');
  };

  // ---- Handler: Selesaikan Pesanan (Proses -> Selesai) ----
  const handleCompleteOrder = async (order: Order) => {
    try {
      await DapurAPI.completeOrder(order.id);
    } catch {
      console.warn('[Dapur] completeOrder backend fallback to client-state');
    }

    const nowIso = new Date().toISOString();
    const updated = orders.map((o) =>
      String(o.id) === String(order.id)
        ? {
            ...o,
            status: 'Selesai',
            completedAt: nowIso,
            completed_at: nowIso,
          }
        : o
    );
    setOrders(updated);
    persistCompletedOrders(updated);

    // Pastikan filterDate diset ke tanggal hari ini agar pesanan yang baru selesai langsung terlihat
    setFilterDate(getTodayString());

    showToast(`Pesanan #${order.orderNumber} (Meja ${order.tableNumber || '-'}) telah SELESAI siap disajikan!`);
    setActiveTab('selesai');
  };

  // ---- Handler Logout ----
  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  // ---- Title Top Bar Dinamis (Sesuai 3 Gambar Figma) ----
  const getTopStatusTitle = () => {
    if (activeTab === 'dikonfirmasi') return 'Dikonfirmasi Kasir';
    if (activeTab === 'proses') return 'Proses';
    return 'Selesai';
  };

  return (
    <div className="dapur-page-wrapper">
      {/* 1. STATUS BAR ATAS (Sesuai Figma: "Dikonfirmasi Kasir" / "Proses" / "Selesai") */}
      <div className="dapur-top-status-bar">
        <span className="dapur-top-status-title">{getTopStatusTitle()}</span>
        <div className="dapur-top-status-right">
          <span>Real-time Kitchen Display</span>
          <button className="dapur-refresh-badge" onClick={fetchOrders} title="Perbarui Pesanan">
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* 3. FILTER TANGGAL (Hanya Tampil di Tab "Selesai") */}
      {activeTab === 'selesai' && (
        <div className="dapur-date-filter-bar">
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
                backgroundColor: filterDate === getTodayString() ? '#7b4a1e' : '#a07855',
              }}
            >
              Hari Ini
            </button>
            <button
              type="button"
              className="dapur-date-btn-today"
              onClick={() => setFilterDate('')}
              style={{
                backgroundColor: filterDate === '' ? '#7b4a1e' : '#8c7d73',
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

      {/* 5. FOOTER COKELAT GELAP DENGAN TAB FIGMA (Dikonfirmasi | Proses | Selesai) */}
      <footer className="dapur-footer-navbar">
        <div className="dapur-footer-top">
          <div className="dapur-footer-brand-box">
            <span className="dapur-footer-brand-logo">Coffee Shop</span>
            <span className="dapur-footer-brand-tagline">one Stop | one Heart | one Cup</span>
          </div>

          {/* Tiga Tombol Pill Navigasi Utama Figma */}
          <div className="dapur-footer-tabs">
            <button
              type="button"
              className={`dapur-footer-tab-pill ${activeTab === 'dikonfirmasi' ? 'active' : ''}`}
              onClick={() => setActiveTab('dikonfirmasi')}
            >
              Dikonfirmasi
            </button>

            <button
              type="button"
              className={`dapur-footer-tab-pill ${activeTab === 'proses' ? 'active' : ''}`}
              onClick={() => setActiveTab('proses')}
            >
              Proses
            </button>

            <button
              type="button"
              className={`dapur-footer-tab-pill ${activeTab === 'selesai' ? 'active' : ''}`}
              onClick={() => setActiveTab('selesai')}
            >
              Selesai
            </button>
          </div>
        </div>

        <div className="dapur-footer-copyright">
          © 2023 All Rights Reserved
        </div>
      </footer>

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
