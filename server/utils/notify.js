const pool = require('../config/db');

// Utility function to create a notification
async function createNotification(type, severity, title, message, link = null) {
  try {
    await pool.query(
      `INSERT INTO notifications (type, severity, title, message, link)
       VALUES ($1, $2, $3, $4, $5)`,
      [type, severity, title, message, link]
    );
  } catch (err) {
    console.error('Failed to create notification:', err);
  }
}

module.exports = { createNotification };