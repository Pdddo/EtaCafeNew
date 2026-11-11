// ============================================================
// HALAMAN : SuccessPage
// PERAN   : pelanggan
// ROUTE   : /pelanggan/success
// PIC     : (isi nama pengerjanya)
//
// ATURAN (baca sebelum mengerjakan, juga jika memakai AI):
// 1. Panggil backend HANYA lewat fungsi di src/api/*.ts, jangan fetch langsung di sini.
// 2. Gunakan tipe dari src/types/index.ts, jangan buat tipe ganda.
// 3. Pakai komponen di src/components/common sebelum membuat komponen baru.
// 4. Jangan membuat folder atau file di luar struktur ini tanpa persetujuan tim.
// 5. Hanya React + TypeScript, tanpa HTML/JS terpisah.
// 6. Jangan bungkus dengan PelangganLayout lagi (sudah disediakan oleh PelangganRoute).
// ============================================================

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { formatRupiah } from '../../context/CartContext';
import { PelangganAPI } from '../../api/pelanggan';

export default function SuccessPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const orderData = location.state?.orderData;

  const [order, setOrder] = useState<any>(orderData || {
    id: 101,
    order_number: 'ORD-98213',
    customer_name: 'Pelanggan',
    table_number: 'Meja 1',
    total_amount: 38000,
    status: 'Menunggu Konfirmasi Kasir',
    items: [],
    created_at: new Date().toISOString(),
  });

  const [currentStatus, setCurrentStatus] = useState<string>(order.status || 'Menunggu Konfirmasi Kasir');

  // Real-time status polling simulation / check
  useEffect(() => {
    if (!order.id) return;
    const interval = setInterval(async () => {
      try {
        const res = await PelangganAPI.getOrderStatus(order.id);
        if (res && res.status) {
          setCurrentStatus(res.status);
        }
      } catch {
        // Abaikan polling error
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [order.id]);

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

  const activeIndex = getStepIndex(currentStatus);

  return (
    <div className="max-w-2xl mx-auto p-6 md:p-10">
        {/* Box Sukses */}
        <div className="bg-[#fbf5ee] border-l-4 border-emerald-600 p-5 rounded-xl mb-8 shadow-sm">
          <div className="flex items-center gap-3 text-emerald-800 font-bold text-lg">
            <span>✓</span>
            <span>Pesanan Berhasil Dikirim ke Kasir!</span>
          </div>
          <div className="text-sm text-stone-600 mt-1">
            Nomor Tiket Pesanan: <strong>{order.order_number || `ORD-${order.id}`}</strong> ({order.table_number || 'Dine In'})
          </div>
        </div>

        {/* Timeline Status */}
        <div className="bg-white border border-[#ece4dc] rounded-2xl p-6 md:p-8 shadow-md mb-8">
          <h2 className="text-lg font-bold text-[#3B1A0A] mb-6">Status Pengerjaan Pesanan</h2>

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

        {/* Detail Pembayaran & Tombol Aksi */}
        <div className="bg-white border border-[#ece4dc] rounded-2xl p-6 shadow-md space-y-4">
          <div className="flex justify-between items-center text-sm font-semibold pb-3 border-b border-[#ece4dc]">
            <span>Total Pembayaran:</span>
            <span className="text-lg font-black text-[#7B4A1E]">
              {formatRupiah(order.total_amount || 0)}
            </span>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              className="flex-1 bg-[#7B4A1E] hover:bg-[#3B1A0A] text-white py-3 rounded-full font-bold text-sm transition-all shadow"
              onClick={() => navigate('/pelanggan/products')}
            >
              + Pesan Menu Tambahan
            </button>
            <button
              type="button"
              className="flex-1 bg-[#dbd6d0] hover:bg-stone-300 text-[#2C1008] py-3 rounded-full font-bold text-sm transition-all"
              onClick={() => navigate('/pelanggan/home')}
            >
              Kembali ke Beranda
            </button>
          </div>
        </div>
      </div>
  );
}
