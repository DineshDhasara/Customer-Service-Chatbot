/**
 * Test script to verify Gemini API connection
 */

const https = require('https');

// The API key from the project
const API_KEY = 'AIzaSyAxj-bpqJWLyVfvPaqkzUIaDrhz0ebQMbs';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

async function testGeminiAPI() {
    console.log('🔍 Testing Gemini API Connection...');
    console.log('API Key:', API_KEY.substring(0, 10) + '...' + API_KEY.substring(API_KEY.length - 4));
    
    const requestBody = JSON.stringify({
        contents: [{
            parts: [{
                text: "Hello, this is a test. Please respond with 'API connection successful!'"
            }]
        }],
        generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 100
        }
    });

    return new Promise((resolve, reject) => {
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(requestBody)
            }
        };

        const req = https.request(API_URL, options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    
                    if (res.statusCode === 200) {
                        console.log('✅ API Connection Successful!');
                        console.log('Response:', response.candidates?.[0]?.content?.parts?.[0]?.text || 'No response text');
                        resolve(true);
                    } else {
                        console.error('❌ API Error:', res.statusCode);
                        console.error('Response:', response);
                        resolve(false);
                    }
                } catch (error) {
                    console.error('❌ Parse Error:', error.message);
                    console.error('Raw Response:', data);
                    resolve(false);
                }
            });
        });

        req.on('error', (error) => {
            console.error('❌ Request Error:', error.message);
            reject(error);
        });

        req.write(requestBody);
        req.end();
    });
}

// Run the test
testGeminiAPI()
    .then(success => {
        if (success) {
            console.log('\n✅ Gemini API is working correctly!');
            console.log('You can now use the chatbot with this API key.');
        } else {
            console.log('\n❌ Gemini API connection failed!');
            console.log('Please check:');
            console.log('1. The API key is valid');
            console.log('2. The API is enabled in Google Cloud Console');
            console.log('3. You have internet connection');
        }
        process.exit(success ? 0 : 1);
    })
    .catch(error => {
        console.error('\n❌ Test failed:', error);
        process.exit(1);
    });
