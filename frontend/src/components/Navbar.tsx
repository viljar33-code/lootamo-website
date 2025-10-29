import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { IoHeart, IoCart, IoMenu, IoClose } from "react-icons/io5";
import { useWishlist } from "@/contexts/WishlistContext";
import { useCart } from "@/contexts/CartContext";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { summary } = useWishlist();
  const { getCartCount } = useCart();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`top-0 z-40 sticky transition-shadow ${scrolled ? "shadow-md bg-white/90 backdrop-blur-sm" : "bg-transparent"}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14 md:h-16">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-3">
              <Image src="/images/logo1.png" alt="Lootamo" width={120} height={16} className="sm:h-10 w-auto"/>
              {/* <span className="font-bold text-lg text-gray-900">Lootamo</span> */}
            </Link>

            <nav className="hidden lg:flex items-center gap-1">
              <Link href="/products" className="px-3 py-2 rounded-md text-sm hover:bg-gray-100">All Products</Link>
              <Link href="/deals" className="px-3 py-2 rounded-md text-sm hover:bg-gray-100">Deals</Link>
              <Link href="/categories" className="px-3 py-2 rounded-md text-sm hover:bg-gray-100">Categories</Link>
              <Link href="/giftcards" className="px-3 py-2 rounded-md text-sm hover:bg-gray-100">Gift Cards</Link>
            </nav>
          </div>

          <div className="flex-1 px-4">
            <form className="hidden md:flex items-center gap-2 bg-gray-100 rounded-md px-3 py-2">
              <select aria-label="Category" className="bg-transparent outline-none text-sm">
                <option>All</option>
                <option>Games</option>
                <option>Subscriptions</option>
              </select>
              <input aria-label="Search" type="search" placeholder="Search games, keys, gift cards..." className="flex-1 bg-transparent outline-none text-sm" />
              <button type="submit" className="text-sm font-semibold">Search</button>
            </form>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/wishlist" className="hidden sm:inline-flex items-center gap-1 relative">
              <IoHeart className="w-5 h-5" />
              <span className="text-sm hidden md:inline">Wishlist</span>
              {summary && summary.total_items > 0 && (
                <span className="absolute -top-1.5 -right-3.5 text-xs bg-red-500 text-white rounded-full px-1 min-w-[16px] h-4 flex items-center justify-center">
                  {summary.total_items > 99 ? '99+' : summary.total_items}
                </span>
              )}
            </Link>

            <Link href="/cart" className="relative">
              <IoCart className="w-6 h-6" />
              {getCartCount() > 0 && (
                <span className="absolute -top-1 -right-2 text-xs bg-red-500 text-white rounded-full px-1 min-w-[16px] h-4 flex items-center justify-center">
                  {getCartCount() > 99 ? '99+' : getCartCount()}
                </span>
              )}
            </Link>

            <button className="lg:hidden p-2" aria-label="Open menu" onClick={() => setMobileOpen(true)}>
              <IoMenu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="lg:hidden bg-white/95 border-t">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center gap-3">
                <span className="font-semibold">Lootamo</span>
              </Link>
              <button onClick={() => setMobileOpen(false)} aria-label="Close menu" className="p-2">
                <IoClose className="w-6 h-6" />
              </button>
            </div>

            <nav className="mt-4 flex flex-col gap-3">
              <Link href="/products" className="block px-3 py-2 rounded-md">All Products</Link>
              <Link href="/deals" className="block px-3 py-2 rounded-md">Deals</Link>
              <Link href="/categories" className="block px-3 py-2 rounded-md">Categories</Link>
              <Link href="/giftcards" className="block px-3 py-2 rounded-md">Gift Cards</Link>
              <Link href="/help" className="block px-3 py-2 rounded-md">Help & Support</Link>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
