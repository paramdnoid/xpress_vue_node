/**
 * @module routes/auth
 * @description Handles authentication-related routes including login, registration,
 * token refresh, profile retrieval, email verification, and resending verification emails.
 */

const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const { login, register, refreshToken, getProfile, verifyEmail, resendVerification } = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth')

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { message: 'Too many requests, please try again later.' }
});

/**
 * @route POST /login
 * @middleware authLimiter
 * @description Authenticates a user with their credentials.
 */
router.post(
  '/login',
  authLimiter,
  login
);

/**
 * @route POST /register
 * @middleware authLimiter
 * @description Registers a new user.
 */
router.post(
  '/register',
  authLimiter,
  register
);

/**
 * @route POST /refresh
 * @description Refreshes the authentication token.
 */
router.post(
  '/refresh',
  refreshToken
);

/**
 * @route GET /me
 * @middleware verifyToken
 * @description Retrieves the profile of the authenticated user.
 */
router.get(
  '/me',
  verifyToken,
  getProfile
);

/**
 * @route GET /verify-email
 * @description Verifies a user's email address.
 */
router.get(
  '/verify-email',
  verifyEmail
);

/**
 * @route POST /resend-verification
 * @description Resends the email verification link to the user.
 */
router.post(
  '/resend-verification',
  resendVerification
);

module.exports = router;
