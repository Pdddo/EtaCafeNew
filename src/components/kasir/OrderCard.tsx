// KOMPONEN : OrderCard (Kasir)
// PERAN    : Kartu pesanan sesuai desain Figma Kasir (Dikonfirmasi Kasir.png)
//            Layout: Kotak Meja di kiri | Detail Pesanan + item list + total + aksi di kanan

import React from 'react';
import RupiahText from '../common/RupiahText';
import StatusBadge from '../common/StatusBadge';
import type { Order } from '../../types';

interface OrderCardProps {
  order: Order;
  onProses?: (orderId: string) => void;
  onLihatStruk?: (orderId: string) => void;
  onDetail?: (orderId: string) => void;
}

export default function OrderCard({ order, onProses, onLihatStruk, onDetail }: OrderCardProps) {
  const o = order as any;
  const tableNo = o.table_number || o.tableNumber || (o.order_type === 'langsung' ? 'Kasir' : '-');
  const orderNum = o.order_number || o.orderNumber || `#${o.id}`;
  const customer = o.customer_name || o.customerName || 'Pelanggan';
  const total = o.total_amount ?? o.totalAmount ?? 0;
  const status = o.status || 'Menunggu Konfirmasi Kasir';
  const items = o.items || [];
  const orderId = String(o.id);

  const isPending = status === 'Menunggu Konfirmasi Kasir' || status === 'MENUNGGU_KONFIRMASI_KASIR';

  return (
    <div className="kasir-order-card">
      {/* Kotak Meja khas Figma */}
      <div className="kasir-order-card-meja">
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: 700 }}>Meja {tableNo}</div>
          <div style={{ fontSize: '12px', opacity: 0.85, marginTop: '4px' }}>{orderNum}</div>
        </div>
      </div>

      {/* Detail Pesanan */}
      <div className="kasir-order-card-detail">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div>
            <h3 style={{ margin: 0 }}>Detail Pesanan</h3>
            <span style={{ fontSize: '13px', color: '#666' }}>Pemesan: <strong>{customer}</strong></span>
          </div>
          <StatusBadge status={status} small />
        </div>

        {/* Item list */}
        <div className="kasir-order-items-list" style={{ marginBottom: '12px' }}>
          {items.map((item: any, idx: number) => {
            const itemName = item.item_name || item.menuItemName || item.nama_menu || 'Menu';
            const itemQty = item.quantity || item.jumlah || 1;
            const itemSubtotal = item.subtotal ?? (item.price * itemQty);
            const notes = item.notes || item.catatan;

            return (
              <div className="kasir-order-item-row" key={item.id || idx}>
                <span className="kasir-order-item-qty">{itemQty}x</span>
                <span className="kasir-order-item-name">
                  {itemName}
                  {notes && (
                    <span style={{ display: 'block', fontSize: '11px', color: '#888', fontStyle: 'italic' }}>
                      ({notes})
                    </span>
                  )}
                </span>
                <span className="kasir-order-item-price">
                  <RupiahText amount={itemSubtotal} />
                </span>
              </div>
            );
          })}
        </div>

        {/* Total */}
        <div className="kasir-order-total-row">
          <span className="kasir-order-item-qty"></span>
          <span className="kasir-order-item-name">Total Pembayaran</span>
          <span className="kasir-order-item-price">
            <RupiahText amount={total} />
          </span>
        </div>

        {/* Action buttons */}
        <div className="kasir-order-actions">
          {isPending ? (
            <button
              type="button"
              className="kasir-order-btn primary"
              onClick={() => onProses?.(orderId)}
              title="Konfirmasi pembayaran dan teruskan ke Dapur"
            >
              Konfirmasi &amp; Kirim ke Dapur
            </button>
          ) : (
            <button
              type="button"
              className="kasir-order-btn"
              onClick={() => (onDetail ? onDetail(orderId) : onProses?.(orderId))}
            >
              Lihat Detail
            </button>
          )}

          <button
            type="button"
            className="kasir-order-btn"
            onClick={() => onLihatStruk?.(orderId)}
            disabled={isPending}
            style={isPending ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
            title={isPending ? 'Struk baru bisa dicetak setelah pesanan dikonfirmasi' : 'Cetak Struk Transaksi'}
          >
            Lihat Struk
          </button>
        </div>
      </div>
    </div>
  );
}
