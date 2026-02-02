import { Plus, Minus, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/stores/cartStore';
import { useFavorites } from '@/hooks/useFavorites';
import { toast } from 'sonner';
import type { MenuItem as MenuItemType } from '@/types/database';

interface MenuItemProps {
  item: MenuItemType;
  restaurantId: string;
  restaurantName: string;
}

export function MenuItem({
  item,
  restaurantId,
  restaurantName,
}: MenuItemProps) {
  const { items, addItem, updateQuantity, getRestaurantId } = useCartStore();
  const { isFavoriteMenuItem, toggleFavoriteMenuItem } = useFavorites();
  
  const cartItem = items.find((i) => i.id === item.id);
  const quantity = cartItem?.quantity || 0;
  const currentRestaurantId = getRestaurantId();
  const isFavorite = isFavoriteMenuItem(item.id);

  const handleAddToCart = () => {
    if (currentRestaurantId && currentRestaurantId !== restaurantId) {
      toast.warning('Cart cleared', {
        description: 'Your cart was cleared as you added items from a different restaurant.',
      });
    }
    
    addItem({
      id: item.id,
      restaurantId,
      restaurantName,
      name: item.name,
      price: Number(item.price),
      imageUrl: item.image_url || undefined,
      isVegetarian: false, // Not in database schema
    });
    
    toast.success('Added to cart', {
      description: `${item.name} added to your cart`,
    });
  };

  const handleUpdateQuantity = (newQuantity: number) => {
    updateQuantity(item.id, newQuantity);
    if (newQuantity === 0) {
      toast.info('Removed from cart');
    }
  };

  const handleFavoriteClick = () => {
    toggleFavoriteMenuItem(item.id);
  };

  return (
    <div className="glass-card p-4 flex gap-4 fade-in">
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <h4 className="font-semibold text-foreground">{item.name}</h4>
          <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 ${isFavorite ? 'text-red-500' : 'text-muted-foreground'}`}
            onClick={handleFavoriteClick}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
          </Button>
        </div>
        
        <p className="text-primary font-display font-bold mb-2">${Number(item.price).toFixed(2)}</p>
        
        {item.description && (
          <p className="text-muted-foreground text-sm line-clamp-2">{item.description}</p>
        )}
      </div>
      
      <div className="flex flex-col items-center justify-between">
        {item.image_url && (
          <div className="w-24 h-24 rounded-lg overflow-hidden mb-2">
            <img
              src={item.image_url}
              alt={item.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        {item.is_available ? (
          quantity > 0 ? (
            <div className="flex items-center gap-2 bg-primary rounded-lg">
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-primary-foreground hover:bg-primary/80"
                onClick={() => handleUpdateQuantity(quantity - 1)}
              >
                <Minus className="w-4 h-4" />
              </Button>
              <span className="font-semibold text-primary-foreground w-6 text-center">{quantity}</span>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-primary-foreground hover:bg-primary/80"
                onClick={() => handleUpdateQuantity(quantity + 1)}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              onClick={handleAddToCart}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          )
        ) : (
          <Button size="sm" variant="outline" disabled>
            Unavailable
          </Button>
        )}
      </div>
    </div>
  );
}
