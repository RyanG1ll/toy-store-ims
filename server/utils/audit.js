const pool = require('../config/db');

// Logs an audit event to the database. This function is designed to be non-blocking and should not throw errors, as audit logging should never interfere with the main application flow.
async function logAuditEvent(userId, action, detail) {
  try {
    await pool.query(
      'INSERT INTO audit_log (user_id, action, detail) VALUES ($1, $2, $3)',
      [userId, action, detail]
    );
  } catch (err) {
    // Log to console but don't throw — audit logging should never break the main flow
    console.error('Failed to write audit log:', err.message);
  }
}

module.exports = { logAuditEvent };
