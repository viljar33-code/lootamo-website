import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuth } from '@/contexts/AuthContext';
import { getErrorMessage, getFieldErrors } from '@/utils/error';
import { User } from '@/types/user';
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

export default function ProfileSecurityPage() {
  const { user: authUser, logout, api, isInitializing } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState<string | null>(null);
  const [currentPasswordError, setCurrentPasswordError] = useState<string | null>(null);
  const [newPasswordError, setNewPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);

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
  }, [fetchUserProfile]);

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

  const handleDeleteAccount = async () => {
    try {
      setDeleteError(null);
      setIsDeleting(true);
      const response = await api.delete('/users/profile', { validateStatus: () => true });
      if (!response || response.status < 200 || response.status >= 300) {
        const payload = response?.data as { detail?: string; message?: string } | undefined;
        const msg = (payload?.detail || payload?.message || 'Failed to delete account').toString();
        setDeleteError(msg);
        return;
      }

      await logout().catch(() => { });
      try {
        await router.push('/');
      } catch {
        window.location.href = '/';
      }
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete account. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(null);
    setPwSuccess(null);
    setCurrentPasswordError(null);
    setNewPasswordError(null);
    setConfirmPasswordError(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      if (!currentPassword) setCurrentPasswordError('Current password is required');
      if (!newPassword) setNewPasswordError('New password is required');
      if (!confirmPassword) setConfirmPasswordError('Please confirm your new password');
      setPwError('Please fill in all required fields');
      return;
    }

    if (newPassword.length < 8) {
      setNewPasswordError('New password must be at least 8 characters long');
      setPwError('Fix the highlighted errors and try again');
      return;
    }

    if (newPassword === currentPassword) {
      setNewPasswordError('New password must be different from current password');
      setPwError('Fix the highlighted errors and try again');
      return;
    }

    if (newPassword !== confirmPassword) {
      setConfirmPasswordError('New password and confirm password do not match');
      setPwError('Fix the highlighted errors and try again');
      return;
    }

    try {
      setPwLoading(true);
      await api.post('/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      setPwSuccess('Password changed successfully');
      setTimeout(() => setPwSuccess(null), 4000);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      const globalMsg = getErrorMessage(err, 'Failed to change password');

      const fieldMsgs = getFieldErrors(err);
      if (fieldMsgs['body.current_password']) setCurrentPasswordError(fieldMsgs['body.current_password']);
      if (fieldMsgs['body.new_password']) setNewPasswordError(fieldMsgs['body.new_password']);
      if (fieldMsgs['body.confirm_password']) setConfirmPasswordError(fieldMsgs['body.confirm_password']);

      const lower = globalMsg.toLowerCase();
      if (!fieldMsgs['body.current_password'] && lower.includes('current password')) setCurrentPasswordError(globalMsg);
      if (!fieldMsgs['body.new_password'] && lower.includes('new password')) setNewPasswordError(globalMsg);
      if (!fieldMsgs['body.confirm_password'] && (lower.includes('match') || lower.includes('confirm'))) setConfirmPasswordError(globalMsg);

      setPwError(globalMsg);
    } finally {
      setPwLoading(false);
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
        <title>Security Settings • Lootamo</title>
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
                      tab.id === 'security'
                        ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center">
                      <tab.icon className="mr-3 text-lg" />
                      {tab.label}
                    </div>
                    <IoChevronForward
                      className={`${tab.id === 'security' ? 'text-white' : 'text-gray-400'}`}
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
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Security Settings</h2>
                <div className="space-y-8">
                  {/* Password */}
                  <div className="border-b pb-6">
                    <h3 className="text-sm font-medium text-gray-500 mb-4 tracking-wide">PASSWORD</h3>
                    {pwError && (
                      <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700 border border-red-100">{pwError}</div>
                    )}
                    {pwSuccess && (
                      <div className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-700 border border-green-100">{pwSuccess}</div>
                    )}
                    <form onSubmit={handleChangePassword} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Current Password</label>
                        <input
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-300 focus:ring-2 focus:ring-gray-200"
                          placeholder="••••••••"
                          required
                        />
                        {currentPasswordError && (
                          <p className="mt-1 text-xs text-red-600">{currentPasswordError}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">New Password</label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-300 focus:ring-2 focus:ring-gray-200"
                          placeholder="At least 8 characters"
                          minLength={8}
                          required
                        />
                        {newPasswordError && (
                          <p className="mt-1 text-xs text-red-600">{newPasswordError}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-300 focus:ring-2 focus:ring-gray-200"
                          placeholder="Re-enter new password"
                          minLength={8}
                          required
                        />
                        {confirmPasswordError && (
                          <p className="mt-1 text-xs text-red-600">{confirmPasswordError}</p>
                        )}
                      </div>
                      <div className="md:col-span-3">
                        <button
                          type="submit"
                          disabled={pwLoading}
                          className="inline-flex items-center px-5 py-2.5 text-sm font-medium rounded-lg shadow-md text-white bg-gray-900 hover:bg-black disabled:opacity-70"
                        >
                          {pwLoading ? 'Saving...' : 'Change Password'}
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* 2FA */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-4 tracking-wide">
                      TWO-FACTOR AUTHENTICATION
                    </h3>
                    <div className="bg-yellow-50 p-5 rounded-xl border border-yellow-100">
                      <div className="flex items-start">
                        <IoShieldCheckmarkOutline className="text-yellow-500 text-xl mr-3 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="font-medium text-yellow-800">Two-factor authentication is off</h4>
                          <p className="text-sm text-yellow-700 mt-1">
                            Add an extra layer of security to your account by enabling two-factor authentication.
                          </p>
                          <button className="mt-3 text-sm font-medium text-yellow-600 hover:text-yellow-800 transition">
                            Set up 2FA
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Danger Zone */}
                  <div className="border-t pt-6">
                    <h3 className="text-sm font-medium text-red-500 mb-4 tracking-wide">DANGER ZONE</h3>
                    <div className="bg-red-50 p-5 rounded-xl border border-red-100">
                      <h4 className="font-medium text-red-800">Delete Account</h4>
                      <p className="text-sm text-red-700 mt-1">
                        Once you delete your account, there is no going back. Please be certain.
                      </p>
                      <button onClick={() => setIsDeleteOpen(true)} className="mt-3 inline-flex items-center px-5 py-2.5 text-sm font-medium rounded-lg shadow-md text-white bg-red-600 hover:bg-red-700 transition">
                        Delete Account
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />

      {/* Delete Confirmation Modal */}
      {isDeleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl border border-gray-200">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900">Delete Account</h3>
              <p className="mt-2 text-sm text-gray-600">
                This action is permanent and cannot be undone. All of your account data will be deleted.
              </p>
              {deleteError && (
                <div className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
                  {deleteError}
                </div>
              )}
              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsDeleteOpen(false)}
                  disabled={isDeleting}
                  className="px-4 py-2 text-sm rounded-md border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={isDeleting}
                  className="px-4 py-2 text-sm rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-70"
                >
                  {isDeleting ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
