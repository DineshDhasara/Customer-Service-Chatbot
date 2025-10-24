/**
 * Smart Customer Service Server with Real Gemini AI Integration
 * Focus on solid logic, real functionality, and good UX flow
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Import services
const GeminiAI = require('./services/geminiAI');

const app = express();
const PORT = process.env.PORT || 5003;

// Initialize services
const geminiAI = new GeminiAI();

// Add to app locals for route access
app.locals.geminiAI = geminiAI;


// Middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com", "https://cdn.jsdelivr.net"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "http://localhost:*", "https://generativelanguage.googleapis.com"]
        }
    }
}));

app.use(compression());
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:5500', 'http://127.0.0.1:5502', 'http://localhost:5500', 'http://localhost:5003', 'null'],
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Serve static files
app.use('/demo', express.static(path.join(__dirname, '../..')));

// Session storage (in production, use Redis or database)
const sessions = new Map();
const analytics = {
    totalChats: 0,
    totalMessages: 0,
    intents: new Map(),
    avgResponseTime: 0,
    userSatisfaction: 0
};

// Root endpoint - Portfolio introduction
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: "🤖 Smart AI Customer Service Assistant",
        description: "Advanced customer service chatbot with real Gemini AI integration",
        version: "2.0.0",
        features: [
            "Real Gemini AI integration",
            "Intelligent conversation flow", 
            "Order tracking and management",
            "Customer service automation",
            "Real-time analytics"
        ],
        endpoints: {
            portfolio: "/demo/portfolio.html",
            chatbot: "/demo/chatbot.html", 
            chat: "/api/chat",
            analytics: "/api/analytics",
            health: "/api/health"
        },
        developer: {
            name: "AI Developer",
            skills: ["Node.js", "Express", "AI Integration", "Customer Service Automation"],
            contact: "developer@example.com"
        }
    });
});

// Main chat endpoint with real Gemini AI
app.post('/api/chat', async (req, res) => {
    const startTime = Date.now();
    
    try {
        const { message, sessionId } = req.body;
        
        if (!message || !sessionId) {
            return res.status(400).json({
                success: false,
                error: "Message and sessionId are required"
            });
        }

        // Get or create session
        if (!sessions.has(sessionId)) {
            sessions.set(sessionId, {
                id: sessionId,
                startTime: Date.now(),
                messages: [],
                context: {}
            });
            analytics.totalChats++;
        }

        const session = sessions.get(sessionId);
        
        // Extract order ID if present
        const orderMatch = message.match(/ORD\d{4}|\d{4,}/i);
        const orderId = orderMatch ? orderMatch[0].toUpperCase() : null;
        
        // Build context for AI
        const context = {
            sessionId,
            orderId,
            messageCount: session.messages.length,
            userEmotion: detectBasicEmotion(message)
        };

        // Get order details if order ID found
        if (orderId) {
            const orderDetails = await geminiAI.lookupOrder(orderId);
            context.orderDetails = orderDetails;
        }

        // Use Gemini AI for all responses (no fallback to simple chatbot)
        let aiResponse;
        try {
            aiResponse = await geminiAI.generateResponse(message, sessionId, context);
        } catch (geminiError) {
            console.error('Gemini AI Error:', geminiError);
            // Return error response instead of using simple chatbot
            return res.status(500).json({
                success: false,
                error: "I'm experiencing technical difficulties with my AI system. Please try again in a moment or contact support for assistance.",
                fallback: true,
                suggestions: ["Try again", "Contact support", "Check system status"],
                metadata: {
                    error: geminiError.message,
                    responseTime: Date.now() - startTime
                }
            });
        }
        
        // Store message in session
        session.messages.push({
            user: message,
            ai: aiResponse.text,
            timestamp: new Date().toISOString(),
            intent: aiResponse.intent,
            confidence: aiResponse.confidence
        });

        // Update analytics
        analytics.totalMessages++;
        const intent = aiResponse.intent;
        analytics.intents.set(intent, (analytics.intents.get(intent) || 0) + 1);
        
        const responseTime = Date.now() - startTime;
        analytics.avgResponseTime = (analytics.avgResponseTime + responseTime) / 2;

        // Enhanced response with order details
        let enhancedResponse = aiResponse.text;
        if (context.orderDetails) {
            enhancedResponse += `\n\n📦 **Order Details:**\n`;
            enhancedResponse += `• Status: ${context.orderDetails.status}\n`;
            enhancedResponse += `• Items: ${context.orderDetails.items.map(item => item.name).join(', ')}\n`;
            enhancedResponse += `• Total: $${context.orderDetails.total}\n`;
            if (context.orderDetails.trackingNumber) {
                enhancedResponse += `• Tracking: ${context.orderDetails.trackingNumber}\n`;
            }
            if (context.orderDetails.deliveryDate) {
                enhancedResponse += `• Expected Delivery: ${context.orderDetails.deliveryDate}`;
            }
        }

        res.json({
            success: true,
            reply: enhancedResponse,
            intent: aiResponse.intent,
            confidence: aiResponse.confidence,
            emotion: aiResponse.emotion,
            suggestions: aiResponse.suggestions,
            orderDetails: context.orderDetails || null,
            metadata: {
                sessionId,
                messageCount: session.messages.length,
                responseTime,
                source: aiResponse.source,
                timestamp: aiResponse.timestamp
            }
        });

    } catch (error) {
        console.error('Chat Error:', error);
        
        res.status(500).json({
            success: false,
            error: "I'm experiencing technical difficulties. Let me connect you with a human agent.",
            fallback: true,
            suggestions: ["Try again", "Contact support", "Check FAQ"],
            metadata: {
                error: error.message,
                responseTime: Date.now() - startTime
            }
        });
    }
});

// Order lookup endpoint
app.get('/api/orders/:orderId', async (req, res) => {
    try {
        const { orderId } = req.params;
        const orderDetails = await geminiAI.lookupOrder(orderId);
        
        if (orderDetails) {
            res.json({
                success: true,
                order: orderDetails
            });
        } else {
            res.status(404).json({
                success: false,
                error: `Order ${orderId} not found`,
                suggestion: "Please check your order number and try again"
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: "Failed to retrieve order details"
        });
    }
});

// Analytics endpoint
app.get('/api/analytics', (req, res) => {
    const topIntents = Array.from(analytics.intents.entries())
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([intent, count]) => ({ intent, count }));

    res.json({
        success: true,
        data: {
            totalChats: analytics.totalChats,
            totalMessages: analytics.totalMessages,
            activeSessions: sessions.size,
            avgResponseTime: Math.round(analytics.avgResponseTime),
            topIntents,
            uptime: process.uptime(),
            timestamp: new Date().toISOString()
        }
    });
});

// Health check
app.get('/api/health', async (req, res) => {
    try {
        // Test Gemini AI connection
        const geminiTest = await geminiAI.testConnection();
        
        res.json({
            status: geminiTest.success ? 'healthy' : 'degraded',
            services: {
                server: 'healthy',
                geminiAI: geminiTest.success ? 'healthy' : 'error',
                database: 'healthy' // Mock for demo
            },
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(503).json({
            status: 'error',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Create support ticket
app.post('/api/ticket', (req, res) => {
    const { sessionId, issue, priority = 'normal' } = req.body;
    
    const ticketId = `TCK-${Date.now().toString(36).toUpperCase()}`;
    
    // In production, save to database
    console.log(`🎫 Support Ticket Created: ${ticketId}`, { sessionId, issue, priority });
    
    res.json({
        success: true,
        ticketId,
        message: `Support ticket ${ticketId} created successfully. Our team will contact you within 24 hours.`,
        estimatedResponse: priority === 'high' ? '2 hours' : '24 hours'
    });
});

// Feedback endpoint
app.post('/api/feedback', (req, res) => {
    const { sessionId, rating, comment } = req.body;
    
    if (rating >= 1 && rating <= 5) {
        analytics.userSatisfaction = (analytics.userSatisfaction + rating) / 2;
        
        console.log(`📝 Feedback Received: ${rating}/5 - ${comment}`);
        
        res.json({
            success: true,
            message: "Thank you for your feedback! It helps us improve our service."
        });
    } else {
        res.status(400).json({
            success: false,
            error: "Rating must be between 1 and 5"
        });
    }
});

// Error handling
app.use((error, req, res, next) => {
    console.error('Server Error:', error);
    res.status(500).json({
        success: false,
        error: "Internal server error",
        message: "Something went wrong. Please try again."
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: "Endpoint not found",
        availableEndpoints: [
            "GET / - API info",
            "POST /api/chat - Chat with AI",
            "GET /api/orders/:id - Order lookup", 
            "GET /api/analytics - Analytics data",
            "GET /api/health - Health check"
        ]
    });
});

// Helper function for basic emotion detection
function detectBasicEmotion(message) {
    const lowerMsg = message.toLowerCase();
    
    if (lowerMsg.includes('angry') || lowerMsg.includes('frustrated') || lowerMsg.includes('terrible')) {
        return 'angry';
    }
    if (lowerMsg.includes('happy') || lowerMsg.includes('great') || lowerMsg.includes('excellent')) {
        return 'happy';
    }
    if (lowerMsg.includes('confused') || lowerMsg.includes('help') || lowerMsg.includes('don\'t understand')) {
        return 'confused';
    }
    
    return 'neutral';
}

// Start server
app.listen(PORT, async () => {
    console.log('\n🚀 SMART AI CUSTOMER SERVICE STARTED');
    console.log('═══════════════════════════════════════');
    console.log(`🌐 Server: http://localhost:${PORT}`);
    console.log(`📋 Portfolio: http://localhost:${PORT}/demo/portfolio.html`);
    console.log(`🤖 Chatbot: http://localhost:${PORT}/demo/chatbot.html`);
    console.log(`📊 Analytics: http://localhost:${PORT}/api/analytics`);
    console.log(`💚 Health: http://localhost:${PORT}/api/health`);
    console.log('═══════════════════════════════════════');
    console.log('✨ Features: Real Gemini AI, Order Tracking, Analytics');
    console.log('🧠 AI: Gemini Pro with conversation context');
    console.log('📦 Orders: Enhanced tracking and management');
    console.log('📈 Analytics: Real-time performance metrics');
    
    // Test Gemini AI connection
    console.log('\n🔍 Testing Gemini AI connection...');
    const testResult = await geminiAI.testConnection();
    if (testResult.success) {
        console.log('✅ Gemini AI: Connected and ready');
    } else {
        console.log('❌ Gemini AI: Connection failed -', testResult.error);
    }
    
    console.log('═══════════════════════════════════════\n');
});

module.exports = app;
