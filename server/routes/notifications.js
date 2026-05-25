const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

// GET all notifications (newest first, with optional filters)
router.get('/', auth, async (req, res) => {
  try {
    const { unread_only, include_cleared, cleared_only } = req.query;
    let query = 'SELECT * FROM notifications';
    const conditions = [];
    const params = [];

    if (cleared_only === 'true') {
      // Show only cleared messages
      conditions.push('is_cleared = TRUE');
    } else if (include_cleared !== 'true') {
      // By default hide cleared messages
      conditions.push('is_cleared = FALSE');
    }

    if (unread_only === 'true') {
      conditions.push('is_read = FALSE');
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY created_at DESC LIMIT 100';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET unread count (for the navbar bell)
router.get('/unread-count', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT COUNT(*) FROM notifications WHERE is_read = FALSE AND is_cleared = FALSE'
    );
    res.json({ count: parseInt(result.rows[0].count) });
  } catch (err) {
    console.error('Error fetching unread count:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT mark single notification as read
router.put('/:id/read', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE notifications SET is_read = TRUE WHERE notification_id = $1 RETURNING *',
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error marking notification read:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT mark all as read
router.put('/mark-all-read', auth, async (req, res) => {
  try {
    await pool.query('UPDATE notifications SET is_read = TRUE WHERE is_read = FALSE');
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    console.error('Error marking all read:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE single notification
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM notifications WHERE notification_id = $1 RETURNING *',
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    res.json({ message: 'Notification deleted' });
  } catch (err) {
    console.error('Error deleting notification:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT clear read notifications (soft-delete only info severity; critical/warning stay visible)
router.put('/clear/read', auth, async (req, res) => {
  try {
    const result = await pool.query(
      "UPDATE notifications SET is_cleared = TRUE WHERE is_read = TRUE AND is_cleared = FALSE AND severity = 'info'"
    );
    res.json({ message: 'Read info notifications cleared', cleared: result.rowCount });
  } catch (err) {
    console.error('Error clearing notifications:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT clear all read notifications including critical/warning (explicit user action)
router.put('/clear/all-read', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE notifications SET is_cleared = TRUE WHERE is_read = TRUE AND is_cleared = FALSE'
    );
    res.json({ message: 'All read notifications cleared', cleared: result.rowCount });
  } catch (err) {
    console.error('Error clearing all notifications:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;