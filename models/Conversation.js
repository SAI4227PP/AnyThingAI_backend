const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const messageSchema = new Schema({
  userMessage: {
    type: String,
    required: true
  },
  botResponse: {
    type: String,
    required: true
  },
  timestamp: {
    type: Number,
    required: true
  }
});

const conversationSchema = new Schema({
  sessionId: {
    type: String,
    required: true
  },
  userId: {
    type: String,
    required: true
  },
  receiverId: {
    type: String,
    required: true
  },
  sessionName: {
    type: String,
    required: true
  },
  messages: [messageSchema],  // Each record contains both user and bot messages
  lastActive: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

const Conversation = mongoose.model('Conversation', conversationSchema);
module.exports = Conversation;
