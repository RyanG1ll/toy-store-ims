import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import '../Products/ProductModal.css';
import './Orders.css';
import useFocusTrap from '../../hooks/useFocusTrap';
import { useAnnounce } from '../../components/LiveAnnouncer';

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

  // Focus trap: traps Tab inside the modal and returns focus on close
  const trapRef = useFocusTrap(onClose);
  const announce = useAnnounce();

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // When supplier changes, clear any selected products that don't belong to the new supplier
    if (name === 'supplier_id') {
      setItems((prev) =>
        prev.map((item) => {
          const product = products.find((p) => p.product_id === parseInt(item.product_id));
          if (product && product.supplier_id !== parseInt(value)) {
            return { product_id: '', quantity: '', unit_cost: '' };
          }
          return item;
        })
      );
    }
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
    announce('New item row added');
  };

  const removeItem = (index) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
    announce('Item row removed');
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
    if (Object.keys(newErrors).length > 0) {
      announce('Form has errors. Please correct them.', 'assertive');
    }
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await api.post('/orders', {
        supplier_id: formData.supplier_id,
        expected_delivery: formData.expected_delivery || null,
        notes: formData.notes,
        items: items.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_cost: item.unit_cost
        }))
      });
      announce('Order created successfully');
      onSave();
    } catch (err) {
      console.error('Failed to create order', err);
      setErrors({ submit: 'Failed to create order. Please try again.' });
      announce('Failed to create order', 'assertive');
    }
  };

  return (
    <div className="modal-overlay">
      <div
        className="modal-content modal-wide"
        ref={trapRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-modal-title"
        tabIndex={-1}
      >
        <div className="modal-header">
          <h2 id="order-modal-title">New Order</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close modal">&times;</button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {errors.submit && <p className="error-message" role="alert">{errors.submit}</p>}

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="supplier_id">Supplier *</label>
              <select id="supplier_id" name="supplier_id" value={formData.supplier_id}
                      onChange={handleChange} aria-required="true"
                      aria-invalid={errors.supplier_id ? 'true' : 'false'}
                      aria-describedby={errors.supplier_id ? 'supplier-error' : undefined}>
                <option value="">Select supplier</option>
                {suppliers.map((sup) => (
                  <option key={sup.supplier_id} value={sup.supplier_id}>{sup.name}</option>
                ))}
              </select>
              {errors.supplier_id && <span id="supplier-error" className="field-error" role="alert">{errors.supplier_id}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="expected_delivery">Expected Delivery</label>
              <input id="expected_delivery" name="expected_delivery" type="date"
                     min={new Date().toISOString().split('T')[0]}
                     value={formData.expected_delivery} onChange={handleChange} />
            </div>
          </div>

          <fieldset className="order-items-section">
            <legend className="sr-only">Order line items</legend>
            <div className="order-items-header">
              <h3>Order Items</h3>
              <button type="button" className="btn btn-small" onClick={addItem}
                      aria-label="Add another item row">
                + Add Item
              </button>
            </div>
            {errors.items && <p className="field-error" role="alert">{errors.items}</p>}

            {items.map((item, index) => (
              <div key={index} className="order-item-row" role="group"
                   aria-label={`Order item ${index + 1}`}>
                <div className="form-group">
                  <label htmlFor={`product-${index}`}>Product</label>
                  <select id={`product-${index}`} value={item.product_id}
                          onChange={(e) => handleItemChange(index, 'product_id', e.target.value)}
                          disabled={!formData.supplier_id}>
                    <option value="">{formData.supplier_id ? 'Select product' : 'Select a supplier first'}</option>
                    {products
                      .filter((prod) => prod.supplier_id === parseInt(formData.supplier_id))
                      .map((prod) => (
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

            <div className="order-total" aria-live="polite">
              <strong>Total: £{calculateTotal()}</strong>
            </div>
          </fieldset>

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