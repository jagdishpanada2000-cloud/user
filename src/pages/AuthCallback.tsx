import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * AuthCallback handles the OAuth callback and redirects to the appropriate page
 * within the same app (User App)
 */
export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Handle the auth callback
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Auth callback error:', error);
          toast.error('Authentication failed');
          navigate('/auth');
          return;
        }

        // If no session, redirect to auth
        if (!data.session) {
          console.log('No session found after callback');
          navigate('/auth');
          return;
        }

        // Successfully authenticated, check for stored role and redirect accordingly
        const storedRole = localStorage.getItem('selectedRole') as 'user' | 'owner' | null;
        localStorage.removeItem('selectedRole'); // Clean up
        
        if (storedRole === 'owner') {
          const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
          const dashboardUrl = isDev ? 'http://localhost:8080/' : 'https://dashboard-eight-swart-98.vercel.app/';
          window.location.href = dashboardUrl;
        } else {
          // Default to user app
          toast.success('Login successful!');
          navigate('/');
        }
        
      } catch (err) {
        console.error('Error during auth callback:', err);
        toast.error('Authentication error occurred');
        navigate('/auth');
      }
    };

    handleAuthCallback();
  }, [navigate]);
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground animate-pulse font-medium">
          Verifying account permissions...
        </p>
      </div>
    </div>
  );
}
