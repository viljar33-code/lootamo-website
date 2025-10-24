import Image from "next/image";
import { FiMenu } from "react-icons/fi";

export default function AdminHeader({ onMenuClick }: { onMenuClick?: () => void }) {
  return (
    <header className="h-16 bg-white border-b sticky top-0 z-30">
      <div className="h-full flex items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <button
            className="md:hidden p-2 rounded border text-gray-700 hover:bg-gray-50 transition-all duration-300"
            onClick={onMenuClick}
            aria-label="Open sidebar"
          >
            <FiMenu className="text-xl" />
          </button>
          <div className="flex items-center gap-2 cursor-default select-none">
            <Image
              src="/images/logo1.png"
              alt="Lootamo"
              width={120}
              height={16}
              className="h-12 w-auto"
            />
          </div>
          <div className="hidden md:block border-l h-6" />
          <span className="hidden md:block text-sm text-gray-600">
            Enterprise Catalog & License Management
          </span>
        </div>

        <div className="flex items-center gap-3 text-nowrap">
          <span className="inline-flex items-center gap-2 text-xs bg-slate-100 text-slate-800 px-2 py-1 rounded">
            <span className="h-2 w-2 rounded-full bg-emerald-500" /> System Administrator
          </span>
          {/* <button className="px-3 py-1.5 text-sm rounded border text-gray-700 hover:bg-gray-50 transition-all duration-300">
            Export Data
          </button>
          <button className="px-3 py-1.5 text-sm rounded border text-gray-700 hover:bg-gray-50 transition-all duration-300">
            Settings
          </button> */}
        </div>
      </div>
    </header>
  );
}
