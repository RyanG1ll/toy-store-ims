const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// GET all notifications (newest first, with optional filter)
router.get('/', async (req, res) => {
  try {
    const { unread_only } = req.query;
    let query = 'SELECT * FROM notifications';
    const params = [];

    if (unread_only === 'true') {
      query += ' WHERE is_read = FALSE';
    }

    query += ' ORDER BY created_at DESC LIMIT 50';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET unread count (for the navbar bell)
router.get('/unread-count', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT COUNT(*) FROM notifications WHERE is_read = FALSE'
    );
    res.json({ count: parseInt(result.rows[0].count) });
  } catch (err) {
    console.error('Error fetching unread count:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT mark single notification as read
router.put('/:id/read', async (req, res) => {
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
router.put('/mark-all-read', async (req, res) => {
  try {
    await pool.query('UPDATE notifications SET is_read = TRUE WHERE is_read = FALSE');
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    console.error('Error marking all read:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE single notification
router.delete('/:id', async (req, res) => {
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

// DELETE clear all read notifications
router.delete('/clear/read', async (req, res) => {
  try {
    await pool.query('DELETE FROM notifications WHERE is_read = TRUE');
    res.json({ message: 'Read notifications cleared' });
  } catch (err) {
    console.error('Error clearing notifications:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;