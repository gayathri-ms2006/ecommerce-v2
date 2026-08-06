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
    <div className="admin-minimal-auth-page">
      <div className="admin-minimal-auth-card">
        {/* Logo and Header Block */}
        <header className="admin-minimal-auth-header">
          <div className="minimal-brand-logo">E-Shop</div>
          <h1>Admin Portal</h1>
          <p>Manage products, inventory, orders and analytics.</p>
        </header>

        {/* Login Form */}
        <form className="admin-minimal-auth-form" onSubmit={handleSubmit}>
          <div className="admin-minimal-auth-fields">
            <label className="admin-minimal-auth-field">
              <span>Email</span>
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="admin@company.com"
                required
              />
            </label>

            <label className="admin-minimal-auth-field">
              <span>Password</span>
              <input
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter password"
                required
              />
            </label>
          </div>

          {/* Options Row: Remember Me & Forgot Password */}
          <div className="admin-minimal-auth-options">
            <label className="minimal-checkbox-label">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>Remember Me</span>
            </label>
            <button
              type="button"
              className="minimal-forgot-btn"
              onClick={() => alert("Password resets are managed via Cognito Admin controls.")}
            >
              Forgot Password?
            </button>
          </div>

          {error ? <div className="admin-minimal-error-banner">{error}</div> : null}

          {/* Sign In Button */}
          <button type="submit" className="admin-minimal-auth-btn" disabled={loading}>
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        {/* Footer Link back to Customer Portal */}
        <footer className="admin-minimal-auth-footer">
          <Link to="/login" className="minimal-customer-link">
            ← Customer Login
          </Link>
        </footer>
      </div>
    </div>
  );
};

export default AdminLogin;
