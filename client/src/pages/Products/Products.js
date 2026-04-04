import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import ProductModal from './ProductModal';
import './Products.css';

// The Products component displays a list of products with search, add, edit, and delete functionality.
// It fetches products from the API and allows users to manage their inventory effectively.
function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

// Fetch products from the API with optional search term
// Created outside of useEffect to allow re-fetching after add/edit/delete operations
// If searchTerm is provided, it will be sent as a query parameter to filter products by name or SKU
  const fetchProducts = async () => {
    try {
      const response = await api.get('/products', {
        params: searchTerm ? { search: searchTerm } : {},
      });
      setProducts(response.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Failed to load products');
      setLoading(false);
    }
  };

  // Fetch products on component mount and whenever the search term changes
  useEffect(() => {
    fetchProducts();
  }, []);

  // Handle search form submission to fetch products based on the current search term
  const handleSearch = (e) => {
    e.preventDefault();
    fetchProducts();
  };

  // Handle the "Add Product" button click by opening the modal with no product selected for editing
  const handleAdd = () => {
    setEditingProduct(null);
    setShowModal(true);
  };

  // Handle the "Edit" button click by opening the modal with the selected product's details for editing
  const handleEdit = (product) => {
    setEditingProduct(product);
    setShowModal(true);
  };

  // Handle the "Delete" button click by confirming the action and then sending a delete request to the API
  // If the deletion is successful, it re-fetches the products to update the list
  const handleDelete = async (productId, productName) => {
    if (!window.confirm(`Are you sure you want to delete "${productName}"?`)) return;
    try {
      await api.delete(`/products/${productId}`);
      fetchProducts();
    } catch (err) {
      console.error(err);
      alert('Failed to delete product');
    }
  };

  // Handle closing the modal by resetting the showModal state and clearing the editingProduct state
  const handleModalClose = () => {
    setShowModal(false);
    setEditingProduct(null);
  };

  // Handle saving changes from the modal by closing it and re-fetching the products to reflect any additions or edits
  const handleModalSave = () => {
    handleModalClose();
    fetchProducts();
  };

  if (loading) return <p>Loading products...</p>;
  if (error) return <p role="alert">{error}</p>;

  return (
    <div className="products-page">
      <div className="products-header">
        <h1>Products</h1>
        <button className="btn btn-primary" onClick={handleAdd}>
          + Add Product
        </button>
      </div>

      <form className="search-bar" onSubmit={handleSearch} role="search">
        <label htmlFor="product-search" className="sr-only">Search products</label>
        <input
          id="product-search"
          type="text"
          placeholder="Search by name or SKU..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button type="submit" className="btn">Search</button>
      </form>

      <table>
        <thead>
          <tr>
            <th scope="col">Name</th>
            <th scope="col">SKU</th>
            <th scope="col">Category</th>
            <th scope="col">Price</th>
            <th scope="col">Stock</th>
            <th scope="col">Reorder Level</th>
            <th scope="col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.length === 0 ? (
            <tr><td colSpan="7">No products found.</td></tr>
          ) : (
            products.map((product) => (
                // If the product's quantity in stock is less than or equal to the reorder level, apply a "low-stock" class for styling
              <tr key={product.product_id}
                  className={product.quantity_in_stock <= product.reorder_level ? 'low-stock' : ''}>
                <td>{product.name}</td>
                <td>{product.sku}</td>
                <td>{product.category_name}</td>
                <td>£{product.unit_price}</td>
                <td>{product.quantity_in_stock}</td>
                <td>{product.reorder_level}</td>
                <td className="actions">
                  <button
                    className="btn btn-small"
                    onClick={() => handleEdit(product)}
                    aria-label={`Edit ${product.name}`} // Add an aria-label for better accessibility, describing the action and the product name
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-small btn-danger"
                    onClick={() => handleDelete(product.product_id, product.name)}
                    aria-label={`Delete ${product.name}`} // Add an aria-label for better accessibility, describing the action and the product name
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
        <ProductModal
          product={editingProduct}
          onClose={handleModalClose}
          onSave={handleModalSave}
        />
      )}
    </div>
  );
}

export default Products;