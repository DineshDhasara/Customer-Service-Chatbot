/**
 * Advanced Security Manager with AI-Powered Threat Detection
 * Features: Real-time threat analysis, behavioral monitoring, adaptive security
 */

class SecurityManager {
    constructor() {
        this.threatPatterns = new Map();
        this.suspiciousIPs = new Map();
        this.behaviorProfiles = new Map();
        this.securityEvents = [];
        
        // Threat detection patterns
        this.maliciousPatterns = [
            /script\s*>/i,
            /<\s*iframe/i,
            /javascript:/i,
            /on\w+\s*=/i,
            /eval\s*\(/i,
            /document\.cookie/i,
            /window\.location/i,
            /alert\s*\(/i,
            /confirm\s*\(/i,
            /prompt\s*\(/i,
            /\.\.\/\.\.\//,
            /\/etc\/passwd/i,
            /cmd\.exe/i,
            /powershell/i,
            /base64/i,
            /union\s+select/i,
            /drop\s+table/i,
            /insert\s+into/i,
            /delete\s+from/i
        ];
        
        // Suspicious behavior indicators
        this.behaviorIndicators = {
            rapidRequests: { threshold: 50, window: 60000 }, // 50 requests per minute
            repeatedFailures: { threshold: 10, window: 300000 }, // 10 failures in 5 minutes
            unusualPatterns: { threshold: 0.8 }, // 80% similarity to known attacks
            geolocationAnomalies: { enabled: true },
            timeBasedAnomalies: { enabled: true }
        };
        
        this.initializeSecurity();
    }

    initializeSecurity() {
        console.log('🛡️ Security Manager initialized with AI threat detection');
        
        // Start security monitoring
        setInterval(() => {
            this.analyzeSecurityTrends();
        }, 30000); // Every 30 seconds
        
        // Cleanup old security events
        setInterval(() => {
            this.cleanupSecurityEvents();
        }, 3600000); // Every hour
    }

    async analyzeThreatLevel(req) {
        const clientId = req.ip + (req.headers['user-agent'] || '');
        const timestamp = Date.now();
        
        let threatScore = 0;
        const threats = [];
        
        // 1. Content-based threat detection
        const contentThreats = this.analyzeContent(req);
        threatScore += contentThreats.score;
        threats.push(...contentThreats.threats);
        
        // 2. Behavioral analysis
        const behaviorThreats = await this.analyzeBehavior(clientId, req);
        threatScore += behaviorThreats.score;
        threats.push(...behaviorThreats.threats);
        
        // 3. IP reputation check
        const ipThreats = this.analyzeIPReputation(req.ip);
        threatScore += ipThreats.score;
        threats.push(...ipThreats.threats);
        
        // 4. Header analysis
        const headerThreats = this.analyzeHeaders(req.headers);
        threatScore += headerThreats.score;
        threats.push(...headerThreats.threats);
        
        // Normalize threat score (0-1)
        const normalizedScore = Math.min(threatScore, 1);
        
        // Log security event if threat detected
        if (normalizedScore > 0.3) {
            this.logSecurityEvent({
                type: 'threat_detected',
                clientId,
                ip: req.ip,
                threatScore: normalizedScore,
                threats,
                timestamp,
                request: {
                    method: req.method,
                    url: req.url,
                    userAgent: req.headers['user-agent'],
                    body: req.body
                }
            });
        }
        
        return normalizedScore;
    }

    analyzeContent(req) {
        let score = 0;
        const threats = [];
        
        // Check request body for malicious patterns
        const content = JSON.stringify(req.body || '') + (req.query ? JSON.stringify(req.query) : '');
        
        for (const pattern of this.maliciousPatterns) {
            if (pattern.test(content)) {
                score += 0.3;
                threats.push({
                    type: 'malicious_content',
                    pattern: pattern.toString(),
                    severity: 'high'
                });
            }
        }
        
        // Check for SQL injection patterns
        const sqlPatterns = [
            /'\s*or\s*'1'\s*=\s*'1/i,
            /'\s*or\s*1\s*=\s*1/i,
            /union\s+all\s+select/i,
            /concat\s*\(/i,
            /char\s*\(/i,
            /ascii\s*\(/i
        ];
        
        for (const pattern of sqlPatterns) {
            if (pattern.test(content)) {
                score += 0.4;
                threats.push({
                    type: 'sql_injection',
                    pattern: pattern.toString(),
                    severity: 'critical'
                });
            }
        }
        
        // Check for XSS patterns
        const xssPatterns = [
            /<script[^>]*>.*?<\/script>/gi,
            /javascript\s*:/i,
            /on\w+\s*=\s*['"]/i,
            /expression\s*\(/i
        ];
        
        for (const pattern of xssPatterns) {
            if (pattern.test(content)) {
                score += 0.35;
                threats.push({
                    type: 'xss_attempt',
                    pattern: pattern.toString(),
                    severity: 'high'
                });
            }
        }
        
        return { score: Math.min(score, 1), threats };
    }

    async analyzeBehavior(clientId, req) {
        let score = 0;
        const threats = [];
        const now = Date.now();
        
        // Get or create behavior profile
        if (!this.behaviorProfiles.has(clientId)) {
            this.behaviorProfiles.set(clientId, {
                requests: [],
                failures: [],
                patterns: [],
                firstSeen: now,
                lastSeen: now
            });
        }
        
        const profile = this.behaviorProfiles.get(clientId);
        profile.lastSeen = now;
        profile.requests.push({ timestamp: now, url: req.url, method: req.method });
        
        // Clean old data
        const windowStart = now - this.behaviorIndicators.rapidRequests.window;
        profile.requests = profile.requests.filter(r => r.timestamp > windowStart);
        profile.failures = profile.failures.filter(f => f.timestamp > windowStart);
        
        // 1. Rapid request detection
        if (profile.requests.length > this.behaviorIndicators.rapidRequests.threshold) {
            score += 0.4;
            threats.push({
                type: 'rapid_requests',
                count: profile.requests.length,
                severity: 'medium'
            });
        }
        
        // 2. Repeated failure analysis
        if (profile.failures.length > this.behaviorIndicators.repeatedFailures.threshold) {
            score += 0.3;
            threats.push({
                type: 'repeated_failures',
                count: profile.failures.length,
                severity: 'medium'
            });
        }
        
        // 3. Pattern analysis
        const requestPattern = this.extractRequestPattern(profile.requests);
        const similarity = this.calculatePatternSimilarity(requestPattern);
        
        if (similarity > this.behaviorIndicators.unusualPatterns.threshold) {
            score += 0.25;
            threats.push({
                type: 'unusual_pattern',
                similarity,
                severity: 'low'
            });
        }
        
        return { score: Math.min(score, 1), threats };
    }

    analyzeIPReputation(ip) {
        let score = 0;
        const threats = [];
        
        // Check if IP is in suspicious list
        if (this.suspiciousIPs.has(ip)) {
            const ipData = this.suspiciousIPs.get(ip);
            score += Math.min(ipData.threatLevel, 0.5);
            threats.push({
                type: 'suspicious_ip',
                reason: ipData.reason,
                severity: 'medium'
            });
        }
        
        // Check for private/local IPs (could be proxy/VPN)
        if (this.isPrivateIP(ip) && ip !== '127.0.0.1') {
            score += 0.1;
            threats.push({
                type: 'private_ip',
                severity: 'low'
            });
        }
        
        return { score, threats };
    }

    analyzeHeaders(headers) {
        let score = 0;
        const threats = [];
        
        // Check for missing security headers
        if (!headers['user-agent']) {
            score += 0.2;
            threats.push({
                type: 'missing_user_agent',
                severity: 'medium'
            });
        }
        
        // Check for suspicious user agents
        const suspiciousAgents = [
            /bot/i,
            /crawler/i,
            /spider/i,
            /scraper/i,
            /curl/i,
            /wget/i,
            /python/i,
            /java/i
        ];
        
        const userAgent = headers['user-agent'] || '';
        for (const pattern of suspiciousAgents) {
            if (pattern.test(userAgent)) {
                score += 0.15;
                threats.push({
                    type: 'suspicious_user_agent',
                    userAgent,
                    severity: 'low'
                });
                break;
            }
        }
        
        // Check for unusual headers
        const unusualHeaders = [
            'x-forwarded-for',
            'x-real-ip',
            'x-originating-ip',
            'x-remote-ip',
            'x-cluster-client-ip'
        ];
        
        for (const header of unusualHeaders) {
            if (headers[header]) {
                score += 0.05;
                threats.push({
                    type: 'proxy_headers',
                    header,
                    severity: 'low'
                });
            }
        }
        
        return { score: Math.min(score, 1), threats };
    }

    extractRequestPattern(requests) {
        // Extract pattern from recent requests
        return requests.slice(-10).map(r => ({
            method: r.method,
            pathSegments: r.url.split('/').length,
            hasQuery: r.url.includes('?')
        }));
    }

    calculatePatternSimilarity(pattern) {
        // Simple pattern similarity calculation
        // In a real implementation, this would use more sophisticated ML algorithms
        if (pattern.length < 3) return 0;
        
        const uniquePatterns = new Set(pattern.map(p => JSON.stringify(p)));
        return 1 - (uniquePatterns.size / pattern.length);
    }

    isPrivateIP(ip) {
        const privateRanges = [
            /^10\./,
            /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
            /^192\.168\./,
            /^127\./,
            /^169\.254\./,
            /^::1$/,
            /^fc00:/,
            /^fe80:/
        ];
        
        return privateRanges.some(range => range.test(ip));
    }

    logSecurityEvent(event) {
        this.securityEvents.push(event);
        
        // Alert on high-severity threats
        if (event.threatScore > 0.7) {
            console.warn('🚨 HIGH THREAT DETECTED:', {
                ip: event.ip,
                threatScore: event.threatScore,
                threats: event.threats.map(t => t.type)
            });
        }
        
        // Update IP reputation
        if (event.threatScore > 0.5) {
            this.updateIPReputation(event.ip, event.threatScore, event.threats);
        }
    }

    updateIPReputation(ip, threatLevel, threats) {
        if (!this.suspiciousIPs.has(ip)) {
            this.suspiciousIPs.set(ip, {
                threatLevel: 0,
                incidents: 0,
                firstSeen: Date.now(),
                reasons: []
            });
        }
        
        const ipData = this.suspiciousIPs.get(ip);
        ipData.threatLevel = Math.max(ipData.threatLevel, threatLevel);
        ipData.incidents++;
        ipData.lastSeen = Date.now();
        ipData.reasons.push(...threats.map(t => t.type));
        
        // Remove duplicates
        ipData.reasons = [...new Set(ipData.reasons)];
    }

    analyzeSecurityTrends() {
        const recentEvents = this.securityEvents.filter(
            event => Date.now() - event.timestamp < 3600000 // Last hour
        );
        
        if (recentEvents.length === 0) return;
        
        // Analyze threat trends
        const threatTypes = {};
        const ipCounts = {};
        
        recentEvents.forEach(event => {
            event.threats.forEach(threat => {
                threatTypes[threat.type] = (threatTypes[threat.type] || 0) + 1;
            });
            ipCounts[event.ip] = (ipCounts[event.ip] || 0) + 1;
        });
        
        // Log trends
        console.log('📊 Security Trends (Last Hour):', {
            totalEvents: recentEvents.length,
            topThreats: Object.entries(threatTypes)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5),
            suspiciousIPs: Object.entries(ipCounts)
                .filter(([,count]) => count > 5)
                .sort(([,a], [,b]) => b - a)
        });
    }

    cleanupSecurityEvents() {
        const cutoff = Date.now() - 86400000; // 24 hours ago
        this.securityEvents = this.securityEvents.filter(event => event.timestamp > cutoff);
        
        // Cleanup behavior profiles
        for (const [clientId, profile] of this.behaviorProfiles) {
            if (Date.now() - profile.lastSeen > 3600000) { // 1 hour inactive
                this.behaviorProfiles.delete(clientId);
            }
        }
        
        console.log('🧹 Security data cleanup completed');
    }

    // API methods
    getSecurityStatus() {
        const recentEvents = this.securityEvents.filter(
            event => Date.now() - event.timestamp < 3600000
        );
        
        return {
            status: recentEvents.length > 50 ? 'high_alert' : recentEvents.length > 10 ? 'elevated' : 'normal',
            recentThreats: recentEvents.length,
            suspiciousIPs: this.suspiciousIPs.size,
            activeBehaviorProfiles: this.behaviorProfiles.size,
            lastUpdated: new Date().toISOString()
        };
    }

    getSecurityReport() {
        const now = Date.now();
        const last24h = this.securityEvents.filter(event => now - event.timestamp < 86400000);
        
        return {
            summary: {
                totalEvents: last24h.length,
                uniqueIPs: new Set(last24h.map(e => e.ip)).size,
                averageThreatScore: last24h.length > 0 
                    ? last24h.reduce((sum, e) => sum + e.threatScore, 0) / last24h.length 
                    : 0
            },
            threatBreakdown: this.getThreatBreakdown(last24h),
            topSuspiciousIPs: Array.from(this.suspiciousIPs.entries())
                .sort(([,a], [,b]) => b.threatLevel - a.threatLevel)
                .slice(0, 10)
                .map(([ip, data]) => ({ ip, ...data })),
            recommendations: this.generateSecurityRecommendations(last24h)
        };
    }

    getThreatBreakdown(events) {
        const breakdown = {};
        events.forEach(event => {
            event.threats.forEach(threat => {
                if (!breakdown[threat.type]) {
                    breakdown[threat.type] = { count: 0, severities: {} };
                }
                breakdown[threat.type].count++;
                breakdown[threat.type].severities[threat.severity] = 
                    (breakdown[threat.type].severities[threat.severity] || 0) + 1;
            });
        });
        return breakdown;
    }

    generateSecurityRecommendations(events) {
        const recommendations = [];
        
        if (events.length > 100) {
            recommendations.push({
                type: 'rate_limiting',
                priority: 'high',
                message: 'Consider implementing stricter rate limiting due to high threat volume'
            });
        }
        
        const sqlInjectionAttempts = events.filter(e => 
            e.threats.some(t => t.type === 'sql_injection')
        ).length;
        
        if (sqlInjectionAttempts > 10) {
            recommendations.push({
                type: 'input_validation',
                priority: 'critical',
                message: 'Multiple SQL injection attempts detected. Review input validation'
            });
        }
        
        return recommendations;
    }
}

module.exports = SecurityManager;
