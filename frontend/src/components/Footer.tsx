import Link from "next/link";
import Image from "next/image";
import { FaFacebookF, FaTwitter, FaInstagram, FaDiscord, FaYoutube } from 'react-icons/fa';
import { MdEmail, MdPhone, MdLocationOn } from 'react-icons/md';

export default function Footer() {
  return (
    <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white mt-16">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <div className="mb-4">
              <Image 
                src="/images/logo.png" 
                alt="Lootamo" 
                width={120} 
                height={40} 
                className="h-10 w-auto transition-transform duration-300 hover:scale-105"
              />
            </div>
            <p className="text-gray-300 text-sm leading-relaxed mb-6">
              Your trusted marketplace for digital game keys, software licenses, and gift cards. 
              Get the best deals with instant delivery and 24/7 support.
            </p>
            
            {/* Social Media Links */}
            <div className="flex space-x-4">
              <a href="#" className="w-10 h-10 bg-gray-700 hover:bg-blue-600 rounded-full flex items-center justify-center transition-all duration-500 hover:scale-110 hover:-translate-y-1 hover:animate-gentle-glow">
                <FaFacebookF className="text-sm transition-transform duration-300 hover:rotate-12" />
              </a>
              <a href="#" className="w-10 h-10 bg-gray-700 hover:bg-blue-400 rounded-full flex items-center justify-center transition-all duration-500 hover:scale-110 hover:-translate-y-1 hover:animate-gentle-glow">
                <FaTwitter className="text-sm transition-transform duration-300 hover:rotate-12" />
              </a>
              <a href="#" className="w-10 h-10 bg-gray-700 hover:bg-pink-500 rounded-full flex items-center justify-center transition-all duration-500 hover:scale-110 hover:-translate-y-1 hover:animate-gentle-glow">
                <FaInstagram className="text-sm transition-transform duration-300 hover:rotate-12" />
              </a>
              <a href="#" className="w-10 h-10 bg-gray-700 hover:bg-indigo-500 rounded-full flex items-center justify-center transition-all duration-500 hover:scale-110 hover:-translate-y-1 hover:animate-gentle-glow">
                <FaDiscord className="text-sm transition-transform duration-300 hover:rotate-12" />
              </a>
              <a href="#" className="w-10 h-10 bg-gray-700 hover:bg-red-500 rounded-full flex items-center justify-center transition-all duration-500 hover:scale-110 hover:-translate-y-1 hover:animate-gentle-glow">
                <FaYoutube className="text-sm transition-transform duration-300 hover:rotate-12" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h5 className="text-lg font-semibold mb-4 text-white">Quick Links</h5>
            <ul className="space-y-3">
              <li>
                <Link href="/" className="text-gray-300 hover:text-blue-400 transition-all duration-300 flex items-center group hover:translate-x-2">
                  <span className="w-1 h-1 bg-blue-400 rounded-full mr-2 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:scale-150"></span>
                  Home
                </Link>
              </li>
              <li>
                <Link href="/categories" className="text-gray-300 hover:text-blue-400 transition-all duration-300 flex items-center group hover:translate-x-2">
                  <span className="w-1 h-1 bg-blue-400 rounded-full mr-2 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:scale-150"></span>
                  Categories
                </Link>
              </li>
              {/* <li>
                <Link href="/deals" className="text-gray-300 hover:text-blue-400 transition-colors duration-200 flex items-center group">
                  <span className="w-1 h-1 bg-blue-400 rounded-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  Best Deals
                </Link>
              </li> */}
              <li>
                <Link href="/wishlist" className="text-gray-300 hover:text-blue-400 transition-all duration-300 flex items-center group hover:translate-x-2">
                  <span className="w-1 h-1 bg-blue-400 rounded-full mr-2 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:scale-150"></span>
                  Wishlist
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h5 className="text-lg font-semibold mb-4 text-white">Support</h5>
            <ul className="space-y-3">
              <li>
                <Link href="/help" className="text-gray-300 hover:text-blue-400 transition-colors duration-200 flex items-center group">
                  <span className="w-1 h-1 bg-blue-400 rounded-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-300 hover:text-blue-400 transition-colors duration-200 flex items-center group">
                  <span className="w-1 h-1 bg-blue-400 rounded-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-300 hover:text-blue-400 transition-colors duration-200 flex items-center group">
                  <span className="w-1 h-1 bg-blue-400 rounded-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  Terms of Service
                </Link>
              </li>
              {/* <li>
                <Link href="/privacy" className="text-gray-300 hover:text-blue-400 transition-colors duration-200 flex items-center group">
                  <span className="w-1 h-1 bg-blue-400 rounded-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  Privacy Policy
                </Link>
              </li> */}
            </ul>
          </div>

          {/* Newsletter & Contact */}
          <div>
            {/* <h5 className="text-lg font-semibold mb-4 text-white">Stay Connected</h5> */}
            
            {/* Newsletter Signup */}
            {/* <div className="mb-6">
              <p className="text-gray-300 text-sm mb-3">Get the latest deals and updates</p>
              <div className="flex">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-l-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 text-sm"
                />
                <button className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-r-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 text-sm font-medium">
                  Subscribe
                </button>
              </div>
            </div> */}

            {/* Contact Info */}
            <div className="space-y-2">
              <div className="flex items-center text-gray-300 text-sm">
                <MdEmail className="mr-2 text-blue-400" />
                support@lootamo.com
              </div>
              <div className="flex items-center text-gray-300 text-sm">
                <MdPhone className="mr-2 text-blue-400" />
                24/7 Live Support
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-700">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
          <div className="flex justify-center items-center">
            <div className="text-gray-400 text-sm text-center">
              &copy; {new Date().getFullYear()} Lootamo. All rights reserved.
            </div>
            
            {/* Payment Methods */}
            {/* <div className="flex items-center space-x-4">
              <span className="text-gray-400 text-sm">Secure payments:</span>
              <div className="flex space-x-2">
                <div className="w-8 h-5 bg-blue-600 rounded text-xs text-white flex items-center justify-center font-bold">
                  VISA
                </div>
                <div className="w-8 h-5 bg-red-500 rounded text-xs text-white flex items-center justify-center font-bold">
                  MC
                </div>
                <div className="w-8 h-5 bg-blue-500 rounded text-xs text-white flex items-center justify-center font-bold">
                  PP
                </div>
              </div>
            </div> */}
          </div>
        </div>
      </div>
    </footer>
  );
}
