import React from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import '../../styles/Admin.css';

const AdminSettings = () => {
  return (
    <AdminLayout title="Settings" subtitle="Configure the storefront and business preferences">
      <div className="admin-panel-card">
        <h3>Admin Settings</h3>
        <p className="admin-settings-copy">This section is ready for future integrations such as tax rules, shipping policies, notifications, and storefront preferences.</p>
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;
