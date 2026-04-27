const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const authRoutes = require('./routes/auth.routes');
const contentRoutes = require('./routes/content.routes');
const approvalRoutes = require('./routes/approval.routes');
const liveRoutes = require('./routes/live.routes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/approval', approvalRoutes);
app.use('/api/public', liveRoutes);

// Assignment-spec public endpoint: GET /content/live/:teacherId
app.use('/content', liveRoutes);

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Something went wrong!' });
});

module.exports = app;
