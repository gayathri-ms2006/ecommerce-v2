import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { createOrder } from '../services/orders';
import { isAuthenticated, getName, getEmail } from '../services/auth';
import Navbar from '../components/Navbar';
import '../styles/Checkout.css';

const Checkout = () => {
  const navigate = useNavigate();
  const { cartItems, clearCart, refreshCart } = useCart();
  
  // Checkout Form States
  const [paymentMethod, setPaymentMethod] = useState('CREDIT_CARD');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderSuccessData, setOrderSuccessData] = useState(null);
  const [checkoutError, setCheckoutError] = useState('');

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
    } else {
      refreshCart();
    }
  }, [navigate, refreshCart]);

  // Pricing math calculations
  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * (item.quantity || 1)), 0);
  const shipping = 0;
  const tax = Math.floor(subtotal * 0.05);
  const total = subtotal + shipping + tax;

  // Indian Rupee currency formatter
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price || 0);
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      setCheckoutError('Your cart is empty. Add products before placing an order.');
      return;
    }

    try {
      setIsPlacingOrder(true);
      setCheckoutError('');

      // Map cart products exactly to backend payload spec:
      // products: [{ productId, productName, price, quantity }]
      const mappedProducts = cartItems.map(item => ({
        productId: item.productId,
        productName: item.productName || 'E-Shop Product',
        price: item.price,
        quantity: item.quantity || 1
      }));

      const payload = {
        products: mappedProducts,
        paymentMethod: paymentMethod,
        customerName: getName() || 'Guest User',
        customerEmail: getEmail() || 'guest@example.com'
      };

      const result = await createOrder(payload);

      if (result && result.success) {
        const orderDate = new Date();
        const expectedDelivery = new Date(orderDate.getTime() + 1000 * 60 * 60 * 24 * 5);

        setOrderSuccessData({
          orderId: result.orderId || `ORD-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
          totalAmount: total,
          itemsPurchased: cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0),
          orderDate,
          expectedDelivery,
          paymentMethod
        });
        clearCart();
      } else {
        throw new Error(result?.message || 'Failed to place order.');
      }
    } catch (err) {
      console.error('Error placing order:', err);
      setCheckoutError(err.message || 'An error occurred while creating your order. Please try again.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  // If order is successfully placed, render Order Success Confirmation screen
  if (orderSuccessData) {
    return (
      <div className="checkout-page-wrapper">
        <Navbar />
        <main className="success-container">
          <div className="success-card">
            <div className="success-icon-badge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="checkmark-icon">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>

            <h1 className="success-title">✅ Order Placed Successfully</h1>
            <p className="success-subtitle">Your order has been confirmed and is now being prepared for dispatch.</p>

            <div className="order-receipt-box">
              <div className="receipt-row">
                <span className="receipt-label">Order ID</span>
                <span className="receipt-value order-id-hl">{orderSuccessData.orderId}</span>
              </div>
              <div className="receipt-row">
                <span className="receipt-label">Date</span>
                <span className="receipt-value">{new Date(orderSuccessData.orderDate).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</span>
              </div>
              <div className="receipt-row">
                <span className="receipt-label">Items Purchased</span>
                <span className="receipt-value">{orderSuccessData.itemsPurchased}</span>
              </div>
              <div className="receipt-row">
                <span className="receipt-label">Payment Method</span>
                <span className="receipt-value">{orderSuccessData.paymentMethod.replace(/_/g, ' ')}</span>
              </div>
              <div className="receipt-row">
                <span className="receipt-label">Expected Delivery Date</span>
                <span className="receipt-value">{new Date(orderSuccessData.expectedDelivery).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</span>
              </div>
              <div className="receipt-row">
                <span className="receipt-label">Amount Paid</span>
                <span className="receipt-value">{formatPrice(orderSuccessData.totalAmount)}</span>
              </div>
            </div>

            <div className="success-action-group">
              <Link to="/products" className="continue-catalog-link">
                Continue Shopping
              </Link>
              <Link to="/orders" className="view-orders-link">
                View Orders
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="checkout-page-wrapper">
      <Navbar />

      <main className="checkout-content-container">
        <header className="checkout-header">
          <h1 className="checkout-page-title">Secure Checkout</h1>
          <p className="checkout-page-subtitle">Verify your order details and choose your payment method.</p>
        </header>

        {checkoutError && (
          <div className="checkout-error-banner" role="alert">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="alert-icon">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{checkoutError}</span>
          </div>
        )}

        {cartItems.length === 0 ? (
          <div className="checkout-empty-state">
            <h2>No items to checkout</h2>
            <p>Your shopping cart is empty. Please add some products before checking out.</p>
            <Link to="/products" className="cart-empty-back-btn">
              Go To Products
            </Link>
          </div>
        ) : (
          <div className="checkout-layout-grid">
            
            {/* Left Column: Order Items Review list */}
            <div className="checkout-left-column">
              <div className="checkout-card">
                <h2 className="card-section-title">Review Items</h2>
                <div className="checkout-item-list">
                  {cartItems.map((item) => (
                    <div key={item.productId} className="checkout-item-row">
                      <div className="checkout-item-info">
                        <span className="checkout-item-name">{item.productName || 'E-Shop Product'}</span>
                        <span className="checkout-item-quantity">Qty: {item.quantity || 1}</span>
                      </div>
                      <span className="checkout-item-price">
                        {formatPrice(item.price * (item.quantity || 1))}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Order Summary Calculations & Payment Submission */}
            <div className="checkout-right-column">
              <div className="checkout-summary-card">
                <h2 className="card-section-title">Order Summary</h2>
                
                <div className="summary-billing-rows">
                  <div className="billing-row">
                    <span>Subtotal</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="billing-row">
                    <span>Shipping</span>
                    <span className="shipping-free">Free</span>
                  </div>
                  <div className="billing-row">
                    <span>Estimated Tax (5%)</span>
                    <span>{formatPrice(tax)}</span>
                  </div>
                  
                  <div className="billing-divider" />
                  
                  <div className="billing-row total-row">
                    <span>Grand Total</span>
                    <span className="grand-total-amount">{formatPrice(total)}</span>
                  </div>
                </div>

                <form onSubmit={handlePlaceOrder} className="checkout-form">
                  <div className="form-group">
                    <label htmlFor="payment-dropdown" className="payment-label">
                      Select Payment Method
                    </label>
                    <select
                      id="payment-dropdown"
                      className="payment-select-dropdown"
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      disabled={isPlacingOrder}
                    >
                      <option value="CREDIT_CARD">Credit / Debit Card</option>
                      <option value="UPI">UPI / Net Banking</option>
                      <option value="CASH_ON_DELIVERY">Cash On Delivery (COD)</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="place-order-submit-btn"
                    disabled={isPlacingOrder}
                  >
                    {isPlacingOrder ? (
                      <>
                        <div className="checkout-spinner" />
                        <span>Processing Order...</span>
                      </>
                    ) : (
                      <span>Place Order</span>
                    )}
                  </button>
                </form>

                <p className="checkout-security-notice">
                  🔒 Your transaction is secured with industry-grade SSL encryption.
                </p>
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
};

export default Checkout;
