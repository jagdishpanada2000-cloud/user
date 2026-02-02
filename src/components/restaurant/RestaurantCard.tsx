import { Link } from 'react-router-dom';
import { MapPin, Clock, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFavorites } from '@/hooks/useFavorites';
import type { Restaurant, BusinessHoursWeek } from '@/types/database';

interface RestaurantCardProps {
  restaurant: Restaurant;
  isOpen: boolean;
}

// Format business hours for display
function formatTodayHours(businessHours: BusinessHoursWeek | unknown | null): string {
  if (!businessHours || typeof businessHours !== 'object') return 'Hours not set';
  
  const hours = businessHours as BusinessHoursWeek;
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
  const today = days[new Date().getDay()];
  const todayHours = hours[today];
  
  if (!todayHours || todayHours.closed) return 'Closed today';
  return `${todayHours.open} - ${todayHours.close}`;
}

export function RestaurantCard({ restaurant, isOpen }: RestaurantCardProps) {
  const { isFavoriteRestaurant, toggleFavoriteRestaurant } = useFavorites();
  const isFavorite = isFavoriteRestaurant(restaurant.id);
  
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavoriteRestaurant(restaurant.id);
  };

  // Get first image from images array
  const bannerUrl = restaurant.images && restaurant.images.length > 0 
    ? restaurant.images[0] 
    : '/placeholder.svg';

  return (
    <Link to={`/restaurant/${restaurant.id}`}>
      <article className="glass-card overflow-hidden group cursor-pointer fade-in hover:border-primary/30 transition-all duration-300">
        <div className="relative h-44 overflow-hidden">
          <img
            src={bannerUrl}
            alt={restaurant.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
          
          {!isOpen && (
            <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
              <span className="bg-destructive px-4 py-2 rounded-lg font-semibold">Currently Closed</span>
            </div>
          )}
          
          {/* Favorite button */}
          <Button
            variant="ghost"
            size="icon"
            className={`absolute top-3 right-3 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background/90 ${
              isFavorite ? 'text-red-500' : 'text-muted-foreground'
            }`}
            onClick={handleFavoriteClick}
          >
            <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
          </Button>
          
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
            <div className="flex items-center gap-1 text-sm text-foreground bg-background/80 px-2 py-1 rounded-lg backdrop-blur-sm">
              <Clock className="w-3.5 h-3.5" />
              <span>{formatTodayHours(restaurant.business_hours)}</span>
            </div>
          </div>
        </div>
        
        <div className="p-4">
          <h3 className="font-display font-bold text-lg mb-1 group-hover:text-primary transition-colors">
            {restaurant.name}
          </h3>
          {restaurant.description && (
            <p className="text-muted-foreground text-sm mb-3 line-clamp-2">{restaurant.description}</p>
          )}
          
          {restaurant.address && (
            <div className="flex items-center gap-1 text-muted-foreground text-xs">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span className="line-clamp-1">{restaurant.address}</span>
            </div>
          )}
        </div>
      </article>
    </Link>
  );
}
