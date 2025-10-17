import Link from "next/link";
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import { useSidebar } from '../../contexts/SidebarContext';
import { FiPackage, FiSettings, FiActivity, FiUser, FiLogOut, FiChevronLeft, FiChevronRight, FiGrid, FiShoppingCart, FiCreditCard, FiUsers, FiBarChart2 } from 'react-icons/fi';

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

export default function AdminSidebar() {
  const router = useRouter();
  const { logout } = useAuth();
  const { isCollapsed, toggleCollapse, isMobileOpen, setMobileOpen } = useSidebar();

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
        className={`${isMobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"} fixed inset-0 z-40 bg-black/40 transition-opacity md:hidden`}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />

      {/* Mobile drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white text-gray-900 border-r border-gray-200 shadow-lg transform transition-transform duration-300 md:hidden ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
      >
        <div className="h-16 flex items-center px-4 border-b border-gray-200 justify-between">
          <span 
            className="text-2xl font-bold text-center whitespace-nowrap text-white [text-stroke:2px_#000] [-webkit-text-stroke:2px_#000] [-webkit-text-fill-color:white] [paint-order:stroke_fill]"
          >
            Lootamo Admin
          </span>
          <button
            style={{ cursor: "pointer" }}
            onClick={() => setMobileOpen(false)}
            className="px-3 py-2 text-sm rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
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
                className={`flex items-center gap-3 px-3 py-3 rounded-lg text-base transition-all duration-300 ${
                  active ? "bg-blue-50 text-blue-700 border border-blue-200" : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                }`}
                onClick={() => setMobileOpen(false)}
              >
                <span className="text-xl">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}

          <div className="mt-6">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-base text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors duration-300"
            >
              <FiLogOut className="text-xl" />
              <span>Logout</span>
            </button>

            <div className="mt-6">
              <div className="px-3 text-sm uppercase tracking-wide text-gray-500">System Status</div>
              <div className="mt-2 mx-3 text-sm rounded bg-green-50 text-green-700 border border-green-200 px-3 py-2">
                All systems operational
              </div>
              <div className="mt-2 mx-3 text-sm rounded bg-blue-50 text-blue-700 border border-blue-200 px-3 py-2">
                Enterprise Security Enabled
              </div>
            </div>
          </div>
        </nav>
        <div className="p-3 text-sm text-gray-500">
          <div className="text-center">{new Date().getFullYear()} Lootamo</div>
          <div className="text-center text-gray-400 mt-1">v1.0.0</div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <aside className={`hidden md:fixed md:inset-y-0 md:left-0 md:flex md:flex-col ${isCollapsed ? 'md:w-16' : 'md:w-72'} bg-white text-gray-900 border-r border-gray-200 shadow-lg z-30 transition-all duration-300`}>
        <div className="h-16 flex items-center px-4 border-b border-gray-200 justify-between">
          {!isCollapsed && (
            <span 
              className="text-2xl font-bold text-center whitespace-nowrap text-white [text-stroke:2px_#000] [-webkit-text-stroke:2px_#000] [-webkit-text-fill-color:white] [paint-order:stroke_fill] [letter-spacing:2px]"
            >
              Lootamo Admin
            </span>
          )}
          <button
            style={{ cursor: "pointer" }}
            onClick={toggleCollapse}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <FiChevronRight className="w-5 h-5" /> : <FiChevronLeft className="w-5 h-5" />}
          </button>
        </div>

        <nav className="flex-1 px-2 py-3 space-y-1">
          {nav.map((item) => {
            const active = router.pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-3 py-3 rounded-lg text-base transition-all duration-300 ${
                  active ? "bg-blue-50 text-blue-700 border border-blue-200" : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                }`}
                title={isCollapsed ? item.label : undefined}
                onClick={(e) => {
                  // Prevent any event bubbling that might trigger sidebar expansion
                  e.stopPropagation();
                }}
              >
                <span className="text-xl">{item.icon}</span>
                {!isCollapsed && <span className="text-nowrap">{item.label}</span>}
              </Link>
            );
          })}

          <div className="mt-6">
            <button
              onClick={handleLogout}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-3 py-3 rounded-lg text-base text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors duration-300`}
              style={{ cursor: "pointer" }}
              title={isCollapsed ? "Logout" : undefined}
            >
              <FiLogOut className="text-xl" />
              {!isCollapsed && <span>Logout</span>}
            </button>

{!isCollapsed && (
              <div className="mt-6">
                <div className="px-3 text-sm uppercase tracking-wide text-gray-500">System Status</div>
                <div className="mt-2 mx-3 text-sm rounded bg-green-50 text-green-700 border border-green-200 px-3 py-2 text-nowrap">
                  All systems operational
                </div>
                <div className="mt-2 mx-3 text-sm rounded bg-blue-50 text-blue-700 border border-blue-200 px-3 py-2 text-nowrap">
                  Enterprise Security Enabled
                </div>
              </div>
            )}
          </div>
        </nav>

{!isCollapsed && (
          <div className="p-3 text-sm text-gray-500 flex-shrink-0">
            <div className="text-center">{new Date().getFullYear()} Lootamo</div>
            <div className="text-center text-gray-400 mt-1">v1.0.0</div>
          </div>
        )}
      </aside>
    </>
  );
}
