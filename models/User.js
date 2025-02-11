const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  appwriteId: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  name: String,
  preferences: {
    theme: String,
    language: String,
    notifications: Boolean
  },
  // Add fields for complex data that Appwrite doesn't handle well
  chatHistory: [{
    timestamp: Date,
    message: String,
    response: String
  }],
  customData: mongoose.Schema.Types.Mixed,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', userSchema);
