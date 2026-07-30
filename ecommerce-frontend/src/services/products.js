import { apiRequest } from './api';

/**
 * Fetch all products from the catalog.
 * 
 * @returns {Promise<Object>} Catalog response
 */
export const fetchProductsList = async () => {
  try {
    return await apiRequest('/products', {}, false);
  } catch (error) {
    console.error('Error fetching products list:', error);
    throw error;
  }
};
