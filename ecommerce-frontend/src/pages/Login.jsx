import React from 'react';
import { Link } from 'react-router-dom';
import { useLoginForm } from '../hooks/useLoginForm';
import '../styles/Login.css';

/**
 * Modern E-Commerce Login Page Component testing login added testing
 * Connects with AWS Cognito using AWS Amplify and provides a highly-aesthetic user experience.
 */
const Login = () => {
  const {
    email,
    password,
    showPassword,
    setShowPassword,
    isLoading,
    authError,
    fieldErrors,
    touched,
    handleBlur,
    handleChange,
    handleSubmit
  } = useLoginForm(false);

  return (
    <div className="login-page">
      <div className="login-shell">
        <section className="login-spotlight" aria-hidden="true">
          <div className="spotlight-badge">New season arrivals</div>
          <h2>Shop smarter with a premium cart-first journey.</h2>
          <p>
            Experience a modern storefront flow with curated picks, secure checkout,
            and a frictionless account experience.
          </p>

          <div className="spotlight-stats">
            <div className="spotlight-stat">
              <strong>24/7</strong>
              <span>Customer access</span>
            </div>
            <div className="spotlight-stat">
              <strong>1.2k+</strong>
              <span>Curated products</span>
            </div>
          </div>
        </section>

        <div className="login-container">
          <div className="login-card">
            <header className="login-header">
              <div className="brand-badge">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="brand-logo-icon">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
                <span>E-Shop Experience</span>
              </div>
              <h1 className="login-title">Welcome back</h1>
              <p className="login-subtitle">Sign in to continue shopping, tracking orders, and managing your cart.</p>
            </header>

            {authError && (
              <div className="card-error" role="alert">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="error-alert-icon">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{authError}</span>
              </div>
            )}

            <form className="login-form" onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <div className="form-label-row">
                  <label htmlFor="email" className="form-label">Email Address</label>
                </div>
                <div className="input-container">
                  <input
                    id="email"
                    type="email"
                    className={`form-input ${touched.email && fieldErrors.email ? 'is-invalid' : ''}`}
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    onBlur={() => handleBlur('email')}
                    disabled={isLoading}
                    required
                  />
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="input-icon">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </div>
                {touched.email && fieldErrors.email && (
                  <p className="field-error-text" id="email-error">{fieldErrors.email}</p>
                )}
              </div>

              <div className="form-group">
                <div className="form-label-row">
                  <label htmlFor="password" className="form-label">Password</label>
                </div>
                <div className="input-container">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    className={`form-input form-input-password ${touched.password && fieldErrors.password ? 'is-invalid' : ''}`}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    onBlur={() => handleBlur('password')}
                    disabled={isLoading}
                    required
                  />
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="input-icon">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(prev => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    tabIndex={0}
                  >
                    {showPassword ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="toggle-icon">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="toggle-icon">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
                {touched.password && fieldErrors.password && (
                  <p className="field-error-text" id="password-error">{fieldErrors.password}</p>
                )}
              </div>

              <button type="submit" className="login-btn" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <div className="spinner" aria-hidden="true"></div>
                    <span className="btn-text">Signing in...</span>
                  </>
                ) : (
                  <span className="btn-text">Sign In</span>
                )}
              </button>
            </form>

            <div className="login-signup-redirect">
              <span>Don't have an account? </span>
              <Link to="/signup" className="redirect-link">Sign Up</Link>
            </div>

            <footer className="login-extra-footer">
              <span className="footer-link">Conditions of Use</span>
              <span className="footer-divider">|</span>
              <span className="footer-link">Privacy Notice</span>
              <span className="footer-divider">|</span>
              <span className="footer-link">Help</span>
              <p className="footer-copy">&copy; 2026 E-Shop Experience. All rights reserved.</p>
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
