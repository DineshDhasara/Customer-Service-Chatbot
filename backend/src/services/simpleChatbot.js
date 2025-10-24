/**
 * Simple fallback chatbot without external APIs
 */

class SimpleChatbot {
    constructor() {
        this.responses = {
            'hello': 'Hello! I\'m your AI assistant. How can I help you today?',
            'help': 'I can help with order tracking, refunds, returns, and general customer service questions.',
            'order': 'I can help you check your order status. Please provide your order number (like ORD1001).',
            'refund': 'I can help you with refunds. Please provide your order number and reason for the refund.',
            'return': 'I can help you with returns. Please provide your order number and reason for the return.',
            'damaged': 'I\'m sorry to hear your item was damaged. I can help you get a replacement or refund.',
            'human': 'I\'ve created a support ticket for you. A human agent will contact you within 24 hours.',
            'bye': 'Thank you for using our service! Have a great day!',
            'default': 'I understand you need help. Could you please rephrase your question or let me know what specific issue you\'re facing?'
        };
    }

    async generateResponse(message) {
        const lowerMessage = message.toLowerCase();

        // Simple keyword matching
        if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
            return {
                text: this.responses.hello,
                intent: 'greeting',
                confidence: 0.9,
                suggestions: ['Check my order', 'Return item', 'Get help'],
                source: 'simple-chatbot',
                timestamp: new Date().toISOString()
            };
        }

        if (lowerMessage.includes('help')) {
            return {
                text: this.responses.help,
                intent: 'help_request',
                confidence: 0.9,
                suggestions: ['Order status', 'Refund request', 'Contact support'],
                source: 'simple-chatbot',
                timestamp: new Date().toISOString()
            };
        }

        if (lowerMessage.includes('order') || lowerMessage.includes('track')) {
            return {
                text: this.responses.order,
                intent: 'order_inquiry',
                confidence: 0.8,
                suggestions: ['ORD1001', 'ORD1002', 'ORD1003'],
                source: 'simple-chatbot',
                timestamp: new Date().toISOString()
            };
        }

        if (lowerMessage.includes('refund') || lowerMessage.includes('money back')) {
            return {
                text: this.responses.refund,
                intent: 'refund_request',
                confidence: 0.9,
                suggestions: ['Provide order number', 'Reason for refund'],
                source: 'simple-chatbot',
                timestamp: new Date().toISOString()
            };
        }

        if (lowerMessage.includes('return')) {
            return {
                text: this.responses.return,
                intent: 'return_request',
                confidence: 0.9,
                suggestions: ['Provide order number', 'Reason for return'],
                source: 'simple-chatbot',
                timestamp: new Date().toISOString()
            };
        }

        if (lowerMessage.includes('damaged') || lowerMessage.includes('broken')) {
            return {
                text: this.responses.damaged,
                intent: 'complaint',
                confidence: 0.8,
                suggestions: ['Request replacement', 'Get refund', 'Contact support'],
                source: 'simple-chatbot',
                timestamp: new Date().toISOString()
            };
        }

        if (lowerMessage.includes('human') || lowerMessage.includes('agent') || lowerMessage.includes('speak to')) {
            return {
                text: this.responses.human,
                intent: 'human_escalation',
                confidence: 0.9,
                suggestions: ['Wait for agent', 'Check status later'],
                source: 'simple-chatbot',
                timestamp: new Date().toISOString()
            };
        }

        if (lowerMessage.includes('bye') || lowerMessage.includes('goodbye') || lowerMessage.includes('thank')) {
            return {
                text: this.responses.bye,
                intent: 'farewell',
                confidence: 0.8,
                suggestions: [],
                source: 'simple-chatbot',
                timestamp: new Date().toISOString()
            };
        }

        // Check for order numbers
        const orderMatch = message.match(/ORD\d{4}/i);
        if (orderMatch) {
            const orderId = orderMatch[0].toUpperCase();
            const orderResponse = await this.handleOrderLookup(orderId);
            return {
                ...orderResponse,
                source: 'simple-chatbot',
                timestamp: new Date().toISOString()
            };
        }

        return {
            text: this.responses.default,
            intent: 'general_inquiry',
            confidence: 0.5,
            suggestions: ['Try rephrasing', 'Contact support', 'Check FAQ'],
            source: 'simple-chatbot',
            timestamp: new Date().toISOString()
        };
    }

    async handleOrderLookup(orderId) {
        // Simple order lookup
        const orders = {
            'ORD1001': {
                status: 'Out for delivery',
                items: ['Wireless Gaming Mouse', 'USB-C Cable'],
                deliveryDate: '2025-10-12',
                tracking: 'TRK123456789'
            },
            'ORD1002': {
                status: 'In transit',
                items: ['Bluetooth Headphones'],
                deliveryDate: '2025-10-15',
                tracking: 'TRK987654321'
            },
            'ORD1003': {
                status: 'Delivered',
                items: ['Laptop Sleeve'],
                deliveryDate: '2025-09-30',
                tracking: 'TRK456789123'
            }
        };

        const order = orders[orderId];
        if (order) {
            return {
                text: `📦 Found order ${orderId}!\nStatus: ${order.status}\nItems: ${order.items.join(', ')}\nExpected delivery: ${order.deliveryDate}\nTracking: ${order.tracking}`,
                intent: 'order_inquiry',
                confidence: 1.0,
                suggestions: ['Track package', 'Change delivery', 'Contact courier']
            };
        }

        return {
            text: `❌ Order ${orderId} not found. Please check the order number and try again.`,
            intent: 'order_inquiry',
            confidence: 0.8,
            suggestions: ['Check order number', 'Try different order', 'Contact support']
        };
    }
}

module.exports = SimpleChatbot;
