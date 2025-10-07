import { Product, ProductsResponse, ProductsParams } from '@/types/product';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';

export class ProductService {
  private static instance: ProductService;
  private baseURL: string;

  private constructor() {
    this.baseURL = API_BASE_URL;
  }

  public static getInstance(): ProductService {
    if (!ProductService.instance) {
      ProductService.instance = new ProductService();
    }
    return ProductService.instance;
  }

  async getProducts(params: ProductsParams = {}): Promise<ProductsResponse> {
    const {
      skip = 0,
      limit = 100,
      search,
      category,
      min_price,
      max_price
    } = params;

    const searchParams = new URLSearchParams();
    searchParams.append('skip', skip.toString());
    searchParams.append('limit', limit.toString());
    
    if (search && search.trim()) searchParams.append('search', search.trim());
    if (category && category.trim()) searchParams.append('category', category.trim());
    if (min_price !== undefined && min_price >= 0) searchParams.append('min_price', min_price.toString());
    if (max_price !== undefined && max_price >= 0) searchParams.append('max_price', max_price.toString());

    const url = `${this.baseURL}/products/?${searchParams.toString()}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          url: url,
          body: errorText
        });
        throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        products: data.products || [],
        total: data.total || 0,
        skip: data.skip || 0,
        limit: data.limit || 0,
      };
    } catch (error) {
      console.error('Error fetching products:', {
        error: error instanceof Error ? error.message : error,
        url: url,
        params: params
      });
      throw error;
    }
  }

  async getProduct(id: string): Promise<Product> {
    const url = `${this.baseURL}/products/${id}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          url: url,
          body: errorText
        });
        throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching product:', {
        error: error instanceof Error ? error.message : error,
        url: url,
        productId: id
      });
      throw error;
    }
  }

  async searchProducts(query: string, params: Omit<ProductsParams, 'search'> = {}): Promise<ProductsResponse> {
    return this.getProducts({ ...params, search: query });
  }

  async getProductsByCategory(category: string, params: Omit<ProductsParams, 'category'> = {}): Promise<ProductsResponse> {
    return this.getProducts({ ...params, category });
  }
}

// Export singleton instance
export const productService = ProductService.getInstance();
