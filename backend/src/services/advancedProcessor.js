/**
 * advancedProcessor.js
 * 
 * Enhanced AI processing with context awareness, sentiment analysis,
 * and advanced NLU capabilities for portfolio demonstration.
 */

const intents = require('../data/intents.json');
const templates = require('../data/responseTemplates.json');
const demoOrders = require('../data/demoOrders.json');

class AdvancedProcessor {
    constructor() {
        this.conversationHistory = new Map(); // sessionId -> messages[]
        this.userProfiles = new Map(); // sessionId -> profile
        this.analytics = {
            totalMessages: 0,
            intentCounts: {},
            avgConfidence: 0,
            sessionCount: 0
        };
    }

    // Enhanced text normalization with better preprocessing
    normalize(text) {
        return text
            .toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    // Advanced token overlap with weighted scoring
    tokenOverlap(a, b, weights = {}) {
        const toksA = new Set(this.normalize(a).split(' ').filter(Boolean));
        const toksB = new Set(this.normalize(b).split(' ').filter(Boolean));
        
        if (toksA.size === 0 || toksB.size === 0) return 0;
        
        let weightedScore = 0;
        let totalWeight = 0;
        
        toksA.forEach(token => {
            if (toksB.has(token)) {
                const weight = weights[token] || 1;
                weightedScore += weight;
                totalWeight += weight;
            }
        });
        
        return totalWeight > 0 ? weightedScore / Math.max(toksA.size, toksB.size) : 0;
    }

    // Sentiment analysis (simple but effective)
    analyzeSentiment(text) {
        const positiveWords = ['good', 'great', 'excellent', 'happy', 'satisfied', 'love', 'amazing', 'perfect', 'thank'];
        const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'angry', 'frustrated', 'disappointed', 'broken', 'damaged', 'problem'];
        
        const words = this.normalize(text).split(' ');
        let score = 0;
        
        words.forEach(word => {
            if (positiveWords.includes(word)) score += 1;
            if (negativeWords.includes(word)) score -= 1;
        });
        
        return {
            score,
            label: score > 0 ? 'positive' : score < 0 ? 'negative' : 'neutral',
            confidence: Math.min(Math.abs(score) / words.length * 5, 1)
        };
    }

    // Context-aware intent detection
    detectIntentWithContext(message, sessionId) {
        const history = this.conversationHistory.get(sessionId) || [];
        const recentMessages = history.slice(-3); // Last 3 messages for context
        
        // Enhanced keyword weights based on context
        const contextWeights = {};
        recentMessages.forEach(msg => {
            if (msg.intent === 'order_status') {
                contextWeights['order'] = 2;
                contextWeights['status'] = 2;
                contextWeights['track'] = 2;
            }
            if (msg.intent === 'refund') {
                contextWeights['refund'] = 2;
                contextWeights['return'] = 2;
                contextWeights['money'] = 2;
            }
        });

        const text = this.normalize(message);
        let best = { intent: 'fallback', score: 0, confidence: 0 };

        // Multi-layer intent detection
        for (const intentDef of intents) {
            let score = 0;
            
            // 1. Keyword matching with context weights
            const keywordScore = intentDef.keywords.reduce((acc, kw) => {
                if (text.includes(kw)) {
                    const weight = contextWeights[kw] || 1;
                    return acc + weight;
                }
                return acc;
            }, 0);
            
            // 2. Utterance similarity with weighted tokens
            const utteranceScores = intentDef.utterances.map(utterance => 
                this.tokenOverlap(text, utterance, contextWeights)
            );
            const maxUtteranceScore = utteranceScores.length ? Math.max(...utteranceScores) : 0;
            
            // 3. Semantic similarity (simplified)
            const semanticScore = this.calculateSemanticSimilarity(text, intentDef);
            
            // Combined scoring
            score = keywordScore * 0.4 + maxUtteranceScore * 0.4 + semanticScore * 0.2;
            
            if (score > best.score) {
                best = { 
                    intent: intentDef.name, 
                    score,
                    confidence: Math.min(score / 3 + 0.2, 1)
                };
            }
        }

        return best;
    }

    // Simplified semantic similarity
    calculateSemanticSimilarity(text, intentDef) {
        const intentWords = intentDef.utterances.join(' ').split(' ');
        const textWords = text.split(' ');
        
        // Simple word embedding simulation using character similarity
        let similarity = 0;
        textWords.forEach(textWord => {
            intentWords.forEach(intentWord => {
                if (textWord.length > 2 && intentWord.length > 2) {
                    const charSimilarity = this.calculateCharSimilarity(textWord, intentWord);
                    similarity += charSimilarity;
                }
            });
        });
        
        return similarity / (textWords.length * intentWords.length || 1);
    }

    calculateCharSimilarity(str1, str2) {
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;
        
        if (longer.length === 0) return 1;
        
        const distance = this.levenshteinDistance(longer, shorter);
        return (longer.length - distance) / longer.length;
    }

    levenshteinDistance(str1, str2) {
        const matrix = [];
        
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        
        return matrix[str2.length][str1.length];
    }

    // Enhanced order ID extraction with multiple patterns
    findOrderId(text) {
        const patterns = [
            /ORD[0-9]{3,6}/i,
            /ORDER[0-9]{3,6}/i,
            /\b[0-9]{5,8}\b/,
            /#[0-9]{4,6}/
        ];
        
        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match) return match[0].toUpperCase();
        }
        return null;
    }

    // Advanced template filling with dynamic content
    fillTemplate(template, slots = {}, context = {}) {
        let result = template;
        
        // Standard slot filling
        Object.keys(slots).forEach(key => {
            const regex = new RegExp(`\\{${key}\\}`, 'g');
            result = result.replace(regex, slots[key]);
        });
        
        // Dynamic content based on context
        if (context.sentiment && context.sentiment.label === 'negative') {
            result = "I understand you're frustrated. " + result;
        }
        
        if (context.isReturningUser) {
            result = "Welcome back! " + result;
        }
        
        return result;
    }

    // Update conversation history and user profile
    updateContext(sessionId, message, intent, confidence) {
        // Update conversation history
        if (!this.conversationHistory.has(sessionId)) {
            this.conversationHistory.set(sessionId, []);
            this.analytics.sessionCount++;
        }
        
        const history = this.conversationHistory.get(sessionId);
        history.push({
            message,
            intent,
            confidence,
            timestamp: Date.now()
        });
        
        // Keep only last 10 messages per session
        if (history.length > 10) {
            history.shift();
        }
        
        // Update user profile
        if (!this.userProfiles.has(sessionId)) {
            this.userProfiles.set(sessionId, {
                messageCount: 0,
                topIntents: {},
                avgConfidence: 0,
                firstSeen: Date.now(),
                lastSeen: Date.now()
            });
        }
        
        const profile = this.userProfiles.get(sessionId);
        profile.messageCount++;
        profile.topIntents[intent] = (profile.topIntents[intent] || 0) + 1;
        profile.avgConfidence = (profile.avgConfidence + confidence) / 2;
        profile.lastSeen = Date.now();
        
        // Update global analytics
        this.analytics.totalMessages++;
        this.analytics.intentCounts[intent] = (this.analytics.intentCounts[intent] || 0) + 1;
        this.analytics.avgConfidence = (this.analytics.avgConfidence + confidence) / 2;
    }

    // Main processing function with advanced features
    async process({ sessionId, message }) {
        const startTime = Date.now();
        
        // Analyze sentiment
        const sentiment = this.analyzeSentiment(message);
        
        // Detect intent with context
        const intentResult = this.detectIntentWithContext(message, sessionId);
        
        // Extract entities
        const orderId = this.findOrderId(message);
        
        // Get user profile for personalization
        const userProfile = this.userProfiles.get(sessionId);
        const isReturningUser = userProfile && userProfile.messageCount > 1;
        
        // Build context object
        const context = {
            sentiment,
            isReturningUser,
            userProfile,
            processingTime: Date.now() - startTime
        };
        
        // Generate response based on intent
        let reply = templates.fallback || "I'm not sure how to help with that.";
        let metadata = { 
            sessionId,
            sentiment,
            processingTime: context.processingTime,
            isReturningUser
        };
        
        // Enhanced response generation
        switch (intentResult.intent) {
            case 'greeting':
                reply = isReturningUser 
                    ? "Welcome back! How can I help you today?"
                    : templates.greeting;
                break;
                
            case 'order_status':
                if (orderId) {
                    const order = demoOrders.find(o => o.id === orderId);
                    if (order) {
                        reply = this.fillTemplate(templates.order_status, {
                            orderId: order.id,
                            status: order.status,
                            deliveryDate: order.deliveryDate
                        }, context);
                        metadata.order = order;
                        intentResult.confidence = Math.max(intentResult.confidence, 0.9);
                    } else {
                        reply = `I couldn't find order ${orderId}. Please verify the order ID or try asking without it.`;
                        intentResult.confidence = 0.6;
                    }
                } else {
                    reply = "I'd be happy to check your order status! Please provide your order ID (e.g., ORD1001).";
                    intentResult.confidence = 0.7;
                }
                break;
                
            case 'refund':
                reply = this.fillTemplate(templates.refund, { 
                    orderId: orderId || 'your order' 
                }, context);
                break;
                
            case 'complaint':
                reply = sentiment.label === 'negative' 
                    ? "I sincerely apologize for the trouble you're experiencing. " + templates.complaint
                    : templates.complaint;
                break;
                
            case 'human_escalation':
                const ticketId = `TCK-${Math.random().toString(36).substring(2,8).toUpperCase()}`;
                reply = this.fillTemplate(templates.human_escalation, { ticketId }, context);
                metadata.ticketId = ticketId;
                metadata.escalationReason = sentiment.label === 'negative' ? 'customer_frustration' : 'general_request';
                intentResult.confidence = 0.95;
                break;
                
            default:
                reply = sentiment.label === 'negative'
                    ? "I understand you're having an issue. Let me connect you with a human agent who can better assist you."
                    : templates.fallback;
                intentResult.confidence = Math.min(intentResult.confidence, 0.4);
        }
        
        // Update context and analytics
        this.updateContext(sessionId, message, intentResult.intent, intentResult.confidence);
        
        // Enhanced logging
        console.log(`[AdvancedProcessor] Session: ${sessionId}`);
        console.log(`  Message: "${message}"`);
        console.log(`  Intent: ${intentResult.intent} (${(intentResult.confidence * 100).toFixed(1)}%)`);
        console.log(`  Sentiment: ${sentiment.label} (${(sentiment.confidence * 100).toFixed(1)}%)`);
        console.log(`  Processing time: ${context.processingTime}ms`);
        
        return {
            reply,
            intent: intentResult.intent,
            confidence: intentResult.confidence,
            metadata: {
                ...metadata,
                sentiment: sentiment.label,
                sentimentScore: sentiment.score,
                contextUsed: isReturningUser
            }
        };
    }
    
    // Get analytics data
    getAnalytics() {
        return {
            ...this.analytics,
            activeSessions: this.conversationHistory.size,
            topIntents: Object.entries(this.analytics.intentCounts)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
        };
    }
    
    // Get user profile
    getUserProfile(sessionId) {
        return this.userProfiles.get(sessionId) || null;
    }
}

// Export singleton instance
const advancedProcessor = new AdvancedProcessor();
module.exports = advancedProcessor;
