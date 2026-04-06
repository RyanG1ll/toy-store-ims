const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { body, validationResult } = require('express-validator');

// GET all suppliers
router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    let query = 'SELECT * FROM suppliers WHERE is_active = TRUE';
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (name ILIKE $${params.length} OR contact_name ILIKE $${params.length})`;
    }

    query += ' ORDER BY name ASC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET single supplier
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM suppliers WHERE supplier_id = $1',
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Supplier not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST create supplier
router.post('/',
  [
    body('name').notEmpty().withMessage('Supplier name is required'),
    body('email').optional().isEmail().withMessage('Valid email required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { name, contact_name, email, phone, address, lead_time_days } = req.body;
      const result = await pool.query(
        `INSERT INTO suppliers (name, contact_name, email, phone, address, lead_time_days)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [name, contact_name, email, phone, address, lead_time_days || 7]
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// PUT update supplier
router.put('/:id', async (req, res) => {
  try {
    const { name, contact_name, email, phone, address, lead_time_days } = req.body;
    const result = await pool.query(
      `UPDATE suppliers SET
        name=$1, contact_name=$2, email=$3, phone=$4, address=$5,
        lead_time_days=$6, updated_at=CURRENT_TIMESTAMP
       WHERE supplier_id=$7 RETURNING *`,
      [name, contact_name, email, phone, address, lead_time_days, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Supplier not found' });
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
      'UPDATE suppliers SET is_active = FALSE WHERE supplier_id = $1',
      [req.params.id]
    );
    res.json({ message: 'Supplier deactivated' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;