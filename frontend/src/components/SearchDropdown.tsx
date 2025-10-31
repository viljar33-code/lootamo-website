import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Link from 'next/link';

interface Product {
  id: string;
  name: string;
  min_price: number;
  retail_min_price: number;
  images: Array<{ url: string }>;
  categories: Array<{ name: string }>;
}

interface SearchResponse {
  products: Product[];
  total: number;
}

export default function SearchDropdown() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Debounce search to avoid excessive API calls
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        performSearch(searchQuery);
      } else {
        setSearchResults([]);
        setShowDropdown(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const performSearch = async (query: string) => {
    if (!query.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `http://localhost:8080/api/v1/products?search=${encodeURIComponent(query)}&limit=8`
      );
      
      if (response.ok) {
        const data: SearchResponse = await response.json();
        setSearchResults(data.products || []);
        setShowDropdown(true);
      } else {
        console.error('Search failed:', response.statusText);
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery)}`);
      setShowDropdown(false);
    }
  };

  const handleProductClick = (productId: string) => {
    setShowDropdown(false);
    setSearchQuery('');
    router.push(`/products/${productId}`);
  };

  const formatPrice = (product: Product) => {
    const price = product.retail_min_price || product.min_price || 0;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  return (
    <div className="relative flex-1 px-4" ref={searchRef}>
      <form onSubmit={handleSubmit} className="hidden md:flex items-center gap-2 bg-gray-100 rounded-md px-3 py-2">
        {/* <select 
          aria-label="Category" 
          className="bg-transparent outline-none text-sm"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option>All</option>
          <option>Games</option>
          <option>Software</option>
          <option>Gift Cards</option>
        </select> */}
        
        <input 
          aria-label="Search" 
          type="search" 
          placeholder="Search games, keys, gift cards..." 
          className="flex-1 bg-transparent outline-none text-sm"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => {
            if (searchResults.length > 0) {
              setShowDropdown(true);
            }
          }}
        />
        
        <button type="submit" className="text-sm font-semibold cursor-pointer hover:text-blue-600">
          Search
        </button>
      </form>

      {/* Search Dropdown */}
      {showDropdown && (
        <div className="absolute top-full left-4 right-4 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-sm">Searching...</p>
            </div>
          ) : searchResults.length > 0 ? (
            <>
              <div className="p-3 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-700">
                  Products ({searchResults.length})
                </h3>
              </div>
              
              <div className="py-2">
                {searchResults.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => handleProductClick(product.id)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="w-12 h-12 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                      {product.images && product.images.length > 0 ? (
                        <Image
                          src={product.images[0].url}
                          alt={product.name}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-400 text-xs">No Image</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {product.name}
                      </h4>
                      {product.categories && product.categories.length > 0 && (
                        <p className="text-xs text-gray-500 truncate">
                          {product.categories[0].name}
                        </p>
                      )}
                    </div>
                    
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">
                        {formatPrice(product)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="p-3 border-t border-gray-100">
                <Link
                  href={`/products?search=${encodeURIComponent(searchQuery)}`}
                  className="block text-center text-sm text-blue-600 hover:text-blue-800 font-medium"
                  onClick={() => setShowDropdown(false)}
                >
                  View all results for &quot;{searchQuery}&quot;
                </Link>
              </div>
            </>
          ) : searchQuery.trim().length >= 2 ? (
            <div className="p-4 text-center text-gray-500">
              <p className="text-sm">No products found for &quot;{searchQuery}&quot;</p>
              <p className="text-xs mt-1">Try different keywords</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
