// ============================================================
// HALAMAN : SuccessPage
// PERAN   : pelanggan
// ROUTE   : /pelanggan/success
// PIC     : (isi nama pengerjanya)
// ============================================================

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { formatRupiah } from '../../context/CartContext';
import { PelangganAPI } from '../../api/pelanggan';

export default function SuccessPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const orderData = location.state?.orderData;

  const [order, setOrder] = useState<any>(
    orderData || {
      id: 101,
      order_number: 'ORD-98213',
      customer_name: 'Pelanggan',
      table_number: 'Meja 1',
      total_amount: 38000,
      status: 'Menunggu Konfirmasi Kasir',
      items: [],
      created_at: new Date().toISOString(),
    }
  );

  const [currentStatus, setCurrentStatus] = useState<string>(
    order.status || 'Menunggu Konfirmasi Kasir'
  );

  // State untuk modal pembatalan mandiri
  const [showCancelModal, setShowCancelModal] = useState<boolean>(false);
  const [cancelling, setCancelling] = useState<boolean>(false);
  const [cancelError, setCancelError] = useState<string>('');
  const [cancelSuccess, setCancelSuccess] = useState<string>('');

  // Real-time status polling check
  useEffect(() => {
    if (!order.id) return;
    const interval = setInterval(async () => {
      try {
        const res = await PelangganAPI.getOrderStatus(order.id);
        if (res && res.status) {
          setCurrentStatus(res.status);
          setOrder((prev: any) => ({ ...prev, ...res }));
        }
      } catch {
        // Abaikan polling error
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [order.id]);

  const handleCancelOrder = async () => {
    if (!order.id) return;
    setCancelling(true);
    setCancelError('');

    try {
      const res = await PelangganAPI.cancelOrder(order.id);
      setCurrentStatus('Dibatalkan');
      setOrder((prev: any) => ({ ...prev, status: 'Dibatalkan', ...res }));
      setShowCancelModal(false);
      setCancelSuccess('Pesanan Anda berhasil dibatalkan.');
    } catch (e: any) {
      console.error('Gagal membatalkan pesanan:', e);
      setCancelError(
        e?.message ??
          'Pesanan tidak dapat dibatalkan. Kemungkinan kasir telah mengonfirmasi atau pesanan telah diproses dapur.'
      );
    } finally {
      setCancelling(false);
    }
  };

  const steps = [
    { label: 'Menunggu Konfirmasi Kasir', desc: 'Kasir memeriksa pesanan masuk' },
    { label: 'Dikonfirmasi', desc: 'Pesanan diterima dan diteruskan ke dapur' },
    { label: 'Sedang Diproses', desc: 'Barista & Chef sedang menyiapkan pesanan' },
    { label: 'Selesai', desc: 'Pesanan siap diantar ke meja Anda' },
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

  const isCancelled = currentStatus === 'Dibatalkan';
  const canCancel = currentStatus === 'Menunggu Konfirmasi Kasir';
  const activeIndex = getStepIndex(currentStatus);

  const orderNumber = order.order_number || order.orderNumber || `ORD-${order.id}`;
  const tableDisplay = order.table_number || (order.order_type === 'langsung' ? 'Takeaway (Bungkus)' : 'Dine In (Meja)');

  return (
    <div className="max-w-2xl mx-auto p-6 md:p-10 space-y-6">
      {/* ─── FEEDBACK MESSAGES ─── */}
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

      {/* ─── BOX STATUS UTAMA ─── */}
      {isCancelled ? (
        <div className="bg-rose-50 border-l-4 border-rose-600 p-5 rounded-xl shadow-sm">
          <div className="flex items-center gap-3 text-rose-800 font-bold text-lg">
            <span>✕</span>
            <span>Pesanan Telah Dibatalkan</span>
          </div>
          <div className="text-sm text-stone-600 mt-1">
            Nomor Tiket: <strong>#{orderNumber}</strong> ({tableDisplay}). Pembayaran tidak diproses lebih lanjut.
          </div>
        </div>
      ) : (
        <div className="bg-[#fbf5ee] border-l-4 border-emerald-600 p-5 rounded-xl shadow-sm">
          <div className="flex items-center gap-3 text-emerald-800 font-bold text-lg">
            <span>✓</span>
            <span>Pesanan Berhasil Dikirim ke Kasir!</span>
          </div>
          <div className="text-sm text-stone-600 mt-1">
            Nomor Tiket Pesanan: <strong>#{orderNumber}</strong> &bull; Meja: <strong className="text-[#7B4A1E]">{tableDisplay}</strong>
          </div>
        </div>
      )}

      {/* ─── TIMELINE STATUS ─── */}
      {!isCancelled && (
        <div className="bg-white border border-[#ece4dc] rounded-2xl p-6 md:p-8 shadow-md">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-[#3B1A0A]">Status Pengerjaan Pesanan</h2>
            <span className="text-xs text-stone-500 font-medium">Tahap {activeIndex + 1} dari 4</span>
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
                  <div className="pt-1">
                    <div className={`font-bold text-sm ${isDone ? 'text-[#2C1008]' : 'text-stone-400'}`}>
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

      {/* ─── DETAIL PEMBAYARAN & TOMBOL AKSI ─── */}
      <div className="bg-white border border-[#ece4dc] rounded-2xl p-6 shadow-md space-y-4">
        <div className="flex justify-between items-center text-sm font-semibold pb-3 border-b border-[#ece4dc]">
          <span>Total Pembayaran:</span>
          <span className="text-lg font-black text-[#7B4A1E]">
            {formatRupiah(order.total_amount ?? order.totalAmount ?? 0)}
          </span>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          {canCancel && (
            <button
              type="button"
              className="flex-1 bg-rose-600 hover:bg-rose-700 text-white py-3 rounded-full font-bold text-sm transition-all shadow"
              onClick={() => setShowCancelModal(true)}
            >
              Batalkan Pesanan
            </button>
          )}

          <button
            type="button"
            className="flex-1 bg-[#7B4A1E] hover:bg-[#3B1A0A] text-white py-3 rounded-full font-bold text-sm transition-all shadow"
            onClick={() => navigate('/pelanggan/products')}
          >
            + Pesan Menu Lain
          </button>

          <button
            type="button"
            className="flex-1 bg-[#dbd6d0] hover:bg-stone-300 text-[#2C1008] py-3 rounded-full font-bold text-sm transition-all"
            onClick={() => navigate(order.id ? `/pelanggan/riwayat/${order.id}` : '/pelanggan/riwayat')}
          >
            Lihat Rincian Tiket
          </button>
        </div>
      </div>

      {/* ─── MODAL KONFIRMASI PEMBATALAN MANDIRI ─── */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#ece4dc] space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-xl font-bold mx-auto">
              ⚠️
            </div>
            <div className="text-center">
              <h3 className="text-lg font-black text-[#2C1008]">Batalkan Pesanan Ini?</h3>
              <p className="text-sm text-stone-600 mt-2">
                Pesanan <strong>#{orderNumber}</strong> ({tableDisplay}) akan dibatalkan.
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
