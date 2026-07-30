import { apiRequest } from './api';
import { getUserId } from './auth';

/**
 * Create Order
 */
export const createOrder = async (orderData) => {
  try {
    const userId = getUserId();

    const body = {
      userId,
      products: orderData.products,
      paymentMethod: orderData.paymentMethod,
      customerName: orderData.customerName,
      customerEmail: orderData.customerEmail,
    };

    return await apiRequest('/orders', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
};

/**
 * Get Orders for Current Logged-In User
 */
export const getUserOrders = async () => {
  try {
    const userId = getUserId();

    return await apiRequest(
      `/orders?userId=${encodeURIComponent(userId)}`
    );
  } catch (error) {
    console.error('Error fetching user orders:', error);
    throw error;
  }
};

/**
 * Get Single Order
 */
export const getOrder = async (orderId) => {
  try {
    return await apiRequest(
      `/orders/${orderId}`
    );
  } catch (error) {
    console.error('Error fetching order:', error);
    throw error;
  }
};

/**
 * Cancel Order
 */
export const cancelOrder = async (orderId) => {
  try {
    return await apiRequest('/orders/cancel', {
      method: 'POST',
      body: JSON.stringify({
        orderId,
      }),
    });
  } catch (error) {
    console.error('Error cancelling order:', error);
    throw error;
  }
};

/**
 * Track Order
 */
export const trackOrder = async (orderId) => {
  try {
    return await apiRequest('/orders/track', {
      method: 'POST',
      body: JSON.stringify({
        orderId,
      }),
    });
  } catch (error) {
    console.error('Error tracking order:', error);
    throw error;
  }
};