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
const { verifyToken } = require('./middleware/auth');

require('dotenv').config();
const app = express();

// ===== Middleware =====
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// ===== Routes =====
app.use('/api/auth', authRoutes);
app.use('/api/token', tokenRoutes);
app.use('/api/files', verifyToken, fileRoutes);

const PORT = process.env.PORT || 3000;

function startServer() {
  console.log(`Server running on port ${PORT}`);
}

app.listen(PORT, startServer);

module.exports = app;
