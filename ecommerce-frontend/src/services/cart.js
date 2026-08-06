import { apiRequest } from './api';
import { getUserId } from './auth';

/**
 * Fetch cart items
 */
export const getCartItems = async () => {
  try {
    const userId = getUserId();

    return await apiRequest(
      `/cart/${userId}`,
      {
        method: 'GET',
      },
      true
    );
  } catch (error) {
    console.error('Error fetching cart items:', error);
    throw error;
  }
};

/**
 * Add product to cart
 */
export const addToCart = async (product, quantity = 1) => {
  try {
    const userId = getUserId();

    const body = {
      userId,
      productId: product.productId || product.id,
      productName: product.productName || product.name,
      price: Number(product.price),
      quantity: Number(quantity) || 1,
      imageUrl:
        product.imageUrl ||
        product.productImage ||
        product.image ||
        ''
    };

    return await apiRequest(
      '/cart',
      {
        method: 'POST',
        body: JSON.stringify(body),
      },
      true
    );
  } catch (error) {
    console.error('Error adding product to cart:', error);
    throw error;
  }
};

/**
 * Remove item from cart
 */
export const removeFromCart = async (productId) => {
  try {
    const userId = getUserId();

    const body = {
      userId,
      productId,
    };

    return await apiRequest(
      '/cart',
      {
        method: 'DELETE',
        body: JSON.stringify(body),
      },
      true
    );
  } catch (error) {
    console.error('Error removing item from cart:', error);
    throw error;
  }
};

/**
 * Update quantity
 */
export const updateCartQuantity = async (
  productId,
  quantity
) => {
  try {
    const userId = getUserId();

    const body = {
      userId,
      productId,
      quantity,
    };

    return await apiRequest(
      '/cart',
      {
        method: 'PUT',
        body: JSON.stringify(body),
      },
      true
    );
  } catch (error) {
    console.error('Error updating cart item:', error);
    throw error;
  }
};

/**
 * Clear all items from cart
 */
export const clearCart = async () => {
  try {
    const userId = getUserId();

    const body = {
      userId,
    };

    return await apiRequest(
      '/cart',
      {
        method: 'DELETE',
        body: JSON.stringify(body),
      },
      true
    );
  } catch (error) {
    console.error('Error clearing cart:', error);
    throw error;
  }
};