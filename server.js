const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const conversationRoutes = require('./routes/conversation');
const { router: sseRouter } = require('./routes/sse');

dotenv.config();
const app = express();

// CORS configuration for SSE
const corsOptions = {
  origin: '*', // Update this with your frontend domain in production
  methods: ['GET', 'POST'],
  credentials: true,
  allowedHeaders: ['Content-Type'],
  exposedHeaders: ['Content-Type']
};

// Apply CORS middleware
app.use(cors(corsOptions));
app.use(express.json());

// Keep-alive configuration for SSE
app.use((req, res, next) => {
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Cache-Control', 'no-cache');
  next();
});

// Routes
app.use('/api/conversations', conversationRoutes);
app.use('/api/sse', sseRouter);

// SSE connection monitor
let sseConnections = 0;
app.use((req, res, next) => {
  if (req.url.includes('/api/sse')) {
    sseConnections++;
    console.log(`SSE Connection opened. Active connections: ${sseConnections}`);
    
    req.on('close', () => {
      sseConnections--;
      console.log(`SSE Connection closed. Active connections: ${sseConnections}`);
    });
  }
  next();
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  res.status(500).json({ error: 'Something broke!', details: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('SSE endpoints available at /api/sse/connect/:sessionId');
});
