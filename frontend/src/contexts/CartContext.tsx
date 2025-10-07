import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { cartService, CartItem, CartSummary } from '../services/cartService';
import { toast } from 'react-hot-toast';

interface CartContextType {
  items: CartItem[];
  summary: CartSummary | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  addToCart: (productId: string, quantity?: number, isGift?: boolean) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  removeMultipleFromCart: (productIds: string[]) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  updateCartItem: (productId: string, quantity: number, isGift: boolean) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
  
  // Utilities
  getCartCount: () => number;
  getCartTotal: () => number;
  isInCart: (productId: string) => boolean;
  getCartItem: (productId: string) => CartItem | undefined;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [summary, setSummary] = useState<CartSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if user is authenticated
  const isAuthenticated = (): boolean => {
    const token = localStorage.getItem('access_token');
    if (!token) return false;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp > currentTime;
    } catch {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      return false;
    }
  };

  const loadFromLocalStorage = () => {
    try {
      const savedItems = localStorage.getItem('cart_items');
      const savedSummary = localStorage.getItem('cart_summary');
      
      if (savedItems) {
        setItems(JSON.parse(savedItems));
      }
      if (savedSummary) {
        setSummary(JSON.parse(savedSummary));
      }
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
    }
  };

  const saveToLocalStorage = (cartItems: CartItem[], cartSummary: CartSummary | null) => {
    try {
      localStorage.setItem('cart_items', JSON.stringify(cartItems));
      if (cartSummary) {
        localStorage.setItem('cart_summary', JSON.stringify(cartSummary));
      }
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  };

  const fetchCartData = async () => {
    if (!isAuthenticated()) {
      setItems([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await cartService.getCartItems();
      setItems(response.items || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch cart data';
      
      if (errorMessage.includes('log in') || errorMessage.includes('authentication')) {
        setItems([]);
        setError(null);
        return;
      }
      
      setError(errorMessage);
      console.error('Cart fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productId: string, quantity: number = 1, isGift: boolean = false) => {
    if (!isAuthenticated()) {
      toast.error('Please log in to add items to cart');
      return;
    }

    setLoading(true);
    try {
      await cartService.addToCart({
        product_id: productId,
        quantity,
        is_gift: isGift
      });

      toast.success('Item added to cart');
      await fetchCartData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add item to cart';
      
      if (errorMessage.includes('Product not found or inactive')) {
        toast.error('This product is currently out of stock and cannot be added to cart');
      } else if (errorMessage.includes('inactive')) {
        toast.error('This product is no longer available');
      } else {
        toast.error(errorMessage);
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (productId: string) => {
    if (!isAuthenticated()) {
      toast.error('Please log in to manage cart');
      return;
    }

    setLoading(true);
    try {
      await cartService.removeFromCart(productId);
      toast.success('Item removed from cart');
      await fetchCartData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove item from cart';
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const removeMultipleFromCart = async (productIds: string[]) => {
    if (!isAuthenticated()) {
      toast.error('Please log in to manage cart');
      return;
    }

    if (productIds.length === 0) return;

    setLoading(true);
    try {
      await cartService.removeMultipleFromCart(productIds);
      toast.success(`${productIds.length} item${productIds.length > 1 ? 's' : ''} removed from cart`);
      await fetchCartData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove items from cart';
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    if (!isAuthenticated()) {
      toast.error('Please log in to manage cart');
      return;
    }

    if (quantity < 1) {
      await removeFromCart(productId);
      return;
    }

    setLoading(true);
    try {
      await cartService.updateCartQuantity(productId, { quantity });
      toast.success('Quantity updated');
      await fetchCartData(); // Refresh cart data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update quantity';
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const updateCartItem = async (productId: string, quantity: number, isGift: boolean) => {
    if (!isAuthenticated()) {
      toast.error('Please log in to manage cart');
      return;
    }

    setLoading(true);
    try {
      await cartService.updateCartItem(productId, {
        quantity,
        is_gift: isGift
      });

      toast.success('Cart item updated');
      await fetchCartData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update cart item';
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    if (!isAuthenticated()) {
      toast.error('Please log in to manage cart');
      return;
    }

    setLoading(true);
    try {
      await cartService.clearCart();
      // toast.success('Cart cleared');
      setItems([]);
      setSummary({ totalItems: 0, totalValue: 0, currency: 'USD' });
      saveToLocalStorage([], null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to clear cart';
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Refresh cart data
  const refreshCart = async () => {
    await fetchCartData();
  };

  // Utility functions
  const getCartCount = (): number => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  const getCartTotal = (): number => {
    return items.reduce((total, item) => total + (item.product.min_price * item.quantity), 0);
  };

  const isInCart = (productId: string): boolean => {
    return items.some(item => item.product_id === productId);
  };

  const getCartItem = (productId: string): CartItem | undefined => {
    return items.find(item => item.product_id === productId);
  };

  useEffect(() => {
    fetchCartData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Listen for authentication changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'access_token') {
        if (e.newValue) {
          fetchCartData();
        } else {
          setItems([]);
          setSummary(null);
          localStorage.removeItem('cart_items');
          localStorage.removeItem('cart_summary');
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const value: CartContextType = {
    items,
    summary,
    loading,
    error,
    addToCart,
    removeFromCart,
    removeMultipleFromCart,
    updateQuantity,
    updateCartItem,
    clearCart,
    refreshCart,
    getCartCount,
    getCartTotal,
    isInCart,
    getCartItem,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
