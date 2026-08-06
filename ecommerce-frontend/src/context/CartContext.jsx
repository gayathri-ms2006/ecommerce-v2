import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getCartItems, addToCart, removeFromCart as deleteFromCart, updateCartQuantity, clearCart as apiClearCart } from '../services/cart';
import { isAuthenticated } from '../services/auth';

const CartContext = createContext(null);

const normalizeQuantity = (value) => {
  const parsed = Number(value || 1);
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  return Math.min(10, parsed);
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Parse items from various possible response formats (resilience)
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

  const refreshCart = useCallback(async () => {
    if (!isAuthenticated()) {
      setCartItems([]);
      setCartCount(0);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await getCartItems();
      const items = extractItems(res);
      setCartItems(items);
    } catch (err) {
      console.error('Failed to refresh cart:', err);
      setError(err.message || 'Failed to sync cart data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const count = cartItems.reduce((sum, item) => sum + normalizeQuantity(item.quantity || 1), 0);
    setCartCount(count);
  }, [cartItems]);

  const addItemToCart = async (product, quantity = 1) => {
    const nextQuantity = normalizeQuantity(quantity);

    try {
      setError(null);
      await addToCart(product, nextQuantity);
      await refreshCart();
    } catch (err) {
      console.error('Error adding to cart:', err);
      throw err;
    }
  };

  const updateItemQuantity = async (productId, quantity) => {
    const nextQuantity = normalizeQuantity(quantity);

    try {
      setError(null);
      await updateCartQuantity(productId, nextQuantity);
      await refreshCart();
    } catch (err) {
      console.error('Error updating cart item:', err);
      await refreshCart();
      throw err;
    }
  };

  const removeItemFromCart = async (productId) => {
    try {
      setError(null);
      await deleteFromCart(productId);
      await refreshCart();
    } catch (err) {
      console.error('Error removing from cart:', err);
      await refreshCart();
      throw err;
    }
  };

  const clearCart = useCallback(async () => {
    try {
      setError(null);
      await apiClearCart();
      setCartItems([]);
      setCartCount(0);
    } catch (err) {
      console.error('Error clearing cart:', err);
      setError(err.message || 'Failed to clear cart.');
      throw err;
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated()) {
      refreshCart();
    }
  }, [refreshCart]);

  return (
    <CartContext.Provider value={{
      cartItems,
      cartCount,
      loading,
      error,
      refreshCart,
      addItemToCart,
      updateItemQuantity,
      removeItemFromCart,
      clearCart
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
