/**
 * Advanced Analytics Engine with Real-time Insights
 * Features: Performance Monitoring, User Behavior Analysis, Predictive Analytics
 */

class AnalyticsEngine {
    constructor() {
        this.metrics = {
            requests: new Map(),
            sessions: new Map(),
            intents: new Map(),
            emotions: new Map(),
            performance: new Map(),
            errors: new Map()
        };
        
        this.realTimeData = {
            activeConnections: 0,
            requestsPerMinute: 0,
            averageResponseTime: 0,
            errorRate: 0,
            topIntents: [],
            emotionalTrends: {}
        };
        
        this.startTime = Date.now();
        this.initializeAnalytics();
    }

    initializeAnalytics() {
        console.log('📊 Analytics Engine initialized');
        
        // Start real-time data collection
        setInterval(() => {
            this.updateRealTimeMetrics();
        }, 5000); // Update every 5 seconds
        
        // Generate hourly reports
        setInterval(() => {
            this.generateHourlyReport();
        }, 3600000); // Every hour
    }

    // Request tracking
    logRequest(requestData) {
        const timestamp = Date.now();
        const hour = new Date().getHours();
        
        if (!this.metrics.requests.has(hour)) {
            this.metrics.requests.set(hour, []);
        }
        
        this.metrics.requests.get(hour).push({
            timestamp,
            ...requestData
        });
    }

    // Connection tracking
    trackConnection(sessionId, ip) {
        this.metrics.sessions.set(sessionId, {
            sessionId,
            ip,
            startTime: Date.now(),
            messageCount: 0,
            intents: [],
            emotions: [],
            lastActivity: Date.now()
        });
        
        this.realTimeData.activeConnections++;
    }

    trackDisconnection(sessionId) {
        const session = this.metrics.sessions.get(sessionId);
        if (session) {
            session.endTime = Date.now();
            session.duration = session.endTime - session.startTime;
        }
        
        this.realTimeData.activeConnections = Math.max(0, this.realTimeData.activeConnections - 1);
    }

    // Message tracking
    trackMessage(sessionId, message, response) {
        const session = this.metrics.sessions.get(sessionId);
        if (session) {
            session.messageCount++;
            session.lastActivity = Date.now();
            
            if (response.intent) {
                session.intents.push(response.intent);
                this.updateIntentMetrics(response.intent, response.confidence);
            }
            
            if (response.emotion) {
                session.emotions.push(response.emotion);
                this.updateEmotionMetrics(response.emotion);
            }
        }
        
        // Track performance
        if (response.metadata?.processingTime) {
            this.trackPerformance(response.metadata.processingTime);
        }
    }

    updateIntentMetrics(intent, confidence) {
        if (!this.metrics.intents.has(intent)) {
            this.metrics.intents.set(intent, {
                count: 0,
                totalConfidence: 0,
                averageConfidence: 0,
                trend: []
            });
        }
        
        const intentData = this.metrics.intents.get(intent);
        intentData.count++;
        intentData.totalConfidence += confidence;
        intentData.averageConfidence = intentData.totalConfidence / intentData.count;
        intentData.trend.push({
            timestamp: Date.now(),
            confidence
        });
        
        // Keep only recent trend data (last 100 entries)
        if (intentData.trend.length > 100) {
            intentData.trend.shift();
        }
    }

    updateEmotionMetrics(emotion) {
        const emotionKey = emotion.primary;
        
        if (!this.metrics.emotions.has(emotionKey)) {
            this.metrics.emotions.set(emotionKey, {
                count: 0,
                totalIntensity: 0,
                averageIntensity: 0,
                trend: []
            });
        }
        
        const emotionData = this.metrics.emotions.get(emotionKey);
        emotionData.count++;
        emotionData.totalIntensity += emotion.intensity;
        emotionData.averageIntensity = emotionData.totalIntensity / emotionData.count;
        emotionData.trend.push({
            timestamp: Date.now(),
            intensity: emotion.intensity
        });
        
        // Keep only recent trend data
        if (emotionData.trend.length > 100) {
            emotionData.trend.shift();
        }
    }

    trackPerformance(responseTime) {
        const minute = Math.floor(Date.now() / 60000);
        
        if (!this.metrics.performance.has(minute)) {
            this.metrics.performance.set(minute, {
                responseTimes: [],
                averageResponseTime: 0,
                minResponseTime: Infinity,
                maxResponseTime: 0,
                requestCount: 0
            });
        }
        
        const perfData = this.metrics.performance.get(minute);
        perfData.responseTimes.push(responseTime);
        perfData.requestCount++;
        perfData.minResponseTime = Math.min(perfData.minResponseTime, responseTime);
        perfData.maxResponseTime = Math.max(perfData.maxResponseTime, responseTime);
        perfData.averageResponseTime = perfData.responseTimes.reduce((a, b) => a + b, 0) / perfData.responseTimes.length;
    }

    trackError(error, context = {}) {
        const timestamp = Date.now();
        const errorKey = error.message || 'Unknown Error';
        
        if (!this.metrics.errors.has(errorKey)) {
            this.metrics.errors.set(errorKey, {
                count: 0,
                firstOccurrence: timestamp,
                lastOccurrence: timestamp,
                contexts: []
            });
        }
        
        const errorData = this.metrics.errors.get(errorKey);
        errorData.count++;
        errorData.lastOccurrence = timestamp;
        errorData.contexts.push({
            timestamp,
            ...context
        });
        
        // Keep only recent error contexts
        if (errorData.contexts.length > 50) {
            errorData.contexts.shift();
        }
    }

    updateRealTimeMetrics() {
        const now = Date.now();
        const oneMinuteAgo = now - 60000;
        
        // Calculate requests per minute
        let recentRequests = 0;
        for (const [hour, requests] of this.metrics.requests) {
            recentRequests += requests.filter(req => req.timestamp > oneMinuteAgo).length;
        }
        this.realTimeData.requestsPerMinute = recentRequests;
        
        // Calculate average response time
        const recentPerformance = Array.from(this.metrics.performance.values())
            .filter(perf => perf.responseTimes.length > 0);
        
        if (recentPerformance.length > 0) {
            const totalResponseTime = recentPerformance.reduce((sum, perf) => sum + perf.averageResponseTime, 0);
            this.realTimeData.averageResponseTime = Math.round(totalResponseTime / recentPerformance.length);
        }
        
        // Calculate error rate
        const totalErrors = Array.from(this.metrics.errors.values())
            .reduce((sum, error) => sum + error.count, 0);
        const totalRequests = Array.from(this.metrics.requests.values())
            .reduce((sum, requests) => sum + requests.length, 0);
        
        this.realTimeData.errorRate = totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0;
        
        // Update top intents
        this.realTimeData.topIntents = Array.from(this.metrics.intents.entries())
            .sort(([,a], [,b]) => b.count - a.count)
            .slice(0, 5)
            .map(([intent, data]) => ({
                intent,
                count: data.count,
                confidence: Math.round(data.averageConfidence * 100)
            }));
        
        // Update emotional trends
        this.realTimeData.emotionalTrends = {};
        for (const [emotion, data] of this.metrics.emotions) {
            this.realTimeData.emotionalTrends[emotion] = {
                count: data.count,
                intensity: Math.round(data.averageIntensity * 100)
            };
        }
    }

    generateHourlyReport() {
        const report = {
            timestamp: new Date().toISOString(),
            period: 'hourly',
            summary: {
                totalSessions: this.metrics.sessions.size,
                activeConnections: this.realTimeData.activeConnections,
                requestsPerMinute: this.realTimeData.requestsPerMinute,
                averageResponseTime: this.realTimeData.averageResponseTime,
                errorRate: this.realTimeData.errorRate
            },
            intents: this.realTimeData.topIntents,
            emotions: this.realTimeData.emotionalTrends,
            performance: this.getPerformanceInsights(),
            recommendations: this.generateRecommendations()
        };
        
        console.log('📈 Hourly Analytics Report:', JSON.stringify(report, null, 2));
        return report;
    }

    getPerformanceInsights() {
        const insights = {
            responseTimeDistribution: {},
            peakHours: [],
            bottlenecks: []
        };
        
        // Analyze response time distribution
        const allResponseTimes = [];
        for (const perfData of this.metrics.performance.values()) {
            allResponseTimes.push(...perfData.responseTimes);
        }
        
        if (allResponseTimes.length > 0) {
            allResponseTimes.sort((a, b) => a - b);
            insights.responseTimeDistribution = {
                p50: allResponseTimes[Math.floor(allResponseTimes.length * 0.5)],
                p90: allResponseTimes[Math.floor(allResponseTimes.length * 0.9)],
                p95: allResponseTimes[Math.floor(allResponseTimes.length * 0.95)],
                p99: allResponseTimes[Math.floor(allResponseTimes.length * 0.99)]
            };
        }
        
        return insights;
    }

    generateRecommendations() {
        const recommendations = [];
        
        // Performance recommendations
        if (this.realTimeData.averageResponseTime > 1000) {
            recommendations.push({
                type: 'performance',
                priority: 'high',
                message: 'Average response time is above 1 second. Consider optimizing AI processing.'
            });
        }
        
        // Error rate recommendations
        if (this.realTimeData.errorRate > 5) {
            recommendations.push({
                type: 'reliability',
                priority: 'high',
                message: 'Error rate is above 5%. Review error logs and implement fixes.'
            });
        }
        
        // Intent confidence recommendations
        const lowConfidenceIntents = Array.from(this.metrics.intents.entries())
            .filter(([, data]) => data.averageConfidence < 0.7)
            .map(([intent]) => intent);
        
        if (lowConfidenceIntents.length > 0) {
            recommendations.push({
                type: 'ai_training',
                priority: 'medium',
                message: `Low confidence detected for intents: ${lowConfidenceIntents.join(', ')}. Consider improving training data.`
            });
        }
        
        return recommendations;
    }

    // API endpoints for analytics data
    getAnalytics() {
        return {
            success: true,
            data: {
                realTime: this.realTimeData,
                summary: {
                    uptime: Date.now() - this.startTime,
                    totalSessions: this.metrics.sessions.size,
                    totalIntents: this.metrics.intents.size,
                    totalErrors: Array.from(this.metrics.errors.values()).reduce((sum, error) => sum + error.count, 0)
                },
                intents: Object.fromEntries(this.metrics.intents),
                emotions: Object.fromEntries(this.metrics.emotions),
                performance: this.getPerformanceInsights()
            }
        };
    }

    getSessionAnalytics(sessionId) {
        const session = this.metrics.sessions.get(sessionId);
        if (!session) {
            return { success: false, error: 'Session not found' };
        }
        
        return {
            success: true,
            data: {
                ...session,
                duration: session.endTime ? session.endTime - session.startTime : Date.now() - session.startTime,
                intentDistribution: this.calculateIntentDistribution(session.intents),
                emotionalJourney: session.emotions
            }
        };
    }

    calculateIntentDistribution(intents) {
        const distribution = {};
        intents.forEach(intent => {
            distribution[intent] = (distribution[intent] || 0) + 1;
        });
        return distribution;
    }

    // Health check
    getHealthStatus() {
        const isHealthy = this.realTimeData.errorRate < 10 && this.realTimeData.averageResponseTime < 2000;
        
        return {
            status: isHealthy ? 'healthy' : 'degraded',
            uptime: Date.now() - this.startTime,
            metrics: this.realTimeData,
            lastUpdated: new Date().toISOString()
        };
    }
}

module.exports = AnalyticsEngine;
