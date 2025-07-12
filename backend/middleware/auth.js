const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
    // Support token from Authorization header or HttpOnly cookie
    let token;
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    } else {
      console.warn('JWT token missing in Authorization header or accessToken cookie');
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