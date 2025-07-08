const jwt = require('jsonwebtoken');
const db = require('../models/db');

const MAX_DEVICES = 5;
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Generates and stores a refresh token for the given user.
 * Enforces a device limit and logs token creation.
 * @param {Object} user - The user object.
 * @param {Object} req - Express request object.
 * @returns {Promise<string>} The generated refresh token.
 */
async function generateRefreshToken(user, req) {
  const token = jwt.sign({ id: user.id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

  // Gerätelimit prüfen
  const count = await db.countRefreshTokens(user.id);
  if (count >= MAX_DEVICES) {
    await db.deleteOldestRefreshToken(user.id);
    console.log(`[refreshToken] Device limit reached for user ${user.id}, deleted oldest refresh token`);
  }

  await db.saveRefreshToken({
    user_id: user.id,
    token,
    user_agent: req.headers['user-agent'],
    ip_address: req.ip,
    expires_at: new Date(Date.now() + SEVEN_DAYS_MS) // 7 Tage
  });
  console.log(`[refreshToken] Created refresh token for user ${user.id} from IP ${req.ip}`);

  return token;
}

/**
 * Handles refresh token exchange for an access token.
 * Provides consistent error output and logs rejections.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {Object} JSON response with new access token or error.
 */
const refreshToken = async (req, res) => {
  const oldToken = req.cookies?.refresh_token || req.body.token;
  if (!oldToken) {
    return res.status(400).json({ error: 'No token provided' });
  }

  try {
    const payload = jwt.verify(oldToken, process.env.JWT_REFRESH_SECRET);

    // 1. Prüfen, ob Token existiert (noch nicht benutzt wurde)
    const found = await db.findRefreshToken(oldToken);
    if (!found) {
      console.warn(`[SECURITY] Attempted reuse of invalid/expired refresh token`);
      return res.status(403).json({ error: 'Invalid refresh token' });
    }

    // 2. Sofort löschen, egal ob der nächste Schritt klappt
    await db.deleteRefreshToken(oldToken);

    // 3. Neuen Refresh + Access Token erzeugen
    const newRefreshToken = jwt.sign({ id: payload.id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

    await db.saveRefreshToken({
      user_id: payload.id,
      token: newRefreshToken,
      user_agent: req.headers['user-agent'],
      ip_address: req.ip,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });

    const accessToken = jwt.sign({ id: payload.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.cookie('refresh_token', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    console.log(`[ROTATE] Refresh token rotated for user ${payload.id}`);
    return res.json({ accessToken });
  } catch (err) {
    console.warn('[ROTATE] Invalid or expired refresh token:', err.message);
    return res.status(401).json({ error: 'Invalid refresh token' });
  }
};

/**
 * Revokes a refresh token (logout) and logs the action.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {Object} JSON response confirming revocation.
 */
const revokeToken = async (req, res) => {
  const token = req.cookies?.refresh_token || req.body.token;
  const allDevices = req.body.allDevices === true;

  if (!token) {
    console.log('[revokeToken] No token provided');
    return res.json({ revoked: false });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

    if (allDevices) {
      await db.query('DELETE FROM refresh_tokens WHERE user_id = ?', [payload.id]);
      console.log(`[revokeToken] All devices revoked for user ${payload.id}`);
    } else {
      await db.deleteRefreshToken(token);
      console.log(`[revokeToken] Single device token revoked`);
    }

    res.clearCookie('refresh_token');
    return res.json({ revoked: true });
  } catch (err) {
    console.error('[revokeToken] Invalid token', err);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Ergänzen:
async function revokeAllUserTokens(userId) {
  await db.query('DELETE FROM refresh_tokens WHERE user_id = ?', [userId])
}

module.exports = { refreshToken, revokeToken, generateRefreshToken, revokeAllUserTokens };