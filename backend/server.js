/*****
 * @file server.js
 * @description Entry point for the backend server. Sets up Express application with middleware, routes, and starts the server.
 *****/

const express = require('express');
const cors = require('cors');
const fileRoutes = require('./routes/files');
const authRoutes = require('./routes/auth');
const tokenRoutes = require('./routes/token');

const cookieParser = require('cookie-parser');
const csurf = require('csurf');
const { verifyToken } = require('./middleware/auth');
const helmet = require('helmet');

require('dotenv').config();
const app = express();

// ===== Security Headers =====
app.use(helmet());

// ===== Middleware =====
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// ===== CSRF Protection =====
app.use(csurf({ cookie: { httpOnly: false, sameSite: 'Strict' } }));

// Endpoint to retrieve CSRF token for state-changing requests
app.get('/api/csrf-token', (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// ===== Routes =====
app.use('/api/auth', authRoutes);
app.use('/api/token', tokenRoutes);
app.use('/api/files', verifyToken, fileRoutes);

// ===== CSRF Error Handler =====
app.use((err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN') {
    // CSRF token validation failed
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }
  next(err);
});

const PORT = process.env.PORT || 3000;

function startServer() {
  console.log(`Server running on port ${PORT}`);
}

app.listen(PORT, startServer);

module.exports = app;
