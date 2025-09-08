import Link from "next/link";
import Head from "next/head";
import { useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { FaFacebook } from "react-icons/fa6";

export default function Signin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 900));
      alert("Signed in (demo)");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Sign in • Lootamo</title>
      </Head>

      <div className="min-h-[calc(100vh-9rem)] bg-gradient-to-b from-white to-gray-50 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white/90 backdrop-blur rounded-2xl shadow-xl ring-1 ring-gray-100 overflow-hidden">
            <div className="px-6 pt-6 pb-4 text-center">
              <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
              <p className="mt-1 text-sm text-gray-500">Sign in to continue</p>
            </div>

            <div className="px-6 pb-2">
              <form onSubmit={onSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none ring-offset-0 focus:border-gray-300 focus:ring-2 focus:ring-gray-200"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-700">Password</label>
                    <Link href="/forgot" className="text-xs text-gray-600 hover:text-gray-900">Forgot?</Link>
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none ring-offset-0 focus:border-gray-300 focus:ring-2 focus:ring-gray-200"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex justify-center items-center gap-2 rounded-md bg-gray-900 text-white py-2.5 text-sm font-semibold hover:bg-black disabled:opacity-70"
                >
                  {loading ? "Signing in…" : "Sign in"}
                </button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center" aria-hidden>
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-3 text-gray-500">Or continue with</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button className="inline-flex items-center justify-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50">
                  <FcGoogle className="text-lg" />
                  Google
                </button>
                <button className="inline-flex items-center justify-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50">
                  <FaFacebook className="text-gray-900" />
                  Facebook
                </button>
              </div>

              <p className="mt-6 text-center text-sm text-gray-600">
                Don&apos;t have an account? {" "}
                <Link href="/register" className="font-semibold text-gray-900 hover:underline">Create one</Link>
              </p>

              <p className="mt-2 text-center text-[11px] text-gray-400">
                By continuing, you agree to Lootamo&apos;s Terms of Service and Privacy Policy.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
