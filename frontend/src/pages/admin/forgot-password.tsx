import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { getErrorMessage } from '@/utils/error';
import toast from "react-hot-toast";

export default function AdminForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your admin email address');
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/password-reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email }),
      });

      const data = await response.json().catch(() => ({}));
      
      if (!response.ok) {
        throw new Error(data.detail || data.message || 'Failed to send reset email');
      }
      
      setSent(true);
    } catch (error) {
      console.error('Admin password reset error:', error);
      toast.error(getErrorMessage(error, 'An error occurred. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Admin Password Reset • Lootamo</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-tr from-gray-900 via-gray-800 to-gray-700 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white/10 backdrop-blur-md rounded-3xl shadow-2xl ring-1 ring-gray-100/10 overflow-hidden">
            <div className="px-6 pt-8 pb-4 text-center">
              <Link href="/" className="inline-flex items-center justify-center">
                <Image
                  src="/images/logo1.png"
                  alt="Lootamo"
                  width={120}
                  height={16}
                  className="h-12 w-auto"
                />
              </Link>
              <h1 className="mt-4 text-2xl font-bold text-white">Reset Admin Password</h1>
              <p className="mt-2 text-sm text-gray-300">
                {sent ? "Check your inbox for the reset link" : "Enter your admin email to receive a reset link"}
              </p>
            </div>

            <div className="px-6 pb-6">
              {!sent ? (
                <form onSubmit={onSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-200">Admin Email</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@lootamo.com"
                      className="mt-1 w-full rounded-lg border border-gray-600 bg-gray-800/50 px-3 py-2 text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full py-3 rounded-xl font-semibold text-white transition-all duration-300 ${
                      loading ? "bg-blue-500" : "bg-blue-600 hover:bg-blue-700"
                    }`}
                  >
                    {loading ? "Sending…" : "Send Reset Link"}
                  </button>
                  <p className="text-center text-xs text-gray-400">
                    Remembered your password?{' '}
                    <Link href="/admin/login" className="font-medium text-blue-400 hover:text-blue-300 hover:underline">
                      Back to admin login
                    </Link>
                  </p>
                </form>
              ) : (
                <div className="text-center space-y-4">
                  <div className="mx-auto h-12 w-12 rounded-full bg-green-100/20 text-green-400 flex items-center justify-center">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-300">
                    If an admin account exists for <span className="font-medium text-white">{email}</span>, we sent a reset link. It may take a minute to arrive.
                  </p>
                  <div className="flex items-center justify-center gap-4 text-sm">
                    <button
                      onClick={() => setSent(false)}
                      className="text-blue-400 hover:text-blue-300 hover:underline"
                    >
                      Try a different email
                    </button>
                    <Link href="/admin/login" className="text-blue-400 hover:text-blue-300 hover:underline">
                      Back to admin login
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-4">
            © {new Date().getFullYear()} Lootamo. All rights reserved.
          </p>
        </div>
      </div>
    </>
  );
}
