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
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (!error && role) {
      // Store role in localStorage for post-login routing
      localStorage.setItem('selectedRole', role);
    }
    
    return { error: error ? new Error(error.message) : null };
  };

  const signUp = async (email: string, password: string, role?: 'user' | 'owner') => {
    // Redirect back to the same app where signup was initiated
    const redirectUrl = `${window.location.origin}/auth/callback`;
    
    if (role) {
      // Store role in localStorage for post-signup routing
      localStorage.setItem('selectedRole', role);
    }
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });
    return { error: error ? new Error(error.message) : null };
  };

  const signInWithGoogle = async (role: 'user' | 'owner') => {
    try {
      // Store role in localStorage for post-login routing
      localStorage.setItem('selectedRole', role);
      
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
