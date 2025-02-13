const express = require('express');
const router = express.Router();
const Conversation = require('../models/Conversation');

// Route to create a new conversation or update an existing one
router.post('/create', async (req, res) => {
  try {
    const { sessionId, userId, receiverId, sessionName, newMessage, lastActive } = req.body;

    // Validate message format
    if (!newMessage || !newMessage.userMessage || !newMessage.botResponse || !newMessage.timestamp) {
      return res.status(400).json({ error: 'Invalid message format' });
    }

    let conversation = await Conversation.findOne({ sessionId, userId });

    if (!conversation) {
      conversation = new Conversation({
        sessionId,
        userId,
        receiverId,
        sessionName,
        messages: [newMessage],
        lastActive
      });
    } else {
      conversation.messages.push(newMessage);
      conversation.lastActive = lastActive;
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

// Route to get a conversation by sessionId and userId
router.get('/:sessionId/:userId', async (req, res) => {
  try {
    const { sessionId, userId } = req.params;
    const conversation = await Conversation.findOne({ sessionId, userId });
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
router.post('/:sessionId/:userId/message', async (req, res) => {
  try {
    const { sessionId, userId } = req.params;
    const { text, isCode, language } = req.body;

    const conversation = await Conversation.findOne({ sessionId, userId });
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    const userMessage = {
      userMessage: text,
      botResponse: '', // Will be filled by the AI response
      timestamp: Date.now()
    };

    conversation.messages.push(userMessage);

    await conversation.save();

    // Process the bot response
    const botResponse = await processBotResponse(text, isCode, language);
    userMessage.botResponse = botResponse;

    await conversation.save();

    res.status(200).json({ conversation });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to save message' });
  }
});

// Function to process bot response
const processBotResponse = async (text, isCode, language) => {
  // Implement your AI response logic here
  return "Hello there! How can I assist you today?";
};

module.exports = router;