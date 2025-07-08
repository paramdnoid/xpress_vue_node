/**
 * Router module for handling token-related endpoints.
 *
 * @module routes/token
 */

const express = require('express');
const { refreshToken, revokeToken } = require('../controllers/tokenController');

/**
 * Express router for token operations.
 * 
 * @type {import('express').Router}
 */
const router = express.Router();

/**
 * POST /refresh
 * 
 * Refresh the authentication token.
 * 
 * @example
 * POST /refresh
 * {
 *   "refreshToken": "string"
 * }
 */
router.post('/refresh', refreshToken);

/**
 * POST /revoke
 * 
 * Revoke the authentication token.
 * 
 * @example
 * // If using HttpOnly cookie, simply call:
 * POST /revoke
 * 
 * // Or send in body:
 * POST /revoke
 * {
 *   "token": "string"
 * }
 */
router.post('/revoke', revokeToken);

module.exports = router;