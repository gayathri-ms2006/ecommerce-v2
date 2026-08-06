import React, { useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import '../../styles/Admin.css';

const AdminSettings = () => {
  const [activeTab, setActiveTab] = useState('store');
  const [toast, setToast] = useState('');

  // Local state for settings inputs
  const [storeInfo, setStoreInfo] = useState({
    name: 'E-Shop Premium',
    email: 'operations@e-shop.com',
    phone: '+91 98765 43210',
    currency: 'INR',
    address: '123 E-Commerce Blvd, Tech Park, Chennai, India',
  });

  const [preferences, setPreferences] = useState({
    timezone: 'Asia/Kolkata (GMT+05:30)',
    language: 'en-US',
    weightUnit: 'kg',
    threshold: 10,
  });

  const [notifications, setNotifications] = useState({
    orderPlaced: true,
    lowStock: true,
    weeklyReport: false,
    customerInquiry: true,
  });

  const [security, setSecurity] = useState({
    enable2FA: false,
    cognitoVerify: true,
    apiKeyLogs: false,
  });

  const handleSave = (e) => {
    e.preventDefault();
    setToast('Settings saved successfully!');
    setTimeout(() => setToast(''), 3000);
  };

  return (
    <AdminLayout title="Settings" subtitle="Configure storefront details and preferences">
      {toast && (
        <div className="toast-notification-banner toast-success" style={{ position: 'fixed', top: '24px', right: '24px', zIndex: 1100 }}>
          <span>{toast}</span>
        </div>
      )}

      <div className="settings-layout">
        {/* Settings Tab Selector */}
        <aside className="settings-sidebar-tabs">
          <button
            type="button"
            className={`settings-tab-btn ${activeTab === 'store' ? 'active' : ''}`}
            onClick={() => setActiveTab('store')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <span>Store Profile</span>
          </button>
          <button
            type="button"
            className={`settings-tab-btn ${activeTab === 'preferences' ? 'active' : ''}`}
            onClick={() => setActiveTab('preferences')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            <span>Preferences</span>
          </button>
          <button
            type="button"
            className={`settings-tab-btn ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('notifications')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <span>Notifications</span>
          </button>
          <button
            type="button"
            className={`settings-tab-btn ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span>Security</span>
          </button>
        </aside>

        {/* Settings Form panel */}
        <div className="admin-panel-card" style={{ flex: 1 }}>
          <form onSubmit={handleSave} className="settings-section-form">
            {activeTab === 'store' && (
              <>
                <div className="settings-card-header">
                  <h4>Store Information</h4>
                  <p>General setup details regarding your digital storefront.</p>
                </div>
                <div className="admin-field">
                  <span>Store Name</span>
                  <input
                    type="text"
                    value={storeInfo.name}
                    onChange={(e) => setStoreInfo({ ...storeInfo, name: e.target.value })}
                    required
                  />
                </div>
                <div className="settings-row">
                  <div className="admin-field">
                    <span>Operations Contact Email</span>
                    <input
                      type="email"
                      value={storeInfo.email}
                      onChange={(e) => setStoreInfo({ ...storeInfo, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="admin-field">
                    <span>Support Hotline Phone</span>
                    <input
                      type="text"
                      value={storeInfo.phone}
                      onChange={(e) => setStoreInfo({ ...storeInfo, phone: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="admin-field">
                  <span>Base Store Currency</span>
                  <select
                    value={storeInfo.currency}
                    onChange={(e) => setStoreInfo({ ...storeInfo, currency: e.target.value })}
                  >
                    <option value="INR">Indian Rupee (₹)</option>
                    <option value="USD">US Dollar ($)</option>
                    <option value="EUR">Euro (€)</option>
                    <option value="GBP">British Pound (£)</option>
                  </select>
                </div>
                <div className="admin-field">
                  <span>Fulfillment Center Address</span>
                  <textarea
                    value={storeInfo.address}
                    onChange={(e) => setStoreInfo({ ...storeInfo, address: e.target.value })}
                    rows="3"
                  />
                </div>
              </>
            )}

            {activeTab === 'preferences' && (
              <>
                <div className="settings-card-header">
                  <h4>Localization Preferences</h4>
                  <p>Control defaults for timezone settings, standard units, and thresholds.</p>
                </div>
                <div className="admin-field">
                  <span>Operating Timezone</span>
                  <select
                    value={preferences.timezone}
                    onChange={(e) => setPreferences({ ...preferences, timezone: e.target.value })}
                  >
                    <option value="Asia/Kolkata (GMT+05:30)">Asia/Kolkata (GMT+05:30)</option>
                    <option value="UTC">Coordinated Universal Time (UTC)</option>
                    <option value="America/New_York (GMT-05:00)">America/New_York (GMT-05:00)</option>
                  </select>
                </div>
                <div className="settings-row">
                  <div className="admin-field">
                    <span>Default Language</span>
                    <select
                      value={preferences.language}
                      onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
                    >
                      <option value="en-US">English (United States)</option>
                      <option value="en-IN">English (India)</option>
                      <option value="hi-IN">Hindi (India)</option>
                    </select>
                  </div>
                  <div className="admin-field">
                    <span>Standard Weight Unit</span>
                    <select
                      value={preferences.weightUnit}
                      onChange={(e) => setPreferences({ ...preferences, weightUnit: e.target.value })}
                    >
                      <option value="kg">Kilograms (kg)</option>
                      <option value="lb">Pounds (lb)</option>
                      <option value="g">Grams (g)</option>
                    </select>
                  </div>
                </div>
                <div className="admin-field">
                  <span>Low Stock Alert Threshold</span>
                  <input
                    type="number"
                    value={preferences.threshold}
                    onChange={(e) => setPreferences({ ...preferences, threshold: Number(e.target.value) })}
                    min="1"
                    max="100"
                  />
                </div>
              </>
            )}

            {activeTab === 'notifications' && (
              <>
                <div className="settings-card-header">
                  <h4>Communication Channels</h4>
                  <p>Choose when you get pinged regarding catalog operations.</p>
                </div>
                <label className="settings-checkbox-label">
                  <input
                    type="checkbox"
                    checked={notifications.orderPlaced}
                    onChange={(e) => setNotifications({ ...notifications, orderPlaced: e.target.checked })}
                  />
                  <div>
                    <span>Order Placement Notifications</span>
                    <p>Alert me instantly via email when a customer checks out an active basket.</p>
                  </div>
                </label>
                <label className="settings-checkbox-label">
                  <input
                    type="checkbox"
                    checked={notifications.lowStock}
                    onChange={(e) => setNotifications({ ...notifications, lowStock: e.target.checked })}
                  />
                  <div>
                    <span>Low Stock Alerts</span>
                    <p>Trigger alerts when product counts drop below the low stock threshold.</p>
                  </div>
                </label>
                <label className="settings-checkbox-label">
                  <input
                    type="checkbox"
                    checked={notifications.weeklyReport}
                    onChange={(e) => setNotifications({ ...notifications, weeklyReport: e.target.checked })}
                  />
                  <div>
                    <span>Weekly Summary digest</span>
                    <p>Deliver summary report attachments showing AOV, CLV, and sales trends every Monday.</p>
                  </div>
                </label>
                <label className="settings-checkbox-label">
                  <input
                    type="checkbox"
                    checked={notifications.customerInquiry}
                    onChange={(e) => setNotifications({ ...notifications, customerInquiry: e.target.checked })}
                  />
                  <div>
                    <span>Customer Inquiries</span>
                    <p>Route customer questions and support logs straight to support hotlines.</p>
                  </div>
                </label>
              </>
            )}

            {activeTab === 'security' && (
              <>
                <div className="settings-card-header">
                  <h4>Access & Identity Security</h4>
                  <p>Configure security models, MFA rules, and Cognito properties.</p>
                </div>
                
                <label className="toggle-switch-label">
                  <div className="toggle-switch-text">
                    <strong>Enable Multi-Factor Authentication (MFA)</strong>
                    <span>Require secondary device OTP tokens upon dashboard auth sessions.</span>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle-switch-input"
                    checked={security.enable2FA}
                    onChange={(e) => setSecurity({ ...security, enable2FA: e.target.checked })}
                  />
                </label>

                <label className="toggle-switch-label">
                  <div className="toggle-switch-text">
                    <strong>Cognito Verified Emails Only</strong>
                    <span>Block login attempts from customers who haven't completed verification.</span>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle-switch-input"
                    checked={security.cognitoVerify}
                    onChange={(e) => setSecurity({ ...security, cognitoVerify: e.target.checked })}
                  />
                </label>

                <label className="toggle-switch-label">
                  <div className="toggle-switch-text">
                    <strong>Enable API Keys Logs</strong>
                    <span>Store detail records of Lambda events, API Gateway headers, and keys.</span>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle-switch-input"
                    checked={security.apiKeyLogs}
                    onChange={(e) => setSecurity({ ...security, apiKeyLogs: e.target.checked })}
                  />
                </label>
              </>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
              <button type="submit" className="admin-primary-btn">
                Save Settings
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;
