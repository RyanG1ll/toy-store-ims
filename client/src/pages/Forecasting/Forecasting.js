import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Tooltip from '../../components/tooltip/ToolTip';
import educationalContent from '../../data/educationalContent';
import './Forecasting.css';
import { useAccessibility } from '../../context/AccessibilityContext';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as ChartTooltip, ResponsiveContainer
} from 'recharts';

function Forecasting() {
  useDocumentTitle('Forecasting');

  const [forecasts, setForecasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { reducedMotion } = useAccessibility();

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

  if (loading) return <p aria-live="polite">Loading forecasting data...</p>;

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
        <div className="no-data-message" role="status">
          <p>No product data available. Add products and create some orders to see forecasting recommendations.</p>
        </div>
      ) : (
        <div className="forecast-cards" role="region" aria-label="Product forecasting cards">
          {forecasts.map((f) => (
            <article key={f.product_id} className="forecast-card"
                     aria-label={`Forecast for ${f.name}`}>
              <div className="forecast-card-header">
                <div>
                  <h3>{f.name}</h3>
                  <span className="sku">{f.sku}</span>
                </div>
                <span className={`stock-status ${f.stock_status}`}
                      role="status"
                      aria-label={`Stock status: ${getStatusLabel(f.stock_status)}`}>
                  {getStatusLabel(f.stock_status)}
                </span>
              </div>

              <div className="forecast-card-body">
                <div className="forecast-section-title">Current Stock</div>

                {f.monthly_demand_history && f.monthly_demand_history.length > 0 && (
                  <div className="demand-chart" role="figure"
                       aria-label={`Monthly demand chart for ${f.name} over the last 6 months`}>
                    <div className="chart-label">Monthly Demand (last 6 months)</div>
                    <ResponsiveContainer width="100%" height={140}>
                      <BarChart data={f.monthly_demand_history} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" fontSize={11} />
                        <YAxis fontSize={11} allowDecimals={false} />
                        <ChartTooltip />
                        <Bar dataKey="quantity" fill="#4a90d9" name="Units ordered" isAnimationActive={!reducedMotion} />
                      </BarChart>
                    </ResponsiveContainer>
                    {/* Screen reader text summary */}
                    <div className="sr-only">
                      Monthly demand: {f.monthly_demand_history.map(m => `${m.month}: ${m.quantity} units`).join(', ')}
                    </div>
                  </div>
                )}

                <dl className="forecast-metrics-list">
                  <div className="forecast-metric">
                    <dt className="metric-label">Stock Level</dt>
                    <dd className={`metric-value ${f.stock_status === 'low' || f.stock_status === 'out_of_stock' ? 'critical' : ''}`}>
                      {f.current_stock} units
                    </dd>
                  </div>

                  <div className="forecast-metric">
                    <dt className="metric-label">
                      Days of Stock Left
                      <Tooltip content={educationalContent.leadTime} />
                    </dt>
                    <dd className={`metric-value ${f.days_of_stock_remaining !== null && f.days_of_stock_remaining <= 14 ? 'warning' : ''}`}>
                      {f.days_of_stock_remaining !== null ? `${f.days_of_stock_remaining} days` : 'N/A'}
                    </dd>
                  </div>
                </dl>

                <div className="forecast-section-title">Demand Analysis</div>

                <dl className="forecast-metrics-list">
                  <div className="forecast-metric">
                    <dt className="metric-label">
                      Avg Monthly Demand
                      <Tooltip content={educationalContent.demandForecasting} />
                    </dt>
                    <dd className="metric-value">{f.avg_monthly_demand} units</dd>
                  </div>

                  <div className="forecast-metric">
                    <dt className="metric-label">Orders (6 months)</dt>
                    <dd className="metric-value">{f.order_count_6m} orders ({f.total_ordered_6m} units)</dd>
                  </div>

                  <div className="forecast-metric">
                    <dt className="metric-label">Avg Lead Time</dt>
                    <dd className="metric-value">{f.avg_lead_time_days} days</dd>
                  </div>
                </dl>

                <div className="forecast-section-title">Recommendations</div>

                <dl className="forecast-metrics-list">
                  <div className="forecast-metric">
                    <dt className="metric-label">
                      EOQ
                      <Tooltip content={educationalContent.eoq} />
                    </dt>
                    <dd className="metric-value highlight">
                      {f.recommended_eoq > 0 ? `${f.recommended_eoq} units` : 'Need more data'}
                    </dd>
                  </div>

                  <div className="forecast-metric">
                    <dt className="metric-label">
                      Reorder Point
                      <Tooltip content={educationalContent.reorderPoint} />
                    </dt>
                    <dd className="metric-value highlight">
                      {f.recommended_reorder_point} units
                    </dd>
                  </div>

                  <div className="forecast-metric">
                    <dt className="metric-label">
                      Safety Stock
                      <Tooltip content={educationalContent.safetyStock} />
                    </dt>
                    <dd className="metric-value">{f.safety_stock} units</dd>
                  </div>
                </dl>

                <div className="forecast-section-title">Cost Estimates (Annual)</div>

                <dl className="forecast-metrics-list">
                  <div className="forecast-metric">
                    <dt className="metric-label">
                      Holding Cost
                      <Tooltip content={educationalContent.holdingCost} />
                    </dt>
                    <dd className="metric-value">{formatCurrency(f.estimated_annual_holding_cost)}</dd>
                  </div>

                  <div className="forecast-metric">
                    <dt className="metric-label">Ordering Cost</dt>
                    <dd className="metric-value">{formatCurrency(f.estimated_annual_ordering_cost)}</dd>
                  </div>

                  <div className="forecast-metric">
                    <dt className="metric-label">Est. Annual Demand</dt>
                    <dd className="metric-value">{f.annual_demand_estimate} units</dd>
                  </div>
                </dl>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default Forecasting;