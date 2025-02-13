const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const conversationRoutes = require('./routes/conversation');
const connectDB = require('./config/db'); // Import the connectDB function

dotenv.config();
const app = express();

// Connect to MongoDB
connectDB().then(() => {
  // CORS configuration for SSE
  const corsOptions = {
    origin: '*', // Allow from all origins
    methods: ['GET', 'POST'],
    credentials: true,
    allowedHeaders: ['Content-Type'],
    exposedHeaders: ['Content-Type']
  };

  // Apply CORS middleware
  app.use(cors(corsOptions));
  app.use(express.json());

  // Routes
  app.use('/conversations', conversationRoutes);

  // Error handling middleware
  app.use((err, req, res, next) => {
    console.error('Server error:', err.stack);
    res.status(500).json({ error: 'Something broke!', details: err.message });
  });

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Failed to connect to MongoDB', err);
});
