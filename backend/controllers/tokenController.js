const jwt = require('jsonwebtoken');
const db = require('../models/db');

const REFRESH_EXPIRES_IN = '7d';

// Generates an access token for a given payload
function generateAccessToken(payload) {
  return jwt.sign(
    payload,
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' } // Längere Gültigkeit
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
    console.log('[REFRESH] No token provided');
    return res.status(401).json({ error: 'No refresh token provided' });
  }

  try {
    const payload = jwt.verify(oldToken, process.env.JWT_REFRESH_SECRET);

    // 1. Prüfen, ob Token existiert (noch nicht benutzt wurde)
    const found = await db.findRefreshToken(oldToken);
    if (!found) {
      console.warn(`[SECURITY] Attempted reuse of invalid/expired refresh token for user ${payload.id}`);
      // Alle Tokens für diesen User löschen (potentieller Angriff)
      await db.query('DELETE FROM refresh_tokens WHERE user_id = ?', [payload.id]);
      return res.status(403).json({ error: 'Invalid refresh token' });
    }

    // 2. Sofort löschen, egal ob der nächste Schritt klappt
    await db.deleteRefreshToken(oldToken);

    // 3. Neuen Refresh + Access Token erzeugen
    const newRefreshToken = jwt.sign({ id: payload.id }, process.env.JWT_REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES_IN });

    await saveRefresh(payload.id, newRefreshToken, req);

    // Generate access token using shared helper
    const accessToken = generateAccessToken({ id: payload.id });

    // Set new refresh token as cookie
    setRefreshTokenCookie(res, newRefreshToken);

    console.log(`[ROTATE] Refresh token rotated for user ${payload.id}`);
    return res.json({ accessToken });
  } catch (err) {
    console.warn('[ROTATE] Invalid or expired refresh token:', err.message);
    
    // Versuche trotzdem zu löschen, falls Token in DB existiert
    try {
      await db.deleteRefreshToken(oldToken);
    } catch (deleteErr) {
      // Ignoriere Fehler beim Löschen
    }
    
    return res.status(401).json({ error: 'Invalid refresh token' });
  }
};

const revokeToken = async (req, res) => {
  const token = req.cookies?.refresh_token || req.body.token;
  const allDevices = req.body.allDevices === true;

  if (!token) {
    console.log('[REVOKE] No token provided');
    return res.json({ revoked: false });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

    if (allDevices) {
      await db.query('DELETE FROM refresh_tokens WHERE user_id = ?', [payload.id]);
      console.log(`[REVOKE] All devices revoked for user ${payload.id}`);
    } else {
      await db.deleteRefreshToken(token);
      console.log(`[REVOKE] Single device token revoked for user ${payload.id}`);
    }

    res.clearCookie('refresh_token');
    return res.json({ revoked: true });
  } catch (err) {
    console.warn('[REVOKE] Invalid token:', err.message);
    
    // Versuche trotzdem Cookie zu löschen
    res.clearCookie('refresh_token');
    return res.json({ revoked: false, error: 'Invalid token' });
  }
};

// Helper function to set refresh token cookie
function setRefreshTokenCookie(res, refreshToken) {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'Strict',
    maxAge: SEVEN_DAYS_MS
  });
}

async function revokeAllUserTokens(userId) {
  await db.query('DELETE FROM refresh_tokens WHERE user_id = ?', [userId]);
}

module.exports = {
  refreshToken,
  revokeToken,
  generateRefreshToken,
  revokeAllUserTokens,
  generateAccessToken,
  SEVEN_DAYS_MS,
};