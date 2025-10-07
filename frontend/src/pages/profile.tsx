import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';

export default function Profile() {
  const router = useRouter();
  const { isInitializing } = useAuth();

  useEffect(() => {
    if (!isInitializing) {
      router.replace('/profile/overview');
    }
  }, [router, isInitializing]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
    </div>
  );
}
