const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

// Import routes
const chatRoutes = require('./routes/chatRoutes');
const advancedChatRoutes = require('./routes/advancedChatRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const ordersRoutes = require('./routes/ordersRoutes');
const { PORT } = require('./config');

const app = express();

// Enhanced middleware
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:5500', 'null'],
    credentials: true
}));

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path} - ${req.ip}`);
    next();
});

// Rate limiting middleware (simple implementation)
const rateLimitMap = new Map();
const RATE_LIMIT = 100; // requests per minute
const RATE_WINDOW = 60 * 1000; // 1 minute

app.use((req, res, next) => {
    const clientId = req.ip;
    const now = Date.now();
    
    if (!rateLimitMap.has(clientId)) {
        rateLimitMap.set(clientId, { count: 1, resetTime: now + RATE_WINDOW });
        return next();
    }
    
    const clientData = rateLimitMap.get(clientId);
    
    if (now > clientData.resetTime) {
        clientData.count = 1;
        clientData.resetTime = now + RATE_WINDOW;
        return next();
    }
    
    if (clientData.count >= RATE_LIMIT) {
        return res.status(429).json({
            success: false,
            error: 'Rate limit exceeded',
            code: 'RATE_LIMIT_EXCEEDED',
            retryAfter: Math.ceil((clientData.resetTime - now) / 1000)
        });
    }
    
    clientData.count++;
    next();
});

// API Routes
app.use('/api/chat', chatRoutes);                    // Original chat API
app.use('/api/v2/chat', advancedChatRoutes);        // Enhanced chat API
app.use('/api/ticket', ticketRoutes);
app.use('/api/mock-orders', ordersRoutes);

// Serve static files for demo
app.use('/demo', express.static(path.join(__dirname, '../../')));

// Root endpoint with API documentation
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Advanced Customer Service Chatbot API',
        version: '2.0',
        documentation: {
            endpoints: {
                'POST /api/chat': 'Original chat processing',
                'POST /api/v2/chat': 'Advanced chat with sentiment analysis and context',
                'GET /api/v2/chat/analytics': 'Conversation analytics',
                'GET /api/v2/chat/profile/:sessionId': 'User profile and history',
                'GET /api/v2/chat/health': 'System health check',
                'POST /api/v2/chat/batch': 'Batch message processing',
                'POST /api/ticket': 'Create support ticket',
                'GET /api/mock-orders/:orderId': 'Get order information'
            },
            features: [
                'Context-aware intent detection',
                'Sentiment analysis',
                'Conversation history tracking',
                'User profiling',
                'Real-time analytics',
                'Rate limiting',
                'Enhanced error handling'
            ]
        },
        timestamp: Date.now()
    });
});

// API status endpoint
app.get('/api/status', (req, res) => {
    const memUsage = process.memoryUsage();
    
    res.json({
        success: true,
        status: 'operational',
        uptime: process.uptime(),
        memory: {
            used: Math.round(memUsage.heapUsed / 1024 / 1024) + ' MB',
            total: Math.round(memUsage.heapTotal / 1024 / 1024) + ' MB',
            external: Math.round(memUsage.external / 1024 / 1024) + ' MB'
        },
        node_version: process.version,
        environment: process.env.NODE_ENV || 'development',
        timestamp: Date.now()
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
        timestamp: Date.now()
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        code: 'NOT_FOUND',
        path: req.path,
        method: req.method,
        timestamp: Date.now()
    });
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    process.exit(0);
});

// Start server
const server = app.listen(PORT, () => {
    console.log('🚀 Advanced Customer Service Chatbot API');
    console.log(`📡 Server running on port ${PORT}`);
    console.log(`🌐 API Documentation: http://localhost:${PORT}`);
    console.log(`📊 Health Check: http://localhost:${PORT}/api/status`);
    console.log(`🎯 Demo Frontend: http://localhost:${PORT}/demo/advanced-frontend.html`);
    console.log('✨ Features: Context awareness, sentiment analysis, analytics');
    console.log('─'.repeat(60));
});

module.exports = { app, server };
