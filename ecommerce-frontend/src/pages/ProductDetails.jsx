import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { fetchProductsList } from '../services/products';
import { fetchProductInventory } from '../services/inventory';
import { useCart } from '../context/CartContext';
import { isAuthenticated } from '../services/auth';
import { useWishlist } from '../context/WishlistContext';
import Navbar from '../components/Navbar';
import QuantitySelector from '../components/QuantitySelector';
import '../styles/ProductDetails.css';

const ProductDetails = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { addItemToCart } = useCart();

  // Page States
  const [product, setProduct] = useState(null);
  const [allProducts, setAllProducts] = useState([]);
  const [stock, setStock] = useState(25);
  const [loading, setLoading] = useState(true);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState({ message: '', type: '' });

  // Interactive UI States
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [addingToCart, setAddingToCart] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  const { wishlistItems, addWishlist, removeWishlist } = useWishlist();
  const isWishlisted = wishlistItems.some(item => String(item.productId || item.id) === String(productId));

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

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const listData = await fetchProductsList();
      if (listData && listData.success && Array.isArray(listData.data)) {
        setAllProducts(listData.data);
        const match = listData.data.find((p) => String(p.productId || p.id) === String(productId));
        if (match) {
          setProduct(match);
          // Load inventory for the matched product
          try {
            setInventoryLoading(true);
            const invData = await fetchProductInventory(productId);
            const qty = invData.data?.availableStock ?? invData.stock ?? invData.quantity ?? invData.data?.stock ?? 25;
            setStock(qty);
          } catch (invErr) {
            console.error('Failed to load inventory for details:', invErr);
            setStock(25);
          } finally {
            setInventoryLoading(false);
          }

          // Wishlist status is resolved dynamically from context
        } else {
          setError('Product not found in our catalog.');
        }
      } else {
        throw new Error('Failed to load products list from catalog service.');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Something went wrong while retrieving product details.');
    } finally {
      setLoading(false);
    }
  }, [productId]);

  // Reload product details if the productId route param changes
  useEffect(() => {
    loadData();
    setQuantity(1);
    setActiveImageIndex(0);
  }, [loadData]);

  const handleAddToCart = async () => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }

    try {
      setAddingToCart(true);
      await addItemToCart(product, quantity);
      showToast(`Added ${quantity} ${product.name} to cart!`, 'success');
    } catch (err) {
      console.error('Failed to add to cart:', err);
      showToast('Failed to add item to cart. Please try again.', 'error');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleWishlistToggle = async () => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }

    try {
      setWishlistLoading(true);
      if (isWishlisted) {
        await removeWishlist(productId);
        showToast('Removed from Wishlist', 'success');
      } else {
        await addWishlist(product);
        showToast('Added to Wishlist', 'success');
      }
    } catch (err) {
      console.error('Failed to toggle wishlist:', err);
      showToast(isWishlisted ? 'Failed to remove from wishlist' : 'Failed to add to wishlist', 'error');
    } finally {
      setWishlistLoading(false);
    }
  };

  const handleBuyNow = async () => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }

    try {
      setAddingToCart(true);
      await addItemToCart(product, quantity);
      navigate('/checkout');
    } catch (err) {
      console.error('Failed to execute Buy Now:', err);
      showToast('Frictionless purchase failed. Please try again.', 'error');
      setAddingToCart(false);
    }
  };

  // Mock product image variations for clean gallery layout (different angles/looks)
  const productImages = useMemo(() => {
    if (!product) return [];
    const mainImg = product.imageUrl || '';
    if (!mainImg) return [];
    
    // We create four simulated thumbnails showing details of the premium item
    return [
      { url: mainImg, label: 'Front View' },
      { url: mainImg, label: 'Angled Detail' },
      { url: mainImg, label: 'Specifications' },
      { url: mainImg, label: 'In Box' }
    ];
  }, [product]);

  // Find similar products in the same category
  const similarProducts = useMemo(() => {
    if (!product) return [];
    return allProducts
      .filter((p) => p.category === product.category && String(p.productId || p.id) !== String(product.productId || product.id))
      .slice(0, 4);
  }, [allProducts, product]);

  // Specifications builder
  const technicalSpecs = useMemo(() => {
    if (!product) return [];
    const categoryLower = (product.category || '').toLowerCase();
    
    if (categoryLower.includes('elect') || categoryLower.includes('audio') || categoryLower.includes('phone') || categoryLower.includes('tab')) {
      return [
        { name: 'Brand', value: 'E-Shop Premium' },
        { name: 'Category', value: product.category || 'Electronics' },
        { name: 'Warranty', value: '1 Year Manufacturer' },
        { name: 'Connectivity', value: 'Wireless / USB-C' },
        { name: 'Box Contents', value: 'Product, Cable, Manual' },
        { name: 'Origin', value: 'Made in India' }
      ];
    }
    
    if (categoryLower.includes('furn') || categoryLower.includes('chair') || categoryLower.includes('tabl')) {
      return [
        { name: 'Brand', value: 'E-Shop Furniture' },
        { name: 'Category', value: 'Premium Seating' },
        { name: 'Material', value: 'Ergonomic Mesh & Steel Frame' },
        { name: 'Weight Limit', value: 'Up to 150 kg' },
        { name: 'Warranty', value: '3 Year Limited' },
        { name: 'Origin', value: 'Made in India' }
      ];
    }

    return [
      { name: 'Brand', value: 'E-Shop Select' },
      { name: 'Warranty', value: '1 Year Brand' },
      { name: 'Shipping', value: 'Dispatched within 24 Hours' },
      { name: 'Availability', value: 'In Stock' },
      { name: 'Material', value: 'Quality inspected' },
      { name: 'QC Certified', value: 'Passed Standard inspection' }
    ];
  }, [product]);

  const discount = product ? (product.discount !== undefined ? Number(product.discount) : 0) : 0;
  const oldPrice = product && discount > 0 ? Math.round(product.price / (1 - discount / 100)) : 0;
  const rating = product ? Number(product.rating || 4.5) : 4.4;
  const reviewCount = product ? Number(product.reviewCount || 128) : 120;
  const hasStock = stock > 0;

  const getBadgeType = (index, price) => {
    if (price > 40000) return 'Popular';
    if (index % 3 === 0) return 'Sale';
    return 'New';
  };

  if (loading) {
    return (
      <div className="product-details-wrapper">
        <Navbar />
        <main className="details-content-container">
          <div className="details-skeleton">
            <div className="loading-shimmer" style={{ aspectRatio: '1/1', borderRadius: '16px' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="loading-shimmer" style={{ width: '30%', height: '24px', borderRadius: '12px' }} />
              <div className="loading-shimmer" style={{ width: '80%', height: '36px', borderRadius: '8px' }} />
              <div className="loading-shimmer" style={{ width: '40%', height: '20px', borderRadius: '6px' }} />
              <div className="loading-shimmer" style={{ width: '100%', height: '80px', borderRadius: '12px' }} />
              <div className="loading-shimmer" style={{ width: '60%', height: '40px', borderRadius: '8px' }} />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="product-details-wrapper">
        <Navbar />
        <main className="details-content-container">
          <div className="catalog-error-card" style={{ maxWidth: '500px', margin: '60px auto' }}>
            <div className="error-icon-red">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h2>Unable to view product details</h2>
            <p className="error-detail-msg">{error || 'The requested product is missing or unavailable.'}</p>
            <Link to="/products" className="catalog-reload-btn" style={{ display: 'inline-block', textDecoration: 'none' }}>
              Return to Catalog
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="product-details-wrapper">
      <Navbar />

      {toast.message && (
        <div className={`toast-notification-banner toast-${toast.type}`}>
          <span>{toast.message}</span>
        </div>
      )}

      <main className="details-content-container">
        <Link to="/products" className="details-back-link">
          ← Back to products list
        </Link>

        <div className="details-grid">
          {/* Left Column: Image Gallery */}
          <section className="gallery-section">
            <div className="main-image-container">
              {product && product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={`${product.name} - Display`}
                  className="main-gallery-image"
                />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', background: '#f1f5f9', alignItems: 'center', justifyContent: 'center' }}>
                  No Product Image
                </div>
              )}
            </div>
          </section>

          {/* Right Column: Meta Information */}
          <section className="meta-info-section">
            <span className="details-category-pill">{product.category || 'General'}</span>

            <h1 className="details-title">{product.name}</h1>

            <div className="details-rating-row">
              <span className="details-stars">{Array.from({ length: 5 }).map((_, starIndex) => (starIndex < Math.round(rating) ? '★' : '☆')).join('')}</span>
              <span className="details-reviews">({reviewCount} Verified Reviews)</span>
            </div>

            <div className="details-price-row">
              <span className="details-price-current">{formatPrice(product.price)}</span>
              {discount > 0 && (
                <>
                  <span className="details-price-old">{formatPrice(oldPrice)}</span>
                  <span className="details-price-discount">{discount}% OFF</span>
                </>
              )}
            </div>

            {inventoryLoading ? (
              <div className="loading-shimmer" style={{ width: '100px', height: '24px', borderRadius: '12px' }} />
            ) : (
              <span className={`details-stock-status ${hasStock ? 'status-in-stock' : 'status-out-of-stock'}`}>
                {hasStock ? `✅ In Stock (${stock} available)` : '❌ Out of Stock'}
              </span>
            )}

            <p className="details-desc-paragraph">{product.description}</p>

            {hasStock && (
              <div className="details-qty-row">
                <span className="qty-label">Quantity:</span>
                <QuantitySelector
                  value={quantity}
                  onChange={setQuantity}
                  min={1}
                  max={Math.min(10, stock || 10)}
                  disabled={addingToCart}
                />
              </div>
            )}

            <div className="details-action-buttons">
              {!hasStock ? (
                <button className="btn-details-buy out-of-stock-disabled" style={{ gridColumn: '1 / -1' }} disabled>
                  Product Out Of Stock
                </button>
              ) : (
                <>
                  <button
                    className="btn-details-add"
                    onClick={handleAddToCart}
                    disabled={addingToCart}
                  >
                    {addingToCart ? 'Syncing...' : 'Add To Cart'}
                  </button>
                  <button
                    className="btn-details-buy"
                    onClick={handleBuyNow}
                    disabled={addingToCart}
                  >
                    Buy Now
                  </button>
                </>
              )}

              <button
                className="btn-details-wishlist"
                onClick={handleWishlistToggle}
                disabled={wishlistLoading}
              >
                {isWishlisted ? '❤️ Remove from Wishlist' : '🤍 Add to Wishlist'}
              </button>
            </div>
          </section>
        </div>

        {/* Specifications Grid */}
        <section className="specs-section">
          <h2 className="specs-title">Product Specifications</h2>
          <div className="specs-grid">
            {technicalSpecs.map((spec) => (
              <div key={spec.name} className="spec-item">
                <span className="spec-name">{spec.name}</span>
                <span className="spec-value">{spec.value}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Similar Products */}
        {similarProducts.length > 0 && (
          <section className="similar-section">
            <h2 className="similar-title">Similar Products You May Like</h2>
            <div className="similar-grid">
              {similarProducts.map((sim, idx) => {
                const simId = sim.productId || sim.id;
                const badge = getBadgeType(idx, sim.price);
                const simDiscount = sim.discount !== undefined ? Number(sim.discount) : 0;
                const oldSimPrice = simDiscount > 0 ? Math.round(sim.price / (1 - simDiscount / 100)) : 0;
                return (
                  <article
                    key={simId}
                    className="catalog-item-card"
                    onClick={() => navigate(`/product/${simId}`)}
                    role="button"
                    tabIndex="0"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        navigate(`/product/${simId}`);
                      }
                    }}
                  >
                    <span className={`card-badge-label badge-${badge.toLowerCase()}`}>{badge}</span>
                    <div className="card-image-box">
                      {sim.imageUrl ? (
                        <img src={sim.imageUrl} alt={sim.name} className="catalog-product-image" />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', background: '#f1f5f9', alignItems: 'center', justifyContent: 'center' }}>
                          E-Shop
                        </div>
                      )}
                    </div>
                    <div className="card-body-details" style={{ padding: '12px' }}>
                      <div className="card-top-info">
                        <span className="card-category-label">{sim.category || 'General'}</span>
                        <h3 className="card-name-title" title={sim.name}>{sim.name}</h3>
                        <p className="card-description-para">{sim.description}</p>
                        <div className="card-pricing-block" style={{ marginTop: 'auto' }}>
                          <span className="pricing-current">{formatPrice(sim.price)}</span>
                          {simDiscount > 0 && (
                            <>
                              <span className="pricing-old">{formatPrice(oldSimPrice)}</span>
                              <span className="pricing-discount" style={{ marginLeft: '6px' }}>{simDiscount}% OFF</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="card-bottom-actions" style={{ marginTop: '12px' }}>
                        <button className="btn-card-view" style={{ width: '100%' }} onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/product/${simId}`);
                        }}>
                          View details
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default ProductDetails;
