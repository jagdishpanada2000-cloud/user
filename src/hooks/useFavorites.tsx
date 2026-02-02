import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import type { FavoriteRestaurant, FavoriteMenuItem } from '@/types/database';

interface FavoritesContextType {
  favoriteRestaurantIds: Set<string>;
  favoriteMenuItemIds: Set<string>;
  isLoading: boolean;
  toggleFavoriteRestaurant: (restaurantId: string) => Promise<void>;
  toggleFavoriteMenuItem: (menuItemId: string) => Promise<void>;
  isFavoriteRestaurant: (restaurantId: string) => boolean;
  isFavoriteMenuItem: (menuItemId: string) => boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [favoriteRestaurantIds, setFavoriteRestaurantIds] = useState<Set<string>>(new Set());
  const [favoriteMenuItemIds, setFavoriteMenuItemIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  // Fetch user's favorites on mount and when user changes
  useEffect(() => {
    if (user) {
      fetchFavorites();
    } else {
      setFavoriteRestaurantIds(new Set());
      setFavoriteMenuItemIds(new Set());
    }
  }, [user]);

  const fetchFavorites = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Fetch favorite restaurants
      const { data: restaurantFavorites, error: restError } = await supabase
        .from('favorite_restaurants')
        .select('restaurant_id')
        .eq('user_id', user.id);

      if (restError) throw restError;
      
      setFavoriteRestaurantIds(
        new Set(restaurantFavorites?.map((f: { restaurant_id: string }) => f.restaurant_id) || [])
      );

      // Fetch favorite menu items
      const { data: itemFavorites, error: itemError } = await supabase
        .from('favorite_menu_items')
        .select('menu_item_id')
        .eq('user_id', user.id);

      if (itemError) throw itemError;
      
      setFavoriteMenuItemIds(
        new Set(itemFavorites?.map((f: { menu_item_id: string }) => f.menu_item_id) || [])
      );
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFavoriteRestaurant = useCallback(async (restaurantId: string) => {
    if (!user) {
      toast.error('Please sign in to save favorites');
      return;
    }

    const isFavorite = favoriteRestaurantIds.has(restaurantId);
    
    // Optimistic update
    setFavoriteRestaurantIds((prev) => {
      const next = new Set(prev);
      if (isFavorite) {
        next.delete(restaurantId);
      } else {
        next.add(restaurantId);
      }
      return next;
    });

    try {
      if (isFavorite) {
        // Remove from favorites
        const { error } = await supabase
          .from('favorite_restaurants')
          .delete()
          .eq('user_id', user.id)
          .eq('restaurant_id', restaurantId);

        if (error) throw error;
        toast.success('Removed from favorites');
      } else {
        // Add to favorites
        const { error } = await supabase
          .from('favorite_restaurants')
          .insert({ user_id: user.id, restaurant_id: restaurantId });

        if (error) throw error;
        toast.success('Added to favorites');
      }
    } catch (error: any) {
      // Revert optimistic update on error
      setFavoriteRestaurantIds((prev) => {
        const next = new Set(prev);
        if (isFavorite) {
          next.add(restaurantId);
        } else {
          next.delete(restaurantId);
        }
        return next;
      });
      
      if (error.code === '23505') {
        // Duplicate key - already a favorite
        toast.error('Already in favorites');
      } else {
        toast.error('Failed to update favorites');
        console.error('Error toggling favorite restaurant:', error);
      }
    }
  }, [user, favoriteRestaurantIds]);

  const toggleFavoriteMenuItem = useCallback(async (menuItemId: string) => {
    if (!user) {
      toast.error('Please sign in to save favorites');
      return;
    }

    const isFavorite = favoriteMenuItemIds.has(menuItemId);
    
    // Optimistic update
    setFavoriteMenuItemIds((prev) => {
      const next = new Set(prev);
      if (isFavorite) {
        next.delete(menuItemId);
      } else {
        next.add(menuItemId);
      }
      return next;
    });

    try {
      if (isFavorite) {
        // Remove from favorites
        const { error } = await supabase
          .from('favorite_menu_items')
          .delete()
          .eq('user_id', user.id)
          .eq('menu_item_id', menuItemId);

        if (error) throw error;
        toast.success('Removed from favorites');
      } else {
        // Add to favorites
        const { error } = await supabase
          .from('favorite_menu_items')
          .insert({ user_id: user.id, menu_item_id: menuItemId });

        if (error) throw error;
        toast.success('Added to favorites');
      }
    } catch (error: any) {
      // Revert optimistic update on error
      setFavoriteMenuItemIds((prev) => {
        const next = new Set(prev);
        if (isFavorite) {
          next.add(menuItemId);
        } else {
          next.delete(menuItemId);
        }
        return next;
      });
      
      if (error.code === '23505') {
        toast.error('Already in favorites');
      } else {
        toast.error('Failed to update favorites');
        console.error('Error toggling favorite menu item:', error);
      }
    }
  }, [user, favoriteMenuItemIds]);

  const isFavoriteRestaurant = useCallback(
    (restaurantId: string) => favoriteRestaurantIds.has(restaurantId),
    [favoriteRestaurantIds]
  );

  const isFavoriteMenuItem = useCallback(
    (menuItemId: string) => favoriteMenuItemIds.has(menuItemId),
    [favoriteMenuItemIds]
  );

  return (
    <FavoritesContext.Provider
      value={{
        favoriteRestaurantIds,
        favoriteMenuItemIds,
        isLoading,
        toggleFavoriteRestaurant,
        toggleFavoriteMenuItem,
        isFavoriteRestaurant,
        isFavoriteMenuItem,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}
