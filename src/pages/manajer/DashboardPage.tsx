// ============================================================
// HALAMAN : DashboardPage
// PERAN   : manajer
// ROUTE   : /manajer/dashboard (atau /manajer)
// DESAIN  : Sesuai Figma Home Page Manager.png
// ============================================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getSalesSummary,
  getMenus,
  getUsers,
  SalesReportSummary,
  ManajerMenuItem,
  ManajerUser,
} from '../../api/manajer';

export default function DashboardPage() {
  const navigate = useNavigate();

  const [summary, setSummary] = useState<SalesReportSummary | null>(null);
  const [menus, setMenus] = useState<ManajerMenuItem[]>([]);
  const [users, setUsers] = useState<ManajerUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Stored Manager User Info
  const managerUser = (() => {
    try {
      const stored = localStorage.getItem('etacafe_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  })();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [salesData, menuData, userData] = await Promise.all([
          getSalesSummary('harian'),
          getMenus(),
          getUsers(),
        ]);
        setSummary(salesData);
        setMenus(menuData);
        setUsers(userData);
      } catch (err: any) {
        setError(err?.message || 'Gagal memuat ringkasan dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const activeMenusCount = menus.filter(
    (m) => m.is_available ?? m.isAvailable ?? true
  ).length;

  return (
    <div>
      {/* Welcome Banner */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          padding: '32px',
          border: '1px solid #ebdccb',
          boxShadow: '0 4px 16px rgba(44, 24, 16, 0.05)',
          marginBottom: '32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px',
        }}
      >
        <div>
          <span
            style={{
              fontSize: '12px',
              fontWeight: 800,
              color: '#844c1c',
              textTransform: 'uppercase',
              letterSpacing: '1px',
            }}
          >
            Executive Dashboard
          </span>
          <h1
            style={{
              fontSize: '28px',
              fontWeight: 800,
              color: '#2c1810',
              margin: '6px 0 8px',
            }}
          >
            Selamat Datang, {managerUser?.name || 'Manajer EtaCafe'} 👋
          </h1>
          <p style={{ margin: 0, color: '#665c54', fontSize: '15px' }}>
            Pantau performa penjualan, ketersediaan menu, staf, dan kendali operasional kafe Anda.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            className="manajer-btn manajer-btn-primary"
            onClick={() => navigate('/manajer/laporan')}
          >
            📊 Buka Laporan Penjualan
          </button>
        </div>
      </div>

      {error && (
        <div
          style={{
            backgroundColor: '#fee2e2',
            border: '1px solid #fca5a5',
            color: '#991b1b',
            padding: '12px 18px',
            borderRadius: '12px',
            marginBottom: '24px',
          }}
        >
          ⚠ {error}
        </div>
      )}

      {/* Grid 4 Kartu Metrik Hari Ini */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '20px',
          marginBottom: '36px',
        }}
      >
        {/* Metrik 1: Omzet Hari Ini */}
        <div className="manajer-analytics-card" style={{ padding: '24px', textAlign: 'left' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#665c54', marginBottom: '8px' }}>
            PENDAPATAN HARI INI
          </div>
          <div
            style={{
              fontSize: '28px',
              fontWeight: 800,
              color: '#844c1c',
              marginBottom: '4px',
            }}
          >
            Rp. {Number(summary?.total_revenue || 0).toLocaleString('id-ID')},-
          </div>
          <div style={{ fontSize: '12px', color: '#16a34a', fontWeight: 600 }}>
            {summary?.total_orders_completed || 0} order selesai
          </div>
        </div>

        {/* Metrik 2: Transaksi Sukses */}
        <div className="manajer-analytics-card" style={{ padding: '24px', textAlign: 'left' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#665c54', marginBottom: '8px' }}>
            ORDER SELESAI
          </div>
          <div
            style={{
              fontSize: '28px',
              fontWeight: 800,
              color: '#2c1810',
              marginBottom: '4px',
            }}
          >
            {summary?.total_orders_completed || 0}
          </div>
          <div style={{ fontSize: '12px', color: '#665c54' }}>
            Rata-rata: Rp. {Number(summary?.average_order_value || 0).toLocaleString('id-ID')},-
          </div>
        </div>

        {/* Metrik 3: Menu Aktif */}
        <div className="manajer-analytics-card" style={{ padding: '24px', textAlign: 'left' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#665c54', marginBottom: '8px' }}>
            MENU TERSEDIA
          </div>
          <div
            style={{
              fontSize: '28px',
              fontWeight: 800,
              color: '#2c1810',
              marginBottom: '4px',
            }}
          >
            {activeMenusCount} / {menus.length}
          </div>
          <div style={{ fontSize: '12px', color: '#665c54' }}>
            {menus.length - activeMenusCount} menu dinonaktifkan (OFF)
          </div>
        </div>

        {/* Metrik 4: Akun Staf */}
        <div className="manajer-analytics-card" style={{ padding: '24px', textAlign: 'left' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#665c54', marginBottom: '8px' }}>
            TOTAL PENGGUNA & STAF
          </div>
          <div
            style={{
              fontSize: '28px',
              fontWeight: 800,
              color: '#2c1810',
              marginBottom: '4px',
            }}
          >
            {users.length}
          </div>
          <div style={{ fontSize: '12px', color: '#665c54' }}>
            Kasir, Dapur, Manajer & Pelanggan
          </div>
        </div>
      </div>
    </div>
  );
}
