const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const { logAuditEvent } = require('../utils/audit');
const { sendVerificationEmail } = require('../utils/email');
const nodemailer = require('nodemailer');

// ─── Helper: send password reset email ───
async function sendPasswordResetEmail(email, firstName, token) {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`;

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT, 10) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: `Toy Store IMS <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Reset Your Password - Toy Store IMS',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #4a90d9; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Toy Store IMS</h1>
        </div>
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-top: 0;">Password Reset Request</h2>
          <p style="color: #555; font-size: 16px; line-height: 1.6;">
            Hi ${firstName}, we received a request to reset your password. Click the button below to set a new password:
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}"
               style="background: #4a90d9; color: #ffffff; padding: 14px 32px; text-decoration: none;
                      border-radius: 6px; font-size: 16px; font-weight: bold; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p style="color: #888; font-size: 14px; line-height: 1.5;">
            If the button doesn't work, copy and paste this link into your browser:
          </p>
          <p style="color: #4a90d9; font-size: 14px; word-break: break-all;">${resetUrl}</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="color: #999; font-size: 12px;">
            This link will expire in 1 hour. If you did not request a password reset, please ignore this email.
            Your password will remain unchanged.
          </p>
        </div>
      </div>
    `,
    text: `Hi ${firstName},\n\nWe received a request to reset your password. Visit this link to set a new password:\n${resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you did not request this, please ignore this email.`,
  });
}

// ─── GET /api/account/me ───
// Returns the authenticated user's profile details including timestamps.
router.get('/me', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT user_id, first_name, last_name, username, email, role, created_at, updated_at FROM users WHERE user_id = $1',
      [req.user.user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── PUT /api/account/me ───
// Updates the authenticated user's profile (first name, last name, username, email).
router.put('/me', auth,
  [
    body('firstName')
      .notEmpty().withMessage('First name is required')
      .trim()
      .isLength({ min: 2, max: 50 }).withMessage('First name must be 2-50 characters')
      .matches(/^[a-zA-Z\s'-]+$/).withMessage('First name can only contain letters, spaces, hyphens, and apostrophes'),
    body('lastName')
      .notEmpty().withMessage('Last name is required')
      .trim()
      .isLength({ min: 2, max: 50 }).withMessage('Last name must be 2-50 characters')
      .matches(/^[a-zA-Z\s'-]+$/).withMessage('Last name can only contain letters, spaces, hyphens, and apostrophes'),
    body('username')
      .notEmpty().withMessage('Username is required')
      .trim()
      .isLength({ min: 3, max: 50 }).withMessage('Username must be 3-50 characters')
      .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers, and underscores'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { firstName, lastName, username, email } = req.body;
      const userId = req.user.user_id;

      // Check if email or username is taken by another user
      const existing = await pool.query(
        'SELECT user_id FROM users WHERE (email = $1 OR username = $2) AND user_id != $3',
        [email, username, userId]
      );
      if (existing.rows.length > 0) {
        return res.status(400).json({ error: 'Email or username is already taken by another account.' });
      }

      const result = await pool.query(
        `UPDATE users SET first_name = $1, last_name = $2, username = $3, email = $4, updated_at = NOW()
         WHERE user_id = $5
         RETURNING user_id, first_name, last_name, username, email, role, created_at, updated_at`,
        [firstName, lastName, username, email, userId]
      );

      await logAuditEvent(userId, 'PROFILE_UPDATE', `User updated their profile details`);

      res.json(result.rows[0]);
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// ─── PUT /api/account/me/password ───
// Changes the authenticated user's password. Requires current password for verification.
router.put('/me/password', auth,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').notEmpty().withMessage('New password is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.user_id;

      // Validate new password strength
      const strengthErrors = [];
      if (newPassword.length < 8) strengthErrors.push('Password must be at least 8 characters');
      if (!/[A-Z]/.test(newPassword)) strengthErrors.push('Password must contain an uppercase letter');
      if (!/[a-z]/.test(newPassword)) strengthErrors.push('Password must contain a lowercase letter');
      if (!/[0-9]/.test(newPassword)) strengthErrors.push('Password must contain a number');
      if (!/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) strengthErrors.push('Password must contain a special character');

      if (strengthErrors.length > 0) {
        return res.status(400).json({ errors: strengthErrors.map(msg => ({ msg })) });
      }

      // Get current password hash
      const user = await pool.query('SELECT password_hash FROM users WHERE user_id = $1', [userId]);
      if (user.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Verify current password
      const isMatch = await bcrypt.compare(currentPassword, user.rows[0].password_hash);
      if (!isMatch) {
        await logAuditEvent(userId, 'PASSWORD_CHANGE_FAILED', 'Incorrect current password provided');
        return res.status(400).json({ error: 'Current password is incorrect' });
      }

      // Hash and save new password
      const salt = await bcrypt.genSalt(10);
      const newHash = await bcrypt.hash(newPassword, salt);
      await pool.query(
        'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE user_id = $2',
        [newHash, userId]
      );

      await logAuditEvent(userId, 'PASSWORD_CHANGE', 'User changed their password');

      res.json({ message: 'Password updated successfully' });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// ─── POST /api/account/forgot-password ───
// Sends a password reset email with a secure token. Uses generic messaging
// to prevent account enumeration (same response whether email exists or not).
router.post('/forgot-password',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { email } = req.body;
      const genericMessage = 'If an account with that email exists, a password reset link has been sent.';

      const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

      if (result.rows.length === 0) {
        // User doesn't exist — return same generic message to prevent enumeration
        return res.status(200).json({ message: genericMessage });
      }

      const user = result.rows[0];

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await pool.query(
        'UPDATE users SET reset_token = $1, reset_expires = $2, updated_at = NOW() WHERE user_id = $3',
        [resetToken, resetExpires, user.user_id]
      );

      try {
        await sendPasswordResetEmail(email, user.first_name, resetToken);
      } catch (emailErr) {
        console.error('Failed to send password reset email:', emailErr.message);
      }

      await logAuditEvent(user.user_id, 'PASSWORD_RESET_REQUEST', 'Password reset email requested');

      res.status(200).json({ message: genericMessage });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// ─── POST /api/account/reset-password ───
// Resets the user's password using the token from the email link.
router.post('/reset-password',
  [
    body('token').notEmpty().withMessage('Reset token is required'),
    body('password').notEmpty().withMessage('New password is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { token, password } = req.body;

      // Validate password strength
      const strengthErrors = [];
      if (password.length < 8) strengthErrors.push('Password must be at least 8 characters');
      if (!/[A-Z]/.test(password)) strengthErrors.push('Password must contain an uppercase letter');
      if (!/[a-z]/.test(password)) strengthErrors.push('Password must contain a lowercase letter');
      if (!/[0-9]/.test(password)) strengthErrors.push('Password must contain a number');
      if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) strengthErrors.push('Password must contain a special character');

      if (strengthErrors.length > 0) {
        return res.status(400).json({ errors: strengthErrors.map(msg => ({ msg })) });
      }

      // Find user with valid reset token
      const result = await pool.query(
        'SELECT * FROM users WHERE reset_token = $1 AND reset_expires > NOW()',
        [token]
      );

      if (result.rows.length === 0) {
        return res.status(400).json({ error: 'Invalid or expired reset link. Please request a new one.' });
      }

      const user = result.rows[0];

      // Hash new password and clear the reset token
      const salt = await bcrypt.genSalt(10);
      const newHash = await bcrypt.hash(password, salt);

      await pool.query(
        'UPDATE users SET password_hash = $1, reset_token = NULL, reset_expires = NULL, updated_at = NOW() WHERE user_id = $2',
        [newHash, user.user_id]
      );

      await logAuditEvent(user.user_id, 'PASSWORD_RESET', 'Password was reset via email link');

      res.json({ message: 'Password has been reset successfully. You can now sign in with your new password.' });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// ─── GET /api/account/audit-log ───
// Returns the audit log (admin only). Supports pagination and optional action filter.
router.get('/audit-log', auth, async (req, res) => {
  try {
    // Only admins can view the audit log
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 25;
    const offset = (page - 1) * limit;
    const actionFilter = req.query.action || null;

    let query, countQuery, params, countParams;

    if (actionFilter) {
      query = `
        SELECT al.log_id, al.user_id, al.action, al.detail, al.created_at,
               u.username, u.first_name, u.last_name, u.email
        FROM audit_log al
        LEFT JOIN users u ON al.user_id = u.user_id
        WHERE al.action = $1
        ORDER BY al.created_at DESC
        LIMIT $2 OFFSET $3
      `;
      countQuery = 'SELECT COUNT(*) FROM audit_log WHERE action = $1';
      params = [actionFilter, limit, offset];
      countParams = [actionFilter];
    } else {
      query = `
        SELECT al.log_id, al.user_id, al.action, al.detail, al.created_at,
               u.username, u.first_name, u.last_name, u.email
        FROM audit_log al
        LEFT JOIN users u ON al.user_id = u.user_id
        ORDER BY al.created_at DESC
        LIMIT $1 OFFSET $2
      `;
      countQuery = 'SELECT COUNT(*) FROM audit_log';
      params = [limit, offset];
      countParams = [];
    }

    const [logs, total] = await Promise.all([
      pool.query(query, params),
      pool.query(countQuery, countParams),
    ]);

    res.json({
      logs: logs.rows,
      total: parseInt(total.rows[0].count),
      page,
      totalPages: Math.ceil(parseInt(total.rows[0].count) / limit),
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
