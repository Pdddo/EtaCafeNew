// ============================================================
// HALAMAN : RiwayatPage
// PERAN   : pelanggan
// ROUTE   : /pelanggan/riwayat
// REF SRS : FR-11
// PIC     : (isi nama pengerjanya)
//
// ATURAN (baca sebelum mengerjakan, juga jika memakai AI):
// 1. Panggil backend HANYA lewat fungsi di src/api/*.ts, jangan fetch langsung di sini.
// 2. Gunakan tipe dari src/types/index.ts, jangan buat tipe ganda.
// 3. Status pesanan HANYA dari src/constants/orderStatus.ts, jangan tulis string sendiri.
// 4. Pakai komponen di src/components/common sebelum membuat komponen baru.
// 5. Jangan membuat folder atau file di luar struktur ini tanpa persetujuan tim.
// 6. Hanya React + TypeScript, tanpa HTML/JS terpisah.
// 7. Tampilan harus konsisten (layout, warna, tipografi) dengan halaman lain.
// ============================================================

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "@/components/common/Button";
import StatusBadge from "@/components/common/StatusBadge";
import RupiahText from "@/components/common/RupiahText";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import PelangganAPI from "@/api/pelanggan";
import type { Order, OrderStatus } from "@/types";

/**
 * RiwayatPage – menampilkan list semua pesanan pelanggan.
 * Setiap baris menampilkan nomor order, tanggal, total, status,
 * serta tombol “Lihat Detail” yang menavigasi ke /pelanggan/riwayat/:id.
 */
export default function RiwayatPage() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  // -----------------------------------------------------------------
  // Ambil riwayat dari backend saat komponen mount
  // -----------------------------------------------------------------
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await PelangganAPI.getOrderHistory();
        setOrders(data);
      } catch (e: any) {
        console.error(e);
        setError(e?.message ?? "Gagal memuat riwayat pesanan.");
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  // -----------------------------------------------------------------
  // Helper: format tanggal (menggunakan Intl)
  // -----------------------------------------------------------------
  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // -----------------------------------------------------------------
  // UI render
  // -----------------------------------------------------------------
  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-600">
        <p>{error}</p>
        <Button onClick={() => navigate(-1)} className="mt-2">
          Kembali
        </Button>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-gray-600">Anda belum memiliki riwayat pesanan.</p>
        <Button onClick={() => navigate('/pelanggan/home')} className="mt-2">
          Kembali ke Beranda
        </Button>
      </div>
    );
  }

  return (
    <div className="riwayat-page-wrapper p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Riwayat Pesanan</h1>

      <div className="space-y-4">
        {orders.map((order) => (
          <div
            key={order.id}
            className="order-card p-4 border rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center bg-white shadow-sm"
          >
            <div className="flex-1">
              <p className="font-medium">
                Order <span className="text-primary">#{order.orderNumber ?? order.id}</span>
              </p>
              <p className="text-sm text-gray-500">{formatDate(order.createdAt)}</p>
            </div>

            <div className="flex-1 mt-2 md:mt-0 md:text-center">
              <RupiahText amount={order.totalAmount ?? order.subtotal} />
            </div>

            <div className="flex-1 mt-2 md:mt-0 text-center">
              <StatusBadge status={order.status as OrderStatus} />
            </div>

            <div className="mt-2 md:mt-0">
              <Button
                variant="secondary"
                onClick={() => navigate(`/pelanggan/riwayat/${order.id}`)}
              >
                Lihat Detail
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
