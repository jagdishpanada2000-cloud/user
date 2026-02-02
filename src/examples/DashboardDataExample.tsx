import { useEffect, useState } from 'react';
import { useAuthReady } from '@/hooks/useAuthReady';
import { supabase } from '@/integrations/supabase/client';

// Example of how to properly fetch dashboard data after login
export function useDashboardStats() {
  const { isAuthReady, isAuthenticated, user } = useAuthReady();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Don't fetch data until auth is ready
    if (!isAuthReady) {
      return;
    }

    // If not authenticated, clear data and stop loading
    if (!isAuthenticated) {
      setStats(null);
      setLoading(false);
      return;
    }

    // Now we know user is authenticated, fetch data
    const fetchDashboardStats = async () => {
      try {
        setLoading(true);
        setError(null);

        // Example: Fetch restaurant data for the authenticated user
        const { data, error: fetchError } = await supabase
          .from('restaurants')
          .select('*')
          .eq('owner_id', user.id)
          .maybeSingle();

        if (fetchError) throw fetchError;

        setStats(data);
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, [isAuthReady, isAuthenticated, user?.id]);

  return { stats, loading, error };
}

// Example Dashboard Component
export function DashboardExample() {
  const { stats, loading, error } = useDashboardStats();

  if (loading) {
    return <div>Loading dashboard...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!stats) {
    return <div>No restaurant data found</div>;
  }

  return (
    <div>
      <h1>Restaurant Dashboard</h1>
      <p>Restaurant: {stats.name}</p>
      <p>Address: {stats.address}</p>
      {/* Your dashboard content */}
    </div>
  );
}