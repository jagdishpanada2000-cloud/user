// Types matching the actual Supabase database schema
// DO NOT MODIFY - These types reflect the final database structure

import type { Json } from '@/integrations/supabase/types';

export interface BusinessHours {
  open: string;
  close: string;
  closed: boolean;
}

export interface BusinessHoursWeek {
  monday: BusinessHours;
  tuesday: BusinessHours;
  wednesday: BusinessHours;
  thursday: BusinessHours;
  friday: BusinessHours;
  saturday: BusinessHours;
  sunday: BusinessHours;
}

export interface Restaurant {
  id: string;
  name: string;
  description: string | null;
  phone: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  images: string[] | null;
  closing_time: string | null;
  business_hours: BusinessHoursWeek | Json | null;
  created_at: string;
  updated_at: string;
  // owner_id and unique_key are intentionally excluded for user app
}

export interface MenuSection {
  id: string;
  restaurant_id: string;
  name: string;
  description: string | null;
  position: number;
  created_at: string;
  updated_at: string;
  // owner_id is intentionally excluded for user app
}

export interface MenuItem {
  id: string;
  section_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
  position: number;
  created_at: string;
  updated_at: string;
  // owner_id is intentionally excluded for user app
}

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface FavoriteRestaurant {
  id: string;
  user_id: string;
  restaurant_id: string;
  created_at: string | null;
}

export interface FavoriteMenuItem {
  id: string;
  user_id: string;
  menu_item_id: string;
  created_at: string | null;
}

// Extended types with relations
export interface MenuSectionWithItems extends MenuSection {
  menu_items: MenuItem[];
}

export interface RestaurantWithMenu extends Restaurant {
  menu_sections: MenuSectionWithItems[];
}

export interface FavoriteRestaurantWithDetails extends FavoriteRestaurant {
  restaurant: Restaurant;
}

export interface FavoriteMenuItemWithDetails extends FavoriteMenuItem {
  menu_item: MenuItem & {
    menu_section: MenuSection & {
      restaurant: Restaurant;
    };
  };
}
