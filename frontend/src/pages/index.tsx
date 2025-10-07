import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import Topbar from "@/components/Topbar";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Footer from "@/components/Footer";
import HeroCard from "@/components/HeroCard";
import ChoosePlatform from "@/components/ChoosePlatform";
import ProductList from "@/components/ProductList";

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user?.role === 'admin') {
      router.push('/admin/dashboard');
    }
  }, [user, loading, router]);

  if (loading || (user?.role === 'admin' && !router.pathname.startsWith('/admin'))) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <>
      <Topbar />
      <Navbar />
      <Hero />
      <HeroCard/>
      <ChoosePlatform/>
      
      {/* Featured Products Section */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ProductList 
            title="Featured Games" 
            params={{ limit: 20 }}
            className="mb-8"
          />
        </div>
      </section>
      
      <Footer />
    </>
  );
}
