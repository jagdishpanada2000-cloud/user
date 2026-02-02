import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * AuthCallback handles the post-login logic when the Dashboard app
 * redirects a user to the User App (localhost:8081/auth/callback).
 */
export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // 1. Handle the auth callback first
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Auth callback error:', error);
          navigate('/auth');
          return;
        }

        // 2. If no session, redirect to auth
        if (!data.session) {
          console.log('No session found after callback');
          navigate('/auth');
          return;
        }

        // 3. Query the restaurants table to check if the user is an owner
        const { data: ownershipData, error: dbError } = await supabase
          .from('restaurants')
          .select('id')
          .eq('owner_id', data.session.user.id)
          .maybeSingle();

        if (dbError) {
          console.error('Database error during role check:', dbError);
          throw dbError;
        }

        if (ownershipData) {
          // RULE: If a restaurant exists -> allow dashboard access
          // Redirect the owner back to the dashboard
          const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
          const dashboardUrl = isDev ? 'http://localhost:8080/' : 'https://your-dashboard.vercel.app/';
          
          toast.info('Owner detected. Redirecting to Dashboard...');
          window.location.href = dashboardUrl;
        } else {
          // RULE: If not -> block dashboard and keep user in user app
          // They are a customer, so send them to the User App home page
          toast.success('Login successful!');
          navigate('/');
        }
      } catch (err) {
        console.error('Error during role routing:', err);
        toast.error('Error determining user role. Staying in User App.');
        navigate('/');
      }
    };

    handleAuthCallback();
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
