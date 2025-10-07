import Head from "next/head";
import { useState, useEffect } from "react";
import { FiDollarSign, FiShoppingCart, FiUsers, FiTrendingUp, FiRefreshCw, FiDownload } from "react-icons/fi";
import AdminLayout from "@/components/layouts/AdminLayout";
import { useAuth } from '@/contexts/AuthContext';
import { AdminService, PaymentStats, CartStats, WishlistStats } from '@/services/adminService';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

export default function AdminAnalytics() {
  const { api } = useAuth();
  const [paymentStats, setPaymentStats] = useState<PaymentStats>({
    totalPayments: 0,
    totalRevenue: 0,
    successfulPayments: 0,
    failedPayments: 0,
    pendingPayments: 0,
    todayRevenue: 0,
    todayPayments: 0,
    averageOrderValue: 0
  });
  const [cartStats, setCartStats] = useState<CartStats>({
    totalCarts: 0,
    totalItems: 0,
    totalValue: 0,
    averageCartValue: 0,
    abandonedCarts: 0,
    conversionRate: 0
  });
  const [wishlistStats, setWishlistStats] = useState<WishlistStats>({
    totalWishlists: 0,
    totalItems: 0,
    averageItemsPerUser: 0,
    mostWishlistedProducts: []
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const adminService = new AdminService(api);
      
      const [payments, carts, wishlists] = await Promise.all([
        adminService.getPaymentStats(),
        adminService.getCartStats(),
        adminService.getWishlistStats()
      ]);

      setPaymentStats(payments);
      setCartStats(carts);
      setWishlistStats(wishlists);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAnalytics();
    setRefreshing(false);
  };

  const exportData = () => {
    const data = {
      payments: paymentStats,
      carts: cartStats,
      wishlists: wishlistStats,
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lootamo-analytics-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Head>
        <title>Analytics & Reports • Lootamo Admin</title>
      </Head>
      <AdminLayout>
        <div className="space-y-8">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-700 rounded-2xl shadow-xl overflow-hidden">
            <div className="px-6 py-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-white">Analytics & Reports</h1>
                  <p className="text-blue-100 text-sm">
                    Comprehensive insights into your business performance and customer behavior
                  </p>
                </div>
                <div className="flex gap-3">
                  {/* <button
                    onClick={exportData}
                    className="flex items-center gap-2 px-4 py-3 text-sm bg-white/10 backdrop-blur-sm text-white rounded-xl hover:bg-white/20 transition-all duration-200 border border-white/20"
                  >
                    <FiDownload className="text-lg" />
                    Export Data
                  </button> */}
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

          {/* Payment Analytics */}
          <section className="bg-white rounded-xl shadow-lg border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-green-600 shadow-lg">
                  <FiDollarSign className="text-xl text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Payment Analytics</h2>
                  <p className="text-gray-600">Revenue and payment processing statistics</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-gray-200 hover:shadow-md transition-all duration-200">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-700 mb-1">€{loading ? '---' : (paymentStats.totalRevenue ?? 0).toFixed(2)}</div>
                    <div className="text-sm font-medium text-gray-700 mb-2">Total Revenue</div>
                    <div className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">+€{loading ? '--' : (paymentStats.todayRevenue ?? 0).toFixed(2)} today</div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-gray-200 hover:shadow-md transition-all duration-200">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-700 mb-1">{loading ? '---' : (paymentStats.totalPayments ?? 0)}</div>
                    <div className="text-sm font-medium text-gray-700 mb-2">Total Payments</div>
                    <div className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">+{loading ? '--' : (paymentStats.todayPayments ?? 0)} today</div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-gray-200 hover:shadow-md transition-all duration-200">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-700 mb-1">€{loading ? '---' : (paymentStats.averageOrderValue ?? 0).toFixed(2)}</div>
                    <div className="text-sm font-medium text-gray-700">Avg Order Value</div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-gray-200 hover:shadow-md transition-all duration-200">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-orange-700 mb-1">{loading ? '---' : (paymentStats.successfulPayments ?? 0)}</div>
                    <div className="text-sm font-medium text-gray-700 mb-2">Success Rate</div>
                    <div className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded-full">{loading ? '--' : (paymentStats.failedPayments ?? 0)} failed</div>
                  </div>
                </div>
              </div>

              {/* Payment Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Payment Status Distribution */}
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Payment Status Distribution</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Successful', value: paymentStats.successfulPayments || 0, color: '#10b981' },
                          { name: 'Failed', value: paymentStats.failedPayments || 0, color: '#ef4444' },
                          { name: 'Pending', value: paymentStats.pendingPayments || 0, color: '#f59e0b' }
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {[
                          { name: 'Successful', value: paymentStats.successfulPayments || 0, color: '#10b981' },
                          { name: 'Failed', value: paymentStats.failedPayments || 0, color: '#ef4444' },
                          { name: 'Pending', value: paymentStats.pendingPayments || 0, color: '#f59e0b' }
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Revenue Overview */}
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Revenue Overview</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={[
                        { name: 'Total Revenue', value: paymentStats.totalRevenue || 0 },
                        { name: 'Today Revenue', value: paymentStats.todayRevenue || 0 },
                        { name: 'Avg Order Value', value: paymentStats.averageOrderValue || 0 }
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => `€${Number(value).toFixed(2)}`} />
                      <Bar dataKey="value" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </section>

          {/* Cart Analytics */}
          <section className="bg-white rounded-xl shadow-lg border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
                  <FiShoppingCart className="text-xl text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Cart Analytics</h2>
                  <p className="text-gray-600">Shopping cart behavior and conversion metrics</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-6 border border-gray-200 hover:shadow-md transition-all duration-200">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-indigo-700 mb-1">€{loading ? '---' : (cartStats.totalValue ?? 0).toFixed(2)}</div>
                    <div className="text-sm font-medium text-gray-700">Active Carts Value</div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-xl p-6 border border-gray-200 hover:shadow-md transition-all duration-200">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-cyan-700 mb-1">€{loading ? '---' : (cartStats.averageCartValue ?? 0).toFixed(2)}</div>
                    <div className="text-sm font-medium text-gray-700">Avg Cart Value</div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl p-6 border border-gray-200 hover:shadow-md transition-all duration-200">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-teal-700 mb-1">{loading ? '---' : (cartStats.totalItems ?? 0)}</div>
                    <div className="text-sm font-medium text-gray-700">Total Items</div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-6 border border-gray-200 hover:shadow-md transition-all duration-200">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-emerald-700 mb-1">{loading ? '---' : (cartStats.conversionRate ?? 0).toFixed(1)}%</div>
                    <div className="text-sm font-medium text-gray-700 mb-2">Conversion Rate</div>
                    <div className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded-full">{loading ? '--' : (cartStats.abandonedCarts ?? 0)} abandoned</div>
                  </div>
                </div>
              </div>

              {/* Cart Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Cart Value Breakdown */}
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Cart Value Breakdown</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={[
                        { name: 'Total Value', value: cartStats.totalValue || 0 },
                        { name: 'Avg Cart Value', value: cartStats.averageCartValue || 0 }
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => `€${Number(value).toFixed(2)}`} />
                      <Bar dataKey="value" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Cart Conversion Metrics */}
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Cart Conversion Metrics</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Active Carts', value: (cartStats.totalCarts || 0) - (cartStats.abandonedCarts || 0), color: '#10b981' },
                          { name: 'Abandoned', value: cartStats.abandonedCarts || 0, color: '#f97316' }
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {[
                          { name: 'Active Carts', value: (cartStats.totalCarts || 0) - (cartStats.abandonedCarts || 0), color: '#10b981' },
                          { name: 'Abandoned', value: cartStats.abandonedCarts || 0, color: '#f97316' }
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </section>

          {/* Wishlist Analytics */}
          <section className="bg-white rounded-xl shadow-lg border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg">
                  <FiUsers className="text-xl text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Wishlist Analytics</h2>
                  <p className="text-gray-600">Customer wishlist behavior and popular products</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="bg-gradient-to-br from-violet-50 to-violet-100 rounded-xl p-6 border border-gray-200 hover:shadow-md transition-all duration-200">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-violet-700 mb-1">{loading ? '---' : (wishlistStats.totalWishlists ?? 0)}</div>
                    <div className="text-sm font-medium text-gray-700">Total Wishlists</div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-fuchsia-50 to-fuchsia-100 rounded-xl p-6 border border-gray-200 hover:shadow-md transition-all duration-200">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-fuchsia-700 mb-1">{loading ? '---' : (wishlistStats.totalItems ?? 0)}</div>
                    <div className="text-sm font-medium text-gray-700">Total Items</div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-gray-200 hover:shadow-md transition-all duration-200">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-700 mb-1">{loading ? '---' : (wishlistStats.averageItemsPerUser ?? 0).toFixed(1)}</div>
                    <div className="text-sm font-medium text-gray-700">Avg Items/User</div>
                  </div>
                </div>
              </div>

              {/* Wishlist Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Most Wishlisted Products Chart */}
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <FiTrendingUp className="text-purple-600" />
                    Top Wishlisted Products
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={(wishlistStats.mostWishlistedProducts ?? []).slice(0, 5).map(product => ({
                        name: product.product_name.length > 20 ? product.product_name.substring(0, 20) + '...' : product.product_name,
                        count: product.wishlist_count
                      }))}
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={150} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#a855f7" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Wishlist Engagement Overview */}
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Wishlist Engagement</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart
                      data={[
                        { name: 'Total Wishlists', value: wishlistStats.totalWishlists || 0 },
                        { name: 'Total Items', value: wishlistStats.totalItems || 0 },
                        { name: 'Avg Items/User', value: (wishlistStats.averageItemsPerUser || 0) * 10 }
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="value" stroke="#a855f7" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Most Wishlisted Products List */}
              <div className="mt-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <FiTrendingUp className="text-purple-600" />
                  Most Wishlisted Products Details
                </h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                      <div className="text-sm text-gray-500 mt-2">Loading...</div>
                    </div>
                  ) : (wishlistStats.mostWishlistedProducts?.length ?? 0) > 0 ? (
                    (wishlistStats.mostWishlistedProducts ?? []).slice(0, 5).map((product, index) => (
                      <div key={product.product_id} className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm border border-purple-200 hover:shadow-md transition-all duration-200">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
                            <span className="text-xs font-bold text-white">#{index + 1}</span>
                          </div>
                          <span className="text-sm font-medium text-gray-900 truncate">{product.product_name}</span>
                        </div>
                        <div className="bg-purple-100 px-3 py-1 rounded-full">
                          <span className="text-sm font-bold text-purple-700">{product.wishlist_count}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <FiUsers className="text-4xl text-gray-300 mx-auto mb-2" />
                      <div className="text-sm text-gray-500">No wishlist data available</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Performance Insights */}
          <section className="bg-gradient-to-br from-slate-50 to-gray-100 rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-slate-500 to-slate-600 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
                  <FiTrendingUp className="text-xl text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Performance Insights</h2>
                  <p className="text-slate-200">Key metrics and business recommendations</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-green-100">
                      <FiDollarSign className="text-lg text-green-600" />
                    </div>
                    <div className="text-lg font-bold text-gray-900">Revenue Growth</div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Today&#39;s Revenue:</span>
                      <span className="text-sm font-semibold text-green-600">€{(paymentStats.todayRevenue ?? 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Avg Order Value:</span>
                      <span className="text-sm font-semibold text-blue-600">€{(paymentStats.averageOrderValue ?? 0).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-blue-100">
                      <FiShoppingCart className="text-lg text-blue-600" />
                    </div>
                    <div className="text-lg font-bold text-gray-900">Cart Performance</div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Conversion Rate:</span>
                      <span className="text-sm font-semibold text-emerald-600">{(cartStats.conversionRate ?? 0).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Abandoned Carts:</span>
                      <span className="text-sm font-semibold text-orange-600">{(cartStats.abandonedCarts ?? 0)}</span>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-purple-100">
                      <FiUsers className="text-lg text-purple-600" />
                    </div>
                    <div className="text-lg font-bold text-gray-900">Customer Engagement</div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total Wishlists:</span>
                      <span className="text-sm font-semibold text-purple-600">{(wishlistStats.totalWishlists ?? 0)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Avg Items/User:</span>
                      <span className="text-sm font-semibold text-indigo-600">{(wishlistStats.averageItemsPerUser ?? 0).toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </AdminLayout>
    </>
  );
}
