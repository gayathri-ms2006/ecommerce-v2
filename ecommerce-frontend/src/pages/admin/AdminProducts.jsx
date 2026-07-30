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
    setEditingId(product.id);
    setFormData({
      productName: product.productName,
      description: product.description,
      category: product.category,
      price: product.price,
      discount: product.discount,
      stockQuantity: product.stockQuantity,
      imageUrl: product.imageUrl,
      status: product.status,
    });
  };

  const handleDelete = async (productId) => {
    try {
      await deleteAdminProduct(productId);
      setProducts((prev) => prev.filter((product) => product.id !== productId && product.productId !== productId));
    } catch (err) {
      setError(err.message || 'Unable to delete product');
    }
  };

  return (
    <AdminLayout title="Products" subtitle="Create, edit, and manage your catalog">
      <div className="admin-panel-card">
        <div className="admin-panel-header">
          <div>
            <h3>Product Catalog</h3>
            <p>Search and manage every product in your storefront.</p>
          </div>
          <div className="admin-toolbar">
            <input
              className="admin-input"
              placeholder="Search products"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <select className="admin-input" value={filter} onChange={(event) => setFilter(event.target.value)}>
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="out of stock">Out of Stock</option>
            </select>
          </div>
        </div>

        <form className="admin-form-grid" onSubmit={handleSubmit}>
          <label className="admin-field">
            <span>Product Name</span>
            <input name="productName" value={formData.productName} onChange={handleChange} required />
          </label>
          <label className="admin-field">
            <span>Category</span>
            <input name="category" value={formData.category} onChange={handleChange} required />
          </label>
          <label className="admin-field">
            <span>Price</span>
            <input name="price" type="number" value={formData.price} onChange={handleChange} required />
          </label>
          <label className="admin-field">
            <span>Discount (%)</span>
            <input name="discount" type="number" value={formData.discount} onChange={handleChange} />
          </label>
          <label className="admin-field">
            <span>Stock Quantity</span>
            <input name="stockQuantity" type="number" value={formData.stockQuantity} onChange={handleChange} required />
          </label>
          <label className="admin-field">
            <span>Status</span>
            <select name="status" value={formData.status} onChange={handleChange}>
              <option value="Active">Active</option>
              <option value="Draft">Draft</option>
              <option value="Out of Stock">Out of Stock</option>
            </select>
          </label>
          <label className="admin-field full-width">
            <span>Description</span>
            <textarea name="description" value={formData.description} onChange={handleChange} rows="3" />
          </label>
          <label className="admin-field full-width">
            <span>Image URL</span>
            <input name="imageUrl" value={formData.imageUrl} onChange={handleChange} />
          </label>

          {error ? <div className="admin-error-banner full-width">{error}</div> : null}

          <div className="admin-action-row full-width">
            <button type="submit" className="admin-primary-btn">{editingId ? 'Save Changes' : 'Add Product'}</button>
            <button type="button" className="admin-secondary-btn" onClick={resetForm}>Reset</button>
          </div>
        </form>
      </div>

      <div className="admin-panel-card">
        <div className="admin-panel-header">
          <div>
            <h3>Manage Products</h3>
            <p>View and quickly update your catalog.</p>
          </div>
        </div>

        {loading ? (
          <div className="admin-loading-state">Loading products…</div>
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
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <div className="table-product-cell">
                        <strong>{product.productName}</strong>
                        <span>{product.sku}</span>
                      </div>
                    </td>
                    <td>{product.category}</td>
                    <td>₹{product.price.toLocaleString('en-IN')}</td>
                    <td>{product.stockQuantity}</td>
                    <td>
                      <span className={`status-pill ${product.stockQuantity === 0 ? 'danger' : product.stockQuantity < 8 ? 'warning' : 'success'}`}>
                        {product.status}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button type="button" className="admin-link-button" onClick={() => handleEdit(product)}>Edit</button>
                        <button type="button" className="admin-link-button danger" onClick={() => handleDelete(product.id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminProducts;
