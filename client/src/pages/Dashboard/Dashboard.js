import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import './Dashboard.css';
import { useAccessibility } from '../../context/AccessibilityContext';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { useAnnounce } from '../../components/LiveAnnouncer';
import {
  PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, Legend, ResponsiveContainer
} from 'recharts';

// The Dashboard component fetches and displays key statistics about the inventory system
// It shows total products, total suppliers, low stock items, and recent orders
// This component is the main landing page after login and provides a quick overview of the system's status
// It also serves as a hub for navigating to other parts of the application, such as products and suppliers
// The dashboard is designed to be simple and informative, giving users the information they need at a glance
// Future enhancements could include charts and graphs for visualizing trends, as well as more detailed analytics

function Dashboard() {
  useDocumentTitle('Dashboard');

  const [stats, setStats] = useState({
    totalProducts: 0,
    totalSuppliers: 0,
    lowStockItems: [],
    recentOrders: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chartFilter, setChartFilter] = useState('all');
  const { reducedMotion } = useAccessibility();
  const announce = useAnnounce();

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

  const handleFilterChange = (filter) => {
    setChartFilter(filter);
    const labels = { all: 'All charts', stock: 'Stock charts only', orders: 'Order charts only' };
    announce(`Showing ${labels[filter]}`);
  };

  if (loading) return <div className="dashboard"><h1>Dashboard</h1><p aria-live="polite">Loading dashboard...</p></div>;
  if (error) return <div className="dashboard"><h1>Dashboard</h1><p role="alert">{error}</p></div>;

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>

      {/* Stats cards */}
      <div className="stats-grid" role="region" aria-label="Key statistics">
        <div className="stat-card">
          <h2>Total Products</h2>
          <p className="stat-number" aria-label={`${stats.totalProducts} total products`}>
            {stats.totalProducts}
          </p>
        </div>
        <div className="stat-card">
          <h2>Total Suppliers</h2>
          <p className="stat-number" aria-label={`${stats.totalSuppliers} total suppliers`}>
            {stats.totalSuppliers}
          </p>
        </div>
        <div className="stat-card warning">
          <h2>Low Stock Items</h2>
          <p className="stat-number" aria-label={`${stats.lowStockItems.length} low stock items`}>
            {stats.lowStockItems.length}
          </p>
        </div>
      </div>

      {/* Chart filter buttons */}
      <div className="chart-filters" role="toolbar" aria-label="Chart filter options">
        {['all', 'stock', 'orders'].map((f) => (
          <button
            key={f}
            className={`filter-btn ${chartFilter === f ? 'active' : ''}`}
            onClick={() => handleFilterChange(f)}
            aria-pressed={chartFilter === f}
          >
            {f === 'all' ? 'All Charts' : f === 'stock' ? 'Stock Charts' : 'Order Charts'}
          </button>
        ))}
      </div>

      {/* Charts */}
      <div className="dashboard-charts">
        {(chartFilter === 'all' || chartFilter === 'stock') && (
          <div className="chart-card" role="figure"
               aria-label={`Pie chart showing stock distribution across ${stats.stockByCategory?.length || 0} categories`}>
            <h2>
              Stock by Category
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
                    isAnimationActive={!reducedMotion}
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
            {/* Screen reader text summary of chart data */}
            <div className="sr-only">
              Stock by category: {stats.stockByCategory?.map(c => `${c.category}: ${c.total_stock} units`).join(', ')}
            </div>
          </div>
        )}

        {(chartFilter === 'all' || chartFilter === 'orders') && (
          <div className="chart-card" role="figure"
               aria-label="Bar chart showing orders placed per month over the last 6 months">
            <h2>
              Orders Over Time
            </h2>
            {stats.ordersOverTime && stats.ordersOverTime.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.ordersOverTime} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis allowDecimals={false} />
                  <ChartTooltip />
                  <Legend />
                  <Bar dataKey="order_count" fill="#4a90d9" name="Orders" isAnimationActive={!reducedMotion} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p>No order history yet.</p>}
            <div className="sr-only">
              Orders over time: {stats.ordersOverTime?.map(o => `${o.month}: ${o.order_count} orders`).join(', ')}
            </div>
          </div>
        )}

        <div className="chart-card" role="figure"
             aria-label="Donut chart showing stock health breakdown: healthy, low stock, and out of stock products">
          <h2>
            Stock Status
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
                  isAnimationActive={!reducedMotion}
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
          <div className="sr-only">
            Stock status: {stats.stockStatusBreakdown?.healthy || 0} healthy,
            {' '}{stats.stockStatusBreakdown?.low_stock || 0} low stock,
            {' '}{stats.stockStatusBreakdown?.out_of_stock || 0} out of stock.
          </div>
        </div>
      </div>

      {/* Low stock table */}
      {stats.lowStockItems.length > 0 && (
        <section aria-label="Low stock alerts">
          <h2>Low Stock Alerts</h2>
          <table>
            <caption className="sr-only">
              Products that are at or below their reorder level
            </caption>
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
                <tr key={item.product_id} className="low-stock-row">
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
            <caption className="sr-only">
              The 5 most recent supplier orders
            </caption>
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