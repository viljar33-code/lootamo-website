import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function withAuth<P extends object>(WrappedComponent: React.ComponentType<P>) {
  return function WithAuth(props: P) {
    const { user, loading, isAuthenticated, isInitializing } = useAuth();
    const router = useRouter();
    const [verified, setVerified] = useState(false);

    useEffect(() => {
      if (isInitializing || loading) return;
      
      if (!isAuthenticated || !user) {
        const currentPath = router.asPath;
        if (currentPath !== '/signin' && currentPath !== '/signup') {
          localStorage.setItem('login_redirect', currentPath);
        }
        
        router.replace('/signin');
      } else {
        setVerified(true);
      }
    }, [user, loading, isAuthenticated, isInitializing, router]);

    if (isInitializing || loading || !verified) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (!isAuthenticated || !user) {
      return null;
    }

    return <WrappedComponent {...props} />;
  };
}
