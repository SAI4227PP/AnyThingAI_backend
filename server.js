const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const conversationRoutes = require('./routes/conversation');
const connectDB = require('./config/db');

dotenv.config();
const app = express();

// Debug middleware - Updated to show full path
app.use((req, res, next) => {
  // Get the base route if it exists
  const baseRoute = req.baseUrl || '';
  console.log(`📨 ${req.method} ${baseRoute}${req.url}`);
  next();
});

// Connect to MongoDB with debug logging
connectDB().then(() => {
  console.log('📦 MongoDB Connected');
  
  const corsOptions = {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
    allowedHeaders: ['Content-Type'],
  };

  app.use(cors(corsOptions));
  app.use(express.json());

  // Test route
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', dbStatus: mongoose.connection.readyState });
  });

  // Mount routes with debug info
  app.use('/conversations', (req, res, next) => {
    req.baseUrl = '/conversations'; // Ensure baseUrl is set
    next();
  }, conversationRoutes);

  // Error handling middleware
  app.use((err, req, res, next) => {
    console.error('❌ Server error:', err);
    res.status(500).json({ 
      error: 'Something broke!', 
      details: process.env.NODE_ENV === 'development' ? err.message : undefined 
    });
  });

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}).catch(err => {
  console.error('❌ Failed to connect to MongoDB:', err);
});
