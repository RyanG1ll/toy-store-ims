const jwt = require('jsonwebtoken');

// Middleware to authenticate requests using JWT
// This function checks for the presence of a JWT in the Authorization header,
// verifies it, and attaches the decoded user information to the request object.
// If the token is missing or invalid, it responds with a 401 Unauthorized status.
function auth(req, res, next) {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token.' });
  }
}

module.exports = auth;