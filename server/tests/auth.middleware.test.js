const jwt = require('jsonwebtoken');

// Set the JWT_SECRET before importing middleware
process.env.JWT_SECRET = 'test-secret-key';

const auth = require('../middleware/auth');

describe('Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = { header: jest.fn() };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  test('should return 401 if no token is provided', () => {
    req.header.mockReturnValue(undefined);

    auth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Access denied. No token provided.' });
    expect(next).not.toHaveBeenCalled();
  });

  test('should return 401 if token is empty string', () => {
    req.header.mockReturnValue('Bearer ');

    auth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('should return 401 if token is invalid', () => {
    req.header.mockReturnValue('Bearer invalid-token-here');

    auth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token.' });
    expect(next).not.toHaveBeenCalled();
  });

  test('should call next and set req.user for a valid token', () => {
    const payload = { user_id: 1, username: 'testuser', role: 'staff' };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
    req.header.mockReturnValue(`Bearer ${token}`);

    auth(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toBeDefined();
    expect(req.user.user_id).toBe(1);
    expect(req.user.username).toBe('testuser');
    expect(req.user.role).toBe('staff');
  });

  test('should return 401 for an expired token', () => {
    const payload = { user_id: 1, username: 'testuser', role: 'staff' };
    // Create a token that expired 1 hour ago
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '-1h' });
    req.header.mockReturnValue(`Bearer ${token}`);

    auth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token.' });
    expect(next).not.toHaveBeenCalled();
  });

  test('should return 401 for a token signed with a different secret', () => {
    const payload = { user_id: 1, username: 'testuser', role: 'staff' };
    const token = jwt.sign(payload, 'wrong-secret');
    req.header.mockReturnValue(`Bearer ${token}`);

    auth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token.' });
    expect(next).not.toHaveBeenCalled();
  });

  test('should extract token correctly from Authorization header', () => {
    const payload = { user_id: 5, username: 'admin', role: 'admin' };
    const token = jwt.sign(payload, process.env.JWT_SECRET);
    req.header.mockReturnValue(`Bearer ${token}`);

    auth(req, res, next);

    expect(req.header).toHaveBeenCalledWith('Authorization');
    expect(req.user.user_id).toBe(5);
    expect(req.user.role).toBe('admin');
  });
});
