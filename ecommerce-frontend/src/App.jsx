import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate
} from 'react-router-dom';

import Login from './pages/Login';
import Signup from './pages/Signup';
import Products from './pages/Products';
import ProductDetails from './pages/ProductDetails';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import TrackOrder from './pages/TrackOrder';
import Wishlist from './pages/Wishlist';

import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminInventory from './pages/admin/AdminInventory';
import AdminOrders from './pages/admin/AdminOrders';
import AdminCustomers from './pages/admin/AdminCustomers';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import AdminSettings from './pages/admin/AdminSettings';

import ProtectedRoute from './components/ProtectedRoute';

import {
  isAuthenticated,
  isAdmin
} from './services/auth';

import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';

/* Redirect authenticated users away from login page */
const LoginRoute = () => {
  return isAuthenticated()
    ? <Navigate to="/products" replace />
    : <Login />;
};

/* Redirect authenticated users away from signup page */
const SignupRoute = () => {
  return isAuthenticated()
    ? <Navigate to="/products" replace />
    : <Signup />;
};

/* Admin Route Protection */
const AdminProtectedRoute = ({ children }) => {

  if (!isAuthenticated()) {
    return <Navigate to="/admin/login" replace />;
  }

  if (!isAdmin()) {
    return <Navigate to="/products" replace />;
  }

  return children;
};

/* Root redirect */
const RootRedirect = () => {
  return isAuthenticated()
    ? <Navigate to="/products" replace />
    : <Navigate to="/login" replace />;
};

function App() {
  return (
    <CartProvider>
      <WishlistProvider>
        <Router>
        <Routes>

          {/* Root */}
          <Route
            path="/"
            element={<RootRedirect />}
          />

          {/* Customer Auth */}
          <Route
            path="/login"
            element={<LoginRoute />}
          />
          <Route
            path="/signup"
            element={<SignupRoute />}
          />

          {/* Admin Login */}
          <Route
            path="/admin/login"
            element={<AdminLogin />}
          />

          {/* Admin Protected Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <AdminProtectedRoute>
                <AdminDashboard />
              </AdminProtectedRoute>
            }
          />

          <Route
            path="/admin/products"
            element={
              <AdminProtectedRoute>
                <AdminProducts />
              </AdminProtectedRoute>
            }
          />

          <Route
            path="/admin/inventory"
            element={
              <AdminProtectedRoute>
                <AdminInventory />
              </AdminProtectedRoute>
            }
          />

          <Route
            path="/admin/orders"
            element={
              <AdminProtectedRoute>
                <AdminOrders />
              </AdminProtectedRoute>
            }
          />

          <Route
            path="/admin/customers"
            element={
              <AdminProtectedRoute>
                <AdminCustomers />
              </AdminProtectedRoute>
            }
          />

          <Route
            path="/admin/analytics"
            element={
              <AdminProtectedRoute>
                <AdminAnalytics />
              </AdminProtectedRoute>
            }
          />

          <Route
            path="/admin/settings"
            element={
              <AdminProtectedRoute>
                <AdminSettings />
              </AdminProtectedRoute>
            }
          />

          {/* Public Products */}
          <Route
            path="/products"
            element={
              <ProtectedRoute>
                <Products />
              </ProtectedRoute>
            }
          />

          {/* Product Details */}
          <Route
            path="/product/:productId"
            element={
              <ProtectedRoute>
                <ProductDetails />
              </ProtectedRoute>
            }
          />

          {/* Cart */}
          <Route
            path="/cart"
            element={
              <ProtectedRoute>
                <Cart />
              </ProtectedRoute>
            }
          />

          {/* Wishlist */}
          <Route
            path="/wishlist"
            element={
              <ProtectedRoute>
                <Wishlist />
              </ProtectedRoute>
            }
          />

          {/* Orders */}
          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <Orders />
              </ProtectedRoute>
            }
          />

          {/* Checkout */}
          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <Checkout />
              </ProtectedRoute>
            }
          />

          {/* Tracking */}
          <Route
            path="/track-order"
            element={
              <ProtectedRoute>
                <TrackOrder />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route
            path="*"
            element={<Navigate to="/" replace />}
          />

        </Routes>
      </Router>
      </WishlistProvider>
    </CartProvider>
  );
}

export default App;