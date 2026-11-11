// HALAMAN : DaftarPesananPage (Kasir)
// PERAN   : Tabel daftar seluruh pesanan kasir dengan filter status dan aksi cepat

import React, { useEffect, useState, useCallback } from 'react';
import { KasirAPI } from '../../api/client';
import Loading from '../../components/common/Loading';
import StatusBadge from '../../components/common/StatusBadge';
import RupiahText from '../../components/common/RupiahText';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import type { Order } from '../../types';

export default function DaftarPesananPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<'menunggu' | 'dikonfirmasi' | 'proses' | 'selesai' | 'all'>('all');
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      let data: any[] = [];
      if (selectedFilter === 'all') {
        data = await KasirAPI.getOrders('all');
      } else {
        data = await KasirAPI.getOrders(selectedFilter);
      }

      if (Array.isArray(data)) {
        setOrders(data);
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error('Gagal memuat daftar pesanan:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [selectedFilter]);

  useEffect(() => {
    if (!isAuthenticated || isLoading) return;
    loadOrders();
  }, [isAuthenticated, isLoading, loadOrders]);

  if (!isAuthenticated) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Silakan login terlebih dahulu...</div>;
  }

  if (isLoading) {
    return <Loading />;
  }

  const handleQuickConfirm = async (orderId: string | number) => {
    setConfirmingId(String(orderId));
    setToastMessage(null);
    try {
      const res = await KasirAPI.confirmOrder(orderId);
      const num = (res as any)?.order_number || `#${orderId}`;
      setToastMessage(`Pesanan ${num} berhasil dikonfirmasi dan langsung diteruskan ke Dapur!`);
      await loadOrders();
    } catch (err: any) {
      console.error('Gagal konfirmasi:', err);
      setToastMessage(err?.message || 'Gagal mengonfirmasi pesanan.');
    } finally {
      setConfirmingId(null);
    }
  };

  return (
    <div className="kasir-daftar-pesanan" style={{ paddingBottom: '80px' }}>
      {/* Header Halaman */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, margin: 0, color: '#2c1810' }}>
            Daftar Pesanan Restoran
          </h1>
          <p style={{ margin: '4px 0 0', color: '#665c54', fontSize: '14px' }}>
            Pantau dan kelola seluruh transaksi pesanan masuk dan riwayat
          </p>
        </div>

        <button
          type="button"
          className="kasir-order-btn primary"
          onClick={() => navigate('/kasir/pesanan-baru')}
          style={{ padding: '10px 24px', backgroundColor: '#2c1810', color: '#fff' }}
        >
          + Pesanan Baru
        </button>
      </div>

      {/* Toast Notifikasi */}
      {toastMessage && (
        <div
          style={{
            padding: '12px 18px',
            marginBottom: '20px',
            borderRadius: '10px',
            backgroundColor: toastMessage.includes('berhasil') ? '#dcfce7' : '#fee2e2',
            color: toastMessage.includes('berhasil') ? '#166534' : '#991b1b',
            border: `1px solid ${toastMessage.includes('berhasil') ? '#86efac' : '#fca5a5'}`,
            fontSize: '14px',
            fontWeight: 600,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, color: 'inherit' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {(['all', 'menunggu', 'dikonfirmasi', 'proses', 'selesai'] as const).map((filterKey) => {
          const label =
            filterKey === 'all'
              ? 'Semua Pesanan'
              : filterKey === 'menunggu'
              ? 'Menunggu Konfirmasi'
              : filterKey === 'dikonfirmasi'
              ? 'Dikonfirmasi (Dapur)'
              : filterKey === 'proses'
              ? 'Sedang Dimasak'
              : 'Selesai Saji';

          const isActive = selectedFilter === filterKey;

          return (
            <button
              key={filterKey}
              type="button"
              onClick={() => setSelectedFilter(filterKey)}
              style={{
                padding: '8px 18px',
                borderRadius: '9999px',
                border: '1.5px solid #2c1810',
                backgroundColor: isActive ? '#2c1810' : '#ffffff',
                color: isActive ? '#ffffff' : '#2c1810',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Tabel Pesanan */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 4px 16px rgba(44, 24, 16, 0.08)',
          overflow: 'hidden',
          border: '1px solid #ebdccb',
        }}
      >
        {loading ? (
          <div style={{ padding: '60px 0', textAlign: 'center' }}>
            <Loading />
            <p style={{ marginTop: '12px', color: '#777' }}>Memuat daftar pesanan...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="kasir-empty-state" style={{ padding: '60px 20px' }}>
            <p style={{ fontSize: '16px', fontWeight: 600, color: '#524741' }}>
              Tidak ada pesanan ditemukan untuk filter ini.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#f5eee6', borderBottom: '2px solid #e0d5c8', color: '#2c1810', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  <th style={{ padding: '16px 20px' }}>No. Pesanan</th>
                  <th style={{ padding: '16px 20px' }}>Meja / Tipe</th>
                  <th style={{ padding: '16px 20px' }}>Pelanggan</th>
                  <th style={{ padding: '16px 20px' }}>Status</th>
                  <th style={{ padding: '16px 20px' }}>Total Bayar</th>
                  <th style={{ padding: '16px 20px', textAlign: 'center' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order: any, idx: number) => {
                  const orderId = String(order.id);
                  const orderNum = order.order_number || order.orderNumber || `#${orderId}`;
                  const tableNo = order.table_number || order.tableNumber || (order.order_type === 'langsung' ? 'Kasir' : 'Meja -');
                  const customer = order.customer_name || order.customerName || 'Pelanggan';
                  const total = order.total_amount ?? order.totalAmount ?? 0;
                  const status = order.status || 'Menunggu Konfirmasi Kasir';
                  const isPending = status === 'Menunggu Konfirmasi Kasir' || status === 'MENUNGGU_KONFIRMASI_KASIR';

                  return (
                    <tr
                      key={orderId}
                      style={{
                        borderBottom: '1px solid #f0e6dc',
                        backgroundColor: idx % 2 === 0 ? '#ffffff' : '#faf6f0',
                        transition: 'background-color 0.15s',
                      }}
                    >
                      <td style={{ padding: '14px 20px', fontWeight: 700, color: '#2c1810' }}>
                        {orderNum}
                      </td>
                      <td style={{ padding: '14px 20px', color: '#524741', fontSize: '14px' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '3px 10px',
                            borderRadius: '6px',
                            backgroundColor: '#e6ded5',
                            fontWeight: 600,
                            fontSize: '12px',
                          }}
                        >
                          {tableNo}
                        </span>
                      </td>
                      <td style={{ padding: '14px 20px', color: '#333', fontSize: '14px' }}>
                        {customer}
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <StatusBadge status={status} small />
                      </td>
                      <td style={{ padding: '14px 20px', fontWeight: 700, color: '#2c1810' }}>
                        <RupiahText amount={total} />
                      </td>
                      <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          {isPending && (
                            <button
                              type="button"
                              className="kasir-order-btn primary"
                              onClick={() => handleQuickConfirm(orderId)}
                              disabled={confirmingId === orderId}
                              style={{ padding: '6px 14px', fontSize: '12px' }}
                              title="Konfirmasi pembayaran dan kirim ke antrean Dapur"
                            >
                              {confirmingId === orderId ? 'Memproses...' : 'Konfirmasi'}
                            </button>
                          )}
                          <button
                            type="button"
                            className="kasir-order-btn"
                            onClick={() => navigate(`/kasir/orders/${orderId}`)}
                            style={{ padding: '6px 14px', fontSize: '12px' }}
                          >
                            Detail
                          </button>
                          {!isPending && (
                            <button
                              type="button"
                              className="kasir-order-btn"
                              onClick={() => navigate(`/kasir/struk/${orderId}`)}
                              style={{ padding: '6px 14px', fontSize: '12px' }}
                            >
                              Struk
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
