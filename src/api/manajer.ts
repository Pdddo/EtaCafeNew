// API manajer : Kumpulan fungsi pemanggil endpoint backend /api/v1/manajer
// Sistem Manajemen Pesanan Restoran/Kafe - EtaCafe

import { request, API_BASE_URL, getAuthToken } from './client';
import type { MenuItem, Category, User, Promo } from '../types';

export interface ManajerMenuItem {
  id: number | string;
  name: string;
  category_id?: number;
  category?: string;
  category_rel?: { id: number; name: string; slug: string };
  price: number;
  description?: string;
  image_url?: string;
  imageUrl?: string;
  is_available?: boolean;
  isAvailable?: boolean;
}

export interface ManajerCategory {
  id: number | string;
  name: string;
  slug: string;
}

export interface ManajerUser {
  id: number | string;
  name: string;
  email_or_phone: string;
  emailOrPhone?: string;
  role: 'pelanggan' | 'kasir' | 'dapur' | 'manajer' | string;
  created_at?: string;
  createdAt?: string;
}

export interface ManajerPromo {
  id: number | string;
  code: string;
  description: string;
  discount_type: 'percentage' | 'fixed' | string;
  discount_value: number;
  min_order?: number;
  is_active: boolean;
}

export interface SalesReportSummary {
  period: 'harian' | 'mingguan' | 'bulanan' | string;
  total_orders_completed: number;
  total_revenue: number;
  average_order_value: number;
  top_selling_items: Array<{
    name?: string;
    item_name?: string;
    sold?: number;
    total_quantity_sold?: number;
    sales?: number;
    total_sales_amount?: number;
  }>;
}

// ================= 1. MENU =================
export async function getMenus(): Promise<ManajerMenuItem[]> {
  return request<ManajerMenuItem[]>('/manajer/menus');
}

export async function createMenu(payload: {
  name: string;
  category_id: number;
  price: number;
  description?: string;
  image_url?: string;
  is_available?: boolean;
}): Promise<ManajerMenuItem> {
  return request<ManajerMenuItem>('/manajer/menus', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateMenu(
  menuId: number | string,
  payload: {
    name?: string;
    category_id?: number;
    price?: number;
    description?: string;
    image_url?: string;
    is_available?: boolean;
  }
): Promise<ManajerMenuItem> {
  return request<ManajerMenuItem>(`/manajer/menus/${menuId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function toggleMenuAvailability(
  menuId: number | string,
  isAvailable: boolean
): Promise<ManajerMenuItem> {
  return request<ManajerMenuItem>(
    `/manajer/menus/${menuId}/availability?is_available=${isAvailable}`,
    {
      method: 'PATCH',
    }
  );
}

export async function deleteMenu(menuId: number | string): Promise<any> {
  return request(`/manajer/menus/${menuId}`, {
    method: 'DELETE',
  });
}

// ================= 2. KATEGORI =================
export async function getCategories(): Promise<ManajerCategory[]> {
  return request<ManajerCategory[]>('/manajer/categories');
}

export async function createCategory(payload: {
  name: string;
  slug: string;
}): Promise<ManajerCategory> {
  return request<ManajerCategory>('/manajer/categories', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateCategory(
  categoryId: number | string,
  payload: { name: string; slug: string }
): Promise<ManajerCategory> {
  return request<ManajerCategory>(`/manajer/categories/${categoryId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteCategory(categoryId: number | string): Promise<any> {
  return request(`/manajer/categories/${categoryId}`, {
    method: 'DELETE',
  });
}

// ================= 3. PENGGUNA =================
export async function getUsers(): Promise<ManajerUser[]> {
  return request<ManajerUser[]>('/manajer/users');
}

export async function createUser(payload: {
  name: string;
  email_or_phone: string;
  password: string;
  role: 'pelanggan' | 'kasir' | 'dapur' | 'manajer';
}): Promise<ManajerUser> {
  return request<ManajerUser>('/manajer/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function deleteUser(userId: number | string): Promise<any> {
  return request(`/manajer/users/${userId}`, {
    method: 'DELETE',
  });
}

// ================= 4. PROMO =================
export async function getPromos(): Promise<ManajerPromo[]> {
  return request<ManajerPromo[]>('/manajer/promos');
}

export async function createPromo(payload: {
  code: string;
  description: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order?: number;
  is_active?: boolean;
}): Promise<ManajerPromo> {
  return request<ManajerPromo>('/manajer/promos', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updatePromo(
  promoId: number | string,
  payload: {
    code?: string;
    description?: string;
    discount_type?: 'percentage' | 'fixed';
    discount_value?: number;
    min_order?: number;
    is_active?: boolean;
  }
): Promise<ManajerPromo> {
  return request<ManajerPromo>(`/manajer/promos/${promoId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function togglePromo(promoId: number | string): Promise<ManajerPromo> {
  return request<ManajerPromo>(`/manajer/promos/${promoId}/toggle`, {
    method: 'PATCH',
  });
}

export async function deletePromo(promoId: number | string): Promise<any> {
  return request(`/manajer/promos/${promoId}`, {
    method: 'DELETE',
  });
}

// ================= 5. LAPORAN =================
export async function getSalesSummary(
  period: 'harian' | 'mingguan' | 'bulanan' = 'harian'
): Promise<SalesReportSummary> {
  return request<SalesReportSummary>(`/manajer/reports/summary?period=${period}`);
}

export async function downloadSalesCsv(): Promise<void> {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE_URL}/manajer/reports/export-csv`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error('Gagal mengunduh laporan CSV');
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `laporan_penjualan_etacafe_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

export const ManajerAPI = {
  getMenus,
  createMenu,
  updateMenu,
  toggleAvailability: toggleMenuAvailability,
  deleteMenu,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getUsers,
  createUser,
  deleteUser,
  getPromos,
  createPromo,
  updatePromo,
  togglePromo,
  deletePromo,
  getSalesSummary,
  downloadSalesCsv,
};

export default ManajerAPI;
