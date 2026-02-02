import { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Heart, Store, UtensilsCrossed } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Layout } from '@/components/layout/Layout';
import { RestaurantCard } from '@/components/restaurant/RestaurantCard';
import { RestaurantCardSkeleton } from '@/components/restaurant/RestaurantCardSkeleton';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useFavorites } from '@/hooks/useFavorites';
import type { Restaurant, MenuItem, MenuSection, BusinessHoursWeek } from '@/types/database';

interface FavoriteMenuItemWithDetails extends MenuItem {
  menu_section: MenuSection & {
    restaurant: Restaurant;
  };
}

// Helper to check if restaurant is currently open
function isRestaurantOpen(businessHours: BusinessHoursWeek | unknown | null): boolean {
  if (!businessHours || typeof businessHours !== 'object') return true;
  
  const hours = businessHours as BusinessHoursWeek;
  const now = new Date();
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
  const today = days[now.getDay()];
  const todayHours = hours[today];
  
  if (!todayHours || todayHours.closed) return false;
  
  const currentTime = now.toTimeString().slice(0, 5);
  return currentTime >= todayHours.open && currentTime <= todayHours.close;
}

export default function Favorites() {
  const { user, loading: authLoading } = useAuth();
  const { favoriteRestaurantIds, favoriteMenuItemIds, toggleFavoriteMenuItem } = useFavorites();
  const [favoriteRestaurants, setFavoriteRestaurants] = useState<Restaurant[]>([]);
  const [favoriteMenuItems, setFavoriteMenuItems] = useState<FavoriteMenuItemWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('restaurants');

  useEffect(() => {
    if (user && favoriteRestaurantIds.size > 0) {
      fetchFavoriteRestaurants();
    } else {
      setFavoriteRestaurants([]);
    }
  }, [user, favoriteRestaurantIds]);

  useEffect(() => {
    if (user && favoriteMenuItemIds.size > 0) {
      fetchFavoriteMenuItems();
    } else {
      setFavoriteMenuItems([]);
    }
  }, [user, favoriteMenuItemIds]);

  useEffect(() => {
    if (!authLoading) {
      setLoading(false);
    }
  }, [authLoading]);

  const fetchFavoriteRestaurants = async () => {
    const ids = Array.from(favoriteRestaurantIds);
    if (ids.length === 0) {
      setFavoriteRestaurants([]);
      return;
    }

    const { data, error } = await supabase
      .from('restaurants')
      .select('id, name, description, phone, address, latitude, longitude, images, closing_time, business_hours, created_at, updated_at')
      .in('id', ids);

    if (error) {
      console.error('Error fetching favorite restaurants:', error);
    } else {
      setFavoriteRestaurants((data as unknown as Restaurant[]) || []);
    }
  };

  const fetchFavoriteMenuItems = async () => {
    const ids = Array.from(favoriteMenuItemIds);
    if (ids.length === 0) {
      setFavoriteMenuItems([]);
      return;
    }

    // Fetch menu items with their section and restaurant info
    const { data: menuItemsData, error: itemsError } = await supabase
      .from('menu_items')
      .select('id, section_id, name, description, price, image_url, is_available, position, created_at, updated_at')
      .in('id', ids);

    if (itemsError || !menuItemsData) {
      console.error('Error fetching favorite menu items:', itemsError);
      return;
    }

    // Get unique section IDs
    const sectionIds = [...new Set(menuItemsData.map(item => item.section_id))];
    
    // Fetch sections with restaurant info
    const { data: sectionsData, error: sectionsError } = await supabase
      .from('menu_sections')
      .select('id, restaurant_id, name, description, position, created_at, updated_at')
      .in('id', sectionIds);

    if (sectionsError || !sectionsData) {
      console.error('Error fetching sections:', sectionsError);
      return;
    }

    // Get unique restaurant IDs
    const restaurantIds = [...new Set(sectionsData.map(section => section.restaurant_id))];

    // Fetch restaurants
    const { data: restaurantsData, error: restaurantsError } = await supabase
      .from('restaurants')
      .select('id, name, description, phone, address, latitude, longitude, images, closing_time, business_hours, created_at, updated_at')
      .in('id', restaurantIds);

    if (restaurantsError || !restaurantsData) {
      console.error('Error fetching restaurants:', restaurantsError);
      return;
    }

    // Build the nested structure
    const restaurantsMap = new Map(restaurantsData.map(r => [r.id, r]));
    const sectionsMap = new Map(sectionsData.map(s => [s.id, {
      ...s,
      restaurant: restaurantsMap.get(s.restaurant_id)!
    }]));

    const itemsWithDetails = menuItemsData
      .map(item => ({
        ...item,
        menu_section: sectionsMap.get(item.section_id)!
      }))
      .filter(item => item.menu_section?.restaurant) as unknown as FavoriteMenuItemWithDetails[];

    setFavoriteMenuItems(itemsWithDetails);
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="container py-12 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <Layout>
      <div className="container py-6">
        <div className="flex items-center gap-3 mb-6 slide-up">
          <Heart className="w-8 h-8 text-primary" />
          <h1 className="font-display text-3xl font-bold">My Favorites</h1>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="fade-in">
          <TabsList className="mb-6 bg-card">
            <TabsTrigger
              value="restaurants"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Store className="w-4 h-4 mr-2" />
              Restaurants ({favoriteRestaurantIds.size})
            </TabsTrigger>
            <TabsTrigger
              value="items"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <UtensilsCrossed className="w-4 h-4 mr-2" />
              Menu Items ({favoriteMenuItemIds.size})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="restaurants">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                  <RestaurantCardSkeleton key={i} />
                ))}
              </div>
            ) : favoriteRestaurants.length === 0 ? (
              <div className="text-center py-12 glass-card">
                <Store className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold mb-2">No favorite restaurants yet</h2>
                <p className="text-muted-foreground mb-4">
                  Start exploring and save your favorite restaurants
                </p>
                <Link to="/">
                  <Button>Browse Restaurants</Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {favoriteRestaurants.map((restaurant) => (
                  <RestaurantCard
                    key={restaurant.id}
                    restaurant={restaurant}
                    isOpen={isRestaurantOpen(restaurant.business_hours)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="items">
            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="glass-card p-4 shimmer h-32" />
                ))}
              </div>
            ) : favoriteMenuItems.length === 0 ? (
              <div className="text-center py-12 glass-card">
                <UtensilsCrossed className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold mb-2">No favorite menu items yet</h2>
                <p className="text-muted-foreground mb-4">
                  Browse restaurant menus and save items you love
                </p>
                <Link to="/">
                  <Button>Browse Restaurants</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {favoriteMenuItems.map((item) => (
                  <div key={item.id} className="glass-card p-4 fade-in">
                    <div className="flex gap-4">
                      {item.image_url && (
                        <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-semibold text-foreground">{item.name}</h3>
                            <Link 
                              to={`/restaurant/${item.menu_section.restaurant.id}`}
                              className="text-sm text-primary hover:underline"
                            >
                              {item.menu_section.restaurant.name}
                            </Link>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 flex-shrink-0"
                            onClick={() => toggleFavoriteMenuItem(item.id)}
                          >
                            <Heart className="w-5 h-5 fill-current" />
                          </Button>
                        </div>
                        <p className="text-primary font-display font-bold mt-1">
                          ${Number(item.price).toFixed(2)}
                        </p>
                        {item.description && (
                          <p className="text-muted-foreground text-sm line-clamp-1 mt-1">
                            {item.description}
                          </p>
                        )}
                        {!item.is_available && (
                          <span className="inline-block mt-2 text-xs text-destructive bg-destructive/10 px-2 py-1 rounded">
                            Currently unavailable
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
