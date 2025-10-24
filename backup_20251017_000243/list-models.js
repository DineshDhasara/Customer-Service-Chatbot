const https = require('https');

const API_KEY = 'AIzaSyCOMxMotc6aoF5a2lb0PxMRaMrQDvCT5TM';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

https.get(API_URL, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        try {
            const response = JSON.parse(data);
            console.log('Available Models:');
            if (response.models) {
                response.models.forEach(model => {
                    if (model.supportedGenerationMethods?.includes('generateContent')) {
                        console.log(`- ${model.name} (supports generateContent)`);
                    }
                });
            } else {
                console.log('Response:', response);
            }
        } catch (error) {
            console.error('Error:', error);
            console.log('Raw response:', data);
        }
    });
});
