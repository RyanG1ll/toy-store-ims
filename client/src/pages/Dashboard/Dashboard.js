import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import './Dashboard.css';

// The Dashboard component fetches and displays key statistics about the inventory system
// It shows total products, total suppliers, low stock items, and recent orders
// This component is the main landing page after login and provides a quick overview of the system's status
// It also serves as a hub for navigating to other parts of the application, such as products and suppliers
// The dashboard is designed to be simple and informative, giving users the information they need at a glance
// Future enhancements could include charts and graphs for visualizing trends, as well as more detailed analytics
function Dashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalSuppliers: 0,
    lowStockItems: [],
    recentOrders: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
        try {
            const response = await api.get('/dashboard');
            setStats(response.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setError('Failed to load dashboard data');
            setLoading(false);
        }
    };
    fetchData(); 
  }, []);

  if (loading) return <p>Loading dashboard...</p>;
  if (error) return <p role="alert">{error}</p>;

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>

      <div className="stats-grid" role="region" aria-label="Key statistics">
        <div className="stat-card">
          <h2>Total Products</h2>
          <p className="stat-number">{stats.totalProducts}</p>
        </div>
        <div className="stat-card">
          <h2>Total Suppliers</h2>
          <p className="stat-number">{stats.totalSuppliers}</p>
        </div>
        <div className="stat-card warning">
          <h2>Low Stock Items</h2>
          <p className="stat-number">{stats.lowStockItems.length}</p>
        </div>
      </div>

      {/* Low stock table */}
      {stats.lowStockItems.length > 0 && (
        <section aria-label="Low stock alerts">
          <h2>Low Stock Alerts</h2>
          <table>
            <thead>
              <tr>
                <th scope="col">Product</th>
                <th scope="col">SKU</th>
                <th scope="col">In Stock</th>
                <th scope="col">Reorder Level</th>
              </tr>
            </thead>
            <tbody>
              {stats.lowStockItems.map((item) => (
                <tr key={item.product_id}>
                  <td>{item.name}</td>
                  <td>{item.sku}</td>
                  <td>{item.quantity_in_stock}</td>
                  <td>{item.reorder_level}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* Recent orders */}
      <section aria-label="Recent orders">
        <h2>Recent Orders</h2>
        {stats.recentOrders.length === 0 ? (
          <p>No orders yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th scope="col">Order #</th>
                <th scope="col">Supplier</th>
                <th scope="col">Date</th>
                <th scope="col">Status</th>
                <th scope="col">Total</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentOrders.map((order) => (
                <tr key={order.order_id}>
                  <td>{order.order_id}</td>
                  <td>{order.supplier_name}</td>
                  <td>{new Date(order.order_date).toLocaleDateString()}</td>
                  <td>{order.status}</td>
                  <td>£{order.total_cost}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

export default Dashboard;