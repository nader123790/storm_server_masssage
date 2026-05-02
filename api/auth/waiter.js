// api/auth/waiter.js
const jwt = require('jsonwebtoken');
const { getDb } = require('../../lib/firebase');
const { handleCors } = require('../../lib/cors');
const crypto = require('crypto');

module.exports = async (req, res) => {
  if (handleCors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  try {
    const { password } = req.body;

    if (!password || typeof password !== 'string') {
      return res.status(400).json({ error: 'Password is required.' });
    }

    const db = getDb();
    const settingsDoc = await db.collection('settings').doc('waiter').get();

    if (!settingsDoc.exists) {
      return res.status(500).json({ error: 'Authentication service unavailable.' });
    }

    const correctPassword = settingsDoc.data().password;

    const inputBuf = Buffer.from(password);
    const correctBuf = Buffer.from(correctPassword);
    const lengthMatch = inputBuf.length === correctBuf.length;
    const contentMatch =
      lengthMatch && crypto.timingSafeEqual(inputBuf, correctBuf);

    if (!contentMatch) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const token = jwt.sign(
      { role: 'waiter' },
      process.env.JWT_SECRET,
      { expiresIn: '8h', issuer: 'storm-cafe' }
    );

    return res.json({ token });
  } catch (err) {
    console.error('[Auth] loginWaiter error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};
