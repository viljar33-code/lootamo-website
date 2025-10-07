import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import ProductCard from './ProductCard';
import { Product, ProductsParams } from '@/types/product';
import { productService } from '@/services/productService';

interface ProductListProps {
  title?: string;
  params?: ProductsParams;
  showLoadMore?: boolean;
  className?: string;
  itemsPerPage?: number;
  showTitle?: boolean;
}

const ProductList: React.FC<ProductListProps> = ({ 
  title = "Featured Products", 
  params = {}, 
  showLoadMore = true,
  className = "",
  itemsPerPage = 20,
  showTitle = true
}) => {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);

  const fetchProducts = React.useCallback(async (page: number = 0, append: boolean = false) => {
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
  }, [params, itemsPerPage]);

  useEffect(() => {
    fetchProducts(0, false);
  }, [fetchProducts]);

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      fetchProducts(currentPage + 1, true);
    }
  };

  const handleProductClick = (product: Product) => {
    router.push(`/products/${product.id}`);
  };

  if (loading && products.length === 0) {
    return (
      <div className={`${className}`}>
        {showTitle && <h2 className="text-2xl font-bold text-gray-900 mb-6">{title}</h2>}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="bg-gray-200 rounded-lg h-80 animate-pulse">
              <div className="h-48 bg-gray-300 rounded-t-lg"></div>
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                <div className="h-8 bg-gray-300 rounded w-full"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${className}`}>
        {showTitle && <h2 className="text-2xl font-bold text-gray-900 mb-6">{title}</h2>}
        <div className="text-center py-12">
          <div className="text-red-500 text-lg mb-4">
            ⚠️ Error loading products
          </div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => fetchProducts(0, false)}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className={`${className}`}>
        {showTitle && <h2 className="text-2xl font-bold text-gray-900 mb-6">{title}</h2>}
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg mb-4">
            🎮 No products found
          </div>
          <p className="text-gray-600">
            Try adjusting your search criteria or check back later.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      {/* Header */}
      {showTitle && (
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          <span className="text-sm text-gray-600">
            Showing {products.length} of {totalProducts} products
          </span>
        </div>
      )}

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onProductClick={handleProductClick}
          />
        ))}
      </div>

      {/* Load More Button */}
      {showLoadMore && hasMore && (
        <div className="text-center mt-8">
          <button
            onClick={handleLoadMore}
            disabled={loading}
            className="bg-blue-600 text-white px-8 py-3 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading...
              </span>
            ) : (
              'Load More Products'
            )}
          </button>
        </div>
      )}

      {/* No More Products Message */}
      {!hasMore && products.length > 0 && (
        <div className="text-center mt-8 text-gray-600">
          You&apos;ve reached the end of the product list
        </div>
      )}
    </div>
  );
};

export default ProductList;
