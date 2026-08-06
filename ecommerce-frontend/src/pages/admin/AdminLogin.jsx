import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInUser, isAdmin } from '../../services/auth';
import '../../styles/Admin.css';

const AdminLogin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await signInUser(formData.email, formData.password);

      if (result?.isSignedIn && isAdmin()) {
        navigate('/admin/dashboard', { replace: true });
        return;
      }

      setError('Access denied. Only admin accounts can sign in here.');
    } catch (err) {
      setError(err.message || 'Unable to sign in. Please verify your admin credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-auth-page">
      {/* Left Spotlight Banner Panel */}
      <div className="admin-auth-spotlight">
        <div className="spotlight-brand-block">
          <div className="spotlight-brand-logo">E</div>
          <div className="spotlight-brand-text">
            <h2>E-Shop Admin</h2>
            <p>Seller Command Center</p>
          </div>
        </div>

        <div className="spotlight-hero-text">
          <h1>Enterprise Commerce Manager</h1>
          <p>
            Gain unified control of your products, live stock inventories, client sales metrics,
            and shipping logistics on the E-Shop platform.
          </p>
        </div>

        <div className="spotlight-features-list">
          <div className="spotlight-feature-card">
            <span className="feature-check-icon">✓</span>
            <div className="feature-desc">
              <strong>Product Management</strong>
              <span>Update details, customize pricing, and manage discounts dynamically.</span>
            </div>
          </div>
          <div className="spotlight-feature-card">
            <span className="feature-check-icon">✓</span>
            <div className="feature-desc">
              <strong>Inventory Tracking</strong>
              <span>Real-time stock alerts and stepper controls for immediate corrections.</span>
            </div>
          </div>
          <div className="spotlight-feature-card">
            <span className="feature-check-icon">✓</span>
            <div className="feature-desc">
              <strong>Order Management</strong>
              <span>Monitor shipping stages and execute customer refund/cancellation claims.</span>
            </div>
          </div>
          <div className="spotlight-feature-card">
            <span className="feature-check-icon">✓</span>
            <div className="feature-desc">
              <strong>Customer Insights</strong>
              <span>Analyze checkout conversion funnels and detailed user profiles.</span>
            </div>
          </div>
        </div>

        <div className="spotlight-footer-meta">
          <span>Version 2.4.0 (Enterprise Suite)</span>
          <span>© 2026 E-Shop Inc.</span>
        </div>
      </div>

      {/* Right Login Form Panel */}
      <div className="admin-auth-form-side">
        <div className="admin-auth-card">
          <header className="admin-auth-card-header">
            <span className="secure-badge">🛡️ SECURE ENCRYPTED ACCESS</span>
            <h1>Admin Login</h1>
            <p>Welcome back! Sign in to access your administrative dashboard.</p>
          </header>

          <form className="admin-auth-form" onSubmit={handleSubmit}>
            <div className="admin-auth-field-group">
              <label className="admin-auth-field">
                <span>Email Address</span>
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="admin@company.com"
                  required
                />
              </label>

              <label className="admin-auth-field">
                <span>Password</span>
                <input
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                />
              </label>
            </div>

            <div className="admin-auth-options-row">
              <label className="remember-me-checkbox-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Remember me</span>
              </label>
              <button
                type="button"
                className="forgot-password-link-btn"
                onClick={() => alert("Password reset workflow is managed via Cognito Admin controls.")}
              >
                Forgot Password?
              </button>
            </div>

            {error ? <div className="admin-auth-error-banner">{error}</div> : null}

            <button type="submit" className="admin-auth-submit-btn" disabled={loading}>
              {loading ? 'Verifying Credentials...' : 'Sign In to Dashboard'}
            </button>
          </form>

          <footer className="admin-auth-card-footer">
            <Link to="/login" className="customer-portal-link">
              Customer Portal Login →
            </Link>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
