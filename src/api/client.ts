/**
 * EtaCafe API Client
 * Berkomunikasi dengan REST API FastAPI di http://localhost:8000/api/v1
 */

export const API_BASE_URL = '/api/v1';

// Helper to retrieve auth token
export const getAuthToken = (): string => {
  return localStorage.getItem('etacafe_token') || '';
};

// Helper to clear auth
export const clearAuth = () => {
  localStorage.removeItem('etacafe_token');
  localStorage.removeItem('etacafe_user');
  window.location.href = '/login';
};

// Generic fetch helper
export async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getAuthToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options?.headers as Record<string, string>) || {}),
  };

  const response = await fetch(url, { ...options, headers });

  // Jika 401, token expired atau invalid → logout otomatis
  if (response.status === 401) {
    clearAuth();
    throw new Error('Sesi kadaluarsa. Silakan login kembali.');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}

// ================= API ENDPOINTS: ROLE PELANGGAN =================
export const PelangganAPI = {
  getMenu: (kategoriId?: number, search?: string) => {
    const query = new URLSearchParams();
    if (kategoriId) query.append('kategori_id', String(kategoriId));
    if (search) query.append('search', search);
    const qs = query.toString();
    return request(`/pelanggan/menu${qs ? `?${qs}` : ''}`);
  },
  getDetailMenu: (menuId: number) => request(`/pelanggan/menu/${menuId}`),
  checkoutOrder: (orderPayload: any) =>
    request('/pelanggan/orders', { method: 'POST', body: JSON.stringify(orderPayload) }),
  getOrderStatus: (orderId: number) => request(`/pelanggan/orders/${orderId}/status`),
  cancelOrder: (orderId: number) => request(`/pelanggan/orders/${orderId}/cancel`, { method: 'POST' }),
  // Reuse kasir receipt endpoint
  getReceipt: (orderId: number) => request(`/kasir/orders/${orderId}/receipt`),
};

// ================= API ENDPOINTS: ROLE KASIR =================
export const KasirAPI = {
  getPendingOrders: () => request<any[]>('/kasir/orders/queue'),
  getOrders: (statusFilter?: string) =>
    request<any[]>(statusFilter ? `/kasir/orders/queue?status_filter=${statusFilter}` : '/kasir/orders/queue'),
  getOrderDetail: (orderId: number | string) => request<any>(`/kasir/orders/${orderId}`),
  confirmOrder: (orderId: number | string) =>
    request<any>(`/kasir/orders/${orderId}/confirm`, { method: 'POST' }),
  getCategories: () => request<any[]>('/pelanggan/categories'),
  getMenu: (kategoriId?: number, search?: string) => {
    const query = new URLSearchParams();
    if (kategoriId) query.append('kategori_id', String(kategoriId));
    if (search) query.append('search', search);
    const qs = query.toString();
    return request<any[]>(`/pelanggan/menu${qs ? `?${qs}` : ''}`);
  },
  createOrder: (orderPayload: any) =>
    request<any>('/pelanggan/orders', { method: 'POST', body: JSON.stringify(orderPayload) }),
  getReceipt: (orderId: number | string) => request<any>(`/kasir/orders/${orderId}/receipt`),
};

// ================= API ENDPOINTS: ROLE DAPUR =================
export const DapurAPI = {
  getKitchenQueue: () => request('/dapur/orders/queue'),
  getOrderDetail: (orderId: number) => request(`/dapur/orders/${orderId}`),
  startProcessing: (orderId: number) =>
    request(`/dapur/orders/${orderId}/start-processing`, { method: 'PATCH' }),
  completeOrder: (orderId: number) =>
    request(`/dapur/orders/${orderId}/complete`, { method: 'PATCH' }),
  // Receipt endpoint is same as kasir
  getReceipt: (orderId: number) => request(`/kasir/orders/${orderId}/receipt`),
};

// ================= API ENDPOINTS: ROLE MANAJER =================
export const ManajerAPI = {
  // Menu
  getMenus: () => request('/manajer/menus'),
  createMenu: (menuData: any) => request('/manajer/menus', { method: 'POST', body: JSON.stringify(menuData) }),
  updateMenu: (menuId: number, menuData: any) => request(`/manajer/menus/${menuId}`, { method: 'PUT', body: JSON.stringify(menuData) }),
  toggleAvailability: (menuId: number, isAvailable: boolean) =>
    request(`/manajer/menus/${menuId}/availability?is_available=${isAvailable}`, { method: 'PATCH' }),
  deleteMenu: (menuId: number) => request(`/manajer/menus/${menuId}`, { method: 'DELETE' }),

  // Kategori
  getCategories: () => request('/manajer/categories'),
  createCategory: (catData: any) => request('/manajer/categories', { method: 'POST', body: JSON.stringify(catData) }),
  deleteCategory: (catId: number) => request(`/manajer/categories/${catId}`, { method: 'DELETE' }),

  // User
  getUsers: () => request('/manajer/users'),
  createUser: (userData: any) => request('/manajer/users', { method: 'POST', body: JSON.stringify(userData) }),
  deleteUser: (userId: number) => request(`/manajer/users/${userId}`, { method: 'DELETE' }),

  // Promo
  getPromos: () => request('/manajer/promos'),
  createPromo: (promoData: any) => request('/manajer/promos', { method: 'POST', body: JSON.stringify(promoData) }),
  togglePromo: (promoId: number) => request(`/manajer/promos/${promoId}/toggle`, { method: 'PATCH' }),
  deletePromo: (promoId: number) => request(`/manajer/promos/${promoId}`, { method: 'DELETE' }),

  // Laporan
  getSalesSummary: (period: 'harian' | 'mingguan' | 'bulanan') =>
    request(`/manajer/reports/summary?period=${period}`),
  // Receipt endpoint for manager (reuses kasir receipt)
  getReceipt: (orderId: number) => request(`/kasir/orders/${orderId}/receipt`),
};
