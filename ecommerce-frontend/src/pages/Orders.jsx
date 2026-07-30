import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getUserOrders, cancelOrder } from '../services/orders';
import { isAuthenticated } from '../services/auth';
import Navbar from '../components/Navbar';
import '../styles/Orders.css';

// Horizontal timeline helper for compact display
const OrderTimelineCompact = ({ status }) => {
  const currentStatus = (status || 'PENDING').toUpperCase();

  const stages = [
    { label: 'Order Placed', emoji: '✅' },
    { label: 'Processing', emoji: '⚙️' },
    { label: 'Shipped', emoji: '🚚' },
    { label: 'Out For Delivery', emoji: '📦' },
    { label: 'Delivered', emoji: '🎉' }
  ];

  let activeIndex = 0;
  if (currentStatus === 'PROCESSING') activeIndex = 1;
  else if (currentStatus === 'SHIPPED') activeIndex = 2;
  else if (currentStatus === 'OUT_FOR_DELIVERY') activeIndex = 3;
  else if (currentStatus === 'DELIVERED') activeIndex = 4;

  return (
    <div className="orders-horizontal-timeline">
      {stages.map((stage, idx) => {
        const isCompleted = idx <= activeIndex;
        // Render checkmarks or specific emojis for completed stages
        const displayEmoji = isCompleted ? (idx === 1 ? '✅' : stage.emoji) : '○';
        
        return (
          <div key={idx} className={`timeline-horizontal-step ${isCompleted ? 'completed' : ''}`}>
            <div className="step-icon-circle">
              {displayEmoji}
            </div>
            <span className="step-label-text">{stage.label}</span>
            {idx < stages.length - 1 && (
              <div className="step-connecting-line" />
            )}
          </div>
        );
      })}
    </div>
  );
};

// Skeleton loading layout for order table
const OrdersSkeleton = () => (
  <div className="orders-table-wrapper">
    <div className="skeleton-table-header loading-shimmer" />
    <div className="skeleton-table-row loading-shimmer" />
    <div className="skeleton-table-row loading-shimmer" style={{ animationDelay: '0.2s' }} />
  </div>
);

const Orders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [toast, setToast] = useState({ message: '', type: '' });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    window.setTimeout(() => setToast({ message: '', type: '' }), 3000);
  };

  const handleCancelOrder = async (orderId) => {
    try {
      setCancellingId(orderId);
      await cancelOrder(orderId);

      // Update local state instantly without page refresh
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.orderId === orderId ? { ...order, status: 'CANCELLED' } : order
        )
      );

      showToast('Order cancelled successfully', 'success');
    } catch (err) {
      console.error('Failed to cancel order:', err);
      showToast(err.message || 'Failed to cancel order. Please try again.', 'error');
    } finally {
      setCancellingId(null);
    }
  };

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getUserOrders();

      let ordersList = [];
      if (res) {
        if (Array.isArray(res)) {
          ordersList = res;
        } else if (res.data && Array.isArray(res.data)) {
          ordersList = res.data;
        } else if (res.orders && Array.isArray(res.orders)) {
          ordersList = res.orders;
        }
      }

      ordersList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setOrders(ordersList);
    } catch (err) {
      console.error('Failed to load orders:', err);
      setError(err.message || 'Failed to retrieve orders from the server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
    } else {
      fetchOrders();
    }
  }, [navigate, fetchOrders]);

  const toggleOrderExpand = (orderId) => {
    setExpandedOrderId((prev) => (prev === orderId ? null : orderId));
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price || 0);
  };

  return (
    <div className="orders-page-wrapper">
      <Navbar />

      {toast.message && (
        <div className={`toast-notification-banner toast-${toast.type}`}>
          <span>{toast.message}</span>
        </div>
      )}

      <main className="orders-content-container">
        <header className="orders-header">
          <h1 className="orders-page-title">Your Orders</h1>
          <p className="orders-page-subtitle">Track status and review your previous purchasing logs.</p>
        </header>

        {loading && <OrdersSkeleton />}

        {error && !loading && (
          <div className="orders-error-card">
            <div className="error-icon-box">❌</div>
            <h2>Failed to load orders</h2>
            <p className="error-detail-msg">{error}</p>
            <button className="orders-reload-btn" onClick={fetchOrders}>
              Retry Fetching
            </button>
          </div>
        )}

        {!loading && !error && orders.length === 0 && (
          <div className="orders-empty-card">
            <div className="empty-shopping-bag-icon">📦</div>
            <h2>No orders found</h2>
            <p>You haven't placed any orders yet. Browse our catalog to place your first order!</p>
            <Link to="/products" className="continue-shopping-btn">
              Browse Catalog
            </Link>
          </div>
        )}

        {!loading && !error && orders.length > 0 && (
          <div className="orders-table-wrapper">
            <table className="orders-compact-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Order Date</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                  <th>Payment Method</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const isExpanded = expandedOrderId === order.orderId;
                  const formattedDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  });
                  const status = (order.status || 'PENDING').toUpperCase();
                  const statusClass = status.toLowerCase();

                  return (
                    <React.Fragment key={order.orderId}>
                      <tr className={`order-main-row ${isExpanded ? 'row-active' : ''}`}>
                        <td>
                          <span className="order-id-code">{order.orderId}</span>
                        </td>
                        <td>{formattedDate}</td>
                        <td>
                          <strong className="order-price-val">
                            {formatPrice(order.totalAmount || order.price)}
                          </strong>
                        </td>
                        <td>
                          <span className={`status-badge status-${statusClass}`}>{status}</span>
                        </td>
                        <td>
                          <span className="payment-method-tag">
                            {order.paymentMethod ? order.paymentMethod.replace(/_/g, ' ') : 'CREDIT CARD'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            className="btn-view-details"
                            onClick={() => toggleOrderExpand(order.orderId)}
                          >
                            {isExpanded ? 'Hide Details ▲' : 'View Details ▼'}
                          </button>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr className="order-expanded-row">
                          <td colSpan="6">
                            <div className="expanded-details-container">
                              <div className="expanded-details-grid">
                                
                                {/* Left Section: Purchased Items list */}
                                <div className="expanded-panel items-panel">
                                  <h4 className="panel-title">Purchased Items</h4>
                                  <div className="products-mini-list">
                                    {(order.products || []).map((prod, idx) => (
                                      <div key={prod.productId || idx} className="product-item-mini-row">
                                        <div className="product-mini-details">
                                          <span className="product-mini-name">{prod.productName || 'E-Shop Product'}</span>
                                          <span className="product-mini-qty">Qty: {prod.quantity || 1}</span>
                                        </div>
                                        <span className="product-mini-price">
                                          {formatPrice(prod.price * (prod.quantity || 1))}
                                        </span>
                                      </div>
                                    ))}
                                    {(!order.products || order.products.length === 0) && (
                                      <div className="product-item-mini-row">
                                        <div className="product-mini-details">
                                          <span className="product-mini-name">{order.productName || 'E-Shop Product'}</span>
                                          <span className="product-mini-qty">Qty: 1</span>
                                        </div>
                                        <span className="product-mini-price">{formatPrice(order.price || 0)}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Middle Section: Delivery details */}
                                <div className="expanded-panel delivery-panel">
                                  <h4 className="panel-title">Delivery Information</h4>
                                  <div className="delivery-info-box">
                                    <p><strong>Courier:</strong> E-Shop Premium Express</p>
                                    <p><strong>Address:</strong> Customer Shipping Address (On File)</p>
                                    <p><strong>Expected Delivery:</strong> Standard Transit (3-5 Business Days)</p>
                                  </div>
                                  <div className="expanded-actions-block">
                                    <Link
                                      to={`/track-order?orderId=${encodeURIComponent(order.orderId)}`}
                                      className="order-track-btn"
                                    >
                                      Track Shipment
                                    </Link>
                                    <button
                                      className="order-cancel-btn"
                                      disabled={statusClass === 'delivered' || statusClass === 'cancelled' || cancellingId === order.orderId}
                                      onClick={() => handleCancelOrder(order.orderId)}
                                    >
                                      {cancellingId === order.orderId ? 'Cancelling...' : 'Cancel Order'}
                                    </button>
                                  </div>
                                </div>

                                {/* Right Section: Timeline Status */}
                                <div className="expanded-panel timeline-panel">
                                  <h4 className="panel-title">Order Progress</h4>
                                  <OrderTimelineCompact status={order.status} />
                                </div>

                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
};

export default Orders;
