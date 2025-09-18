import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { IoGameController, IoPersonOutline, IoChevronDown, IoLogOutOutline } from "react-icons/io5";
import { MdAttachMoney, MdLanguage } from "react-icons/md";
import { useAuth } from "@/contexts/AuthContext";

export default function Topbar() {
  const { user, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push("/signin");
  };

  return (
    <div className="bg-gray-900 text-gray-100 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-9">
        <div className="flex items-center gap-3">
          <span className="hidden sm:flex items-center gap-2">
            <IoGameController className="text-lg" />
            Lootamo — Best deals on game keys & gift cards
          </span>
          <span className="px-2 py-0.5 rounded bg-yellow-400 text-black text-xs font-semibold">New</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2">
            <div className="flex items-center gap-1">
              <MdAttachMoney className="text-sm" />
              <select className="bg-gray-900 border-none focus:outline-none text-gray-100 text-xs">
                <option>USD</option>
                <option>INR</option>
                <option>EUR</option>
              </select>
            </div>

            <div className="flex items-center gap-1">
              <MdLanguage className="text-sm" />
              <select className="bg-gray-900 border-none focus:outline-none text-gray-100 text-xs">
                <option>EN</option>
                <option>ES</option>
              </select>
            </div>
          </div>

          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-1 hover:bg-gray-800 px-2 py-1 rounded-md transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-gray-600 flex items-center justify-center">
                  <span className="text-xs font-medium">
                    {user.name ? user.name.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="hidden sm:inline">
                  {user.name || user.email?.split('@')[0]}
                </span>
                <IoChevronDown className={`text-xs transition-transform ${isDropdownOpen ? 'transform rotate-180' : ''}`} />
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 z-50">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm text-gray-900 font-medium">
                      {user.name || 'Welcome'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                  <Link
                    href="/profile"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    <IoPersonOutline className="mr-3 text-gray-500" />
                    Profile
                  </Link>
                  {/* <Link
                    href="/settings"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    <IoSettingsOutline className="mr-3 text-gray-500" />
                    Settings
                  </Link> */}
                  <button
                    onClick={handleLogout}
                    className="w-full text-left flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                  >
                    <IoLogOutOutline className="mr-3" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/signin" className="hover:underline flex items-center gap-1">
              <IoPersonOutline className="text-sm" />
              Sign in
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
