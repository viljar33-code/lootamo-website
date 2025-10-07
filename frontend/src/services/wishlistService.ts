import { api } from '@/utils/api';

export interface WishlistItem {
  id: number;
  product_id: string;
  created_at: string;
  product?: {
    id: string;
    name: string;
    slug: string;
    type: string;
    qty: number;
    min_price: number;
    retail_min_price: number;
    retail_min_base_price: number;
    available_to_buy: boolean;
    thumbnail: string;
    small_image: string;
    cover_image: string;
    updated_at: string;
    release_date: string;
    region?: string;
    developer: string;
    publisher: string;
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

export interface WishlistResponse {
  items: WishlistItem[];
  total: number;
  skip: number;
  limit: number;
}

export interface WishlistSummary {
  total_items: number;
  total_estimated_value: number;
  currency: string;
}

export interface WishlistActionResponse {
  success: boolean;
  message: string;
  already_exists?: boolean;
}

export interface WishlistClearResponse {
  success: boolean;
  message: string;
  cleared_count: number;
}

export interface WishlistBulkAddToCartResponse {
  success: boolean;
  message: string;
  added_count: number;
  total_items: number;
  failed_items: Array<{
    product_id: string;
    product_name: string;
    error: string;
  }>;
}

class WishlistService {
  /**
   * Add product to wishlist
   */
  async addToWishlist(productId: string): Promise<WishlistActionResponse> {
    const response = await api.post('/wishlist/add', {
      product_id: productId
    });
    return response.data;
  }

  /**
   * Remove product from wishlist
   */
  async removeFromWishlist(productId: string): Promise<WishlistActionResponse> {
    const response = await api.delete(`/wishlist/${productId}`);
    return response.data;
  }

  /**
   * Get user's wishlist with pagination and search
   */
  async getWishlist(
    skip: number = 0, 
    limit: number = 20, 
    search?: string
  ): Promise<WishlistResponse> {
    const params = new URLSearchParams({
      skip: skip.toString(),
      limit: limit.toString(),
    });
    
    if (search) {
      params.append('search', search);
    }

    const response = await api.get(`/wishlist/?${params.toString()}`);
    return response.data;
  }

  /**
   * Get wishlist summary (count and total value)
   */
  async getWishlistSummary(): Promise<WishlistSummary> {
    const response = await api.get('/wishlist/summary');
    return response.data;
  }

  /**
   * Clear all items from wishlist
   */
  async clearWishlist(): Promise<WishlistClearResponse> {
    const response = await api.delete('/wishlist/clear');
    return response.data;
  }

  /**
   * Add all wishlist items to cart
   */
  async addAllToCart(): Promise<WishlistBulkAddToCartResponse> {
    const response = await api.post('/wishlist/add-all-to-cart');
    return response.data;
  }

  /**
   * Check if product is in wishlist (for offline checking)
   */
  isInWishlistOffline(productId: string, wishlistItems: string[]): boolean {
    return wishlistItems.includes(productId);
  }
}

export const wishlistService = new WishlistService();
export default wishlistService;
