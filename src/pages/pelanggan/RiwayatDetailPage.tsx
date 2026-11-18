// ============================================================
// HALAMAN : RiwayatDetailPage
// PERAN   : pelanggan
// ROUTE   : /pelanggan/riwayat/:id
// REF SRS : FR-10, FR-11, FR-12, FR-15, BR-03
// ============================================================

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Button from '@/components/common/Button';
import StatusBadge from '@/components/common/StatusBadge';
import RupiahText, { formatRupiah } from '@/components/common/RupiahText';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import PelangganAPI from '@/api/pelanggan';

export default function RiwayatDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // State untuk modal pembatalan mandiri (FR-15 & BR-03)
  const [showCancelModal, setShowCancelModal] = useState<boolean>(false);
  const [cancelling, setCancelling] = useState<boolean>(false);
  const [cancelError, setCancelError] = useState<string>('');
  const [cancelSuccess, setCancelSuccess] = useState<string>('');

  // -----------------------------------------------------------------
  // Ambil detail pesanan dari backend
  // -----------------------------------------------------------------
  const fetchDetail = useCallback(async (isRefresh = false) => {
    if (!id) {
      setError('Tidak ada ID pesanan.');
      setLoading(false);
      return;
    }

    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const data = await PelangganAPI.getOrderStatus(Number(id));
      setOrder(data);
      setError('');
    } catch (e: any) {
      console.error('Gagal mengambil status pesanan:', e);
      setError(e?.message ?? 'Gagal memuat detail pesanan.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  // Polling status otomatis setiap 6 detik jika pesanan masih aktif
  useEffect(() => {
    if (!order) return;
    const isFinished = order.status === 'Selesai' || order.status === 'Dibatalkan';
    if (isFinished) return;

    const interval = setInterval(() => {
      fetchDetail(true);
    }, 6000);

    return () => clearInterval(interval);
  }, [order?.status, fetchDetail]);

  // -----------------------------------------------------------------
  // Handler Pembatalan Pesanan Mandiri (FR-15 & BR-03)
  // -----------------------------------------------------------------
  const handleCancelOrder = async () => {
    if (!order?.id) return;
    setCancelling(true);
    setCancelError('');

    try {
      const updatedOrder = await PelangganAPI.cancelOrder(order.id);
      setOrder(updatedOrder);
      setShowCancelModal(false);
      setCancelSuccess('Pesanan Anda berhasil dibatalkan.');
    } catch (e: any) {
      console.error('Gagal membatalkan pesanan:', e);
      setCancelError(
        e?.message ??
          'Pesanan tidak dapat dibatalkan. Kemungkinan kasir telah mengonfirmasi atau pesanan telah diproses.'
      );
      // Muat ulang data terbaru jika status sudah berubah
      fetchDetail(true);
    } finally {
      setCancelling(false);
    }
  };

  // -----------------------------------------------------------------
  // Helper Format Waktu
  // -----------------------------------------------------------------
  const formatDateTime = (isoDate?: string | null) => {
    if (!isoDate) return '-';
    try {
      const d = new Date(isoDate);
      return d.toLocaleString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return String(isoDate);
    }
  };

  // -----------------------------------------------------------------
  // Stepper / Pelacakan Status
  // -----------------------------------------------------------------
  const steps = [
    {
      label: 'Menunggu Konfirmasi Kasir',
      desc: 'Pesanan terkirim, menunggu verifikasi dan konfirmasi kasir.',
    },
    {
      label: 'Dikonfirmasi',
      desc: 'Pesanan telah diterima kasir dan diteruskan ke bagian dapur.',
    },
    {
      label: 'Sedang Diproses',
      desc: 'Barista dan staf dapur sedang meracik dan menyiapkan pesanan.',
    },
    {
      label: 'Selesai',
      desc: 'Pesanan telah selesai dan siap dinikmati di meja Anda.',
    },
  ];

  const getStepIndex = (status: string) => {
    switch (status) {
      case 'Menunggu Konfirmasi Kasir':
        return 0;
      case 'Dikonfirmasi':
        return 1;
      case 'Sedang Diproses':
        return 2;
      case 'Selesai':
        return 3;
      default:
        return 0;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="p-6 max-w-md mx-auto text-center bg-white rounded-2xl shadow-sm border border-[#ece4dc] mt-10">
        <div className="text-red-500 text-3xl mb-2">⚠️</div>
        <p className="text-stone-700 font-semibold mb-4">{error || 'Pesanan tidak ditemukan.'}</p>
        <Button onClick={() => navigate('/pelanggan/riwayat')}>Kembali ke Riwayat</Button>
      </div>
    );
  }

  const isCancelled = order.status === 'Dibatalkan';
  const canCancel = order.status === 'Menunggu Konfirmasi Kasir';
  const activeIndex = getStepIndex(order.status);

  // Ambil field snake_case atau camelCase
  const orderNumber = order.order_number || order.orderNumber || `ORD-${order.id}`;
  const tableNumber = order.table_number || order.tableNumber;
  const isDineIn = order.order_type === 'qr_meja' || !!tableNumber;
  const items = order.items || [];
  const subtotal = order.subtotal ?? 0;
  const discountAmount = order.discount_amount ?? order.discountAmount ?? 0;
  const promoCode = order.promo_code ?? order.promoCode;
  const taxAmount = order.tax_amount ?? order.taxAmount ?? 0;
  const serviceFee = order.service_fee ?? order.serviceFee ?? 0;
  const totalAmount = order.total_amount ?? order.totalAmount ?? 0;

  return (
    <div className="riwayat-detail-wrapper py-6 px-4 max-w-3xl mx-auto space-y-6">
      {/* ─── HEADER & NAVIGASI ─── */}
      <div className="flex items-center justify-between gap-4 border-b border-[#ece4dc] pb-4">
        <div>
          <button
            type="button"
            onClick={() => navigate('/pelanggan/riwayat')}
            className="text-xs text-[#7B4A1E] hover:underline font-semibold flex items-center gap-1 mb-1"
          >
            ← Kembali ke Riwayat
          </button>
          <h1 className="text-xl md:text-2xl font-black text-[#2C1008] tracking-tight">
            Tiket Pesanan: <span className="text-[#7B4A1E]">#{orderNumber}</span>
          </h1>
          <p className="text-xs text-stone-500">
            Dipesan pada: {formatDateTime(order.created_at || order.createdAt)}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <StatusBadge status={order.status} />
          <button
            type="button"
            disabled={refreshing}
            onClick={() => fetchDetail(true)}
            className="text-xs text-stone-500 hover:text-[#7B4A1E] transition-colors"
          >
            {refreshing ? 'Memperbarui...' : '🔄 Segarkan'}
          </button>
        </div>
      </div>

      {/* ─── ALERT FEEDBACK ─── */}
      {cancelSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-sm flex items-center justify-between">
          <span>✓ {cancelSuccess}</span>
          <button
            type="button"
            onClick={() => setCancelSuccess('')}
            className="font-bold text-emerald-900"
          >
            ✕
          </button>
        </div>
      )}

      {cancelError && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl text-sm flex items-center justify-between">
          <span>⚠️ {cancelError}</span>
          <button
            type="button"
            onClick={() => setCancelError('')}
            className="font-bold text-rose-900"
          >
            ✕
          </button>
        </div>
      )}

      {/* ─── STATUS ALERT BOX KHUSUS DIBATALKAN ─── */}
      {isCancelled ? (
        <div className="bg-rose-50 border-l-4 border-rose-600 p-4 rounded-xl shadow-sm">
          <div className="flex items-center gap-2 text-rose-800 font-bold text-base">
            <span>✕</span>
            <span>Pesanan Ini Telah Dibatalkan</span>
          </div>
          <p className="text-xs text-rose-700 mt-1">
            Pesanan dibatalkan sebelum konfirmasi kasir. Pembayaran tidak diproses lebih lanjut.
            {order.cancelled_at && ` (Waktu pembatalan: ${formatDateTime(order.cancelled_at)})`}
          </p>
        </div>
      ) : canCancel ? (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="text-amber-900 font-bold text-sm">Menunggu Konfirmasi Kasir</div>
            <div className="text-xs text-amber-700 mt-0.5">
              Kasir sedang memverifikasi pesanan Anda. Anda masih dapat membatalkan pesanan secara mandiri jika diperlukan.
            </div>
          </div>
          <Button
            variant="danger-outline"
            size="sm"
            onClick={() => setShowCancelModal(true)}
          >
            Batalkan Pesanan
          </Button>
        </div>
      ) : null}

      {/* ─── KARTU INFORMASI MEJA & PEMESANAN ─── */}
      <div className="bg-white border border-[#ece4dc] rounded-2xl p-5 shadow-sm grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div>
          <span className="text-xs text-stone-500 block">Nomor Meja</span>
          <span className="text-base font-extrabold text-[#7B4A1E]">
            {isDineIn ? (tableNumber || 'Pesan di Meja') : 'Takeaway (Bungkus)'}
          </span>
        </div>
        <div>
          <span className="text-xs text-stone-500 block">Tipe Pesanan</span>
          <span className="text-sm font-bold text-[#2C1008]">
            {isDineIn ? 'Dine In (Meja)' : 'Takeaway (Langsung)'}
          </span>
        </div>
        <div>
          <span className="text-xs text-stone-500 block">Nama Pemesan</span>
          <span className="text-sm font-bold text-[#2C1008] truncate block">
            {order.customer_name || order.customerName || 'Pelanggan'}
          </span>
        </div>
        <div>
          <span className="text-xs text-stone-500 block">Metode Bayar</span>
          <span className="text-sm font-bold text-[#2C1008] uppercase">
            {order.payment_method || order.paymentMethod || 'QRIS'}
          </span>
        </div>
      </div>

      {/* ─── TRACKER / PROGRESS STATUS ("SUDAH DI MANA?") ─── */}
      {!isCancelled && (
        <div className="bg-white border border-[#ece4dc] rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-black text-[#2C1008] flex items-center gap-2">
              <span>📍</span> Status Pengerjaan Pesanan
            </h2>
            <span className="text-xs text-stone-500 font-medium">
              Tahap {activeIndex + 1} dari 4
            </span>
          </div>

          <div className="space-y-6 relative before:absolute before:left-[17px] before:top-2 before:bottom-2 before:w-[2px] before:bg-[#ece4dc]">
            {steps.map((s, idx) => {
              const isDone = idx <= activeIndex;
              const isCurrent = idx === activeIndex;

              return (
                <div key={s.label} className="flex items-start gap-4 relative z-10">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 transition-all ${
                      isDone
                        ? 'bg-[#7B4A1E] text-white shadow'
                        : 'bg-stone-100 text-stone-400 border border-stone-300'
                    } ${isCurrent ? 'ring-4 ring-[#7B4A1E]/20 animate-pulse' : ''}`}
                  >
                    {isDone ? '✓' : idx + 1}
                  </div>
                  <div className="pt-0.5">
                    <div
                      className={`font-bold text-sm ${
                        isDone ? 'text-[#2C1008]' : 'text-stone-400'
                      }`}
                    >
                      {s.label}
                    </div>
                    <div className="text-xs text-stone-500 mt-0.5">{s.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── DAFTAR ITEM PESANAN ─── */}
      <div className="bg-white border border-[#ece4dc] rounded-2xl p-6 shadow-sm">
        <h2 className="text-base font-black text-[#2C1008] mb-4">
          Rincian Menu ({items.length} item)
        </h2>

        <div className="divide-y divide-[#ece4dc]">
          {items.map((item: any, idx: number) => {
            const itemName =
              item.item_name ||
              item.menu_item_name ||
              item.menuItemName ||
              item.productName ||
              item.name ||
              `Item #${idx + 1}`;
            const qty = item.quantity || 1;
            const price = item.price ?? 0;
            const lineSubtotal = item.subtotal ?? qty * price;
            const notes = item.notes || item.custom_notes;

            return (
              <div key={item.id || idx} className="py-3 flex justify-between items-start gap-3">
                <div className="flex-1">
                  <div className="font-bold text-[#2C1008] text-sm">{itemName}</div>
                  <div className="text-xs text-stone-500">
                    {qty} × {formatRupiah(price)}
                  </div>
                  {notes && (
                    <div className="text-xs text-[#7B4A1E] bg-[#fbf5ee] px-2 py-0.5 rounded mt-1 inline-block italic">
                      Catatan: {notes}
                    </div>
                  )}
                </div>
                <div className="text-sm font-bold text-[#2C1008]">
                  <RupiahText amount={lineSubtotal} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── RINCIAN PEMBAYARAN ─── */}
      <div className="bg-white border border-[#ece4dc] rounded-2xl p-6 shadow-sm space-y-3">
        <h2 className="text-base font-black text-[#2C1008] mb-2">Ringkasan Pembayaran</h2>

        <div className="flex justify-between text-sm text-stone-600">
          <span>Subtotal Pesanan</span>
          <RupiahText amount={subtotal} />
        </div>

        {discountAmount > 0 && (
          <div className="flex justify-between text-sm text-emerald-600 font-semibold">
            <span>Diskon Kupon {promoCode ? `(${promoCode})` : ''}</span>
            <span>-{formatRupiah(discountAmount)}</span>
          </div>
        )}

        <div className="flex justify-between text-sm text-stone-600">
          <span>Pajak Restoran (10%)</span>
          <RupiahText amount={taxAmount} />
        </div>

        <div className="flex justify-between text-sm text-stone-600">
          <span>Biaya Layanan (5%)</span>
          <RupiahText amount={serviceFee} />
        </div>

        <div className="border-t border-[#ece4dc] pt-3 flex justify-between items-center">
          <div>
            <span className="text-base font-extrabold text-[#2C1008] block">Total Pembayaran</span>
            <span className="text-xs text-stone-500">
              Status: <strong className="text-emerald-700">{order.payment_status || 'Berhasil (Simulasi)'}</strong>
            </span>
          </div>
          <span className="text-xl font-black text-[#7B4A1E]">
            <RupiahText amount={totalAmount} />
          </span>
        </div>
      </div>

      {/* ─── TOMBOL AKSI BAWAH ─── */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        {canCancel && (
          <Button
            variant="danger"
            className="flex-1"
            onClick={() => setShowCancelModal(true)}
          >
            Batalkan Pesanan
          </Button>
        )}
        <button
          type="button"
          onClick={() => navigate('/pelanggan/products')}
          className="flex-1 bg-[#7B4A1E] hover:bg-[#3B1A0A] text-white py-3 rounded-full font-bold text-sm transition-all shadow text-center"
        >
          + Pesan Menu Lain
        </button>
        <button
          type="button"
          onClick={() => navigate('/pelanggan/riwayat')}
          className="flex-1 bg-[#e6dfd8] hover:bg-[#dbd2c8] text-[#2C1008] py-3 rounded-full font-bold text-sm transition-all text-center"
        >
          Ke Riwayat Pesanan
        </button>
      </div>

      {/* ─── MODAL KONFIRMASI PEMBATALAN MANDIRI (FR-15 & BR-03) ─── */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#ece4dc] space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-xl font-bold mx-auto">
              ⚠️
            </div>
            <div className="text-center">
              <h3 className="text-lg font-black text-[#2C1008]">Batalkan Pesanan Ini?</h3>
              <p className="text-sm text-stone-600 mt-2">
                Pesanan <strong>#{orderNumber}</strong> ({tableNumber || 'Takeaway'}) akan dibatalkan.
                Tindakan ini tidak dapat diurungkan.
              </p>
            </div>

            {cancelError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-lg text-xs">
                {cancelError}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                disabled={cancelling}
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelError('');
                }}
                className="flex-1 py-2.5 px-4 rounded-full border border-stone-300 text-stone-700 font-bold text-sm hover:bg-stone-100 transition-all"
              >
                Kembali
              </button>
              <button
                type="button"
                disabled={cancelling}
                onClick={handleCancelOrder}
                className="flex-1 py-2.5 px-4 rounded-full bg-rose-600 text-white font-bold text-sm hover:bg-rose-700 transition-all shadow disabled:opacity-50"
              >
                {cancelling ? 'Membatalkan...' : 'Ya, Batalkan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
