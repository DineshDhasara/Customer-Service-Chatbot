const express = require('express');
const http = require('http');
const cors = require('cors');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');

// Import routes and services
const chatRoutes = require('./routes/chatRoutes');
const advancedChatRoutes = require('./routes/advancedChatRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const ordersRoutes = require('./routes/ordersRoutes');
const WebSocketServer = require('./websocketServer');
const { PORT } = require('./config');

const app = express();
const server = http.createServer(app);

// Initialize WebSocket server
const wsServer = new WebSocketServer(server);

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://unpkg.com", "https://cdn.tailwindcss.com", "https://cdnjs.cloudflare.com", "https://cdn.jsdelivr.net"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "ws:", "wss:"]
        }
    }
}));

// Performance middleware
app.use(compression());
app.use(morgan('combined'));

// CORS configuration
app.use(cors({
    origin: [
        'http://localhost:3000', 
        'http://localhost:5173', 
        'http://127.0.0.1:5500', 
        'null',
        'file://'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Advanced rate limiting
const rateLimitMap = new Map();
const RATE_LIMITS = {
    chat: { limit: 60, window: 60 * 1000 }, // 60 requests per minute for chat
    api: { limit: 100, window: 60 * 1000 }, // 100 requests per minute for API
    static: { limit: 200, window: 60 * 1000 } // 200 requests per minute for static files
};

function createRateLimiter(type) {
    return (req, res, next) => {
        const clientId = req.ip + ':' + type;
        const now = Date.now();
        const config = RATE_LIMITS[type];
        
        if (!rateLimitMap.has(clientId)) {
            rateLimitMap.set(clientId, { count: 1, resetTime: now + config.window });
            return next();
        }
        
        const clientData = rateLimitMap.get(clientId);
        
        if (now > clientData.resetTime) {
            clientData.count = 1;
            clientData.resetTime = now + config.window;
            return next();
        }
        
        if (clientData.count >= config.limit) {
            return res.status(429).json({
                success: false,
                error: 'Rate limit exceeded',
                code: 'RATE_LIMIT_EXCEEDED',
                retryAfter: Math.ceil((clientData.resetTime - now) / 1000),
                limit: config.limit,
                window: config.window / 1000
            });
        }
        
        clientData.count++;
        next();
    };
}

// Request logging and metrics
app.use((req, res, next) => {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();
    
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        console.log(`[${timestamp}] ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms - ${req.ip}`);
    });
    
    next();
});

// API Routes with rate limiting
app.use('/api/chat', createRateLimiter('chat'), chatRoutes);
app.use('/api/v2/chat', createRateLimiter('chat'), advancedChatRoutes);
app.use('/api/ticket', createRateLimiter('api'), ticketRoutes);
app.use('/api/mock-orders', createRateLimiter('api'), ordersRoutes);

// WebSocket status endpoint
app.get('/api/websocket/stats', (req, res) => {
    res.json({
        success: true,
        data: wsServer.getStats(),
        timestamp: Date.now()
    });
});

// Serve static files with rate limiting
app.use('/demo', createRateLimiter('static'), express.static(path.join(__dirname, '../../')));

// Enhanced root endpoint with comprehensive API documentation
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: '🚀 AI Customer Service Assistant - Portfolio Edition',
        version: '3.0.0',
        features: [
            '🧠 Advanced NLU with sentiment analysis',
            '💬 Real-time WebSocket communication',
            '📊 Live analytics and metrics',
            '🔒 Enterprise-grade security',
            '⚡ High-performance architecture',
            '📱 Mobile-responsive design'
        ],
        endpoints: {
            chat: {
                'POST /api/chat': 'Original chat processing',
                'POST /api/v2/chat': 'Advanced chat with AI features',
                'GET /api/v2/chat/analytics': 'Conversation analytics',
                'GET /api/v2/chat/profile/:sessionId': 'User profile data',
                'GET /api/v2/chat/health': 'System health check',
                'POST /api/v2/chat/batch': 'Batch message processing'
            },
            support: {
                'POST /api/ticket': 'Create support ticket',
                'GET /api/mock-orders/:orderId': 'Order information'
            },
            system: {
                'GET /api/status': 'System status and metrics',
                'GET /api/websocket/stats': 'WebSocket connection stats'
            }
        },
        demos: {
            'Portfolio Frontend': '/demo/portfolio-frontend.html',
            'Advanced Frontend': '/demo/advanced-frontend.html',
            'Simple Frontend': '/demo/simple-frontend.html'
        },
        websocket: {
            endpoint: `ws://localhost:${PORT}`,
            events: ['join', 'chat', 'typing', 'ping'],
            description: 'Real-time bidirectional communication'
        },
        rateLimits: {
            chat: '60 requests/minute',
            api: '100 requests/minute',
            static: '200 requests/minute'
        },
        timestamp: Date.now()
    });
});

// Enhanced system status endpoint
app.get('/api/status', (req, res) => {
    const memUsage = process.memoryUsage();
    const wsStats = wsServer.getStats();
    
    res.json({
        success: true,
        status: 'operational',
        version: '3.0.0',
        uptime: {
            seconds: process.uptime(),
            formatted: formatUptime(process.uptime())
        },
        memory: {
            used: Math.round(memUsage.heapUsed / 1024 / 1024) + ' MB',
            total: Math.round(memUsage.heapTotal / 1024 / 1024) + ' MB',
            external: Math.round(memUsage.external / 1024 / 1024) + ' MB',
            rss: Math.round(memUsage.rss / 1024 / 1024) + ' MB'
        },
        websocket: wsStats,
        environment: {
            node_version: process.version,
            platform: process.platform,
            arch: process.arch,
            env: process.env.NODE_ENV || 'development'
        },
        features: {
            websocket: true,
            rateLimit: true,
            compression: true,
            security: true,
            analytics: true
        },
        timestamp: Date.now()
    });
});

// Health check endpoint for load balancers
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: Date.now()
    });
});

// API documentation endpoint
app.get('/api/docs', (req, res) => {
    res.json({
        openapi: '3.0.0',
        info: {
            title: 'AI Customer Service Assistant API',
            version: '3.0.0',
            description: 'Advanced AI-powered customer service chatbot with real-time communication'
        },
        servers: [
            { url: `http://localhost:${PORT}`, description: 'Development server' }
        ],
        paths: {
            '/api/chat': {
                post: {
                    summary: 'Send chat message',
                    requestBody: {
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        sessionId: { type: 'string' },
                                        message: { type: 'string' }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    
    res.status(err.status || 500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
        timestamp: Date.now(),
        requestId: req.headers['x-request-id'] || 'unknown'
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
        suggestion: 'Check the API documentation at /',
        timestamp: Date.now()
    });
});

// Utility functions
function formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    return `${days}d ${hours}h ${minutes}m ${secs}s`;
}

// Graceful shutdown
const gracefulShutdown = (signal) => {
    console.log(`\n${signal} received, shutting down gracefully...`);
    
    server.close(() => {
        console.log('HTTP server closed');
        
        // Close WebSocket connections
        wsServer.wss.clients.forEach(client => {
            client.close();
        });
        
        console.log('WebSocket server closed');
        process.exit(0);
    });
    
    // Force close after 10 seconds
    setTimeout(() => {
        console.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
server.listen(PORT, () => {
    console.log('🚀 AI Customer Service Assistant - Portfolio Edition');
    console.log('═'.repeat(60));
    console.log(`📡 Server running on port ${PORT}`);
    console.log(`🌐 API Documentation: http://localhost:${PORT}`);
    console.log(`📊 System Status: http://localhost:${PORT}/api/status`);
    console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
    console.log(`🎯 Portfolio Demo: http://localhost:${PORT}/demo/portfolio-frontend.html`);
    console.log('✨ Features: WebSocket, Rate Limiting, Security, Analytics');
    console.log('═'.repeat(60));
});

module.exports = { app, server, wsServer };
