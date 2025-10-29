import Head from "next/head";
import React, { useState, useEffect } from "react";
import { FiPackage, FiSearch, FiFilter, FiRefreshCw, FiEye, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import AdminLayout from "@/components/layouts/AdminLayout";
import { useAuth } from '@/contexts/AuthContext';
import { AdminService, ProductSyncStats } from '@/services/adminService';

interface Product {
  id: string;
  name: string;
  slug: string;
  min_price: number;
  max_price: number;
  currency: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  categories: Array<{ id: number; name: string }>;
  images: Array<{ id: number; url: string; alt_text?: string }>;
}

export default function AdminProducts() {
  const { api } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [syncStats, setSyncStats] = useState<ProductSyncStats>({
    totalProducts: 0,
    activeProducts: 0,
    inactiveProducts: 0,
    syncStatus: 'idle'
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<{ [key: string]: boolean }>({});
  const itemsPerPage = 10;

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  useEffect(() => {
    fetchProducts();
    fetchSyncStats();
  }, [currentPage, searchTerm, categoryFilter, statusFilter]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const skip = (currentPage - 1) * itemsPerPage;
      
      const params: {
        skip: number;
        limit: number;
        search?: string;
        category?: string;
      } = {
        skip,
        limit: itemsPerPage
      };
      
      if (searchTerm) params.search = searchTerm;
      if (categoryFilter) params.category = categoryFilter;

      const response = await api.get('/products/', { params });
      
      let filteredProducts = response.data.products || [];
      
      if (statusFilter !== 'all') {
        filteredProducts = filteredProducts.filter((product: Product) => 
          statusFilter === 'active' ? product.is_active : !product.is_active
        );
      }
      
      setProducts(filteredProducts);
      setTotalPages(Math.ceil((response.data.total || 0) / itemsPerPage));
    } catch (error) {
      console.error('Failed to fetch products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSyncStats = async () => {
    try {
      const adminService = new AdminService(api);
      const stats = await adminService.getProductSyncStats();
      setSyncStats(stats);
    } catch (error) {
      console.error('Failed to fetch sync stats:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchProducts(), fetchSyncStats()]);
    setRefreshing(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchProducts();
  };

  const resetFilters = () => {
    setSearchTerm('');
    setCategoryFilter('');
    setStatusFilter('all');
    setCurrentPage(1);
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const toggleCategoryExpansion = (productId: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [productId]: !prev[productId]
    }));
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'EUR'
    }).format(price);
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        Active
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
        Inactive
      </span>
    );
  };
  return (
    <>
      <Head>
        <title>Product Catalog • Lootamo Admin</title>
      </Head>
      <AdminLayout>
        <div className="space-y-6">
          {/* Header Section */}
          <div className="bg-blue-600 text-white px-6 py-8 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Product Catalog</h1>
                <p className="text-blue-100">Enterprise Catalog & License Management</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="flex items-center gap-2 px-4 py-3 text-sm bg-white/10 backdrop-blur-sm text-white rounded-xl hover:bg-white/20 disabled:opacity-50 transition-all duration-200 border border-white/20 cursor-pointer"                 
                >
                  <FiRefreshCw className={`text-sm ${refreshing ? 'animate-spin' : ''}`} />
                  {refreshing ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>
            </div>
          </div>

          {/* Sync Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-gray-900">{syncStats.totalProducts}</div>
                  <div className="text-sm font-semibold text-gray-700">Total Products</div>
                </div>
                <div className="p-3 rounded-lg bg-blue-500">
                  <FiPackage className="text-xl text-white" />
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-100 to-green-200 rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-gray-900">{syncStats.activeProducts}</div>
                  <div className="text-sm font-semibold text-gray-700">Active Products</div>
                </div>
                <div className="p-3 rounded-lg bg-green-500">
                  <FiPackage className="text-xl text-white" />
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-red-100 to-red-200 rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-gray-900">{syncStats.inactiveProducts}</div>
                  <div className="text-sm font-semibold text-gray-700">Inactive Products</div>
                </div>
                <div className="p-3 rounded-lg bg-red-500">
                  <FiPackage className="text-xl text-white" />
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-gray-900 capitalize">{syncStats.syncStatus}</div>
                  <div className="text-sm font-semibold text-gray-700">Sync Status</div>
                </div>
                <div className={`p-3 rounded-lg ${
                  syncStats.syncStatus === 'running' ? 'bg-yellow-500' :
                  syncStats.syncStatus === 'success' ? 'bg-green-500' :
                  syncStats.syncStatus === 'error' ? 'bg-red-500' : 'bg-gray-500'
                }`}>
                  <FiRefreshCw className={`text-xl text-white ${
                    syncStats.syncStatus === 'running' ? 'animate-spin' : ''
                  }`} />
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FiSearch className="text-blue-600 text-lg" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Search Products</h2>
              </div>
              <button
                type="button"
                onClick={toggleFilters}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 font-semibold"
                style={{ cursor: "pointer" }}
              >
                <FiFilter className="text-sm" />
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </button>
            </div>
            {showFilters && (
              <form onSubmit={handleSearch} className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-64">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Search Products</label>
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by name..."
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>
              <div className="min-w-48">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                <input
                  type="text"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  placeholder="Filter by category..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>
              <div className="min-w-32">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                <select
                  style={{ cursor: "pointer" }}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                >
                  <option value="all">All</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="flex gap-3">
               
                <button
                  type="button"
                  onClick={resetFilters}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:shadow-md transition-all duration-200 font-semibold"
                  style={{ cursor: "pointer" }}
                >
                  Reset
                </button>
              </div>
              </form>
            )}
          </div>

          {/* Products Table */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300">
            {/* <div className="overflow-x-auto bg-gray-50 rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                      #
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                      Categories
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                      Price Range
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                      Last Updated
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-900 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="text-gray-500 mt-2">Loading products...</p>
                      </td>
                    </tr>
                  ) : products.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center">
                        <div className="p-3 bg-gray-100 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                          <FiPackage className="text-gray-400 text-lg" />
                        </div>
                        <p className="text-gray-500 font-medium">No products found</p>
                        <p className="text-gray-400 text-sm mt-1">Products will appear here once synced</p>
                      </td>
                    </tr>
                  ) : (
                    products.map((product, index) => (
                      <tr key={product.id} className="hover:bg-blue-50 transition-colors duration-200">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-gray-900">{(currentPage - 1) * itemsPerPage + index + 1}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            {product.images && product.images.length > 0 && (
                              <img
                                src={product.images[0].url}
                                alt={product.images[0].alt_text || product.name}
                                className="h-12 w-12 rounded-lg object-cover mr-4 border border-gray-200"
                              />
                            )}
                            <div>
                              <div className="text-sm font-semibold text-gray-900 truncate max-w-xs">
                                {product.name}
                              </div>
                              <div className="text-xs text-gray-500">ID: {product.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-2">
                            {product.categories && product.categories.length > 0 ? (
                              <>
                                {(expandedCategories[product.id] ? product.categories : product.categories.slice(0, 2)).map((category) => (
                                  <span
                                    key={category.id}
                                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800"
                                  >
                                    {category.name}
                                  </span>
                                ))}
                                {product.categories.length > 2 && (
                                  <button
                                    onClick={() => toggleCategoryExpansion(product.id)}
                                    className="text-xs text-blue-600 hover:text-blue-800 font-medium cursor-pointer hover:underline"
                                  >
                                    {expandedCategories[product.id] 
                                      ? 'Show less' 
                                      : `+${product.categories.length - 2} more`
                                    }
                                  </button>
                                )}
                              </>
                            ) : (
                              <span className="text-xs text-gray-500">No categories</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">
                            {formatPrice(product.min_price, product.currency)}
                            {product.max_price && product.max_price !== product.min_price && (
                              <> - {formatPrice(product.max_price, product.currency)}</>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(product.is_active)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {new Date(product.updated_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => window.open(`/admin/products/${product.id}`, '_blank')}
                              className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors duration-200"
                              title="View Product"
                              style={{ cursor: "pointer" }}
                            >
                              <FiEye className="text-sm" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div> */}
            <div className="overflow-x-auto">
             <table className="divide-y divide-gray-200 w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                      #
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                      Categories
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                      Price Range
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                      Last Updated
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-900 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="text-gray-500 mt-2">Loading products...</p>
                      </td>
                    </tr>
                  ) : products.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center">
                        <div className="p-3 bg-gray-100 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                          <FiPackage className="text-gray-400 text-lg" />
                        </div>
                        <p className="text-gray-500 font-medium">No products found</p>
                        <p className="text-gray-400 text-sm mt-1">Products will appear here once synced</p>
                      </td>
                    </tr>
                  ) : (
                    products.map((product, index) => (
                      <tr key={product.id} className="hover:bg-blue-50 transition-colors duration-200">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-gray-900">{(currentPage - 1) * itemsPerPage + index + 1}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            {product.images && product.images.length > 0 && (
                              <img
                                src={product.images[0].url}
                                alt={product.images[0].alt_text || product.name}
                                className="h-12 w-12 rounded-lg object-cover mr-4 border border-gray-200"
                              />
                            )}
                            <div>
                              <div className="text-sm font-semibold text-gray-900 truncate max-w-xs">
                                {product.name}
                              </div>
                              <div className="text-xs text-gray-500">ID: {product.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            {product.categories && product.categories.length > 0 ? (
                              <>
                                {(expandedCategories[product.id] ? product.categories : product.categories.slice(0, 2)).map((category) => (
                                  <span
                                    key={category.id}
                                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 whitespace-nowrap "
                                  >
                                    {category.name}
                                  </span>
                                ))}
                                {product.categories.length > 2 && (
                                  <button
                                    onClick={() => toggleCategoryExpansion(product.id)}
                                    className="text-xs text-blue-600 hover:text-blue-800 font-medium cursor-pointer hover:underline whitespace-nowrap"
                                  >
                                    {expandedCategories[product.id] 
                                      ? 'Show less' 
                                      : `+${product.categories.length - 2} more`
                                    }
                                  </button>
                                )}
                              </>
                            ) : (
                              <span className="text-xs text-gray-500">No categories</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">
                            {formatPrice(product.min_price, product.currency)}
                            {product.max_price && product.max_price !== product.min_price && (
                              <> - {formatPrice(product.max_price, product.currency)}</>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(product.is_active)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {new Date(product.updated_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => window.open(`/admin/products/${product.id}`, '_blank')}
                              className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors duration-200"
                              title="View Product"
                              style={{ cursor: "pointer" }}
                            >
                              <FiEye className="text-sm" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center my-6 space-x-2">
                {/* Previous button */}
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className={`p-2 rounded-lg transition-colors ${
                    currentPage === 1
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-gray-600 hover:bg-gray-100 cursor-pointer'
                  }`}
                >
                  <FiChevronLeft className="w-5 h-5" />
                </button>

                {/* Page numbers */}
                {getPageNumbers().map((page, index) => (
                  <React.Fragment key={index}>
                    {page === '...' ? (
                      <span className="px-3 py-2 text-gray-500">...</span>
                    ) : (
                      <button
                        onClick={() => setCurrentPage(page as number)}
                        className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                          currentPage === page
                            ? 'bg-blue-500 text-white'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {page}
                      </button>
                    )}
                  </React.Fragment>
                ))}

                {/* Next button */}
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className={`p-2 rounded-lg transition-colors ${
                    currentPage === totalPages
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <FiChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </AdminLayout>
    </>
  );
}
