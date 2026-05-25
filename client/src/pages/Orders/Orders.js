import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import OrderModal from './OrderModal';
import './Orders.css';
import Tooltip from '../../components/tooltip/ToolTip';
import educationalContent from '../../data/educationalContent';
import {
  PieChart, Pie, Cell, Tooltip as ChartTooltip, Legend, ResponsiveContainer
} from 'recharts';
import { useAccessibility } from '../../context/AccessibilityContext';
import useDocumentTitle from '../../hooks/useDocumentTitle';

function Orders() {
  useDocumentTitle('Orders');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { reducedMotion } = useAccessibility();
  const [showModal, setShowModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [supplierFilter, setSupplierFilter] = useState('all');
  const [sort, setSort] = useState({ column: null, direction: 'none' });

  // Get unique supplier names for the filter dropdown
  const supplierNames = [...new Set(orders.map(o => o.supplier_name).filter(Boolean))].sort();

  const handleSort = (column) => {
    setSort((prev) => {
      if (prev.column !== column) return { column, direction: 'asc' };
      if (prev.direction === 'asc') return { column, direction: 'desc' };
      if (prev.direction === 'desc') return { column: null, direction: 'none' };
      return { column, direction: 'asc' };
    });
  };

  const getSortIndicator = (column) => {
    if (sort.column !== column) return '⇅';
    return sort.direction === 'asc' ? '▲' : '▼';
  };

  const filteredOrders = (() => {
    let result = [...orders];

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(o => o.status === statusFilter);
    }

    // Supplier filter
    if (supplierFilter !== 'all') {
      result = result.filter(o => o.supplier_name === supplierFilter);
    }

    // Sorting
    if (sort.column && sort.direction !== 'none') {
      result.sort((a, b) => {
        let valA, valB;

        switch (sort.column) {
          case 'order_id':
            valA = a.order_id;
            valB = b.order_id;
            break;
          case 'order_date':
            valA = new Date(a.order_date);
            valB = new Date(b.order_date);
            break;
          case 'expected_delivery':
            if (!a.expected_delivery) return 1;
            if (!b.expected_delivery) return -1;
            valA = new Date(a.expected_delivery);
            valB = new Date(b.expected_delivery);
            break;
          case 'total_cost':
            valA = parseFloat(a.total_cost) || 0;
            valB = parseFloat(b.total_cost) || 0;
            break;
          default:
            return 0;
        }

        if (valA < valB) return sort.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sort.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  })();

  const fetchOrders = async () => {
    try {
      const response = await api.get('/orders');
      setOrders(response.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Failed to load orders');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status: newStatus });
      fetchOrders();
    } catch (err) {
      console.error(err);
      alert('Failed to update order status');
    }
  };

  const handleDelete = async (orderId) => {
    if (!window.confirm(`Are you sure you want to delete Order #${orderId}?`)) return;
    try {
      await api.delete(`/orders/${orderId}`);
      fetchOrders();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to delete order');
    }
  };

  const handleModalSave = () => {
    setShowModal(false);
    fetchOrders();
  };

  const getStatusBadgeClass = (status) => {
    const classes = {
      pending: 'badge-pending',
      confirmed: 'badge-confirmed',
      shipped: 'badge-shipped',
      delivered: 'badge-delivered',
      cancelled: 'badge-cancelled',
    };
    return `status-badge ${classes[status] || ''}`;
  };

  const getNextStatus = (currentStatus) => {
    const flow = {
      pending: 'confirmed',
      confirmed: 'shipped',
      shipped: 'delivered',
    };
    return flow[currentStatus] || null;
  };

  if (loading) return <p>Loading orders...</p>;
  if (error) return <p role="alert">{error}</p>;

  return (
    <div className="orders-page">
      <div className="orders-header">
        <h1>Orders <Tooltip content={educationalContent.leadTime} /></h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + New Order
        </button>
      </div>

      {/* Filters row */}
      <div className="orders-filters-row">
        <div className="chart-filters" role="group" aria-label="Filter orders by status">
          {['all', 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].map((s) => (
            <button
              key={s}
              className={`filter-btn ${statusFilter === s ? 'active' : ''}`}
              onClick={() => setStatusFilter(s)}
              aria-pressed={statusFilter === s}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        <div className="supplier-filter">
          <label htmlFor="supplier-filter" className="sr-only">Filter by supplier</label>
          <select
            id="supplier-filter"
            value={supplierFilter}
            onChange={(e) => setSupplierFilter(e.target.value)}
            aria-label="Filter orders by supplier"
            className="chart-select"
          >
            <option value="all">All Suppliers</option>
            {supplierNames.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>
      </div>

      {orders.length > 0 && (
        <div className="orders-chart">
          <h2>Order Status Breakdown</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={Object.entries(
                  orders.reduce((acc, order) => {
                    acc[order.status] = (acc[order.status] || 0) + 1;
                    return acc;
                  }, {})
                ).map(([name, value]) => ({ name, value }))}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={false}
                isAnimationActive={!reducedMotion}
              >
                {Object.keys(
                  orders.reduce((acc, order) => {
                    acc[order.status] = true;
                    return acc;
                  }, {})
                ).map((status, index) => {
                  const colors = {
                    pending: '#f9a825',
                    confirmed: '#4a90d9',
                    shipped: '#7cb342',
                    delivered: '#2e7d32',
                    cancelled: '#e53935'
                  };
                  return <Cell key={`cell-${index}`} fill={colors[status] || '#999'} />;
                })}
              </Pie>
              <ChartTooltip formatter={(value, name) => [`${value} orders`, name]} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      <table>
        <thead>
          <tr>
            <th scope="col">
              <button className="sort-btn" onClick={() => handleSort('order_id')}
                      aria-label={`Sort by order number${sort.column === 'order_id' ? ', currently ' + sort.direction : ''}`}>
                Order # {getSortIndicator('order_id')}
              </button>
            </th>
            <th scope="col">Supplier</th>
            <th scope="col">
              <button className="sort-btn" onClick={() => handleSort('order_date')}
                      aria-label={`Sort by date${sort.column === 'order_date' ? ', currently ' + sort.direction : ''}`}>
                Date {getSortIndicator('order_date')}
              </button>
            </th>
            <th scope="col">
              <button className="sort-btn" onClick={() => handleSort('expected_delivery')}
                      aria-label={`Sort by expected delivery${sort.column === 'expected_delivery' ? ', currently ' + sort.direction : ''}`}>
                Expected Delivery {getSortIndicator('expected_delivery')}
              </button>
            </th>
            <th scope="col">Status</th>
            <th scope="col">
              <button className="sort-btn" onClick={() => handleSort('total_cost')}
                      aria-label={`Sort by total${sort.column === 'total_cost' ? ', currently ' + sort.direction : ''}`}>
                Total {getSortIndicator('total_cost')}
              </button>
            </th>
            <th scope="col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredOrders.length === 0 ? (
            <tr><td colSpan="7">No orders found.</td></tr>
          ) : (
            filteredOrders.map((order) => (
              <tr key={order.order_id}>
                <td>{order.order_id}</td>
                <td>{order.supplier_name}</td>
                <td>{new Date(order.order_date).toLocaleDateString()}</td>
                <td>{order.expected_delivery
                  ? new Date(order.expected_delivery).toLocaleDateString()
                  : '—'}</td>
                <td>
                  <span className={getStatusBadgeClass(order.status)}>
                    {order.status}
                  </span>
                </td>
                <td>£{parseFloat(order.total_cost).toFixed(2)}</td>
                <td className="actions">
                  {getNextStatus(order.status) && (
                    <button
                      className="btn btn-small btn-primary"
                      onClick={() => handleStatusChange(order.order_id, getNextStatus(order.status))}
                      aria-label={`Mark order ${order.order_id} as ${getNextStatus(order.status)}`}
                    >
                      Mark {getNextStatus(order.status)}
                    </button>
                  )}
                  {order.status === 'pending' && (
                    <>
                      <button
                        className="btn btn-small btn-danger"
                        onClick={() => handleStatusChange(order.order_id, 'cancelled')}
                        aria-label={`Cancel order ${order.order_id}`}
                      >
                        Cancel
                      </button>
                      <button
                        className="btn btn-small btn-danger"
                        onClick={() => handleDelete(order.order_id)}
                        aria-label={`Delete order ${order.order_id}`}
                      >
                        Delete
                      </button>
                    </>
                  )}
                  {(order.status === 'delivered' || order.status === 'cancelled') && (
                    <span className="no-actions" aria-label="No actions available">—</span>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {showModal && (
        <OrderModal
          onClose={() => setShowModal(false)}
          onSave={handleModalSave}
        />
      )}
    </div>
  );
}

export default Orders;
