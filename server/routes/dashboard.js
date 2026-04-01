const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// GET /api/dashboard
// Returns summary data for the dashboard
// This includes total products, total suppliers, low stock items, and recent orders
router.get('/', async (req, res) => {
  try {
    // Run all queries at the same time for speed
    const [products, suppliers, lowStock, recentOrders] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM products WHERE is_active = TRUE'),
      pool.query('SELECT COUNT(*) FROM suppliers WHERE is_active = TRUE'),
      pool.query(
        `SELECT product_id, name, sku, quantity_in_stock, reorder_level
         FROM products
         WHERE is_active = TRUE AND quantity_in_stock <= reorder_level
         ORDER BY quantity_in_stock ASC`
      ),
      pool.query(
        `SELECT o.order_id, o.order_date, o.status, o.total_cost, s.name as supplier_name
         FROM orders o
         LEFT JOIN suppliers s ON o.supplier_id = s.supplier_id
         ORDER BY o.order_date DESC
         LIMIT 5`
      ),
    ]);

    res.json({
      totalProducts: parseInt(products.rows[0].count),
      totalSuppliers: parseInt(suppliers.rows[0].count),
      lowStockItems: lowStock.rows,
      recentOrders: recentOrders.rows,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;