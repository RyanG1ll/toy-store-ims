import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Tooltip from '../../components/tooltip/ToolTip';
import educationalContent from '../../data/educationalContent';
import './Forecasting.css';

function Forecasting() {
  const [forecasts, setForecasts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchForecasts = async () => {
      try {
        const res = await api.get('/forecasting');
        setForecasts(res.data);
      } catch (err) {
        console.error('Failed to fetch forecasting data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchForecasts();
  }, []);

  const formatCurrency = (val) => `£${Number(val).toFixed(2)}`;

  const getStatusLabel = (status) => {
    switch (status) {
      case 'healthy': return 'Healthy';
      case 'warning': return 'Warning';
      case 'low': return 'Low Stock';
      case 'out_of_stock': return 'Out of Stock';
      default: return status;
    }
  };

  if (loading) return <p>Loading forecasting data...</p>;

  return (
    <div className="forecasting-page">
      <div className="forecasting-header">
        <h1>
          Inventory Forecasting
          <Tooltip content={educationalContent.demandForecasting} />
        </h1>
        <p className="forecasting-subtitle">
          Smart recommendations based on your order history and stock data.
          Click the <strong>?</strong> icons to learn about each concept.
        </p>
      </div>

      {forecasts.length === 0 ? (
        <div className="no-data-message">
          <p>No product data available. Add products and create some orders to see forecasting recommendations.</p>
        </div>
      ) : (
        <div className="forecast-cards">
          {forecasts.map((f) => (
            <div key={f.product_id} className="forecast-card">
              <div className="forecast-card-header">
                <div>
                  <h3>{f.name}</h3>
                  <span className="sku">{f.sku}</span>
                </div>
                <span className={`stock-status ${f.stock_status}`}>
                  {getStatusLabel(f.stock_status)}
                </span>
              </div>

              <div className="forecast-card-body">
                <div className="forecast-section-title">Current Stock</div>

                <div className="forecast-metric">
                  <span className="metric-label">Stock Level</span>
                  <span className={`metric-value ${f.stock_status === 'low' || f.stock_status === 'out_of_stock' ? 'critical' : ''}`}>
                    {f.current_stock} units
                  </span>
                </div>

                <div className="forecast-metric">
                  <span className="metric-label">
                    Days of Stock Left
                    <Tooltip content={educationalContent.leadTime} />
                  </span>
                  <span className={`metric-value ${f.days_of_stock_remaining !== null && f.days_of_stock_remaining <= 14 ? 'warning' : ''}`}>
                    {f.days_of_stock_remaining !== null ? `${f.days_of_stock_remaining} days` : 'N/A'}
                  </span>
                </div>

                <div className="forecast-section-title">Demand Analysis</div>

                <div className="forecast-metric">
                  <span className="metric-label">
                    Avg Monthly Demand
                    <Tooltip content={educationalContent.demandForecasting} />
                  </span>
                  <span className="metric-value">{f.avg_monthly_demand} units</span>
                </div>

                <div className="forecast-metric">
                  <span className="metric-label">Orders (6 months)</span>
                  <span className="metric-value">{f.order_count_6m} orders ({f.total_ordered_6m} units)</span>
                </div>

                <div className="forecast-metric">
                  <span className="metric-label">Avg Lead Time</span>
                  <span className="metric-value">{f.avg_lead_time_days} days</span>
                </div>

                <div className="forecast-section-title">Recommendations</div>

                <div className="forecast-metric">
                  <span className="metric-label">
                    EOQ
                    <Tooltip content={educationalContent.eoq} />
                  </span>
                  <span className="metric-value highlight">
                    {f.recommended_eoq > 0 ? `${f.recommended_eoq} units` : 'Need more data'}
                  </span>
                </div>

                <div className="forecast-metric">
                  <span className="metric-label">
                    Reorder Point
                    <Tooltip content={educationalContent.reorderPoint} />
                  </span>
                  <span className="metric-value highlight">
                    {f.recommended_reorder_point} units
                  </span>
                </div>

                <div className="forecast-metric">
                  <span className="metric-label">
                    Safety Stock
                    <Tooltip content={educationalContent.safetyStock} />
                  </span>
                  <span className="metric-value">{f.safety_stock} units</span>
                </div>

                <div className="forecast-section-title">Cost Estimates (Annual)</div>

                <div className="forecast-metric">
                  <span className="metric-label">
                    Holding Cost
                    <Tooltip content={educationalContent.holdingCost} />
                  </span>
                  <span className="metric-value">{formatCurrency(f.estimated_annual_holding_cost)}</span>
                </div>

                <div className="forecast-metric">
                  <span className="metric-label">Ordering Cost</span>
                  <span className="metric-value">{formatCurrency(f.estimated_annual_ordering_cost)}</span>
                </div>

                <div className="forecast-metric">
                  <span className="metric-label">Est. Annual Demand</span>
                  <span className="metric-value">{f.annual_demand_estimate} units</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Forecasting;