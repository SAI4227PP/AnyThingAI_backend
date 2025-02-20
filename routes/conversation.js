const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Conversation = require('../models/Conversation');

// Route to create a new conversation or update an existing one
router.post('/conversations/create', async (req, res) => {
  try {
    // Verify MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      console.log("❌ Database connection state:", mongoose.connection.readyState);
      throw new Error('Database connection not established');
    }

    const { sessionId, userId, receiverId, sessionName, newMessage, lastActive } = req.body;

    // Validate required parameters
    if (!sessionId || !userId || !newMessage) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required parameters' 
      });
    }

    // Validate message format
    if (!newMessage || !newMessage.userMessage || !newMessage.botResponse || !newMessage.timestamp) {
      return res.status(400).json({ error: 'Invalid message format' });
    }

    let conversation = await Conversation.findOne({ sessionId, userId });

    if (!conversation) {
      // Create new conversation
      conversation = new Conversation({
        sessionId,
        userId,
        receiverId,
        sessionName,
        messages: [newMessage],
        lastActive: lastActive || new Date().toISOString()
      });
    } else {
      // Update existing conversation
      conversation.messages.push(newMessage);
      conversation.lastActive = lastActive || new Date().toISOString();
      if (sessionName) conversation.sessionName = sessionName;
      if (receiverId) conversation.receiverId = receiverId;
    }

    await conversation.save();

    res.status(200).json({
      success: true,
      data: conversation
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Route to get a conversation by sessionId and userId
router.get('/:sessionId/:userId', async (req, res) => {
  try {
    const { sessionId, userId } = req.params;

    // Validate MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      console.log("❌ Database connection state:", mongoose.connection.readyState);
      throw new Error('Database connection not established');
    }

    // Add validation for params
    if (!sessionId || !userId) {
      return res.status(400).json({ 
        success: false,
        message: 'SessionId and userId are required' 
      });
    }

    console.log(`🔍 Finding conversation: sessionId=${sessionId}, userId=${userId}`);
    const conversation = await Conversation.findOne({ sessionId, userId })
      .lean()
      .exec();

    if (!conversation) {
      console.log('❌ No conversation found');
      return res.status(404).json({ 
        success: false,
        message: 'Conversation not found' 
      });
    }

    // Transform and validate the conversation data
    const formattedConversation = {
      _id: conversation._id.toString(),
      sessionId: conversation.sessionId,
      userId: conversation.userId,
      receiverId: conversation.receiverId,
      sessionName: conversation.sessionName || 'New Chat',
      messages: conversation.messages.map(msg => ({
        userMessage: msg.userMessage || '',
        botResponse: msg.botResponse || '',
        timestamp: msg.timestamp || new Date().toISOString(),
        _id: msg._id.toString()
      })).filter(msg => msg.userMessage || msg.botResponse), // Filter out empty messages
      lastActive: conversation.lastActive || conversation.updatedAt,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt
    };

    console.log(`✅ Found conversation with ${formattedConversation.messages.length} messages`);

    res.status(200).json({
      success: true,
      data: formattedConversation
    });

  } catch (error) {
    console.error('❌ Error in get conversation:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch conversation',
      error: error.message 
    });
  }
});

// Route to get all conversations for a user - Updated path
router.get("/conversations/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
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