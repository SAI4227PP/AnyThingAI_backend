// routes/conversation.js

const express = require('express');
const router = express.Router();
const Conversation = require('../models/Conversation');

// Route to create a new conversation or update an existing one
router.post('/create', async (req, res) => {
  try {
    const { sessionId, userId, receiverId, sessionName, messages } = req.body;

    // Check if the session already exists in the database
    let conversation = await Conversation.findOne({ sessionId });

    if (!conversation) {
      // If the session doesn't exist, create a new one
      conversation = new Conversation({
        sessionId,
        userId,
        receiverId,
        sessionName,  // Save the session name
        messages
      });
    } else {
      // If the session exists, append new messages to the existing conversation
      conversation.messages.push(...messages);
      
      // Optionally, update session's last active timestamp
      conversation.lastActive = Date.now();
    }

    // Save the updated or new conversation
    await conversation.save();

    // Return the conversation data (updated or new)
    res.status(200).json({
      message: 'Conversation updated successfully!',
      conversation
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong!' });
  }
});

// Route to get a conversation by sessionId
router.get('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    // Find the conversation by sessionId
    const conversation = await Conversation.findOne({ sessionId });

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    // Return the conversation data
    res.status(200).json(conversation);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong!' });
  }
});

// Route to handle code messages
router.post('/:sessionId/code', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { code, language, userId } = req.body;

    const conversation = await Conversation.findOne({ sessionId });
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    conversation.messages.push({
      message: code,
      botResponse: [{
        type: 'code',
        content: code,
        language: language || 'text'
      }],
      timestamp: Date.now()
    });

    await conversation.save();
    res.status(200).json({ conversation });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to save code message' });
  }
});

// Route to handle text messages
router.post('/:sessionId/text', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { text, userId } = req.body;

    const conversation = await Conversation.findOne({ sessionId });
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    conversation.messages.push({
      message: text,
      botResponse: [{
        type: 'text',
        content: text
      }],
      timestamp: Date.now()
    });

    await conversation.save();
    res.status(200).json({ conversation });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to save text message' });
  }
});

module.exports = router;