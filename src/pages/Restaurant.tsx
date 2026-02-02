import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Clock, MapPin, Heart, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Layout } from '@/components/layout/Layout';
import { MenuItem } from '@/components/menu/MenuItem';
import { MenuItemSkeleton } from '@/components/menu/MenuItemSkeleton';
import { supabase } from '@/integrations/supabase/client';
import { useFavorites } from '@/hooks/useFavorites';
import type { Restaurant as RestaurantType, MenuSection, MenuItem as MenuItemType, BusinessHoursWeek } from '@/types/database';

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

// Format today's hours
function formatTodayHours(businessHours: BusinessHoursWeek | unknown | null): string {
  if (!businessHours || typeof businessHours !== 'object') return 'Hours not set';
  
  const hours = businessHours as BusinessHoursWeek;
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
  const today = days[new Date().getDay()];
  const todayHours = hours[today];
  
  if (!todayHours || todayHours.closed) return 'Closed today';
  return `${todayHours.open} - ${todayHours.close}`;
}

export default function Restaurant() {
  const { id } = useParams<{ id: string }>();
  const [restaurant, setRestaurant] = useState<RestaurantType | null>(null);
  const [sections, setSections] = useState<MenuSection[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItemType[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<string>('');
  const { isFavoriteRestaurant, toggleFavoriteRestaurant } = useFavorites();

  useEffect(() => {
    if (id) {
      fetchRestaurantData();
    }
  }, [id]);

  const fetchRestaurantData = async () => {
    setLoading(true);

    // Fetch restaurant (exclude owner_id and unique_key)
    const { data: restaurantData } = await supabase
      .from('restaurants')
      .select('id, name, description, phone, address, latitude, longitude, images, closing_time, business_hours, created_at, updated_at')
      .eq('id', id)
      .maybeSingle();

    if (restaurantData) {
      setRestaurant(restaurantData as RestaurantType);
    }

    // Fetch sections ordered by position (exclude owner_id)
    const { data: sectionsData } = await supabase
      .from('menu_sections')
      .select('id, restaurant_id, name, description, position, created_at, updated_at')
      .eq('restaurant_id', id)
      .order('position', { ascending: true });

    if (sectionsData && sectionsData.length > 0) {
      setSections(sectionsData as MenuSection[]);
      setActiveSection(sectionsData[0].id);
    }

    // Fetch menu items that are available, ordered by position (exclude owner_id)
    const { data: itemsData } = await supabase
      .from('menu_items')
      .select('id, section_id, name, description, price, image_url, is_available, position, created_at, updated_at')
      .eq('is_available', true)
      .order('position', { ascending: true });

    if (itemsData) {
      // Filter items to only those in fetched sections
      const sectionIds = new Set(sectionsData?.map(s => s.id) || []);
      const filteredItems = itemsData.filter(item => sectionIds.has(item.section_id));
      setMenuItems(filteredItems as MenuItemType[]);
    }

    setLoading(false);
  };

  const getItemsForSection = useMemo(() => {
    return (sectionId: string) => {
      return menuItems
        .filter((item) => item.section_id === sectionId)
        .sort((a, b) => a.position - b.position);
    };
  }, [menuItems]);

  const isFavorite = restaurant ? isFavoriteRestaurant(restaurant.id) : false;
  const isOpen = restaurant ? isRestaurantOpen(restaurant.business_hours) : true;
  const bannerUrl = restaurant?.images && restaurant.images.length > 0 
    ? restaurant.images[0] 
    : '/placeholder.svg';

  if (loading) {
    return (
      <Layout>
        <div className="container py-6">
          <div className="h-64 shimmer rounded-xl mb-6" />
          <div className="h-8 w-1/2 shimmer rounded mb-4" />
          <div className="h-4 w-3/4 shimmer rounded mb-8" />
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <MenuItemSkeleton key={i} />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  if (!restaurant) {
    return (
      <Layout>
        <div className="container py-6 text-center">
          <h1 className="text-2xl font-bold mb-4">Restaurant not found</h1>
          <Link to="/">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="relative">
        {/* Banner */}
        <div className="h-64 md:h-80 relative">
          <img
            src={bannerUrl}
            alt={restaurant.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
          
          <Link to="/" className="absolute top-4 left-4">
            <Button variant="secondary" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          
          {/* Favorite Button */}
          <Button
            variant="secondary"
            size="icon"
            className={`absolute top-4 right-4 rounded-full ${isFavorite ? 'text-red-500' : ''}`}
            onClick={() => toggleFavoriteRestaurant(restaurant.id)}
          >
            <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
          </Button>
          
          {!isOpen && (
            <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
              <span className="bg-destructive px-4 py-2 rounded-lg font-semibold">Currently Closed</span>
            </div>
          )}
        </div>

        {/* Restaurant Info */}
        <div className="container -mt-20 relative z-10 pb-6">
          <div className="glass-card p-6 mb-6 slide-up">
            <h1 className="font-display text-3xl font-bold mb-2">{restaurant.name}</h1>
            {restaurant.description && (
              <p className="text-muted-foreground mb-4">{restaurant.description}</p>
            )}
            
            <div className="flex flex-wrap gap-4 text-sm">
              <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${isOpen ? 'bg-green-500/20 text-green-500' : 'bg-destructive/20 text-destructive'}`}>
                <span className="font-semibold">{isOpen ? 'Open' : 'Closed'}</span>
              </div>
              
              <div className="flex items-center gap-1 text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>{formatTodayHours(restaurant.business_hours)}</span>
              </div>
              
              {restaurant.address && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>{restaurant.address}</span>
                </div>
              )}
              
              {restaurant.phone && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Phone className="w-4 h-4" />
                  <span>{restaurant.phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Menu Tabs */}
          {sections.length > 0 ? (
            <Tabs value={activeSection} onValueChange={setActiveSection} className="fade-in">
              <TabsList className="w-full justify-start overflow-x-auto mb-6 bg-card">
                {sections.map((section) => (
                  <TabsTrigger
                    key={section.id}
                    value={section.id}
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    {section.name}
                  </TabsTrigger>
                ))}
              </TabsList>

              {sections.map((section) => (
                <TabsContent key={section.id} value={section.id} className="space-y-4">
                  <div className="mb-4">
                    <h2 className="font-display text-xl font-semibold">{section.name}</h2>
                    {section.description && (
                      <p className="text-muted-foreground text-sm mt-1">{section.description}</p>
                    )}
                  </div>
                  {getItemsForSection(section.id).length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No items in this section</p>
                  ) : (
                    <div className="space-y-4">
                      {getItemsForSection(section.id).map((item) => (
                        <MenuItem
                          key={item.id}
                          item={item}
                          restaurantId={restaurant.id}
                          restaurantName={restaurant.name}
                        />
                      ))}
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          ) : (
            <p className="text-muted-foreground text-center py-8">No menu available</p>
          )}
        </div>
      </div>
    </Layout>
  );
}
