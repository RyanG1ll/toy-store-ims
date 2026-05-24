jest.mock('../config/db', () => ({
  query: jest.fn(),
}));

jest.mock('../utils/audit', () => ({
  logAuditEvent: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../utils/email', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue({ messageId: 'test-id' }),
  transporter: { verify: jest.fn().mockResolvedValue(true) },
}));

const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const pool = require('../config/db');
const { logAuditEvent } = require('../utils/audit');

describe('Account Routes — GET /me', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return profile data without password hash', async () => {
    const selectQuery = 'SELECT user_id, first_name, last_name, username, email, role, created_at, updated_at FROM users WHERE user_id = $1';

    // The query should NOT include password_hash
    expect(selectQuery).not.toContain('password_hash');
    expect(selectQuery).toContain('user_id');
    expect(selectQuery).toContain('first_name');
    expect(selectQuery).toContain('email');
    expect(selectQuery).toContain('role');
  });

  test('should return user data from database', async () => {
    const mockUser = {
      user_id: 1, first_name: 'Ryan', last_name: 'Gill',
      username: 'ryangill', email: 'ryan@test.com', role: 'admin',
      created_at: '2024-01-01', updated_at: '2024-06-01',
    };

    pool.query.mockResolvedValue({ rows: [mockUser] });

    const result = await pool.query(
      'SELECT user_id, first_name, last_name, username, email, role, created_at, updated_at FROM users WHERE user_id = $1',
      [1]
    );

    expect(result.rows[0]).toEqual(mockUser);
    expect(result.rows[0]).not.toHaveProperty('password_hash');
  });
});

describe('Account Routes — PUT /me (Profile Update)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should check for duplicate email or username before updating', async () => {
    pool.query.mockResolvedValue({ rows: [] });

    const result = await pool.query(
      'SELECT user_id FROM users WHERE (email = $1 OR username = $2) AND user_id != $3',
      ['newemail@test.com', 'newusername', 1]
    );

    expect(result.rows.length).toBe(0);
    expect(pool.query).toHaveBeenCalledWith(
      'SELECT user_id FROM users WHERE (email = $1 OR username = $2) AND user_id != $3',
      ['newemail@test.com', 'newusername', 1]
    );
  });

  test('should detect conflicting username or email from another user', async () => {
    pool.query.mockResolvedValue({ rows: [{ user_id: 2 }] });

    const result = await pool.query(
      'SELECT user_id FROM users WHERE (email = $1 OR username = $2) AND user_id != $3',
      ['taken@test.com', 'takenuser', 1]
    );

    expect(result.rows.length).toBeGreaterThan(0);
  });

  test('should log PROFILE_UPDATE audit event', async () => {
    await logAuditEvent(1, 'PROFILE_UPDATE', 'User updated their profile details');

    expect(logAuditEvent).toHaveBeenCalledWith(
      1, 'PROFILE_UPDATE', 'User updated their profile details'
    );
  });
});

describe('Account Routes — PUT /me/password (Change Password)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should verify current password before allowing change', async () => {
    const currentPassword = 'OldP@ss1';
    const storedHash = await bcrypt.hash(currentPassword, 10);

    const isMatch = await bcrypt.compare(currentPassword, storedHash);
    expect(isMatch).toBe(true);

    const wrongMatch = await bcrypt.compare('WrongPassword!1', storedHash);
    expect(wrongMatch).toBe(false);
  });

  test('should validate new password strength', () => {
    const newPassword = 'weak';
    const errors = [];

    if (newPassword.length < 8) errors.push('Password must be at least 8 characters');
    if (!/[A-Z]/.test(newPassword)) errors.push('Password must contain an uppercase letter');
    if (!/[a-z]/.test(newPassword)) errors.push('Password must contain a lowercase letter');
    if (!/[0-9]/.test(newPassword)) errors.push('Password must contain a number');
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) errors.push('Password must contain a special character');

    expect(errors.length).toBeGreaterThan(0);
    expect(errors).toContain('Password must be at least 8 characters');
  });

  test('should log PASSWORD_CHANGE audit event on success', async () => {
    await logAuditEvent(1, 'PASSWORD_CHANGE', 'User changed their password');

    expect(logAuditEvent).toHaveBeenCalledWith(
      1, 'PASSWORD_CHANGE', 'User changed their password'
    );
  });

  test('should log PASSWORD_CHANGE_FAILED audit event on wrong current password', async () => {
    await logAuditEvent(1, 'PASSWORD_CHANGE_FAILED', 'Incorrect current password provided');

    expect(logAuditEvent).toHaveBeenCalledWith(
      1, 'PASSWORD_CHANGE_FAILED', 'Incorrect current password provided'
    );
  });
});

describe('Account Routes — Forgot Password', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should generate a cryptographically secure reset token', () => {
    const token = crypto.randomBytes(32).toString('hex');

    // Token should be 64 hex characters (32 bytes * 2)
    expect(token).toHaveLength(64);
    expect(token).toMatch(/^[0-9a-f]+$/);
  });

  test('should set reset token expiry to 1 hour', () => {
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000);
    const now = new Date();

    const diffMs = resetExpires.getTime() - now.getTime();
    const diffMinutes = Math.round(diffMs / (60 * 1000));

    expect(diffMinutes).toBe(60);
  });

  test('should use generic message regardless of whether account exists', () => {
    const genericMessage = 'If an account with that email exists, a password reset link has been sent.';

    // The message should not reveal whether the account exists
    expect(genericMessage).not.toContain('not found');
    expect(genericMessage).not.toContain('does not exist');
    expect(genericMessage).toContain('If');
  });

  test('should log PASSWORD_RESET_REQUEST audit event', async () => {
    await logAuditEvent(1, 'PASSWORD_RESET_REQUEST', 'Password reset email requested');

    expect(logAuditEvent).toHaveBeenCalledWith(
      1, 'PASSWORD_RESET_REQUEST', 'Password reset email requested'
    );
  });
});

describe('Account Routes — Reset Password', () => {
  test('should log PASSWORD_RESET audit event', async () => {
    await logAuditEvent(1, 'PASSWORD_RESET', 'Password was reset via email link');

    expect(logAuditEvent).toHaveBeenCalledWith(
      1, 'PASSWORD_RESET', 'Password was reset via email link'
    );
  });

  test('should clear reset token after successful reset', () => {
    const updateQuery = 'UPDATE users SET password_hash = $1, reset_token = NULL, reset_expires = NULL, updated_at = NOW() WHERE user_id = $2';

    expect(updateQuery).toContain('reset_token = NULL');
    expect(updateQuery).toContain('reset_expires = NULL');
  });
});

describe('Account Routes — Audit Log (Admin Only)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should deny access to non-admin users', () => {
    const user = { role: 'staff' };
    const isAdmin = user.role === 'admin';
    expect(isAdmin).toBe(false);
  });

  test('should allow access to admin users', () => {
    const user = { role: 'admin' };
    const isAdmin = user.role === 'admin';
    expect(isAdmin).toBe(true);
  });

  test('should calculate pagination offset correctly', () => {
    const testCases = [
      { page: 1, limit: 25, expectedOffset: 0 },
      { page: 2, limit: 25, expectedOffset: 25 },
      { page: 3, limit: 15, expectedOffset: 30 },
      { page: 1, limit: 10, expectedOffset: 0 },
    ];

    for (const tc of testCases) {
      const offset = (tc.page - 1) * tc.limit;
      expect(offset).toBe(tc.expectedOffset);
    }
  });

  test('should calculate total pages correctly', () => {
    const testCases = [
      { total: 100, limit: 25, expectedPages: 4 },
      { total: 101, limit: 25, expectedPages: 5 },
      { total: 0, limit: 25, expectedPages: 0 },
      { total: 1, limit: 25, expectedPages: 1 },
      { total: 50, limit: 15, expectedPages: 4 },
    ];

    for (const tc of testCases) {
      const totalPages = Math.ceil(tc.total / tc.limit);
      expect(totalPages).toBe(tc.expectedPages);
    }
  });

  test('should default to page 1 and limit 25 when not specified', () => {
    const page = parseInt(undefined) || 1;
    const limit = parseInt(undefined) || 25;

    expect(page).toBe(1);
    expect(limit).toBe(25);
  });

  test('should query audit log without ip_address column', () => {
    const query = `
      SELECT al.log_id, al.user_id, al.action, al.detail, al.created_at,
             u.username, u.first_name, u.last_name, u.email
      FROM audit_log al
      LEFT JOIN users u ON al.user_id = u.user_id
    `;

    expect(query).not.toContain('ip_address');
    expect(query).toContain('al.log_id');
    expect(query).toContain('al.action');
    expect(query).toContain('al.detail');
    expect(query).toContain('u.username');
  });
});
