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

        return {
          id,
          productId: id,
          productName: matchingProduct?.productName || matchingProduct?.name || item.productName || item.name || id,
          sku: matchingProduct?.sku || item.sku || `SKU-${String(index + 1).padStart(3, '0')}`,
          category: matchingProduct?.category || item.category || 'General',
          price: Number(matchingProduct?.price || item.price || 0),
          stockQuantity,
        };
      });

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

  return (
    <AdminLayout title="Inventory" subtitle="Monitor availability and act on low stock">
      <div className="admin-panel-card">
        <div className="admin-panel-header">
          <div>
            <h3>Inventory Overview</h3>
            <p>Track stock levels and perform quantity adjustments.</p>
          </div>
          <input
            className="admin-input"
            placeholder="Search inventory"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        {error ? <div className="admin-error-banner">{error}</div> : null}

        {loading ? (
          <div className="admin-loading-state">Loading inventory…</div>
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
                  <th>Status</th>
                  <th>Actions</th>
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
                      <td>{item.productName}</td>
                      <td>{item.sku}</td>
                      <td>{item.category}</td>
                      <td>₹{item.price.toLocaleString('en-IN')}</td>
                      <td>
                        <div className="inventory-quantity-cell">
                          <button
                            type="button"
                            className="admin-icon-btn"
                            onClick={() => handleDecrement(item.id, item.stockQuantity)}
                          >
                            -
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
                        <button
                          type="button"
                          className="admin-primary-btn compact"
                          onClick={() => saveQuantity(item.productId || item.id, item.stockQuantity)}
                        >
                          Save
                        </button>
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
