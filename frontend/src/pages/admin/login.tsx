/* eslint-disable @typescript-eslint/no-explicit-any */
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Box, CircularProgress } from "@mui/material";
import toast from 'react-hot-toast';

export default function AdminLogin() {
  const router = useRouter();
  const { login, logout, user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && user?.role === 'admin') {
      router.push('/admin/dashboard');
    }
  }, [user, router, authLoading]);

  if (authLoading || (user && user.role === 'admin' && router.pathname !== '/admin/dashboard')) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      const errorMsg = 'Email and password are required';
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }
    
    try {
      setLoading(true);
      const response = await login(email, password);
      const user = response.data;
      
      if (user?.role === 'admin') {
        return;
      } else {
        if (user) {
          await logout();
        }
        const errorMsg = 'Access denied. Admin privileges required.';
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (err: any) {
      console.error("Login error:", err);
      const errorMessage = err?.response?.data?.detail || 
                         err?.message || 
                         "Login failed. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Admin Login • Lootamo</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-tr from-gray-900 via-gray-800 to-gray-700 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="bg-white/10 backdrop-blur-md rounded-3xl shadow-2xl ring-1 ring-gray-100/10 overflow-hidden transition-all duration-300 hover:scale-[1.02]">
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
              <h1 className="mt-4 text-3xl font-extrabold text-white">Admin Dashboard</h1>
              <p className="mt-2 text-sm text-gray-300">
              Log in to manage games, software, products, and orders.
              </p>
            </div>

            <form onSubmit={onSubmit} className="px-6 pb-6 pt-2 space-y-5">
              {error && (
                <div className="text-sm text-red-500 bg-red-100 border border-red-400 rounded px-3 py-2 transition-all duration-300">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-200">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@lootamo.com"
                  className="mt-1 w-full rounded-lg border border-gray-600 bg-gray-800/50 px-3 py-2 text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-200">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="mt-1 w-full rounded-lg border border-gray-600 bg-gray-800/50 px-3 py-2 text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 rounded-xl font-semibold text-white transition-all duration-300 ${
                  loading ? "bg-blue-500" : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {loading ? "Logging in…" : "Log in"}
              </button>

              <div className="text-xs text-gray-400 text-center">
                This area is restricted to administrators of Lootamo.
              </div>
            </form>
          </div>

          <p className="text-center text-xs text-gray-400 mt-4">
            © {new Date().getFullYear()} Lootamo. All rights reserved.
          </p>
        </div>
      </div>
    </>
  );
}
