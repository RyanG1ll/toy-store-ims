const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

// GET forecasting data for all products
router.get('/', auth, async (req, res) => {
  try {
    // Get all active products with their order history
    const products = await pool.query(`
      SELECT p.product_id, p.name, p.sku, p.quantity_in_stock, 
             p.reorder_level, p.reorder_quantity, p.cost_price, p.unit_price
      FROM products p
      WHERE p.is_active = TRUE
      ORDER BY p.name
    `);

    const forecasts = [];

    for (const product of products.rows) {
      // Get delivered order items for this product (last 6 months)
      const orderHistory = await pool.query(`
        SELECT oi.quantity, oi.unit_cost, o.order_date, o.actual_delivery
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.order_id
        WHERE oi.product_id = $1 
          AND o.status = 'delivered'
          AND o.order_date >= NOW() - INTERVAL '6 months'
        ORDER BY o.order_date DESC
      `, [product.product_id]);

      // Calculate metrics
      const totalOrdered = orderHistory.rows.reduce((sum, item) => sum + item.quantity, 0);
      const orderCount = orderHistory.rows.length;
      
      // Average demand per month (based on 6 month window)
      const monthsOfData = Math.max(1, Math.min(6, orderCount > 0 ? 6 : 1));
      const avgMonthlyDemand = totalOrdered / monthsOfData;
      const avgDailyDemand = avgMonthlyDemand / 30;

      // Average lead time (days between order_date and actual_delivery)
      let avgLeadTimeDays = 7; // default assumption
      const deliveriesWithDates = orderHistory.rows.filter(o => o.actual_delivery && o.order_date);
      if (deliveriesWithDates.length > 0) {
        const totalLeadTime = deliveriesWithDates.reduce((sum, o) => {
          const orderDate = new Date(o.order_date);
          const deliveryDate = new Date(o.actual_delivery);
          return sum + (deliveryDate - orderDate) / (1000 * 60 * 60 * 24);
        }, 0);
        avgLeadTimeDays = Math.max(1, Math.round(totalLeadTime / deliveriesWithDates.length));
      }

      // Get monthly demand history for chart (last 6 months)
      const monthlyHistory = await pool.query(`
        SELECT TO_CHAR(DATE_TRUNC('month', o.order_date), 'Mon') as month,
               COALESCE(SUM(oi.quantity), 0)::int as quantity
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.order_id
        WHERE oi.product_id = $1 
          AND o.status = 'delivered'
          AND o.order_date >= NOW() - INTERVAL '6 months'
        GROUP BY DATE_TRUNC('month', o.order_date)
        ORDER BY DATE_TRUNC('month', o.order_date) ASC
      `, [product.product_id]);

      // EOQ (Economic Order Quantity) = sqrt((2 * D * S) / H)
      // D = annual demand, S = ordering cost (fixed at £15 per order), H = holding cost per unit per year
      const annualDemand = avgMonthlyDemand * 12;
      const orderingCost = 15; // estimated fixed cost per order
      const holdingCostRate = 0.25; // 25% of cost price per year
      const holdingCost = product.cost_price * holdingCostRate;
      
      let eoq = 0;
      if (annualDemand > 0 && holdingCost > 0) {
        eoq = Math.round(Math.sqrt((2 * annualDemand * orderingCost) / holdingCost));
      }

      // Reorder Point = (Average Daily Demand × Lead Time) + Safety Stock
      // Safety Stock = Average Daily Demand × Safety Factor (using 1.5 for moderate safety)
      const safetyStock = Math.round(avgDailyDemand * 1.5);
      const reorderPoint = Math.round((avgDailyDemand * avgLeadTimeDays) + safetyStock);

      // Days of stock remaining
      const daysOfStock = avgDailyDemand > 0 
        ? Math.round(product.quantity_in_stock / avgDailyDemand) 
        : null;

      // Stock status
      let stockStatus = 'healthy';
      if (product.quantity_in_stock === 0) stockStatus = 'out_of_stock';
      else if (product.quantity_in_stock <= product.reorder_level) stockStatus = 'low';
      else if (daysOfStock !== null && daysOfStock <= 14) stockStatus = 'warning';

      forecasts.push({
        product_id: product.product_id,
        name: product.name,
        sku: product.sku,
        current_stock: product.quantity_in_stock,
        cost_price: product.cost_price,
        unit_price: product.unit_price,
        current_reorder_level: product.reorder_level,
        current_reorder_quantity: product.reorder_quantity,
        // Calculated metrics
        avg_monthly_demand: Math.round(avgMonthlyDemand * 10) / 10,
        avg_daily_demand: Math.round(avgDailyDemand * 10) / 10,
        avg_lead_time_days: avgLeadTimeDays,
        total_ordered_6m: totalOrdered,
        order_count_6m: orderCount,
        // Forecasting recommendations
        recommended_eoq: eoq,
        recommended_reorder_point: reorderPoint,
        safety_stock: safetyStock,
        days_of_stock_remaining: daysOfStock,
        stock_status: stockStatus,
        // Annual estimates
        annual_demand_estimate: Math.round(annualDemand),
        estimated_annual_holding_cost: Math.round(holdingCost * eoq * 0.5 * 100) / 100,
        estimated_annual_ordering_cost: annualDemand > 0 && eoq > 0 
          ? Math.round((annualDemand / eoq) * orderingCost * 100) / 100 
          : 0,
        monthly_demand_history: monthlyHistory.rows
      });
    }

    res.json(forecasts);
  } catch (err) {
    console.error('Forecasting error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET forecasting for a single product
router.get('/:id', auth, async (req, res) => {
  try {
    // Reuse the same logic but for one product
    const product = await pool.query(
      'SELECT * FROM products WHERE product_id = $1 AND is_active = TRUE',
      [req.params.id]
    );
    if (product.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    // For now, redirect to the main endpoint with a filter
    // This could be expanded with more detailed per-product analysis
    res.json({ message: 'Use GET /api/forecasting for all product forecasts' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;