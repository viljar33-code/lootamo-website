import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuth } from '@/contexts/AuthContext';
import { User } from '@/types/user';
import { Order } from '@/services/checkoutService';
import {
  IoPersonOutline,
  IoCardOutline,
  IoShieldCheckmarkOutline,
  IoLogOutOutline,
  IoChevronForward,
  IoPersonCircleOutline
} from 'react-icons/io5';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const formatUserData = (data: User): User => ({
  id: Number(data.id),
  uuid: data.uuid || '',
  email: data.email || '',
  username: data.username || data.name || '',
  first_name: data.first_name || '',
  last_name: data.last_name || '',
  role: data.role,
  is_active: data.is_active,
  is_verified: data.is_verified,
  is_superuser: data.is_superuser,
  created_at: data.created_at,
  updated_at: data.updated_at,
  last_login: data.last_login,
  phone: data.phone || '',
  avatar_url: data.avatar_url || ''
});

export default function ProfileOrdersPage() {
  const { user: authUser, logout, api, isInitializing } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      setOrdersLoading(true);
      setOrdersError(null);
      const { checkoutService } = await import('../../services/checkoutService');
      const data = await checkoutService.getOrdersSummary(0, 100);
      setOrders(data.orders);
    } catch (error) {
      setOrdersError('Failed to load orders');
      console.error('Error fetching orders:', error);
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  const fetchUserProfile = useCallback(async () => {
    if (!authUser) {
      if (!isInitializing) {
        router.push('/signin');
      }
      return;
    }

    try {
      setIsLoading(true);
      const response = await api.get<User>('/auth/me');
      if (response.data) {
        setUser(formatUserData(response.data as User));
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      if (authUser) {
        setUser(formatUserData({
          ...authUser,
          username: authUser.username || authUser.name || '',
          first_name: authUser.first_name || '',
          last_name: authUser.last_name || '',
          phone: authUser.phone || '',
          avatar_url: authUser.avatar_url || null
        } as User));
      }
    } finally {
      setIsLoading(false);
    }
  }, [authUser, api, router, isInitializing]);

  useEffect(() => {
    fetchUserProfile();
    fetchOrders();
  }, [fetchUserProfile, fetchOrders]);

  if (isInitializing || (isLoading && authUser)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!authUser) {
    return null;
  }

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>My Orders • Lootamo</title>
      </Head>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-10">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <div className="w-full md:w-72">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
              <div className="p-6 text-center border-b">
                <div className="w-24 h-24 mx-auto rounded-full bg-gray-200 flex items-center justify-center mb-4 overflow-hidden shadow-md">
                  {user?.avatar_url ? (
                    <Image
                      src={user.avatar_url}
                      alt={`${user.first_name} ${user.last_name}`.trim() || 'User'}
                      width={96}
                      height={96}
                      className="rounded-full object-cover w-full h-full"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <IoPersonCircleOutline className={`text-gray-400 text-5xl ${user?.avatar_url ? 'hidden' : ''}`} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {user?.first_name || user?.last_name
                    ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                    : 'Welcome Back'}
                </h3>
                <p className="text-sm text-gray-500 truncate max-w-full">{user?.email || 'No email provided'}</p>
              </div>

              <nav className="p-2">
                {[
                  { id: 'overview', label: 'Overview', icon: IoPersonOutline, href: '/profile/overview' },
                  { id: 'orders', label: 'My Orders', icon: IoCardOutline, href: '/profile/orders' },
                  { id: 'security', label: 'Security', icon: IoShieldCheckmarkOutline, href: '/profile/security' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => router.push(tab.href)}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      tab.id === 'orders'
                        ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center">
                      <tab.icon className="mr-3 text-lg" />
                      {tab.label}
                    </div>
                    <IoChevronForward
                      className={`${tab.id === 'orders' ? 'text-white' : 'text-gray-400'}`}
                    />
                  </button>
                ))}

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center px-5 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg mt-4 transition"
                >
                  <IoLogOutOutline className="mr-3 text-lg" />
                  Logout
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-gray-100">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">My Orders</h2>
                  <button
                    onClick={fetchOrders}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    style={{ cursor: "pointer" }}
                  >
                    Refresh
                  </button>
                </div>

                {ordersLoading && (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-500">Loading orders...</p>
                  </div>
                )}

                {ordersError && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <p className="text-sm text-red-600">{ordersError}</p>
                  </div>
                )}

                {!ordersLoading && !ordersError && orders.length === 0 && (
                  <div className="text-center py-16">
                    <IoCardOutline className="mx-auto h-14 w-14 text-gray-400" />
                    <h3 className="mt-4 text-lg font-medium text-gray-900">No orders yet</h3>
                    <p className="mt-2 text-sm text-gray-500">  
                      You haven&apos;t placed any orders yet. Start shopping to see them here.
                    </p>

                      <button
                        onClick={() => router.push('/products')}
                        className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer"
                      >
                        Start Shopping
                      </button>
                    </div>
                )}

                {!ordersLoading && !ordersError && orders.length > 0 && (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div 
                        key={order.id} 
                        className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-200 cursor-pointer"
                        onClick={() => router.push(`/orders/${order.id}`)}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">Order #{order.id}</h3>
                            <p className="text-sm text-gray-500">
                              {new Date(order.created_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-semibold text-gray-900">
                              €{order.total_price.toFixed(2)}
                            </p>
                            <div className="flex gap-2 mt-1">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                order.status === 'complete' 
                                  ? 'bg-green-100 text-green-800'
                                  : order.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {order.status}
                              </span>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                order.payment_status === 'paid'
                                  ? 'bg-green-100 text-green-800'
                                  : order.payment_status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {order.payment_status}
                              </span>
                            </div>
                          </div>
                        </div>

                        {order.order_items && order.order_items.length > 0 && (
                          <div className="border-t border-gray-200 pt-4">
                            <h4 className="text-sm font-medium text-gray-900 mb-2">Order Items</h4>
                            <div className="space-y-2">
                              {order.order_items.map((item, index) => (
                                <div key={item.id || index} className="flex justify-between items-center text-sm">
                                  <div>
                                    <span className="text-gray-900">Product ID: {item.product_id}</span>
                                    <span className="text-gray-500 ml-2">Qty: {item.quantity}</span>
                                  </div>
                                  <span className="text-gray-900 font-medium">€{item.price.toFixed(2)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {order.payment_status === 'pending' && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/checkout?orderId=${order.id}`);
                              }}
                              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                            >
                              Complete Payment
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
