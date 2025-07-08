const jwt = require('jsonwebtoken');

/**
 * Middleware to verify JWT token from Authorization header.
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next middleware function
 * @returns {void}
 */
function verifyToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.warn('Authorization header missing or malformed');
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];

    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch (err) {
        console.warn('Invalid token provided');
        return res.status(401).json({ error: 'Unauthorized' });
    }
}

module.exports = { verifyToken };