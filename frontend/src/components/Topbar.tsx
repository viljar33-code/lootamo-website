import Link from "next/link";
import { IoGameController, IoPersonOutline } from "react-icons/io5";
import { MdLanguage, MdAttachMoney } from "react-icons/md";

export default function Topbar() {
  return (
    <div className="bg-gray-900 text-gray-100 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-9">
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

          <Link href="/signin" className="hover:underline flex items-center gap-1">
            <IoPersonOutline className="text-sm" />
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
