// lib/auth.js
const jwt = require('jsonwebtoken');

function requireAuth(req, res) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authorization token required.' });
    return false;
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET, {
      issuer: 'storm-cafe',
    });
    req.user = payload;
    return true;
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      res.status(401).json({ error: 'Token expired. Please log in again.' });
    } else {
      res.status(401).json({ error: 'Invalid token.' });
    }
    return false;
  }
}

module.exports = { requireAuth };
