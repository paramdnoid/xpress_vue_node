/**
 * Email regular expression for validation.
 * @type {RegExp}
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * One day in milliseconds.
 * @type {number}
 */
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const bcrypt = require('bcrypt');
const db = require('../models/db');
const { generateRefreshToken, refreshToken, generateAccessToken } = require('./tokenController');
const crypto = require('crypto');
const { sendVerificationEmail } = require('../utils/mail');

/**
 * Handles user login by verifying credentials and issuing JWT tokens.
 * Sets a refresh token as HttpOnly cookie.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<import('express').Response>}
 */
const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await db.getUserByEmail(email);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (!user.email_verified) {
      return res.status(403).json({ error: 'Please verify your email before logging in' });
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

      // Generate access token using shared helper
      const accessToken = generateAccessToken({ id: user.id });
    const refreshToken = await generateRefreshToken(user, req);

    // Set refresh token as HttpOnly cookie
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge: 7 * ONE_DAY_MS // 7 days
    });

    console.log(`[LOGIN] User logged in: ${email}`);
    return res.status(200).json({ accessToken, token: accessToken });
  } catch (err) {
    console.error('[LOGIN] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Registers a new user, hashes their password, and sends a verification email.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<import('express').Response>}
 */
const register = async (req, res) => {
  const { email, password } = req.body;
  try {
    // Validate email
    const isEmailValid = EMAIL_REGEX.test(email);
    if (!isEmailValid) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Check for existing user
    const existingUser = await db.getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: 'Email already in use' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    // Generate verification token and expiry
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + ONE_DAY_MS);

    // Create user with verification
    await db.createUserWithVerification(email, hashedPassword, "1", verificationToken, verificationExpires);
    await sendVerificationEmail(email, verificationToken);

    console.log(`[REGISTER] User registered: ${email}`);
    return res.status(201).json({ message: 'Registered. Please verify your email.' });
  } catch (err) {
    console.error('[REGISTER] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};


/**
 * Retrieves the profile information of the authenticated user.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<import('express').Response>}
 */
const getProfile = async (req, res) => {
  try {
    // req.user.id comes from verifyToken middleware
    const user = await db.getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    // Destructure user to avoid accessing properties directly
    const { id, email, full_name, created_at } = user;
    return res.status(200).json({ id, email, name: full_name, created_at });
  } catch (err) {
    console.error('[PROFILE] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Verifies email using a verification token.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<import('express').Response>}
 */
const verifyEmail = async (req, res) => {
  const { token } = req.query;
  try {
    const user = await db.getUserByVerificationToken(token);
    if (!user || new Date(user.verify_token_expires) < new Date()) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }
    await db.markEmailAsVerified(user.id);
    console.log(`[VERIFY] Email verified: ${user.email}`);
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-success`);
  } catch (err) {
    console.error('[VERIFY] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Resends email verification if user is not verified.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<import('express').Response>}
 */
const resendVerification = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await db.getUserByEmail(email);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (user.email_verified) {
      return res.status(400).json({ error: 'Email already verified' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + ONE_DAY_MS);
    await db.updateVerificationToken(user.id, token, expires);
    await sendVerificationEmail(email, token);

    console.log(`[RESEND] Verification email resent to: ${email}`);
    return res.status(200).json({ message: 'Verification email resent' });
  } catch (err) {
    console.error('[RESEND] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { login, register, refreshToken, getProfile, verifyEmail, resendVerification };
