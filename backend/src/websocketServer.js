const WebSocket = require('ws');
const advancedProcessor = require('./services/advancedProcessor');

class WebSocketServer {
    constructor(server) {
        this.wss = new WebSocket.Server({ server });
        this.clients = new Map(); // sessionId -> ws connection
        this.setupWebSocket();
    }

    setupWebSocket() {
        this.wss.on('connection', (ws, req) => {
            console.log('New WebSocket connection established');
            
            ws.on('message', async (message) => {
                try {
                    const data = JSON.parse(message);
                    await this.handleMessage(ws, data);
                } catch (error) {
                    console.error('WebSocket message error:', error);
                    ws.send(JSON.stringify({
                        type: 'error',
                        message: 'Invalid message format'
                    }));
                }
            });

            ws.on('close', () => {
                // Remove client from active sessions
                for (const [sessionId, client] of this.clients.entries()) {
                    if (client === ws) {
                        this.clients.delete(sessionId);
                        console.log(`Session ${sessionId} disconnected`);
                        break;
                    }
                }
            });

            ws.on('error', (error) => {
                console.error('WebSocket error:', error);
            });
        });
    }

    async handleMessage(ws, data) {
        const { type, sessionId, message, payload } = data;

        switch (type) {
            case 'join':
                this.clients.set(sessionId, ws);
                ws.send(JSON.stringify({
                    type: 'joined',
                    sessionId,
                    message: 'Connected to real-time chat'
                }));
                break;

            case 'chat':
                await this.handleChatMessage(ws, sessionId, message);
                break;

            case 'typing':
                this.broadcastTyping(sessionId, payload.isTyping);
                break;

            case 'ping':
                ws.send(JSON.stringify({ type: 'pong' }));
                break;

            default:
                ws.send(JSON.stringify({
                    type: 'error',
                    message: 'Unknown message type'
                }));
        }
    }

    async handleChatMessage(ws, sessionId, message) {
        try {
            // Send typing indicator
            ws.send(JSON.stringify({
                type: 'typing',
                isTyping: true
            }));

            // Process message
            const result = await advancedProcessor.process({ sessionId, message });

            // Send response
            ws.send(JSON.stringify({
                type: 'message',
                from: 'bot',
                ...result,
                timestamp: Date.now()
            }));

            // Stop typing indicator
            ws.send(JSON.stringify({
                type: 'typing',
                isTyping: false
            }));

        } catch (error) {
            console.error('Chat processing error:', error);
            ws.send(JSON.stringify({
                type: 'error',
                message: 'Failed to process message'
            }));
        }
    }

    broadcastTyping(sessionId, isTyping) {
        const client = this.clients.get(sessionId);
        if (client && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
                type: 'typing',
                isTyping
            }));
        }
    }

    broadcast(message) {
        this.wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(message));
            }
        });
    }

    getStats() {
        return {
            totalConnections: this.wss.clients.size,
            activeConnections: Array.from(this.wss.clients).filter(
                client => client.readyState === WebSocket.OPEN
            ).length,
            activeSessions: this.clients.size
        };
    }
}

module.exports = WebSocketServer;
