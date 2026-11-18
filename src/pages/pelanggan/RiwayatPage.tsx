// ============================================================
// HALAMAN : RiwayatPage
// PERAN   : pelanggan
// ROUTE   : /pelanggan/riwayat
// REF SRS : FR-11, FR-12, FR-15
// ============================================================

import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@/components/common/Button';
import StatusBadge from '@/components/common/StatusBadge';
import RupiahText from '@/components/common/RupiahText';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import PelangganAPI from '@/api/pelanggan';
import type { OrderStatus } from '@/types';

export default function RiwayatPage() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'semua' | 'aktif' | 'selesai' | 'dibatalkan'>('semua');

  // -----------------------------------------------------------------
  // Ambil riwayat pesanan dari backend
  // -----------------------------------------------------------------
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await PelangganAPI.getOrderHistory();
        setOrders(data || []);
      } catch (e: any) {
        console.error('Gagal mengambil riwayat:', e);
        setError(e?.message ?? 'Gagal memuat riwayat pesanan.');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  // -----------------------------------------------------------------
  // Helper format tanggal
  // -----------------------------------------------------------------
  const formatDate = (isoDate?: string | null) => {
    if (!isoDate) return '-';
    try {
      const d = new Date(isoDate);
      return d.toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return String(isoDate);
    }
  };

  // -----------------------------------------------------------------
  // Filter tab pesanan
  // -----------------------------------------------------------------
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const st = order.status || '';
      if (activeTab === 'aktif') {
        return (
          st === 'Menunggu Konfirmasi Kasir' ||
          st === 'Dikonfirmasi' ||
          st === 'Sedang Diproses'
        );
      }
      if (activeTab === 'selesai') {
        return st === 'Selesai';
      }
      if (activeTab === 'dibatalkan') {
        return st === 'Dibatalkan';
      }
      return true;
    });
  }, [orders, activeTab]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center max-w-md mx-auto bg-white rounded-2xl shadow-sm border border-[#ece4dc] mt-10">
        <p className="text-rose-600 font-semibold mb-4">{error}</p>
        <Button onClick={() => navigate('/pelanggan/home')}>Kembali ke Beranda</Button>
      </div>
    );
  }

  return (
    <div className="riwayat-page-wrapper p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      {/* ─── HEADER ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#ece4dc] pb-4">
        <div>
          <h1 className="text-2xl font-black text-[#2C1008] tracking-tight">Riwayat Pesanan</h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Semua riwayat pesanan Dine In dan Takeaway Anda di EtaCafe
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/pelanggan/products')}
          className="bg-[#7B4A1E] hover:bg-[#3B1A0A] text-white py-2 px-5 rounded-full font-bold text-xs transition-all shadow self-start sm:self-auto"
        >
          + Pesan Baru
        </button>
      </div>

      {/* ─── TABS FILTER ─── */}
      <div className="flex gap-2 overflow-x-auto pb-1 text-xs font-bold scrollbar-none">
        {[
          { key: 'semua', label: 'Semua Pesanan' },
          { key: 'aktif', label: 'Sedang Berjalan' },
          { key: 'selesai', label: 'Selesai' },
          { key: 'dibatalkan', label: 'Dibatalkan' },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key as any)}
            className={`py-2 px-4 rounded-full transition-all shrink-0 ${
              activeTab === tab.key
                ? 'bg-[#7B4A1E] text-white shadow'
                : 'bg-white text-stone-600 border border-[#ece4dc] hover:bg-stone-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ─── DAFTAR KARTU PESANAN ─── */}
      {filteredOrders.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-[#ece4dc] shadow-sm">
          <div className="text-4xl mb-3">☕</div>
          <p className="text-stone-700 font-bold mb-1">Tidak ada pesanan pada kategori ini.</p>
          <p className="text-xs text-stone-500 mb-4">
            Pesanan Anda yang telah dibuat akan tercatat otomatis di sini.
          </p>
          <Button onClick={() => navigate('/pelanggan/products')}>Mulai Memesan</Button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const orderNumber = order.order_number || order.orderNumber || `ORD-${order.id}`;
            const tableNumber = order.table_number || order.tableNumber;
            const isDineIn = order.order_type === 'qr_meja' || !!tableNumber;
            const total = order.total_amount ?? order.totalAmount ?? order.subtotal ?? 0;
            const createdAt = order.created_at || order.createdAt;
            const canCancel = order.status === 'Menunggu Konfirmasi Kasir';

            return (
              <div
                key={order.id}
                className="order-card p-5 border border-[#ece4dc] rounded-2xl bg-white shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
              >
                {/* Info Tiket & Waktu */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-black text-sm text-[#2C1008]">
                      #{orderNumber}
                    </span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#fbf5ee] text-[#7B4A1E] border border-[#ece4dc]">
                      {isDineIn ? (tableNumber || 'Dine In') : 'Takeaway'}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500">{formatDate(createdAt)}</p>
                  {order.items && order.items.length > 0 && (
                    <p className="text-xs text-stone-600 mt-1 line-clamp-1">
                      {order.items.length} Menu: {order.items.map((i: any) => i.item_name || i.name).filter(Boolean).join(', ')}
                    </p>
                  )}
                </div>

                {/* Total Biaya */}
                <div className="md:text-center">
                  <span className="text-xs text-stone-400 block md:hidden">Total:</span>
                  <RupiahText amount={total} />
                </div>

                {/* Status Badge */}
                <div className="text-left md:text-center flex flex-col items-start md:items-center gap-1">
                  <StatusBadge status={order.status as OrderStatus} />
                  {canCancel && (
                    <span className="text-[10px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded">
                      Bisa dibatalkan
                    </span>
                  )}
                </div>

                {/* Tombol Aksi */}
                <div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => navigate(`/pelanggan/riwayat/${order.id}`)}
                  >
                    Lihat Detail
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
