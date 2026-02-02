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
      // 1. Check if we have a session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        console.error('Session error or not found:', sessionError);
        navigate('/auth');
        return;
      }

      try {
        // 2. Query the restaurants table to check if the user is an owner
        // Database schema is FINAL: check restaurants.owner_id === auth.uid()
        const { data: ownershipData, error: dbError } = await supabase
          .from('restaurants')
          .select('id')
          .eq('owner_id', session.user.id)
          .maybeSingle();

        if (dbError) throw dbError;

        if (ownershipData) {
          // RULE: If a restaurant exists -> allow dashboard access
          // Redirect the owner back to the dashboard
          toast.info('Owner detected. Redirecting to Dashboard...');
          window.location.href = 'http://localhost:8080/';
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
