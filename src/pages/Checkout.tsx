import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Phone, User, CreditCard } from 'lucide-react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/hooks/useAuth';
import { useCartStore } from '@/stores/cartStore';
import { toast } from 'sonner';

const checkoutSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  phone: z.string().min(10, 'Enter a valid phone number').max(15),
  address: z.string().min(10, 'Enter a complete address').max(500),
  city: z.string().min(2, 'Enter a valid city').max(100),
  instructions: z.string().max(500).optional(),
});

export default function Checkout() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { items, getTotal, clearCart } = useCartStore();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    instructions: '',
  });

  // Redirect to login if not authenticated
  if (!authLoading && !user) {
    return (
      <Layout showStickyCart={false}>
        <div className="container py-12 text-center slide-up">
          <h1 className="font-display text-2xl font-bold mb-4">Please sign in to checkout</h1>
          <p className="text-muted-foreground mb-6">You need to be logged in to place an order.</p>
          <Link to="/auth">
            <Button className="btn-glow">Sign In to Continue</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  // Redirect if cart is empty
  if (items.length === 0) {
    return (
      <Layout showStickyCart={false}>
        <div className="container py-12 text-center slide-up">
          <h1 className="font-display text-2xl font-bold mb-4">Your cart is empty</h1>
          <p className="text-muted-foreground mb-6">Add some items before checking out.</p>
          <Link to="/">
            <Button className="btn-glow">Browse Restaurants</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate form
    const result = checkoutSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    
    // Simulate order processing (fake - no backend)
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    // Clear cart and redirect to success
    clearCart();
    toast.success('Order placed successfully!');
    navigate('/success');
    
    setLoading(false);
  };

  const total = getTotal() + 2.99 + getTotal() * 0.08;

  return (
    <Layout showStickyCart={false}>
      <div className="container py-6">
        <Link to="/cart" className="text-muted-foreground hover:text-foreground transition-colors text-sm mb-4 inline-flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" />
          Back to Cart
        </Link>
        
        <h1 className="font-display text-2xl font-bold mb-6">Checkout</h1>

        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Delivery Details */}
            <div className="lg:col-span-2 space-y-6">
              <div className="glass-card p-6 fade-in">
                <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  Contact Details
                </h2>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={handleChange}
                      className={errors.name ? 'border-destructive' : ''}
                    />
                    {errors.name && <p className="text-destructive text-sm mt-1">{errors.name}</p>}
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        placeholder="+1 234 567 8900"
                        className={`pl-10 ${errors.phone ? 'border-destructive' : ''}`}
                        value={formData.phone}
                        onChange={handleChange}
                      />
                    </div>
                    {errors.phone && <p className="text-destructive text-sm mt-1">{errors.phone}</p>}
                  </div>
                </div>
              </div>

              <div className="glass-card p-6 fade-in">
                <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  Delivery Address
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="address">Street Address</Label>
                    <Input
                      id="address"
                      name="address"
                      placeholder="123 Main Street, Apt 4B"
                      value={formData.address}
                      onChange={handleChange}
                      className={errors.address ? 'border-destructive' : ''}
                    />
                    {errors.address && <p className="text-destructive text-sm mt-1">{errors.address}</p>}
                  </div>
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      name="city"
                      placeholder="New York"
                      value={formData.city}
                      onChange={handleChange}
                      className={errors.city ? 'border-destructive' : ''}
                    />
                    {errors.city && <p className="text-destructive text-sm mt-1">{errors.city}</p>}
                  </div>
                  <div>
                    <Label htmlFor="instructions">Delivery Instructions (Optional)</Label>
                    <Input
                      id="instructions"
                      name="instructions"
                      placeholder="Ring the doorbell twice"
                      value={formData.instructions}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              <div className="glass-card p-6 fade-in">
                <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-primary" />
                  Payment
                </h2>
                <p className="text-muted-foreground text-sm">
                  This is a demo app. No real payment will be processed.
                </p>
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <p className="text-sm font-medium">Cash on Delivery</p>
                  <p className="text-xs text-muted-foreground">Pay when you receive your order</p>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="glass-card p-6 sticky top-24 slide-up">
                <h2 className="font-display text-lg font-semibold mb-4">Order Summary</h2>
                
                <div className="space-y-3 mb-4">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {item.quantity}x {item.name}
                      </span>
                      <span>${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-border pt-3 space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>${getTotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Delivery Fee</span>
                    <span>$2.99</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Taxes</span>
                    <span>${(getTotal() * 0.08).toFixed(2)}</span>
                  </div>
                  <div className="border-t border-border pt-3">
                    <div className="flex justify-between font-display font-bold text-lg">
                      <span>Total</span>
                      <span className="text-primary">${total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                
                <Button
                  type="submit"
                  className="w-full btn-glow h-12 text-lg"
                  disabled={loading}
                >
                  {loading ? 'Placing Order...' : 'Place Order'}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </Layout>
  );
}
