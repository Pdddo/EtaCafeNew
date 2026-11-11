// API dapur : Kumpulan fungsi pemanggil endpoint backend /api/v1/dapur
// Kitchen Display System - EtaCafe

import { request } from './client';
import type { Order } from '../types';

export async function getKitchenQueue(): Promise<Order[]> {
  return request<Order[]>('/dapur/orders/queue');
}

export async function getOrderDetail(orderId: number | string): Promise<Order> {
  return request<Order>(`/dapur/orders/${orderId}`);
}

export async function startProcessing(orderId: number | string): Promise<Order> {
  return request<Order>(`/dapur/orders/${orderId}/start-processing`, {
    method: 'PATCH',
  });
}

export async function completeOrder(orderId: number | string): Promise<Order> {
  return request<Order>(`/dapur/orders/${orderId}/complete`, {
    method: 'PATCH',
  });
}

export async function getCompletedOrdersToday(targetDate?: string): Promise<Order[]> {
  const query = targetDate ? `?target_date=${encodeURIComponent(targetDate)}` : '';
  return request<Order[]>(`/dapur/orders/completed-today${query}`);
}

export const DapurAPI = {
  getKitchenQueue,
  getOrderDetail,
  startProcessing,
  completeOrder,
  getCompletedOrdersToday,
};

export default DapurAPI;
