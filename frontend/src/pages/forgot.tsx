import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import { getErrorMessage } from '@/utils/error';

export default function Forgot() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      alert('Please enter your email address');
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
      console.error('Password reset error:', error);
      alert(getErrorMessage(error, 'An error occurred. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Forgot password • Lootamo</title>
      </Head>

      <div className="min-h-[100vh] bg-gray-200 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white/90 backdrop-blur rounded-2xl shadow-xl ring-1 ring-gray-100 overflow-hidden">
            <div className="px-6 pt-6 pb-4 text-center">
              <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Reset your password</h1>
              <p className="mt-1 text-sm text-gray-500">
                {sent ? "Check your inbox for the reset link" : "Enter your email to receive a reset link"}
              </p>
            </div>

            <div className="px-6 pb-6">
              {!sent ? (
                <form onSubmit={onSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-300 focus:ring-2 focus:ring-gray-200"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full inline-flex justify-center items-center gap-2 rounded-md bg-gray-900 text-white py-2.5 text-sm font-semibold hover:bg-black disabled:opacity-70"
                  >
                    {loading ? "Sending…" : "Send reset link"}
                  </button>
                  <p className="text-center text-xs text-gray-500">
                    Remembered it? <Link href="/signin" className="font-medium text-gray-900 hover:underline">Back to sign in</Link>
                  </p>
                </form>
              ) : (
                <div className="text-center space-y-4">
                  <div className="mx-auto h-12 w-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                    ✓
                  </div>
                  <p className="text-sm text-gray-700">
                    If an account exists for <span className="font-medium">{email}</span>, we sent a reset link. It may take a minute to arrive.
                  </p>
                  <div className="flex items-center justify-center gap-3 text-sm">
                    <button
                      onClick={() => setSent(false)}
                      className="underline text-gray-700 hover:text-gray-900"
                    >
                      Try a different email
                    </button>
                    <Link href="/signin" className="underline text-gray-700 hover:text-gray-900">Back to sign in</Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
