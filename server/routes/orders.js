const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { body, validationResult } = require('express-validator');

// GET all orders
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    let query = `
      SELECT o.*, s.name as supplier_name
      FROM orders o
      LEFT JOIN suppliers s ON o.supplier_id = s.supplier_id
    `;
    const params = [];

    if (status) {
      params.push(status);
      query += ` WHERE o.status = $${params.length}`;
    }

    query += ' ORDER BY o.order_date DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET single order with its items
router.get('/:id', async (req, res) => {
  try {
    const order = await pool.query(
      `SELECT o.*, s.name as supplier_name
       FROM orders o
       LEFT JOIN suppliers s ON o.supplier_id = s.supplier_id
       WHERE o.order_id = $1`,
      [req.params.id]
    );

    if (order.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Get the line items for this order
    const items = await pool.query(
      `SELECT oi.*, p.name as product_name, p.sku
       FROM order_items oi
       LEFT JOIN products p ON oi.product_id = p.product_id
       WHERE oi.order_id = $1`,
      [req.params.id]
    );

    res.json({
      ...order.rows[0],
      items: items.rows,
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST create order with items
router.post('/',
  [
    body('supplier_id').notEmpty().withMessage('Supplier is required'),
    body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Use a transaction so either everything saves or nothing does
    // This is important to maintain data integrity between orders and their items
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const { supplier_id, expected_delivery, notes, items } = req.body;

      // Calculate total cost from items
      const total_cost = items.reduce(
        (sum, item) => sum + item.quantity * item.unit_cost, 0
      );

      // Insert the order
      const orderResult = await client.query(
        `INSERT INTO orders (supplier_id, expected_delivery, notes, total_cost)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [supplier_id, expected_delivery || null, notes, total_cost]
      );
      const order = orderResult.rows[0];

      // Insert each line item
      for (const item of items) {
        await client.query(
          `INSERT INTO order_items (order_id, product_id, quantity, unit_cost)
           VALUES ($1, $2, $3, $4)`,
          [order.order_id, item.product_id, item.quantity, item.unit_cost]
        );
      }

      await client.query('COMMIT');

      res.status(201).json({ ...order, items });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(err.message);
      res.status(500).json({ error: 'Server error' });
    } finally {
      client.release();
    }
  }
);

// PUT update order status
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const updates = { status };

    // If marking as delivered, record the actual delivery date
    if (status === 'delivered') {
      updates.actual_delivery = new Date().toISOString().split('T')[0];
    }

    const result = await pool.query(
      `UPDATE orders SET
        status = $1,
        actual_delivery = COALESCE($2, actual_delivery),
        updated_at = CURRENT_TIMESTAMP
       WHERE order_id = $3 RETURNING *`,
      [updates.status, updates.actual_delivery || null, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // If delivered, update stock levels for each item
    if (status === 'delivered') {
      const items = await pool.query(
        'SELECT * FROM order_items WHERE order_id = $1',
        [req.params.id]
      );

      for (const item of items.rows) {
        await pool.query(
          `UPDATE products SET
            quantity_in_stock = quantity_in_stock + $1,
            updated_at = CURRENT_TIMESTAMP
           WHERE product_id = $2`,
          [item.quantity, item.product_id]
        );

        // Log the stock movement
        await pool.query(
          `INSERT INTO stock_movements (product_id, movement_type, quantity, reason)
           VALUES ($1, 'in', $2, $3)`,
          [item.product_id, item.quantity, `Order #${req.params.id} delivered`]
        );
      }
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE order (only if pending)
router.delete('/:id', async (req, res) => {
  try {
    const order = await pool.query(
      'SELECT status FROM orders WHERE order_id = $1',
      [req.params.id]
    );

    if (order.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    if (order.rows[0].status !== 'pending') {
      return res.status(400).json({ error: 'Only pending orders can be deleted' });
    }

    await pool.query('DELETE FROM orders WHERE order_id = $1', [req.params.id]);
    res.json({ message: 'Order deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
