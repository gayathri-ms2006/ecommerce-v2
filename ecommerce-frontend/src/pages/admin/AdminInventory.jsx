import React, { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { fetchInventory, updateInventory } from '../../services/inventory';
import { fetchProductsList } from '../../services/products';
import '../../styles/Admin.css';

const AdminInventory = () => {
  const [inventory, setInventory] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [draftQuantities, setDraftQuantities] = useState({});

  const getStockStatus = (quantity) => {
    const qty = Number(quantity || 0);
    if (qty === 0) return 'Out Of Stock';
    if (qty <= 10) return 'Low Stock';
    return 'In Stock';
  };

  const getStatusBadgeClass = (quantity) => {
    const qty = Number(quantity || 0);
    if (qty === 0) return 'danger';
    if (qty <= 10) return 'warning';
    return 'success';
  };

  const loadInventory = async () => {
    setLoading(true);
    setError('');
    try {
      const [inventoryRes, productsRes] = await Promise.all([
        fetchInventory(),
        fetchProductsList()
      ]);

      const rawInventory = Array.isArray(inventoryRes)
        ? inventoryRes
        : inventoryRes?.items || inventoryRes?.data || inventoryRes?.inventory || [];

      const rawProducts = Array.isArray(productsRes)
        ? productsRes
        : productsRes?.items || productsRes?.data || [];

      const normalized = rawInventory.map((item, index) => {
        const id = item.productId || item.id || `inv-${index}`;
        const stockQuantity = Number(
          item.stockQuantity ?? item.quantity ?? item.availableStock ?? item.stock ?? 0
        );

        // Match against product catalog IDs
        const matchingProduct = rawProducts.find(
          (p) => String(p.productId || p.id) === String(id)
        );

        if (!matchingProduct) {
          return null;
        }

        return {
          id,
          productId: id,
          productName: matchingProduct.productName || matchingProduct.name || id,
          sku: matchingProduct.sku || item.sku || `SKU-${String(index + 1).padStart(3, '0')}`,
          category: matchingProduct.category || item.category || 'General',
          price: Number(matchingProduct.price || 0),
          imageUrl: matchingProduct.imageUrl || '',
          stockQuantity,
        };
      }).filter(Boolean);

      setInventory(normalized);
    } catch (err) {
      setError(err.message || 'Unable to load inventory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const filteredInventory = useMemo(() => {
    return inventory.filter((item) =>
      `${item.productName} ${item.category}`.toLowerCase().includes(search.toLowerCase())
    );
  }, [inventory, search]);

  const handleQuantityInput = (productId, value) => {
    setDraftQuantities((prev) => ({ ...prev, [productId]: value }));
  };

  const handleIncrement = (productId, currentStock) => {
    setDraftQuantities((prev) => {
      const currentVal = prev[productId] !== undefined ? Number(prev[productId]) : currentStock;
      return { ...prev, [productId]: currentVal + 1 };
    });
  };

  const handleDecrement = (productId, currentStock) => {
    setDraftQuantities((prev) => {
      const currentVal = prev[productId] !== undefined ? Number(prev[productId]) : currentStock;
      return { ...prev, [productId]: Math.max(0, currentVal - 1) };
    });
  };

  const saveQuantity = async (productId, currentStock) => {
    setError('');
    const draftVal = draftQuantities[productId];
    const nextQuantity =
      draftVal !== undefined && draftVal !== '' ? Math.max(0, Number(draftVal)) : currentStock;

    try {
      await updateInventory(productId, nextQuantity);
      setDraftQuantities((prev) => {
        const next = { ...prev };
        delete next[productId];
        return next;
      });
      await loadInventory();
    } catch (err) {
      setError(err.message || 'Unable to update stock');
    }
  };

  // Stats computation for stock levels
  const stats = useMemo(() => {
    const total = inventory.length;
    const outOfStock = inventory.filter(item => item.stockQuantity === 0).length;
    const lowStock = inventory.filter(item => item.stockQuantity > 0 && item.stockQuantity <= 10).length;
    const inStock = total - outOfStock - lowStock;

    return { total, outOfStock, lowStock, inStock };
  }, [inventory]);

  return (
    <AdminLayout title="Inventory" subtitle="Monitor availability and act on low stock">
      {/* Mini Stats Summary */}
      <div className="admin-kpi-grid" style={{ marginBottom: '24px' }}>
        <div className="admin-stat-card accent-green">
          <div className="stat-card-label">In Stock Items</div>
          <div className="stat-card-value">{stats.inStock}</div>
          <div className="stat-card-subtext">Optimal stock count</div>
        </div>
        <div className="admin-stat-card accent-warning">
          <div className="stat-card-label">Low Stock Alerts</div>
          <div className="stat-card-value">{stats.lowStock}</div>
          <div className="stat-card-subtext">Less than 10 units remaining</div>
        </div>
        <div className="admin-stat-card accent-purple">
          <div className="stat-card-label">Out of Stock Items</div>
          <div className="stat-card-value" style={{ color: '#ef4444' }}>{stats.outOfStock}</div>
          <div className="stat-card-subtext">Inactive on store page</div>
        </div>
      </div>

      <div className="admin-panel-card">
        <div className="admin-panel-header">
          <div>
            <h3>Stock Health Adjustments</h3>
            <p>Track levels, use steppers, and save quantities directly.</p>
          </div>
          <div className="admin-toolbar">
            <input
              className="admin-input"
              placeholder="Search by name, SKU or category..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>

        {error ? <div className="admin-error-banner" style={{ marginBottom: '20px' }}>{error}</div> : null}

        {loading ? (
          <div className="admin-loading-state">Loading inventory…</div>
        ) : filteredInventory.length === 0 ? (
          <div className="admin-empty-chart">No inventory items match search criteria</div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Available Qty</th>
                  <th>Stock Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInventory.map((item) => {
                  const currentQty =
                    draftQuantities[item.id] !== undefined
                      ? draftQuantities[item.id]
                      : item.stockQuantity;
                  const displayQty = currentQty === '' ? '' : Number(currentQty);

                  return (
                    <tr key={item.id}>
                      <td>
                        <div className="table-product-cell">
                          <div className="table-product-img-wrapper">
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt={item.productName} className="table-product-img" />
                            ) : (
                              <div className="table-product-img-placeholder">📦</div>
                            )}
                          </div>
                          <div className="table-product-info">
                            <strong>{item.productName}</strong>
                          </div>
                        </div>
                      </td>
                      <td>
                        <code style={{ fontSize: '11px', color: '#475569' }}>{item.sku}</code>
                      </td>
                      <td>
                        <span className="status-pill info" style={{ backgroundColor: '#f1f5f9', color: '#475569' }}>
                          {item.category}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>₹{item.price.toLocaleString('en-IN')}</td>
                      <td>
                        <div className="inventory-quantity-cell">
                          <button
                            type="button"
                            className="admin-icon-btn"
                            onClick={() => handleDecrement(item.id, item.stockQuantity)}
                            aria-label="Decrease stock"
                          >
                            −
                          </button>
                          <input
                            className="admin-quantity-input"
                            value={displayQty}
                            onChange={(event) => handleQuantityInput(item.id, event.target.value)}
                            type="number"
                            min="0"
                          />
                          <button
                            type="button"
                            className="admin-icon-btn"
                            onClick={() => handleIncrement(item.id, item.stockQuantity)}
                            aria-label="Increase stock"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td>
                        <span className={`status-pill ${getStatusBadgeClass(displayQty)}`}>
                          {getStockStatus(displayQty)}
                        </span>
                      </td>
                      <td>
                        <div className="table-actions" style={{ justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            className="admin-primary-btn compact"
                            onClick={() => saveQuantity(item.productId || item.id, item.stockQuantity)}
                            disabled={draftQuantities[item.id] === undefined}
                            style={{
                              opacity: draftQuantities[item.id] === undefined ? 0.6 : 1,
                              cursor: draftQuantities[item.id] === undefined ? 'not-allowed' : 'pointer'
                            }}
                          >
                            Save
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminInventory;
