import Head from "next/head";
import { useEffect, useState, useCallback } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import ChangePasswordModal from "@/components/admin/ChangePasswordModal";
import EditProfileModal from "@/components/admin/EditProfileModal";
import { FiUser, FiMail, FiPhone, FiEdit2, FiLogOut, FiShield, FiBell, FiKey, FiActivity, FiCalendar, FiCheckCircle } from "react-icons/fi";
import { useAuth } from "@/contexts/AuthContext";
import { ProductService } from "@/services/productService";

interface UserProfile {
  id: number;
  uuid: string;
  email: string;
  username: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
  is_active: boolean;
  is_verified: boolean;
  is_superuser: boolean;
  created_at: string;
  updated_at: string;
  last_login: string | null;
  phone: string | null;
  avatar_url: string | null;
}

interface Order {
  user_id: number;
  user_name: string;
  user_email: string;
  product_name: string;
  total_price: number;
  currency: string;
  order_items: number;
  order_status: string;
  payment_status: string;
  order_date: string;
}

export default function AdminProfile() {
  const { api, logout } = useAuth();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalProducts, setTotalProducts] = useState<number>(0);
  const [productsLoading, setProductsLoading] = useState(true);
  const [completedOrders, setCompletedOrders] = useState<number>(0);
  const [pendingOrders, setPendingOrders] = useState<number>(0);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [changePasswordModalOpen, setChangePasswordModalOpen] = useState(false);
  const [editProfileModalOpen, setEditProfileModalOpen] = useState(false);

  const fetchUserProfile = useCallback(async () => {
    if (!api) return;
    
    try {
      setLoading(true);
      const response = await api.get('/auth/me');
      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      setError('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  }, [api]);

  const fetchTotalProducts = useCallback(async () => {
    try {
      setProductsLoading(true);
      const productService = ProductService.getInstance();
      const response = await productService.getProducts({ skip: 0, limit: 1 });
      setTotalProducts(response.total);
    } catch (error) {
      console.error('Failed to fetch total products:', error);
    } finally {
      setProductsLoading(false);
    }
  }, []);

  const fetchOrderStatistics = useCallback(async () => {
    if (!api) return;
    
    try {
      setOrdersLoading(true);
      const response = await api.get('/orders/admin/all?skip=0&limit=1000');
      const orders = response.data.orders;
      
      const completed = orders.filter((order: Order) => order.order_status === 'complete').length;
      const pending = orders.filter((order: Order) => order.order_status === 'pending').length;
      
      setCompletedOrders(completed);
      setPendingOrders(pending);
    } catch (error) {
      console.error('Failed to fetch order statistics:', error);
    } finally {
      setOrdersLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchUserProfile();
    fetchTotalProducts();
    fetchOrderStatistics();
  }, [fetchUserProfile, fetchTotalProducts, fetchOrderStatistics]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getFullName = () => {
    if (!user) return 'Loading...';
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return user.username || user.email;
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleProfileUpdate = (updatedUser: UserProfile) => {
    setUser(updatedUser);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Failed to load profile'}</p>
          <button 
            onClick={fetchUserProfile}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>My Profile • Lootamo Admin</title>
      </Head>

      <AdminLayout>
        <div className="space-y-8">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-blue-500 to-indigo-700 rounded-2xl shadow-xl overflow-hidden">
              <div className="px-6 py-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-white">My Profile</h1>
                    <p className="text-blue-100 text-sm">
                      Manage your account settings and monitor license activity
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button   
                      onClick={() => setEditProfileModalOpen(true)}
                      className="flex items-center gap-2 px-4 py-3 text-sm bg-white/10 backdrop-blur-sm text-white rounded-xl hover:bg-white/20 transition-all duration-200 border border-white/20"
                      style={{ cursor: 'pointer' }}
                    >
                      <FiEdit2 className="text-lg" />
                      Edit Profile
                    </button>                 
                  </div>
                </div>
              </div>
            </div>

            <section className="space-y-6">

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300">
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center text-2xl shadow-lg">
                        <FiUser />
                      </div>
                      <div>
                        <div className="text-xl font-bold text-gray-900">{getFullName()}</div>
                        <div className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                          <FiUser className="text-xs" />
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </div>
                        <div className="inline-flex items-center gap-1 mt-2 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                          <FiCalendar className="text-xs" />
                          Member since {formatDate(user.created_at)}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 gap-4">
                      <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4 border border-emerald-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-xs font-medium text-emerald-700 mb-1">Total Products</div>
                            <div className="text-2xl font-bold text-emerald-900">
                              {productsLoading ? (
                                <div className="animate-pulse">...</div>
                              ) : (
                                totalProducts.toLocaleString()
                              )}
                            </div>
                          </div>
                          <div className="p-2 bg-emerald-200 rounded-lg">
                            <FiActivity className="text-emerald-700" />
                          </div>
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-xs font-medium text-blue-700 mb-1">License Keys Delivered</div>
                            <div className="text-2xl font-bold text-blue-900">
                              {ordersLoading ? (
                                <div className="animate-pulse">...</div>
                              ) : (
                                completedOrders.toLocaleString()
                              )}
                            </div>
                          </div>
                          <div className="p-2 bg-blue-200 rounded-lg">
                            <FiCheckCircle className="text-blue-700" />
                          </div>
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4 border border-amber-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-xs font-medium text-amber-700 mb-1">Pending Keys</div>
                            <div className="text-2xl font-bold text-amber-900">
                              {ordersLoading ? (
                                <div className="animate-pulse">...</div>
                              ) : (
                                pendingOrders.toLocaleString()
                              )}
                            </div>
                          </div>
                          <div className="p-2 bg-amber-200 rounded-lg">
                            <FiKey className="text-amber-700" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                
                <div className="lg:col-span-2 bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300">
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-slate-500 to-slate-600 shadow-lg">
                        <FiUser className="text-xl text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">Account Details</h3>
                        <p className="text-gray-600">Your personal and professional information</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Username</label>
                        <div className="p-4 border-2 border-gray-200 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 font-medium text-gray-900">
                          {user.username}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Email Address</label>
                        <div className="p-4 border-2 border-gray-200 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center gap-3">
                          <div className="p-2 bg-blue-200 rounded-lg">
                            <FiMail className="text-blue-700" />
                          </div>
                          <span className="font-medium text-blue-900">{user.email}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">First Name</label>
                        <div className="p-4 border-2 border-gray-200 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 font-medium text-gray-900">
                          {user.first_name || 'Not provided'}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Last Name</label>
                        <div className="p-4 border-2 border-gray-200 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 font-medium text-gray-900">
                          {user.last_name || 'Not provided'}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Phone</label>
                        <div className="p-4 border-2 border-gray-200 rounded-xl bg-gradient-to-br from-green-50 to-green-100 flex items-center gap-3">
                          <div className="p-2 bg-green-200 rounded-lg">
                            <FiPhone className="text-green-700" />
                          </div>
                          <span className="font-medium text-green-900">{user.phone || 'Not provided'}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Role</label>
                        <div className="p-4 border-2 border-gray-200 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 flex items-center gap-3">
                          <div className="p-2 bg-purple-200 rounded-lg">
                            <FiShield className="text-purple-700" />
                          </div>
                          <span className="font-medium text-purple-900">{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Account Status</label>
                        <div className={`p-4 border-2 border-gray-200 rounded-xl bg-gradient-to-br flex items-center gap-3 ${
                          user.is_active ? 'from-green-50 to-green-100' : 'from-red-50 to-red-100'
                        }`}>
                          <div className={`p-2 rounded-lg ${
                            user.is_active ? 'bg-green-200' : 'bg-red-200'
                          }`}>
                            <FiCheckCircle className={user.is_active ? 'text-green-700' : 'text-red-700'} />
                          </div>
                          <span className={`font-medium ${
                            user.is_active ? 'text-green-900' : 'text-red-900'
                          }`}>
                            {user.is_active ? 'Active' : 'Inactive'}
                            {user.is_verified && ' • Verified'}
                            {user.is_superuser && ' • Super User'}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Member Since</label>
                        <div className="p-4 border-2 border-gray-200 rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100 flex items-center gap-3">
                          <div className="p-2 bg-indigo-200 rounded-lg">
                            <FiCalendar className="text-indigo-700" />
                          </div>
                          <span className="font-medium text-indigo-900">
                            {formatDate(user.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg">
                      <FiKey className="text-xl text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Recent License Deliveries</h3>
                      <p className="text-gray-600">Track your software and game license distribution</p>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="p-6 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full mb-6">
                      <FiKey className="text-4xl text-orange-600" />
                    </div>
                    <div className="space-y-2 mb-6">
                      <div className="text-lg font-semibold text-gray-900">No licenses delivered yet</div>
                      <div className="text-sm text-gray-600 max-w-md">
                        Once you deliver a software or game license, it will appear here with detailed tracking information.
                      </div>
                    </div>
                    <button className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 font-medium transition-all duration-200 shadow-lg hover:shadow-xl">
                      <div className="flex items-center gap-2">
                        <FiKey className="text-lg" />
                        Deliver First License
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300">
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-red-500 to-red-600 shadow-lg">
                        <FiShield className="text-xl text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">Security & Access</h3>
                        <p className="text-gray-600">Manage your account security settings</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4">
                      <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-gray-900">Password Security</div>
                            <div className="text-sm text-gray-600 mt-1">Last updated: recently</div>
                          </div>
                          <button 
                            onClick={() => setChangePasswordModalOpen(true)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                            style={{ cursor: 'pointer' }}
                          >
                            Change
                          </button>
                        </div>
                      </div>
                      <div className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl border border-emerald-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-emerald-900">Two-Factor Authentication</div>
                            <div className="text-sm text-emerald-700 mt-1">Enhance account security</div>
                          </div>
                          <label className="inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only" />
                            <span className="w-12 h-6 bg-gray-300 rounded-full relative after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:w-5 after:h-5 after:rounded-full transition-all hover:bg-emerald-400" />
                          </label>
                        </div>
                      </div>
                      <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-blue-900">Session Management</div>
                            <div className="text-sm text-blue-700 mt-1">Recent devices and activity</div>
                          </div>
                          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                            Review
                          </button>
                        </div>
                      </div>
                      <div className="p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-xl border border-red-200">
                        <div className="flex items-center justify-between">
                          <div className="font-semibold text-red-900">Logout from all devices</div>
                          <button
                          onClick={handleLogout}
                           className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                           style={{ cursor: 'pointer' }}>
                            <FiLogOut />
                            Logout
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300">
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg">
                        <FiBell className="text-xl text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">Notifications</h3>
                        <p className="text-gray-600">Configure your notification preferences</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4">
                      <div className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl border border-emerald-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-emerald-900">License Deliveries</div>
                            <div className="text-sm text-emerald-700 mt-1">Notify when licenses are delivered</div>
                          </div>
                          <label className="inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only" defaultChecked />
                            <span className="w-12 h-6 bg-emerald-400 rounded-full relative after:content-[''] after:absolute after:top-0.5 after:left-6 after:bg-white after:w-5 after:h-5 after:rounded-full transition-all" />
                          </label>
                        </div>
                      </div>
                      <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-gray-900">System Alerts</div>
                            <div className="text-sm text-gray-600 mt-1">Maintenance and updates</div>
                          </div>
                          <label className="inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only" />
                            <span className="w-12 h-6 bg-gray-300 rounded-full relative after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:w-5 after:h-5 after:rounded-full transition-all" />
                          </label>
                        </div>
                      </div>
                      <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-gray-900">Promotions & DLC</div>
                            <div className="text-sm text-gray-600 mt-1">New games, updates, and DLCs</div>
                          </div>
                          <label className="inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only" />
                            <span className="w-12 h-6 bg-gray-300 rounded-full relative after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:w-5 after:h-5 after:rounded-full transition-all" />
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
        </div>
      </AdminLayout>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={changePasswordModalOpen}
        onClose={() => setChangePasswordModalOpen(false)}
      />

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={editProfileModalOpen}
        onClose={() => setEditProfileModalOpen(false)}
        user={user}
        onProfileUpdate={handleProfileUpdate}
      />
    </>
  );
}
