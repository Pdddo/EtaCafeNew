// API pesanan : Kumpulan fungsi pemanggil transaksi pesanan
// Kompatibilitas untuk import dari src/api/pesanan

import { PelangganAPI } from './pelanggan';

export const checkoutPesanan = PelangganAPI.checkoutOrder;
export const lacakStatusPesanan = PelangganAPI.getOrderStatus;
export const batalkanPesanan = PelangganAPI.cancelOrder;
export const riwayatPesanan = PelangganAPI.getOrderHistory;

export const PesananAPI = {
  checkoutPesanan,
  lacakStatusPesanan,
  batalkanPesanan,
  riwayatPesanan,
};

export default PesananAPI;
