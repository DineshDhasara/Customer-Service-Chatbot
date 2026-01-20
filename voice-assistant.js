// Voice Assistant Functionality
// Make these variables global for debugging
window.recognition = null;
window.isListening = false;

// Local variables for internal use
let recognition;
let isListening = false;

// Initialize speech recognition
function initSpeechRecognition() {
    // Check if browser supports speech recognition
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
        // Create speech recognition instance
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        
        // Configure speech recognition
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        
        // Set up event handlers
        recognition.onstart = () => {
            isListening = true;
            updateVoiceButtonState();
            showToast('Listening...', 'info');
        };
        
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            document.getElementById('chatInput').value = transcript;
            showToast('Voice captured!', 'success');
        };
        
        recognition.onend = () => {
            isListening = false;
            updateVoiceButtonState();
            
            // Auto-send message after voice input if there's text
            const inputField = document.getElementById('chatInput');
            if (inputField.value.trim() !== '') {
                setTimeout(() => {
                    sendMessage();
                }, 500);
            }
        };
        
        recognition.onerror = (event) => {
            console.error('Speech recognition error', event.error);
            isListening = false;
            updateVoiceButtonState();
            
            if (event.error === 'not-allowed') {
                showToast('Microphone access denied. Please enable microphone permissions.', 'error');
            } else {
                showToast('Voice recognition error. Please try again.', 'error');
            }
        };
        
        return true;
    } else {
        showToast('Voice recognition is not supported in your browser.', 'error');
        document.getElementById('voiceBtn').style.display = 'none';
        return false;
    }
}

// Toggle voice input - make it globally accessible
function toggleVoiceInput() {
    console.log('Toggle voice input called');
    
    // Make the function globally accessible
    window.toggleVoiceInput = toggleVoiceInput;
    if (!recognition) {
        const initialized = initSpeechRecognition();
        if (!initialized) return;
    }
    
    if (isListening) {
        recognition.stop();
    } else {
        try {
            recognition.start();
        } catch (error) {
            console.error('Speech recognition error:', error);
            showToast('Could not start voice recognition. Please try again.', 'error');
        }
    }
}

// Update voice button state
function updateVoiceButtonState() {
    const voiceBtn = document.getElementById('voiceBtn');
    if (isListening) {
        voiceBtn.classList.add('listening');
        voiceBtn.innerHTML = '<i class="fas fa-microphone-slash"></i>';
    } else {
        voiceBtn.classList.remove('listening');
        voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
    }
}

// Text-to-speech for bot responses - make it globally accessible
function speakBotResponse(text) {
    // Make the function globally accessible
    window.speakBotResponse = speakBotResponse;
    console.log('Speaking text:', text.substring(0, 50) + '...');
    // Check if browser supports speech synthesis
    if ('speechSynthesis' in window) {
        // Create utterance
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Configure voice
        utterance.lang = 'en-US';
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        
        // Get available voices
        const voices = window.speechSynthesis.getVoices();
        
        // Try to find a female voice
        const femaleVoice = voices.find(voice => 
            voice.name.includes('female') || 
            voice.name.includes('Samantha') || 
            voice.name.includes('Google UK English Female')
        );
        
        if (femaleVoice) {
            utterance.voice = femaleVoice;
        }
        
        // Speak the text
        window.speechSynthesis.speak(utterance);
    }
}

// Toggle voice settings
function toggleVoiceSettings() {
    const voiceEnabled = localStorage.getItem('voiceEnabled') === 'true';
    localStorage.setItem('voiceEnabled', !voiceEnabled);
    updateVoiceSettingsButton();
    
    if (!voiceEnabled) {
        showToast('Voice assistant enabled', 'success');
    } else {
        showToast('Voice assistant disabled', 'info');
        
        // Stop any ongoing speech
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
    }
}

// Update voice settings button state
function updateVoiceSettingsButton() {
    const voiceSettingsBtn = document.getElementById('voiceSettingsBtn');
    const voiceEnabled = localStorage.getItem('voiceEnabled') === 'true';
    
    if (voiceEnabled) {
        voiceSettingsBtn.classList.add('active');
        voiceSettingsBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
    } else {
        voiceSettingsBtn.classList.remove('active');
        voiceSettingsBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
    }
}

// Initialize voice features when page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing voice assistant...');
    
    // Set default voice setting if not set
    if (localStorage.getItem('voiceEnabled') === null) {
        localStorage.setItem('voiceEnabled', 'true'); // Enable by default
    }
    
    // Update voice settings button
    try {
        updateVoiceSettingsButton();
        console.log('Voice settings button updated');
    } catch (error) {
        console.error('Error updating voice settings button:', error);
    }
    
    // Pre-initialize speech recognition
    setTimeout(() => {
        try {
            const initialized = initSpeechRecognition();
            console.log('Speech recognition initialized:', initialized);
        } catch (error) {
            console.error('Error initializing speech recognition:', error);
        }
    }, 1000);
    
    // Add speech toggle to bot messages
    document.addEventListener('click', (event) => {
        if (event.target.closest('.bot-message .message-content')) {
            const messageContent = event.target.closest('.bot-message .message-content');
            const text = messageContent.textContent.trim();
            
            // Only speak if voice is enabled
            if (localStorage.getItem('voiceEnabled') === 'true') {
                try {
                    speakBotResponse(text);
                    console.log('Speaking bot response:', text.substring(0, 50) + '...');
                } catch (error) {
                    console.error('Error speaking bot response:', error);
                }
            }
        }
    });
    
    console.log('Voice assistant initialization complete');
    
    // Expose functions globally
    window.toggleVoiceInput = toggleVoiceInput;
    window.speakBotResponse = speakBotResponse;
    window.updateVoiceButtonState = updateVoiceButtonState;
    window.toggleVoiceSettings = toggleVoiceSettings;
    
    console.log('Voice assistant functions exposed globally');
});
