import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import SupplierModal from './SupplierModal';
import './Suppliers.css';
import useDocumentTitle from '../../hooks/useDocumentTitle';

function Suppliers() {
  useDocumentTitle('Suppliers');
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchSuppliers = async () => {
    try {
      const response = await api.get('/suppliers', {
        params: searchTerm ? { search: searchTerm } : {},
      });
      setSuppliers(response.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Failed to load suppliers');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchSuppliers();
  };

  const handleAdd = () => {
    setEditingSupplier(null);
    setShowModal(true);
  };

  const handleEdit = (supplier) => {
    setEditingSupplier(supplier);
    setShowModal(true);
  };

  const handleDelete = async (supplierId, supplierName) => {
    if (!window.confirm(`Are you sure you want to delete "${supplierName}"?`)) return;
    try {
      await api.delete(`/suppliers/${supplierId}`);
      fetchSuppliers();
    } catch (err) {
      console.error(err);
      alert('Failed to delete supplier');
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingSupplier(null);
  };

  const handleModalSave = () => {
    handleModalClose();
    fetchSuppliers();
  };

  if (loading) return <p>Loading suppliers...</p>;
  if (error) return <p role="alert">{error}</p>;

  return (
    <div className="suppliers-page">
      <div className="suppliers-header">
        <h1>Suppliers</h1>
        <button className="btn btn-primary" onClick={handleAdd}>
          + Add Supplier
        </button>
      </div>

      <form className="search-bar" onSubmit={handleSearch} role="search">
        <label htmlFor="supplier-search" className="sr-only">Search suppliers</label>
        <input
          id="supplier-search"
          type="text"
          placeholder="Search by name or contact..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button type="submit" className="btn">Search</button>
      </form>

      <table>
        <thead>
          <tr>
            <th scope="col">Name</th>
            <th scope="col">Contact</th>
            <th scope="col">Email</th>
            <th scope="col">Phone</th>
            <th scope="col">Lead Time (days)</th>
            <th scope="col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {suppliers.length === 0 ? (
            <tr><td colSpan="6">No suppliers found.</td></tr>
          ) : (
            suppliers.map((supplier) => (
              <tr key={supplier.supplier_id}>
                <td>{supplier.name}</td>
                <td>{supplier.contact_name}</td>
                <td>{supplier.email}</td>
                <td>{supplier.phone}</td>
                <td>{supplier.lead_time_days}</td>
                <td className="actions">
                  <button
                    className="btn btn-small"
                    onClick={() => handleEdit(supplier)}
                    aria-label={`Edit ${supplier.name}`}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-small btn-danger"
                    onClick={() => handleDelete(supplier.supplier_id, supplier.name)}
                    aria-label={`Delete ${supplier.name}`}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {showModal && (
        <SupplierModal
          supplier={editingSupplier}
          onClose={handleModalClose}
          onSave={handleModalSave}
        />
      )}
    </div>
  );
}

export default Suppliers;