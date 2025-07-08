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
  const refreshTokenValue = req.cookies?.refresh_token || req.body.refreshToken || req.body.token;
  if (!refreshTokenValue) {
    console.log('[refreshToken] No token provided');
    return res.status(400).json({ error: 'No token provided' });
  }

  try {
    const payload = jwt.verify(refreshTokenValue, process.env.JWT_REFRESH_SECRET);
    const found = await db.findRefreshToken(refreshTokenValue);
    if (!found) {
      console.log('[refreshToken] Refresh token not found');
      return res.status(403).json({ error: 'Refresh token not found' });
    }

    const accessToken = jwt.sign({ id: payload.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    return res.json({ accessToken });
  } catch (err) {
    console.log('[refreshToken] Invalid refresh token');
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
  if (token) {
    await db.deleteRefreshToken(token);
    res.clearCookie('refresh_token');
    console.log('[revokeToken] Refresh token revoked');
  } else {
    console.log('[revokeToken] No refresh token cookie found or token in body');
  }
  return res.json({ revoked: true });
};

module.exports = { refreshToken, revokeToken, generateRefreshToken };