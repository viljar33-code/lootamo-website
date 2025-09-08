import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t mt-12">
      <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <h4 className="font-bold">Lootamo</h4>
          <p className="text-sm text-gray-600 mt-2">Find the best digital deals — keys, gift cards and more.</p>
        </div>

        <div>
          <h5 className="font-semibold">Company</h5>
          <ul className="mt-3 text-sm text-gray-600 space-y-2">
            <li><Link href="/about" className="hover:underline">About</Link></li>
            <li><Link href="/careers" className="hover:underline">Careers</Link></li>
            <li><Link href="/blog" className="hover:underline">Blog</Link></li>
          </ul>
        </div>

        <div>
          <h5 className="font-semibold">Support</h5>
          <ul className="mt-3 text-sm text-gray-600 space-y-2">
            <li><Link href="/help" className="hover:underline">Help Center</Link></li>
            <li><Link href="/contact" className="hover:underline">Contact</Link></li>
            <li><Link href="/terms" className="hover:underline">Terms</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t">
        <div className="max-w-7xl mx-auto px-4 py-4 text-sm text-gray-500">
          © {new Date().getFullYear()} Lootamo — All rights reserved.
        </div>
      </div>
    </footer>
  );
}
