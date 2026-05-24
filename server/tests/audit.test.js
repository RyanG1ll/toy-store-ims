jest.mock('../config/db', () => ({
  query: jest.fn(),
}));

const pool = require('../config/db');
const { logAuditEvent } = require('../utils/audit');

describe('Audit Logging Utility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  test('should insert an audit log entry with correct parameters', async () => {
    pool.query.mockResolvedValue({ rows: [] });

    await logAuditEvent(1, 'LOGIN_SUCCESS', 'User testuser logged in');

    expect(pool.query).toHaveBeenCalledWith(
      'INSERT INTO audit_log (user_id, action, detail) VALUES ($1, $2, $3)',
      [1, 'LOGIN_SUCCESS', 'User testuser logged in']
    );
  });

  test('should handle null userId for anonymous events', async () => {
    pool.query.mockResolvedValue({ rows: [] });

    await logAuditEvent(null, 'LOGIN_FAILED', 'Failed login attempt');

    expect(pool.query).toHaveBeenCalledWith(
      'INSERT INTO audit_log (user_id, action, detail) VALUES ($1, $2, $3)',
      [null, 'LOGIN_FAILED', 'Failed login attempt']
    );
  });

  test('should not throw when the database query fails', async () => {
    pool.query.mockRejectedValue(new Error('Connection refused'));

    // logAuditEvent should complete without throwing
    await expect(logAuditEvent(1, 'TEST', 'test detail')).resolves.toBeUndefined();
  });

  test('should log an error to console when the database query fails', async () => {
    pool.query.mockRejectedValue(new Error('Connection refused'));

    await logAuditEvent(1, 'TEST', 'test detail');

    expect(console.error).toHaveBeenCalledWith(
      'Failed to write audit log:',
      'Connection refused'
    );
  });

  test('should accept all required audit action types', async () => {
    pool.query.mockResolvedValue({ rows: [] });

    const actions = [
      'LOGIN_SUCCESS', 'LOGIN_FAILED', 'REGISTER', 'EMAIL_VERIFIED',
      'PASSWORD_CHANGE', 'PASSWORD_CHANGE_FAILED', 'PASSWORD_RESET_REQUEST',
      'PASSWORD_RESET', 'PROFILE_UPDATE', 'PRODUCT_CREATE', 'PRODUCT_UPDATE',
      'PRODUCT_DELETE', 'SUPPLIER_CREATE', 'SUPPLIER_UPDATE', 'SUPPLIER_DELETE',
      'ORDER_CREATE', 'ORDER_STATUS', 'ORDER_DELETE',
    ];

    for (const action of actions) {
      await logAuditEvent(1, action, `Test ${action}`);
    }

    expect(pool.query).toHaveBeenCalledTimes(actions.length);
  });
});
