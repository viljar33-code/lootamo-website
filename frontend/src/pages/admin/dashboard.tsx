import Head from "next/head";
import { useState, useEffect } from "react";
import { FiUploadCloud, FiKey, FiDollarSign, FiUsers, FiShoppingCart, FiCreditCard, FiRefreshCw } from "react-icons/fi";
import AdminLayout from "@/components/layouts/AdminLayout";
import { useAuth } from '@/contexts/AuthContext';
import { AdminService, AdminStats } from '@/services/adminService';
import withAdminAuth from '@/hocs/withAdminAuth';

function AdminDashboard() {
  const { api } = useAuth();
  const [stats, setStats] = useState<AdminStats>({
    totalOrders: 0,
    totalRevenue: 0,
    totalUsers: 0,
    totalProducts: 0,
    pendingOrders: 0,
    completedOrders: 0,
    todayRevenue: 0,
    todayOrders: 0,
    activeUsers: 0,
    newUsersThisWeek: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const adminService = new AdminService(api);
      const dashboardStats = await adminService.getDashboardStats();
      setStats(dashboardStats);
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
      setStats({
        totalOrders: 0,
        totalRevenue: 0,
        totalUsers: 0,
        totalProducts: 0,
        pendingOrders: 0,
        completedOrders: 0,
        todayRevenue: 0,
        todayOrders: 0,
        activeUsers: 0,
        newUsersThisWeek: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardStats();
    setRefreshing(false);
  };

  return (
    <>
      <Head>
        <title>Dashboard • Lootamo Admin</title>
      </Head>
      <AdminLayout>
        <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-semibold text-gray-900">System Overview</h1>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                style={{ cursor: "pointer" }}
              >
                <FiRefreshCw className={`text-sm ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>

            
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 px-4 py-3 text-sm">
              Welcome back, <span className="font-medium">System Administrator</span>! Your e-commerce platform is running smoothly.
            </div>

            {/* Real-time Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                    <p className="text-3xl font-bold text-gray-900">€{loading ? '---' : stats.totalRevenue.toLocaleString()}</p>
                  </div>
                  <div className="p-3 rounded-full bg-green-100">
                    <FiDollarSign className="text-2xl text-green-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <span className="text-green-600 font-medium">+€{loading ? '--' : stats.todayRevenue}</span>
                  <span className="text-gray-500 ml-1">today</span>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Orders</p>
                    <p className="text-3xl font-bold text-gray-900">{loading ? '---' : stats.totalOrders}</p>
                  </div>
                  <div className="p-3 rounded-full bg-blue-100">
                    <FiShoppingCart className="text-2xl text-blue-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <span className="text-blue-600 font-medium">+{loading ? '--' : stats.todayOrders}</span>
                  <span className="text-gray-500 ml-1">today</span>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Users</p>
                    <p className="text-3xl font-bold text-gray-900">{loading ? '---' : stats.activeUsers}</p>
                  </div>
                  <div className="p-3 rounded-full bg-purple-100">
                    <FiUsers className="text-2xl text-purple-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <span className="text-purple-600 font-medium">+{loading ? '--' : stats.newUsersThisWeek}</span>
                  <span className="text-gray-500 ml-1">this week</span>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Products</p>
                    <p className="text-3xl font-bold text-gray-900">{loading ? '---' : stats.totalProducts.toLocaleString()}</p>
                  </div>
                  <div className="p-3 rounded-full bg-orange-100">
                    <FiKey className="text-2xl text-orange-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <span className="text-orange-600 font-medium">G2A Sync</span>
                  <span className="text-gray-500 ml-1">active</span>
                </div>
              </div>
            </div>

            
            {/* Order Status Overview */}
            <section className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-all duration-300">
              <h2 className="text-lg font-semibold text-gray-900">Order & Payment Status</h2>
              <p className="text-sm text-gray-600 mt-1">
                Real-time overview of orders, payments, and license key delivery.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                <div className="rounded-lg bg-green-50 border border-green-200 p-4 hover:bg-green-100 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-3xl font-bold text-green-600">{loading ? '---' : stats.completedOrders}</div>
                      <div className="text-sm font-medium text-gray-700">Completed Orders</div>
                      <div className="text-xs text-green-600 mt-1">Keys Delivered</div>
                    </div>
                    <div className="p-2 rounded-full bg-green-100">
                      <FiShoppingCart className="text-xl text-green-600" />
                    </div>
                  </div>
                </div>
                <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4 hover:bg-yellow-100 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-3xl font-bold text-yellow-600">{loading ? '---' : stats.pendingOrders}</div>
                      <div className="text-sm font-medium text-gray-700">Pending Orders</div>
                      <div className="text-xs text-yellow-600 mt-1">Awaiting Payment</div>
                    </div>
                    <div className="p-2 rounded-full bg-yellow-100">
                      <FiCreditCard className="text-xl text-yellow-600" />
                    </div>
                  </div>
                </div>
                <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 hover:bg-blue-100 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-3xl font-bold text-blue-600">{loading ? '---' : stats.totalProducts.toLocaleString()}</div>
                      <div className="text-sm font-medium text-gray-700">G2A Products</div>
                      <div className="text-xs text-blue-600 mt-1">Available for Sale</div>
                    </div>
                    <div className="p-2 rounded-full bg-blue-100">
                      <FiKey className="text-xl text-blue-600" />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            
            {/* Quick Actions */}
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-5 border border-gray-200 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center gap-3">
                  <span className="p-2 rounded bg-blue-100 text-blue-700"><FiShoppingCart className="text-xl" /></span>
                  <h3 className="font-semibold">Order Management</h3>
                </div>
                <p className="text-sm text-gray-600 mt-2">View and manage customer orders, payments, and license delivery.</p>
                <button 
                  onClick={() => window.location.href = '/admin/orders'}
                  className="mt-4 px-3 py-1.5 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 transition-all duration-300"
                >
                  Manage Orders
                </button>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-5 border border-gray-200 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center gap-3">
                  <span className="p-2 rounded bg-green-100 text-green-700"><FiCreditCard className="text-xl" /></span>
                  <h3 className="font-semibold">Payment Processing</h3>
                </div>
                <p className="text-sm text-gray-600 mt-2">Monitor Stripe payments, webhooks, and transaction status.</p>
                <button 
                  onClick={() => window.location.href = '/admin/payments'}
                  className="mt-4 px-3 py-1.5 text-sm rounded bg-green-600 text-white hover:bg-green-700 transition-all duration-300"
                >
                  View Payments
                </button>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-5 border border-gray-200 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center gap-3">
                  <span className="p-2 rounded bg-purple-100 text-purple-700"><FiUsers className="text-xl" /></span>
                  <h3 className="font-semibold">User Management</h3>
                </div>
                <p className="text-sm text-gray-600 mt-2">Manage customer accounts, roles, and access permissions.</p>
                <button 
                  onClick={() => window.location.href = '/admin/users'}
                  className="mt-4 px-3 py-1.5 text-sm rounded bg-purple-600 text-white hover:bg-purple-700 transition-all duration-300"
                >
                  Manage Users
                </button>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-5 border border-gray-200 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center gap-3">
                  <span className="p-2 rounded bg-orange-100 text-orange-700"><FiUploadCloud className="text-xl" /></span>
                  <h3 className="font-semibold">G2A Integration</h3>
                </div>
                <p className="text-sm text-gray-600 mt-2">Sync products, manage inventory, and monitor G2A API status.</p>
                <button 
                  onClick={() => window.location.href = '/admin/import'}
                  className="mt-4 px-3 py-1.5 text-sm rounded bg-orange-600 text-white hover:bg-orange-700 transition-all duration-300"
                >
                  Sync Products
                </button>
              </div>
            </section>
        </div>
      </AdminLayout>
    </>
  );
}

export default withAdminAuth(AdminDashboard);
