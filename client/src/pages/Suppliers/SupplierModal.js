import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import '../Products/ProductModal.css';
import Tooltip from '../../components/tooltip/ToolTip';
import educationalContent from '../../data/educationalContent';
import useFocusTrap from '../../hooks/useFocusTrap';
import { useAnnounce } from '../../components/LiveAnnouncer';

function SupplierModal({ supplier, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    contact_name: '',
    email: '',
    phone: '',
    address: '',
    lead_time_days: '7',
  });
  const [errors, setErrors] = useState({});

  // Focus trap traps Tab inside the modal and returns focus on close
  const trapRef = useFocusTrap(onClose);
  const announce = useAnnounce();

  useEffect(() => {
    if (supplier) {
      setFormData({
        name: supplier.name || '',
        contact_name: supplier.contact_name || '',
        email: supplier.email || '',
        phone: supplier.phone || '',
        address: supplier.address || '',
        lead_time_days: supplier.lead_time_days || '7',
      });
    }
  }, [supplier]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Supplier name is required';
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
      if (supplier) {
        await api.put(`/suppliers/${supplier.supplier_id}`, formData);
        announce('Supplier updated successfully');
      } else {
        await api.post('/suppliers', formData);
        announce('Supplier added successfully');
      }
      onSave();
    } catch (err) {
      console.error('Failed to save supplier', err);
      setErrors({ submit: 'Failed to save supplier. Please try again.' });
      announce('Failed to save supplier', 'assertive');
    }
  };

  return (
    <div className="modal-overlay">
      <div
        className="modal-content"
        ref={trapRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="supplier-modal-title"
        tabIndex={-1}
      >
        <div className="modal-header">
          <h2 id="supplier-modal-title">
            {supplier ? 'Edit Supplier' : 'Add New Supplier'}
          </h2>
          <button className="modal-close" onClick={onClose} aria-label="Close modal">&times;</button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {errors.submit && <p className="error-message" role="alert">{errors.submit}</p>}

          <div className="form-group">
            <label htmlFor="name">Supplier Name *</label>
            <input id="name" name="name" type="text" value={formData.name}
                   onChange={handleChange} aria-required="true"
                   aria-invalid={errors.name ? 'true' : 'false'}
                   aria-describedby={errors.name ? 'name-error' : undefined} />
            {errors.name && <span id="name-error" className="field-error" role="alert">{errors.name}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="contact_name">Contact Name</label>
              <input id="contact_name" name="contact_name" type="text"
                     value={formData.contact_name} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input id="email" name="email" type="email"
                     value={formData.email} onChange={handleChange} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="phone">Phone</label>
              <input id="phone" name="phone" type="text"
                     value={formData.phone} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label htmlFor="lead_time_days">
                Lead Time (days) <Tooltip content={educationalContent.leadTime} />
              </label>
              <input id="lead_time_days" name="lead_time_days" type="number" min="1"
                     value={formData.lead_time_days} onChange={handleChange} />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="address">Address</label>
            <textarea id="address" name="address" rows="2"
                      value={formData.address} onChange={handleChange} />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">
              {supplier ? 'Update Supplier' : 'Add Supplier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SupplierModal;