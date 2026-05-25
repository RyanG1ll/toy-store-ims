const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const { sendVerificationEmail } = require('../utils/email');
const { logAuditEvent } = require('../utils/audit');

// A pre-hashed dummy password used for fake bcrypt comparisons.
// When a login attempt uses a non-existent email/username, we still run
// bcrypt.compare against this hash so the response time is indistinguishable
// from a real credential check. This prevents timing-based account enumeration.
const DUMMY_HASH = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';

// This function validates password strength on the server side.
// It checks for minimum length, presence of uppercase/lowercase letters, digits, and special characters.
function checkPasswordStrength(password) {
  const errors = [];
  if (password.length < 8) errors.push('Password must be at least 8 characters');
  if (!/[A-Z]/.test(password)) errors.push('Password must contain an uppercase letter');
  if (!/[a-z]/.test(password)) errors.push('Password must contain a lowercase letter');
  if (!/[0-9]/.test(password)) errors.push('Password must contain a number');
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push('Password must contain a special character');

  // Additional strength checks
  if (password.length >= 8 && /^(.)\1+$/.test(password)) {
    errors.push('Password cannot be all the same character');
  }

  return { valid: errors.length === 0, errors };
}

// Handles user registration with real name fields, password strength validation,
// and email verification. The user must verify their email before logging in.
router.post('/register',
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
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { firstName, lastName, username, email, password } = req.body;

      // Server-side password strength check
      const strengthCheck = checkPasswordStrength(password);
      if (!strengthCheck.valid) {
        return res.status(400).json({
          errors: strengthCheck.errors.map(msg => ({ msg })),
        });
      }

      // Check if user already exists and gives a generic message to prevent enumeration
      const existingUser = await pool.query(
        'SELECT * FROM users WHERE email = $1 OR username = $2',
        [email, username]
      );
      if (existingUser.rows.length > 0) {
        return res.status(400).json({
          error: 'Unable to create account. Please try different credentials.',
        });
      }

      // Hash the password
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(password, salt);

      // Generate email verification token (cryptographically secure)
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Insert new user with email_verified = false
      const result = await pool.query(
        `INSERT INTO users (first_name, last_name, username, email, password_hash, email_verified, verification_token, verification_expires)
         VALUES ($1, $2, $3, $4, $5, FALSE, $6, $7)
         RETURNING user_id, first_name, last_name, username, email, role`,
        [firstName, lastName, username, email, password_hash, verificationToken, verificationExpires]
      );

      const user = result.rows[0];

      // Send verification email
      try {
        await sendVerificationEmail(email, firstName, verificationToken);
      } catch (emailErr) {
        console.error('Failed to send verification email:', emailErr.message);
        // Still return success when the account is created, they can resend later
      }

      await logAuditEvent(user.user_id, 'REGISTER', `New account created for ${username}`);

      // Do NOT return a JWT token
      // The user must verify email first
      res.status(201).json({
        message: 'Account created successfully. Please check your email to verify your account before logging in.',
        requiresVerification: true,
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// Validates the email verification token and marks the user's email as verified.
// After this, the user can log in normally.
router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ error: 'Verification token is required' });
    }

    // Find user with matching token that hasn't expired
    const result = await pool.query(
      'SELECT * FROM users WHERE verification_token = $1 AND verification_expires > NOW()',
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        error: 'Invalid or expired verification link. Please request a new one.',
      });
    }

    const user = result.rows[0];

    // Check if already verified
    if (user.email_verified) {
      return res.status(200).json({ message: 'Email is already verified. You can log in.' });
    }

    // Mark email as verified and clear the token
    await pool.query(
      'UPDATE users SET email_verified = TRUE, verification_token = NULL, verification_expires = NULL, updated_at = NOW() WHERE user_id = $1',
      [user.user_id]
    );

    await logAuditEvent(user.user_id, 'EMAIL_VERIFIED', 'Email address verified successfully');

    res.status(200).json({
      message: 'Email verified successfully! You can now log in.',
      verified: true,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Generates a new verification token and resends the verification email.
// Uses generic messaging to prevent account enumeration.
router.post('/resend-verification',
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

      // Generic response regardless of whether the email exists and prevents enumeration
      const genericMessage = 'If an account with that email exists and is not yet verified, a new verification email has been sent.';

      const result = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );

      if (result.rows.length === 0) {
        // User doesn't exist so returns same generic message
        return res.status(200).json({ message: genericMessage });
      }

      const user = result.rows[0];

      if (user.email_verified) {
        // Already verified so returns same generic message
        return res.status(200).json({ message: genericMessage });
      }

      // Generate new token
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await pool.query(
        'UPDATE users SET verification_token = $1, verification_expires = $2, updated_at = NOW() WHERE user_id = $3',
        [verificationToken, verificationExpires, user.user_id]
      );

      // Send verification email
      try {
        await sendVerificationEmail(email, user.first_name, verificationToken);
      } catch (emailErr) {
        console.error('Failed to resend verification email:', emailErr.message);
      }

      res.status(200).json({ message: genericMessage });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// Handles user login with account enumeration protection and timing attack prevention.
// Uses the same generic error message for both invalid email/username AND invalid password
// Performs a fake bcrypt.compare against a dummy hash when the user is not found,
// ensuring the response time is consistent regardless of whether the account exists.
// This prevents attackers from using timing differences to determine valid usernames.
// Checks that the user's email is verified before allowing login.
router.post('/login',
  [
    body('identifier').notEmpty().trim().withMessage('Email or username is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { identifier, password } = req.body;

      // Generic error message used for all authentication failures
      // This prevents account enumeration by not revealing whether the
      // email/username exists or the password was wrong
      const genericError = 'Invalid email/username or password';

      // Find user by email or username
      const result = await pool.query(
        'SELECT * FROM users WHERE email = $1 OR username = $1',
        [identifier]
      );

      if (result.rows.length === 0) {
        // User not found and perform a fake bcrypt comparison against a dummy hash
        // to ensure the response time matches that of a real password check.
        await bcrypt.compare(password, DUMMY_HASH);
        return res.status(400).json({ error: genericError });
      }

      const user = result.rows[0];

      // Compare password with stored hash
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        await logAuditEvent(user.user_id, 'LOGIN_FAILED', 'Invalid password attempt');
        return res.status(400).json({ error: genericError });
      }

      // Check if email is verified
      if (!user.email_verified) {
        return res.status(403).json({
          error: 'Please verify your email address before logging in. Check your inbox for the verification link.',
          requiresVerification: true,
          email: user.email,
        });
      }

      // Create JWT token
      const token = jwt.sign(
        { user_id: user.user_id, username: user.username, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      await logAuditEvent(user.user_id, 'LOGIN_SUCCESS', `User ${user.username} logged in`);

      res.json({
        token,
        user: {
          user_id: user.user_id,
          first_name: user.first_name,
          last_name: user.last_name,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// Client-side calls this for real-time password strength feedback.
// Returns strength level and specific feedback messages.
router.post('/check-password-strength', (req, res) => {
  const { password } = req.body;

  if (!password) {
    return res.json({ strength: 0, label: 'None', feedback: [] });
  }

  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  const passed = Object.values(checks).filter(Boolean).length;

  let strength, label;
  if (passed <= 1) { strength = 1; label = 'Very Weak'; }
  else if (passed === 2) { strength = 2; label = 'Weak'; }
  else if (passed === 3) { strength = 3; label = 'Fair'; }
  else if (passed === 4) { strength = 4; label = 'Strong'; }
  else { strength = 5; label = 'Very Strong'; }

  // Extra length makes it even stronger
  if (passed === 5 && password.length >= 12) {
    strength = 5;
    label = 'Very Strong';
  }

  res.json({ strength, label, checks });
});

module.exports = router;
