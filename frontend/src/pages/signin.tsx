  import Link from "next/link";
import Head from "next/head";
import { useEffect, useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { FaFacebook } from "react-icons/fa6";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ToastProvider";

export default function Signin() {
  const { login, loading, apiBase } = useAuth();
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const error = urlParams.get('error');
      const code = urlParams.get('code');
      const provider = urlParams.get('provider');

      if (error) {
        setError(`OAuth error: ${error}`);
        return;
      }

      if (code && provider === 'facebook') {
        try {
          const response = await fetch(`${apiBase}/auth/facebook/callback?code=${code}`, {
            method: 'GET',
            credentials: 'include',
          });
          
          if (!response.ok) {
            throw new Error('Failed to authenticate with Facebook');
          }

          const data = await response.json();
          if (data.access_token) {
            router.push('/');
          }
        } catch (err) {
          setError('Failed to authenticate with Facebook. Please try again.');
          console.error('OAuth error:', err);
        }
      }
    };

    handleOAuthCallback();
  }, [apiBase, router]);

  const formatApiError = (err: unknown): string => {
    const fallback = "Failed to sign in";
    if (typeof err === "string") return err;
    if (typeof err !== "object" || err === null) return fallback;
    const getProp = (obj: unknown, key: string): unknown => {
      if (obj && typeof obj === "object" && key in (obj as Record<string, unknown>)) {
        return (obj as Record<string, unknown>)[key];
      }
      return undefined;
    };
    const response = getProp(err, "response");
    const data = response ? getProp(response, "data") : getProp(err, "data");
    const payload = data ?? err;
    const detail =
      getProp(payload, "detail") ??
      getProp(payload, "message") ??
      getProp(payload, "error") ??
      getProp(payload, "errors");
    if (!detail) return (getProp(err, "message") as string | undefined) || fallback;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) {
      return (detail as unknown[])
        .map((d) => (typeof d === "string" ? d : JSON.stringify(d)))
        .join("; ");
    }
    if (typeof detail === "object") {
      return Object.entries(detail as Record<string, unknown>)
        .map(([k, v]) => `${k}: ${typeof v === "string" ? v : JSON.stringify(v)}`)
        .join("; ");
    }
    return String(detail);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const response = await login(email, password);
      if (response.error) {
        setError(response.error);
        showToast(response.error, 'error');
        return;
      }
      if (response.data) {
        const user = response.data;
        setTimeout(() => {
          const redirectPath = user.role === 'admin' ? '/admin' : '/';
          router.push(redirectPath).catch(err => {
            console.error('Redirect failed:', err);
            window.location.href = '/';
          });
        }, 100);
        showToast('Signed in successfully', 'success');
      }
    } catch (err: unknown) {
      const msg = formatApiError(err);
      setError(msg);
      showToast(msg, 'error');
    }
  };

  return (
    <>
      <Head>
        <title>Log in • Lootamo</title>
      </Head>

      <div className="min-h-[100vh] bg-gray-200 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white/90 backdrop-blur rounded-2xl shadow-xl ring-1 ring-gray-100 overflow-hidden">
            <div className="px-6 pt-6 pb-4 text-center">
              <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Welcome back</h1>
              <p className="mt-1 text-sm text-gray-500">Log in to continue</p>
            </div>

            <div className="px-6 pb-2">
              <form onSubmit={onSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com or yourusername"
                    className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none ring-offset-0 focus:border-gray-300 focus:ring-2 focus:ring-gray-200"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-700">Password</label>
                    <Link href="/forgot" className="text-xs text-gray-600 hover:text-gray-900">Forgot?</Link>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 pr-10 text-sm outline-none ring-offset-0 focus:border-gray-300 focus:ring-2 focus:ring-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                    >
                      {showPassword ? (
                        <FiEyeOff className="h-4 w-4" />
                      ) : (
                        <FiEye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex justify-center items-center gap-2 rounded-md bg-gray-900 text-white py-2.5 text-sm font-semibold hover:bg-black disabled:opacity-70"
                >
                  {loading ? "Logging in…" : "Log in"}
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
                <button
                  style={{ cursor: "pointer" }}
                  type="button"
                  onClick={() => {
                    const redirectPath = window.location.pathname;
                    localStorage.setItem('login_redirect', redirectPath);
                    
                    const redirectUri = `${window.location.origin}/auth/callback`;
                    const encodedUri = encodeURIComponent(redirectUri);
                    window.location.href = `${apiBase}/auth/google/login?redirect_uri=${encodedUri}`;
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50"
                  disabled={loading}
                >
                  <FcGoogle className="text-lg" />
                  Google
                </button>
                <button
                  style={{ cursor: "pointer" }}
                  type="button"
                  onClick={() => {
                    const redirectUri = encodeURIComponent(`${window.location.origin}/auth/callback?provider=facebook`);
                    window.location.href = `${apiBase}/auth/facebook/login?redirect_uri=${redirectUri}`;
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50"
                >
                  <FaFacebook className="text-lg" color="#1877F2"/>
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
