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

        // Successfully authenticated, check for stored role and verify against database
        const storedRole = localStorage.getItem('selectedRole') as 'user' | 'owner' | null;
        const pendingGoogleRole = localStorage.getItem('pendingGoogleRole') as 'user' | 'owner' | null;
        localStorage.removeItem('selectedRole'); // Clean up
        localStorage.removeItem('pendingGoogleRole'); // Clean up

        const roleToUse = 'user'; // Force user role for this app

        // Check if user already has a role in the database
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', data.session.user.id)
          .single();

        if (roleError && roleError.code !== 'PGRST116') {
          console.error('Error checking user role:', roleError);
        }

        if (roleData) {
          // User has an existing role
          // In the single-app version, we might want to be more lenient or just ensure they can login
          // but for now let's just proceed.
          // If we really want to enforce "user" role, we could check it here.
          // For now, let's just log them in.
        } else {
          // No role exists, create one
          const { error: insertError } = await supabase
            .from('user_roles')
            .insert({ user_id: data.session.user.id, role: roleToUse });

          if (insertError) {
            console.error('Error saving user role:', insertError);
          }
        }

        // Default to user app
        toast.success('Login successful!');
        navigate('/');

      } catch (err) {
        console.error('Error during auth callback:', err);
        toast.error('Authentication error occurred');
        navigate('/auth');
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
