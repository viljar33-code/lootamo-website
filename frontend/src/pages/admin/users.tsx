import Head from "next/head";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { FiUsers, FiTrash2, FiSearch, FiRefreshCw, FiEye, FiShield, FiMail, FiUserPlus, FiChevronLeft, FiChevronRight, FiX } from "react-icons/fi";
import AdminLayout from "@/components/layouts/AdminLayout";
import { useAuth } from '@/contexts/AuthContext';
import { AdminService, AdminUser } from '@/services/adminService';
import withAdminAuth from '@/hocs/withAdminAuth';
import ConfirmationModal from "@/components/ConfirmationModal";

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  verifiedUsers: number;
  adminUsers: number;
  newUsersThisWeek: number;
}

function AdminUsers() {
  const { api } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<UserStats>({
    totalUsers: 0,
    activeUsers: 0,
    adminUsers: 0,
    verifiedUsers: 0,
    newUsersThisWeek: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'customer' | 'supplier' | 'manager' | 'admin'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'verified' | 'unverified'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const itemsPerPage = 10;
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    userId: number;
    userEmail: string;
  }>({ isOpen: false, userId: 0, userEmail: '' });
  
  const [addUserModal, setAddUserModal] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    username: '',
    first_name: '',
    last_name: '',
    phone: '',
    password: '',
    role: 'customer' as 'customer' | 'admin'
  });
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      await fetchUsers();
      await fetchUserStats();
    };
    loadData();
  }, [currentPage]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const adminService = new AdminService(api);
      const skip = (currentPage - 1) * itemsPerPage;
      const result = await adminService.getUsers(skip, itemsPerPage);
      
      setUsers(result.users);
      setTotalUsers(result.total);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      const adminService = new AdminService(api);
      const dashboardStats = await adminService.getDashboardStats();
      
      // Calculate admin and verified users from the users data if not provided by backend
      const adminUsers = dashboardStats.adminUsers ?? users.filter(user => user.role === 'admin').length;
      const verifiedUsers = dashboardStats.verifiedUsers ?? users.filter(user => user.is_verified).length;
      
      setStats({
        totalUsers: dashboardStats.totalUsers,
        activeUsers: dashboardStats.activeUsers,
        adminUsers: adminUsers,
        verifiedUsers: verifiedUsers,
        newUsersThisWeek: dashboardStats.newUsersThisWeek
      });
    } catch (error) {
      console.error('Failed to fetch user stats:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchUsers(), fetchUserStats()]);
    setRefreshing(false);
  };

  const handleDeleteClick = (user: AdminUser) => {
    setDeleteModal({
      isOpen: true,
      userId: user.id,
      userEmail: user.email
    });
  };

  const handleDeleteConfirm = async () => {
    try {
      const adminService = new AdminService(api);
      await adminService.deleteUser(deleteModal.userId);
      await fetchUsers();
      setDeleteModal({ isOpen: false, userId: 0, userEmail: '' });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to delete user: ${errorMessage}`);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({ isOpen: false, userId: 0, userEmail: '' });
  };

  const handleAddUser = () => {
    setAddUserModal(true);
  };

  const handleAddUserCancel = () => {
    setAddUserModal(false);
    setNewUser({
      email: '',
      username: '',
      first_name: '',
      last_name: '',
      phone: '',
      password: '',
      role: 'customer'
    });
  };

  const handleCreateUser = async () => {
    try {
      setIsCreating(true);
      const adminService = new AdminService(api);
      await adminService.createUser(newUser);
      await fetchUsers();
      await fetchUserStats();
      handleAddUserCancel();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to create user: ${errorMessage}`);
    } finally {
      setIsCreating(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setNewUser(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleUpdateRole = async (userId: number, newRole: 'customer' | 'supplier' | 'manager' | 'admin') => {
    try {
      const adminService = new AdminService(api);
      await adminService.updateUserRole(userId, newRole);
      await fetchUsers();
      await fetchUserStats(); // Refresh stats after role change
    } catch (error: unknown) {
      console.error('Role update error:', error);
      let errorMessage = 'Failed to update user role';
      
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number; data?: { detail?: string } } };
        if (axiosError.response?.status === 403) {
          errorMessage = 'Access denied. You do not have permission to update user roles.';
        } else if (axiosError.response?.data?.detail) {
          errorMessage = axiosError.response.data.detail;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      alert(errorMessage);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${user.first_name || ''} ${user.last_name || ''}`.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    const matchesStatus = (() => {
      switch (statusFilter) {
        case 'all':
          return true;
        case 'active':
          return user.is_active && user.is_verified;
        case 'inactive':
          return !user.is_active;
        case 'verified':
          return user.is_verified;
        case 'unverified':
          return !user.is_verified;
        default:
          return true;
      }
    })();
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Pagination calculations based on filtered users
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPageUsers = filteredUsers.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter, statusFilter]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Generate page numbers for pagination
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

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800';
      case 'manager': return 'bg-orange-100 text-orange-800';
      case 'supplier': return 'bg-green-100 text-green-800';
      case 'customer': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadgeColor = (isActive: boolean, isVerified: boolean) => {
    if (!isActive) return 'bg-red-100 text-red-800';
    if (!isVerified) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const getStatusText = (isActive: boolean, isVerified: boolean) => {
    if (!isActive) return 'Inactive';
    if (!isVerified) return 'Unverified';
    return 'Active';
  };

  const handleViewUser = (userId: number) => {
    router.push(`/admin/users/${userId}`);
  };

  return (
    <>
      <Head>
        <title>User Management • Lootamo Admin</title>
      </Head>
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">User Management</h1>
            <p className="text-gray-600 mt-1">Manage customer accounts, roles, and access permissions</p>
          </div>

          {/* User Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <div className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl px-6 py-4 border border-blue-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <FiUsers className="text-lg text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-100 to-green-200 rounded-xl px-6 py-4 border border-green-200 min-w-[200px]">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500 rounded-lg">
                  <FiShield className="text-lg text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Active Users</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.activeUsers}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl px-6 py-4 border border-purple-200 min-w-[200px]">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500 rounded-lg">
                  <FiMail className="text-lg text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Verified</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.verifiedUsers}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl px-6 py-4 border border-orange-200 min-w-[200px]">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500 rounded-lg">
                  <FiShield className="text-lg text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Admins</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.adminUsers}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-xl px-6 py-4 border border-indigo-200 min-w-[200px]">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500 rounded-lg">
                  <FiUserPlus className="text-lg text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">New This Week</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.newUsersThisWeek}</p>
                </div>
              </div>
            </div>
          </div>

        {/* User Management */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">User Management</h2>
            <div className="flex gap-2">
              <button 
                onClick={handleRefresh}
                disabled={refreshing}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50"
                style={{ cursor: "pointer" }}
              >
                <FiRefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button 
                onClick={handleAddUser}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                style={{ cursor: "pointer" }}
              >
                <FiUserPlus className="w-4 h-4" />
                Add User
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as 'all' | 'customer' | 'supplier' | 'manager' | 'admin')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              style={{ cursor: "pointer" }}
            >
              <option value="all">All Roles</option>
              <option value="customer">Customers</option>
              <option value="supplier">Suppliers</option>
              <option value="manager">Managers</option>
              <option value="admin">Admins</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive' | 'verified' | 'unverified')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              style={{ cursor: "pointer" }}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="verified">Verified</option>
              <option value="unverified">Unverified</option>
            </select>
          </div>

          {/* User Table */}
          <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-900">#</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">User</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Email</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Role</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Orders</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Total Spent</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Last Login</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={9} className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      </td>
                    </tr>
                  ) : currentPageUsers.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-8 text-gray-500">
                        No users found
                      </td>
                    </tr>
                  ) : (
                    currentPageUsers.map((user, index) => (
                      <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <div className="font-medium text-gray-900">{(currentPage - 1) * itemsPerPage + index + 1}</div>
                        </td>
                        <td className="py-4 px-4">
                          <div>
                            <div className="font-medium text-gray-900">
                              {user.first_name} {user.last_name}
                            </div>
                            <div className="text-sm text-gray-500">@{user.username}</div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-sm">{user.email}</div>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(user.is_active, user.is_verified)}`}>
                            {getStatusText(user.is_active, user.is_verified)}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-sm font-medium">{user.total_orders ?? 0}</div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-sm font-medium">€{(user.total_spent ?? 0).toFixed(2)}</div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-sm">
                            {user.last_login 
                              ? new Date(user.last_login).toLocaleDateString()
                              : 'Never'
                            }
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleViewUser(user.id)}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                              style={{ cursor: "pointer" }}
                              title="View User"
                            >
                              <FiEye className="text-sm" />
                            </button>                       
                            <button
                              onClick={() => handleDeleteClick(user)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete User"
                              style={{ cursor: "pointer" }}
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                            <select
                              value={user.role}
                              onChange={(e) => handleUpdateRole(user.id, e.target.value as 'customer' | 'supplier' | 'manager' | 'admin')}
                              className="text-xs px-2 py-1 border border-gray-300 rounded"
                              title="Change Role"
                              style={{ cursor: "pointer" }}
                              >
                              <option value="customer">Customer</option>
                              <option value="supplier">Supplier</option>
                              <option value="manager">Manager</option>
                              <option value="admin">Admin</option>
                            </select>
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
              <div className="flex justify-center items-center mt-6 space-x-2">
                {/* Previous button */}
                <button
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className={`p-2 rounded-lg transition-colors ${
                    currentPage === 1
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-gray-600 hover:bg-gray-100'
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
                        onClick={() => handlePageChange(page as number)}
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
                  onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
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

        {/* Delete Confirmation Modal */}
        <ConfirmationModal
          isOpen={deleteModal.isOpen}
          onClose={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
          title="Delete User"
          message={`Are you sure you want to delete the user "${deleteModal.userEmail}"? This action cannot be undone and will permanently remove all user data.`}
          confirmText="Delete User"
          cancelText="Cancel"
          type="danger"
        />

        {/* Add User Modal */}
        {addUserModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: '#00000080' }}>
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Add New User</h3>
                <button
                  onClick={handleAddUserCancel}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleCreateUser(); }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
                  <input
                    type="text"
                    value={newUser.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <input
                      type="text"
                      value={newUser.first_name}
                      onChange={(e) => handleInputChange('first_name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <input
                      type="text"
                      value={newUser.last_name}
                      onChange={(e) => handleInputChange('last_name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={newUser.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    minLength={6}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => handleInputChange('role', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="customer">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleAddUserCancel}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating || !newUser.email || !newUser.username || !newUser.password}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCreating ? 'Creating...' : 'Create User'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </AdminLayout>
    </>
  );
}

export default withAdminAuth(AdminUsers);
