const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface CartItem {
  id: number;
  user_id: number;
  product_id: string;
  quantity: number;
  created_at: string;
  updated_at: string;
  product: {
    id: string;
    name: string;
    slug: string;
    type: string;
    qty: number;
    min_price: number;
    retail_min_price?: number;
    retail_min_base_price?: number;
    available_to_buy: boolean;
    thumbnail: string;
    small_image: string;
    cover_image: string;
    updated_at: string;
    release_date?: string;
    region?: string;
    developer?: string;
    publisher?: string;
    platform?: string;
    price_limit: {
      max?: number;
      min?: number;
    };
    categories: Array<{
      id: string;
      name: string;
    }>;
    images: Array<{
      url: string;
    }>;
    videos: Array<{
      url: string;
      video_type: string;
    }>;
    restrictions: {
      pegi_violence: boolean;
      pegi_profanity: boolean;
      pegi_discrimination: boolean;
      pegi_drugs: boolean;
      pegi_fear: boolean;
      pegi_gambling: boolean;
      pegi_online: boolean;
      pegi_sex: boolean;
    };
    requirements: {
      minimal: {
        reqprocessor: string;
        reqgraphics: string;
        reqmemory: string;
        reqdiskspace: string;
        reqsystem: string;
        reqother: string;
      };
      recommended: {
        reqprocessor: string;
        reqgraphics: string;
        reqmemory: string;
        reqdiskspace: string;
        reqsystem: string;
        reqother: string;
      };
    };
  };
}

export interface CartSummary {
  totalItems: number;
  totalValue: number;
  currency: string;
}

export interface CartResponse {
  items: CartItem[];
  total: number;
  skip: number;
  limit: number;
  total_quantity: number;
}

export interface AddToCartRequest {
  product_id: string;
  quantity?: number;
  is_gift?: boolean;
}

export interface UpdateCartRequest {
  quantity: number;
  is_gift?: boolean;
}

export interface UpdateQuantityRequest {
  quantity: number;
}

class CartService {
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

  async addToCart(request: AddToCartRequest): Promise<{ message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/cart/add`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        if (this.isAuthError(response.status)) {
          this.handleAuthError();
          throw new Error('Please log in to add items to cart');
        }
        
        let errorMessage = 'Failed to add item to cart';
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorData.message || errorMessage;
        } catch {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      return response.json();
    } catch (error) {
      console.error('Error in addToCart:', error);
      throw error instanceof Error ? error : new Error('An unknown error occurred');
    }
  }

  async getCartItems(page: number = 1, size: number = 50, search?: string): Promise<CartResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      ...(search && { search }),
    });
  
    try {
      const response = await fetch(`${API_BASE_URL}/cart/?${params}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });
  
      if (!response.ok) {
        let errorMessage = 'Failed to fetch cart items';
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorData.message || errorMessage;
        } catch {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }
  
      return response.json();
    } catch (error) {
      console.error('Error in getCartItems:', error);
      throw error instanceof Error ? error : new Error('An unknown error occurred');
    }
  }

  async getCartSummary(): Promise<CartSummary> {
    try {
      const response = await fetch(`${API_BASE_URL}/cart/summary`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        if (this.isAuthError(response.status)) {
          this.handleAuthError();
          throw new Error('Please log in to view cart summary');
        }
        
        let errorMessage = 'Failed to fetch cart summary';
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorData.message || errorMessage;
        } catch {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      return response.json();
    } catch (error) {
      console.error('Error in getCartSummary:', error);
      throw error instanceof Error ? error : new Error('An unknown error occurred');
    }
  }

  async getCartCount(): Promise<{ count: number }> {
    try {
      const response = await fetch(`${API_BASE_URL}/cart/count`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        if (this.isAuthError(response.status)) {
          return { count: 0 };
        }
        
        let errorMessage = 'Failed to fetch cart count';
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorData.message || errorMessage;
        } catch {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      return response.json();
    } catch (error) {
      console.error('Error in getCartCount:', error);
      return { count: 0 };
    }
  }

  async updateCartItem(productId: string, request: UpdateCartRequest): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/cart/update`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        product_id: productId,
        ...request,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to update cart item');
    }

    return response.json();
  }

  async updateCartQuantity(productId: string, request: UpdateQuantityRequest): Promise<{ message: string }> {
    const params = new URLSearchParams({
      product_id: productId,
    });
    
    const response = await fetch(`${API_BASE_URL}/cart/quantity?${params}`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to update cart quantity');
    }

    return response.json();
  }

  async removeFromCart(productId: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/cart/${productId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to remove item from cart');
    }

    return response.json();
  }

  async removeMultipleFromCart(productIds: string[]): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/cart/bulk-delete`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ product_ids: productIds }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to remove items from cart');
    }

    return response.json();
  }

  async clearCart(): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/cart/clear`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to clear cart');
    }

    return response.json();
  }

  // Admin endpoint
  async getCartStats(): Promise<{
    totalCarts: number;
    totalItems: number;
    totalValue: number;
    averageCartValue: number;
  }> {
    const response = await fetch(`${API_BASE_URL}/cart/stats`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to fetch cart stats');
    }

    return response.json();
  }
}

export const cartService = new CartService();
