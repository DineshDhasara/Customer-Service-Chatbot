/**
 * Ultra Advanced API Routes with Real-time Features
 * Features: WebSocket endpoints, Analytics, Security, Performance monitoring
 */

const express = require('express');
const router = express.Router();

// Ultra Chat Routes
router.post('/chat', async (req, res) => {
    try {
        const { message, sessionId, metadata = {} } = req.body;
        
        if (!message || !sessionId) {
            return res.status(400).json({
                success: false,
                error: 'Message and sessionId are required',
                code: 'MISSING_PARAMETERS'
            });
        }

        // Get AI processor from app locals (injected by server)
        const aiProcessor = req.app.locals.aiProcessor;
        const analytics = req.app.locals.analytics;
        const performance = req.app.locals.performance;
        
        const startTime = Date.now();
        
        // Process message with Ultra AI
        const response = await aiProcessor.processMessage({
            sessionId,
            message,
            metadata: {
                ...metadata,
                ip: req.ip,
                userAgent: req.headers['user-agent'],
                timestamp: new Date().toISOString()
            }
        });
        
        const processingTime = Date.now() - startTime;
        
        // Record performance metrics
        performance.recordResponseTime(processingTime);
        performance.recordThroughput(1);
        
        // Track analytics
        analytics.trackMessage(sessionId, { message }, response);
        
        res.json({
            success: true,
            ...response,
            processingTime,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Ultra Chat Error:', error);
        
        // Record error metrics
        const performance = req.app.locals.performance;
        performance.recordError(error, {
            endpoint: '/api/ultra/chat',
            sessionId: req.body.sessionId
        });
        
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: 'The AI assistant encountered an error. Please try again.',
            code: 'AI_PROCESSING_ERROR',
            timestamp: new Date().toISOString()
        });
    }
});

// Real-time Analytics Endpoint
router.get('/analytics', (req, res) => {
    try {
        const analytics = req.app.locals.analytics;
        const analyticsData = analytics.getAnalytics();
        
        res.json(analyticsData);
    } catch (error) {
        console.error('Analytics Error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve analytics data'
        });
    }
});

// Session Analytics
router.get('/analytics/session/:sessionId', (req, res) => {
    try {
        const { sessionId } = req.params;
        const analytics = req.app.locals.analytics;
        const sessionData = analytics.getSessionAnalytics(sessionId);
        
        res.json(sessionData);
    } catch (error) {
        console.error('Session Analytics Error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve session analytics'
        });
    }
});

// Performance Monitoring
router.get('/performance', (req, res) => {
    try {
        const performance = req.app.locals.performance;
        const performanceData = performance.getDetailedMetrics();
        
        res.json(performanceData);
    } catch (error) {
        console.error('Performance Error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve performance data'
        });
    }
});

// Health Check
router.get('/health', (req, res) => {
    try {
        const performance = req.app.locals.performance;
        const analytics = req.app.locals.analytics;
        const security = req.app.locals.security;
        
        const healthData = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            services: {
                performance: performance.getHealthCheck(),
                analytics: analytics.getHealthStatus(),
                security: security.getSecurityStatus()
            },
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            version: '3.0.0-ultra'
        };
        
        // Determine overall health
        const services = Object.values(healthData.services);
        const hasUnhealthyService = services.some(service => 
            service.status === 'critical' || service.healthy === false
        );
        
        if (hasUnhealthyService) {
            healthData.status = 'degraded';
            res.status(503);
        }
        
        res.json(healthData);
    } catch (error) {
        console.error('Health Check Error:', error);
        res.status(500).json({
            status: 'error',
            error: 'Health check failed',
            timestamp: new Date().toISOString()
        });
    }
});

// Security Status
router.get('/security', (req, res) => {
    try {
        const security = req.app.locals.security;
        const securityData = security.getSecurityReport();
        
        res.json({
            success: true,
            data: securityData,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Security Status Error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve security status'
        });
    }
});

// AI Training Data (for learning and improvement)
router.post('/training/feedback', async (req, res) => {
    try {
        const { sessionId, messageId, feedback, rating } = req.body;
        
        if (!sessionId || !messageId || !feedback) {
            return res.status(400).json({
                success: false,
                error: 'SessionId, messageId, and feedback are required'
            });
        }
        
        const aiProcessor = req.app.locals.aiProcessor;
        const analytics = req.app.locals.analytics;
        
        // Store feedback for AI improvement
        const trainingData = {
            sessionId,
            messageId,
            feedback,
            rating: rating || null,
            timestamp: new Date().toISOString(),
            ip: req.ip
        };
        
        // In a real implementation, this would be stored in a database
        console.log('📚 Training Feedback Received:', trainingData);
        
        res.json({
            success: true,
            message: 'Feedback received and will be used to improve AI responses',
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Training Feedback Error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process feedback'
        });
    }
});

// Conversation Export
router.get('/conversation/:sessionId/export', (req, res) => {
    try {
        const { sessionId } = req.params;
        const { format = 'json' } = req.query;
        
        const analytics = req.app.locals.analytics;
        const sessionData = analytics.getSessionAnalytics(sessionId);
        
        if (!sessionData.success) {
            return res.status(404).json({
                success: false,
                error: 'Session not found'
            });
        }
        
        const exportData = {
            sessionId,
            exportedAt: new Date().toISOString(),
            conversation: sessionData.data,
            metadata: {
                totalMessages: sessionData.data.messageCount,
                duration: sessionData.data.duration,
                intents: sessionData.data.intentDistribution
            }
        };
        
        if (format === 'csv') {
            // Convert to CSV format
            const csv = convertToCSV(exportData);
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="conversation-${sessionId}.csv"`);
            res.send(csv);
        } else {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename="conversation-${sessionId}.json"`);
            res.json(exportData);
        }
        
    } catch (error) {
        console.error('Conversation Export Error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to export conversation'
        });
    }
});

// System Configuration
router.get('/config', (req, res) => {
    try {
        const config = {
            version: '3.0.0-ultra',
            features: {
                websocket: true,
                analytics: true,
                security: true,
                performance: true,
                aiLearning: true,
                realTimeMonitoring: true
            },
            limits: {
                maxMessageLength: 10000,
                maxSessionDuration: 3600000, // 1 hour
                rateLimitPerMinute: 100,
                maxConcurrentConnections: 1000
            },
            ai: {
                supportedIntents: [
                    'greeting', 'order_status', 'complaint', 'refund',
                    'technical_support', 'human_escalation', 'thanks'
                ],
                emotionDetection: true,
                sentimentAnalysis: true,
                contextAwareness: true,
                personalityAdaptation: true
            }
        };
        
        res.json({
            success: true,
            data: config,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Config Error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve configuration'
        });
    }
});

// Manual Performance Optimization
router.post('/optimize/:type', (req, res) => {
    try {
        const { type } = req.params;
        const performance = req.app.locals.performance;
        
        const validTypes = ['cpu', 'memory', 'connections', 'response_time'];
        if (!validTypes.includes(type)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid optimization type',
                validTypes
            });
        }
        
        performance.forceOptimization(type);
        
        res.json({
            success: true,
            message: `${type} optimization triggered`,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Manual Optimization Error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to trigger optimization'
        });
    }
});

// System Reset (for development/testing)
router.post('/reset', (req, res) => {
    try {
        const { confirm } = req.body;
        
        if (confirm !== 'RESET_ULTRA_SYSTEM') {
            return res.status(400).json({
                success: false,
                error: 'Invalid confirmation code'
            });
        }
        
        const performance = req.app.locals.performance;
        const analytics = req.app.locals.analytics;
        
        performance.resetMetrics();
        // Note: Analytics reset would need to be implemented
        
        res.json({
            success: true,
            message: 'System metrics reset successfully',
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('System Reset Error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to reset system'
        });
    }
});

// Helper function to convert data to CSV
function convertToCSV(data) {
    const headers = ['Timestamp', 'Sender', 'Message', 'Intent', 'Confidence', 'Emotion'];
    const rows = [headers.join(',')];
    
    // This is a simplified CSV conversion
    // In a real implementation, you'd properly escape CSV values
    if (data.conversation && data.conversation.history) {
        data.conversation.history.forEach(item => {
            const row = [
                item.timestamp || '',
                item.sender || '',
                `"${(item.message || '').replace(/"/g, '""')}"`,
                item.intent || '',
                item.confidence || '',
                item.emotion || ''
            ];
            rows.push(row.join(','));
        });
    }
    
    return rows.join('\n');
}

module.exports = router;
