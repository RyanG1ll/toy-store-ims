const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// GET /api/suppliers - Get all active suppliers
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM suppliers WHERE is_active = TRUE ORDER BY name ASC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;