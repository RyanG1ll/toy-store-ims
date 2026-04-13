import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import './Dashboard.css';
import Tooltip from '../../components/tooltip/ToolTip';
import educationalContent from '../../data/educationalContent';
import {
  PieChart, Pie, Cell, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, Legend, ResponsiveContainer
} from 'recharts';

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

      <div className="dashboard-charts">
        <div className="chart-card">
          <h2>
            Stock by Category
            <Tooltip content={educationalContent.abcAnalysis} />
          </h2>
          {stats.stockByCategory && stats.stockByCategory.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.stockByCategory}
                  dataKey="total_stock"
                  nameKey="category"
                  cx="50%"
                  cy="45%"
                  outerRadius={80}
                  label={false}
                >
                  {stats.stockByCategory.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={['#4a90d9', '#7cb342', '#f9a825', '#e53935', '#8e24aa', '#00897b', '#fb8c00', '#3949ab'][index % 8]} />
                  ))}
                </Pie>
                <ChartTooltip formatter={(value, name) => [`${value} units`, name]} />
                <Legend verticalAlign="bottom" height={60} wrapperStyle={{ fontSize: '0.8rem' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p>No stock data yet.</p>}
        </div>

        <div className="chart-card">
          <h2>
            Orders Over Time
            <Tooltip content={educationalContent.demandForecasting} />
          </h2>
          {stats.ordersOverTime && stats.ordersOverTime.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.ordersOverTime} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis allowDecimals={false} />
                <ChartTooltip />
                <Legend />
                <Bar dataKey="order_count" fill="#4a90d9" name="Orders" />
              </BarChart>
            </ResponsiveContainer>
          ) : <p>No order history yet.</p>}
        </div>

        <div className="chart-card">
          <h2>
            Stock Status
            <Tooltip content={educationalContent.reorderPoint} />
          </h2>
          {stats.stockStatusBreakdown ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Healthy', value: stats.stockStatusBreakdown.healthy || 0 },
                    { name: 'Low Stock', value: stats.stockStatusBreakdown.low_stock || 0 },
                    { name: 'Out of Stock', value: stats.stockStatusBreakdown.out_of_stock || 0 }
                  ]}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="45%"
                  innerRadius={50}
                  outerRadius={80}
                  label={false}
                >
                  <Cell fill="#2e7d32" />
                  <Cell fill="#f9a825" />
                  <Cell fill="#c62828" />
                </Pie>
                <ChartTooltip formatter={(value, name) => [`${value} products`, name]} />
                <Legend verticalAlign="bottom" height={40} wrapperStyle={{ fontSize: '0.85rem' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p>No stock data.</p>}
        </div>
      </div>

      {/* Low stock table */}
      {stats.lowStockItems.length > 0 && (
        <section aria-label="Low stock alerts">
          <h2>Low Stock Alerts <Tooltip content={educationalContent.reorderPoint} /></h2>
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
        <h2>Recent Orders <Tooltip content={educationalContent.leadTime} /></h2>
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