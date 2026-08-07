import React from 'react';
import { Link } from 'react-router-dom';
import { useLoginForm } from '../../hooks/useLoginForm';
import '../../styles/Login.css';

const AdminLogin = () => {
  const {
    email,
    password,
    showPassword,
    setShowPassword,
    rememberMe,
    setRememberMe,
    isLoading,
    authError,
    fieldErrors,
    touched,
    handleBlur,
    handleChange,
    handleSubmit
  } = useLoginForm(true);

  return (
    <div className="login-page">
      <div className="login-shell">
        <section className="login-spotlight" aria-hidden="true">
          <div className="spotlight-badge">Admin Workspace</div>
          <h2>Manage products, inventory, orders and analytics.</h2>
          <p>
            Experience a modern storefront control center with real-time operations, inventory tracking,
            and complete store overview.
          </p>

          <div className="spotlight-stats">
            <div className="spotlight-stat">
              <strong>Admin</strong>
              <span>Portal Access</span>
            </div>
            <div className="spotlight-stat">
              <strong>Realtime</strong>
              <span>Updates</span>
            </div>
          </div>
        </section>

        <div className="login-container">
          <div className="login-card">
            <header className="login-header">
              <div className="brand-badge">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="brand-logo-icon">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <span>Admin Console</span>
              </div>
              <h1 className="login-title">Welcome back</h1>
              <p className="login-subtitle">Sign in with your administrator credentials to access the console.</p>
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
                    placeholder="admin@company.com"
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

              <div className="admin-minimal-auth-options" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', fontSize: '0.9rem', color: '#94a3b8' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    style={{ accentColor: '#ea580c' }}
                  />
                  <span>Remember Me</span>
                </label>
                <button
                  type="button"
                  style={{ background: 'none', border: 'none', color: '#fb923c', cursor: 'pointer', padding: 0, fontWeight: 700 }}
                  onClick={() => alert("Password resets are managed via Cognito Admin controls.")}
                >
                  Forgot Password?
                </button>
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
              <Link to="/login" style={{ color: '#fb923c', fontWeight: 700, textDecoration: 'none' }}>
                ← Customer Login
              </Link>
            </div>

            <footer className="login-extra-footer">
              <p className="footer-copy">&copy; 2026 E-Shop Console. All rights reserved.</p>
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
