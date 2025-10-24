/**
 * Simple test to verify chatbot functionality
 */

async function testChatbot() {
    try {
        console.log('Testing chatbot...');

        const response = await fetch('http://localhost:5000/api/health');
        const healthData = await response.json();
        console.log('Health check:', healthData);

        const chatResponse = await fetch('http://localhost:5000/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: 'Hello, test',
                sessionId: 'test-session'
            })
        });

        const chatData = await chatResponse.json();
        console.log('Chat response:', chatData);

        return chatData;
    } catch (error) {
        console.error('Test failed:', error);
        return null;
    }
}

testChatbot();
