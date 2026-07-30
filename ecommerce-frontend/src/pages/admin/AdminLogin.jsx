import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInUser, isAdmin } from '../../services/auth';
import '../../styles/Admin.css';

const AdminLogin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
      <div className="admin-auth-card">
        <div className="admin-auth-header">
          <div className="admin-brand-mark">E</div>
          <div>
            <p className="eyebrow">Secure Access</p>
            <h1>Admin Login</h1>
            <p>Manage products, inventory, orders, and customers in one place.</p>
          </div>
        </div>

        <form className="admin-form" onSubmit={handleSubmit}>
          <label className="admin-field">
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

          <label className="admin-field">
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

          {error ? <div className="admin-error-banner">{error}</div> : null}

          <button type="submit" className="admin-primary-btn" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
