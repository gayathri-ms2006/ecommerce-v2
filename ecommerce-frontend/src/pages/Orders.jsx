import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getUserOrders, cancelOrder } from '../services/orders';
import { fetchProductsList } from '../services/products';
import { isAuthenticated } from '../services/auth';
import Navbar from '../components/Navbar';
import '../styles/Orders.css';

// Horizontal timeline helper for compact display
const OrderTimelineCompact = ({ status }) => {
  const currentStatus = (status || 'PENDING').toUpperCase();

  if (currentStatus === 'CANCELLED') {
    return (
      <div className="orders-horizontal-timeline cancelled-timeline">
        <div className="timeline-horizontal-step completed-step cancelled-step">
          <div className="step-icon-circle">✕</div>
          <span className="step-label-text">Cancelled</span>
        </div>
      </div>
    );
  }

  const stages = [
    { label: 'Order Placed', emoji: '✓', key: 'PLACED' },
    { label: 'Processing', emoji: '⚙️', key: 'PROCESSING' },
    { label: 'Shipped', emoji: '🚚', key: 'SHIPPED' },
    { label: 'Out for Delivery', emoji: '📦', key: 'OUT_FOR_DELIVERY' },
    { label: 'Delivered', emoji: '🎉', key: 'DELIVERED' }
  ];

  let activeIndex = 0;
  if (currentStatus === 'PROCESSING' || currentStatus === 'PACKED') activeIndex = 1;
  else if (currentStatus === 'SHIPPED') activeIndex = 2;
  else if (currentStatus === 'OUT_FOR_DELIVERY') activeIndex = 3;
  else if (currentStatus === 'DELIVERED') activeIndex = 4;

  return (
    <div className="orders-timeline-flow">
      {stages.map((stage, idx) => {
        const isCompleted = idx <= activeIndex;
        const isActive = idx === activeIndex;
        
        return (
          <div key={idx} className={`orders-timeline-node ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}>
            <div className="orders-timeline-icon">
              {isCompleted ? '✓' : stage.emoji}
            </div>
            <div className="orders-timeline-text">
              <span className="orders-timeline-label">{stage.label}</span>
            </div>
            {idx < stages.length - 1 && (
              <div className="orders-timeline-connector" />
            )}
          </div>
        );
      })}
    </div>
  );
};

// Skeleton loading layout for orders cards
const OrdersSkeleton = () => (
  <div className="orders-skeleton-wrapper">
    <div className="orders-skeleton-card loading-shimmer" />
    <div className="orders-skeleton-card loading-shimmer" style={{ animationDelay: '0.2s' }} />
    <div className="orders-skeleton-card loading-shimmer" style={{ animationDelay: '0.4s' }} />
  </div>
);

const Orders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [catalogProducts, setCatalogProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [toast, setToast] = useState({ message: '', type: '' });

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('LATEST');

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
      
      const [res, productsRes] = await Promise.all([
        getUserOrders(),
        fetchProductsList().catch(err => {
          console.error("Failed to load catalog products:", err);
          return null;
        })
      ]);

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

      if (productsRes && productsRes.success && Array.isArray(productsRes.data)) {
        setCatalogProducts(productsRes.data);
      }
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

  const getProductImage = useCallback((productId) => {
    const match = catalogProducts.find((p) => String(p.productId || p.id) === String(productId));
    return match ? match.imageUrl : '';
  }, [catalogProducts]);



  // Filter and Sort orders
  const filteredOrders = useMemo(() => {
    let result = [...orders];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(order => {
        const matchesId = String(order.orderId).toLowerCase().includes(query);
        const matchesProducts = (order.products || []).some(p =>
          (p.productName || '').toLowerCase().includes(query)
        ) || (order.productName || '').toLowerCase().includes(query);
        return matchesId || matchesProducts;
      });
    }

    if (statusFilter !== 'ALL') {
      result = result.filter(order => {
        const status = (order.status || 'PENDING').toUpperCase();
        if (statusFilter === 'PROCESSING') {
          return ['PENDING', 'PROCESSING', 'PACKED'].includes(status);
        }
        if (statusFilter === 'SHIPPED') {
          return ['SHIPPED', 'OUT_FOR_DELIVERY'].includes(status);
        }
        return status === statusFilter;
      });
    }

    result.sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return sortBy === 'LATEST' ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [orders, searchQuery, statusFilter, sortBy]);

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
          <p className="orders-page-subtitle">Track shipping status, download invoices, and manage your orders history.</p>
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
          <>
            {/* Filter and Search Bar */}
            <div className="orders-toolbar-bar">
              <div className="orders-search-wrapper">
                <span className="orders-search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Search orders by ID or item name..."
                  className="orders-search-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="orders-filter-group">
                <button
                  className={`orders-filter-btn ${statusFilter === 'ALL' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('ALL')}
                >
                  All Orders
                </button>
                <button
                  className={`orders-filter-btn ${statusFilter === 'PROCESSING' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('PROCESSING')}
                >
                  Processing
                </button>
                <button
                  className={`orders-filter-btn ${statusFilter === 'SHIPPED' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('SHIPPED')}
                >
                  Shipped
                </button>
                <button
                  className={`orders-filter-btn ${statusFilter === 'DELIVERED' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('DELIVERED')}
                >
                  Delivered
                </button>
                <button
                  className={`orders-filter-btn ${statusFilter === 'CANCELLED' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('CANCELLED')}
                >
                  Cancelled
                </button>
              </div>
              <div className="orders-sort-wrapper">
                <label htmlFor="orders-sort-select">Sort:</label>
                <select
                  id="orders-sort-select"
                  className="orders-sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="LATEST">Latest First</option>
                  <option value="OLDEST">Oldest First</option>
                </select>
              </div>
            </div>

            {filteredOrders.length === 0 ? (
              <div className="orders-no-match-state">
                <p>No orders matched your active search or status filters.</p>
              </div>
            ) : (
              /* Order Cards List */
              <div className="orders-cards-list">
                {filteredOrders.map((order) => {
                  const isExpanded = expandedOrderId === order.orderId;
                  const formattedDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  });
                  const status = (order.status || 'PENDING').toUpperCase();
                  const statusClass = status.toLowerCase();

                  let statusLabel = status;
                  if (status === 'PENDING') statusLabel = 'Processing';
                  else if (status === 'OUT_FOR_DELIVERY') statusLabel = 'Out for Delivery';

                  return (
                    <div key={order.orderId} className={`order-card-box ${isExpanded ? 'card-expanded' : ''}`}>
                      {/* Card Header (Summary Bar) */}
                      <div className="order-card-header">
                        <div className="header-meta-details">
                          <div className="meta-block">
                            <span className="meta-title">Order ID</span>
                            <strong className="meta-value">#{order.orderId}</strong>
                          </div>
                          <div className="meta-block">
                            <span className="meta-title">Placed on</span>
                            <span className="meta-value">{formattedDate}</span>
                          </div>
                          <div className="meta-block">
                            <span className="meta-title">Total</span>
                            <strong className="meta-value text-primary">
                              {formatPrice(order.totalAmount || order.price)}
                            </strong>
                          </div>
                        </div>
                        <div className="header-status-and-action" style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                          <span className={`status-badge status-${statusClass}`}>
                            {statusLabel}
                          </span>
                          <button
                            className="btn-toggle-details-accordion"
                            onClick={() => toggleOrderExpand(order.orderId)}
                            style={{ margin: 0 }}
                          >
                            {isExpanded ? 'Hide Details ▲' : 'View Details ▼'}
                          </button>
                        </div>
                      </div>

                      {/* Expanded Section (Details, Products, Actions) */}
                      {isExpanded && (
                        <>
                          {/* Card Body */}
                          <div className="order-card-body">
                            <div className="order-products-scroller">
                              {(order.products || []).map((prod, idx) => {
                                const img = getProductImage(prod.productId);
                                return (
                                  <div key={prod.productId || idx} className="order-product-item-row">
                                    <div className="order-product-img-box">
                                      {img ? (
                                        <img src={img} alt={prod.productName} className="order-product-img" />
                                      ) : (
                                        <div className="order-product-img-placeholder">📦</div>
                                      )}
                                    </div>
                                    <div className="order-product-meta">
                                      <h4 className="order-product-name">{prod.productName || 'E-Shop Product'}</h4>
                                      <div className="order-product-qty-row">
                                        <span className="order-product-qty">Qty: {prod.quantity || 1}</span>
                                        <span className="order-product-price">
                                          {formatPrice(prod.price * (prod.quantity || 1))}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                              {(!order.products || order.products.length === 0) && (
                                <div className="order-product-item-row">
                                  <div className="order-product-img-box">
                                    <div className="order-product-img-placeholder">📦</div>
                                  </div>
                                  <div className="order-product-meta">
                                    <h4 className="order-product-name">{order.productName || 'E-Shop Product'}</h4>
                                    <div className="order-product-qty-row">
                                      <span className="order-product-qty">Qty: 1</span>
                                      <span className="order-product-price">{formatPrice(order.price || 0)}</span>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="order-delivery-estimate-box">
                              <span className="estimate-label">Delivery Estimate:</span>
                              <strong className="estimate-value">Standard Transit (3-5 Business Days)</strong>
                            </div>
                          </div>

                          {/* Expanded Section (Details, Live Tracking) */}
                          <div className="order-card-expanded-drawer" style={{ borderTop: 'none' }}>
                            <div className="expanded-drawer-grid">
                              <div className="expanded-section-panel tracking-timeline-panel">
                                <h4 className="expanded-panel-title">Fulfillment Progress</h4>
                                <OrderTimelineCompact status={order.status} />
                              </div>
                              <div className="expanded-section-panel delivery-summary-panel">
                                <h4 className="expanded-panel-title">Shipping & Invoice Details</h4>
                                <div className="delivery-summary-details-box">
                                  <div className="summary-detail-item">
                                    <span className="detail-item-title">Courier Partner</span>
                                    <span className="detail-item-desc">E-Shop Premium Express</span>
                                  </div>
                                  <div className="summary-detail-item">
                                    <span className="detail-item-title">Delivery Address</span>
                                    <span className="detail-item-desc">Customer Shipping Address (On File)</span>
                                  </div>
                                  <div className="summary-detail-item">
                                    <span className="detail-item-title">Payment Mode</span>
                                    <span className="detail-item-desc">
                                      {order.paymentMethod ? order.paymentMethod.replace(/_/g, ' ') : 'CREDIT CARD'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Card Actions Footer */}
                          <div className="order-card-actions-bar" style={{ borderTop: '1px solid var(--border-color)' }}>
                            <div className="actions-left-links">
                              <Link
                                to={`/track-order?orderId=${encodeURIComponent(order.orderId)}`}
                                className="btn-track-shipment"
                              >
                                Track Order
                              </Link>
                              <button
                                className="btn-cancel-order"
                                disabled={statusClass === 'delivered' || statusClass === 'cancelled' || cancellingId === order.orderId}
                                onClick={() => handleCancelOrder(order.orderId)}
                              >
                                {cancellingId === order.orderId ? 'Cancelling...' : 'Cancel Order'}
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default Orders;
