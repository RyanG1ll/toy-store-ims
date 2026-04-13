import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import OrderModal from './OrderModal';
import './Orders.css';
import Tooltip from '../../components/tooltip/ToolTip';
import educationalContent from '../../data/educationalContent';
import {
  PieChart, Pie, Cell, Tooltip as ChartTooltip, Legend, ResponsiveContainer
} from 'recharts';

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchOrders = async () => {
    try {
      const response = await api.get('/orders', {
        params: statusFilter ? { status: statusFilter } : {},
      });
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
  }, [statusFilter]);

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

      <div className="filter-bar">
        <label htmlFor="status-filter">Filter by status:</label>
        <select
          id="status-filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Orders</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <table>
        <thead>
          <tr>
            <th scope="col">Order #</th>
            <th scope="col">Supplier</th>
            <th scope="col">Date</th>
            <th scope="col">Expected Delivery</th>
            <th scope="col">Status</th>
            <th scope="col">Total</th>
            <th scope="col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.length === 0 ? (
            <tr><td colSpan="7">No orders found.</td></tr>
          ) : (
            orders.map((order) => (
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

// Change after testing -
// {/* <td className="actions">
//   {order.status !== 'delivered' && order.status !== 'cancelled' && (
//     <>
//       {getNextStatus(order.status) && (
//         <button
//           className="btn btn-small btn-primary"
//           onClick={() => handleStatusChange(order.order_id, getNextStatus(order.status))}
//           aria-label={`Mark order ${order.order_id} as ${getNextStatus(order.status)}`}
//         >
//           Mark {getNextStatus(order.status)}
//         </button>
//       )}
//       {order.status === 'pending' && (
//         <>
//           <button
//             className="btn btn-small btn-danger"
//             onClick={() => handleStatusChange(order.order_id, 'cancelled')}
//             aria-label={`Cancel order ${order.order_id}`}
//           >
//             Cancel
//           </button>
//           <button
//             className="btn btn-small btn-danger"
//             onClick={() => handleDelete(order.order_id)}
//             aria-label={`Delete order ${order.order_id}`}
//           >
//             Delete
//           </button>
//         </>
//       )}
//     </>
//   )}
// </td> */}