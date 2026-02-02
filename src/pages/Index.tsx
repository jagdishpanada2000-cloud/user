import { useState, useEffect, useMemo } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Layout } from '@/components/layout/Layout';
import { RestaurantCard } from '@/components/restaurant/RestaurantCard';
import { RestaurantCardSkeleton } from '@/components/restaurant/RestaurantCardSkeleton';
import { supabase } from '@/integrations/supabase/client';
import type { Restaurant, BusinessHoursWeek } from '@/types/database';

// Helper to check if restaurant is currently open
function isRestaurantOpen(businessHours: BusinessHoursWeek | unknown | null): boolean {
  if (!businessHours || typeof businessHours !== 'object') return true; // Assume open if no hours set
  
  const hours = businessHours as BusinessHoursWeek;
  const now = new Date();
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
  const today = days[now.getDay()];
  const todayHours = hours[today];
  
  if (!todayHours || todayHours.closed) return false;
  
  const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
  return currentTime >= todayHours.open && currentTime <= todayHours.close;
}

export default function Index() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    // Select only fields needed for user app (exclude owner_id and unique_key)
    const { data, error } = await supabase
      .from('restaurants')
      .select('id, name, description, phone, address, latitude, longitude, images, closing_time, business_hours, created_at, updated_at')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching restaurants:', error);
    } else {
      setRestaurants((data as Restaurant[]) || []);
    }
    setLoading(false);
  };

  const filteredRestaurants = useMemo(() => {
    if (!searchQuery.trim()) return restaurants;
    
    const query = searchQuery.toLowerCase();
    return restaurants.filter((restaurant) => {
      return (
        restaurant.name.toLowerCase().includes(query) ||
        restaurant.description?.toLowerCase().includes(query) ||
        restaurant.address?.toLowerCase().includes(query)
      );
    });
  }, [restaurants, searchQuery]);

  return (
    <Layout>
      <div className="container py-6">
        {/* Hero Section */}
        <section className="mb-8 slide-up">
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-3">
            Discover great food
            <br />
            <span className="text-primary">near you.</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-md">
            Browse menus from your favorite local restaurants.
          </p>
        </section>

        {/* Search */}
        <section className="mb-6 space-y-4 fade-in">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search restaurants..."
                className="pl-10 h-12 bg-card border-border"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon" className="h-12 w-12">
              <SlidersHorizontal className="w-5 h-5" />
            </Button>
          </div>
        </section>

        {/* Restaurants Grid */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-semibold">All Restaurants</h2>
            <span className="text-muted-foreground text-sm">
              {filteredRestaurants.length} places
            </span>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <RestaurantCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredRestaurants.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">No restaurants found</p>
              <p className="text-muted-foreground text-sm mt-1">Try adjusting your search</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRestaurants.map((restaurant) => (
                <RestaurantCard
                  key={restaurant.id}
                  restaurant={restaurant}
                  isOpen={isRestaurantOpen(restaurant.business_hours)}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
}
