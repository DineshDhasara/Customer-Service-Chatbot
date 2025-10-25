/**
 * Real Gemini AI Integration for Customer Service
 * Provides intelligent responses with context awareness
 */


// Import fetch for Node.js compatibility
let fetch;
try {
    // Try to use global fetch if available (Node 18+)
    if (typeof globalThis.fetch !== 'undefined') {
        fetch = globalThis.fetch;
    } else {
        // Fallback to node-fetch for older Node versions
        fetch = require('node-fetch');
    }
} catch (error) {
    console.warn('Fetch not available, will use fallback responses');
}

class GeminiAI {
    constructor() {
        // Use the provided Gemini API key
        this.apiKey = process.env.GEMINI_API_KEY ;
        // Using the specified model from the request
        this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
        this.conversationHistory = new Map();
        
        // Enhanced customer service context and knowledge base
        this.knowledgeBase = {
            company: "TechStore Pro",
            policies: {
                returns: "30-day return policy for all items in original condition with receipt",
                shipping: "Free shipping on orders over $50. Standard delivery 3-5 business days, express 1-2 days",
                refunds: "Refunds processed within 5-7 business days to original payment method",
                warranty: "1-year manufacturer warranty on all electronics, extended warranty available",
                exchanges: "Exchanges allowed within 30 days for same or similar items",
                cancellations: "Orders can be cancelled within 1 hour of placement for full refund",
                privacy: "We protect your data with industry-standard encryption and never share with third parties"
            },
            faqs: {
                "how_to_return": "Go to your account > Orders > Select order > Request return. We'll send a prepaid label.",
                "shipping_cost": "Free shipping over $50. Under $50 is $5.99 standard, $9.99 express.",
                "payment_methods": "We accept Visa, MasterCard, American Express, PayPal, Apple Pay, and Google Pay.",
                "track_package": "Use your order number on our tracking page or check email for updates.",
                "change_address": "Contact us within 1 hour of order for address changes.",
                "bulk_orders": "For business orders over $500, contact our sales team for special pricing.",
                "international_shipping": "We ship to US, Canada, EU, UK, Australia. International rates apply."
            },
            products: {
                "electronics": "We carry laptops, phones, tablets, headphones, smart home devices from top brands.",
                "accessories": "Cases, chargers, cables, screen protectors, and other tech accessories.",
                "services": "Tech support, setup assistance, warranty extensions, and repair services."
            },
            commonIssues: {
                "login_problem": "Reset password or clear browser cache. Contact support if persistent.",
                "payment_failed": "Check card details, try different payment method, or contact your bank.",
                "item_damaged": "We'll arrange immediate replacement or full refund with photos of damage.",
                "wrong_item": "We'll send correct item and arrange return pickup at no cost.",
                "late_delivery": "We'll check with carrier and expedite or refund shipping if delay exceeds 2 days.",
                "account_locked": "Security measure after multiple failed attempts. Wait 24 hours or contact support.",
                "refund_delay": "Refunds take 5-7 business days to appear. Check with your bank if longer."
            }
        };

        this.systemPrompt = `You are an expert customer service AI assistant for ${this.knowledgeBase.company}, a leading technology retailer.

IMPORTANT GUIDELINES:
- Be exceptionally helpful, professional, empathetic, and engaging
- Provide specific, actionable solutions with step-by-step instructions
- Ask clarifying questions when needed to better assist
- Escalate to human agents for complex issues or when requested
- Always maintain a friendly but professional tone
- Use positive language and show enthusiasm for helping
- Personalize responses based on conversation history and context
- Anticipate follow-up questions and provide comprehensive information

COMPANY POLICIES:
- Returns: ${this.knowledgeBase.policies.returns}
- Shipping: ${this.knowledgeBase.policies.shipping}
- Refunds: ${this.knowledgeBase.policies.refunds}
- Warranty: ${this.knowledgeBase.policies.warranty}
- Exchanges: ${this.knowledgeBase.policies.exchanges}
- Cancellations: ${this.knowledgeBase.policies.cancellations}
- Privacy: ${this.knowledgeBase.policies.privacy}

FREQUENTLY ASKED QUESTIONS:
- How to return: ${this.knowledgeBase.faqs.how_to_return}
- Shipping costs: ${this.knowledgeBase.faqs.shipping_cost}
- Payment methods: ${this.knowledgeBase.faqs.payment_methods}
- Track package: ${this.knowledgeBase.faqs.track_package}
- Change address: ${this.knowledgeBase.faqs.change_address}
- Bulk orders: ${this.knowledgeBase.faqs.bulk_orders}
- International shipping: ${this.knowledgeBase.faqs.international_shipping}

PRODUCT INFORMATION:
- Electronics: ${this.knowledgeBase.products.electronics}
- Accessories: ${this.knowledgeBase.products.accessories}
- Services: ${this.knowledgeBase.products.services}

RESPONSE FORMAT:
- Keep responses detailed but concise (100-300 words when possible)
- Use bullet points for steps, lists, or multiple options
- Include relevant policy information and specific details
- Suggest next steps, related questions, or additional help
- End with an offer to assist further or connect to a specialist
- Use markdown formatting for better readability

If you cannot help with something, politely explain limitations and offer alternatives or human escalation. Always strive to exceed expectations in helpfulness.`;
    }

    async generateResponse(message, sessionId, context = {}) {
        try {
            // Get conversation history for context
            const history = this.getConversationHistory(sessionId);
            
            // Build the prompt with context
            const fullPrompt = this.buildPrompt(message, history, context);
            
            // Call Gemini API
            const response = await this.callGeminiAPI(fullPrompt);
            
            // Process and enhance the response
            const processedResponse = this.processResponse(response, message, context);
            
            // Update conversation history
            this.updateConversationHistory(sessionId, message, processedResponse.text);
            
            return processedResponse;
            
        } catch (error) {
            console.error('Gemini AI Error:', error);
            return this.getFallbackResponse(message, context);
        }
    }

    buildPrompt(message, history, context) {
        let prompt = this.systemPrompt + "\n\n";
        
        // Add conversation history for context
        if (history.length > 0) {
            prompt += "CONVERSATION HISTORY:\n";
            history.slice(-5).forEach(entry => {
                prompt += `User: ${entry.userMessage}\n`;
                prompt += `Assistant: ${entry.aiResponse}\n`;
            });
            prompt += "\n";
        }
        
        // Add current context
        if (context.orderId) {
            prompt += `ORDER CONTEXT: Customer is asking about order ${context.orderId}\n`;
        }
        
        if (context.userEmotion) {
            prompt += `USER EMOTION: Customer seems ${context.userEmotion.primary} (intensity: ${context.userEmotion.intensity})\n`;
        }
        
        // Add intent context if available
        if (context.intent) {
            prompt += `DETECTED INTENT: ${context.intent}\n`;
        }
        
        // Add current message
        prompt += `CURRENT USER MESSAGE: ${message}\n\n`;
        prompt += "Please provide a detailed, helpful response based on all available context:";
        
        return prompt;
    }

    async callGeminiAPI(prompt) {
        // Check if fetch is available
        if (!fetch) {
            throw new Error('Fetch is not available');
        }
        
        const requestBody = {
            contents: [{
                parts: [{
                    text: prompt
                }]
            }],
            generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 1024,
            },
            safetySettings: [
                {
                    category: "HARM_CATEGORY_HARASSMENT",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    category: "HARM_CATEGORY_HATE_SPEECH",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE"
                }
            ]
        };

        const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
            throw new Error('Invalid response from Gemini API');
        }

        return data.candidates[0].content.parts[0].text;
    }

    processResponse(aiResponse, userMessage, context) {
        // Detect intent from user message
        const intent = this.detectIntent(userMessage);
        
        // Calculate confidence based on response quality
        const confidence = this.calculateConfidence(aiResponse, intent);
        
        // Detect user emotion
        const emotion = this.detectEmotion(userMessage);
        
        // Generate suggestions
        const suggestions = this.generateSuggestions(intent, context);
        
        return {
            text: aiResponse,
            intent: intent,
            confidence: confidence,
            emotion: emotion,
            suggestions: suggestions,
            source: 'gemini-ai',
            timestamp: new Date().toISOString()
        };
    }

    detectIntent(message) {
        const lowerMessage = message.toLowerCase();
        
        // Order-related intents
        if (lowerMessage.includes('order') || lowerMessage.includes('track') || lowerMessage.includes('delivery') || lowerMessage.includes('status')) {
            return 'order_inquiry';
        }
        
        // Refund/return intents
        if (lowerMessage.includes('refund') || lowerMessage.includes('return') || lowerMessage.includes('money back') || lowerMessage.includes('exchange')) {
            return 'refund_request';
        }
        
        // Problem/complaint intents
        if (lowerMessage.includes('problem') || lowerMessage.includes('issue') || lowerMessage.includes('broken') || lowerMessage.includes('damaged') || lowerMessage.includes('wrong') || lowerMessage.includes('late')) {
            return 'complaint';
        }
        
        // Greeting intents
        if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey') || lowerMessage.includes('good morning') || lowerMessage.includes('good afternoon')) {
            return 'greeting';
        }
        
        // Human escalation
        if (lowerMessage.includes('human') || lowerMessage.includes('agent') || lowerMessage.includes('speak to someone') || lowerMessage.includes('manager') || lowerMessage.includes('supervisor')) {
            return 'human_escalation';
        }
        
        // Shipping inquiries
        if (lowerMessage.includes('shipping') || lowerMessage.includes('delivery time') || lowerMessage.includes('when will') || lowerMessage.includes('arrive')) {
            return 'shipping_inquiry';
        }
        
        // Product inquiries
        if (lowerMessage.includes('product') || lowerMessage.includes('item') || lowerMessage.includes('available') || lowerMessage.includes('price') || lowerMessage.includes('specifications')) {
            return 'product_inquiry';
        }
        
        // Account/billing
        if (lowerMessage.includes('account') || lowerMessage.includes('login') || lowerMessage.includes('password') || lowerMessage.includes('payment') || lowerMessage.includes('bill')) {
            return 'account_billing';
        }
        
        // Technical support
        if (lowerMessage.includes('technical') || lowerMessage.includes('support') || lowerMessage.includes('help') || lowerMessage.includes('setup') || lowerMessage.includes('install')) {
            return 'technical_support';
        }
        
        return 'general_inquiry';
    }

    detectEmotion(message) {
        const lowerMessage = message.toLowerCase();
        
        // Negative emotions
        if (lowerMessage.includes('angry') || lowerMessage.includes('frustrated') || lowerMessage.includes('terrible') || lowerMessage.includes('awful') || lowerMessage.includes('horrible')) {
            return { primary: 'angry', intensity: 0.8 };
        }
        
        if (lowerMessage.includes('disappointed') || lowerMessage.includes('unhappy') || lowerMessage.includes('sad') || lowerMessage.includes('upset')) {
            return { primary: 'disappointed', intensity: 0.6 };
        }
        
        // Positive emotions
        if (lowerMessage.includes('happy') || lowerMessage.includes('great') || lowerMessage.includes('excellent') || lowerMessage.includes('amazing') || lowerMessage.includes('love')) {
            return { primary: 'happy', intensity: 0.7 };
        }
        
        // Confused/uncertain
        if (lowerMessage.includes('confused') || lowerMessage.includes('don\'t understand') || lowerMessage.includes('help') || lowerMessage.includes('clarify')) {
            return { primary: 'confused', intensity: 0.5 };
        }
        
        return { primary: 'neutral', intensity: 0.3 };
    }

    calculateConfidence(response, intent) {
        // Simple confidence calculation based on response characteristics
        let confidence = 0.7; // Base confidence
        
        // Higher confidence for specific intents with detailed responses
        if (intent !== 'general_inquiry' && response.length > 50) {
            confidence += 0.2;
        }
        
        // Lower confidence for very short responses
        if (response.length < 20) {
            confidence -= 0.3;
        }
        
        // Check for policy mentions (indicates knowledge-based response)
        if (response.includes('policy') || response.includes('day') || response.includes('refund') || response.includes('warranty')) {
            confidence += 0.1;
        }
        
        return Math.min(Math.max(confidence, 0.1), 1.0);
    }

    generateSuggestions(intent, context) {
        const suggestions = [];
        
        switch (intent) {
            case 'order_inquiry':
                suggestions.push('Track my package', 'Change delivery address', 'Cancel order', 'View order details');
                break;
            case 'refund_request':
                suggestions.push('Start refund process', 'Check refund status', 'Return policy', 'Exchange item');
                break;
            case 'complaint':
                suggestions.push('Report issue', 'Request replacement', 'Speak to manager', 'File complaint');
                break;
            case 'shipping_inquiry':
                suggestions.push('Expedite shipping', 'Delivery options', 'Shipping policy', 'Track package');
                break;
            case 'product_inquiry':
                suggestions.push('Product specifications', 'Availability', 'Price check', 'Similar products');
                break;
            case 'account_billing':
                suggestions.push('Reset password', 'Update payment method', 'View billing history', 'Account settings');
                break;
            case 'technical_support':
                suggestions.push('Setup assistance', 'Troubleshooting guide', 'Contact tech support', 'Warranty claim');
                break;
            case 'human_escalation':
                suggestions.push('Create support ticket', 'Schedule callback', 'Live chat', 'Speak to specialist');
                break;
            default:
                suggestions.push('Order status', 'Return item', 'Product information', 'Contact support');
        }
        
        return suggestions;
    }

    getFallbackResponse(message, context) {
        const fallbackResponses = [
            "I apologize, but I'm having trouble processing your request right now. Let me connect you with a human agent who can better assist you with personalized support.",
            "I'm experiencing some technical difficulties. In the meantime, you can check our comprehensive FAQ section or I can create a support ticket for you to get detailed assistance.",
            "I want to make sure I give you accurate and complete information. Would you like me to connect you with a specialist who can help with your specific question or situation?"
        ];
        
        const randomResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
        
        return {
            text: randomResponse,
            intent: 'fallback',
            confidence: 0.3,
            emotion: { primary: 'neutral', intensity: 0.3 },
            suggestions: ['Speak to human agent', 'Try again', 'Check FAQ'],
            source: 'fallback',
            timestamp: new Date().toISOString()
        };
    }

    getConversationHistory(sessionId) {
        return this.conversationHistory.get(sessionId) || [];
    }

    updateConversationHistory(sessionId, userMessage, aiResponse) {
        if (!this.conversationHistory.has(sessionId)) {
            this.conversationHistory.set(sessionId, []);
        }
        
        const history = this.conversationHistory.get(sessionId);
        history.push({
            userMessage,
            aiResponse,
            timestamp: new Date().toISOString()
        });
        
        // Keep only last 10 exchanges to manage memory
        if (history.length > 10) {
            history.shift();
        }
    }

    // Enhanced order lookup with better data
    async lookupOrder(orderId) {
        try {
            // Load enhanced orders from JSON file
            const fs = require('fs');
            const path = require('path');
            const ordersPath = path.join(__dirname, '../data/enhancedOrders.json');
            const ordersData = JSON.parse(fs.readFileSync(ordersPath, 'utf8'));
            
            // Find order by ID
            const order = ordersData.find(o => o.id.toUpperCase() === orderId.toUpperCase());
            return order || null;
            
        } catch (error) {
            console.error('Error loading order data:', error);
            // Fallback to basic orders
            const basicOrders = {
                'ORD1001': {
                    id: 'ORD1001',
                    status: 'Out for delivery',
                    items: [{ name: 'Wireless Gaming Mouse', price: 79.99, quantity: 1 }],
                    total: 79.99,
                    deliveryDate: '2025-10-12'
                }
            };
            return basicOrders[orderId.toUpperCase()] || null;
        }
    }

    // Test the Gemini API connection
    async testConnection() {
        try {
            const testResponse = await this.generateResponse("Hello, test connection", "test-session");
            console.log('✅ Gemini AI connection successful');
            return { success: true, response: testResponse };
        } catch (error) {
            console.error('❌ Gemini AI connection failed:', error);
            return { success: false, error: error.message };
        }
    }
}

module.exports = GeminiAI;
