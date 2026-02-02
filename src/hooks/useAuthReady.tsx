import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

/**
 * Custom hook to ensure auth is ready before executing data fetching logic
 * This prevents the "empty dashboard on first load" issue
 */
export function useAuthReady() {
  const { user, loading } = useAuth();
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    // Auth is ready when loading is false (regardless of whether user exists)
    if (!loading) {
      setIsAuthReady(true);
    }
  }, [loading]);

  return {
    isAuthReady,
    user,
    isAuthenticated: !loading && !!user
  };
}

/**
 * HOC to wrap components that need to wait for auth
 */
export function withAuthReady<T extends object>(Component: React.ComponentType<T>) {
  return function WrappedComponent(props: T) {
    const { isAuthReady } = useAuthReady();
    
    if (!isAuthReady) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }
    
    return <Component {...props} />;
  };
}