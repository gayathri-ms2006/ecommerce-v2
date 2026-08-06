import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { isAuthenticated } from '../services/auth';
import Navbar from '../components/Navbar';
import '../styles/Wishlist.css';

const ProductImageFallback = () => (
  <div className="wishlist-item-image-placeholder">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="wishlist-fallback-box-icon">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
    </svg>
  </div>
);

const WishlistSkeleton = () => (
  <div className="wishlist-grid">
    {Array.from({ length: 4 }).map((_, idx) => (
      <div key={idx} className="wishlist-skeleton-card">
        <div className="wishlist-skeleton-image loading-shimmer" />
        <div className="wishlist-skeleton-info">
          <div className="wishlist-skeleton-title loading-shimmer" />
          <div className="wishlist-skeleton-price loading-shimmer" />
          <div className="wishlist-skeleton-date loading-shimmer" />
          <div className="wishlist-skeleton-button loading-shimmer" />
          <div className="wishlist-skeleton-button loading-shimmer" />
        </div>
      </div>
    ))}
  </div>
);

const Wishlist = () => {
  const navigate = useNavigate();
  const { wishlistItems, loading, error, refreshWishlist, removeWishlist } = useWishlist();
  const { addItemToCart } = useCart();
  const [removingId, setRemovingId] = useState(null);
  const [movingId, setMovingId] = useState(null);
  const [toast, setToast] = useState({ message: '', type: '' });

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
    } else {
      refreshWishlist();
    }
  }, [navigate, refreshWishlist]);

  const formatPrice = (price) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price || 0);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      return `Added on ${date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })}`;
    } catch {
      return '';
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    window.setTimeout(() => setToast({ message: '', type: '' }), 3000);
  };

  const handleRemove = async (productId, productName) => {
    try {
      setRemovingId(productId);
      await removeWishlist(productId);
      showToast(`Removed ${productName} from wishlist.`, 'success');
    } catch (err) {
      console.error('Failed to remove from wishlist:', err);
      showToast('Failed to remove item from wishlist. Please try again.', 'error');
    } finally {
      setRemovingId(null);
    }
  };

  const handleMoveToCart = async (item) => {
    const prodId = item.productId || item.id;
    try {
      setMovingId(prodId);
      
      const price = item.productPrice ?? item.price ?? item.priceWhenAdded ?? 0;
      const imageUrl = item.productImage ?? item.imageUrl ?? '';

      // Add product to cart using CartContext
      await addItemToCart({
        productId: prodId,
        name: item.productName || item.name,
        price,
        imageUrl,
      }, 1);

      // Remove from wishlist using WishlistContext
      await removeWishlist(prodId);

      showToast(`Moved ${item.productName || item.name} to cart.`, 'success');
    } catch (err) {
      console.error('Failed to move item to cart:', err);
      showToast('Failed to move item to cart. Please try again.', 'error');
    } finally {
      setMovingId(null);
    }
  };

  return (
    <div className="wishlist-page-wrapper">
      <Navbar />

      {toast.message && (
        <div className={`toast-notification-banner toast-${toast.type}`}>
          <span>{toast.message}</span>
        </div>
      )}

      <main className="wishlist-content-container">
        <header className="wishlist-header">
          <h1 className="wishlist-page-title">My Wishlist</h1>
          <p className="wishlist-page-subtitle">Your saved items and products of interest.</p>
        </header>

        {loading && <WishlistSkeleton />}

        {error && !loading && (
          <div className="wishlist-error-container">
            <div className="wishlist-error-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h2>Failed to load wishlist</h2>
            <p>{error}</p>
            <button className="wishlist-retry-btn" onClick={refreshWishlist}>
              Retry Loading
            </button>
          </div>
        )}

        {!loading && !error && wishlistItems.length === 0 && (
          <div className="wishlist-empty-container">
            <div className="wishlist-empty-icon">❤️</div>
            <h2 className="wishlist-empty-title">Your wishlist is empty</h2>
            <p className="wishlist-empty-subtitle">Tap the heart icons on products to add items to your wishlist.</p>
            <Link to="/products" className="wishlist-empty-btn">
              Explore Products
            </Link>
          </div>
        )}

        {!loading && !error && wishlistItems.length > 0 && (
          <div className="wishlist-grid">
            {wishlistItems.map((item) => {
              const prodId = item.productId || item.id;
              const name = item.productName || item.name || 'E-Shop Product';
              const price = item.productPrice ?? item.price ?? item.priceWhenAdded ?? 0;
              const imageUrl = item.productImage ?? item.imageUrl ?? '';
              
              return (
                <article key={prodId} className="wishlist-item-card">
                  <div
                    className="wishlist-image-box"
                    onClick={() => navigate(`/product/${prodId}`)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate(`/product/${prodId}`); }}
                  >
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={name}
                        className="wishlist-product-image"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div style={{ display: imageUrl ? 'none' : 'flex', width: '100%', height: '100%' }}>
                      <ProductImageFallback />
                    </div>
                  </div>

                  <div className="wishlist-card-body">
                    <div className="wishlist-item-info">
                      <h3 className="wishlist-item-title" title={name} onClick={() => navigate(`/product/${prodId}`)}>
                        {name}
                      </h3>
                      <span className="wishlist-item-price">{formatPrice(price)}</span>
                      {item.addedAt && (
                        <span className="wishlist-added-at">{formatDate(item.addedAt)}</span>
                      )}
                    </div>

                    <div className="wishlist-card-actions">
                      <button
                        className="btn-wishlist-move"
                        onClick={() => handleMoveToCart(item)}
                        disabled={movingId === prodId || removingId === prodId}
                      >
                        {movingId === prodId ? 'Moving...' : 'Move To Cart'}
                      </button>
                      <button
                        className="btn-wishlist-remove"
                        onClick={() => handleRemove(prodId, name)}
                        disabled={movingId === prodId || removingId === prodId}
                      >
                        {removingId === prodId ? 'Removing...' : 'Remove'}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default Wishlist;
