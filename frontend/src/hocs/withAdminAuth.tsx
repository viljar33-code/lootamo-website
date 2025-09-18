import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { CircularProgress, Box } from '@mui/material';

export default function withAdminAuth(WrappedComponent: React.ComponentType) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function WithAdminAuth(props: any) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [verified, setVerified] = useState(false);

    useEffect(() => {
      if (loading) return;
      
      if (!user || user.role !== 'admin') {
        if (router.pathname !== '/admin/login') {
          router.replace('/admin/login');
        }
      } else {
        if (router.pathname === '/admin/login') {
          router.replace('/admin/dashboard');
        } else {
          setVerified(true);
        }
      }
    }, [user, loading, router, router.pathname]);

    if (loading || !verified) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
          <CircularProgress />
        </Box>
      );
    }

    return <WrappedComponent {...props} />;
  };
}
