import { useState, useRef, useEffect } from 'react';
import Head from 'next/head';
import Topbar from '@/components/Topbar';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProductList from '@/components/ProductList';
import { ProductsParams } from '@/types/product';

// Static category list from your API
const CATEGORIES = [
  "Gaming", "Gaming Subscriptions", "Gaming Gift Cards", "Points & Currencies", "Music", "Shopping",
  "Fighting", "Racing", "Puzzle", "Horror", "Action & Shooting", "Adventure", "Simulator", "Arcade",
  "Dance & music", "Sports", "RPG", "Strategy", "Kids & family", "MMO", "Indie", "Sandbox",
  "Battle Royale", "Fantasy", "PSN", "Nintendo eShop", "Steam", "PlayStation Plus", "Xbox Game Pass Core",
  "World of Warcraft", "Nintendo Switch Online", "GTA Online", "FC Points", "Roblox", "Runescape",
  "Stealth", "Games", "DLCs", "Action", "Office Suites", "Project Management", "Photography",
  "Antivirus", "Internet Security", "VPN", "Drivers & Driver Recovery", "PC Maintenance", "Video Editing",
  "Casual", "Economy", "VR", "Story-Based DLC'S", "Extra Content", "Season Pass", "Other",
  "Windows 10", "Windows 7", "Windows Server", "Game Development", "Benchmarks", "Tools",
  "V-bucks (Fortnite)", "Fashion", "Zalando", "Windows 11", "Special Gift Cards", "Valorant",
  "Razer Gold", "Twitch", "Amazon", "Ebay Gift Card", "Mobile Recharges", "Random",
  "Xbox Game Pass Ultimate", "Xbox Game Pass PC", "Lebara", "Lycamobile", "Vodafone", "Food",
  "Apps", "Travel", "Health & beauty", "Cash gift cards", "Bitnovo", "Mystery boxes",
  "Counter Strike 2 Services", "Netflix", "HULU", "Crunchyroll", "Fortnite", "Software", "Gift cards"
];

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useState<ProductsParams>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [categorySearch, setCategorySearch] = useState('');
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSearchParams({ ...searchParams, search: searchQuery });
  };

  const handleFilterChange = (filters: Partial<ProductsParams>) => {
    const next: ProductsParams = { ...searchParams, ...filters };

    if (typeof next.min_price === 'number' && Number.isNaN(next.min_price)) {
      delete next.min_price;
    }
    if (typeof next.max_price === 'number' && Number.isNaN(next.max_price)) {
      delete next.max_price;
    }

    if ((next.max_price ?? undefined) !== undefined && (next.min_price ?? undefined) === undefined) {
      next.min_price = 0;
    }

    if (
      (next.min_price ?? undefined) !== undefined &&
      (next.max_price ?? undefined) !== undefined &&
      (next.max_price as number) < (next.min_price as number)
    ) {
      const min = next.min_price as number;
      const max = next.max_price as number;
      next.min_price = Math.min(min, max);
      next.max_price = Math.max(min, max);
    }

    setSearchParams(next);
  };

  const clearFilters = () => {
    setSearchParams({});
    setSearchQuery('');
    setCategorySearch('');
    setIsCategoryDropdownOpen(false);
  };

  const filteredCategories = CATEGORIES.filter(category =>
    category.toLowerCase().includes(categorySearch.toLowerCase())
  );

  const handleCategorySelect = (category: string) => {
    handleFilterChange({ category: category || undefined });
    setCategorySearch(category);
    setIsCategoryDropdownOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setIsCategoryDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (searchParams.category) {
      setCategorySearch(searchParams.category);
    } else {
      setCategorySearch('');
    }
  }, [searchParams.category]);

  return (
    <>
      <Head>
        <title>All Products - Lootamo</title>
        <meta name="description" content="Browse all available games and digital products on Lootamo" />
      </Head>

      <Topbar />
      <Navbar />
      
      <main className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl font-bold mb-4">All Products</h1>
            <p className="text-xl opacity-90">Discover thousands of games and digital products</p>
          </div>
        </div>

        {/* Search and Filters Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
              {/* Search Bar */}
              <form onSubmit={handleSearch} className="flex-1 flex gap-2">
                <input
                  type="text"
                  placeholder="Search games, keys, gift cards..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Search
                </button>
              </form>

              {/* Filter Controls */}
              <div className="flex gap-4 items-center">
                {/* Searchable Category Dropdown */}
                <div className="relative z-50" ref={categoryDropdownRef}>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search categories..."
                      value={categorySearch}
                      onChange={(e) => {
                        setCategorySearch(e.target.value);
                        setIsCategoryDropdownOpen(true);
                      }}
                      onFocus={() => setIsCategoryDropdownOpen(true)}
                      className="w-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-8"
                    />
                    <button
                      type="button"
                      onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                      className="absolute inset-y-0 right-0 flex items-center px-2 text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                  
                  {isCategoryDropdownOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                      {/* All Categories Option */}
                      <button
                        type="button"
                        onClick={() => handleCategorySelect('')}
                        className={`w-full px-3 py-2 text-left hover:bg-gray-100 ${
                          !searchParams.category ? 'bg-blue-50 text-blue-600' : 'text-gray-900'
                        }`}
                      >
                        All Categories
                      </button>
                      
                      {/* Filtered Categories */}
                      {filteredCategories.length > 0 ? (
                        filteredCategories.map(category => (
                          <button
                            key={category}
                            type="button"
                            onClick={() => handleCategorySelect(category)}
                            className={`w-full px-3 py-2 text-left hover:bg-gray-100 ${
                              searchParams.category === category ? 'bg-blue-50 text-blue-600' : 'text-gray-900'
                            }`}
                          >
                            {category}
                          </button>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-gray-500 text-sm">
                          No categories found
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    placeholder="Min Price"
                    value={searchParams.min_price || ''}
                    onChange={(e) => handleFilterChange({ min_price: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-gray-500">-</span>
                  <input
                    type="number"
                    placeholder="Max Price"
                    value={searchParams.max_price || ''}
                    onChange={(e) => handleFilterChange({ max_price: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  style={{ cursor: "pointer" }}
                >
                  Clear
                </button>
                
                {/* Selected Category Display */}
                {searchParams.category && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    <span>{searchParams.category}</span>
                    <button
                      onClick={() => handleFilterChange({ category: undefined })}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <ProductList 
            params={searchParams}
            itemsPerPage={12}
            showTitle={false}
            showLoadMore={true}
            className="mt-8"
          />
        </div>
      </main>

      <Footer />
    </>
  );
}
