import React, { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { createAdminProduct, deleteAdminProduct, fetchAdminProducts, updateAdminProduct } from '../../services/admin';
import '../../styles/Admin.css';

const emptyForm = {
  productName: '',
  description: '',
  category: 'Electronics',
  price: '',
  discount: '',
  stockQuantity: '',
  imageUrl: '',
  status: 'Active',
};

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState(emptyForm);
  const [editingId, setEditingId] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await fetchAdminProducts();
      setProducts(data);
    } catch (err) {
      setError(err.message || 'Unable to fetch products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = `${product.productName} ${product.category}`.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = filter === 'all' || product.status?.toLowerCase() === filter.toLowerCase();
      return matchesSearch && matchesFilter;
    });
  }, [products, search, filter]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData(emptyForm);
    setEditingId('');
    setDrawerOpen(false);
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!formData.productName || !formData.price || !formData.stockQuantity) {
      setError('Product name, price, and stock quantity are required.');
      return;
    }

    try {
      if (editingId) {
        const updated = await updateAdminProduct(editingId, {
          ...formData,
          price: Number(formData.price),
          discount: Number(formData.discount || 0),
          stockQuantity: Number(formData.stockQuantity),
        });
        setProducts((prev) => prev.map((product) => (product.id === editingId || product.productId === editingId ? updated : product)));
      } else {
        const created = await createAdminProduct({
          ...formData,
          price: Number(formData.price),
          discount: Number(formData.discount || 0),
          stockQuantity: Number(formData.stockQuantity),
        });
        setProducts((prev) => [created, ...prev]);
      }
      resetForm();
    } catch (err) {
      setError(err.message || 'Unable to save product');
    }
  };

  const handleEdit = (product) => {
    setEditingId(product.id || product.productId);
    setFormData({
      productName: product.productName || product.name,
      description: product.description || '',
      category: product.category || 'General',
      price: product.price || '',
      discount: product.discount || '',
      stockQuantity: product.stockQuantity || '',
      imageUrl: product.imageUrl || '',
      status: product.status || 'Active',
    });
    setDrawerOpen(true);
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await deleteAdminProduct(productId);
      setProducts((prev) => prev.filter((product) => product.id !== productId && product.productId !== productId));
    } catch (err) {
      setError(err.message || 'Unable to delete product');
    }
  };

  const openAddDrawer = () => {
    setFormData(emptyForm);
    setEditingId('');
    setDrawerOpen(true);
  };

  return (
    <AdminLayout title="Products" subtitle="Create, edit, and manage your catalog">
      <div className="admin-panel-card">
        <div className="admin-panel-header">
          <div>
            <h3>Product Catalog</h3>
            <p>Manage and search every product in your catalog.</p>
          </div>
          <div className="admin-toolbar">
            <input
              className="admin-input"
              placeholder="Search products..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <select className="admin-input" value={filter} onChange={(event) => setFilter(event.target.value)}>
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="out of stock">Out of Stock</option>
            </select>
            <button type="button" className="admin-primary-btn" onClick={openAddDrawer}>
              <svg style={{ width: 16, height: 16 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>Add Product</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="admin-loading-state">Loading products…</div>
        ) : filteredProducts.length === 0 ? (
          <div className="admin-empty-chart">No products found matching your filter</div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id || product.productId}>
                    <td>
                      <div className="table-product-cell">
                        <div className="table-product-img-wrapper">
                          {product.imageUrl ? (
                            <img src={product.imageUrl} alt={product.productName} className="table-product-img" />
                          ) : (
                            <div className="table-product-img-placeholder">📦</div>
                          )}
                        </div>
                        <div className="table-product-info">
                          <strong>{product.productName || product.name}</strong>
                          <span>SKU: {product.sku || product.productId || product.id}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="status-pill info" style={{ backgroundColor: '#f1f5f9', color: '#475569' }}>
                        {product.category || 'General'}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700 }}>₹{Number(product.price || 0).toLocaleString('en-IN')}</td>
                    <td>
                      <span style={{ fontWeight: 600, color: product.stockQuantity === 0 ? '#ef4444' : product.stockQuantity <= 10 ? '#f59e0b' : 'inherit' }}>
                        {product.stockQuantity} units
                      </span>
                    </td>
                    <td>
                      <span className={`status-pill ${product.status?.toLowerCase() === 'active' ? 'success' : product.status?.toLowerCase() === 'draft' ? 'warning' : 'danger'}`}>
                        {product.status || 'Active'}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions" style={{ justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          className="admin-secondary-btn compact"
                          onClick={() => handleEdit(product)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="admin-secondary-btn compact danger"
                          onClick={() => handleDelete(product.id || product.productId)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Slide-out Add/Edit Product Drawer */}
      {drawerOpen && (
        <div
          className="admin-drawer-overlay"
          onClick={(e) => { if (e.target.className === 'admin-drawer-overlay') resetForm(); }}
          onKeyDown={(e) => { if (e.target.className === 'admin-drawer-overlay' && (e.key === 'Enter' || e.key === ' ')) resetForm(); }}
          role="button"
          tabIndex={0}
        >
          <div className="admin-drawer">
            <div className="admin-drawer-header">
              <h3>{editingId ? 'Edit Product' : 'Add New Product'}</h3>
              <button type="button" className="admin-drawer-close" onClick={resetForm} aria-label="Close drawer">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="admin-drawer-content">
              <form id="drawer-product-form" className="admin-form-grid" onSubmit={handleSubmit}>
                <label className="admin-field full-width">
                  <span>Product Title *</span>
                  <input
                    name="productName"
                    value={formData.productName}
                    onChange={handleChange}
                    placeholder="Enter product title"
                    required
                  />
                </label>
                
                <label className="admin-field">
                  <span>Category *</span>
                  <input
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    placeholder="Category (e.g. Mobiles)"
                    required
                  />
                </label>

                <label className="admin-field">
                  <span>Status</span>
                  <select name="status" value={formData.status} onChange={handleChange}>
                    <option value="Active">Active</option>
                    <option value="Draft">Draft</option>
                    <option value="Out of Stock">Out of Stock</option>
                  </select>
                </label>

                <label className="admin-field">
                  <span>Price (INR) *</span>
                  <input
                    name="price"
                    type="number"
                    value={formData.price}
                    onChange={handleChange}
                    placeholder="Price"
                    min="0"
                    required
                  />
                </label>

                <label className="admin-field">
                  <span>Discount (%)</span>
                  <input
                    name="discount"
                    type="number"
                    value={formData.discount}
                    onChange={handleChange}
                    placeholder="Discount percentage"
                    min="0"
                    max="100"
                  />
                </label>

                <label className="admin-field full-width">
                  <span>Stock Quantity *</span>
                  <input
                    name="stockQuantity"
                    type="number"
                    value={formData.stockQuantity}
                    onChange={handleChange}
                    placeholder="Available stock quantity"
                    min="0"
                    required
                  />
                </label>

                <label className="admin-field full-width">
                  <span>Description</span>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Product detail copy description..."
                    rows="3"
                  />
                </label>

                <label className="admin-field full-width">
                  <span>Image URL</span>
                  <input
                    name="imageUrl"
                    value={formData.imageUrl}
                    onChange={handleChange}
                    placeholder="Paste image URL here"
                  />
                  <div className="image-preview-box">
                    {formData.imageUrl ? (
                      <img
                        src={formData.imageUrl}
                        alt="Preview"
                        className="image-preview-actual"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'block';
                        }}
                      />
                    ) : null}
                    <span className="image-preview-placeholder" style={{ display: formData.imageUrl ? 'none' : 'block' }}>
                      No Image Preview
                    </span>
                  </div>
                </label>

                {error ? <div className="admin-error-banner full-width">{error}</div> : null}
              </form>
            </div>

            <div className="admin-drawer-footer">
              <button type="button" className="admin-secondary-btn" onClick={resetForm}>
                Cancel
              </button>
              <button type="submit" form="drawer-product-form" className="admin-primary-btn">
                {editingId ? 'Save Changes' : 'Publish Product'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminProducts;
