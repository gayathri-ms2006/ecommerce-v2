import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { isAuthenticated, logoutUser, getEmail, getUsername, getName } from '../services/auth';
import { fetchProductsList } from '../services/products';
import '../styles/Navbar.css';

const Navbar = ({ searchQuery = '', onSearchChange, selectedCategory = '', onCategoryChange }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cartCount, refreshCart } = useCart();
  const { wishlistCount, refreshWishlist } = useWishlist();
  const [userLoggedIn, setUserLoggedIn] = useState(isAuthenticated());
  const [userEmail, setUserEmail] = useState('');
  const [badgeAnimate, setBadgeAnimate] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const [categories, setCategories] = useState([]);
  const [categoriesOpen, setCategoriesOpen] = useState(false);

  // Close categories dropdown on outside clicks
  useEffect(() => {
    if (!categoriesOpen) return;

    const handleOutsideClick = (event) => {
      const catContainer = document.querySelector('.nav-categories-container');
      if (catContainer && !catContainer.contains(event.target)) {
        setCategoriesOpen(false);
      }
    };

    document.addEventListener('click', handleOutsideClick);
    return () => {
      document.removeEventListener('click', handleOutsideClick);
    };
  }, [categoriesOpen]);

  // Fetch unique categories dynamically from products
  useEffect(() => {
    let isMounted = true;
    const loadCategories = async () => {
      try {
        const data = await fetchProductsList();
        if (isMounted && data && data.success && Array.isArray(data.data)) {
          const uniqueCategories = Array.from(
            new Set(
              data.data
                .map((p) => p.category)
                .filter(Boolean)
                .map((c) => c.trim())
            )
          ).sort((a, b) => a.localeCompare(b));
          setCategories(uniqueCategories);
        }
      } catch (error) {
        console.error('Failed to load categories for Navbar:', error);
      }
    };
    loadCategories();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleCategoryClick = (category) => {
    setCategoriesOpen(false);
    if (onCategoryChange) {
      onCategoryChange(category);
    } else {
      const searchParam = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : '';
      const categoryParam = category ? `category=${encodeURIComponent(category)}` : '';
      const query = [categoryParam, searchParam].filter(Boolean).join('&');
      navigate(`/products${query ? `?${query}` : ''}`);
    }
  };

  // Sync authentication state and decode user email on route change or load
  useEffect(() => {
    const loggedIn = isAuthenticated();
    setUserLoggedIn(loggedIn);
    
    if (loggedIn) {
      const name = getName();
      const username = getUsername();
      const email = getEmail();
      setUserEmail(name || username || (email ? email.split('@')[0] : '') || 'Customer');
      refreshCart(); // Keep cart count in sync
      refreshWishlist(); // Keep wishlist count in sync
    } else {
      setUserEmail('');
    }
  }, [location, refreshCart, refreshWishlist]);


  // Close profile dropdown on outside clicks
  useEffect(() => {
    if (!profileOpen) return;

    const handleOutsideClick = (event) => {
      const userContainer = document.querySelector('.nav-user-container');
      if (userContainer && !userContainer.contains(event.target)) {
        setProfileOpen(false);
      }
    };

    document.addEventListener('click', handleOutsideClick);
    return () => {
      document.removeEventListener('click', handleOutsideClick);
    };
  }, [profileOpen]);

  // Micro-animation trigger when cart count changes
  useEffect(() => {
    if (cartCount > 0) {
      setBadgeAnimate(true);
      const timer = setTimeout(() => setBadgeAnimate(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [cartCount]);

  const handleLogout = async () => {
    await logoutUser();
    setUserLoggedIn(false);
    setUserEmail('');
    navigate('/login');
  };

  const getActiveCls = (path) => {
    return location.pathname === path ? 'nav-item active' : 'nav-item';
  };

  return (
    <nav className="ecommerce-navbar">
      <div className="navbar-container">
        
        {/* Brand Logo */}
        <Link to="/products" className="navbar-logo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="logo-cart-icon">
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
          <span className="logo-text">E-Shop</span>
        </Link>

        {/* Search Input */}
        <div className="navbar-search-placeholder">
          <input 
            type="text" 
            placeholder="Search our catalog of premium products..." 
            className="navbar-search-input-actual"
            value={searchQuery}
            onChange={(e) => {
              const val = e.target.value;
              if (onSearchChange) {
                onSearchChange(val);
              } else {
                navigate(`/products?search=${encodeURIComponent(val)}`);
              }
            }}
          />
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="search-lens-icon">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>

        {/* Nav Navigation Links */}
        <div className="navbar-links">
          {/* Categories Dropdown */}
          <div className="nav-categories-container">
            <button
              className="nav-categories-button"
              onClick={() => setCategoriesOpen((prev) => !prev)}
              aria-label="Open categories menu"
            >
              <span>{selectedCategory ? `Categories: ${selectedCategory}` : 'Categories'}</span>
              <span className="categories-chevron">▾</span>
            </button>

            {categoriesOpen && (
              <div className="categories-dropdown-menu">
                <button
                  className={`categories-dropdown-item ${!selectedCategory ? 'active' : ''}`}
                  onClick={() => handleCategoryClick('')}
                >
                  All Categories
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    className={`categories-dropdown-item ${selectedCategory === cat ? 'active' : ''}`}
                    onClick={() => handleCategoryClick(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Link to="/products" className={getActiveCls('/products')}>
            Products
          </Link>

          <Link to="/wishlist" className={getActiveCls('/wishlist')}>
            ❤️ Wishlist ({wishlistCount})
          </Link>
          
          <Link to="/cart" className={getActiveCls('/cart')}>
            <span>Cart</span>
            {cartCount > 0 && (
              <span className={`nav-cart-badge ${badgeAnimate ? 'pulse-badge-animation' : ''}`}>
                {cartCount}
              </span>
            )}
          </Link>
          
          <Link to="/orders" className={getActiveCls('/orders')}>
            Orders
          </Link>

          {/* User Section / Login & Logout */}
          {userLoggedIn ? (
            <div className="nav-user-container">
              <button
                className="nav-profile-button"
                onClick={() => setProfileOpen((prev) => !prev)}
                aria-label="Open profile menu"
              >
                <span className="nav-user-greeting" title={userEmail}>
                  Hi, {userEmail}
                </span>
                <span className="profile-chevron">▾</span>
              </button>

              {profileOpen && (
                <div className="profile-dropdown-menu">
                  <button className="profile-dropdown-item" onClick={() => { setProfileOpen(false); navigate('/orders'); }}>
                    My Orders
                  </button>
                  <button className="profile-dropdown-item" onClick={() => { setProfileOpen(false); navigate('/cart'); }}>
                    My Cart
                  </button>
                  <button onClick={() => { setProfileOpen(false); handleLogout(); }} className="profile-dropdown-item logout-item">
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="nav-auth-buttons">
              <Link to="/login" className="nav-btn-login">
                Sign In
              </Link>
              <Link to="/signup" className="nav-btn-signup">
                Sign Up
              </Link>
            </div>
          )}
        </div>

      </div>
    </nav>
  );
};

export default Navbar;
