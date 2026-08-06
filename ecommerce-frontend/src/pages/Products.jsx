import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { fetchProductsList } from '../services/products';
import { fetchProductInventory } from '../services/inventory';
import { useCart } from '../context/CartContext';
import { isAuthenticated } from '../services/auth';
import { useWishlist } from '../context/WishlistContext';
import Navbar from '../components/Navbar';
import '../styles/Products.css';

const PremiumImagePlaceholder = () => (
  <div className="product-image-placeholder-modern">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="placeholder-box-icon">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
    </svg>
    <span className="placeholder-label">E-Shop Quality</span>
  </div>
);

const CatalogSkeleton = () => (
  <div className="catalog-grid">
    {Array.from({ length: 8 }).map((_, index) => (
      <div key={index} className="skeleton-product-card catalog-item-card" style={{ height: '590px' }}>
        <div className="skeleton-card-img loading-shimmer" style={{ height: '300px', width: '300px', background: '#e2e8f0' }} />
        <div className="card-body-details" style={{ gap: '12px' }}>
          <div className="loading-shimmer" style={{ width: '40%', height: '14px', borderRadius: '4px' }} />
          <div className="loading-shimmer" style={{ width: '80%', height: '20px', borderRadius: '4px' }} />
          <div className="loading-shimmer" style={{ width: '100%', height: '36px', borderRadius: '4px' }} />
          <div className="loading-shimmer" style={{ width: '50%', height: '24px', borderRadius: '4px' }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: 'auto' }}>
            <div className="loading-shimmer" style={{ height: '38px', borderRadius: '8px' }} />
            <div className="loading-shimmer" style={{ height: '38px', borderRadius: '8px' }} />
          </div>
        </div>
      </div>
    ))}
  </div>
);

const Products = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';
  const initialCategory = searchParams.get('category') || '';

  const { cartItems, addItemToCart, updateItemQuantity, removeItemFromCart } = useCart();
  const { wishlistItems, addWishlist, removeWishlist } = useWishlist();

  const [products, setProducts] = useState([]);
  const [inventory, setInventory] = useState({});
  const [loading, setLoading] = useState(true);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [error, setError] = useState(null);
  const [updatingCartId, setUpdatingCartId] = useState(null);
  const [toast, setToast] = useState({ message: '', type: '' });
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [sortBy, setSortBy] = useState('newest');

  // Sync searchQuery and selectedCategory when URL params change
  useEffect(() => {
    const urlQuery = searchParams.get('search') || '';
    setSearchQuery(urlQuery);
    const urlCategory = searchParams.get('category') || '';
    setSelectedCategory(urlCategory);
  }, [searchParams]);

  const categories = useMemo(() => {
    return Array.from(
      new Set(
        products
          .map((p) => p.category)
          .filter(Boolean)
          .map((c) => c.trim())
      )
    ).sort((a, b) => a.localeCompare(b));
  }, [products]);


  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await fetchProductsList();
      if (data && data.success && Array.isArray(data.data)) {
        setProducts(data.data);
        fetchInventory(data.data);
      } else {
        throw new Error(data?.message || 'Failed to parse products catalog list.');
      }
    } catch (err) {
      console.error('Error fetching products list:', err);
      setError(err.message || 'Something went wrong while loading products.');
    } finally {
      setLoading(false);
    }
  };

  const fetchInventory = async (productsList) => {
    try {
      setInventoryLoading(true);
      const inventoryPromises = productsList.map(async (product) => {
        const prodId = product.productId || product.id;
        try {
          const invData = await fetchProductInventory(prodId);
          const stock = invData.data?.availableStock ?? invData.stock ?? invData.quantity ?? invData.data?.stock ?? 25;
          return { productId: prodId, stock };
        } catch (err) {
          console.error(`Failed to load stock count for product ${prodId}:`, err);
          return { productId: prodId, stock: 25 };
        }
      });

      const results = await Promise.all(inventoryPromises);
      const mappedInventory = {};
      results.forEach((res) => {
        mappedInventory[res.productId] = res.stock;
      });
      setInventory(mappedInventory);
    } catch (err) {
      console.error('Error batch fetching inventory details:', err);
    } finally {
      setInventoryLoading(false);
    }
  };

  const handleWishlistToggle = async (product) => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }

    const prodId = product.productId || product.id;
    const isWishlisted = wishlistItems.some(item => String(item.productId || item.id) === String(prodId));

    try {
      if (isWishlisted) {
        await removeWishlist(prodId);
        showToast('Removed from Wishlist', 'success');
      } else {
        await addWishlist(product);
        showToast('Added to Wishlist', 'success');
      }
    } catch (err) {
      console.error('Failed to toggle wishlist:', err);
      showToast(isWishlisted ? 'Failed to remove from wishlist' : 'Failed to add to wishlist', 'error');
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

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

  const handleAddToCart = async (product) => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }

    const prodId = product.productId || product.id;
    try {
      setUpdatingCartId(prodId);
      await addItemToCart(product, 1);
      showToast(`Added ${product.name} to cart successfully!`, 'success');
    } catch (err) {
      console.error('Failed to add product to cart:', err);
      showToast('Failed to add item. Please try again.', 'error');
    } finally {
      setUpdatingCartId(null);
    }
  };

  const handleUpdateQuantity = async (productId, quantity) => {
    try {
      setUpdatingCartId(productId);
      await updateItemQuantity(productId, quantity);
    } catch (err) {
      console.error('Failed to update quantity:', err);
      showToast('Failed to update quantity. Please try again.', 'error');
    } finally {
      setUpdatingCartId(null);
    }
  };

  const handleRemoveFromCart = async (productId) => {
    try {
      setUpdatingCartId(productId);
      await removeItemFromCart(productId);
      showToast('Removed item from cart.', 'success');
    } catch (err) {
      console.error('Failed to remove item from cart:', err);
      showToast('Failed to remove item. Please try again.', 'error');
    } finally {
      setUpdatingCartId(null);
    }
  };

  const getBadgeType = (index, price) => {
    if (price > 40000) return 'Popular';
    if (index % 3 === 0) return 'Sale';
    return 'New';
  };

  const getFilteredAndSortedProducts = () => {
    const filtered = products.filter((product) => {
      if (selectedCategory && selectedCategory !== 'All Categories') {
        const prodCat = product.category || 'General';
        if (prodCat.toLowerCase() !== selectedCategory.toLowerCase()) {
          return false;
        }
      }

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const nameMatch = product.name ? product.name.toLowerCase().includes(query) : false;
        const categoryMatch = product.category ? product.category.toLowerCase().includes(query) : false;
        if (!nameMatch && !categoryMatch) {
          return false;
        }
      }

      return true;
    });

    return filtered.sort((a, b) => {
      if (sortBy === 'priceLowHigh') return a.price - b.price;
      if (sortBy === 'priceHighLow') return b.price - a.price;
      if (sortBy === 'nameAZ') return a.name.localeCompare(b.name);
      return b.productId.localeCompare(a.productId);
    });
  };

  const displayProducts = getFilteredAndSortedProducts();

  return (
    <div className="products-page-wrapper">
      <Navbar 
        searchQuery={searchQuery} 
        onSearchChange={(val) => {
          setSearchQuery(val);
          const newParams = {};
          if (val) newParams.search = val;
          if (selectedCategory) newParams.category = selectedCategory;
          setSearchParams(newParams);
        }} 
        selectedCategory={selectedCategory}
        onCategoryChange={(cat) => {
          setSelectedCategory(cat);
          const newParams = {};
          if (searchQuery) newParams.search = searchQuery;
          if (cat) newParams.category = cat;
          setSearchParams(newParams);
        }}
      />

      {toast.message && (
        <div className={`toast-notification-banner toast-${toast.type}`}>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Category Chips Bar */}
      <div className="category-chips-bar">
        <button
          className={`category-chip ${!selectedCategory ? 'active' : ''}`}
          onClick={() => {
            setSelectedCategory('');
            const newParams = {};
            if (searchQuery) newParams.search = searchQuery;
            setSearchParams(newParams);
          }}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            className={`category-chip ${selectedCategory === cat ? 'active' : ''}`}
            onClick={() => {
              setSelectedCategory(cat);
              const newParams = {};
              if (searchQuery) newParams.search = searchQuery;
              newParams.category = cat;
              setSearchParams(newParams);
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {selectedCategory && (
        <div className="active-filter-indicator">
          <span className="active-filter-chip">
            {selectedCategory}
            <span
              className="clear-filter-btn"
              onClick={() => {
                setSelectedCategory('');
                const newParams = {};
                if (searchQuery) newParams.search = searchQuery;
                setSearchParams(newParams);
              }}
              title="Clear category filter"
            >
              ×
            </span>
          </span>
        </div>
      )}

      <header className="catalog-compact-header">
        <span className="header-badge-tag">Featured Products</span>
        <h1 className="header-title-text">Curated Marketplace</h1>
        <p className="header-subtitle-text">Discover premium products with elevated design, stock visibility, and faster cart actions.</p>
      </header>

      <div className="catalog-toolbar-container">
        <div className="toolbar-search-mobile">
          <input
            type="text"
            placeholder="Search products..."
            className="mobile-search-bar"
            value={searchQuery}
            onChange={(e) => {
              const val = e.target.value;
              setSearchQuery(val);
              const newParams = {};
              if (val) newParams.search = val;
              if (selectedCategory) newParams.category = selectedCategory;
              setSearchParams(newParams);
            }}
          />
        </div>

        <div className="toolbar-info">
          <span>Showing {displayProducts.length} {selectedCategory ? `${selectedCategory} ` : ''}{displayProducts.length === 1 ? 'Product' : 'Products'}</span>
        </div>

        <div className="toolbar-sorting">
          <label htmlFor="sorting-select" className="sort-label">Sort by:</label>
          <select id="sorting-select" className="sort-dropdown" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="newest">Newest Arrivals</option>
            <option value="priceLowHigh">Price: Low to High</option>
            <option value="priceHighLow">Price: High to Low</option>
            <option value="nameAZ">Name: A to Z</option>
          </select>
        </div>
      </div>

      <main className="catalog-main-content">
        {loading && <CatalogSkeleton />}

        {error && !loading && (
          <div className="catalog-error-card">
            <div className="error-icon-red">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h2>Oops! Failed to load products</h2>
            <p className="error-detail-msg">{error}</p>
            <button className="catalog-reload-btn" onClick={fetchProducts}>
              <span>Reload Products</span>
            </button>
          </div>
        )}

        {!loading && !error && displayProducts.length === 0 && (
          <div className="catalog-empty-state">
            <p className="empty-message-text">No products found matching your search criteria.</p>
            <button className="clear-search-btn" onClick={() => { setSearchQuery(''); setSelectedCategory(''); setSearchParams({}); }}>
              Clear Filters
            </button>
          </div>
        )}

        {!loading && !error && displayProducts.length > 0 && (
          <div className="catalog-grid">
            {displayProducts.map((product, idx) => {
              const prodId = product.productId || product.id;
              const badge = getBadgeType(idx, product.price);
              const stock = inventory[prodId];
              const isStockLoading = inventoryLoading && stock === undefined;
              const stockCount = stock || 0;
              const hasStock = stock !== undefined ? stock > 0 : true;
              const discount = product.discount !== undefined ? Number(product.discount) : 0;
              const oldPrice = discount > 0 ? Math.round(product.price / (1 - discount / 100)) : 0;
              const rating = Number(product.rating || 4.4 + (idx % 3) * 0.1);
              const reviewCount = Number(product.reviewCount || 120 + idx * 7);

              const cartItem = cartItems.find((item) => item.productId === prodId);
              const isInCart = !!cartItem;
              const cartQuantity = cartItem ? cartItem.quantity : 0;
              const isWishlisted = wishlistItems.some(item => String(item.productId || item.id) === String(prodId));

              return (
                <article key={prodId} className="catalog-item-card">
                  <span className={`card-badge-label badge-${badge.toLowerCase()}`}>{badge}</span>

                  <button
                    className={`btn-wishlist-toggle ${isWishlisted ? 'wishlisted' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleWishlistToggle(product);
                    }}
                    title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
                    aria-label={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
                  >
                    {isWishlisted ? '❤️' : '🤍'}
                  </button>

                  <div
                    className="card-image-box"
                    onClick={() => navigate(`/product/${prodId}`)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate(`/product/${prodId}`); }}
                  >
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="catalog-product-image"
                        loading="lazy"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}

                    <div style={{ display: product.imageUrl ? 'none' : 'flex', width: '100%', height: '100%' }}>
                      <PremiumImagePlaceholder />
                    </div>
                  </div>

                  <div className="card-body-details">
                    <div
                      className="card-top-info"
                      onClick={() => navigate(`/product/${prodId}`)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate(`/product/${prodId}`); }}
                    >
                      <div className="card-category-and-stock">
                        <span className="card-category-label">{product.category || 'General'}</span>

                        {isStockLoading ? (
                          <div className="stock-skeleton-label loading-shimmer" style={{ width: '60px', height: '12px', borderRadius: '999px' }} />
                        ) : (
                          <div className="stock-status-wrapper">
                            {stockCount > 20 && <span className="stock-status status-in-stock">In Stock ({stockCount})</span>}
                            {stockCount > 0 && stockCount <= 20 && <span className="stock-status status-low-stock">Low Stock ({stockCount})</span>}
                            {stockCount === 0 && stock !== undefined && <span className="stock-status status-out-of-stock">Out of Stock</span>}
                            {stock === undefined && <span className="stock-status status-checking">Checking...</span>}
                          </div>
                        )}
                      </div>

                      <div className="card-rating-row">
                        <span className="card-stars">{Array.from({ length: 5 }).map((_, starIndex) => (starIndex < Math.round(rating) ? '★' : '☆')).join('')}</span>
                        <span className="card-reviews">({reviewCount})</span>
                      </div>

                      <h3 className="card-name-title" title={product.name}>{product.name}</h3>
                      <p className="card-description-para">{product.description}</p>

                      <div className="card-pricing-block">
                        <span className="pricing-current">{formatPrice(product.price)}</span>
                        {discount > 0 && (
                          <>
                            <span className="pricing-old">{formatPrice(oldPrice)}</span>
                            <span className="pricing-discount">{discount}% OFF</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="card-bottom-actions">
                      <div className="card-action-group">
                        <button className="btn-card-view" onClick={() => navigate(`/product/${prodId}`)}>
                          View Details
                        </button>

                        {!hasStock ? (
                          <button className="btn-card-add out-of-stock-disabled" disabled>
                            Out Of Stock
                          </button>
                        ) : !isInCart ? (
                          <button
                            className="btn-card-add"
                            onClick={() => handleAddToCart(product)}
                            disabled={updatingCartId === prodId}
                          >
                            {updatingCartId === prodId ? 'Adding...' : 'Add To Cart'}
                          </button>
                        ) : (
                          <div className="product-card-qty-selector">
                            <button
                              type="button"
                              className="product-card-qty-btn"
                              disabled={updatingCartId === prodId}
                              onClick={() => {
                                if (cartQuantity === 1) {
                                  handleRemoveFromCart(prodId);
                                } else {
                                  handleUpdateQuantity(prodId, cartQuantity - 1);
                                }
                              }}
                            >
                              −
                            </button>
                            <span className="product-card-qty-value">{cartQuantity}</span>
                            <button
                              type="button"
                              className="product-card-qty-btn"
                              disabled={updatingCartId === prodId || cartQuantity >= Math.min(10, stockCount || 10)}
                              onClick={() => handleUpdateQuantity(prodId, cartQuantity + 1)}
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
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

export default Products;
