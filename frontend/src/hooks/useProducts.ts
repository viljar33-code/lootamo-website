import { useState, useEffect, useCallback } from 'react';
import { Product, ProductsParams } from '@/types/product';
import { productService } from '@/services/productService';

interface UseProductsOptions extends ProductsParams {
  enabled?: boolean;
}

interface UseProductsReturn {
  products: Product[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  totalProducts: number;
  refetch: () => void;
  loadMore: () => void;
}

export const useProducts = (options: UseProductsOptions = {}): UseProductsReturn => {
  const { enabled = true, ...params } = options;
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [totalProducts, setTotalProducts] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);

  const itemsPerPage = params.limit || 20;

  const fetchProducts = useCallback(async (page: number = 0, append: boolean = false) => {
    if (!enabled) return;

    try {
      setLoading(true);
      setError(null);

      const response = await productService.getProducts({
        ...params,
        skip: page * itemsPerPage,
        limit: itemsPerPage,
      });

      if (append) {
        setProducts(prev => [...prev, ...response.products]);
      } else {
        setProducts(response.products);
      }

      setTotalProducts(response.total);
      setHasMore(response.products.length === itemsPerPage && (page + 1) * itemsPerPage < response.total);
      setCurrentPage(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch products');
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  }, [enabled, params, itemsPerPage]);

  const refetch = () => {
    setCurrentPage(0);
    fetchProducts(0, false);
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchProducts(currentPage + 1, true);
    }
  };

  useEffect(() => {
    if (enabled) {
      fetchProducts(0, false);
    }
  }, [enabled, fetchProducts]);

  return {
    products,
    loading,
    error,
    hasMore,
    totalProducts,
    refetch,
    loadMore,
  };
};
