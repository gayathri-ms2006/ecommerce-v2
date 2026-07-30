import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { isAuthenticated } from '../services/auth';
import Navbar from '../components/Navbar';
import QuantitySelector from '../components/QuantitySelector';
import '../styles/Cart.css';

const ProductImageFallback = () => (
  <div className="cart-item-image-placeholder">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="fallback-box-icon">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
    </svg>
  </div>
);

const CartSkeleton = () => (
  <div className="cart-layout-grid">
    <div className="cart-left-column">
      {Array.from({ length: 3 }).map((_, idx) => (
        <div key={idx} className="skeleton-cart-card">
          <div className="skeleton-cart-image loading-shimmer" />
          <div className="skeleton-cart-info">
            <div className="skeleton-cart-title loading-shimmer" />
            <div className="skeleton-cart-price loading-shimmer" />
            <div className="skeleton-cart-meta loading-shimmer" />
          </div>
        </div>
      ))}
    </div>
    <div className="cart-right-column">
      <div className="skeleton-summary-card">
        <div className="skeleton-summary-row loading-shimmer" />
        <div className="skeleton-summary-row loading-shimmer" />
        <div className="skeleton-summary-row loading-shimmer" />
        <div className="skeleton-summary-divider" />
        <div className="skeleton-summary-row loading-shimmer" style={{ width: '80%' }} />
        <div className="skeleton-summary-btn loading-shimmer" />
      </div>
    </div>
  </div>
);

const Cart = () => {
  const navigate = useNavigate();
  const { cartItems, loading, error, refreshCart, removeItemFromCart, updateItemQuantity } = useCart();
  const [removingId, setRemovingId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [toast, setToast] = useState({ message: '', type: '' });

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
    } else {
      refreshCart();
    }
  }, [navigate, refreshCart]);

  const formatPrice = (price) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price || 0);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    window.setTimeout(() => setToast({ message: '', type: '' }), 3000);
  };

  const handleRemoveItem = async (productId, productName) => {
    try {
      setRemovingId(productId);
      await removeItemFromCart(productId);
      showToast(`Removed ${productName} from cart successfully.`, 'success');
    } catch (err) {
      console.error('Failed to delete item from cart:', err);
      showToast('Failed to remove item. Please try again.', 'error');
    } finally {
      setRemovingId(null);
    }
  };

  const handleQuantityChange = async (productId, productName, quantity) => {
    try {
      setUpdatingId(productId);
      await updateItemQuantity(productId, quantity);
      showToast(`Updated ${productName} quantity to ${quantity}.`, 'success');
    } catch (err) {
      console.error('Failed to update cart quantity:', err);
      showToast('Failed to update quantity. Please try again.', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * (item.quantity || 1)), 0);
  const shipping = 0;
  const tax = Math.floor(subtotal * 0.05);
  const total = subtotal + shipping + tax;

  return (
    <div className="cart-page-wrapper">
      <Navbar />

      {toast.message && (
        <div className={`toast-notification-banner toast-${toast.type}`}>
          <span>{toast.message}</span>
        </div>
      )}

      <main className="cart-content-container">
        <header className="cart-header">
          <h1 className="cart-page-title">Shopping Cart</h1>
          <p className="cart-page-subtitle">Manage your item selections before checkout.</p>
        </header>

        {loading && cartItems.length === 0 && <CartSkeleton />}

        {error && !loading && cartItems.length === 0 && (
          <div className="cart-error-container">
            <div className="cart-error-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h2>Failed to load cart</h2>
            <p className="error-message-text">{error}</p>
            <button className="cart-retry-btn" onClick={refreshCart}>
              <span>Reload Cart</span>
            </button>
          </div>
        )}

        {!loading && cartItems.length === 0 && (
          <div className="cart-empty-container">
            <div className="cart-empty-icon">🛒</div>
            <h2>Your cart is empty</h2>
            <p>Looks like you haven't added anything to your cart yet.</p>
            <Link to="/products" className="continue-shopping-btn">
              Continue Shopping
            </Link>
          </div>
        )}

        {cartItems.length > 0 && (
          <div className="cart-layout-grid">
            <div className="cart-left-column">
              <div className="cart-items-card-list">
                {cartItems.map((item) => {
                  const itemQuantity = item.quantity || 1;
                  const itemPrice = item.price || 0;
                  const itemSubtotal = itemPrice * itemQuantity;

                  return (
                    <article key={item.productId} className="cart-item-card">
                      <div className="cart-item-image-wrapper">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.productName}
                            className="cart-item-image"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div style={{ display: item.imageUrl ? 'none' : 'flex', width: '100%', height: '100%' }}>
                          <ProductImageFallback />
                        </div>
                      </div>

                      <div className="cart-item-details">
                        <div className="cart-item-main-row">
                          <h3 className="cart-item-name">{item.productName || 'E-Shop Product'}</h3>
                          <div className="cart-item-price-col">
                            <span className="cart-item-subtotal-price">{formatPrice(itemSubtotal)}</span>
                            <span className="cart-item-unit-price">Unit: {formatPrice(itemPrice)}</span>
                          </div>
                        </div>

                        <div className="cart-item-meta-row">
                          <span className="cart-item-stock-tag">In Stock & Ready to Ship</span>
                        </div>

                        <div className="cart-item-actions-row">
                          <QuantitySelector
                            value={itemQuantity}
                            onChange={(value) => handleQuantityChange(item.productId, item.productName, value)}
                            onRemove={() => handleRemoveItem(item.productId, item.productName)}
                            min={1}
                            max={10}
                            disabled={updatingId === item.productId || removingId === item.productId}
                            showRemoveIcon
                          />
                          <div className="cart-item-actions-divider" />
                          <button
                            className="cart-remove-item-btn"
                            onClick={() => handleRemoveItem(item.productId, item.productName)}
                            disabled={removingId === item.productId}
                            aria-label={`Remove ${item.productName} from cart`}
                          >
                            {removingId === item.productId ? 'Removing...' : 'Remove'}
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>

            <div className="cart-right-column">
              <div className="cart-order-summary-card">
                <h2 className="summary-title">Order Summary</h2>

                <div className="summary-details-list">
                  <div className="summary-row">
                    <span className="row-label">Subtotal</span>
                    <span className="row-value">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="summary-row">
                    <span className="row-label">Shipping</span>
                    <span className="row-value shipping-free">Free</span>
                  </div>
                  <div className="summary-row">
                    <span className="row-label">Estimated Tax (5%)</span>
                    <span className="row-value">{formatPrice(tax)}</span>
                  </div>
                </div>

                <div className="summary-total-divider" />

                <div className="summary-total-row">
                  <span className="total-label">Grand Total</span>
                  <span className="total-value">{formatPrice(total)}</span>
                </div>

                <div className="summary-action-stack">
                  <Link to="/products" className="continue-shopping-btn muted-outline-btn">
                    Continue Shopping
                  </Link>
                  <button className="proceed-checkout-btn" onClick={() => navigate('/checkout')}>
                    Checkout
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Cart;
