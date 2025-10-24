const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Serve static files from the current directory

// API key from environment variable
const API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyDW7t0CWuw_h3r1cfz72ktm97gXxCHhN_E';

// Proxy endpoint for Gemini API
app.post('/api/chat', async (req, res) => {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: req.body.message
                    }]
                }],
                generationConfig: {
                    temperature: 0.9,
                    topK: 1,
                    topP: 1,
                    maxOutputTokens: 2048,
                    stopSequences: []
                },
                safetySettings: [
                    { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
                    { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
                    { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
                    { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" }
                ]
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'Failed to get response from Gemini');
        }

        const data = await response.json();
        res.json({
            response: data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I couldn't process your request.",
            confidence: 0.95,
            intent: 'response'
        });
    } catch (error) {
        console.error('Error in Gemini API call:', error);
        res.status(500).json({
            error: error.message || 'Failed to process your request',
            response: "I'm having trouble connecting to the AI service. Please try again later."
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`Access the chat at http://localhost:${PORT}/portfolio-frontend.html`);
});