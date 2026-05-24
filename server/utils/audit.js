const pool = require('../config/db');

/**
 * Logs a security-relevant event to the audit_log table.
 * Used for tracking logins, password changes, account updates, and other actions.
 *
 * @param {number|null} userId - The user performing the action (null for anonymous events)
 * @param {string} action - Short action identifier (e.g. 'LOGIN_SUCCESS', 'PASSWORD_CHANGE')
 * @param {string} detail - Human-readable description of what happened
 * @param {string|null} ipAddress - The IP address of the request (optional)
 */
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
