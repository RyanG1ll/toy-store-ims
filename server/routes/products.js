const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { body, validationResult } = require('express-validator');

// GET all products with optional filters
router.get('/', async (req, res) => {
  try {
    const { search, category, supplier, low_stock } = req.query;
    let query = `
      SELECT p.*, c.name as category_name, s.name as supplier_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.category_id
      LEFT JOIN suppliers s ON p.supplier_id = s.supplier_id
      WHERE p.is_active = TRUE
    `;
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (p.name ILIKE $${params.length} OR p.sku ILIKE $${params.length})`;
    }
    if (category) {
      params.push(category);
      query += ` AND p.category_id = $${params.length}`;
    }
    if (low_stock === 'true') {
      query += ` AND p.quantity_in_stock <= p.reorder_level`;
    }

    query += ` ORDER BY p.name ASC`;
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET single product
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, c.name as category_name, s.name as supplier_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.category_id
       LEFT JOIN suppliers s ON p.supplier_id = s.supplier_id
       WHERE p.product_id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST create product
router.post('/',
  [
    body('name').notEmpty().withMessage('Product name is required'),
    body('sku').notEmpty().withMessage('SKU is required'),
    body('unit_price').isFloat({ min: 0 }),
    body('cost_price').isFloat({ min: 0 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { name, description, sku, category_id, supplier_id,
              unit_price, cost_price, quantity_in_stock,
              reorder_level, reorder_quantity, age_range } = req.body;

      const result = await pool.query(
        `INSERT INTO products
         (name, description, sku, category_id, supplier_id,
          unit_price, cost_price, quantity_in_stock,
          reorder_level, reorder_quantity, age_range)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         RETURNING *`,
        [name, description, sku, category_id, supplier_id,
         unit_price, cost_price, quantity_in_stock || 0,
         reorder_level || 10, reorder_quantity || 50, age_range]
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      if (err.code === '23505') {
        return res.status(400).json({ error: 'SKU already exists' });
      }
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// PUT update product
router.put('/:id', async (req, res) => {
  try {
    const { name, description, sku, category_id, supplier_id,
            unit_price, cost_price, quantity_in_stock,
            reorder_level, reorder_quantity, age_range } = req.body;

    const result = await pool.query(
      `UPDATE products SET
        name=$1, description=$2, sku=$3, category_id=$4, supplier_id=$5,
        unit_price=$6, cost_price=$7, quantity_in_stock=$8,
        reorder_level=$9, reorder_quantity=$10, age_range=$11,
        updated_at=CURRENT_TIMESTAMP
       WHERE product_id=$12 RETURNING *`,
      [name, description, sku, category_id, supplier_id,
       unit_price, cost_price, quantity_in_stock,
       reorder_level, reorder_quantity, age_range, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    await pool.query(
      'UPDATE products SET is_active = FALSE WHERE product_id = $1',
      [req.params.id]
    );
    res.json({ message: 'Product deactivated' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;