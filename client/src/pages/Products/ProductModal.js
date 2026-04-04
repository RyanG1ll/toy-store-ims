import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import './ProductModal.css';

function ProductModal({ product, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sku: '',
    category_id: '',
    supplier_id: '',
    unit_price: '',
    cost_price: '',
    quantity_in_stock: '',
    reorder_level: '10',
    reorder_quantity: '50',
    age_range: '',
  });
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [errors, setErrors] = useState({});
  const modalRef = useRef(null);

  // If editing, pre-fill the form with existing product data
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        sku: product.sku || '',
        category_id: product.category_id || '',
        supplier_id: product.supplier_id || '',
        unit_price: product.unit_price || '',
        cost_price: product.cost_price || '',
        quantity_in_stock: product.quantity_in_stock || '',
        reorder_level: product.reorder_level || '10',
        reorder_quantity: product.reorder_quantity || '50',
        age_range: product.age_range || '',
      });
    }
  }, [product]);

  // Fetch categories and suppliers for the dropdowns
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [catRes, supRes] = await Promise.all([
          api.get('/categories'),
          api.get('/suppliers'),
        ]);
        setCategories(catRes.data);
        setSuppliers(supRes.data);
      } catch (err) {
        console.error('Failed to load form options', err);
      }
    };
    fetchOptions();
  }, []);

  // Close modal on Escape key (accessibility)
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Focus trap - focus the modal when it opens
  useEffect(() => {
    if (modalRef.current) {
      modalRef.current.focus();
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Product name is required';
    if (!formData.sku.trim()) newErrors.sku = 'SKU is required';
    if (!formData.unit_price || parseFloat(formData.unit_price) < 0)
      newErrors.unit_price = 'Valid price is required';
    if (!formData.cost_price || parseFloat(formData.cost_price) < 0)
      newErrors.cost_price = 'Valid cost price is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

    const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    
    try {
        if (product) {
            // Update existing product
            await api.put(`/products/${product.product_id}`, formData);
        }
        else {
            // Create new product
            await api.post('/products', formData);
        }
        onSave(); // Notify parent to refresh product list
    }       catch (err) {              
        console.error('Failed to save product', err);
        setErrors({ submit: 'Failed to save product. Please try again.' });
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true"
         aria-label={product ? 'Edit product' : 'Add new product'}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}
           ref={modalRef} tabIndex={-1}>
        <div className="modal-header">
          <h2>{product ? 'Edit Product' : 'Add New Product'}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close modal">
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {errors.submit && <p className="error-message" role="alert">{errors.submit}</p>}

          <div className="form-group">
            <label htmlFor="name">Product Name *</label>
            <input id="name" name="name" type="text" value={formData.name}
                   onChange={handleChange} aria-required="true"
                   aria-invalid={errors.name ? 'true' : 'false'} />
            {errors.name && <span className="field-error" role="alert">{errors.name}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="sku">SKU *</label>
            <input id="sku" name="sku" type="text" value={formData.sku}
                   onChange={handleChange} aria-required="true"
                   aria-invalid={errors.sku ? 'true' : 'false'} />
            {errors.sku && <span className="field-error" role="alert">{errors.sku}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="unit_price">Selling Price (£) *</label>
              <input id="unit_price" name="unit_price" type="number" step="0.01" min="0"
                     value={formData.unit_price} onChange={handleChange} aria-required="true"
                     aria-invalid={errors.unit_price ? 'true' : 'false'} />
              {errors.unit_price && <span className="field-error" role="alert">{errors.unit_price}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="cost_price">Cost Price (£) *</label>
              <input id="cost_price" name="cost_price" type="number" step="0.01" min="0"
                     value={formData.cost_price} onChange={handleChange} aria-required="true"
                     aria-invalid={errors.cost_price ? 'true' : 'false'} />
              {errors.cost_price && <span className="field-error" role="alert">{errors.cost_price}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="category_id">Category</label>
              <select id="category_id" name="category_id" value={formData.category_id}
                      onChange={handleChange}>
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat.category_id} value={cat.category_id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="supplier_id">Supplier</label>
              <select id="supplier_id" name="supplier_id" value={formData.supplier_id}
                      onChange={handleChange}>
                <option value="">Select supplier</option>
                {suppliers.map((sup) => (
                  <option key={sup.supplier_id} value={sup.supplier_id}>{sup.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="quantity_in_stock">Stock Quantity</label>
              <input id="quantity_in_stock" name="quantity_in_stock" type="number" min="0"
                     value={formData.quantity_in_stock} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label htmlFor="reorder_level">Reorder Level</label>
              <input id="reorder_level" name="reorder_level" type="number" min="0"
                     value={formData.reorder_level} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label htmlFor="reorder_quantity">Reorder Quantity</label>
              <input id="reorder_quantity" name="reorder_quantity" type="number" min="0"
                     value={formData.reorder_quantity} onChange={handleChange} />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="age_range">Age Range</label>
            <input id="age_range" name="age_range" type="text" placeholder="e.g. 3-6, 8+"
                   value={formData.age_range} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea id="description" name="description" rows="3"
                      value={formData.description} onChange={handleChange} />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">
              {product ? 'Update Product' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProductModal;