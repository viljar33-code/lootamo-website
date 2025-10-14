/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';


export interface CheckoutRequest {
  user_id: number;
  total_price: number;
  currency: string;
  status: string;
  payment_status: string;
  order_items: {
    product_id: string;
    price: number;
    quantity: number;
  }[];
}

export interface CheckoutResponse {
  id: number;
  user_id: number;
  total_price: number;
  currency: string;
  status: string;
  stripe_payment_intent_id: string | null;
  payment_status: string;
  created_at: string;
  updated_at: string;
  order_items: any[];
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: string;
  price: number;
  quantity: number;
  g2a_order_id: string | null;
  g2a_transaction_id: string | null;
  delivered_key: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: number;
  g2a_order_id: string | null;
  product_id: string | null;
  price: number | null;
  total_price: number;
  currency: string;
  status: string;
  payment_status: string;
  stripe_payment_intent_id: string | null;
  delivered_key: string | null;
  created_at: string;
  updated_at: string;
  order_items: OrderItem[];
}

export interface OrderSummaryResponse {
  orders: Order[];
  total: number;
  skip: number;
  limit: number;
}

export interface PaymentIntentRequest {
  order_id: number;
}

export interface PaymentIntentResponse {
  client_secret: string;
  payment_intent_id: string;
  amount: number;
  currency: string;
}

export interface BuyNowRequest {
  product_id: string;
}

export interface BuyNowResponse {
  id: number;
  g2a_order_id: string | null;
  product_id: string;
  price: number;
  total_price: number;
  currency: string;
  status: string;
  payment_status: string;
  stripe_payment_intent_id: string | null;
  delivered_key: string | null;
  created_at: string;
  updated_at: string;
  order_items: OrderItem[];
}

class CheckoutService {
    private getAuthHeaders() {
        const token = localStorage.getItem('access_token');
        return {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        };
      }
    
      private isAuthError(status: number): boolean {
        return status === 401 || status === 403;
      }
    
      private handleAuthError() {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login';
        }
      }

  async checkoutCart(data: CheckoutRequest): Promise<CheckoutResponse> {
    const response = await axios.post(
      `${API_BASE_URL}/orders/checkout-cart`,
      data,
      { headers: this.getAuthHeaders() }
    );
    return response.data;
  }

  async getOrderById(orderId: number): Promise<Order> {
    const response = await axios.get(
      `${API_BASE_URL}/orders/${orderId}`,
      { headers: this.getAuthHeaders() }
    );
    return response.data;
  }

  async getOrdersSummary(skip: number = 0, limit: number = 100): Promise<OrderSummaryResponse> {
    const response = await axios.get(
      `${API_BASE_URL}/orders/?skip=${skip}&limit=${limit}`,
      { headers: this.getAuthHeaders() }
    );
    return response.data;
  }

  async createPaymentIntent(data: PaymentIntentRequest): Promise<PaymentIntentResponse> {
    const response = await axios.post(
      `${API_BASE_URL}/payments/intent`,
      data,
      { headers: this.getAuthHeaders() }
    );
    return response.data;
  }

  async buyNow(data: BuyNowRequest): Promise<BuyNowResponse> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/orders/`,
        data,
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error: any) {
      if (error.response && this.isAuthError(error.response.status)) {
        this.handleAuthError();
      }
      throw error;
    }
  }
}

export const checkoutService = new CheckoutService();
