// ============================================================
// HALAMAN : DashboardPage (Kitchen Operations & Chef Hub)
// PERAN   : Dapur
// ROUTE   : /dapur/dashboard
// FITUR   : Ringkasan metrik dapur, pemantauan antrean aktif real-time,
//           aksi cepat mulai masak / selesai, serta rekap porsi hari ini.
// ============================================================

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DapurAPI } from '../../api/dapur';
import { useAuth } from '../../context/AuthContext';
import type { Order } from '../../types';

// Format Jam Lokal
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

// Format Tanggal Hari Ini (YYYY-MM-DD)
function getTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Normalisasi Objek Pesanan agar kompatibel snake_case Backend & camelCase Frontend
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

export default function DapurDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [queueOrders, setQueueOrders] = useState<Order[]>([]);
  const [completedOrders, setCompletedOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [processingOrderId, setProcessingOrderId] = useState<string | null>(null);

  // Tanggal & Jam Live
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleDateString('id-ID', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }) +
          ' • ' +
          now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 10000);
    return () => clearInterval(timer);
  }, []);

  const showNotification = (msg: string) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(null), 3500);
  };

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [queueData, completedData] = await Promise.all([
        DapurAPI.getKitchenQueue().catch(() => []),
        DapurAPI.getCompletedOrdersToday(getTodayString()).catch(() => []),
      ]);

      const normQueue = Array.isArray(queueData) ? queueData.map(normalizeOrder) : [];
      const normCompleted = Array.isArray(completedData) ? completedData.map(normalizeOrder) : [];

      setQueueOrders(normQueue);
      setCompletedOrders(normCompleted);
    } catch (err: any) {
      console.error('Gagal memuat dashboard dapur:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
    // Auto-polling antrean setiap 10 detik agar dapur selalu up-to-date
    const interval = setInterval(fetchDashboardData, 10000);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  // Metrik Operasional Dapur
  const metrics = useMemo(() => {
    // Siap dimasak (Status Dikonfirmasi)
    const readyToCook = queueOrders.filter((o) => o.status === 'Dikonfirmasi');
    // Sedang dimasak (Status Sedang Diproses)
    const inCooking = queueOrders.filter(
      (o) => o.status === 'Sedang Diproses' || o.status === 'Diproses'
    );
    // Selesai hari ini
    const completedCount = completedOrders.length;

    // Total porsi yang disajikan hari ini
    let totalPortions = 0;
    const itemCounts: Record<string, number> = {};

    completedOrders.forEach((order: any) => {
      if (Array.isArray(order.items)) {
        order.items.forEach((it: any) => {
          const qty = Number(it.quantity || 1);
          const name = it.menuItemName || it.item_name || it.name || 'Item Menu';
          totalPortions += qty;
          itemCounts[name] = (itemCounts[name] || 0) + qty;
        });
      }
    });

    // Top 5 Menu Dimasak
    const topDishes = Object.entries(itemCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      readyToCook,
      inCooking,
      completedCount,
      totalPortions,
      topDishes,
    };
  }, [queueOrders, completedOrders]);

  // Aksi Cepat: Mulai Memasak
  const handleStartProcessing = async (order: Order) => {
    try {
      setProcessingOrderId(String(order.id));
      await DapurAPI.startProcessing(order.id);
      showNotification(`Pesanan #${order.orderNumber} mulai dimasak.`);
      fetchDashboardData();
    } catch (err: any) {
      alert(`Gagal memproses pesanan: ${err?.message || 'Terjadi kesalahan'}`);
    } finally {
      setProcessingOrderId(null);
    }
  };

  // Aksi Cepat: Tandai Selesai
  const handleCompleteOrder = async (order: Order) => {
    try {
      setProcessingOrderId(String(order.id));
      await DapurAPI.completeOrder(order.id);
      showNotification(`Pesanan #${order.orderNumber} berhasil ditandai selesai dan siap saji.`);
      fetchDashboardData();
    } catch (err: any) {
      alert(`Gagal menyelesaikan pesanan: ${err?.message || 'Terjadi kesalahan'}`);
    } finally {
      setProcessingOrderId(null);
    }
  };

  return (
    <div>
      {/* ═══════════════════ HEADER HALAMAN ═══════════════════ */}
      <div className="dapur-page-header">
        <div>
          <h1 className="dapur-page-title">Dashboard Dapur & Barista</h1>
          <p className="dapur-page-subtitle">
            Pusat kendali operasional dapur EtaCafe • Pantau antrean masak, progres hidangan, dan ringkasan sajian
          </p>
          <div style={{ marginTop: '8px', fontSize: '13px', color: '#844c1c', fontWeight: 600 }}>
            🕒 {currentTime}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="dapur-btn dapur-btn-secondary"
            onClick={fetchDashboardData}
            title="Muat ulang antrean dapur"
          >
            🔄 Refresh
          </button>
          <button
            type="button"
            className="dapur-btn dapur-btn-primary"
            onClick={() => navigate('/dapur/antrian')}
          >
            📋 Buka Antrean KDS ➔
          </button>
        </div>
      </div>

      {/* ═══════════════════ NOTIFIKASI TOAST ═══════════════════ */}
      {actionMessage && (
        <div
          style={{
            backgroundColor: '#dcfce7',
            border: '1px solid #86efac',
            color: '#166534',
            padding: '12px 18px',
            borderRadius: '12px',
            marginBottom: '24px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>✓ {actionMessage}</span>
          <button
            type="button"
            onClick={() => setActionMessage(null)}
            style={{ background: 'none', border: 'none', color: '#166534', cursor: 'pointer', fontWeight: 700 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* ═══════════════════ METRIK OPERASIONAL ═══════════════════ */}
      <div className="dapur-stats-grid">
        {/* Kartu 1: Siap Dimasak */}
        <div className="dapur-stat-card">
          <div className="dapur-stat-icon" style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}>
            🛎️
          </div>
          <div className="dapur-stat-info">
            <div className="dapur-stat-label">Siap Dimasak</div>
            <div className="dapur-stat-value" style={{ color: metrics.readyToCook.length > 0 ? '#dc2626' : '#2c1810' }}>
              {metrics.readyToCook.length}
            </div>
            <div className="dapur-stat-desc">
              {metrics.readyToCook.length > 0 ? (
                <span style={{ color: '#dc2626', fontWeight: 600 }}>● Perlu Segera Dimasak</span>
              ) : (
                'Tidak ada pesanan tertunda'
              )}
            </div>
          </div>
        </div>

        {/* Kartu 2: Sedang Dimasak */}
        <div className="dapur-stat-card">
          <div className="dapur-stat-icon" style={{ backgroundColor: '#fef3c7', color: '#d97706' }}>
            🍳
          </div>
          <div className="dapur-stat-info">
            <div className="dapur-stat-label">Sedang Dimasak</div>
            <div className="dapur-stat-value" style={{ color: '#d97706' }}>
              {metrics.inCooking.length}
            </div>
            <div className="dapur-stat-desc">
              {metrics.inCooking.length > 0 ? 'Sedang dalam persiapan' : 'Dapur siap terima pesanan'}
            </div>
          </div>
        </div>

        {/* Kartu 3: Selesai Hari Ini */}
        <div className="dapur-stat-card">
          <div className="dapur-stat-icon" style={{ backgroundColor: '#dcfce7', color: '#166534' }}>
            ✅
          </div>
          <div className="dapur-stat-info">
            <div className="dapur-stat-label">Selesai Hari Ini</div>
            <div className="dapur-stat-value" style={{ color: '#166534' }}>
              {metrics.completedCount}
            </div>
            <div className="dapur-stat-desc">Pesanan disajikan ke meja</div>
          </div>
        </div>

        {/* Kartu 4: Total Porsi Menu */}
        <div className="dapur-stat-card">
          <div className="dapur-stat-icon" style={{ backgroundColor: '#f5efe6', color: '#844c1c' }}>
            🍲
          </div>
          <div className="dapur-stat-info">
            <div className="dapur-stat-label">Total Porsi Disajikan</div>
            <div className="dapur-stat-value" style={{ color: '#844c1c' }}>
              {metrics.totalPortions}
            </div>
            <div className="dapur-stat-desc">Porsi makanan & minuman</div>
          </div>
        </div>
      </div>

      {/* ═══════════════════ MAIN CONTENT GRID ═══════════════════ */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '24px',
          marginBottom: '32px',
        }}
      >
        {/* SEKSI 1: Antrean Aktif yang Membutuhkan Aksi Cepat */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            padding: '24px',
            border: '1px solid #ebdccb',
            boxShadow: '0 2px 8px rgba(44, 24, 16, 0.04)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '18px',
            }}
          >
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#2c1810' }}>
                Antrean Aktif Saat Ini
              </h2>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#665c54' }}>
                Pesanan yang menunggu dimasak atau sedang dalam persiapan
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/dapur/antrian')}
              style={{
                fontSize: '12px',
                fontWeight: 700,
                color: '#844c1c',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Lihat Semua ({queueOrders.length}) ➔
            </button>
          </div>

          {loading && queueOrders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#888' }}>
              Memuat antrean dapur...
            </div>
          ) : queueOrders.length === 0 ? (
            <div
              style={{
                backgroundColor: '#faf7f2',
                borderRadius: '14px',
                padding: '36px 20px',
                textAlign: 'center',
                color: '#665c54',
              }}
            >
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>🍳</div>
              <div style={{ fontWeight: 700, fontSize: '15px' }}>Semua Pesanan Bersih!</div>
              <div style={{ fontSize: '13px', marginTop: '4px', color: '#888' }}>
                Tidak ada pesanan yang sedang menunggu atau dimasak.
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {queueOrders.slice(0, 4).map((order) => {
                const isReady = order.status === 'Dikonfirmasi';
                const isProcessing =
                  order.status === 'Sedang Diproses' || order.status === 'Diproses';
                const isActionBusy = processingOrderId === String(order.id);

                return (
                  <div
                    key={order.id}
                    style={{
                      border: isReady ? '1.5px solid #fed7aa' : '1.5px solid #bbf7d0',
                      backgroundColor: isReady ? '#fffaf5' : '#f0fdf4',
                      borderRadius: '16px',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            backgroundColor: isReady ? '#844c1c' : '#166534',
                            color: '#ffffff',
                            fontWeight: 800,
                            fontSize: '12px',
                            padding: '3px 10px',
                            borderRadius: '999px',
                          }}
                        >
                          {order.tableNumber ? `Meja ${order.tableNumber}` : 'Take Away'}
                        </span>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#2c1810' }}>
                          #{order.orderNumber}
                        </span>
                      </div>

                      <div style={{ fontSize: '12px', color: '#888' }}>
                        🕒 {formatTime(order.confirmedAt || order.createdAt)}
                      </div>
                    </div>

                    {/* Daftar Item Singkat */}
                    <div style={{ fontSize: '13px', color: '#333' }}>
                      {Array.isArray(order.items) &&
                        order.items.map((it: any, idx: number) => (
                          <div
                            key={idx}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              padding: '2px 0',
                            }}
                          >
                            <span>
                              <strong>{it.quantity}x</strong>{' '}
                              {it.menuItemName || it.item_name || it.name || 'Menu'}
                            </span>
                            {it.notes && (
                              <span style={{ color: '#d97706', fontSize: '11px', fontWeight: 600 }}>
                                ✎ {it.notes}
                              </span>
                            )}
                          </div>
                        ))}
                    </div>

                    {/* Tombol Aksi Cepat */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
                      {isReady && (
                        <button
                          type="button"
                          className="dapur-btn dapur-btn-accent"
                          style={{ fontSize: '12px', padding: '6px 14px' }}
                          disabled={isActionBusy}
                          onClick={() => handleStartProcessing(order)}
                        >
                          {isActionBusy ? 'Memproses...' : '🍳 Mulai Masak'}
                        </button>
                      )}

                      {isProcessing && (
                        <button
                          type="button"
                          className="dapur-btn dapur-btn-success"
                          style={{ fontSize: '12px', padding: '6px 14px' }}
                          disabled={isActionBusy}
                          onClick={() => handleCompleteOrder(order)}
                        >
                          {isActionBusy ? 'Menyimpan...' : '✅ Tandai Selesai'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* SEKSI 2: Menu Terpopuler Dimasak Hari Ini */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            padding: '24px',
            border: '1px solid #ebdccb',
            boxShadow: '0 2px 8px rgba(44, 24, 16, 0.04)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 6px', color: '#2c1810' }}>
            Menu Terbanyak Dimasak Hari Ini
          </h2>
          <p style={{ margin: '0 0 18px', fontSize: '13px', color: '#665c54' }}>
            Rekap item makanan & minuman yang telah berhasil disajikan
          </p>

          {metrics.topDishes.length === 0 ? (
            <div
              style={{
                backgroundColor: '#faf7f2',
                borderRadius: '14px',
                padding: '36px 20px',
                textAlign: 'center',
                color: '#665c54',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>☕</div>
              <div style={{ fontWeight: 700, fontSize: '15px' }}>Belum Ada Data Sajian</div>
              <div style={{ fontSize: '13px', marginTop: '4px', color: '#888' }}>
                Pesanan yang selesai hari ini akan terakumulasi di sini.
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
              {metrics.topDishes.map((dish, idx) => {
                const maxCount = metrics.topDishes[0]?.count || 1;
                const percentage = Math.round((dish.count / maxCount) * 100);

                return (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ fontWeight: 600, color: '#2c1810' }}>
                        #{idx + 1} {dish.name}
                      </span>
                      <span style={{ fontWeight: 700, color: '#844c1c' }}>{dish.count} porsi</span>
                    </div>
                    {/* Progress Bar */}
                    <div
                      style={{
                        width: '100%',
                        height: '8px',
                        backgroundColor: '#f5efe6',
                        borderRadius: '999px',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${percentage}%`,
                          height: '100%',
                          backgroundColor: '#844c1c',
                          borderRadius: '999px',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════ SEKSI 3: PANDUAN STANDAR OPERASIONAL (SOP) DAPUR ═══════════════════ */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          padding: '24px',
          border: '1px solid #ebdccb',
        }}
      >
        <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 16px', color: '#2c1810' }}>
          📌 Alur Standar Operasional (SOP) Dapur EtaCafe
        </h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '16px',
          }}
        >
          <div
            style={{
              backgroundColor: '#faf7f2',
              borderRadius: '14px',
              padding: '16px',
              border: '1px solid #ebdccb',
            }}
          >
            <div style={{ fontSize: '20px', marginBottom: '8px' }}>1️⃣</div>
            <div style={{ fontWeight: 700, fontSize: '14px', color: '#2c1810', marginBottom: '4px' }}>
              Pesanan Dikonfirmasi Kasir
            </div>
            <div style={{ fontSize: '12px', color: '#665c54', lineHeight: 1.4 }}>
              Pesanan pelanggan hanya akan masuk ke antrean dapur setelah pembayaran diverifikasi dan
              dikonfirmasi oleh kasir (BR-02 & BR-09).
            </div>
          </div>

          <div
            style={{
              backgroundColor: '#faf7f2',
              borderRadius: '14px',
              padding: '16px',
              border: '1px solid #ebdccb',
            }}
          >
            <div style={{ fontSize: '20px', marginBottom: '8px' }}>2️⃣</div>
            <div style={{ fontWeight: 700, fontSize: '14px', color: '#2c1810', marginBottom: '4px' }}>
              Tekan "Mulai Masak"
            </div>
            <div style={{ fontSize: '12px', color: '#665c54', lineHeight: 1.4 }}>
              Saat koki atau barista mulai mempersiapkan pesanan, segera ubah status menjadi "Sedang Diproses"
              agar pelanggan dapat memantau status secara live.
            </div>
          </div>

          <div
            style={{
              backgroundColor: '#faf7f2',
              borderRadius: '14px',
              padding: '16px',
              border: '1px solid #ebdccb',
            }}
          >
            <div style={{ fontSize: '20px', marginBottom: '8px' }}>3️⃣</div>
            <div style={{ fontWeight: 700, fontSize: '14px', color: '#2c1810', marginBottom: '4px' }}>
              Cek Catatan Khusus & Selesai
            </div>
            <div style={{ fontSize: '12px', color: '#665c54', lineHeight: 1.4 }}>
              Periksa permintaan khusus (tanpa gula, pedas, dll). Setelah pesanan diantar ke meja atau disajikan,
              tandai sebagai "Selesai".
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
