import Link from "next/link";
import Head from "next/head";
import { useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { FaFacebook } from "react-icons/fa6";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      alert("Passwords do not match");
      return;
    }
    if (!agree) {
      alert("Please agree to the Terms and Privacy Policy");
      return;
    }
    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 900));
      alert("Account created (demo)");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Create account • Lootamo</title>
      </Head>

      <div className="min-h-[calc(100vh-9rem)] bg-gradient-to-b from-white to-gray-50 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white/90 backdrop-blur rounded-2xl shadow-xl ring-1 ring-gray-100 overflow-hidden">
            <div className="px-6 pt-6 pb-4 text-center">
              <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
              <p className="mt-1 text-sm text-gray-500">Join Lootamo in seconds</p>
            </div>

            <div className="px-6 pb-2">
              <form onSubmit={onSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Full name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Doe"
                    className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-300 focus:ring-2 focus:ring-gray-200"
                  />
                </div>

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

                <div>
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-300 focus:ring-2 focus:ring-gray-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Confirm password</label>
                  <input
                    type="password"
                    required
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="••••••••"
                    className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-300 focus:ring-2 focus:ring-gray-200"
                  />
                </div>

                <label className="flex items-center gap-2 text-xs text-gray-600 text-nowrap flex-wrap">
                  <input
                    type="checkbox"
                    checked={agree}
                    onChange={(e) => setAgree(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-300"
                  />
                  I agree to the
                  <a href="#" className="underline"> Terms of Service </a>
                  and
                  <a href="#" className="underline"> Privacy Policy</a>
                </label>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex justify-center items-center gap-2 rounded-md bg-gray-900 text-white py-2.5 text-sm font-semibold hover:bg-black disabled:opacity-70"
                >
                  {loading ? "Creating…" : "Create account"}
                </button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center" aria-hidden>
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-3 text-gray-500">Or sign up with</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button className="inline-flex items-center justify-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50">
                  <FcGoogle className="text-lg" />
                  Google
                </button>
                <button className="inline-flex items-center justify-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50">
                  <FaFacebook className="text-lg" color="blue"/>
                  Facebook
                </button>
              </div>

              <p className="mt-6 text-center text-sm text-gray-600">
                Already have an account? {" "}
                <Link href="/signin" className="font-semibold text-gray-900 hover:underline">Sign in</Link>
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
