/**
 * Ultra-Advanced AI Processor with Multi-Modal Intelligence
 * Features: Sentiment Analysis, Context Awareness, Personality Adaptation, Learning
 */

class UltraAIProcessor {
    constructor() {
        this.conversationHistory = new Map();
        this.userProfiles = new Map();
        this.emotionalStates = new Map();
        this.learningData = new Map();
        this.contextWindow = 10; // Remember last 10 interactions
        
        // Advanced intent patterns with confidence weighting
        this.intentPatterns = {
            greeting: {
                keywords: ['hello', 'hi', 'hey', 'good morning', 'good evening', 'greetings'],
                patterns: [/^(hi|hello|hey)\b/i, /good\s+(morning|afternoon|evening)/i],
                weight: 0.9,
                responses: [
                    "Hello! 👋 I'm your AI assistant. How can I help you today?",
                    "Hi there! 🌟 Ready to assist you with any questions!",
                    "Greetings! 🤖 What can I do for you today?"
                ]
            },
            order_status: {
                keywords: ['order', 'track', 'status', 'delivery', 'shipped', 'where'],
                patterns: [/order\s*(#?\w+)/i, /track.*order/i, /where.*order/i],
                weight: 0.95,
                requiresData: true
            },
            complaint: {
                keywords: ['problem', 'issue', 'broken', 'damaged', 'defective', 'complaint', 'wrong'],
                patterns: [/not\s+working/i, /broken|damaged|defective/i],
                weight: 0.85,
                sentiment: 'negative',
                escalation: true
            },
            refund: {
                keywords: ['refund', 'return', 'money back', 'cancel', 'reimburse'],
                patterns: [/want.*refund/i, /return.*item/i, /money\s+back/i],
                weight: 0.9,
                requiresAuth: true
            },
            technical_support: {
                keywords: ['help', 'support', 'how to', 'tutorial', 'guide', 'instructions'],
                patterns: [/how\s+do\s+i/i, /need\s+help/i, /can\s+you\s+help/i],
                weight: 0.8
            },
            human_escalation: {
                keywords: ['human', 'agent', 'representative', 'person', 'speak to someone'],
                patterns: [/speak.*human/i, /talk.*person/i, /human\s+agent/i],
                weight: 0.95,
                priority: 'high'
            }
        };

        // Emotional intelligence patterns
        this.emotionPatterns = {
            angry: ['angry', 'furious', 'mad', 'frustrated', 'annoyed', 'upset'],
            sad: ['sad', 'disappointed', 'unhappy', 'depressed', 'down'],
            happy: ['happy', 'great', 'awesome', 'excellent', 'wonderful', 'amazing'],
            confused: ['confused', 'lost', 'unclear', 'don\'t understand', 'help'],
            urgent: ['urgent', 'asap', 'immediately', 'emergency', 'critical', 'now']
        };

        // Response personality modes
        this.personalityModes = {
            professional: { formality: 0.9, empathy: 0.7, efficiency: 0.9 },
            friendly: { formality: 0.3, empathy: 0.9, efficiency: 0.7 },
            technical: { formality: 0.7, empathy: 0.5, efficiency: 0.95 },
            supportive: { formality: 0.5, empathy: 0.95, efficiency: 0.6 }
        };

        this.initializeAI();
    }

    async initializeAI() {
        console.log('🧠 Ultra AI Processor initialized with advanced capabilities');
        this.loadLearningData();
    }

    async processMessage({ sessionId, message, metadata = {} }) {
        const startTime = Date.now();
        
        try {
            // Update conversation history
            this.updateConversationHistory(sessionId, message);
            
            // Analyze user emotion and context
            const emotionalState = this.analyzeEmotion(message);
            const context = this.getConversationContext(sessionId);
            
            // Advanced intent detection with context
            const intentAnalysis = await this.detectIntentWithContext(message, context, emotionalState);
            
            // Generate contextual response
            const response = await this.generateContextualResponse(
                intentAnalysis, 
                emotionalState, 
                context, 
                sessionId
            );
            
            // Update user profile and learning data
            this.updateUserProfile(sessionId, { message, intent: intentAnalysis, emotion: emotionalState });
            
            const processingTime = Date.now() - startTime;
            
            return {
                success: true,
                reply: response.text,
                intent: intentAnalysis.intent,
                confidence: intentAnalysis.confidence,
                emotion: emotionalState,
                context: context.summary,
                personality: response.personality,
                suggestions: response.suggestions,
                metadata: {
                    processingTime,
                    sessionId,
                    contextUsed: context.items.length > 0,
                    learningApplied: response.learningApplied,
                    ...response.metadata
                }
            };
            
        } catch (error) {
            console.error('❌ AI Processing Error:', error);
            return {
                success: false,
                reply: "I apologize, but I'm experiencing some technical difficulties. Let me connect you with a human agent.",
                intent: 'error',
                confidence: 0,
                error: error.message,
                metadata: { processingTime: Date.now() - startTime }
            };
        }
    }

    analyzeEmotion(text) {
        const words = text.toLowerCase().split(/\s+/);
        const emotions = {};
        let totalScore = 0;

        // Analyze emotional content
        for (const [emotion, keywords] of Object.entries(this.emotionPatterns)) {
            let score = 0;
            keywords.forEach(keyword => {
                if (words.some(word => word.includes(keyword))) {
                    score += 1;
                }
            });
            emotions[emotion] = score;
            totalScore += score;
        }

        // Normalize scores
        const normalizedEmotions = {};
        for (const [emotion, score] of Object.entries(emotions)) {
            normalizedEmotions[emotion] = totalScore > 0 ? score / totalScore : 0;
        }

        // Determine primary emotion
        const primaryEmotion = Object.entries(normalizedEmotions)
            .reduce((a, b) => normalizedEmotions[a[0]] > normalizedEmotions[b[0]] ? a : b)[0];

        return {
            primary: primaryEmotion,
            scores: normalizedEmotions,
            intensity: Math.max(...Object.values(normalizedEmotions)),
            sentiment: this.calculateSentiment(text)
        };
    }

    calculateSentiment(text) {
        const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'perfect', 'love', 'like', 'happy'];
        const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'dislike', 'angry', 'frustrated', 'broken', 'wrong'];
        
        const words = text.toLowerCase().split(/\s+/);
        let score = 0;
        
        words.forEach(word => {
            if (positiveWords.includes(word)) score += 1;
            if (negativeWords.includes(word)) score -= 1;
        });
        
        return {
            score: score / words.length,
            label: score > 0 ? 'positive' : score < 0 ? 'negative' : 'neutral',
            confidence: Math.min(Math.abs(score) / words.length * 5, 1)
        };
    }

    async detectIntentWithContext(message, context, emotion) {
        const text = message.toLowerCase();
        let bestMatch = { intent: 'fallback', confidence: 0, metadata: {} };

        for (const [intentName, config] of Object.entries(this.intentPatterns)) {
            let score = 0;
            
            // Keyword matching with emotional weighting
            const keywordMatches = config.keywords.filter(keyword => 
                text.includes(keyword.toLowerCase())
            ).length;
            score += (keywordMatches / config.keywords.length) * 0.4;

            // Pattern matching
            const patternMatches = config.patterns?.filter(pattern => 
                pattern.test(message)
            ).length || 0;
            score += (patternMatches / (config.patterns?.length || 1)) * 0.4;

            // Context weighting
            if (context.items.length > 0) {
                const contextRelevance = this.calculateContextRelevance(intentName, context);
                score += contextRelevance * 0.2;
            }

            // Emotional state influence
            if (config.sentiment && emotion.primary === config.sentiment) {
                score += 0.1;
            }

            // Apply intent weight
            score *= config.weight;

            if (score > bestMatch.confidence) {
                bestMatch = {
                    intent: intentName,
                    confidence: Math.min(score, 1),
                    metadata: {
                        keywordMatches,
                        patternMatches,
                        contextInfluence: context.items.length > 0,
                        emotionalInfluence: config.sentiment === emotion.primary
                    }
                };
            }
        }

        return bestMatch;
    }

    calculateContextRelevance(intent, context) {
        // Simple context relevance calculation
        const recentIntents = context.items.map(item => item.intent);
        const intentFrequency = recentIntents.filter(i => i === intent).length;
        return Math.min(intentFrequency / context.items.length, 0.5);
    }

    async generateContextualResponse(intentAnalysis, emotion, context, sessionId) {
        const { intent, confidence } = intentAnalysis;
        const userProfile = this.getUserProfile(sessionId);
        
        // Determine personality mode based on emotion and context
        let personalityMode = 'professional';
        if (emotion.primary === 'angry' || emotion.primary === 'frustrated') {
            personalityMode = 'supportive';
        } else if (emotion.primary === 'confused') {
            personalityMode = 'technical';
        } else if (emotion.intensity < 0.3) {
            personalityMode = 'friendly';
        }

        const personality = this.personalityModes[personalityMode];
        
        let response = {
            text: '',
            personality: personalityMode,
            suggestions: [],
            learningApplied: false,
            metadata: {}
        };

        // Generate response based on intent
        switch (intent) {
            case 'greeting':
                response.text = this.generateGreeting(userProfile, emotion);
                response.suggestions = ['Check order status', 'Get help', 'Contact support'];
                break;
                
            case 'order_status':
                response = await this.handleOrderStatus(intentAnalysis, context, personality);
                break;
                
            case 'complaint':
                response = await this.handleComplaint(emotion, personality);
                break;
                
            case 'refund':
                response = await this.handleRefund(context, personality);
                break;
                
            case 'technical_support':
                response = await this.handleTechnicalSupport(intentAnalysis, personality);
                break;
                
            case 'human_escalation':
                response = await this.handleHumanEscalation(emotion, personality);
                break;
                
            default:
                response.text = this.generateFallbackResponse(emotion, personality);
                response.suggestions = ['Try rephrasing', 'Contact support', 'View help docs'];
        }

        return response;
    }

    generateGreeting(userProfile, emotion) {
        const greetings = this.intentPatterns.greeting.responses;
        let greeting = greetings[Math.floor(Math.random() * greetings.length)];
        
        if (userProfile.visitCount > 1) {
            greeting = `Welcome back! 🎉 ${greeting}`;
        }
        
        if (emotion.primary === 'happy') {
            greeting += " You seem to be in a great mood! 😊";
        }
        
        return greeting;
    }

    async handleOrderStatus(intentAnalysis, context, personality) {
        // Extract order ID from message
        const orderIdMatch = context.currentMessage?.match(/order\s*(#?\w+)/i);
        const orderId = orderIdMatch ? orderIdMatch[1] : null;
        
        if (orderId) {
            // Simulate order lookup
            const orderInfo = this.getOrderInfo(orderId);
            if (orderInfo) {
                return {
                    text: `📦 I found your order ${orderId}! Status: **${orderInfo.status}**. ${orderInfo.details}`,
                    suggestions: ['Track package', 'Update delivery', 'Contact courier'],
                    metadata: { orderId, orderFound: true }
                };
            } else {
                return {
                    text: `❌ I couldn't find order ${orderId}. Please check the order number or contact support.`,
                    suggestions: ['Check order number', 'Contact support', 'View order history']
                };
            }
        } else {
            return {
                text: "📋 I'd be happy to check your order status! Please provide your order number (e.g., ORD1001).",
                suggestions: ['Enter order number', 'Login to account', 'Email order details']
            };
        }
    }

    async handleComplaint(emotion, personality) {
        let empathyLevel = personality.empathy;
        if (emotion.primary === 'angry') empathyLevel += 0.2;
        
        const responses = [
            "I sincerely apologize for the inconvenience you've experienced. 😔",
            "I understand your frustration, and I'm here to help resolve this issue.",
            "Thank you for bringing this to our attention. Let's get this sorted out right away."
        ];
        
        const baseResponse = responses[Math.floor(Math.random() * responses.length)];
        
        return {
            text: `${baseResponse} Can you please provide more details about the specific issue you're facing?`,
            suggestions: ['Describe the problem', 'Upload photos', 'Request refund', 'Speak to manager'],
            metadata: { escalationRecommended: emotion.intensity > 0.7 }
        };
    }

    async handleRefund(context, personality) {
        return {
            text: "💰 I can help you with the refund process. To get started, I'll need some information about your purchase.",
            suggestions: ['Provide order number', 'Reason for refund', 'Upload receipt', 'Check refund policy'],
            metadata: { requiresVerification: true }
        };
    }

    async handleTechnicalSupport(intentAnalysis, personality) {
        return {
            text: "🔧 I'm here to provide technical assistance! What specific issue are you experiencing?",
            suggestions: ['Describe the problem', 'View troubleshooting guide', 'Schedule callback', 'Live chat support'],
            metadata: { supportType: 'technical' }
        };
    }

    async handleHumanEscalation(emotion, personality) {
        const ticketId = `TCK-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        
        return {
            text: `🎧 I've created support ticket ${ticketId} and you'll be connected with a human agent shortly. Average wait time is 2-3 minutes.`,
            suggestions: ['Wait for agent', 'Leave callback number', 'Send email instead'],
            metadata: { ticketId, escalated: true, priority: emotion.intensity > 0.7 ? 'high' : 'normal' }
        };
    }

    generateFallbackResponse(emotion, personality) {
        const responses = [
            "I'm not quite sure I understand. Could you please rephrase that?",
            "I'd love to help, but I need a bit more clarity on what you're looking for.",
            "Let me make sure I understand correctly - could you provide more details?"
        ];
        
        return responses[Math.floor(Math.random() * responses.length)];
    }

    // Helper methods
    updateConversationHistory(sessionId, message) {
        if (!this.conversationHistory.has(sessionId)) {
            this.conversationHistory.set(sessionId, []);
        }
        
        const history = this.conversationHistory.get(sessionId);
        history.push({
            message,
            timestamp: new Date().toISOString(),
            type: 'user'
        });
        
        // Keep only recent history
        if (history.length > this.contextWindow) {
            history.shift();
        }
    }

    getConversationContext(sessionId) {
        const history = this.conversationHistory.get(sessionId) || [];
        return {
            items: history,
            summary: `${history.length} previous interactions`,
            currentMessage: history[history.length - 1]?.message
        };
    }

    updateUserProfile(sessionId, data) {
        if (!this.userProfiles.has(sessionId)) {
            this.userProfiles.set(sessionId, {
                sessionId,
                visitCount: 1,
                preferences: {},
                history: []
            });
        }
        
        const profile = this.userProfiles.get(sessionId);
        profile.visitCount++;
        profile.history.push({
            ...data,
            timestamp: new Date().toISOString()
        });
    }

    getUserProfile(sessionId) {
        return this.userProfiles.get(sessionId) || {
            sessionId,
            visitCount: 1,
            preferences: {},
            history: []
        };
    }

    getOrderInfo(orderId) {
        // Mock order data - in real implementation, this would query a database
        const mockOrders = {
            'ORD1001': { status: 'Shipped', details: 'Expected delivery: Tomorrow by 6 PM' },
            'ORD1002': { status: 'Processing', details: 'Your order is being prepared for shipment' },
            'ORD1003': { status: 'Delivered', details: 'Delivered yesterday at 3:45 PM' }
        };
        
        return mockOrders[orderId.toUpperCase()];
    }

    loadLearningData() {
        // Initialize learning data storage
        console.log('📚 Learning data initialized');
    }
}

module.exports = UltraAIProcessor;
