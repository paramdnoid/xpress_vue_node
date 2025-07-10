const mysql = require('mysql2/promise');
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'file_manager'
});

// Shared query helper with error handling
async function query(sql, params) {
  try {
    const [rows] = await pool.query(sql, params);
    return rows;
  } catch (err) {
    console.error('DB Error:', err);
    throw err;
  }
}

/**
 * Creates a new user in the database.
 * @param {string} email - The email of the user.
 * @param {string} password - The hashed password of the user.
 * @param {number} plan_id - The ID of the user's plan.
 * @returns {Promise<Object>} The created user object containing id, email, and plan_id.
 */
async function createUser(email, password, plan_id) {
  try {
    const sql = `
      INSERT INTO users (email, password, plan_id)
      VALUES (?, ?, ?)
    `;
    const result = await query(sql, [email, password, plan_id]);


    
    return { id: result.insertId, email, plan: plan_id };
  } catch (err) {
    console.error('createUser error:', err);
    throw err;
  }
}

/**
 * Creates a new user with email verification token and expiry.
 * @param {string} email - The user's email.
 * @param {string} password - The hashed password.
 * @param {number} plan_id - The ID of the user's plan.
 * @param {string} token - Verification token.
 * @param {Date} expires - Token expiry datetime.
 * @returns {Promise<Object>} The created user object.
 */
async function createUserWithVerification(email, password, plan_id, token, expires) {
  try {
    const sql = `
      INSERT INTO users (email, password, plan_id, verify_token, verify_token_expires)
      VALUES (?, ?, ?, ?, ?)
    `;
    const result = await query(sql, [email, password, plan_id, token, expires]);
    return { id: result.insertId, email };
  } catch (err) {
    console.error('createUserWithVerification error:', err);
    throw err;
  }
}

/**
 * Counts the number of refresh tokens for a given user.
 * @param {number} user_id - The ID of the user.
 * @returns {Promise<number>} The count of refresh tokens.
 */
async function countRefreshTokens(user_id) {
  try {
    const sql = `
      SELECT COUNT(*) as count FROM refresh_tokens WHERE user_id = ?
    `;
    const rows = await query(sql, [user_id]);
    return rows[0].count;
  } catch (err) {
    console.error('countRefreshTokens error:', err);
    throw err;
  }
}

/**
 * Deletes the oldest refresh token for a given user.
 * @param {number} user_id - The ID of the user.
 * @returns {Promise<void>}
 */
async function deleteOldestRefreshToken(user_id) {
  try {
    const sql = `
      DELETE FROM refresh_tokens
      WHERE user_id = ?
      ORDER BY created_at ASC
      LIMIT 1
    `;
    await query(sql, [user_id]);
  } catch (err) {
    console.error('deleteOldestRefreshToken error:', err);
    throw err;
  }
}

/**
 * Deletes a refresh token from the database.
 * @param {string} token - The refresh token to delete.
 * @returns {Promise<void>}
 */
async function deleteRefreshToken(token) {
  try {
    const sql = `
      DELETE FROM refresh_tokens WHERE token = ?
    `;
    await query(sql, [token]);
  } catch (err) {
    console.error('deleteRefreshToken error:', err);
    throw err;
  }
}

/**
 * Finds a refresh token in the database.
 * @param {string} token - The refresh token to find.
 * @returns {Promise<Object|undefined>} The refresh token record or undefined if not found.
 */
async function findRefreshToken(token) {
  try {
    const sql = `
      SELECT * FROM refresh_tokens WHERE token = ?
    `;
    const rows = await query(sql, [token]);
    return rows[0];
  } catch (err) {
    console.error('findRefreshToken error:', err);
    throw err;
  }
}

/**
 * Retrieves a user by their email.
 * @param {string} email - The email of the user.
 * @returns {Promise<Object|undefined>} The user record or undefined if not found.
 */
async function getUserByEmail(email) {
  try {
    const sql = `
      SELECT id, email, password, email_verified, verify_token_expires FROM users WHERE email = ?
    `;
    const rows = await query(sql, [email]);
    return rows[0];
  } catch (err) {
    console.error('getUserByEmail error:', err);
    throw err;
  }
}

/**
 * Retrieves a user by their ID.
 * @param {number} id - The ID of the user.
 * @returns {Promise<Object|undefined>} The user record with id, email, full_name, and created_at or undefined if not found.
 */
async function getUserById(id) {
  try {
    const sql = `
      SELECT id, email, CONCAT(first_name, ' ', last_name) AS full_name, created_at FROM users WHERE id = ?
    `;
    const rows = await query(sql, [id]);
    return rows[0];
  } catch (err) {
    console.error('getUserById error:', err);
    throw err;
  }
}

/**
 * Saves a refresh token in the database.
 * @param {Object} data - The refresh token data.
 * @param {number} data.user_id - The ID of the user.
 * @param {string} data.token - The refresh token string.
 * @param {string} data.user_agent - The user agent string.
 * @param {string} data.ip_address - The IP address.
 * @param {Date} data.expires_at - The expiration date of the token.
 * @returns {Promise<void>}
 */
async function saveRefreshToken(data) {
  try {
    const sql = `
      INSERT INTO refresh_tokens (user_id, token, user_agent, ip_address, expires_at)
      VALUES (?, ?, ?, ?, ?)
    `;
    await query(sql, [
      data.user_id,
      data.token,
      data.user_agent,
      data.ip_address,
      data.expires_at
    ]);
  } catch (err) {
    console.error('saveRefreshToken error:', err);
    throw err;
  }
}

/**
 * Retrieves a user by their verification token.
 * @param {string} token - The verification token.
 * @returns {Promise<Object|undefined>} The user record or undefined if not found.
 */
async function getUserByVerificationToken(token) {
  try {
    const sql = `
      SELECT id, verify_token_expires FROM users WHERE verify_token = ?
    `;
    const rows = await query(sql, [token]);
    return rows[0];
  } catch (err) {
    console.error('getUserByVerificationToken error:', err);
    throw err;
  }
}

/**
 * Marks a user's email as verified and clears the verification token.
 * @param {number} userId - The user's ID.
 * @returns {Promise<void>}
 */
async function markEmailAsVerified(userId) {
  try {
    const sql = `
      UPDATE users
      SET email_verified = 1, verify_token = NULL, verify_token_expires = NULL
      WHERE id = ?
    `;
    await query(sql, [userId]);
  } catch (err) {
    console.error('markEmailAsVerified error:', err);
    throw err;
  }
}

async function updateVerificationToken(userId, token, expires) {
  try {
    const sql = `
      UPDATE users
      SET verify_token = ?, verify_token_expires = ?
      WHERE id = ?
    `;
    await query(sql, [token, expires, userId]);
  } catch (err) {
    console.error('updateVerificationToken error:', err);
    throw err;
  }
}

module.exports = {
  countRefreshTokens,
  createUser,
  createUserWithVerification,
  deleteOldestRefreshToken,
  deleteRefreshToken,
  findRefreshToken,
  getUserByEmail,
  getUserById,
  saveRefreshToken,
  getUserByVerificationToken,
  markEmailAsVerified,
  updateVerificationToken
};
