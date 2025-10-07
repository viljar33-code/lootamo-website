import Head from "next/head";
import { useState, useEffect } from "react";
import { FiHeart, FiUsers, FiTrendingUp, FiRefreshCw, FiEye, FiDownload } from "react-icons/fi";
import AdminLayout from "@/components/layouts/AdminLayout";
import { useAuth } from '@/contexts/AuthContext';
import { AdminService, WishlistStats } from '@/services/adminService';

export default function AdminWishlist() {
  const { api } = useAuth();
  const [wishlistStats, setWishlistStats] = useState<WishlistStats>({
    totalWishlists: 0,
    totalItems: 0,
    averageItemsPerUser: 0,
    mostWishlistedProducts: []
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchWishlistStats();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchWishlistStats = async () => {
    try {
      setLoading(true);
      const adminService = new AdminService(api);
      const stats = await adminService.getWishlistStats();
      setWishlistStats(stats);
    } catch (error) {
      console.error('Failed to fetch wishlist stats:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error details:', errorMessage);
      setWishlistStats({
        totalWishlists: 0,
        totalItems: 0,
        averageItemsPerUser: 0,
        mostWishlistedProducts: []
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchWishlistStats();
    setRefreshing(false);
  };

  const exportWishlistData = () => {
    const data = {
      wishlistStats,
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lootamo-wishlist-analytics-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Head>
        <title>Wishlist Analytics • Lootamo Admin</title>
      </Head>
      <AdminLayout>
        <div className="space-y-8">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-700 rounded-2xl shadow-xl overflow-hidden">
            <div className="px-6 py-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-white">Wishlist Analytics</h1>
                  <p className="text-blue-100 text-sm">
                    Monitor customer preferences and wishlist behavior patterns
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={exportWishlistData}
                    className="flex items-center gap-2 px-4 py-3 text-sm bg-white/10 backdrop-blur-sm text-white rounded-xl hover:bg-white/20 transition-all duration-200 border border-white/20"
                  >
                    <FiDownload className="text-lg" />
                    Export Data
                  </button>
                  <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="flex items-center gap-2 px-4 py-3 text-sm bg-white/10 backdrop-blur-sm text-white rounded-xl hover:bg-white/20 disabled:opacity-50 transition-all duration-200 border border-white/20"
                  >
                    <FiRefreshCw className={`text-lg ${refreshing ? 'animate-spin' : ''}`} />
                    {refreshing ? 'Refreshing...' : 'Refresh'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-200">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg">
                  <FiHeart className="text-xl text-white" />
                </div>
                <div>
                  <div className="text-3xl font-bold text-purple-700 mb-1">
                    {loading ? '---' : (wishlistStats.totalWishlists ?? 0).toLocaleString()}
                  </div>
                  <div className="text-sm font-medium text-gray-700">Total Wishlists</div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-200">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
                  <FiUsers className="text-xl text-white" />
                </div>
                <div>
                  <div className="text-3xl font-bold text-blue-700 mb-1">
                    {loading ? '---' : (wishlistStats.totalItems ?? 0).toLocaleString()}
                  </div>
                  <div className="text-sm font-medium text-gray-700">Total Items</div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-200">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-green-600 shadow-lg">
                  <FiTrendingUp className="text-xl text-white" />
                </div>
                <div>
                  <div className="text-3xl font-bold text-green-700 mb-1">
                    {loading ? '---' : (wishlistStats.averageItemsPerUser ?? 0).toFixed(1)}
                  </div>
                  <div className="text-sm font-medium text-gray-700">Avg Items per User</div>
                </div>
              </div>
            </div>
          </div>

          {/* Most Wishlisted Products */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-lg">
                    <FiTrendingUp className="text-xl text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Most Wishlisted Products</h2>
                    <p className="text-gray-600">Products with the highest wishlist counts</p>
                  </div>
                </div>
                <div className="bg-indigo-100 px-3 py-1 rounded-full">
                  <span className="text-sm font-semibold text-indigo-700">
                    {loading ? 'Loading...' : `${wishlistStats.mostWishlistedProducts?.length ?? 0} products`}
                  </span>
                </div>
              </div>
            </div>
            <div className="p-6">
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                  <div className="text-gray-500">Loading wishlist data...</div>
                </div>
              ) : (wishlistStats.mostWishlistedProducts?.length ?? 0) > 0 ? (
                <div className="space-y-4">
                  {(wishlistStats.mostWishlistedProducts ?? []).map((product, index) => (
                    <div key={product.product_id} className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-5 border border-gray-200 hover:shadow-md transition-all duration-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                            <span className="text-sm font-bold text-white">#{index + 1}</span>
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 text-lg">{product.product_name}</div>
                            <div className="text-sm text-gray-500">Product ID: {product.product_id}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-indigo-600">{product.wishlist_count}</div>
                            <div className="text-xs text-gray-500 font-medium">wishlists</div>
                          </div>
                          <button
                            onClick={() => window.open(`/products/${product.product_id}`, '_blank')}
                            className="p-3 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-xl transition-all duration-200 border border-blue-200 hover:border-blue-300"
                            title="View Product"
                          >
                            <FiEye className="text-lg" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FiHeart className="text-6xl text-gray-300 mx-auto mb-4" />
                  <div className="text-lg font-medium text-gray-500 mb-2">No wishlist data available</div>
                  <div className="text-sm text-gray-400">Products will appear here once customers start adding items to their wishlists</div>
                </div>
              )}
            </div>
          </div>

          {/* Wishlist Insights */}
          <div className="bg-gradient-to-br from-slate-50 to-gray-100 rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-slate-500 to-slate-600 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
                  <FiTrendingUp className="text-xl text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Wishlist Insights</h2>
                  <p className="text-slate-200">Key metrics and customer behavior analysis</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-purple-100">
                      <FiHeart className="text-lg text-purple-600" />
                    </div>
                    <div className="text-lg font-bold text-gray-900">Engagement Rate</div>
                  </div>
                  <div className="text-3xl font-bold text-purple-600 mb-2">
                    {(wishlistStats.totalWishlists ?? 0) > 0 ? 
                      (((wishlistStats.totalItems ?? 0) / (wishlistStats.totalWishlists ?? 1)) * 100 / 10).toFixed(1) : '0'}%
                  </div>
                  <div className="text-sm text-gray-600">
                    Based on items per wishlist ratio
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-blue-100">
                      <FiTrendingUp className="text-lg text-blue-600" />
                    </div>
                    <div className="text-lg font-bold text-gray-900">Popular Products</div>
                  </div>
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {wishlistStats.mostWishlistedProducts?.length ?? 0}
                  </div>
                  <div className="text-sm text-gray-600">
                    Products in top wishlists
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-green-100">
                      <FiUsers className="text-lg text-green-600" />
                    </div>
                    <div className="text-lg font-bold text-gray-900">Wishlist Activity</div>
                  </div>
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {(wishlistStats.totalItems ?? 0) > 0 ? 'High' : 'Low'}
                  </div>
                  <div className="text-sm text-gray-600">
                    Overall customer interest level
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              <div className="mt-8 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <FiTrendingUp className="text-indigo-600" />
                  Recommendations
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(wishlistStats.averageItemsPerUser ?? 0) < 2 && (
                    <div className="bg-white rounded-lg p-4 border border-orange-200">
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                        <div>
                          <div className="font-medium text-gray-900 mb-1">Boost Engagement</div>
                          <div className="text-sm text-gray-600">Consider implementing wishlist reminders to increase engagement</div>
                        </div>
                      </div>
                    </div>
                  )}
                  {(wishlistStats.mostWishlistedProducts?.length ?? 0) > 0 && (
                    <div className="bg-white rounded-lg p-4 border border-green-200">
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                        <div>
                          <div className="font-medium text-gray-900 mb-1">Marketing Opportunity</div>
                          <div className="text-sm text-gray-600">Promote top wishlisted products in marketing campaigns</div>
                        </div>
                      </div>
                    </div>
                  )}
                  {(wishlistStats.totalWishlists ?? 0) > 0 && (
                    <div className="bg-white rounded-lg p-4 border border-blue-200">
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        <div>
                          <div className="font-medium text-gray-900 mb-1">Conversion Strategy</div>
                          <div className="text-sm text-gray-600">Send targeted offers for wishlisted items to increase conversions</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Wishlist Management Actions */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg">
                  <FiUsers className="text-xl text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Wishlist Management</h2>
                  <p className="text-gray-600">Strategic insights and actionable recommendations</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200 hover:shadow-md transition-all duration-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-blue-500 text-white">
                      <FiTrendingUp className="text-lg" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Customer Insights</h3>
                  </div>
                  <p className="text-gray-700 mb-4">
                    Analyze customer preferences and popular product trends through wishlist data.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                      <span>Track product popularity over time</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                      <span>Identify trending categories</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                      <span>Monitor customer engagement patterns</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200 hover:shadow-md transition-all duration-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-purple-500 text-white">
                      <FiHeart className="text-lg" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Marketing Opportunities</h3>
                  </div>
                  <p className="text-gray-700 mb-4">
                    Leverage wishlist data for targeted marketing campaigns and inventory planning.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                      <span>Send personalized product recommendations</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                      <span>Create targeted discount campaigns</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                      <span>Optimize inventory based on demand</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    </>
  );
}
