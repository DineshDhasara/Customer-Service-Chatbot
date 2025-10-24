const express = require('express');
const router = express.Router();
const advancedProcessor = require('../services/advancedProcessor');

// Enhanced chat endpoint with advanced processing
router.post('/', async (req, res) => {
    const { sessionId, message } = req.body || {};
    
    if (!message) {
        return res.status(400).json({ 
            success: false, 
            error: 'Message is required',
            code: 'MISSING_MESSAGE'
        });
    }
    
    if (!sessionId) {
        return res.status(400).json({ 
            success: false, 
            error: 'Session ID is required',
            code: 'MISSING_SESSION'
        });
    }

    try {
        const startTime = Date.now();
        
        // Process message through advanced processor
        const result = await advancedProcessor.process({ sessionId, message });
        
        const processingTime = Date.now() - startTime;
        
        return res.json({
            success: true,
            reply: result.reply,
            intent: result.intent,
            confidence: result.confidence,
            metadata: {
                ...result.metadata,
                processingTime,
                timestamp: Date.now(),
                version: '2.0'
            }
        });
        
    } catch (err) {
        console.error('Advanced chat processing error:', err);
        
        return res.status(500).json({ 
            success: false,
            reply: 'I apologize, but I\'m experiencing technical difficulties. Please try again in a moment.',
            error: 'Internal processing error',
            code: 'PROCESSING_ERROR',
            metadata: {
                timestamp: Date.now(),
                sessionId
            }
        });
    }
});

// Get conversation analytics
router.get('/analytics', (req, res) => {
    try {
        const analytics = advancedProcessor.getAnalytics();
        
        res.json({
            success: true,
            data: analytics,
            timestamp: Date.now()
        });
    } catch (err) {
        console.error('Analytics error:', err);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve analytics',
            code: 'ANALYTICS_ERROR'
        });
    }
});

// Get user profile and conversation history
router.get('/profile/:sessionId', (req, res) => {
    try {
        const { sessionId } = req.params;
        const profile = advancedProcessor.getUserProfile(sessionId);
        
        if (!profile) {
            return res.status(404).json({
                success: false,
                error: 'User profile not found',
                code: 'PROFILE_NOT_FOUND'
            });
        }
        
        res.json({
            success: true,
            data: profile,
            sessionId,
            timestamp: Date.now()
        });
    } catch (err) {
        console.error('Profile retrieval error:', err);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve user profile',
            code: 'PROFILE_ERROR'
        });
    }
});

// Health check endpoint
router.get('/health', (req, res) => {
    const analytics = advancedProcessor.getAnalytics();
    
    res.json({
        success: true,
        status: 'healthy',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        analytics: {
            totalMessages: analytics.totalMessages,
            activeSessions: analytics.activeSessions,
            avgConfidence: analytics.avgConfidence
        },
        timestamp: Date.now()
    });
});

// Batch message processing (for testing/demo)
router.post('/batch', async (req, res) => {
    const { sessionId, messages } = req.body || {};
    
    if (!sessionId || !Array.isArray(messages)) {
        return res.status(400).json({
            success: false,
            error: 'Session ID and messages array required',
            code: 'INVALID_BATCH_REQUEST'
        });
    }
    
    try {
        const results = [];
        
        for (const message of messages) {
            const result = await advancedProcessor.process({ sessionId, message });
            results.push({
                message,
                ...result
            });
        }
        
        res.json({
            success: true,
            results,
            count: results.length,
            timestamp: Date.now()
        });
        
    } catch (err) {
        console.error('Batch processing error:', err);
        res.status(500).json({
            success: false,
            error: 'Batch processing failed',
            code: 'BATCH_ERROR'
        });
    }
});

module.exports = router;
