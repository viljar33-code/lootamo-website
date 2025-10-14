import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { wishlistService, WishlistItem, WishlistSummary } from '@/services/wishlistService';
import toast from 'react-hot-toast';

interface WishlistContextType {
  wishlistItems: string[];
  wishlistData: WishlistItem[];
  summary: WishlistSummary | null;
  loading: boolean;
  addToWishlist: (productId: string) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  toggleWishlist: (productId: string) => Promise<void>;
  refreshWishlist: () => Promise<void>;
  clearWishlist: () => Promise<void>;
  addAllToCart: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

interface WishlistProviderProps {
  children: ReactNode;
}

export const WishlistProvider: React.FC<WishlistProviderProps> = ({ children }) => {
  const [wishlistItems, setWishlistItems] = useState<string[]>([]);
  const [wishlistData, setWishlistData] = useState<WishlistItem[]>([]);
  const [summary, setSummary] = useState<WishlistSummary | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedWishlist = localStorage.getItem('lootamo-wishlist');
    if (savedWishlist) {
      try {
        setWishlistItems(JSON.parse(savedWishlist));
      } catch (error) {
        console.error('Error loading wishlist from localStorage:', error);
      }
    }
    refreshWishlist();
  }, []);

  useEffect(() => {
    localStorage.setItem('lootamo-wishlist', JSON.stringify(wishlistItems));
  }, [wishlistItems]);

  const refreshWishlist = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      setLoading(true);
      const [wishlistResponse, summaryResponse] = await Promise.all([
        wishlistService.getWishlist(0, 100),
        wishlistService.getWishlistSummary()
      ]);

      setWishlistData(wishlistResponse.items);
      setSummary(summaryResponse);
      
      const productIds = wishlistResponse.items.map(item => item.product_id);
      setWishlistItems(productIds);
    } catch (error) {
      console.error('Error refreshing wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToWishlist = async (productId: string) => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        toast.error('Please sign in to add items to wishlist');
        return;
      }

      setWishlistItems(prev => {
        if (!prev.includes(productId)) {
          return [...prev, productId];
        }
        return prev;
      });

      const response = await wishlistService.addToWishlist(productId);
      
      if (response.success) {
        if (response.already_exists) {
          toast.success('Item already in wishlist');
        } else {
          toast.success('Added to wishlist');
        }
        await refreshWishlist();
      } else {
        setWishlistItems(prev => prev.filter(id => id !== productId));
        toast.error(response.message || 'Failed to add to wishlist');
      }
    } catch (error) {
      setWishlistItems(prev => prev.filter(id => id !== productId));
      console.error('Error adding to wishlist:', error);
      toast.error('Failed to add to wishlist');
    }
  };

  const removeFromWishlist = async (productId: string) => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        toast.error('Please sign in to manage wishlist');
        return;
      }

      setWishlistItems(prev => prev.filter(id => id !== productId));

      const response = await wishlistService.removeFromWishlist(productId);
      
      if (response.success) {
        toast.success('Removed from wishlist');
        await refreshWishlist();
      } else {
        setWishlistItems(prev => [...prev, productId]);
        toast.error(response.message || 'Failed to remove from wishlist');
      }
    } catch (error) {
      setWishlistItems(prev => [...prev, productId]);
      console.error('Error removing from wishlist:', error);
      toast.error('Failed to remove from wishlist');
    }
  };

  const isInWishlist = (productId: string) => {
    return wishlistItems.includes(productId);
  };

  const toggleWishlist = async (productId: string) => {
    if (isInWishlist(productId)) {
      await removeFromWishlist(productId);
    } else {
      await addToWishlist(productId);
    }
  };

  const clearWishlist = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        toast.error('Please sign in to manage wishlist');
        return;
      }

      const response = await wishlistService.clearWishlist();
      
      if (response.success) {
        setWishlistItems([]);
        setWishlistData([]);
        setSummary({ total_items: 0, total_estimated_value: 0, currency: 'USD' });
        toast.success(`Cleared ${response.cleared_count} items from wishlist`);
      } else {
        toast.error(response.message || 'Failed to clear wishlist');
      }
    } catch (error) {
      console.error('Error clearing wishlist:', error);
      toast.error('Failed to clear wishlist');
    }
  };

  const addAllToCart = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        toast.error('Please sign in to add items to cart');
        return;
      }

      const result = await wishlistService.addAllToCart();
      
      if (result.success) {
        // Show detailed message based on what was added
        if (result.added_count === result.total_items) {
          toast.success(`Successfully added all ${result.added_count} items to cart`);
        } else if (result.added_count > 0) {
          const skippedInCart = result.failed_items.filter(item => item.error === "Item already in cart").length;
          
          if (skippedInCart > 0) {
            toast.success(`Added ${result.added_count} new items to cart. ${skippedInCart} items were already in cart.`);
          } else {
            toast.success(`Added ${result.added_count} of ${result.total_items} items to cart`);
          }
        } else {
          toast("No new items were added to cart");
        }
        
        // Optionally refresh wishlist data to reflect any changes
        await refreshWishlist();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error adding all to cart:', error);
      toast.error('Failed to add items to cart');
    }
  };

  const value: WishlistContextType = {
    wishlistItems,
    wishlistData,
    summary,
    loading,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    toggleWishlist,
    refreshWishlist,
    clearWishlist,
    addAllToCart,
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
