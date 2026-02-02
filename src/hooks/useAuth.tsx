import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string, role?: 'user' | 'owner') => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, role?: 'user' | 'owner') => Promise<{ error: Error | null }>;
  signInWithGoogle: (role: 'user' | 'owner') => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let initialCheckDone = false;

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Only set loading to false after initial session check is complete
        if (initialCheckDone) {
          setLoading(false);
        }
      }
    );

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting session:', error);
        }
        setSession(session);
        setUser(session?.user ?? null);
      } catch (error) {
        console.error('Session initialization error:', error);
        setSession(null);
        setUser(null);
      } finally {
        initialCheckDone = true;
        setLoading(false);
      }
    };

    getInitialSession();

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string, role?: 'user' | 'owner') => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      return { error: new Error(error.message) };
    }

    // Check if user has a role in the database
    if (data.user && role) {
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', data.user.id)
        .single();

      if (roleError && roleError.code !== 'PGRST116') {
        // Error other than "not found"
        console.error('Error checking user role:', roleError);
      }

      if (roleData) {
        // User has an existing role
        if (roleData.role !== role) {
          // Role mismatch - sign out and return error
          await supabase.auth.signOut();
          return { 
            error: new Error(
              role === 'owner' 
                ? 'This account is registered as a customer. Please use a different account to sign in as a restaurant owner.' 
                : 'This account is registered as a restaurant owner. Please use a different account to sign in as a customer.'
            ) 
          };
        }
      } else {
        // No role exists, create one
        const { error: insertError } = await supabase
          .from('user_roles')
          .insert({ user_id: data.user.id, role });
        
        if (insertError) {
          console.error('Error saving user role:', insertError);
        }
      }

      // Store role in localStorage for post-login routing
      localStorage.setItem('selectedRole', role);
    }
    
    return { error: null };
  };

  const signUp = async (email: string, password: string, role?: 'user' | 'owner') => {
    // Redirect back to the same app where signup was initiated
    const redirectUrl = `${window.location.origin}/auth/callback`;
    
    if (role) {
      // Store role in localStorage for post-signup routing
      localStorage.setItem('selectedRole', role);
    }
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });

    // Save role to database if signup was successful and user is confirmed
    if (!error && data.user && role) {
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({ user_id: data.user.id, role });
      
      if (roleError) {
        console.error('Error saving user role:', roleError);
      }
    }

    return { error: error ? new Error(error.message) : null };
  };

  const signInWithGoogle = async (role: 'user' | 'owner') => {
    try {
      // Store role in localStorage for post-login routing and role verification
      localStorage.setItem('selectedRole', role);
      localStorage.setItem('pendingGoogleRole', role);
      
      // Determine redirect URL based on role and environment
      const getRedirectUrl = () => {
        const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        
        if (role === 'owner') {
          // Redirect to dashboard
          return isDev ? 'http://localhost:8080/auth/callback' : 'https://dashboard-eight-swart-98.vercel.app/auth/callback';
        } else {
          // Redirect to user app
          return isDev ? 'http://localhost:8081/auth/callback' : `${window.location.origin}/auth/callback`;
        }
      };

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: getRedirectUrl(),
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      return { error: error ? new Error(error.message) : null };
    } catch (error) {
      return { error: error instanceof Error ? error : new Error('An unknown error occurred') };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
