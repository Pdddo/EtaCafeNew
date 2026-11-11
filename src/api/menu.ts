// API menu : Kumpulan fungsi pemanggil katalog menu & kategori
// Kompatibilitas untuk import dari src/api/menu

import { PelangganAPI } from './pelanggan';

export const getKatalogMenu = PelangganAPI.getMenu;
export const getDetailMenu = PelangganAPI.getDetailMenu;
export const getKategoriMenu = PelangganAPI.getCategories;

export const MenuAPI = {
  getKatalogMenu,
  getDetailMenu,
  getKategoriMenu,
};

export default MenuAPI;
