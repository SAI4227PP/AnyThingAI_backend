// models/Conversation.js

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const messageSchema = new Schema({
  message: {
    type: String,
    required: true
  },
  botResponse: [{
    type: {
      type: String,
      enum: ['text', 'code'],
      required: true
    },
    content: {
      type: String,
      required: true
    },
    language: String
  }],
  timestamp: {
    type: Number,
    required: true
  }
});

const conversationSchema = new Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: String,
    required: true
  },
  receiverId: {
    type: String,
    required: true
  },
  sessionName: { // This is still required, but won't be updated later
    type: String,
    required: true
  },
  messages: [messageSchema],  // Array of messages for each session
  lastActive: {
    type: Date,
    default: Date.now  // Default to the current time
  }
}, { timestamps: true });  // Add timestamps for when the document is created/updated

// Create and export the model
const Conversation = mongoose.model('Conversation', conversationSchema);
module.exports = Conversation;