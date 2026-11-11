import { request } from './client';

export interface CategoryData {
  id: number;
  name: string;
  slug: string;
}

export interface MenuItemData {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  is_available: boolean;
  category_id: number;
  category?: CategoryData;
}

export interface PromoData {
  id: number;
  code: string;
  description: string;
  discount_type: 'percentage' | 'fixed' | 'persentase' | 'nominal' | string;
  discount_value: number;
  min_order: number;
  is_active: boolean;
}

export interface OrderItemPayload {
  menu_item_id: number;
  quantity: number;
  custom_notes?: string;
}

export interface OrderCreatePayload {
  customer_name: string;
  customer_phone?: string;
  order_type: 'langsung' | 'qr_meja';
  table_number?: string;
  payment_method: 'qris' | 'tunai' | 'kartu';
  promo_code?: string;
  items: OrderItemPayload[];
}

export const PelangganAPI = {
  getCategories: () => request<CategoryData[]>('/pelanggan/categories'),
  getPromos: () => request<PromoData[]>('/pelanggan/promos'),
  getMenu: (kategoriId?: number, search?: string) => {
    const query = new URLSearchParams();
    if (kategoriId) query.append('kategori_id', String(kategoriId));
    if (search) query.append('search', search);
    const qs = query.toString();
    return request<MenuItemData[]>(`/pelanggan/menu${qs ? `?${qs}` : ''}`);
  },
  getDetailMenu: (menuId: number) => request<MenuItemData>(`/pelanggan/menu/${menuId}`),
  checkoutOrder: (payload: OrderCreatePayload) =>
    request<any>('/pelanggan/orders', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getOrderStatus: (orderId: number) => request<any>(`/pelanggan/orders/${orderId}/status`),
  cancelOrder: (orderId: number) =>
    request<any>(`/pelanggan/orders/${orderId}/cancel`, { method: 'POST' }),
  getOrderHistory: (customerPhone?: string) => {
    const query = customerPhone ? `?customer_phone=${customerPhone}` : '';
    return request<any[]>(`/pelanggan/orders/history${query}`);
  },
};

export default PelangganAPI;
