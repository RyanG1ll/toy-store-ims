import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import '../Products/ProductModal.css';
import './Orders.css';
import Orders from './Orders';

function OrderModal({ onClose, onSave }) {
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({
    supplier_id: '',
    expected_delivery: '',
    notes: '',
  });
  const [items, setItems] = useState([{ product_id: '', quantity: '', unit_cost: '' }]);
  const [errors, setErrors] = useState({});
  const modalRef = useRef(null);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [supRes, prodRes] = await Promise.all([
          api.get('/suppliers'),
          api.get('/products'),
        ]);
        setSuppliers(supRes.data);
        setProducts(prodRes.data);
      } catch (err) {
        console.error('Failed to load form options', err);
      }
    };
    fetchOptions();
  }, []);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  useEffect(() => {
    if (modalRef.current) modalRef.current.focus();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;

    // Auto-fill cost price when product is selected
    if (field === 'product_id') {
      const product = products.find((p) => p.product_id === parseInt(value));
      if (product) {
        updated[index].unit_cost = product.cost_price;
      }
    }

    setItems(updated);
  };

  const addItem = () => {
    setItems([...items, { product_id: '', quantity: '', unit_cost: '' }]);
  };

  const removeItem = (index) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => {
      return sum + (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_cost) || 0);
    }, 0).toFixed(2);
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.supplier_id) newErrors.supplier_id = 'Supplier is required';
    const validItems = items.filter((item) => item.product_id && item.quantity && item.unit_cost);
    if (validItems.length === 0) newErrors.items = 'At least one item is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

    const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      const payload = {
        ...formData,
        items: items.filter((item) => item.product_id && item.quantity && item.unit_cost),
      };
      await api.post('/orders', payload);
      onSave();
    } catch (err) {
      console.error('Failed to create order', err);
      setErrors({ submit: 'Failed to create order. Please try again.' });
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true"
         aria-label="Create new order">
      <div className="modal-content modal-wide" onClick={(e) => e.stopPropagation()}
           ref={modalRef} tabIndex={-1}>
        <div className="modal-header">
          <h2>New Order</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close modal">&times;</button>
        </div>

        <form onSubmit={handleSubmit}>
          {errors.submit && <p className="error-message" role="alert">{errors.submit}</p>}

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="supplier_id">Supplier *</label>
              <select id="supplier_id" name="supplier_id" value={formData.supplier_id}
                      onChange={handleChange} aria-required="true"
                      aria-invalid={errors.supplier_id ? 'true' : 'false'}>
                <option value="">Select supplier</option>
                {suppliers.map((sup) => (
                  <option key={sup.supplier_id} value={sup.supplier_id}>{sup.name}</option>
                ))}
              </select>
              {errors.supplier_id && <span className="field-error" role="alert">{errors.supplier_id}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="expected_delivery">Expected Delivery</label>
              <input id="expected_delivery" name="expected_delivery" type="date"
                     value={formData.expected_delivery} onChange={handleChange} />
            </div>
          </div>

          <div className="order-items-section">
            <div className="order-items-header">
              <h3>Order Items</h3>
              <button type="button" className="btn btn-small" onClick={addItem}>
                + Add Item
              </button>
            </div>
            {errors.items && <p className="field-error" role="alert">{errors.items}</p>}

            {items.map((item, index) => (
              <div key={index} className="order-item-row">
                <div className="form-group">
                  <label htmlFor={`product-${index}`}>Product</label>
                  <select id={`product-${index}`} value={item.product_id}
                          onChange={(e) => handleItemChange(index, 'product_id', e.target.value)}>
                    <option value="">Select product</option>
                    {products.map((prod) => (
                      <option key={prod.product_id} value={prod.product_id}>{prod.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor={`quantity-${index}`}>Qty</label>
                  <input id={`quantity-${index}`} type="number" min="1"
                         value={item.quantity}
                         onChange={(e) => handleItemChange(index, 'quantity', e.target.value)} />
                </div>
                <div className="form-group">
                  <label htmlFor={`cost-${index}`}>Unit Cost (£)</label>
                  <input id={`cost-${index}`} type="number" step="0.01" min="0"
                         value={item.unit_cost}
                         onChange={(e) => handleItemChange(index, 'unit_cost', e.target.value)} />
                </div>
                {items.length > 1 && (
                  <button type="button" className="btn btn-small btn-danger"
                          onClick={() => removeItem(index)}
                          aria-label={`Remove item ${index + 1}`}>
                    Remove
                  </button>
                )}
              </div>
            ))}

            <div className="order-total">
              <strong>Total: £{calculateTotal()}</strong>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="notes">Notes</label>
            <textarea id="notes" name="notes" rows="2"
                      value={formData.notes} onChange={handleChange} />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Create Order</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default OrderModal;