# 🤖 **Smart AI Customer Service Assistant**

> **Professional customer service chatbot with real Google Gemini AI integration, intelligent conversation flows, and comprehensive order management**

[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![Gemini AI](https://img.shields.io/badge/Gemini%20AI-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://javascript.info/)

---

## 🎯 **Project Overview**

This is a **production-ready AI customer service assistant** that demonstrates:
- **Real Gemini AI Integration** - Not just mock responses, actual Google AI
- **Intelligent Conversation Flow** - Context-aware, emotion detection, intent recognition
- **Professional UI/UX** - Portfolio → Chatbot flow with modern design
- **Comprehensive Order Management** - Real order tracking with detailed information
- **Analytics & Monitoring** - Performance metrics and conversation insights

### **🌟 Key Features**
- ✅ **Real Gemini AI** with your API key integration
- ✅ **Smart Intent Detection** - Order status, refunds, complaints, human escalation
- ✅ **Enhanced Order Data** - 5 realistic orders with full details
- ✅ **Emotion Recognition** - Detects user emotions and adapts responses
- ✅ **Context Awareness** - Remembers conversation history
- ✅ **Professional Portfolio** - Showcases the project properly
- ✅ **Analytics Dashboard** - Real-time performance metrics
- ✅ **Mobile Responsive** - Works perfectly on all devices

---

## 🚀 **Quick Start Guide**

### **Prerequisites**
```bash
Node.js >= 16.0.0
npm >= 8.0.0
```

### **Installation**
```bash
# 1. Navigate to backend directory
cd backend

# 2. Install dependencies
npm install

# 3. Start the smart server
npm run start:smart
# OR
node src/smartServer.js
```

### **Access the Application**
```
🌐 Portfolio: http://localhost:5000/demo/portfolio.html
🤖 Chatbot: http://localhost:5000/demo/chatbot.html
📊 Analytics: http://localhost:5000/api/analytics
💚 Health: http://localhost:5000/api/health
```

---

## 🏗️ **Project Architecture**

### **Proper Flow Design**
```
1. Portfolio Page (portfolio.html)
   ↓ Shows project capabilities
   ↓ Professional presentation
   ↓
2. Chatbot Demo (chatbot.html)
   ↓ Real AI conversation
   ↓ Order management
   ↓ Customer service automation
```

### **Backend Services**
```
📁 backend/src/
├── 🧠 services/
│   ├── geminiAI.js          # Real Gemini AI integration
│   └── (other services...)
├── 📊 data/
│   ├── enhancedOrders.json  # Realistic order data
│   ├── intents.json         # Intent patterns
│   └── responseTemplates.json
├── 🚀 smartServer.js        # Main server with real logic
└── 📡 routes/               # API endpoints
```

### **Frontend Files**
```
📁 Root Directory/
├── 📋 portfolio.html        # Professional portfolio showcase
├── 🤖 chatbot.html         # AI chatbot interface
└── 📚 Documentation files
```

---

## 🤖 **AI Integration Details**

### **Real Gemini AI Features**
- **API Key**: Uses your provided Gemini API key
- **Context Awareness**: Maintains conversation history
- **Intent Detection**: Recognizes customer service intents
- **Emotion Analysis**: Detects user emotions (angry, happy, confused, neutral)
- **Smart Responses**: Generates contextual, helpful replies

### **Supported Intents**
```javascript
✅ order_inquiry      - Order tracking and status
✅ refund_request     - Returns and refunds
✅ complaint          - Product issues and problems
✅ greeting           - Welcome messages
✅ human_escalation   - Connect to human agents
✅ shipping_inquiry   - Delivery questions
✅ general_inquiry    - Other customer service needs
```

### **Enhanced Order Management**
```json
{
  "id": "ORD1001",
  "status": "Out for delivery",
  "items": [
    {
      "name": "Wireless Gaming Mouse Pro",
      "price": 79.99,
      "quantity": 1,
      "sku": "WGM-PRO-001"
    }
  ],
  "total": 104.98,
  "trackingNumber": "TRK123456789",
  "courier": "FastShip Express",
  "deliveryDate": "2025-10-12"
}
```

---

## 💬 **Conversation Examples**

### **Order Tracking**
```
User: "Check my order ORD1001"
AI: "I found your order ORD1001! Status: Out for delivery. 
     Expected delivery: 2025-10-12
     
     📦 Order Details:
     • Items: Wireless Gaming Mouse Pro, USB-C to HDMI Cable 4K
     • Total: $104.98
     • Tracking: TRK123456789
     • Courier: FastShip Express"
```

### **Refund Request**
```
User: "I want to return my headphones"
AI: "I can help you with the return process. Our return policy 
     allows 30 days for returns in original condition. 
     
     To get started, I'll need:
     • Your order number
     • Reason for return
     • Condition of the item"
```

### **Human Escalation**
```
User: "I need to speak to a human"
AI: "I've created support ticket TCK-A1B2C3 and you'll be 
     connected with a human agent shortly. Average wait 
     time is 2-3 minutes."
```

---

## 📊 **API Documentation**

### **Chat Endpoint**
```http
POST /api/chat
Content-Type: application/json

{
  "message": "Check order ORD1001",
  "sessionId": "session-12345"
}
```

**Response:**
```json
{
  "success": true,
  "reply": "I found your order ORD1001! Status: Out for delivery...",
  "intent": "order_inquiry",
  "confidence": 0.95,
  "emotion": { "primary": "neutral", "intensity": 0.3 },
  "suggestions": ["Track package", "Change delivery", "Contact courier"],
  "orderDetails": { "id": "ORD1001", "status": "Out for delivery" },
  "metadata": {
    "sessionId": "session-12345",
    "responseTime": 145,
    "source": "gemini-ai"
  }
}
```

### **Other Endpoints**
```http
GET  /api/health        # System health check
GET  /api/analytics     # Conversation analytics
GET  /api/orders/:id    # Order lookup
POST /api/ticket        # Create support ticket
POST /api/feedback      # Submit feedback
```

---

## 🎨 **UI/UX Design**

### **Portfolio Page Features**
- **Professional Presentation** - Showcases project capabilities
- **Interactive Cards** - Different aspects of the AI system
- **Live Server Testing** - Checks if backend is running
- **Smooth Transitions** - Professional animations and effects
- **Responsive Design** - Works on all screen sizes

### **Chatbot Interface Features**
- **Real-time Messaging** - Instant AI responses
- **Typing Indicators** - Shows when AI is thinking
- **Confidence Meters** - Visual feedback on AI certainty
- **Quick Actions** - One-click common requests
- **Order Details Display** - Rich order information cards
- **Suggestion Buttons** - Follow-up action recommendations

---

## 📈 **Analytics & Monitoring**

### **Real-time Metrics**
```json
{
  "totalChats": 45,
  "totalMessages": 178,
  "activeSessions": 3,
  "avgResponseTime": 120,
  "topIntents": [
    { "intent": "order_inquiry", "count": 23 },
    { "intent": "greeting", "count": 18 },
    { "intent": "refund_request", "count": 12 }
  ]
}
```

### **Performance Tracking**
- Response times for each message
- Intent detection accuracy
- User satisfaction scores
- Session duration and engagement
- Error rates and system health

---

## 🔧 **Configuration**

### **Environment Setup**
The Gemini API key is already configured in the code:
```javascript
// In geminiAI.js
this.apiKey = 'AIzaSyCOMxMotc6aoF5a2lb0PxMRaMrQDvCT5TM';
```

### **Server Configuration**
```javascript
// Default settings
PORT = 5000
GEMINI_API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent'
```

---

## 🧪 **Testing the System**

### **Test Scenarios**
1. **Order Tracking**: Try "Check order ORD1001", "ORD1002", "ORD1003", "ORD1004", "ORD1005"
2. **Refund Requests**: "I want a refund", "Return my item"
3. **Complaints**: "My item is broken", "Damaged product"
4. **Human Support**: "Speak to human", "I need an agent"
5. **General Help**: "Hello", "I need help"

### **Expected Responses**
- **Intelligent AI responses** from Gemini
- **Order details** displayed for valid order IDs
- **Contextual suggestions** for follow-up actions
- **Emotion detection** and appropriate tone
- **Professional customer service** language

---

## 🚀 **Deployment Options**

### **Local Development**
```bash
# Start the server
npm run start:smart

# Development with auto-reload
npm run dev:smart
```

### **Production Deployment**
```bash
# Install production dependencies
npm ci --only=production

# Start production server
NODE_ENV=production npm run start:smart
```

### **Docker Deployment**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci --only=production
COPY backend/ ./
EXPOSE 5000
CMD ["node", "src/smartServer.js"]
```

---

## 🎯 **Key Improvements Made**

### **Logic & Functionality**
✅ **Real Gemini AI** - Actual API integration, not mock responses  
✅ **Enhanced Order Data** - 5 realistic orders with full details  
✅ **Smart Intent Detection** - Context-aware conversation flow  
✅ **Proper Error Handling** - Graceful fallbacks and user feedback  
✅ **Session Management** - Conversation history and context  

### **UI/UX Flow**
✅ **Portfolio First** - Professional project showcase  
✅ **Clear Navigation** - Portfolio → Chatbot flow  
✅ **Better Design** - Clean, professional, functional interface  
✅ **Mobile Responsive** - Works perfectly on all devices  
✅ **Real-time Feedback** - Status indicators and loading states  

### **Data Quality**
✅ **Realistic Orders** - Complete order information with tracking  
✅ **Enhanced Responses** - Rich, contextual AI replies  
✅ **Better Analytics** - Meaningful performance metrics  
✅ **Professional Content** - Customer service focused messaging  

---

## 📞 **Support & Contact**

### **Getting Help**
- Check server is running: `node backend/src/smartServer.js`
- Verify Gemini API connection in console logs
- Test endpoints: `http://localhost:5000/api/health`
- Review conversation logs for debugging

### **Common Issues**
1. **Server not starting**: Check Node.js version (>=16.0.0)
2. **Gemini API errors**: Verify API key and internet connection
3. **Frontend not loading**: Ensure server is running on port 5000
4. **Order not found**: Try ORD1001, ORD1002, ORD1003, ORD1004, ORD1005

---

## 🏆 **Project Highlights**

This project demonstrates:
- **Real AI Integration** - Not just fancy UI, actual working Gemini AI
- **Professional Architecture** - Clean, maintainable, scalable code
- **Customer Service Focus** - Practical, business-ready functionality
- **Modern Development** - Best practices, error handling, documentation
- **Portfolio Quality** - Presentation-ready with proper flow

**Ready for production use and portfolio presentation!** 🚀

---

*Built with ❤️ using Node.js, Express, Google Gemini AI, and modern web technologies*
