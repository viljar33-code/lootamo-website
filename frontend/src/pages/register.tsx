import Link from "next/link";
import Head from "next/head";
import { useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { FaFacebook } from "react-icons/fa6";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/router";

export default function Register() {
  const { api, apiBase, login } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [phone, setPhone] = useState("");
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatApiError = (err: unknown): string => {
    const fallback = "Something went wrong";
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

    const fromDetail = (() => {
      if (!detail) return "";
      if (typeof detail === "string") return detail;

      if (Array.isArray(detail)) {
        const msgs = (detail as unknown[])
          .map((item) => {
            if (typeof item === "string") return item;
            if (item && typeof item === "object") {
              const msg = getProp(item, "msg") ?? getProp(item, "message") ?? getProp(item, "detail") ?? getProp(item, "error");
              const loc = getProp(item, "loc");
              const msgText = typeof msg === "string" ? msg : msg != null ? String(msg) : "";
              if (Array.isArray(loc)) return `${loc.join(".")}: ${msgText}`;
              return msgText;
            }
            return item != null ? String(item) : "";
          })
          .filter((s) => Boolean(s)) as string[];
        return msgs.join("; ");
      }

      if (detail && typeof detail === "object") {
        const parts: string[] = [];
        for (const [k, v] of Object.entries(detail as Record<string, unknown>)) {
          if (Array.isArray(v)) parts.push(`${k}: ${(v as unknown[]).map((x) => String(x)).join(", ")}`);
          else if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") parts.push(`${k}: ${String(v)}`);
          else parts.push(`${k}: ${JSON.stringify(v)}`);
        }
        return parts.join("; ");
      }

      return String(detail);
    })();

    const message = fromDetail || (typeof payload === "string" ? payload : "") || (getProp(err, "message") as string | undefined) || fallback;
    return message;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    if (!agree) {
      setError("Please agree to the Terms and Privacy Policy");
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/register", {
        email,
        username,
        first_name: firstName,
        last_name: lastName,
        phone,
        password,
        confirm_password: confirm,
      });
      await login(email, password);
      router.push("/");
    } catch (err: unknown) {
      const message = formatApiError(err) || "Failed to create account";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Create account • Lootamo</title>
      </Head>

      <div className="min-h-[100vh] bg-gray-200 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white/90 backdrop-blur rounded-2xl shadow-xl ring-1 ring-gray-100 overflow-hidden">
            <div className="px-6 pt-6 pb-4 text-center">
              <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Create your account</h1>
              <p className="mt-1 text-sm text-gray-500">Join Lootamo in seconds</p>
            </div>

            <div className="px-6 pb-2">
              <form onSubmit={onSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Username</label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="jane_doe"
                    className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-300 focus:ring-2 focus:ring-gray-200"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">First name</label>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Jane"
                      className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-300 focus:ring-2 focus:ring-gray-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Last name</label>
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Doe"
                      className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-300 focus:ring-2 focus:ring-gray-200"
                    />
                  </div>
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
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 555 123 4567"
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
                <button
                  type="button"
                  onClick={() => {
                    window.location.href = `${apiBase}/auth/google/login`;
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50"
                >
                  <FcGoogle className="text-lg" />
                  Google
                </button>
                <button
                  type="button"
                  onClick={() => {
                    window.location.href = `${apiBase}/auth/facebook/login`;
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50"
                >
                  <FaFacebook className="text-lg" color="#1877F2" />
                  Facebook
                </button>
              </div>

              <p className="mt-6 text-center text-sm text-gray-600">
                Already have an account? {" "}
                <Link href="/signin" className="font-semibold text-gray-900 hover:underline">Log in</Link>
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
