const { sendMessageToAI } = require('../services/aiService');
const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
require('dotenv').config();
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const Client = require('../models/Client');
const SupportEngineer = require('../models/SupportEngineer');
const Ticket = require('../models/Ticket');
const { addClientToQueue, updateClientStatus } = require('../services/queueManager');

// Rate limiting for AI requests
const aiRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // limit each user to 20 requests per windowMs
    message: { error: 'Too many AI requests, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
});

router.use(express.json());

router.post('/message', aiRateLimit, auth, async (req, res) => {
    try {
        const { message, ticketId, enableWebSearch = false } = req.body;
 
        if (!message || !ticketId) {
            return res.status(400).json({ error: 'Message and ticketId are required' });
        }
        
        if (typeof message !== 'string' || message.trim().length === 0) {
            return res.status(400).json({ error: 'Message must be a non-empty string' });
        }
        
        if (message.length > 2000) {
            return res.status(400).json({ error: 'Message too long. Maximum 2000 characters allowed' });
        }

        const ticket = await Ticket.findById(ticketId);
        if (!ticket) {
            return res.status(404).json({ error: 'Ticket not found' });
        }

        const userId = req.user._id.toString();
        const userRole = req.user.role;
        
        if (userRole === 'client' && ticket.client.toString() !== userId) {
            return res.status(403).json({ error: 'Access denied. You can only access your own tickets' });
        } else if (userRole === 'engineer' && ticket.assignedTo && ticket.assignedTo.toString() !== userId) {
            return res.status(403).json({ error: 'Access denied. You can only access tickets assigned to you' });
        }

        const aiResponse = await sendMessageToAI(message, ticket, enableWebSearch);
        
        if (!aiResponse) {
            return res.status(500).json({ error: 'AI service unavailable' });
        }

        res.json({ 
            response: aiResponse.response || aiResponse,
            webSearchUsed: aiResponse.webSearchUsed || false,
            sources: aiResponse.sources || [],
            timestamp: new Date().toISOString(),
            ticketId: ticketId
        });

    } catch (error) {
        console.error('Error processing AI message:', error);

        if (error.name === 'ValidationError') {
            return res.status(400).json({ error: 'Invalid input data' });
        }
        
        if (error.name === 'CastError') {
            return res.status(400).json({ error: 'Invalid ticket ID format' });
        }
        
        res.status(500).json({ error: 'Server error processing AI request' });
    }
});

module.exports = router;