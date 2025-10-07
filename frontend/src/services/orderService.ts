import { api } from '../utils/api';
import { AxiosError } from 'axios';

export interface OrderItem {
  id: number;
  product_id: string;
  price: number;
  quantity: number;
  g2a_order_id?: string;
  g2a_transaction_id?: string;
  delivered_key?: string;
  status: 'pending' | 'processing' | 'complete' | 'failed';
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: number;
  order_id: number;
  g2a_order_id?: string;
  product_id?: string;
  price?: number;
  total_price: number;
  currency: string;
  status: 'pending' | 'paid' | 'complete' | 'cancelled' | 'expired';
  payment_status: 'pending' | 'paid' | 'failed';
  stripe_payment_intent_id?: string;
  delivered_key?: string;
  created_at: string;
  updated_at: string;
  order_items: OrderItem[];
}

export interface LicenseKeyItem {
  order_item_id: number;
  product_id: string;
  license_key: string;
  g2a_order_id?: string;
  status: string;
}

export interface LicenseKeysResponse {
  order_id: number;
  total_items: number;
  completed_items: number;
  pending_items: number;
  license_keys: LicenseKeyItem[];
  pending_keys: Array<{
    order_item_id: number;
    product_id: string;
    status: string;
    message: string;
  }>;
}

export interface ProductDetails {
  id: string;
  name: string;
  slug: string;
  thumbnail?: string;
  small_image?: string;
  cover_image?: string;
  min_price: number;
  developer?: string;
  publisher?: string;
  platform?: string;
}

class OrderService {
  async getOrder(orderId: number): Promise<Order> {
    try {
      const response = await api.get(`/orders/${orderId}`);
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as AxiosError;
      if (axiosError.response?.status === 404) {
        throw new Error('Order not found');
      }
      if (axiosError.response?.status === 401) {
        throw new Error('Unauthorized access');
      }
      throw new Error('Failed to fetch order details');
    }
  }

  async getOrderLicenseKeys(orderId: number): Promise<LicenseKeysResponse> {
    try {
      const response = await api.get(`/payments/orders/${orderId}/license-keys`);
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as AxiosError;
      if (axiosError.response?.status === 404) {
        throw new Error('Order not found');
      }
      if (axiosError.response?.status === 400) {
        const errorData = axiosError.response?.data as { detail?: string };
        throw new Error(errorData?.detail || 'Order not paid yet');
      }
      if (axiosError.response?.status === 401) {
        throw new Error('Unauthorized access');
      }
      throw new Error('Failed to fetch license keys');
    }
  }

  async getOrderDetails(orderId: number): Promise<Order> {
    try {
      const response = await api.get(`/payments/orders/${orderId}/details`);
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as AxiosError;
      if (axiosError.response?.status === 404) {
        throw new Error('Order not found');
      }
      if (axiosError.response?.status === 401) {
        throw new Error('Unauthorized access');
      }
      throw new Error('Failed to fetch order details');
    }
  }

  async getProductDetails(productId: string): Promise<ProductDetails> {
    try {
      const response = await api.get(`/products/${productId}`);
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as AxiosError;
      if (axiosError.response?.status === 404) {
        throw new Error('Product not found');
      }
      throw new Error('Failed to fetch product details');
    }
  }

  async downloadOrderPDF(orderId: number): Promise<Blob> {
    try {
      const response = await api.get(`/payments/orders/${orderId}/invoice`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as AxiosError;
      if (axiosError.response?.status === 404) {
        throw new Error('Order not found');
      }
      if (axiosError.response?.status === 401) {
        throw new Error('Unauthorized access');
      }
      throw new Error('Failed to download invoice');
    }
  }

  formatOrderStatus(status: string): string {
    const statusMap: { [key: string]: string } = {
      pending: 'Pending',
      paid: 'Paid',
      complete: 'Complete',
      cancelled: 'Cancelled',
      expired: 'Expired',
      processing: 'Processing',
      failed: 'Failed',
    };
    return statusMap[status] || status;
  }

  getStatusColor(status: string): string {
    const colorMap: { [key: string]: string } = {
      pending: 'text-yellow-600 bg-yellow-100',
      paid: 'text-blue-600 bg-blue-100',
      complete: 'text-green-600 bg-green-100',
      cancelled: 'text-red-600 bg-red-100',
      expired: 'text-gray-600 bg-gray-100',
      processing: 'text-blue-600 bg-blue-100',
      failed: 'text-red-600 bg-red-100',
    };
    return colorMap[status] || 'text-gray-600 bg-gray-100';
  }
}

export const orderService = new OrderService();
