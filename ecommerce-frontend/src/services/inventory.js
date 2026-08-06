import { apiRequest } from './api';

/**
 * Get all inventory items
 */
export const fetchInventory = async () => {
  try {
    return await apiRequest(
      '/inventory',
      {
        method: 'GET',
      },
      false
    );
  } catch (error) {
    console.error('Error fetching inventory:', error);
    throw error;
  }
};

/**
 * Get inventory for a specific product
 */
export const fetchProductInventory = async (productId) => {
  try {
    return await apiRequest(
      `/inventory/${productId}`,
      {
        method: 'GET',
      },
      false
    );
  } catch (error) {
    console.error(
      `Error fetching inventory for product ${productId}:`,
      error
    );
    throw error;
  }
};

/**
 * Update stock quantity (Admin)
 */
export const updateInventory = async (
  productId,
  quantity
) => {
  try {
    return await apiRequest(
      `/inventory/${productId}`,
      {
        method: 'PUT',
        body: JSON.stringify({
          availableStock: quantity,
        }),
      },
      false
    );
  } catch (error) {
    console.error(
      `Error updating inventory for product ${productId}:`,
      error
    );
    throw error;
  }
};

/**
 * Reduce stock after order
 */
export const reduceInventory = async (
  productId,
  quantity
) => {
  try {
    return await apiRequest(
      `/inventory/${productId}/reduce`,
      {
        method: 'POST',
        body: JSON.stringify({
          quantity,
        }),
      },
      false
    );
  } catch (error) {
    console.error(
      `Error reducing inventory for product ${productId}:`,
      error
    );
    throw error;
  }
};

/**
 * Check availability
 */
export const checkAvailability = async (
  productId
) => {
  try {
    return await apiRequest(
      `/inventory/${productId}/availability`,
      {
        method: 'GET',
      },
      false
    );
  } catch (error) {
    console.error(
      `Error checking availability for product ${productId}:`,
      error
    );
    throw error;
  }
};