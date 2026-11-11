// Status pesanan: HARUS sama dengan ENUM current_status di database (SRS Fase 2).
export const ORDER_STATUS = {
  MENUNGGU_KONFIRMASI_KASIR: 'MENUNGGU_KONFIRMASI_KASIR',
  DIKONFIRMASI: 'DIKONFIRMASI',
  SEDANG_DIPROSES: 'SEDANG_DIPROSES',
  SELESAI: 'SELESAI',
  DIBATALKAN: 'DIBATALKAN',
} as const;

export type OrderStatus = typeof ORDER_STATUS[keyof typeof ORDER_STATUS];

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  MENUNGGU_KONFIRMASI_KASIR: 'Menunggu Konfirmasi Kasir',
  DIKONFIRMASI: 'Dikonfirmasi',
  SEDANG_DIPROSES: 'Sedang Diproses',
  SELESAI: 'Selesai',
  DIBATALKAN: 'Dibatalkan',
};

// Metode pemesanan: sama dengan ENUM order_type di database.
export const ORDER_TYPE = {
  DINE_IN: 'DINE_IN',
  TAKEAWAY: 'TAKEAWAY',
  QR_TABLE: 'QR_TABLE',
} as const;

export type OrderType = typeof ORDER_TYPE[keyof typeof ORDER_TYPE];

// Role pengguna: sama dengan ENUM role di database.
export type UserRole = 'PELANGGAN' | 'KASIR' | 'DAPUR' | 'MANAJER';
