import Link from "next/link";
import { useRouter } from "next/router";
import { FiGrid, FiUploadCloud, FiActivity, FiUser, FiLogOut, FiCreditCard, FiUsers, FiShoppingCart, FiHeart, FiPackage,   FiSettings, FiBarChart2 } from "react-icons/fi";
import { useAuth } from '@/contexts/AuthContext';

const nav = [
  { href: "/admin/dashboard", label: "Dashboard", icon: <FiGrid /> },
  { href: "/admin/orders", label: "Order Management", icon: <FiShoppingCart /> },
  { href: "/admin/payments", label: "Payment Processing", icon: <FiCreditCard /> },
  { href: "/admin/users", label: "User Management", icon: <FiUsers /> },
  { href: "/admin/products", label: "Product Catalog", icon: <FiPackage /> },
  { href: "/admin/analytics", label: "Analytics & Reports", icon: <FiBarChart2 /> },
  // { href: "/admin/wishlist", label: "Wishlist Analytics", icon: <FiHeart /> },
  // { href: "/admin/import", label: "G2A Integration", icon: <FiUploadCloud /> },
  { href: "/admin/scheduler", label: "Sync Scheduler", icon: <FiSettings /> },
  { href: "/admin/logs", label: "System Monitoring", icon: <FiActivity /> },
  { href: "/admin/profile", label: "My Profile", icon: <FiUser /> },
];

export default function AdminSidebar({ isOpen = false, onClose }: { isOpen?: boolean; onClose?: () => void }) {
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/admin/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };
  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"} fixed inset-0 z-40 bg-black/40 transition-opacity md:hidden`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Mobile drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-800 text-slate-100 transform transition-transform duration-300 md:hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
      >
        <div className="h-16 flex items-center px-4 border-b border-slate-800 justify-between">
          <span className="text-lg font-semibold">Lootamo Admin</span>
          <button
            onClick={onClose}
            className="px-2 py-1 text-sm rounded border border-slate-700 text-slate-200 hover:bg-slate-800"
            aria-label="Close sidebar"
          >
            Close
          </button>
        </div>
        <nav className="flex-1 px-2 py-3 space-y-1 overflow-y-auto">
          {nav.map((item) => {
            const active = router.pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-300 ${
                  active ? "bg-slate-800 text-white" : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                }`}
                onClick={onClose}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}

          <div className="mt-6">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-900/30 hover:text-red-300 transition-colors duration-300"
            >
              <FiLogOut className="text-lg" />
              <span>Logout</span>
            </button>

            <div className="mt-6">
              <div className="px-3 text-xs uppercase tracking-wide text-slate-400">System Status</div>
              <div className="mt-2 mx-3 text-xs rounded bg-emerald-700/20 text-emerald-300 px-2 py-1">
                All systems operational
              </div>
              <div className="mt-2 mx-3 text-xs rounded bg-indigo-700/20 text-indigo-300 px-2 py-1">
                Enterprise Security Enabled
              </div>
            </div>
          </div>
        </nav>
        <div className="p-3 text-xs text-slate-400">
          <div className="text-center">{new Date().getFullYear()} Lootamo</div>
          <div className="text-center text-slate-500 mt-1">v1.0.0</div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden md:fixed md:inset-y-0 md:left-0 md:flex md:flex-col md:w-72 bg-slate-800 text-slate-100 z-30">
        <div className="h-16 flex items-center px-4 border-b border-slate-800">
          <span className="text-lg font-semibold text-nowrap">Lootamo Admin</span>
        </div>

        <nav className="flex-1 px-2 py-3 space-y-1">
          {nav.map((item) => {
            const active = router.pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-300 ${
                  active ? "bg-slate-800 text-white" : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="text-nowrap">{item.label}</span>
              </Link>
            );
          })}

          <div className="mt-6">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-900/30 hover:text-red-300 transition-colors duration-300"
              style={{ cursor: "pointer" }}
            >
              <FiLogOut className="text-lg" />
              <span>Logout</span>
            </button>

            <div className="mt-6">
              <div className="px-3 text-xs uppercase tracking-wide text-slate-400">System Status</div>
              <div className="mt-2 mx-3 text-xs rounded bg-emerald-700/20 text-emerald-300 px-2 py-1 text-nowrap">
                All systems operational
              </div>
              <div className="mt-2 mx-3 text-xs rounded bg-indigo-700/20 text-indigo-300 px-2 py-1 text-nowrap">
                Enterprise Security Enabled
              </div>
            </div>
          </div>
        </nav>

        <div className="p-3 text-xs text-slate-400 flex-shrink-0">
          <div className="text-center">{new Date().getFullYear()} Lootamo</div>
          <div className="text-center text-slate-500 mt-1">v1.0.0</div>
        </div>
      </aside>
    </>
  );
}
