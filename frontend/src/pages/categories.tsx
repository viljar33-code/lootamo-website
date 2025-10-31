import Navbar from '@/components/Navbar'
import Topbar from '@/components/Topbar'
import React, { useState, useEffect } from 'react'
import ProductCard from '@/components/ProductCard'

interface Product {
  id: string;
  name: string;
  slug: string;
  type: string;
  qty: number;
  min_price: number;
  retail_min_price: number;
  retail_min_base_price: number;
  available_to_buy: boolean;
  is_active: boolean;
  thumbnail: string;
  small_image: string;
  cover_image: string;
  updated_at: string;
  release_date: string;
  region: string;
  developer: string;
  publisher: string;
  platform: string;
  categories: string[];
  images: string[];
  videos: string[];
}

interface ApiResponse {
  products: Product[];
  total: number;
  skip: number;
  limit: number;
}

const Categories = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Gaming');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async (category?: string) => {
    setLoading(true);
    setError(null);
    try {
      const url = category 
        ? `http://localhost:8080/api/v1/products?category=${encodeURIComponent(category)}`
        : 'http://localhost:8080/api/v1/products';
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      
      const data: ApiResponse = await response.json();
      setProducts(data.products);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(selectedCategory);
  }, [selectedCategory]);

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category);
  };

  return (
    <div className="min-h-screen bg-white">
      <Topbar />
      <Navbar />
      
      <div className="flex">
        {/* Left Sidebar */}
        <div className="w-48 sm:w-56 lg:w-64 bg-white border-r border-gray-200 h-[88vh] overflow-y-auto">
          <div className="p-2 sm:p-3 lg:p-4">
            <h2 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 mb-4">Shop by Category</h2>
            
            {/* Category Navigation */}
            <div className="space-y-1">
              {[
                "Gaming",
                "Gaming Subscriptions",
                "Gaming Gift Cards",
                "Points & Currencies",
                "Music",
                "Shopping",
                "Fighting",
                "Racing",
                "Puzzle",
                "Horror",
                "Action & Shooting",
                "Adventure",
                "Simulator",
                "Arcade",
                "Dance & music",
                "Sports",
                "RPG",
                "Strategy",
                "Kids & family",
                "MMO",
                "Indie",
                "Sandbox",
                "Battle Royale",
                "Fantasy"
              ].map((category, index) => (
                <div 
                  key={index} 
                  onClick={() => handleCategoryClick(category)}
                  className={`flex items-center justify-between py-2 px-2 sm:px-3 text-xs sm:text-sm cursor-pointer rounded ${
                    selectedCategory === category 
                      ? 'bg-blue-50 text-blue-700 border-l-2 border-blue-500' 
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span>{category}</span>
                  <span className="text-gray-400">›</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-3 sm:p-4 lg:p-6 h-[88vh] overflow-y-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">{selectedCategory}</h1>
            <p className="text-gray-600">{products.length} products found</p>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-700">Error: {error}</p>
              <button 
                onClick={() => fetchProducts(selectedCategory)}
                className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Retry
              </button>
            </div>
          )}

          {/* Products Grid */}
          {!loading && !error && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && products.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2v-5m16 0H4m16 0l-2-3H6l-2 3" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-500">No products available in the {selectedCategory} category.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Categories