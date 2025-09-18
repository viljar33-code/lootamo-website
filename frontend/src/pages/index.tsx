import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import Topbar from "@/components/Topbar";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Footer from "@/components/Footer";
import HeroCard from "@/components/HeroCard";
import ChoosePlatform from "@/components/ChoosePlatform";

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    // If user is admin, redirect to admin dashboard
    if (!loading && user?.role === 'admin') {
      router.push('/admin/dashboard');
    }
  }, [user, loading, router]);

  // Show loading state while checking auth
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
      <Footer />
    </>
  );
}
