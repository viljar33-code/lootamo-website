import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { CircularProgress, Box, Typography } from '@mui/material';
import { useRouter } from 'next/router';

export default function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/admin/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <Typography>Redirecting to login...</Typography>
      </Box>
    );
  }

  return <>{children}</>;
}
