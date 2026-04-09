const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    // Run all queries in parallel for speed
    const [
      totalProducts,
      totalSuppliers,
      lowStockItems,
      recentOrders,
      stockByCategory,
      ordersOverTime,
      stockStatusBreakdown
    ] = await Promise.all([
      // Total active products
      pool.query('SELECT COUNT(*) FROM products WHERE is_active = TRUE'),

      // Total active suppliers
      pool.query('SELECT COUNT(*) FROM suppliers WHERE is_active = TRUE'),

      // Low stock items
      pool.query(`
        SELECT p.product_id, p.name, p.sku, p.quantity_in_stock, p.reorder_level
        FROM products p
        WHERE p.is_active = TRUE AND p.quantity_in_stock <= p.reorder_level
        ORDER BY p.quantity_in_stock ASC
        LIMIT 10
      `),

      // Recent orders
      pool.query(`
        SELECT o.order_id, o.status, o.total_cost, o.order_date, s.name as supplier_name
        FROM orders o
        LEFT JOIN suppliers s ON o.supplier_id = s.supplier_id
        ORDER BY o.order_date DESC
        LIMIT 5
      `),

      // Stock value grouped by category (for pie chart)
      pool.query(`
        SELECT c.name as category, 
               COALESCE(SUM(p.quantity_in_stock), 0)::int as total_stock,
               COUNT(p.product_id)::int as product_count
        FROM categories c
        LEFT JOIN products p ON p.category_id = c.category_id AND p.is_active = TRUE
        GROUP BY c.category_id, c.name
        ORDER BY total_stock DESC
      `),

      // Orders per month (last 6 months, for line chart)
      pool.query(`
        SELECT TO_CHAR(DATE_TRUNC('month', order_date), 'Mon YYYY') as month,
               COUNT(*)::int as order_count,
               COALESCE(SUM(total_cost), 0)::float as total_value
        FROM orders
        WHERE order_date >= NOW() - INTERVAL '6 months'
        GROUP BY DATE_TRUNC('month', order_date)
        ORDER BY DATE_TRUNC('month', order_date) ASC
      `),

      // Stock status breakdown (for donut chart)
      pool.query(`
        SELECT 
          SUM(CASE WHEN quantity_in_stock = 0 THEN 1 ELSE 0 END)::int as out_of_stock,
          SUM(CASE WHEN quantity_in_stock > 0 AND quantity_in_stock <= reorder_level THEN 1 ELSE 0 END)::int as low_stock,
          SUM(CASE WHEN quantity_in_stock > reorder_level THEN 1 ELSE 0 END)::int as healthy
        FROM products
        WHERE is_active = TRUE
      `)
    ]);

    res.json({
      totalProducts: parseInt(totalProducts.rows[0].count),
      totalSuppliers: parseInt(totalSuppliers.rows[0].count),
      lowStockItems: lowStockItems.rows,
      recentOrders: recentOrders.rows,
      stockByCategory: stockByCategory.rows,
      ordersOverTime: ordersOverTime.rows,
      stockStatusBreakdown: stockStatusBreakdown.rows[0]
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;