import Head from "next/head";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import AdminLayout from "@/components/layouts/AdminLayout";
import { useAuth } from '@/contexts/AuthContext';
import { AdminService, AdminUser, UserOrderStats } from '@/services/adminService';
import { 
  FiUser, 
  FiMail, 
  FiPhone, 
  FiCalendar, 
  FiShield, 
  FiArrowLeft,
  FiCheck,
  FiX,
  FiClock,
  FiUserCheck
} from "react-icons/fi";

export default function UserDetails() {
  const router = useRouter();
  const { id } = router.query;
  const { api } = useAuth();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [orderStats, setOrderStats] = useState<UserOrderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id && typeof id === 'string') {
      fetchUserDetails(parseInt(id));
    }
  }, [id]);

  const fetchUserDetails = async (userId: number) => {
    try {
      setLoading(true);
      setError(null);
      const adminService = new AdminService(api);
      
      // Fetch user details and order statistics in parallel
      const [userData, orderStatsData] = await Promise.all([
        adminService.getUserById(userId),
        adminService.getUserOrderStats(userId)
      ]);
      
      setUser(userData);
      setOrderStats(orderStatsData);
    } catch (error) {
      console.error('Failed to fetch user details:', error);
      setError('Failed to load user details');
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    router.push('/admin/users');
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'manager': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'supplier': return 'bg-green-100 text-green-800 border-green-200';
      case 'customer': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusBadgeColor = (isActive: boolean, isVerified: boolean) => {
    if (!isActive) return 'bg-red-100 text-red-800 border-red-200';
    if (!isVerified) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-green-100 text-green-800 border-green-200';
  };

  const getStatusText = (isActive: boolean, isVerified: boolean) => {
    if (!isActive) return 'Inactive';
    if (!isVerified) return 'Unverified';
    return 'Active';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <div className="text-gray-500 mt-4">Loading user details...</div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error || !user) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="text-red-500 text-xl mb-4">⚠️</div>
            <div className="text-gray-500">{error || 'User not found'}</div>
            <button
              onClick={handleGoBack}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              Back to Users
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <>
      <Head>
        <title>{user.first_name} {user.last_name} • User Details • Lootamo Admin</title>
      </Head>
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleGoBack}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Back to Users"
                style={{ cursor: "pointer" }}
              >
                <FiArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">
                  {user.first_name} {user.last_name}
                </h1>
                <p className="text-gray-600 mt-1">@{user.username}</p>
              </div>
            </div>         
          </div>

          {/* User Info Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Basic Information */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <FiUser className="text-blue-600" />
                Basic Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <div className="text-lg font-semibold text-gray-900">
                      {user.first_name} {user.last_name}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                    <div className="text-gray-900">@{user.username}</div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <div className="flex items-center gap-2">
                      <FiMail className="text-gray-400" />
                      <span className="text-gray-900">{user.email}</span>
                    </div>
                  </div>
                  
                  {user.phone && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <div className="flex items-center gap-2">
                        <FiPhone className="text-gray-400" />
                        <span className="text-gray-900">{user.phone}</span>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
                    <div className="text-gray-900 font-mono text-sm">{user.id}</div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">UUID</label>
                    <div className="text-gray-900 font-mono text-xs break-all">{user.uuid}</div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getRoleBadgeColor(user.role)}`}>
                      <FiShield className="w-4 h-4 mr-1" />
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </span>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusBadgeColor(user.is_active, user.is_verified)}`}>
                      {user.is_active && user.is_verified ? (
                        <FiCheck className="w-4 h-4 mr-1" />
                      ) : (
                        <FiX className="w-4 h-4 mr-1" />
                      )}
                      {getStatusText(user.is_active, user.is_verified)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Account Status */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <FiUserCheck className="text-green-600" />
                Account Status
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Active Account</span>
                  <div className={`w-3 h-3 rounded-full ${user.is_active ? 'bg-green-500' : 'bg-red-500'}`}></div>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Email Verified</span>
                  <div className={`w-3 h-3 rounded-full ${user.is_verified ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Superuser</span>
                  <div className={`w-3 h-3 rounded-full ${user.is_superuser ? 'bg-purple-500' : 'bg-gray-400'}`}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Activity & Timestamps */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Account Activity */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <FiClock className="text-orange-600" />
                Account Activity
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Created At</label>
                  <div className="flex items-center gap-2 text-gray-900">
                    <FiCalendar className="text-gray-400" />
                    <span>{formatDate(user.created_at)}</span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Updated</label>
                  <div className="flex items-center gap-2 text-gray-900">
                    <FiCalendar className="text-gray-400" />
                    <span>{formatDate(user.updated_at)}</span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Login</label>
                  <div className="flex items-center gap-2 text-gray-900">
                    <FiClock className="text-gray-400" />
                    <span>
                      {user.last_login ? formatDate(user.last_login) : 'Never logged in'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Statistics */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <FiShield className="text-purple-600" />
                Order Statistics
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div>
                    <div className="text-sm font-medium text-gray-700">Total Orders</div>
                    <div className="text-2xl font-bold text-blue-600">{orderStats?.total_orders ?? 0}</div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                  <div>
                    <div className="text-sm font-medium text-gray-700">Total Spent</div>
                    <div className="text-2xl font-bold text-green-600">€{(orderStats?.total_spent ?? 0).toFixed(2)}</div>
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