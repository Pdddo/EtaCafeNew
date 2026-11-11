// ============================================================
// HALAMAN : RiwayatDetailPage
// PERAN   : pelanggan
// ROUTE   : /pelanggan/riwayat/:id
// ============================================================

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Button from "@/components/common/Button";
import StatusBadge from "@/components/common/StatusBadge";
import RupiahText from "@/components/common/RupiahText";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import PelangganAPI from "@/api/pelanggan";
import type { Order, OrderStatus } from "@/types";

/**
 * RiwayatDetailPage – menampilkan receipt‑like read‑only view untuk satu order.
 */
export default function RiwayatDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  // -----------------------------------------------------------------
  // Fetch order detail on mount / when id changes
  // -----------------------------------------------------------------
  useEffect(() => {
    if (!id) {
      setError("Tidak ada ID pesanan.");
      setLoading(false);
      return;
    }
    const fetchDetail = async () => {
      try {
        const data = await PelangganAPI.getOrderStatus(Number(id));
        setOrder(data);
      } catch (e: any) {
        console.error(e);
        setError(e?.message ?? "Gagal memuat detail pesanan.");
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  // -----------------------------------------------------------------
  // Helper to render order items
  // -----------------------------------------------------------------
  const renderItems = () => {
    if (!order) return null;
    return order.items.map((item: any) => (
      <div key={item.id} className="flex justify-between py-1 border-b">
        <span>{item.menuItemName ?? item.productName ?? item.name}</span>
        <span>
          {item.quantity} × <RupiahText amount={item.price ?? item.subtotal ?? 0} />
        </span>
      </div>
    ));
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
        <Button onClick={() => navigate(-1)} className="mt-2">Kembali</Button>
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="riwayat-detail-wrapper p-4 max-w-2xl mx-auto bg-white rounded shadow-sm">
      <h1 className="text-2xl font-semibold mb-4">Detail Pesanan #{order.orderNumber ?? order.id}</h1>

      {/* Status & timestamp */}
      <div className="flex items-center justify-between mb-4">
        <StatusBadge status={order.status as OrderStatus} />
        <span className="text-gray-600">
          {new Date(order.createdAt).toLocaleString()}
        </span>
      </div>

      {/* Items */}
      <div className="border-t border-b py-2">{renderItems()}</div>

      {/* Summary */}
      <div className="mt-4 space-y-2">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <RupiahText amount={order.subtotal} />
        </div>
        <div className="flex justify-between">
          <span>Pajak</span>
          <RupiahText amount={order.taxAmount ?? 0} />
        </div>
        <div className="flex justify-between">
          <span>Biaya Layanan</span>
          <RupiahText amount={order.serviceFee ?? 0} />
        </div>
        <hr />
        <div className="flex justify-between font-bold">
          <span>Total</span>
          <RupiahText amount={order.totalAmount ?? 0} />
        </div>
        <div className="flex justify-between">
          <span>Pembayaran</span>
          <span className="capitalize">{order.paymentMethod}</span>
        </div>
      </div>

      <Button variant="secondary" className="mt-6" onClick={() => navigate('/pelanggan/riwayat')}>
        Kembali ke Riwayat
      </Button>
    </div>
  );
}
