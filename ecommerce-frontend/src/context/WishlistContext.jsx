import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getWishlist, addToWishlist, removeFromWishlist as deleteFromWishlist } from '../services/wishlist';
import { isAuthenticated } from '../services/auth';

const WishlistContext = createContext(null);

export const WishlistProvider = ({ children }) => {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const extractItems = (response) => {
    if (!response) return [];
    if (Array.isArray(response)) return response;
    if (response.items && Array.isArray(response.items)) return response.items;
    if (response.data && Array.isArray(response.data)) return response.data;
    if (response.data && response.data.items && Array.isArray(response.data.items)) {
      return response.data.items;
    }
    return [];
  };

  const refreshWishlist = useCallback(async () => {
    if (!isAuthenticated()) {
      setWishlistItems([]);
      setWishlistCount(0);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await getWishlist();
      const items = extractItems(res);
      setWishlistItems(items);
      setWishlistCount(items.length);
    } catch (err) {
      console.error('Failed to refresh wishlist:', err);
      setError(err.message || 'Failed to sync wishlist data.');
    } finally {
      setLoading(false);
    }
  }, []);

  const addWishlist = async (product) => {
    try {
      setError(null);
      await addToWishlist(product);
      await refreshWishlist();
    } catch (err) {
      console.error('Error adding to wishlist:', err);
      throw err;
    }
  };

  const removeWishlist = async (productId) => {
    try {
      setError(null);
      await deleteFromWishlist(productId);
      await refreshWishlist();
    } catch (err) {
      console.error('Error removing from wishlist:', err);
      throw err;
    }
  };

  useEffect(() => {
    if (isAuthenticated()) {
      refreshWishlist();
    }
  }, [refreshWishlist]);

  return (
    <WishlistContext.Provider value={{
      wishlistItems,
      wishlistCount,
      loading,
      error,
      refreshWishlist,
      addWishlist,
      removeWishlist
    }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
