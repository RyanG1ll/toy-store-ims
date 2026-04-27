const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');

// POST register
// This route handles user registration. It validates the input, checks if the user already exists,
// hashes the password, and inserts the new user into the database. If successful, it returns a JWT token and user information.
router.post('/register',
  [
    body('username').notEmpty().trim().withMessage('Username is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
      .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter')
      .matches(/[a-z]/).withMessage('Password must contain a lowercase letter')
      .matches(/[0-9]/).withMessage('Password must contain a number')
      .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('Password must contain a special character'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { username, email, password } = req.body;

      // Check if user already exists
      const existingUser = await pool.query(
        'SELECT * FROM users WHERE email = $1 OR username = $2',
        [email, username]
      );
      if (existingUser.rows.length > 0) {
        return res.status(400).json({ error: 'User already exists' });
      }

      // Hash the password
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(password, salt);

      // Insert new user
      const result = await pool.query(
        `INSERT INTO users (username, email, password_hash)
         VALUES ($1, $2, $3) RETURNING user_id, username, email, role`,
        [username, email, password_hash]
      );

      const user = result.rows[0];

      // Create JWT token
      const token = jwt.sign(
        { user_id: user.user_id, username: user.username, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.status(201).json({ token, user });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// POST login
// This route handles user login. It validates the input, checks if the user exists, compares the password,
// and if valid, returns a JWT token and user information.
// Returns 400 for invalid credentials and 500 for server errors. The token is set to expire in 24 hours.
// Also returns the same message for both invalid email and password to prevent user enumeration attacks.
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

      // Find user by email or username
      const result = await pool.query(
        'SELECT * FROM users WHERE email = $1 OR username = $1',
        [identifier]
      );
      if (result.rows.length === 0) {
        return res.status(400).json({ error: 'Invalid email/username or password' });
      }

      const user = result.rows[0];

      // Compare password with hash
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res.status(400).json({ error: 'Invalid email/username or password' });
      }

      // Create JWT token
      const token = jwt.sign(
        { user_id: user.user_id, username: user.username, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        token,
        user: {
          user_id: user.user_id,
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

module.exports = router;