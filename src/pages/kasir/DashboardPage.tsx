// ============================================================
// HALAMAN : Dashboard Kasir (Cashier Operations & Shift Hub)
// PERAN   : Pusat kendali operasional kasir, ringkasan transaksi shift,
//           serta antrean pesanan yang memerlukan aksi segera.
// ============================================================

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { KasirAPI } from '../../api/client';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Loading from '../../components/common/Loading';
import OrderCard from '../../components/kasir/OrderCard';
import type { Order } from '../../types';

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Waktu & Tanggal Live
  const [currentDateTime, setCurrentDateTime] = useState<string>(() => {
    return new Date().toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  });

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [pendingData, allData] = await Promise.all([
        KasirAPI.getPendingOrders(),
        KasirAPI.getOrders('all'),
      ]);

      setPendingOrders(Array.isArray(pendingData) ? pendingData : []);
      setAllOrders(Array.isArray(allData) ? allData : []);
    } catch (error) {
      console.error('Gagal memuat data dashboard kasir:', error);
      setPendingOrders([]);
      setAllOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated || authLoading) return;
    loadDashboardData();
  }, [isAuthenticated, authLoading, loadDashboardData]);

  // Kalkulasi Metrik Operasional Kasir
  const metrics = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);

    // Filter pesanan hari ini jika ada tanggal created_at
    const todayOrders = allOrders.filter((o: any) => {
      const createdDate = (o.created_at || o.createdAt || '').slice(0, 10);
      return !createdDate || createdDate === today;
    });

    const activeList = todayOrders.length > 0 ? todayOrders : allOrders;

    // Transaksi selesai / berhasil
    const completedOrders = activeList.filter(
      (o: any) => o.status === 'Selesai' || o.status === 'Dikonfirmasi'
    );

    const totalRevenue = completedOrders.reduce(
      (sum, o: any) => sum + Number(o.total_amount ?? o.totalAmount ?? 0),
      0
    );

    // Metode Pembayaran
    let qrisCount = 0;
    let tunaiCount = 0;
    let cardCount = 0;

    completedOrders.forEach((o: any) => {
      const method = (o.payment_method || o.paymentMethod || '').toLowerCase();
      if (method.includes('qris')) qrisCount++;
      else if (method.includes('tunai') || method.includes('cash')) tunaiCount++;
      else cardCount++;
    });

    return {
      pendingCount: pendingOrders.length,
      completedCount: completedOrders.length,
      totalRevenue,
      paymentSplit: { qrisCount, tunaiCount, cardCount },
    };
  }, [pendingOrders, allOrders]);

  const handleProses = async (orderId: string) => {
    setProcessingId(orderId);
    setActionMessage(null);
    try {
      const confirmedOrder = await KasirAPI.confirmOrder(Number(orderId));
      const orderNum = (confirmedOrder as any)?.order_number || `#${orderId}`;

      setActionMessage(
        `Sukses! Pesanan ${orderNum} telah dikonfirmasi dan BERHASIL DITERIMA DI DAPUR untuk diproses.`
      );

      // Refresh data
      await loadDashboardData();
    } catch (error: any) {
      console.error('Gagal memproses pesanan:', error);
      setActionMessage(error?.message || 'Gagal mengonfirmasi pesanan.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleLihatStruk = (orderId: string) => {
    navigate(`/kasir/struk/${orderId}`);
  };

  const handleDetail = (orderId: string) => {
    navigate(`/kasir/orders/${orderId}`);
  };

  if (!isAuthenticated) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Silakan login terlebih dahulu...</div>;
  }

  return (
    <div className="kasir-dashboard-content">
      {/* ═══════════════════ HEADER SHIFT KASIR ═══════════════════ */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          padding: '28px 32px',
          border: '1px solid #ebdccb',
          boxShadow: '0 4px 16px rgba(44, 24, 16, 0.05)',
          marginBottom: '28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px',
        }}
      >
        <div>
          <div
            style={{
              fontSize: '12px',
              fontWeight: 800,
              color: '#0284c7',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              marginBottom: '4px',
            }}
          >
            Terminal Kasir Aktif &bull; {currentDateTime}
          </div>
          <h1
            style={{
              fontSize: '26px',
              fontWeight: 800,
              color: '#2c1810',
              margin: '0 0 6px',
            }}
          >
            Selamat Bertugas, {user?.name || 'Kasir'} 👋
          </h1>
          <p style={{ margin: 0, color: '#665c54', fontSize: '14px' }}>
            Pantau pembayaran meja, verifikasi pesanan baru, dan layani pelanggan di kasir.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="kasir-order-btn"
            style={{
              backgroundColor: '#f0e6d9',
              color: '#2c1810',
              border: '1.5px solid #d4c5b9',
              padding: '10px 22px',
              borderRadius: '9999px',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
            }}
            onClick={() => navigate('/kasir/orders')}
          >
            📋 Buka Daftar Pesanan
          </button>

          <button
            type="button"
            className="kasir-order-btn primary"
            style={{
              backgroundColor: '#2c1810',
              color: '#ffffff',
              padding: '10px 26px',
              borderRadius: '9999px',
              fontWeight: 700,
              fontSize: '13px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(44, 24, 16, 0.2)',
            }}
            onClick={() => navigate('/kasir/pesanan-baru')}
          >
            ＋ Buat Pesanan Baru (POS)
          </button>
        </div>
      </div>

      {/* ═══════════════════ NOTIFIKASI AKSI ═══════════════════ */}
      {actionMessage && (
        <div
          style={{
            padding: '14px 20px',
            marginBottom: '24px',
            borderRadius: '12px',
            backgroundColor: actionMessage.startsWith('Sukses') ? '#dcfce7' : '#fee2e2',
            color: actionMessage.startsWith('Sukses') ? '#166534' : '#991b1b',
            border: `1px solid ${actionMessage.startsWith('Sukses') ? '#86efac' : '#fca5a5'}`,
            fontSize: '14px',
            fontWeight: 600,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>{actionMessage}</span>
          <button
            type="button"
            onClick={() => setActionMessage(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, color: 'inherit' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* ═══════════════════ KARTU METRIK SHIFT KASIR ═══════════════════ */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '20px',
          marginBottom: '32px',
        }}
      >
        {/* Metrik 1: Pesanan Menunggu Tindakan Kasir */}
        <div
          style={{
            backgroundColor: metrics.pendingCount > 0 ? '#fff7ed' : '#ffffff',
            borderRadius: '20px',
            padding: '24px',
            border: metrics.pendingCount > 0 ? '1.5px solid #fdba74' : '1px solid #ebdccb',
            boxShadow: '0 4px 12px rgba(44, 24, 16, 0.04)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#665c54', textTransform: 'uppercase' }}>
              Perlu Tindakan Kasir
            </span>
            {metrics.pendingCount > 0 && (
              <span
                style={{
                  backgroundColor: '#ea580c',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '9999px',
                }}
              >
                Penting
              </span>
            )}
          </div>
          <div
            style={{
              fontSize: '32px',
              fontWeight: 800,
              color: metrics.pendingCount > 0 ? '#c2410c' : '#2c1810',
              marginBottom: '4px',
            }}
          >
            {metrics.pendingCount}
          </div>
          <div style={{ fontSize: '13px', color: '#665c54' }}>
            {metrics.pendingCount > 0
              ? 'Pesanan masuk butuh verifikasi & konfirmasi'
              : 'Semua pesanan meja telah terkonfirmasi'}
          </div>
        </div>

        {/* Metrik 2: Transaksi Sukses */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            padding: '24px',
            border: '1px solid #ebdccb',
            boxShadow: '0 4px 12px rgba(44, 24, 16, 0.04)',
          }}
        >
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#665c54', textTransform: 'uppercase' }}>
            Transaksi Dilayani
          </span>
          <div
            style={{
              fontSize: '32px',
              fontWeight: 800,
              color: '#2c1810',
              margin: '8px 0 4px',
            }}
          >
            {metrics.completedCount}
          </div>
          <div style={{ fontSize: '13px', color: '#16a34a', fontWeight: 600 }}>
            Dikonfirmasi / Selesai Saji
          </div>
        </div>

        {/* Metrik 3: Total Omzet Kasir */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            padding: '24px',
            border: '1px solid #ebdccb',
            boxShadow: '0 4px 12px rgba(44, 24, 16, 0.04)',
          }}
        >
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#665c54', textTransform: 'uppercase' }}>
            Penerimaan Kasir
          </span>
          <div
            style={{
              fontSize: '26px',
              fontWeight: 800,
              color: '#844c1c',
              margin: '8px 0 4px',
            }}
          >
            Rp. {Number(metrics.totalRevenue).toLocaleString('id-ID')},-
          </div>
          <div style={{ fontSize: '12px', color: '#665c54' }}>
            QRIS: {metrics.paymentSplit.qrisCount} &bull; Tunai: {metrics.paymentSplit.tunaiCount} &bull; Kartu: {metrics.paymentSplit.cardCount}
          </div>
        </div>
      </div>

      {/* ═══════════════════ DAFTAR PESANAN BUTUH TINDAKAN SEGERA ═══════════════════ */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#2c1810', margin: 0 }}>
            Pesanan Masuk & Menunggu Konfirmasi ({pendingOrders.length})
          </h2>
          <p style={{ margin: '4px 0 0', color: '#665c54', fontSize: '13px' }}>
            Pesanan pelanggan dari QR Meja yang menunggu verifikasi pembayaran dan penerusan ke dapur
          </p>
        </div>

        {pendingOrders.length > 0 && (
          <button
            type="button"
            className="kasir-order-btn"
            style={{ padding: '6px 16px', fontSize: '12px' }}
            onClick={loadDashboardData}
          >
            🔄 Refresh Antrean
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ padding: '60px 0', textAlign: 'center' }}>
          <Loading />
          <p style={{ marginTop: '12px', color: '#777' }}>Memuat antrean pesanan kasir...</p>
        </div>
      ) : pendingOrders.length === 0 ? (
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            padding: '48px 24px',
            textAlign: 'center',
            border: '1px solid #ebdccb',
            boxShadow: '0 4px 12px rgba(44, 24, 16, 0.04)',
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>☕</div>
          <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#2c1810', margin: '0 0 8px' }}>
            Semua Pesanan Telah Terlayani!
          </h3>
          <p style={{ margin: '0 auto 20px', color: '#665c54', fontSize: '14px', maxWidth: '480px', lineHeight: 1.5 }}>
            Tidak ada pesanan baru yang menunggu tindakan kasir saat ini. Jika ada pelanggan yang ingin memesan langsung di kasir, klik tombol di bawah.
          </p>
          <button
            type="button"
            className="kasir-order-btn primary"
            style={{
              backgroundColor: '#2c1810',
              color: '#ffffff',
              padding: '10px 24px',
              borderRadius: '9999px',
              fontWeight: 700,
              fontSize: '13px',
              border: 'none',
              cursor: 'pointer',
            }}
            onClick={() => navigate('/kasir/pesanan-baru')}
          >
            ＋ Buka Kasir POS untuk Pesanan Baru
          </button>
        </div>
      ) : (
        <div className="kasir-orders-grid">
          {pendingOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onProses={handleProses}
              onLihatStruk={handleLihatStruk}
              onDetail={handleDetail}
            />
          ))}
        </div>
      )}
    </div>
  );
}
