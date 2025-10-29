import { ReactNode, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminSidebar from '../admin/AdminSidebar';
import AdminHeader from '../admin/AdminHeader';
import { useAuth } from '@/contexts/AuthContext';
import { SidebarProvider, useSidebar } from '@/contexts/SidebarContext';
import { CircularProgress, Box } from '@mui/material';

interface AdminLayoutProps {
  children: ReactNode;
}

function AdminLayoutContent({ children }: AdminLayoutProps) {
  const [isClient, setIsClient] = useState(false);
  const { user, loading } = useAuth();
  const router = useRouter();  const { isCollapsed, isMobileOpen, setMobileOpen } = useSidebar();


  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin') && isClient) {
      router.push('/admin/login');
    }
  }, [user, loading, router, isClient]);

  if (loading || !isClient) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
         <AdminSidebar />
         <div className={`flex flex-col transition-all duration-300 ${isCollapsed ? 'md:ml-16 w-full' : 'md:ml-72 md:w-[calc(100%-288px)] w-full'}`}>
           <AdminHeader onMenuClick={() => setMobileOpen(true)} />
 
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50">
          <div className="container mx-auto px-4 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return <AdminLayoutContent>{children}</AdminLayoutContent>;
}
