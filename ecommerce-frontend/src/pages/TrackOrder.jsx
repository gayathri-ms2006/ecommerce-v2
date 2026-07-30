import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { getUserOrders } from '../services/orders';
import { isAuthenticated } from '../services/auth';
import '../styles/TrackOrder.css';

const statusStages = [
  { key: 'PENDING', label: 'Order placed', caption: 'We have received your order request.' },
  { key: 'PROCESSING', label: 'Processing', caption: 'Your order is being packed and verified.' },
  { key: 'SHIPPED', label: 'Shipped', caption: 'The parcel is in transit with our logistics partner.' },
  { key: 'DELIVERED', label: 'Delivered', caption: 'Your order has reached its destination.' },
];

const TrackOrder = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }

    const fetchOrders = async () => {
      try {
        setLoading(true);
        const res = await getUserOrders();
        let list = [];
        if (Array.isArray(res)) list = res;
        else if (res?.data && Array.isArray(res.data)) list = res.data;
        else if (res?.orders && Array.isArray(res.orders)) list = res.orders;

        list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setOrders(list);
      } catch (err) {
        setError(err.message || 'Unable to fetch order tracking details.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [navigate]);

  const formatPrice = (price) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price || 0);

  const orderId = searchParams.get('orderId');

  const currentOrder = useMemo(() => {
    return orders.find((item) => item.orderId === orderId) || orders[0] || null;
  }, [orders, orderId]);

  const activeStageIndex = useMemo(() => {
    const status = (currentOrder?.status || 'PENDING').toUpperCase();
    if (status === 'PROCESSING') return 1;
    if (status === 'SHIPPED') return 2;
    if (status === 'DELIVERED') return 3;
    return 0;
  }, [currentOrder]);

  return (
    <div className="track-page-wrapper">
      <Navbar />

      <main className="track-page-container">
        <header className="track-header-row">
          <div>
            <span className="track-eyebrow">Live order tracking</span>
            <h1 className="track-title">Track your delivery</h1>
            <p className="track-subtitle">Monitor every step from the warehouse to your doorstep.</p>
          </div>
          <Link to="/orders" className="track-back-link">Back to orders</Link>
        </header>

        {loading && (
          <div className="track-skeleton-card">
            <div className="track-skeleton-line track-skeleton-wide" />
            <div className="track-skeleton-line" />
            <div className="track-skeleton-line" />
          </div>
        )}

        {error && !loading && (
          <div className="track-empty-card">
            <h2>Unable to track this order</h2>
            <p>{error}</p>
            <Link to="/orders" className="track-primary-btn">View order history</Link>
          </div>
        )}

        {!loading && !error && !currentOrder && (
          <div className="track-empty-card">
            <h2>No matching order found</h2>
            <p>Choose an order from your order history to start tracking it.</p>
            <Link to="/orders" className="track-primary-btn">Open orders</Link>
          </div>
        )}

        {!loading && !error && currentOrder && (
          <div className="track-grid">
            <section className="track-summary-card">
              <div className="track-meta-row">
                <div>
                  <span className="track-meta-label">Order ID</span>
                  <strong className="track-meta-value">{currentOrder.orderId}</strong>
                </div>
                <div>
                  <span className="track-meta-label">Status</span>
                  <span className="status-pill">{(currentOrder.status || 'PENDING').toUpperCase()}</span>
                </div>
              </div>

              <div className="track-detail-grid">
                <div>
                  <span className="track-meta-label">Placed</span>
                  <strong className="track-meta-value">{new Date(currentOrder.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</strong>
                </div>
                <div>
                  <span className="track-meta-label">Payment</span>
                  <strong className="track-meta-value">{(currentOrder.paymentMethod || 'CREDIT_CARD').replace(/_/g, ' ')}</strong>
                </div>
                <div>
                  <span className="track-meta-label">Total</span>
                  <strong className="track-meta-value">{formatPrice(currentOrder.totalAmount || currentOrder.price || 0)}</strong>
                </div>
                <div>
                  <span className="track-meta-label">Courier</span>
                  <strong className="track-meta-value">E-Shop Premium Fleet</strong>
                </div>
              </div>

              <div className="track-timeline">
                {statusStages.map((stage, index) => {
                  const isComplete = index <= activeStageIndex;
                  const isActive = index === activeStageIndex;

                  return (
                    <div key={stage.key} className={`track-step ${isComplete ? 'complete' : ''} ${isActive ? 'active' : ''}`}>
                      <div className="track-step-icon">
                        {stage.key === 'PENDING' && '📝'}
                        {stage.key === 'PROCESSING' && '⚙️'}
                        {stage.key === 'SHIPPED' && '🚚'}
                        {stage.key === 'DELIVERED' && '🎉'}
                      </div>
                      <div className="track-step-copy">
                        <strong>{stage.label}</strong>
                        <span>{stage.caption}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="track-order-card">
              <div className="track-side-header">
                <span className="track-side-label">Shipment summary</span>
                <span className="track-side-badge">ETA 5 days</span>
              </div>

              <div className="track-items-list">
                {(currentOrder.products || []).map((product, index) => (
                  <div key={`${product.productId}-${index}`} className="track-item-row">
                    <div>
                      <strong>{product.productName || 'E-Shop Product'}</strong>
                      <span>Qty {product.quantity || 1}</span>
                    </div>
                    <b>{formatPrice((product.price || 0) * (product.quantity || 1))}</b>
                  </div>
                ))}
              </div>

              <div className="track-support-box">
                <strong>Need help with delivery?</strong>
                <span>Contact support at hello@eshop.example or use the help center.</span>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
};

export default TrackOrder;
