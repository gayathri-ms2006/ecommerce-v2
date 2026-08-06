import { apiRequest } from './api';

const ADMIN_STORAGE_KEY = 'admin-portal-state-v1';

const createSeedState = () => ({
  products: [],
  orders: [],
  users: [],
});

const readState = () => {
  try {
    const raw = localStorage.getItem(ADMIN_STORAGE_KEY);
    if (!raw) {
      const seed = createSeedState();
      localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(seed));
      return seed;
    }
    return JSON.parse(raw);
  } catch (error) {
    console.error('Failed to read admin portal state:', error);
    return createSeedState();
  }
};

const writeState = (state) => {
  localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(state));
};

const normalizeProduct = (product, index) => ({
  id: product.id || product.productId || `prod-${index + 1}`,
  productId: product.productId || product.id || `prod-${index + 1}`,
  productName: product.productName || product.name || 'Untitled Product',
  description: product.description || '',
  category: product.category || 'General',
  price: Number(product.price || 0),
  discount: Number(product.discount || 0),
  stockQuantity: Number(product.stockQuantity ?? product.stock ?? 0),
  imageUrl: product.imageUrl || '',
  status: product.status || (Number(product.stockQuantity ?? product.stock ?? 0) > 0 ? 'Active' : 'Out of Stock'),
  sku: product.sku || `SKU-${String(index + 1).padStart(3, '0')}`,
});

const normalizeOrder = (order, index) => {
  const customerName = order.customerName || (order.customerEmail ? order.customerEmail.split('@')[0] : '') || (order.email ? order.email.split('@')[0] : '') || 'Customer';
  const email = order.customerEmail || order.email || '';

  return {
    id: order.id || order.orderId || `ord-${index + 1}`,
    orderId: order.orderId || order.id || `ord-${index + 1}`,
    customerName,
    email,
    totalAmount: Number(order.totalAmount || order.price || 0),
    status: order.status || 'Pending',
    createdAt: order.createdAt || new Date().toISOString().split('T')[0],
    userId: order.userId || '',
    items: order.items || [],
  };
};

export const fetchAdminProducts = async () => {
  try {
    const response = await apiRequest('/products', {}, false);
    const payload = Array.isArray(response) ? response : response?.items || response?.data || [];
    
    let inventoriesList = [];
    try {
      const inventoryRes = await apiRequest('/inventory', {}, false);
      inventoriesList = Array.isArray(inventoryRes)
        ? inventoryRes
        : inventoryRes?.items || inventoryRes?.data || [];
    } catch (invErr) {
      console.warn('Failed to fetch inventory from backend:', invErr.message);
    }

    if (payload.length) {
      const nextProducts = payload.map((product, index) => {
        const prodId = product.productId || product.id;
        const matchingInventory = inventoriesList.find(
          (inv) => String(inv.productId) === String(prodId)
        );

        const stock = matchingInventory 
          ? (matchingInventory.availableStock !== undefined 
              ? matchingInventory.availableStock 
              : (matchingInventory.stockQuantity !== undefined 
                  ? matchingInventory.stockQuantity 
                  : (matchingInventory.stock !== undefined 
                      ? matchingInventory.stock 
                      : (matchingInventory.quantity !== undefined ? matchingInventory.quantity : 0))))
          : 0;

        return normalizeProduct({
          ...product,
          stockQuantity: stock,
          status: stock > 0 ? 'Active' : 'Out of Stock'
        }, index);
      });

      const state = readState();
      state.products = nextProducts;
      writeState(state);
      return nextProducts;
    }
  } catch (error) {
    console.warn('Falling back to local admin product data:', error.message);
  }

  const state = readState();
  return state.products.map(normalizeProduct);
};

export const createAdminProduct = async (productData) => {
  const state = readState();
  
  // Format body specifically for POST /products database validator
  const payload = {
    name: productData.productName || productData.name || 'Untitled Product',
    description: productData.description || 'No description provided',
    price: Number(productData.price || 0),
    category: productData.category || 'General',
    imageUrl: productData.imageUrl || '',
  };

  const response = await apiRequest('/products', { method: 'POST', body: JSON.stringify(payload) }, true);
  
  // Extract generated UUID/ID from the backend response
  const apiProduct = response?.data || response;
  const createdProductId = apiProduct?.productId || apiProduct?.id || `prod-${Date.now()}`;

  const nextProduct = normalizeProduct({
    ...productData,
    ...apiProduct,
    id: createdProductId,
    productId: createdProductId,
  }, state.products.length);

  await apiRequest(`/inventory/${createdProductId}`, {
    method: 'PUT',
    body: JSON.stringify({ availableStock: Number(nextProduct.stockQuantity || 0) })
  }, true);

  state.products = [nextProduct, ...state.products];
  writeState(state);

  return nextProduct;
};

export const updateAdminProduct = async (productId, updates) => {
  const state = readState();
  const index = state.products.findIndex((item) => item.id === productId || item.productId === productId);

  if (index === -1) {
    throw new Error('Product not found');
  }

  const updated = normalizeProduct({ ...state.products[index], ...updates, id: state.products[index].id, productId: state.products[index].productId }, index);

  // Format body specifically for PUT /products/:productId database validator
  const payload = {
    name: updated.productName || updated.name,
    description: updated.description || 'No description provided',
    price: Number(updated.price || 0),
    category: updated.category || 'General',
    imageUrl: updated.imageUrl || '',
  };

  await apiRequest(`/products/${productId}`, { method: 'PUT', body: JSON.stringify(payload) }, true);
  if (updates.stockQuantity !== undefined) {
    await apiRequest(`/inventory/${updated.productId}`, {
      method: 'PUT',
      body: JSON.stringify({ availableStock: Number(updates.stockQuantity || 0) })
    }, true);
  }

  state.products[index] = updated;
  writeState(state);

  return updated;
};

export const deleteAdminProduct = async (productId) => {
  await apiRequest(`/products/${productId}`, { method: 'DELETE' }, true);

  const state = readState();
  state.products = state.products.filter((item) => item.id !== productId && item.productId !== productId);
  writeState(state);
};

export const fetchAdminInventory = async () => {
  const products = await fetchAdminProducts();
  return products.map((product) => ({
    ...product,
    stockStatus: product.stockQuantity === 0 ? 'Out Of Stock' : product.stockQuantity <= 10 ? 'Low Stock' : 'In Stock',
  }));
};

export const updateAdminInventory = async (productId, quantity) => {
  const state = readState();
  const index = state.products.findIndex((item) => item.id === productId || item.productId === productId);

  if (index === -1) {
    throw new Error('Product not found');
  }

  const nextQuantity = Math.max(0, Number(quantity));

  await apiRequest(`/inventory/${productId}`, { method: 'PUT', body: JSON.stringify({ availableStock: nextQuantity }) }, true);

  state.products[index] = normalizeProduct({ ...state.products[index], stockQuantity: nextQuantity, status: nextQuantity > 0 ? 'Active' : 'Out of Stock' }, index);
  writeState(state);

  return state.products[index];
};

export const fetchAdminOrders = async () => {
  try {
    const response = await apiRequest('/orders', {}, true);
    const payload = Array.isArray(response) ? response : response?.items || response?.data || [];
    if (payload.length) {
      const nextOrders = payload.map((order, index) => normalizeOrder(order, index));
      const state = readState();
      state.orders = nextOrders;
      writeState(state);
      return nextOrders;
    }
  } catch (error) {
    console.warn('Falling back to local admin order data:', error.message);
  }

  const state = readState();
  return state.orders.map(normalizeOrder);
};

export const updateAdminOrderStatus = async (orderId, status) => {
  const state = readState();
  const index = state.orders.findIndex((item) => item.id === orderId || item.orderId === orderId);

  if (index === -1) {
    throw new Error('Order not found');
  }

  await apiRequest(`/orders/${orderId}`, { method: 'PATCH', body: JSON.stringify({ status }) }, true);

  state.orders[index] = normalizeOrder({ ...state.orders[index], status }, index);
  writeState(state);

  return state.orders[index];
};

export const fetchAdminUsers = async () => {
  try {
    const orders = await fetchAdminOrders();
    const customerMap = {};

    orders.forEach((order) => {
      const uId = order.userId || 'unknown-user';
      if (!customerMap[uId]) {
        customerMap[uId] = {
          id: uId,
          name: order.customerName || 'Customer',
          email: order.email || '',
          totalOrders: 0,
          totalSpend: 0,
          registeredAt: order.createdAt,
          lastPurchaseAt: order.createdAt,
        };
      }

      const c = customerMap[uId];
      c.totalOrders += 1;
      c.totalSpend += Number(order.totalAmount || 0);

      if (order.customerName && order.customerName !== 'Customer') {
        c.name = order.customerName;
      }
      if (order.email && c.email === '') {
        c.email = order.email;
      }

      if (new Date(order.createdAt) < new Date(c.registeredAt)) {
        c.registeredAt = order.createdAt;
      }
      if (new Date(order.createdAt) > new Date(c.lastPurchaseAt)) {
        c.lastPurchaseAt = order.createdAt;
      }
    });

    return Object.values(customerMap).map((c) => ({
      ...c,
      averageOrderValue: c.totalOrders > 0 ? c.totalSpend / c.totalOrders : 0,
    }));
  } catch (error) {
    console.error('Failed to aggregate users from orders:', error);
    return [];
  }
};

/**
 * Empty dashboard metrics shell. Dashboard calculations are computed dynamically
 * inside the frontend components based on timeline filters.
 */
export const fetchAdminDashboardMetrics = async () => {
  const products = await fetchAdminProducts();
  const orders = await fetchAdminOrders();
  const users = await fetchAdminUsers();

  return {
    products,
    orders,
    users
  };
};

export const fetchAdminAnalytics = async () => {
  const products = await fetchAdminProducts();
  const orders = await fetchAdminOrders();
  const users = await fetchAdminUsers();

  return {
    products,
    orders,
    users
  };
};
