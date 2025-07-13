const jwt = require('jsonwebtoken');
const db = require('../models/db');

const REFRESH_EXPIRES_IN = '7d';

// Generates an access token for a given payload
function generateAccessToken(payload) {
  return jwt.sign(
    payload,
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '30m' }
  );
}

const MAX_DEVICES = 5;
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
async function saveRefresh(userId, token, req) {
  await db.saveRefreshToken({
    user_id: userId,
    token,
    user_agent: req.headers['user-agent'],
    ip_address: req.ip,
    expires_at: new Date(Date.now() + SEVEN_DAYS_MS)
  });
}

async function generateRefreshToken(user, req) {
  const token = jwt.sign({ id: user.id }, process.env.JWT_REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES_IN });

  // Gerätelimit prüfen
  const count = await db.countRefreshTokens(user.id);
  if (count >= MAX_DEVICES) {
    await db.deleteOldestRefreshToken(user.id);
    console.log(`[refreshToken] Device limit reached for user ${user.id}, deleted oldest refresh token`);
  }

  await saveRefresh(user.id, token, req);
  console.log(`[refreshToken] Created refresh token for user ${user.id} from IP ${req.ip}`);

  return token;
}

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
    const newRefreshToken = jwt.sign({ id: payload.id }, process.env.JWT_REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES_IN });

    await saveRefresh(payload.id, newRefreshToken, req);

    // Generate access token using shared helper
    const accessToken = generateAccessToken({ id: payload.id });
    setAuthCookies(res, accessToken, newRefreshToken);

    console.log(`[ROTATE] Refresh token rotated for user ${payload.id}`);
    return res.json({ accessToken });
  } catch (err) {
    console.warn('[ROTATE] Invalid or expired refresh token:', err.message);
    return res.status(401).json({ error: 'Invalid refresh token' });
  }
};

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

module.exports = {
  refreshToken,
  revokeToken,
  generateRefreshToken,
  revokeAllUserTokens,
  generateAccessToken,
  SEVEN_DAYS_MS,
};