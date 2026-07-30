import { apiRequest } from './api';
import { getUserId } from './auth';

/**
 * Add product to wishlist
 */
export const addToWishlist = async (product) => {
  try {
    const body = {
      userId: getUserId(),
      productId: product.productId || product.id,
      productName: product.name || product.productName,
      price: product.price,
      imageUrl: product.imageUrl || '',
      addedAt: new Date().toISOString().split('T')[0],
    };

    return await apiRequest(
      '/wishlist',
      {
        method: 'POST',
        body: JSON.stringify(body),
      },
      true
    );
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    throw error;
  }
};

/**
 * Get wishlist items
 */
export const getWishlist = async () => {
  try {
    const userId = getUserId();

    return await apiRequest(
      `/wishlist?userId=${userId}`,
      {
        method: 'GET',
      },
      true
    );
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    throw error;
  }
};

/**
 * Remove wishlist item
 */
export const removeFromWishlist = async (productId) => {
  try {
    const userId = getUserId();

    return await apiRequest(
      `/wishlist/${productId}?userId=${userId}`,
      {
        method: 'DELETE',
      },
      true
    );
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    throw error;
  }
};

/**
 * Check whether product exists in wishlist
 */
export const checkWishlist = async (productId) => {
  try {
    const userId = getUserId();

    return await apiRequest(
      `/wishlist/check/${productId}?userId=${userId}`,
      {
        method: 'GET',
      },
      true
    );
  } catch (error) {
    console.error('Error checking wishlist:', error);
    throw error;
  }
};

/**
 * Wishlist count
 */
export const getWishlistCount = async () => {
  try {
    const result = await getWishlist();

    if (!result) return 0;

    if (Array.isArray(result)) {
      return result.length;
    }

    if (result.data && Array.isArray(result.data)) {
      return result.data.length;
    }

    if (result.items && Array.isArray(result.items)) {
      return result.items.length;
    }

    if (result.data?.items && Array.isArray(result.data.items)) {
      return result.data.items.length;
    }

    return 0;
  } catch (error) {
    console.error('Error getting wishlist count:', error);
    return 0;
  }
};