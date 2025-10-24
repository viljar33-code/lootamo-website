import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { getErrorMessage } from '@/utils/error';

export default function ResetPassword() {
  const router = useRouter();
  const { token, error: urlError } = router.query;
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    if (urlError === 'invalid_token') {
      setError("The password reset link is invalid or has expired. Please request a new one.");
    } else if (!token) {
      setError("Invalid or missing reset token");
    }
  }, [token, urlError]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }
    
    if (!token) {
      setError("Invalid reset token");
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/password-reset/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ 
          token,
          new_password: password,
          confirm_password: confirmPassword
        }),
      });

      const data = await response.json().catch(() => ({}));
      
      if (!response.ok) {
        throw new Error(data.detail || data.message || 'Failed to reset password');
      }
      
      // Store user role for redirect logic
      if (data.role) {
        setUserRole(data.role);
      }
      
      setSuccess(true);
    } catch (err) {
      console.error('Password reset error:', err);
      setError(getErrorMessage(err, 'An error occurred. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-[100vh] bg-gray-200 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white/90 backdrop-blur rounded-2xl shadow-xl ring-1 ring-gray-100 overflow-hidden p-6 text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Invalid Reset Link</h2>
            <p className="text-gray-600 mb-6">The password reset link is invalid or has expired.</p>
            <Link href="/forgot" className="text-indigo-600 hover:text-indigo-500 font-medium">
              Request a new reset link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-[100vh] bg-gray-200 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white/90 backdrop-blur rounded-2xl shadow-xl ring-1 ring-gray-100 overflow-hidden p-6 text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="mt-3 text-xl font-bold text-gray-900">Password Reset Successful</h2>
            <p className="mt-2 text-gray-600">Your password has been successfully reset.</p>
            <Link 
              href={userRole === 'admin' ? '/admin/login' : '/signin'} 
              className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {userRole === 'admin' ? 'Back to Admin Login' : 'Back to Sign In'}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Reset Password • Lootamo</title>
      </Head>

      <div className="min-h-[100vh] bg-gray-200 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white/90 backdrop-blur rounded-2xl shadow-xl ring-1 ring-gray-100 overflow-hidden">
            <div className="px-6 pt-6 pb-4 text-center">
              <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Create New Password</h1>
              <p className="mt-1 text-sm text-gray-500">
                Enter your new password below
              </p>
              {error && (
                <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded-md">
                  {error}
                </div>
              )}
            </div>

            <div className="px-6 pb-6">
              <form onSubmit={onSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">New Password</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-300 focus:ring-2 focus:ring-gray-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-300 focus:ring-2 focus:ring-gray-200"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex justify-center items-center gap-2 rounded-md bg-gray-900 text-white py-2.5 text-sm font-semibold hover:bg-black disabled:opacity-70"
                >
                  {loading ? "Resetting..." : "Reset Password"}
                </button>
              </form>
              <p className="mt-4 text-center text-xs text-gray-500">
                Remembered your password?{' '}
                <Link href="/signin" className="font-medium text-gray-900 hover:underline">
                  Back to sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
