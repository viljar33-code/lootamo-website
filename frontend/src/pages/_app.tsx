import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { useRouter } from 'next/router';
import { AuthProvider } from '../contexts/AuthContext';
import { WishlistProvider } from '../contexts/WishlistContext';
import { CartProvider } from '../contexts/CartContext';
import { SidebarProvider } from '../contexts/SidebarContext';
import { ToastProvider } from '@/components/ToastProvider'
import { Toaster } from 'react-hot-toast';

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const isAdminRoute = router.pathname.startsWith('/admin');

  const AppContent = () => (
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

  if (isAdminRoute) {
    return (
      <SidebarProvider>
        <AppContent />
      </SidebarProvider>
    );
  }

  return <AppContent />;
}

export default MyApp;