const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const { v4: uuidv4 } = require('uuid');
const WebSocket = require('ws');
const http = require('http');
const path = require('path');

// Import enhanced services
const UltraAIProcessor = require('./services/ultraAIProcessor');
const AnalyticsEngine = require('./services/analyticsEngine');
const SecurityManager = require('./services/securityManager');
const PerformanceMonitor = require('./services/performanceMonitor');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Initialize ultra-advanced services
const aiProcessor = new UltraAIProcessor();
const analytics = new AnalyticsEngine();
const security = new SecurityManager();
const performance = new PerformanceMonitor();

// Ultra-advanced middleware stack
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com", "https://cdn.jsdelivr.net"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "ws:", "wss:"]
        }
    }
}));

app.use(compression({ level: 9 }));
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:5500', 'null'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Session-ID', 'X-Request-ID']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Ultra-advanced logging
app.use(morgan('combined', {
    stream: {
        write: (message) => {
            analytics.logRequest(message.trim());
        }
    }
}));

// Performance monitoring middleware
app.use((req, res, next) => {
    req.startTime = Date.now();
    req.requestId = uuidv4();
    res.setHeader('X-Request-ID', req.requestId);
    next();
});

// Advanced rate limiting with AI-based threat detection
const rateLimitStore = new Map();
const suspiciousPatterns = new Map();

app.use(async (req, res, next) => {
    const clientId = req.ip + (req.headers['user-agent'] || '');
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute
    const maxRequests = 100;

    // AI-powered threat detection
    const threatLevel = await security.analyzeThreatLevel(req);
    if (threatLevel > 0.8) {
        return res.status(429).json({
            success: false,
            error: 'Suspicious activity detected',
            threatLevel,
            requestId: req.requestId
        });
    }

    // Dynamic rate limiting based on threat level
    const adjustedLimit = Math.floor(maxRequests * (1 - threatLevel * 0.5));
    
    if (!rateLimitStore.has(clientId)) {
        rateLimitStore.set(clientId, { count: 1, resetTime: now + windowMs });
        return next();
    }

    const clientData = rateLimitStore.get(clientId);
    if (now > clientData.resetTime) {
        clientData.count = 1;
        clientData.resetTime = now + windowMs;
        return next();
    }

    if (clientData.count >= adjustedLimit) {
        return res.status(429).json({
            success: false,
            error: 'Rate limit exceeded',
            retryAfter: Math.ceil((clientData.resetTime - now) / 1000),
            requestId: req.requestId
        });
    }

    clientData.count++;
    next();
});

// WebSocket connection handling with advanced features
wss.on('connection', (ws, req) => {
    const sessionId = uuidv4();
    ws.sessionId = sessionId;
    ws.isAlive = true;
    
    console.log(`🔗 WebSocket connected: ${sessionId}`);
    analytics.trackConnection(sessionId, req.ip);

    ws.on('pong', () => {
        ws.isAlive = true;
    });

    ws.on('message', async (data) => {
        try {
            const message = JSON.parse(data);
            const response = await aiProcessor.processMessage({
                ...message,
                sessionId,
                connectionType: 'websocket'
            });
            
            ws.send(JSON.stringify({
                ...response,
                timestamp: new Date().toISOString(),
                sessionId
            }));
            
            analytics.trackMessage(sessionId, message, response);
        } catch (error) {
            ws.send(JSON.stringify({
                success: false,
                error: 'Message processing failed',
                details: error.message,
                sessionId
            }));
        }
    });

    ws.on('close', () => {
        console.log(`🔌 WebSocket disconnected: ${sessionId}`);
        analytics.trackDisconnection(sessionId);
    });
});

// Heartbeat for WebSocket connections
setInterval(() => {
    wss.clients.forEach((ws) => {
        if (!ws.isAlive) {
            ws.terminate();
            return;
        }
        ws.isAlive = false;
        ws.ping();
    });
}, 30000);

// Ultra API Routes
const ultraRoutes = require('./routes/ultraRoutes');

// Inject services into app locals for route access
app.locals.aiProcessor = aiProcessor;
app.locals.analytics = analytics;
app.locals.security = security;
app.locals.performance = performance;

// Mount ultra routes
app.use('/api/ultra', ultraRoutes);

// Static file serving for frontend
app.use('/demo', express.static(path.join(__dirname, '../../')));

// Root endpoint with system info
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: '🚀 Ultra Pro Max AI Assistant API',
        version: '3.0.0-ultra',
        features: {
            websocket: true,
            analytics: true,
            security: true,
            performance: true,
            aiLearning: true
        },
        endpoints: {
            chat: '/api/ultra/chat',
            analytics: '/api/ultra/analytics',
            health: '/api/ultra/health',
            demo: '/demo/ultra-pro-max-frontend.html'
        },
        timestamp: new Date().toISOString()
    });
});

// Global error handler
app.use((error, req, res, next) => {
    console.error('🚨 Global Error:', error);
    
    performance.recordError(error, {
        endpoint: req.path,
        method: req.method,
        ip: req.ip
    });
    
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'An unexpected error occurred',
        requestId: req.requestId,
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        path: req.originalUrl,
        availableEndpoints: [
            '/api/ultra/chat',
            '/api/ultra/analytics',
            '/api/ultra/health',
            '/demo/ultra-pro-max-frontend.html'
        ],
        timestamp: new Date().toISOString()
    });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`
🚀 ULTRA PRO MAX AI ASSISTANT STARTED`);
    console.log(`───────────────────────────────────────`);
    console.log(`🌐 Server: http://localhost:${PORT}`);
    console.log(`🎨 Demo: http://localhost:${PORT}/demo/ultra-pro-max-frontend.html`);
    console.log(`📊 Analytics: http://localhost:${PORT}/api/ultra/analytics`);
    console.log(`🛡️ Security: http://localhost:${PORT}/api/ultra/security`);
    console.log(`⚡ Performance: http://localhost:${PORT}/api/ultra/performance`);
    console.log(`💚 Health: http://localhost:${PORT}/api/ultra/health`);
    console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
    console.log(`───────────────────────────────────────`);
    console.log(`✨ Ultra features: AI, Analytics, Security, Performance`);
    console.log(`🧠 Neural Intelligence: Active`);
    console.log(`🛡️ AI Security: Active`);
    console.log(`📈 Real-time Analytics: Active`);
    console.log(`⚡ Performance Monitor: Active`);
    console.log(`───────────────────────────────────────\n`);
});

module.exports = { app, server, wss };
