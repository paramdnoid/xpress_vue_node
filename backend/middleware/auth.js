const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
    // Only support token from Authorization header
    let token;
    const authHeader = req.headers['authorization'];
    console.debug('🔐 Incoming Authorization Header:', authHeader);
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else {
      console.warn('JWT token missing in Authorization header');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch (err) {
        console.warn('Invalid token provided');
        return res.status(401).json({ error: 'Unauthorized' });
    }
}

module.exports = { verifyToken };