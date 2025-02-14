const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
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
    const conversation = await Conversation.findOne({ sessionId, userId })
      .lean()
      .exec();

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    // Transform the conversation data to match the expected format
    const formattedConversation = {
      _id: {
        $oid: conversation._id.toString()
      },
      sessionId: conversation.sessionId,
      userId: conversation.userId,
      receiverId: conversation.receiverId,
      sessionName: conversation.sessionName,
      messages: conversation.messages.map(msg => ({
        userMessage: msg.userMessage,
        botResponse: msg.botResponse,
        timestamp: msg.timestamp,
        _id: {
          $oid: msg._id.toString()
        }
      })),
      lastActive: {
        $date: conversation.lastActive
      },
      createdAt: {
        $date: conversation.createdAt
      },
      updatedAt: {
        $date: conversation.updatedAt
      },
      __v: conversation.__v
    };

    res.status(200).json(formattedConversation);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Something went wrong!' });
  }
});

// Route to get all conversations for a user - Updated path
router.get("/conversations/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    console.log("🔍 Attempting to find conversations for userId:", userId);

    // Verify MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      console.log("❌ Database connection state:", mongoose.connection.readyState);
      throw new Error('Database connection not established');
    }

    const conversations = await Conversation.find({ userId })
      .sort({ lastActive: -1 })
      .lean()
      .exec();

    console.log(`✅ Found ${conversations.length} conversations for user ${userId}`);

    return res.status(200).json({
      success: true,
      count: conversations.length,
      data: conversations.map(conv => ({
        _id: conv._id.toString(),
        sessionId: conv.sessionId,
        sessionName: conv.sessionName || 'New Session',
        lastActive: conv.lastActive,
        receiverId: conv.receiverId,
        messages: conv.messages,
        preview: conv.messages?.[0]?.userMessage?.slice(0, 50) || ''
      }))
    });

  } catch (error) {
    console.error("❌ Error:", error.message);
    return res.status(500).json({
      success: false,
      error: error.message
    });
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