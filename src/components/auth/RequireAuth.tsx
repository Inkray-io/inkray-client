"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface RequireAuthProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export function RequireAuth({ children, redirectTo = '/auth' }: RequireAuthProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🛡️ RequireAuth check:', { isLoading, isAuthenticated, redirectTo });
    }

    if (!isLoading && !isAuthenticated) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 Redirecting to auth page:', redirectTo);
      }
      router.push(redirectTo);
    }
  }, [isAuthenticated, isLoading, router, redirectTo]);

  // Show loading state while auth is being determined
  if (isLoading) {
    if (process.env.NODE_ENV === 'development') {
      console.log('⏳ Auth loading, showing spinner...');
    }
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, show nothing (redirect will happen via useEffect)
  if (!isAuthenticated) {
    if (process.env.NODE_ENV === 'development') {
      console.log('❌ Not authenticated, hiding content');
    }
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
          <p className="text-muted-foreground">Redirecting to authentication...</p>
        </div>
      </div>
    );
  }

  // if (process.env.NODE_ENV === 'development') {
  //   console.log('✅ Authenticated, showing protected content');
  // }

  return <>{children}</>;
}