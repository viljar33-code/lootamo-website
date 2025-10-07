import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { AuthProvider } from '../contexts/AuthContext';
import { WishlistProvider } from '../contexts/WishlistContext';
import { CartProvider } from '../contexts/CartContext';
import { ToastProvider } from '@/components/ToastProvider'
import { Toaster } from 'react-hot-toast';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ToastProvider>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <Toaster />
            <Component {...pageProps} />
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

export default MyApp;