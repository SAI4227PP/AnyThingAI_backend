const express = require('express');
const router = express.Router();
const Conversation = require('../models/Conversation');

// Route to create a new conversation or update an existing one
router.post('/create', async (req, res) => {
  try {
    const { sessionId, userId, receiverId, sessionName, messages } = req.body;

    // Validate message format
    if (!Array.isArray(messages) || !messages.every(msg => 
      'userMessage' in msg && 
      'botResponse' in msg && 
      'timestamp' in msg
    )) {
      return res.status(400).json({ error: 'Invalid message format' });
    }

    let conversation = await Conversation.findOne({ sessionId });

    if (!conversation) {
      conversation = new Conversation({
        sessionId,
        userId,
        receiverId,
        sessionName,
        messages
      });
    } else {
      conversation.messages.push(...messages);
      conversation.lastActive = Date.now();
    }

    await conversation.save();
    res.status(200).json({
      success: true,
      conversation
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Something went wrong!' });
  }
});

// Route to get a conversation by sessionId
router.get('/:sessionId', async (req, res) => {
  try {
    const conversation = await Conversation.findOne({ sessionId: req.params.sessionId });
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }
    res.status(200).json(conversation);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Something went wrong!' });
  }
});

// Route to handle both text and code messages
router.post('/:sessionId/message', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { text, isCode, language } = req.body;

    const conversation = await Conversation.findOne({ sessionId });
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    conversation.messages.push({
      userMessage: text,
      botResponse: '', // Will be filled by the AI response
      timestamp: Date.now()
    });

    await conversation.save();
    res.status(200).json({ conversation });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to save message' });
  }
});

module.exports = router;