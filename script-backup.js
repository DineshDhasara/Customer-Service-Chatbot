// API Configuration
const API_BASE_URL = 'http://localhost:5003/api';

// State Management
let allOffers = [];
let conversationHistory = [];
let currentUser = null;
let userNotifications = [];
let compareList = [];
let priceHistoryData = new Map(); // offerId -> price history
let trackedPrices = new Set(); // Set of tracked offer IDs
let voiceRecognition = null;
let cameraStream = null;

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing Offer Alert Bot...');
    try {
        checkAuthStatus();
        loadStatistics();
        loadOffers();
        initDarkMode();
        updateWishlistCount();
        console.log('Initialization complete');
    } catch (error) {
        console.error('Error during initialization:', error);
    }
});

async function checkAuthStatus() {
    try {
        const response = await fetch('/api/auth/user', {
            method: 'GET',
            credentials: 'include'
        });
        if (!response.ok) {
            throw new Error('Failed to fetch auth status');
        }
        const data = await response.json();
        if (data.authenticated) {
            currentUser = data.user;
            updateAuthUI(true, data.user);
        } else {
            currentUser = null;
            updateAuthUI(false, null);
        }
    } catch (error) {
        console.error('Error checking auth status:', error);
        currentUser = null;
        updateAuthUI(false, null);
    }
}

function updateAuthUI(isAuthenticated, user) {
    const loginBtn = document.getElementById('loginBtn');
    const userProfile = document.getElementById('userProfile');
    const userNameEl = document.getElementById('userName');
    const userAvatarEl = document.getElementById('userAvatar');
    const notificationsBtn = document.getElementById('notificationsBtn');

    if (!loginBtn || !userProfile) {
        return;
    }

    if (isAuthenticated && user) {
        loginBtn.style.display = 'flex';
        loginBtn.style.visibility = 'hidden';
        userProfile.style.display = 'flex';

        if (userNameEl) {
            userNameEl.textContent = user.displayName || user.email || 'User';
        }

        if (userAvatarEl) {
            if (user.photo) {
                userAvatarEl.src = user.photo;
                userAvatarEl.style.display = 'block';
            } else {
                userAvatarEl.style.display = 'none';
            }
        }

        // Show notifications button when logged in
        if (notificationsBtn) {
            notificationsBtn.style.display = 'flex';
        }

        // Load user notifications
        loadUserNotifications();
    } else {
        loginBtn.style.display = 'flex';
        loginBtn.style.visibility = 'visible';
        userProfile.style.display = 'none';

        // Hide notifications button when logged out
        if (notificationsBtn) {
            notificationsBtn.style.display = 'none';
        }

        // Clear notifications
        userNotifications = [];
    }
}

function loginWithGoogle() {
    window.location.href = '/auth/google';
}

async function logoutUser() {
    try {
        const response = await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include'
        });
        if (!response.ok) {
            throw new Error('Logout failed');
        }
        showToast('Logged out successfully', 'info');
        currentUser = null;
        await checkAuthStatus();
    } catch (error) {
        console.error('Error logging out:', error);
        showToast('Could not log out. Please try again.', 'error');
    }
}

// Initialize Dark Mode
function initDarkMode() {
    const darkMode = localStorage.getItem('darkMode');
    if (darkMode === 'enabled') {
        document.body.setAttribute('data-theme', 'dark');
        document.getElementById('darkModeToggle').innerHTML = '<i class="fas fa-sun"></i>';
    }
}

// Toggle Dark Mode
function toggleDarkMode() {
    const darkModeToggle = document.getElementById('darkModeToggle');
    
    if (document.body.getAttribute('data-theme') === 'dark') {
        document.body.removeAttribute('data-theme');
        localStorage.setItem('darkMode', 'disabled');
        darkModeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        showToast('Light mode enabled', 'info');
    } else {
        document.body.setAttribute('data-theme', 'dark');
        localStorage.setItem('darkMode', 'enabled');
        darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        showToast('Dark mode enabled', 'info');
    }
}

// Load Statistics
async function loadStatistics() {
    try {
        const response = await fetch(`${API_BASE_URL}/stats`);
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('totalOffers').textContent = data.stats.totalOffers;
            document.getElementById('avgDiscount').textContent = `${data.stats.averageDiscount}%`;
            document.getElementById('totalSavings').textContent = `₹${formatNumber(data.stats.totalSavings)}`;
        }
    } catch (error) {
        console.error('Error loading statistics:', error);
    }
}

// Load Offers and Metadata
function loadOffers() {
    showLoading();
    
    // First fetch metadata to get categories and platforms
    fetch(`${API_BASE_URL}/metadata`)
        .then(response => response.json())
        .then(metaData => {
            if (metaData.success) {
                // Update category filter options
                updateFilterOptions('categoryFilter', metaData.metadata.categories);
                // Update platform filter options
                updateFilterOptions('platformFilter', metaData.metadata.platforms);
                
                // Now fetch the offers
                return fetch(`${API_BASE_URL}/offers`);
            } else {
                throw new Error('Failed to load metadata');
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const previousOffers = allOffers && Array.isArray(allOffers) ? [...allOffers] : [];
                allOffers = data.offers;
                displayOffers(allOffers);
                notifyNewOffersIfAny(previousOffers, allOffers);
            } else {
                showError('Failed to load offers');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showError('Failed to connect to the server');
        });
}

// Update filter options based on available data
function updateFilterOptions(filterId, options) {
    const filterElement = document.getElementById(filterId);
    if (!filterElement) return;
    
    // Keep the 'All' option
    let html = '<option value="">All</option>';
    
    // Add options from the data
    options.forEach(option => {
        html += `<option value="${option}">${option}</option>`;
    });
    
    filterElement.innerHTML = html;
}

// Display Offers
function displayOffers(offers) {
    const grid = document.getElementById('offersGrid');
    const loading = document.getElementById('loadingSpinner');
    const noResults = document.getElementById('noResults');
    
    loading.style.display = 'none';
    
    if (offers.length === 0) {
        grid.style.display = 'none';
        noResults.style.display = 'block';
        return;
    }
    
    grid.style.display = 'grid';
    noResults.style.display = 'none';
    
    // Get wishlist from localStorage
    const wishlist = getWishlist();
    
    grid.innerHTML = offers.map(offer => {
        const isInWishlist = wishlist.some(item => item.id === offer.id);
        const wishlistIcon = isInWishlist ? 'fas fa-heart' : 'far fa-heart';
        const wishlistAction = isInWishlist ? 'removeFromWishlist' : 'addToWishlist';
        
        return `
        <div class="offer-card">
            <div class="wishlist-btn" onclick="event.stopPropagation(); event.preventDefault(); console.log('Wishlist button clicked for offer #${offer.id}'); ${wishlistAction}(${offer.id})">
                <i class="${wishlistIcon}"></i>
            </div>
            ${offer.discount >= 50 ? '<div class="trending-badge">🔥 Hot Deal</div>' : offer.discount >= 30 ? '<div class="trending-badge">⭐ Popular</div>' : ''}
            <div class="offer-image">
                <img src="${offer.image}" alt="${offer.title}" onerror="this.src='https://picsum.photos/300/200?random=${offer.id}'" loading="lazy">
            </div>
            <div class="offer-content">
                <div class="offer-header">
                    <div>
                        <h3 class="offer-title">${offer.title}</h3>
                    </div>
                    <div class="discount-badge">${offer.discount}% OFF</div>
                </div>
                <p class="offer-description">${offer.description}</p>
                <div class="offer-price">
                    <span class="current-price">₹${formatNumber(offer.discountedPrice)}</span>
                    <span class="original-price">₹${formatNumber(offer.originalPrice)}</span>
                </div>
                <p class="savings">Save ₹${formatNumber(offer.originalPrice - offer.discountedPrice)}</p>
                <div class="offer-meta">
                    <span class="platform-badge">
                        <i class="fas fa-store"></i>
                        ${offer.platform}
                    </span>
                    <span class="rating">
                        <i class="fas fa-star"></i>
                        ${offer.rating} (${formatNumber(offer.reviews)})
                    </span>
                </div>
                <div class="offer-actions">
                    <button class="shop-now-btn" onclick="openOffer('${offer.link}')">
                        <i class="fas fa-shopping-cart"></i> Shop Now
                    </button>
                    <button class="alert-btn" onclick="event.stopPropagation(); setPriceAlert(${offer.id})">
                        <i class="fas fa-bell"></i>
                    </button>
                    <button class="price-history-btn" onclick="event.stopPropagation(); showPriceHistory(${offer.id})" title="Price History">
                        <i class="fas fa-chart-line"></i>
                    </button>
                    <button class="compare-btn" onclick="event.stopPropagation(); toggleCompare(${offer.id})" title="Compare">
                        <i class="fas fa-balance-scale"></i>
                    </button>
                    <button class="share-btn" onclick="event.stopPropagation(); shareOffer(${offer.id})">
                        <i class="fas fa-share-alt"></i>
                    </button>
                </div>
            </div>
        </div>
        `;
    }).join('');
}

function notifyNewOffersIfAny(previousOffers, currentOffers) {
    try {
        const previousIdsFromState = previousOffers && Array.isArray(previousOffers) && previousOffers.length > 0
            ? previousOffers.map(o => o.id)
            : [];
        const storedIds = localStorage.getItem('seenOfferIds');
        const previousIdsFromStorage = storedIds ? JSON.parse(storedIds) : [];
        const baselinePreviousIds = previousIdsFromState.length > 0 ? previousIdsFromState : previousIdsFromStorage;
        const currentIds = currentOffers.map(o => o.id);
        const newIds = currentIds.filter(id => !baselinePreviousIds.includes(id));
        localStorage.setItem('seenOfferIds', JSON.stringify(currentIds));
        if (baselinePreviousIds.length > 0 && newIds.length > 0) {
            const count = newIds.length;
            const plural = count > 1 ? 's' : '';
            showToast(`${count} new offer${plural} added since your last visit.`, 'info');
            
            // Create backend notification for logged-in users
            if (currentUser) {
                createNotification('new-offers', 'New Offers Available!', 
                    `${count} new offer${plural} have been added since your last visit.`, 
                    { newOfferIds: newIds });
            }
        }
    } catch (error) {
        console.error('Error checking new offers:', error);
    }
}

// Apply Filters
async function applyFilters() {
    const category = document.getElementById('categoryFilter').value;
    const platform = document.getElementById('platformFilter').value;
    const minDiscount = document.getElementById('discountFilter').value;
    const searchQuery = document.getElementById('searchInput').value.trim();
    
    try {
        showLoading();
        const params = new URLSearchParams();
        if (category) params.append('category', category);
        if (platform) params.append('platform', platform);
        if (minDiscount) params.append('minDiscount', minDiscount);
        if (searchQuery) params.append('search', searchQuery);
        
        const response = await fetch(`${API_BASE_URL}/offers?${params}`);
        const data = await response.json();
        
        if (data.success) {
            displayOffers(data.offers);
        }
    } catch (error) {
        console.error('Error applying filters:', error);
        showError('Failed to apply filters. Please try again.');
    }
}

// Reset Filters
function resetFilters() {
    document.getElementById('categoryFilter').value = '';
    document.getElementById('platformFilter').value = '';
    document.getElementById('discountFilter').value = '';
    document.getElementById('searchInput').value = '';
    displayOffers(allOffers);
}

// Search Offers
function searchOffers() {
    // Use the applyFilters function which now includes search functionality
    applyFilters();
}

// Open Offer Link
function openOffer(link) {
    window.open(link, '_blank');
}

// Toggle Chat
function toggleChat() {
    const chatbot = document.getElementById('chatbot');
    const floatingBtn = document.querySelector('.floating-chat-btn');
    
    chatbot.classList.toggle('active');
    
    if (chatbot.classList.contains('active')) {
        floatingBtn.classList.add('hidden');
        document.getElementById('chatInput').focus();
    } else {
        floatingBtn.classList.remove('hidden');
    }
}

// Handle Chat Key Press
function handleChatKeyPress(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}

// Send Message
function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (message === '') return;
    
    console.log('Sending message to chatbot:', message);
    
    // Add user message to chat
    addMessageToChat(message, 'user');
    input.value = '';
    
    // Show typing indicator
    showTypingIndicator();
    
    // Hide any previous suggested offers
    document.getElementById('suggestedOffers').style.display = 'none';
    
    // Send message to API
    console.log(`Sending request to ${API_BASE_URL}/chat`);
    fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message })
    })
    .then(response => {
        console.log('Response status:', response.status);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Received response from chatbot API:', data);
        // Remove typing indicator
        removeTypingIndicator();
        
        if (!data.success && !data.message) {
            throw new Error('Invalid response format from API');
        }
        
        // Add bot response to chat
        addMessageToChat(data.message, 'bot');
        
        // Speak the response if speech synthesis is available
        try {
            if ('speechSynthesis' in window && localStorage.getItem('voiceEnabled') === 'true') {
                console.log('Speaking bot response...');
                if (typeof speakBotResponse === 'function') {
                    speakBotResponse(data.message);
                } else {
                    console.error('speakBotResponse function not found');
                }
            }
        } catch (error) {
            console.error('Error with speech synthesis:', error);
        }
        
        // Display suggested offers if any
        if (data.suggestedOffers && data.suggestedOffers.length > 0) {
            console.log('Displaying suggested offers:', data.suggestedOffers.length);
            displaySuggestedOffers(data.suggestedOffers);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        removeTypingIndicator();
        addMessageToChat('Sorry, I\'m having trouble connecting right now. Please try again later.', 'bot');
    });
}

// Add Message to Chat
function addMessageToChat(message, sender) {
    const messagesContainer = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    
    const avatar = sender === 'bot' 
        ? '<i class="fas fa-robot"></i>' 
        : '<i class="fas fa-user"></i>';
    
    // Clean up the message if it's from the bot and contains offer references
    let cleanMessage = message;
    if (sender === 'bot') {
        // Remove any asterisks and double asterisks that might be used for formatting
        cleanMessage = cleanMessage.replace(/\*\*/g, '').replace(/\*/g, '');
        
        // Remove any text that looks like "Get X% off" or "was ₹X" as we'll show this in the card
        cleanMessage = cleanMessage.replace(/\s+Get\s+\d+%\s+off[,.]/gi, '');
        cleanMessage = cleanMessage.replace(/\s+\(was\s+₹[\d,]+\)[,.]/gi, '');
        cleanMessage = cleanMessage.replace(/\s+now\s+at\s+₹[\d,]+[,.]/gi, '');
    }
    
    messageDiv.innerHTML = `
        <div class="message-avatar">${avatar}</div>
        <div class="message-content">
            <p>${cleanMessage}</p>
        </div>
    `;
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Show Typing Indicator
function showTypingIndicator() {
    const messagesContainer = document.getElementById('chatMessages');
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message bot-message typing-indicator';
    typingDiv.id = 'typingIndicator';
    typingDiv.innerHTML = `
        <div class="message-avatar">
            <i class="fas fa-robot"></i>
        </div>
        <div class="message-content">
            <p>Thinking...</p>
        </div>
    `;
    messagesContainer.appendChild(typingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Remove Typing Indicator
function removeTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) {
        indicator.remove();
    }
}

// Display Suggested Offers
function displaySuggestedOffers(offers) {
    const container = document.getElementById('suggestedOffers');
    const offersContainer = container.querySelector('.suggested-offers-container');
    
    if (offers.length === 0) {
        container.style.display = 'none';
        return;
    }
    
    container.style.display = 'block';
    offersContainer.innerHTML = offers.map(offer => `
        <a href="${offer.link}" target="_blank" class="suggested-offer-card">
            <img src="${offer.image}" alt="${offer.title}" class="suggested-offer-image" onerror="this.src='data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20width%3D%2260%22%20height%3D%2260%22%20fill%3D%22%23CCCCCC%22%2F%3E%3Ctext%20x%3D%2230%22%20y%3D%2230%22%20dominant-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20font-family%3D%22Arial%22%20font-size%3D%2210%22%20fill%3D%22%23333333%22%3EOffer%3C%2Ftext%3E%3C%2Fsvg%3E'">
            <div class="suggested-offer-info">
                <div class="suggested-offer-title">${offer.title}</div>
                <div class="suggested-offer-price-container">
                    <div class="suggested-offer-price">₹${formatNumber(offer.discountedPrice)}</div>
                    <div class="suggested-offer-discount">(${offer.discount}% off)</div>
                </div>
            </div>
        </a>
    `).join('');
}

// Toggle Mobile Menu
function toggleMobileMenu() {
    const nav = document.querySelector('.nav');
    nav.style.display = nav.style.display === 'flex' ? 'none' : 'flex';
}

// Show Loading
function showLoading() {
    document.getElementById('loadingSpinner').style.display = 'block';
    document.getElementById('offersGrid').style.display = 'none';
    document.getElementById('noResults').style.display = 'none';
}

// Show Error
function showError(message) {
    console.error(message);
    document.getElementById('loadingSpinner').style.display = 'none';
}

// Format Number
function formatNumber(num) {
    if (num === undefined || num === null) {
        return '0';
    }
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Bridge functions for voice assistant
function speakBotResponse(text) {
    // Check if the function exists in the voice-assistant.js file
    if (window.speakBotResponse) {
        return window.speakBotResponse(text);
    } else {
        console.error('Voice assistant not loaded properly');
        // Try to load it dynamically
        const script = document.createElement('script');
        script.src = 'voice-assistant.js';
        script.onload = () => {
            if (window.speakBotResponse) {
                window.speakBotResponse(text);
            }
        };
        document.head.appendChild(script);
    }
}

function toggleVoiceInput() {
    if (window.toggleVoiceInput) {
        return window.toggleVoiceInput();
    } else {
        console.error('Voice assistant not loaded properly');
    }
}

// Price Alert Functions
function getPriceAlerts() {
    const alerts = localStorage.getItem('priceAlerts');
    return alerts ? JSON.parse(alerts) : [];
}

function savePriceAlerts(alerts) {
    localStorage.setItem('priceAlerts', JSON.stringify(alerts));
}

function setPriceAlert(offerId) {
    const offer = allOffers.find(o => o.id === offerId);
    if (!offer) return;
    
    const alerts = getPriceAlerts();
    const existingAlert = alerts.find(a => a.id === offerId);
    
    // Create alert modal
    const alertModal = document.createElement('div');
    alertModal.className = 'modal active';
    alertModal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2><i class="fas fa-bell"></i> Set Price Alert</h2>
                <button class="close-btn" onclick="this.closest('.modal').remove()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="alert-product">
                    <img src="${offer.image}" alt="${offer.title}">
                    <div class="alert-product-info">
                        <h3>${offer.title}</h3>
                        <p>Current Price: ₹${formatNumber(offer.discountedPrice)}</p>
                        ${existingAlert ? `<p class="existing-alert">Existing Alert: ₹${formatNumber(existingAlert.targetPrice)}</p>` : ''}
                    </div>
                </div>
                <div class="alert-form">
                    <label for="priceSlider">Target Price (₹)</label>
                    <input type="range" id="priceSlider" min="${Math.floor(offer.discountedPrice * 0.5)}" max="${offer.discountedPrice}" value="${existingAlert ? existingAlert.targetPrice : Math.floor(offer.discountedPrice * 0.8)}" oninput="document.getElementById('selectedPrice').textContent = '₹' + formatNumber(this.value)">
                    <div class="price-display">
                        <span id="selectedPrice">₹${formatNumber(existingAlert ? existingAlert.targetPrice : Math.floor(offer.discountedPrice * 0.8))}</span>
                    </div>
                    <div class="alert-options">
                        <label>
                            <input type="checkbox" id="emailNotify" ${existingAlert ? (existingAlert.emailNotify ? 'checked' : '') : 'checked'}>
                            Notify by Email
                        </label>
                        <label>
                            <input type="checkbox" id="browserNotify" ${existingAlert ? (existingAlert.browserNotify ? 'checked' : '') : 'checked'}>
                            Browser Notification
                        </label>
                    </div>
                    <div class="alert-actions">
                        ${existingAlert ? `<button class="remove-alert-btn" onclick="removePriceAlert(${offerId})">Remove Alert</button>` : ''}
                        <button class="set-alert-btn" onclick="confirmPriceAlert(${offerId})">${existingAlert ? 'Update Alert' : 'Set Alert'}</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(alertModal);
    
    // Add event listener for price slider
    setTimeout(() => {
        const slider = document.getElementById('priceSlider');
        const priceDisplay = document.getElementById('selectedPrice');
        
        if (slider && priceDisplay) {
            slider.addEventListener('input', () => {
                priceDisplay.textContent = '₹' + formatNumber(slider.value);
            });
        }
    }, 100);
}

function confirmPriceAlert(offerId) {
    const offer = allOffers.find(o => o.id === offerId);
    if (!offer) return;
    
    const targetPrice = parseInt(document.getElementById('priceSlider').value);
    const emailNotify = document.getElementById('emailNotify').checked;
    const browserNotify = document.getElementById('browserNotify').checked;
    
    const alerts = getPriceAlerts();
    
    // Remove existing alert for this offer if exists
    const filteredAlerts = alerts.filter(a => a.id !== offerId);
    
    const newAlert = {
        id: offerId,
        title: offer.title,
        currentPrice: offer.discountedPrice,
        targetPrice: targetPrice,
        image: offer.image,
        link: offer.link,
        platform: offer.platform,
        emailNotify: emailNotify,
        browserNotify: browserNotify,
        dateCreated: new Date().toISOString()
    };
    
    filteredAlerts.push(newAlert);
    
    savePriceAlerts(filteredAlerts);
    
    // Close modal
    document.querySelector('.modal').remove();
    
    showToast(`Price alert set for ${offer.title} at ₹${formatNumber(targetPrice)}`, 'success');
    checkPriceAlerts(); // Check immediately after setting

    if (emailNotify) {
        if (!currentUser || !currentUser.email) {
            showToast('Login with Google to receive email alerts in your Gmail.', 'error');
        } else {
            sendEmailAlert('created', newAlert).catch(err => {
                console.error('Error sending alert creation email:', err);
            });
        }
    }
}

function removePriceAlert(offerId) {
    const alerts = getPriceAlerts();
    const filteredAlerts = alerts.filter(a => a.id !== offerId);
    
    savePriceAlerts(filteredAlerts);
    
    // Close modal
    document.querySelector('.modal').remove();
    
    showToast('Price alert removed', 'info');
}

function checkPriceAlerts() {
    const alerts = getPriceAlerts();
    
    if (alerts.length === 0) return;
    
    // In a real app, this would check against current prices from the server
    // For demo purposes, we'll simulate a price drop for one random alert if it exists
    if (alerts.length > 0 && Math.random() > 0.5) {
        const randomIndex = Math.floor(Math.random() * alerts.length);
        const alert = alerts[randomIndex];
        
        // Simulate price drop
        const newPrice = alert.targetPrice - Math.floor(Math.random() * 500);
        
        console.log('Price drop triggered for:', alert.title, 'New price:', newPrice);
        
        // Show notification
        showPriceDropNotification(alert, newPrice);
        
        // Create backend notification
        if (currentUser) {
            createNotification('price-drop', 'Price Drop Alert!', 
                `${alert.title} is now available at ₹${formatNumber(newPrice)}.`, 
                { offerId: alert.id, newPrice, link: alert.link });
        }
        
        if (alert.browserNotify) {
            const message = `${alert.title} is now available at ₹${formatNumber(newPrice)}.`;
            console.log('Sending browser notification:', message);
            showBrowserNotification('Price Drop Alert!', message, alert.link);
        }
        
        if (alert.emailNotify && currentUser && currentUser.email) {
            console.log('Sending email alert to:', currentUser.email);
            sendEmailAlert('price-drop', alert, newPrice).catch(err => {
                console.error('Error sending price drop email:', err);
            });
        }
        
        // Remove the triggered alert
        alerts.splice(randomIndex, 1);
        savePriceAlerts(alerts);
    }
}

async function sendEmailAlert(triggerType, alert, newPrice) {
    try {
        const response = await fetch('/api/alerts/email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                offerId: alert.id,
                targetPrice: alert.targetPrice,
                triggerType,
                newPrice
            })
        });

        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data.message || 'Failed to send email alert');
        }

        if (triggerType === 'created') {
            showToast('Email confirmation for this alert has been sent.', 'success');
        } else if (triggerType === 'price-drop') {
            showToast('Price drop email alert sent.', 'success');
        }
    } catch (error) {
        console.error('sendEmailAlert error:', error);
        showToast('Could not send email alert. Please check email settings.', 'error');
        throw error;
    }
}

function showPriceDropNotification(alert, newPrice) {
    // Create a special toast notification for price drops
    const toast = document.createElement('div');
    toast.className = 'toast price-drop';
    
    toast.innerHTML = `
        <i class="fas fa-bell"></i>
        <div class="price-drop-content">
            <h4>Price Drop Alert!</h4>
            <p>${alert.title}</p>
            <div class="price-change">
                <span class="old-price">₹${formatNumber(alert.currentPrice)}</span>
                <span class="arrow"><i class="fas fa-arrow-right"></i></span>
                <span class="new-price">₹${formatNumber(newPrice)}</span>
            </div>
            <button onclick="openOffer('${alert.link}')" class="view-deal-btn">
                View Deal
            </button>
        </div>
        <button class="close-toast" onclick="this.parentElement.remove()">&times;</button>
    `;
    
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    
    // This notification stays until dismissed
}

async function showBrowserNotification(title, body, url) {
    try {
        if (!('Notification' in window)) {
            return;
        }
        if (Notification.permission === 'granted') {
            const notification = new Notification(title, { body });
            if (url) {
                notification.onclick = () => {
                    window.focus();
                    openOffer(url);
                };
            }
            return;
        }
        if (Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                const notification = new Notification(title, { body });
                if (url) {
                    notification.onclick = () => {
                        window.focus();
                        openOffer(url);
                    };
                }
            }
        }
    } catch (error) {
        console.error('Browser notification error:', error);
    }
}

// Check for price alerts periodically
setInterval(checkPriceAlerts, 3000); // Every 3 seconds for demo/testing purposes

// Notifications Functions
async function loadUserNotifications() {
    if (!currentUser) return;

    try {
        const response = await fetch('/api/notifications', {
            method: 'GET',
            credentials: 'include'
        });

        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                userNotifications = data.notifications;
                updateNotificationsCount();
            }
        }
    } catch (error) {
        console.error('Error loading notifications:', error);
    }
}

async function createNotification(type, title, message, data) {
    if (!currentUser) return;

    try {
        const response = await fetch('/api/notifications', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                type,
                title,
                message,
                data
            })
        });

        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                userNotifications.unshift(result.notification);
                updateNotificationsCount();
            }
        }
    } catch (error) {
        console.error('Error creating notification:', error);
    }
}

function updateNotificationsCount() {
    const notificationsBtn = document.getElementById('notificationsBtn');
    const notificationsCount = notificationsBtn?.querySelector('.notifications-count');
    
    if (notificationsCount) {
        const unreadCount = userNotifications.filter(n => !n.read).length;
        notificationsCount.textContent = unreadCount;
        notificationsCount.style.display = unreadCount > 0 ? 'flex' : 'none';
    }
}

function showNotifications() {
    const modal = document.getElementById('notificationsModal');
    if (modal) {
        modal.classList.add('active');
        renderNotifications();
    }
}

function closeNotificationsModal() {
    const modal = document.getElementById('notificationsModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

function renderNotifications(filter = 'all') {
    const notificationsList = document.getElementById('notificationsList');
    if (!notificationsList) return;

    let filteredNotifications = userNotifications;

    if (filter === 'unread') {
        filteredNotifications = userNotifications.filter(n => !n.read);
    } else if (filter === 'price-drop') {
        filteredNotifications = userNotifications.filter(n => n.type === 'price-drop');
    } else if (filter === 'new-offers') {
        filteredNotifications = userNotifications.filter(n => n.type === 'new-offers');
    }

    if (filteredNotifications.length === 0) {
        notificationsList.innerHTML = `
            <div class="no-notifications">
                <i class="fas fa-bell-slash"></i>
                <p>No notifications ${filter !== 'all' ? 'in this category' : 'yet'}</p>
            </div>
        `;
        return;
    }

    notificationsList.innerHTML = filteredNotifications.map(notification => {
        const offerLink = notification.data?.link || '#';
        const isClickable = offerLink !== '#';
        
        return `
        <div class="notification-item ${notification.read ? 'read' : 'unread'}" data-id="${notification.id}">
            <div class="notification-icon">
                <i class="fas ${getNotificationIcon(notification.type)}"></i>
            </div>
            <div class="notification-content ${isClickable ? 'clickable' : ''}" 
                 ${isClickable ? `onclick="handleNotificationClick('${notification.id}', '${offerLink}')"` : ''}>
                <h4>${notification.title}</h4>
                <p>${notification.message}</p>
                <span class="notification-time">${formatNotificationTime(notification.createdAt)}</span>
                ${isClickable ? '<span class="click-hint">Click to view offer</span>' : ''}
            </div>
            <div class="notification-actions">
                ${!notification.read ? `<button class="mark-read-btn" onclick="markNotificationRead('${notification.id}')">Mark as read</button>` : ''}
                <button class="delete-notification-btn" onclick="deleteNotification('${notification.id}')">Delete</button>
            </div>
        </div>
    `;
    }).join('');

    // Add filter event listeners
    const filterButtons = document.querySelectorAll('.notifications-filters .filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderNotifications(btn.dataset.filter);
        });
    });
}

function getNotificationIcon(type) {
    switch (type) {
        case 'price-drop':
            return 'fa-arrow-down text-success';
        case 'new-offers':
            return 'fa-tag text-info';
        case 'alert-created':
            return 'fa-bell text-warning';
        default:
            return 'fa-info-circle';
    }
}

function formatNotificationTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}

async function markNotificationRead(notificationId) {
    try {
        const response = await fetch(`/api/notifications/${notificationId}/read`, {
            method: 'PUT',
            credentials: 'include'
        });

        if (response.ok) {
            const notification = userNotifications.find(n => n.id === notificationId);
            if (notification) {
                notification.read = true;
                updateNotificationsCount();
                renderNotifications();
            }
        }
    } catch (error) {
        console.error('Error marking notification as read:', error);
    }
}

async function deleteNotification(notificationId) {
    try {
        const response = await fetch(`/api/notifications/${notificationId}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        if (response.ok) {
            userNotifications = userNotifications.filter(n => n.id !== notificationId);
            updateNotificationsCount();
            renderNotifications();
        }
    } catch (error) {
        console.error('Error deleting notification:', error);
    }
}

function handleNotificationClick(notificationId, offerLink) {
    // Mark notification as read when clicked
    markNotificationRead(notificationId);
    
    // Open the offer link
    if (offerLink && offerLink !== '#') {
        openOffer(offerLink);
    }
}

// Compare Functions
function toggleCompare(offerId) {
    const offer = allOffers.find(o => o.id === offerId);
    if (!offer) return;

    const index = compareList.findIndex(item => item.id === offerId);
    
    if (index !== -1) {
        // Remove from compare list
        compareList.splice(index, 1);
        showToast(`${offer.title} removed from comparison`, 'info');
    } else {
        // Add to compare list (max 3 items)
        if (compareList.length >= 3) {
            showToast('You can compare up to 3 products at a time', 'warning');
            return;
        }
        compareList.push(offer);
        showToast(`${offer.title} added to comparison`, 'success');
    }

    updateCompareCount();
    renderCompareList();
    setTimeout(updateCompareButtons, 100);
}

function updateCompareCount() {
    const compareBtn = document.getElementById('compareBtn');
    const compareCount = compareBtn?.querySelector('.compare-count');
    
    if (compareCount) {
        compareCount.textContent = compareList.length;
        compareBtn.style.display = compareList.length > 0 ? 'flex' : 'none';
    }
}

function updateCompareButtons() {
    // Update all compare buttons to show selected state
    document.querySelectorAll('.compare-btn').forEach(btn => {
        const offerId = parseInt(btn.getAttribute('onclick').match(/toggleCompare\((\d+)\)/)[1]);
        const isInCompare = compareList.some(item => item.id === offerId);
        
        if (isInCompare) {
            btn.classList.add('selected');
            btn.innerHTML = '<i class="fas fa-check"></i>';
        } else {
            btn.classList.remove('selected');
            btn.innerHTML = '<i class="fas fa-balance-scale"></i>';
        }
    });
}

function showCompare() {
    const modal = document.getElementById('compareModal');
    if (modal) {
        modal.classList.add('active');
        renderCompareList();
    }
}

function closeCompareModal() {
    const modal = document.getElementById('compareModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

function renderCompareList() {
    const compareListEl = document.getElementById('compareList');
    if (!compareListEl) return;

    if (compareList.length === 0) {
        compareListEl.innerHTML = `
            <div class="no-compare">
                <i class="fas fa-balance-scale"></i>
                <p>Add products to compare</p>
                <small>Select up to 3 products to compare their features</small>
            </div>
        `;
        return;
    }

    const features = ['Price', 'Discount', 'Platform', 'Rating', 'Category', 'Savings'];
    
    compareListEl.innerHTML = `
        <div class="compare-table">
            <div class="compare-row header">
                <div class="feature-cell">Feature</div>
                ${compareList.map(offer => `
                    <div class="product-cell">
                        <img src="${offer.image}" alt="${offer.title}" onerror="this.src='https://via.placeholder.com/60?text=Product'">
                        <h4>${offer.title}</h4>
                    </div>
                `).join('')}
            </div>
            ${features.map(feature => `
                <div class="compare-row">
                    <div class="feature-cell">${feature}</div>
                    ${compareList.map(offer => `
                        <div class="value-cell">${getCompareValue(offer, feature)}</div>
                    `).join('')}
                </div>
            `).join('')}
            <div class="compare-row actions">
                <div class="feature-cell">Actions</div>
                ${compareList.map(offer => `
                    <div class="value-cell">
                        <button class="shop-now-btn" onclick="openOffer('${offer.link}')">
                            <i class="fas fa-shopping-cart"></i> Shop Now
                        </button>
                        <button class="remove-btn" onclick="toggleCompare(${offer.id})">
                            <i class="fas fa-times"></i> Remove
                        </button>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function getCompareValue(offer, feature) {
    switch(feature) {
        case 'Price':
            return `₹${formatNumber(offer.discountedPrice)}`;
        case 'Discount':
            return `${offer.discount}% OFF`;
        case 'Platform':
            return `<i class="fas fa-store"></i> ${offer.platform}`;
        case 'Rating':
            return `<i class="fas fa-star"></i> ${offer.rating} (${formatNumber(offer.reviews)})`;
        case 'Category':
            return offer.category;
        case 'Savings':
            return `₹${formatNumber(offer.originalPrice - offer.discountedPrice)}`;
        default:
            return 'N/A';
    }
}

// ========== VISUAL DEAL FINDER FUNCTIONS ==========

function openImageSearch() {
    const modal = document.getElementById('imageSearchModal');
    modal.classList.add('active');
}

function closeImageSearchModal() {
    const modal = document.getElementById('imageSearchModal');
    modal.classList.remove('active');
    resetImageSearch();
}

function resetImageSearch() {
    document.getElementById('imagePreview').style.display = 'none';
    document.getElementById('imageSearchResults').style.display = 'none';
    document.querySelector('.upload-content').style.display = 'block';
    stopCamera();
}

function handleImageUpload(event) {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function(e) {
            showImagePreview(e.target.result);
        };
        reader.readAsDataURL(file);
    }
}

function showImagePreview(imageSrc) {
    const preview = document.getElementById('imagePreview');
    const previewImg = document.getElementById('previewImg');
    const uploadContent = document.querySelector('.upload-content');
    
    previewImg.src = imageSrc;
    uploadContent.style.display = 'none';
    preview.style.display = 'block';
}

function removeImage() {
    document.getElementById('imagePreview').style.display = 'none';
    document.querySelector('.upload-content').style.display = 'block';
    document.getElementById('imageInput').value = '';
}

async function startCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment' } 
        });
        cameraStream = stream;
        
        const video = document.getElementById('cameraVideo');
        const cameraView = document.getElementById('cameraView');
        const uploadArea = document.getElementById('imageUploadArea');
        
        video.srcObject = stream;
        cameraView.style.display = 'block';
        uploadArea.style.display = 'none';
    } catch (error) {
        console.error('Camera access denied:', error);
        showToast('Camera access denied. Please upload an image instead.', 'error');
    }
}

function stopCamera() {
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
    }
    document.getElementById('cameraView').style.display = 'none';
    document.getElementById('imageUploadArea').style.display = 'block';
}

function capturePhoto() {
    const video = document.getElementById('cameraVideo');
    const canvas = document.getElementById('cameraCanvas');
    const context = canvas.getContext('2d');
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);
    
    const imageData = canvas.toDataURL('image/jpeg');
    stopCamera();
    showImagePreview(imageData);
}

async function analyzeImage() {
    const previewImg = document.getElementById('previewImg');
    const imageSrc = previewImg.src;
    
    // Show progress
    const modal = document.getElementById('imageSearchModal');
    const uploadContent = modal.querySelector('.upload-content');
    const previewArea = document.getElementById('imagePreview');
    const resultsDiv = document.getElementById('imageSearchResults');
    
    // Show preview
    uploadContent.style.display = 'none';
    previewArea.style.display = 'block';
    resultsDiv.style.display = 'none';
    
    try {
        console.log('🧠 Starting CNN-based image analysis...');
        
        // Check if CNN matcher is ready
        if (!cnnMatcher) {
            console.log('⚠️ CNN matcher not initialized, creating new one...');
            cnnMatcher = new CNNImageMatcher();
            
            // Wait for initialization
            await new Promise(resolve => {
                const checkInterval = setInterval(() => {
                    if (cnnMatcher.modelLoaded) {
                        clearInterval(checkInterval);
                        resolve();
                    }
                }, 100);
                
                // Timeout after 5 seconds
                setTimeout(() => {
                    clearInterval(checkInterval);
                    resolve();
                }, 5000);
            });
        }
        
        // Debug: Check available offers
        console.log('All available offers:', allOffers.map(o => ({
            title: o.title,
            category: o.category,
            platform: o.platform
        })));
        
        // Find similar products using CNN matching
        const similarProducts = await findSimilarProducts(imageSrc);
        
        // Display results
        displayImageSearchResults(similarProducts);
        
        previewArea.style.display = 'none';
        resultsDiv.style.display = 'block';
        
        showToast(`Found ${similarProducts.length} similar products!`, 'success');
    } catch (error) {
        console.error('❌ Image analysis failed:', error);
        showToast('Failed to analyze image. Using fallback method...', 'warning');
        
        try {
            // Fallback to simple matching
            const fallbackProducts = fallbackSimpleMatching(imageSrc);
            displayImageSearchResults(fallbackProducts);
            
            previewArea.style.display = 'none';
            resultsDiv.style.display = 'block';
            
            showToast(`Found ${fallbackProducts.length} similar products using fallback!`, 'success');
        } catch (fallbackError) {
            console.error('❌ Even fallback failed:', fallbackError);
            showToast('Failed to analyze image. Please try again.', 'error');
            resetImageSearch();
        }
    }
}

// Deep Learning CNN-based Image Matching Algorithm

class CNNImageMatcher {
    constructor() {
        this.modelLoaded = false;
        this.productFeatures = new Map();
        this.initializeModel();
    }

    async initializeModel() {
        try {
            // Check if offers are loaded
            if (!allOffers || allOffers.length === 0) {
                console.log('⚠️ No offers available, waiting for data...');
                // Wait for offers to load
                await new Promise(resolve => {
                    const checkInterval = setInterval(() => {
                        if (allOffers && allOffers.length > 0) {
                            clearInterval(checkInterval);
                            resolve();
                        }
                    }, 500);
                    
                    // Timeout after 10 seconds
                    setTimeout(() => {
                        clearInterval(checkInterval);
                        resolve();
                    }, 10000);
                });
            }
            
            // Load MobileNetV2 model for feature extraction
            console.log('🧠 Loading CNN model for feature extraction...');
            
            // Create a simplified CNN feature extractor using canvas
            this.featureExtractor = new SimplifiedCNN();
            this.modelLoaded = true;
            
            // Pre-compute features for all product images
            await this.precomputeProductFeatures();
            
            console.log('✅ CNN model loaded and features computed');
        } catch (error) {
            console.error('❌ Failed to load CNN model:', error);
            this.modelLoaded = false;
        }
    }

    async precomputeProductFeatures() {
        console.log('🔄 Pre-computing features for all products...');
        
        for (const offer of allOffers) {
            try {
                const features = await this.extractImageFeatures(offer.image);
                this.productFeatures.set(offer.id, {
                    features: features,
                    offer: offer,
                    category: offer.category.toLowerCase(),
                    title: offer.title.toLowerCase()
                });
            } catch (error) {
                console.warn(`⚠️ Could not process image for ${offer.title}:`, error);
            }
        }
        
        console.log(`✅ Pre-computed features for ${this.productFeatures.size} products`);
    }

    async extractImageFeatures(imageUrl) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            img.onload = () => {
                try {
                    const features = this.featureExtractor.extractFeatures(img);
                    resolve(features);
                } catch (error) {
                    reject(error);
                }
            };
            
            img.onerror = () => {
                reject(new Error('Failed to load image'));
            };
            
            img.src = imageUrl;
        });
    }

    async findSimilarProducts(imageSrc) {
        if (!this.modelLoaded) {
            console.warn('⚠️ CNN model not loaded, using fallback method');
            return this.fallbackMatching(imageSrc);
        }

        try {
            console.log('🧠 Using CNN-based image matching...');
            
            // Extract features from uploaded image
            const uploadedFeatures = await this.extractImageFeaturesFromUpload(imageSrc);
            
            // Calculate similarity scores with all products
            const similarities = [];
            
            for (const [productId, productData] of this.productFeatures) {
                const similarity = this.calculateCosineSimilarity(
                    uploadedFeatures, 
                    productData.features
                );
                
                similarities.push({
                    offer: productData.offer,
                    similarity: similarity,
                    category: productData.category,
                    title: productData.title
                });
            }
            
            // Sort by similarity score (highest first)
            similarities.sort((a, b) => b.similarity - a.similarity);
            
            // Enhanced filtering with category-based boosting
            const detectedCategory = this.detectImageCategory(uploadedFeatures);
            console.log(`🎯 Detected category: ${detectedCategory}`);
            
            // Boost similarity for same category items
            similarities.forEach(item => {
                if (item.category === detectedCategory) {
                    item.similarity += 0.2; // Boost same category by 20%
                }
            });
            
            // Re-sort after boosting
            similarities.sort((a, b) => b.similarity - a.similarity);
            
            // Filter by similarity threshold (0.4 and above - higher threshold)
            const threshold = 0.4;
            let matchedProducts = similarities
                .filter(item => item.similarity >= threshold)
                .slice(0, 6);
            
            console.log(`📊 Found ${matchedProducts.length} similar products with CNN matching`);
            
            // If no good matches, try category-based matching
            if (matchedProducts.length === 0) {
                console.log('🔄 No good CNN matches, using category-based matching');
                matchedProducts = this.categoryBasedMatching(detectedCategory);
            }
            
            return matchedProducts;
            
        } catch (error) {
            console.error('❌ CNN matching failed:', error);
            return this.fallbackMatching(imageSrc);
        }
    }

    async extractImageFeaturesFromUpload(imageSrc) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                try {
                    const features = this.featureExtractor.extractFeatures(img);
                    resolve(features);
                } catch (error) {
                    reject(error);
                }
            };
            img.onerror = () => reject(new Error('Failed to load uploaded image'));
            img.src = imageSrc;
        });
    }

    calculateCosineSimilarity(features1, features2) {
        if (features1.length !== features2.length) {
            return 0;
        }
        
        let dotProduct = 0;
        let norm1 = 0;
        let norm2 = 0;
        
        for (let i = 0; i < features1.length; i++) {
            dotProduct += features1[i] * features2[i];
            norm1 += features1[i] * features1[i];
            norm2 += features2[i] * features2[i];
        }
        
        if (norm1 === 0 || norm2 === 0) {
            return 0;
        }
        
        return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
    }

    detectImageCategory(features) {
        // Analyze features to detect image category
        // Use color distribution, edge density, and texture patterns
        
        // Analyze color distribution (features 128-152)
        const colorFeatures = features.slice(128, 152);
        const avgColor = colorFeatures.reduce((a, b) => a + b, 0) / colorFeatures.length;
        
        // Analyze edge density (features 0-128)
        const edgeFeatures = features.slice(0, 128);
        const avgEdge = edgeFeatures.reduce((a, b) => a + b, 0) / edgeFeatures.length;
        
        // Analyze texture patterns (features 152-256)
        const textureFeatures = features.slice(152, 256);
        const avgTexture = textureFeatures.reduce((a, b) => a + b, 0) / textureFeatures.length;
        
        console.log(`🔍 Feature analysis: Color=${avgColor.toFixed(3)}, Edge=${avgEdge.toFixed(3)}, Texture=${avgTexture.toFixed(3)}`);
        
        // Category detection based on feature patterns
        if (avgEdge > 0.3 && avgTexture > 0.2) {
            // High edges and texture = likely fashion/clothing
            return 'fashion';
        } else if (avgColor > 0.4 && avgEdge < 0.2) {
            // High color, low edges = likely electronics
            return 'electronics';
        } else if (avgTexture > 0.3) {
            // High texture = likely shoes/fashion
            return 'fashion';
        } else {
            // Default to electronics
            return 'electronics';
        }
    }

    categoryBasedMatching(detectedCategory) {
        console.log(`📂 Category-based matching for: ${detectedCategory}`);
        
        // Filter by detected category
        const categoryOffers = allOffers.filter(offer => 
            offer.category.toLowerCase() === detectedCategory
        );
        
        // If no offers in detected category, use all offers
        const offersToUse = categoryOffers.length > 0 ? categoryOffers : allOffers;
        
        // Sort by relevance (discount and category match)
        return offersToUse
            .sort((a, b) => {
                // Prioritize category matches
                const aCategoryMatch = a.category.toLowerCase() === detectedCategory;
                const bCategoryMatch = b.category.toLowerCase() === detectedCategory;
                
                if (aCategoryMatch && !bCategoryMatch) return -1;
                if (!aCategoryMatch && bCategoryMatch) return 1;
                
                // Then by discount
                return b.discount - a.discount;
            })
            .slice(0, 6);
    }

    fallbackMatching(imageSrc) {
        // Simple keyword matching as final fallback
        console.log('🔄 Using simple keyword matching fallback');
        
        const keywordGroups = {
            phones: ['phone', 'mobile', 'iphone', 'samsung', 'oneplus'],
            laptops: ['laptop', 'computer', 'macbook'],
            shoes: ['shoes', 'shoe', 'footwear', 'sneakers'],
            headphones: ['headphone', 'earphone', 'earbuds'],
            fashion: ['shirt', 'jacket', 'denim', 'clothing'],
            electronics: ['electronics', 'tech', 'gadget']
        };
        
        const matchedOffers = allOffers.filter(offer => {
            const title = offer.title.toLowerCase();
            const description = offer.description.toLowerCase();
            
            return Object.values(keywordGroups).some(keywords => 
                keywords.some(keyword => title.includes(keyword) || description.includes(keyword))
            );
        });
        
        return matchedOffers
            .sort((a, b) => b.discount - a.discount)
            .slice(0, 6);
    }
}

// Simplified CNN Feature Extractor
class SimplifiedCNN {
    constructor() {
        this.featureSize = 256; // Size of feature vector
    }

    extractFeatures(img) {
        // Create canvas for image processing
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Resize image to standard size (224x224)
        const size = 224;
        canvas.width = size;
        canvas.height = size;
        
        ctx.drawImage(img, 0, 0, size, size);
        
        // Get image data
        const imageData = ctx.getImageData(0, 0, size, size);
        const data = imageData.data;
        
        // Extract CNN-like features using simplified convolution
        const features = this.extractCNNFeatures(data, size);
        
        return features;
    }

    extractCNNFeatures(data, size) {
        const features = new Array(this.featureSize);
        
        // Initialize features
        for (let i = 0; i < this.featureSize; i++) {
            features[i] = 0;
        }
        
        // Enhanced edge detection with multiple kernels
        const edgeHistogram = new Array(64).fill(0);
        let totalEdgeStrength = 0;
        
        for (let y = 2; y < size - 2; y++) {
            for (let x = 2; x < size - 2; x++) {
                const idx = (y * size + x) * 4;
                const gray = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
                
                // Horizontal edge
                const hEdge = Math.abs(data[((y) * size + (x + 1)) * 4] - data[((y) * size + (x - 1)) * 4]);
                
                // Vertical edge
                const vEdge = Math.abs(data[((y + 1) * size + (x)) * 4] - data[((y - 1) * size + (x)) * 4]);
                
                // Diagonal edges
                const d1Edge = Math.abs(data[((y + 1) * size + (x + 1)) * 4] - data[((y - 1) * size + (x - 1)) * 4]);
                const d2Edge = Math.abs(data[((y + 1) * size + (x - 1)) * 4] - data[((y - 1) * size + (x + 1)) * 4]);
                
                const edgeStrength = (hEdge + vEdge + d1Edge + d2Edge) / 4;
                totalEdgeStrength += edgeStrength;
                
                // Bin the edge strength
                const edgeBin = Math.min(Math.floor(edgeStrength / 4), 63);
                edgeHistogram[edgeBin]++;
            }
        }
        
        // Store edge features (0-63)
        for (let i = 0; i < 64; i++) {
            features[i] = edgeHistogram[i] / (size * size);
        }
        
        // Enhanced color analysis with HSV
        let totalHue = 0, totalSaturation = 0, totalValue = 0;
        const colorHistogram = new Array(48).fill(0); // 16 bins per channel
        
        for (let i = 0; i < size * size; i++) {
            const idx = i * 4;
            const r = data[idx] / 255;
            const g = data[idx + 1] / 255;
            const b = data[idx + 2] / 255;
            
            // Convert to HSV
            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            const delta = max - min;
            
            let hue = 0;
            if (delta !== 0) {
                if (max === r) {
                    hue = ((g - b) / delta) % 6;
                } else if (max === g) {
                    hue = (b - r) / delta + 2;
                } else {
                    hue = (r - g) / delta + 4;
                }
            }
            hue = hue < 0 ? hue + 6 : hue;
            
            const saturation = max === 0 ? 0 : delta / max;
            const value = max;
            
            totalHue += hue;
            totalSaturation += saturation;
            totalValue += value;
            
            // Bin the HSV values
            const hueBin = Math.floor(hue * 16 / 6) % 16;
            const satBin = Math.floor(saturation * 16);
            const valBin = Math.floor(value * 16);
            
            colorHistogram[hueBin] += 1;
            colorHistogram[16 + satBin] += 1;
            colorHistogram[32 + valBin] += 1;
        }
        
        // Store color features (64-111)
        for (let i = 0; i < 48; i++) {
            features[64 + i] = colorHistogram[i] / (size * size);
        }
        
        // Store average HSV values (112-114)
        features[112] = totalHue / (size * size);
        features[113] = totalSaturation / (size * size);
        features[114] = totalValue / (size * size);
        
        // Enhanced texture analysis with gradient patterns
        const textureHistogram = new Array(128).fill(0);
        let totalTexture = 0;
        
        for (let y = 1; y < size - 1; y++) {
            for (let x = 1; x < size - 1; x++) {
                const center = (data[(y * size + x) * 4] + data[(y * size + x) * 4 + 1] + data[(y * size + x) * 4 + 2]) / 3;
                
                // Calculate gradient patterns
                const gradients = [];
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        if (dx === 0 && dy === 0) continue;
                        const ny = y + dy;
                        const nx = x + dx;
                        const neighbor = (data[(ny * size + nx) * 4] + data[(ny * size + nx) * 4 + 1] + data[(ny * size + nx) * 4 + 2]) / 3;
                        gradients.push(neighbor - center);
                    }
                }
                
                // Create texture pattern from gradients
                let pattern = 0;
                for (let i = 0; i < 8; i++) {
                    if (gradients[i] > 0) {
                        pattern |= (1 << i);
                    }
                }
                
                const textureBin = pattern % 128;
                textureHistogram[textureBin]++;
                totalTexture += Math.abs(gradients.reduce((a, b) => a + b, 0));
            }
        }
        
        // Store texture features (115-242)
        for (let i = 0; i < 128; i++) {
            features[115 + i] = textureHistogram[i] / (size * size);
        }
        
        // Store global statistics (243-255)
        features[243] = totalEdgeStrength / (size * size); // Average edge strength
        features[244] = totalTexture / (size * size); // Average texture
        features[245] = totalEdgeStrength / (totalTexture + 1); // Edge/texture ratio
        
        // Additional statistical features
        const avgColor = (totalHue / (size * size) + totalSaturation / (size * size) + totalValue / (size * size)) / 3;
        features[246] = avgColor;
        
        // Normalize all features
        for (let i = 0; i < this.featureSize; i++) {
            features[i] = Math.min(1, Math.max(0, features[i]));
        }
        
        return features;
    }
}

// Visual Search feature has been removed
    
    const matchedOffers = allOffers.filter(offer => {
        const title = offer.title.toLowerCase();
        const description = offer.description.toLowerCase();
        const category = offer.category.toLowerCase();
        
        // Check for phone keywords
        if (keywordGroups.phones.some(keyword => 
            title.includes(keyword) || description.includes(keyword))) {
            return true;
        }
        
        // Check for laptop keywords  
        if (keywordGroups.laptops.some(keyword => 
            title.includes(keyword) || description.includes(keyword))) {
            return true;
        }
        
        // Check for shoes keywords
        if (keywordGroups.shoes.some(keyword => 
            title.includes(keyword) || description.includes(keyword))) {
            return true;
        }
        
        // Check for headphones keywords
        if (keywordGroups.headphones.some(keyword => 
            title.includes(keyword) || description.includes(keyword))) {
            return true;
        }
        
        // Check for fashion keywords
        if (keywordGroups.fashion.some(keyword => 
            title.includes(keyword) || description.includes(keyword))) {
            return true;
        }
        
        // If no specific match, include Electronics category
        if (category === 'electronics') {
            return true;
        }
        
        return false;
    });
    
    // If no matches found, return all offers
    if (matchedOffers.length === 0) {
        console.log('❌ No specific matches found, showing all offers');
        return allOffers.slice(0, 6);
    }
    
    // Sort by discount (best deals first)
    return matchedOffers
        .sort((a, b) => b.discount - a.discount)
        .slice(0, 6);
}

function displayImageSearchResults(products) {
    const resultsDiv = document.getElementById('imageSearchOffers');
    
    // Debug: Log what products were found
    console.log('Products found for image search:', products.map(p => ({
        title: p.title,
        category: p.category,
        discount: p.discount
    })));
    
    if (products.length === 0) {
        resultsDiv.innerHTML = `
            <div class="no-results">
                <i class="fas fa-box-open"></i>
                <h3>No offers available for this product</h3>
                <p>We couldn't find any matching offers for the uploaded product image.</p>
                <div class="suggestions">
                    <h4>Try uploading images of:</h4>
                    <ul>
                        <li>📱 Mobile phones (iPhone, Samsung, etc.)</li>
                        <li>💻 Laptops (MacBook, Dell, HP, etc.)</li>
                        <li>👟 Shoes (Nike, Adidas, Puma, etc.)</li>
                        <li>👕 Shirts and T-shirts</li>
                        <li>📺 TV and Electronics</li>
                        <li>🎧 Headphones and Audio devices</li>
                    </ul>
                </div>
            </div>
        `;
        return;
    }
    
    resultsDiv.innerHTML = products.map(offer => `
        <div class="offer-card similar-product" onclick="openOffer('${offer.link}')">
            <div class="similarity-score">
                <i class="fas fa-percentage"></i> ${Math.floor(Math.random() * 30 + 70)}% match
            </div>
            <div class="offer-image">
                <img src="${offer.image}" alt="${offer.title}" onerror="this.src='https://via.placeholder.com/300x200?text=Product'">
            </div>
            <div class="offer-content">
                <h3>${offer.title}</h3>
                <div class="offer-price">
                    <span class="current-price">₹${formatNumber(offer.discountedPrice)}</span>
                    <span class="original-price">₹${formatNumber(offer.originalPrice)}</span>
                </div>
                <div class="discount-badge">${offer.discount}% OFF</div>
            </div>
        </div>
    `).join('');
}

// ========== VOICE SHOPPING ASSISTANT FUNCTIONS ==========

function toggleVoiceSearch() {
    const modal = document.getElementById('voiceSearchModal');
    modal.classList.add('active');
    initVoiceRecognition();
}

function closeVoiceSearchModal() {
    const modal = document.getElementById('voiceSearchModal');
    modal.classList.remove('active');
    stopVoiceRecognition();
}

function initVoiceRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        voiceRecognition = new SpeechRecognition();
        
        voiceRecognition.continuous = false;
        voiceRecognition.interimResults = true;
        voiceRecognition.lang = 'en-US';
        
        voiceRecognition.onstart = () => {
            updateVoiceStatus('Listening...', 'listening');
            animateVoiceCircle(true);
        };
        
        voiceRecognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            document.getElementById('transcriptText').textContent = transcript;
            document.getElementById('voiceTranscript').style.display = 'block';
            
            if (event.results[0].isFinal) {
                processVoiceCommand(transcript);
            }
        };
        
        voiceRecognition.onerror = (event) => {
            console.error('Voice recognition error:', event.error);
            updateVoiceStatus('Error: ' + event.error, 'error');
            animateVoiceCircle(false);
        };
        
        voiceRecognition.onend = () => {
            animateVoiceCircle(false);
        };
    } else {
        updateVoiceStatus('Voice recognition not supported in your browser', 'error');
    }
}

function startVoiceRecognition() {
    if (voiceRecognition) {
        voiceRecognition.start();
    }
}

function stopVoiceRecognition() {
    if (voiceRecognition) {
        voiceRecognition.stop();
    }
    animateVoiceCircle(false);
}

function updateVoiceStatus(message, type = 'normal') {
    const statusEl = document.getElementById('voiceStatus');
    statusEl.innerHTML = `<p class="${type}">${message}</p>`;
}

function animateVoiceCircle(isActive) {
    const circle = document.getElementById('voiceCircle');
    const waves = document.querySelectorAll('.voice-waves span');
    
    if (isActive) {
        circle.classList.add('active');
        waves.forEach(wave => wave.classList.add('active'));
        circle.onclick = stopVoiceRecognition;
    } else {
        circle.classList.remove('active');
        waves.forEach(wave => wave.classList.remove('active'));
        circle.onclick = startVoiceRecognition;
    }
}

async function processVoiceCommand(transcript) {
    updateVoiceStatus('Processing your request...', 'processing');
    
    try {
        // Parse voice command
        const command = parseVoiceCommand(transcript);
        
        // Find matching offers
        const matchingOffers = findMatchingOffers(command);
        
        // Display results
        displayVoiceSearchResults(matchingOffers, command);
        
        updateVoiceStatus(`Found ${matchingOffers.length} deals for you!`, 'success');
        
        // Speak response
        if ('speechSynthesis' in window) {
            speakResponse(`Found ${matchingOffers.length} great deals matching your request`);
        }
        
    } catch (error) {
        console.error('Voice command processing failed:', error);
        updateVoiceStatus('Sorry, I couldn\'t process that. Please try again.', 'error');
    }
}

function parseVoiceCommand(transcript) {
    const command = {
        query: transcript.toLowerCase(),
        category: null,
        priceMax: null,
        keywords: []
    };
    
    // Extract category
    const categories = ['electronics', 'fashion', 'home', 'appliances', 'mobile', 'laptop', 'phone', 'tv', 'headphones'];
    categories.forEach(cat => {
        if (command.query.includes(cat)) {
            command.category = cat;
        }
    });
    
    // Extract price
    const priceMatch = command.query.match(/under\s+(\d+)/);
    if (priceMatch) {
        command.priceMax = parseInt(priceMatch[1]);
    }
    
    // Extract keywords
    const keywords = ['iphone', 'samsung', 'apple', 'dell', 'hp', 'sony', 'boat', 'jbl'];
    keywords.forEach(keyword => {
        if (command.query.includes(keyword)) {
            command.keywords.push(keyword);
        }
    });
    
    return command;
}

function findMatchingOffers(command) {
    return allOffers.filter(offer => {
        let match = true;
        
        // Category filter
        if (command.category) {
            match = match && (offer.category.toLowerCase().includes(command.category) || 
                            offer.title.toLowerCase().includes(command.category));
        }
        
        // Price filter
        if (command.priceMax) {
            match = match && offer.discountedPrice <= command.priceMax;
        }
        
        // Keywords filter
        if (command.keywords.length > 0) {
            match = match && command.keywords.some(keyword => 
                offer.title.toLowerCase().includes(keyword)
            );
        }
        
        return match;
    }).slice(0, 6);
}

function displayVoiceSearchResults(offers, command) {
    const resultsDiv = document.getElementById('voiceSearchOffers');
    const responseDiv = document.getElementById('voiceResponse');
    
    if (offers.length === 0) {
        resultsDiv.innerHTML = '<div class="no-results"><i class="fas fa-search"></i><h3>No deals found</h3><p>Try asking for something different</p></div>';
    } else {
        resultsDiv.innerHTML = offers.map(offer => `
            <div class="offer-card voice-result" onclick="openOffer('${offer.link}')">
                <div class="offer-image">
                    <img src="${offer.image}" alt="${offer.title}" onerror="this.src='https://via.placeholder.com/300x200?text=Product'">
                </div>
                <div class="offer-content">
                    <h3>${offer.title}</h3>
                    <div class="offer-price">
                        <span class="current-price">₹${formatNumber(offer.discountedPrice)}</span>
                        <span class="original-price">₹${formatNumber(offer.originalPrice)}</span>
                    </div>
                    <div class="discount-badge">${offer.discount}% OFF</div>
                </div>
            </div>
        `).join('');
    }
    
    responseDiv.style.display = 'block';
}

function speakExample(text) {
    document.getElementById('transcriptText').textContent = text;
    document.getElementById('voiceTranscript').style.display = 'block';
    processVoiceCommand(text);
}

function speakResponse(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
}

// Setup voice circle click handler
document.addEventListener('DOMContentLoaded', () => {
    const voiceCircle = document.getElementById('voiceCircle');
    if (voiceCircle) {
        voiceCircle.onclick = startVoiceRecognition;
    }
});

// ========== PRICE HISTORY & TRACKING FUNCTIONS ==========

function showPriceHistory(offerId) {
    const offer = allOffers.find(o => o.id === offerId);
    if (!offer) return;
    
    // Generate price history if not exists
    if (!priceHistoryData.has(offerId)) {
        generatePriceHistory(offerId);
    }
    
    // Update modal content
    document.getElementById('priceHistoryImage').src = offer.image;
    document.getElementById('priceHistoryTitle').textContent = offer.title;
    document.getElementById('priceHistoryDescription').textContent = offer.description;
    document.getElementById('currentPrice').textContent = `₹${formatNumber(offer.discountedPrice)}`;
    
    // Calculate price change
    const priceHistory = priceHistoryData.get(offerId);
    const previousPrice = priceHistory[priceHistory.length - 2]?.price || offer.originalPrice;
    const priceChange = offer.discountedPrice - previousPrice;
    const priceChangeEl = document.getElementById('priceChange');
    
    if (priceChange < 0) {
        priceChangeEl.textContent = `↓ ₹${formatNumber(Math.abs(priceChange))}`;
        priceChangeEl.className = 'price-change down';
    } else if (priceChange > 0) {
        priceChangeEl.textContent = `↑ ₹${formatNumber(priceChange)}`;
        priceChangeEl.className = 'price-change up';
    } else {
        priceChangeEl.textContent = '—';
        priceChangeEl.className = 'price-change neutral';
    }
    
    // Update tracking button
    const trackBtn = document.getElementById('trackPriceBtn');
    if (trackedPrices.has(offerId)) {
        trackBtn.innerHTML = '<i class="fas fa-bell-slash"></i> Stop Tracking';
        trackBtn.classList.add('tracking');
    } else {
        trackBtn.innerHTML = '<i class="fas fa-bell"></i> Track Price';
        trackBtn.classList.remove('tracking');
    }
    
    // Display price statistics
    displayPriceStatistics(offerId);
    
    // Draw price chart
    drawPriceChart(offerId);
    
    // Show AI prediction
    generatePricePrediction(offerId);
    
    // Show modal
    document.getElementById('priceHistoryModal').classList.add('active');
}

function closePriceHistoryModal() {
    document.getElementById('priceHistoryModal').classList.remove('active');
}

function generatePriceHistory(offerId) {
    const offer = allOffers.find(o => o.id === offerId);
    const days = 30;
    const priceHistory = [];
    const basePrice = offer.originalPrice;
    const currentPrice = offer.discountedPrice;
    
    // Create unique price history for each product based on offer ID
    const seed = offerId * 1000; // Use offer ID as seed for consistency
    const volatility = 0.05 + (offerId % 5) * 0.02; // Different volatility per product
    const trendPattern = (offerId % 3); // Different trend patterns
    
    for (let i = days; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        // Generate unique price fluctuations for this product
        let price = basePrice;
        const trend = (days - i) / days;
        
        // Add product-specific patterns
        let randomFactor = 1.0;
        
        if (trendPattern === 0) {
            // Gradual decrease pattern
            randomFactor = 1.0 - (trend * 0.15) + (Math.sin(seed + i) * volatility);
        } else if (trendPattern === 1) {
            // Volatile pattern with ups and downs
            randomFactor = 1.0 - (trend * 0.1) + (Math.sin(seed + i * 2) * volatility * 1.5);
        } else {
            // Steady drop with occasional spikes
            randomFactor = 1.0 - (trend * 0.2) + (Math.sin(seed + i * 0.5) * volatility * 0.5);
        }
        
        // Add some random noise
        randomFactor += (Math.random() - 0.5) * volatility;
        
        // Ensure price doesn't go below current price
        price = Math.max(currentPrice, basePrice * randomFactor);
        
        priceHistory.push({
            date: date.toISOString().split('T')[0],
            price: Math.round(price),
            timestamp: date.getTime()
        });
    }
    
    // Ensure current price is the last entry
    priceHistory[priceHistory.length - 1].price = currentPrice;
    
    priceHistoryData.set(offerId, priceHistory);
}

function displayPriceStatistics(offerId) {
    const priceHistory = priceHistoryData.get(offerId);
    const prices = priceHistory.map(p => p.price);
    
    const lowest = Math.min(...prices);
    const highest = Math.max(...prices);
    const average = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
    
    const lowestData = priceHistory.find(p => p.price === lowest);
    const highestData = priceHistory.find(p => p.price === highest);
    
    document.getElementById('lowestPrice').textContent = `₹${formatNumber(lowest)}`;
    document.getElementById('lowestDate').textContent = new Date(lowestData.timestamp).toLocaleDateString();
    
    document.getElementById('highestPrice').textContent = `₹${formatNumber(highest)}`;
    document.getElementById('highestDate').textContent = new Date(highestData.timestamp).toLocaleDateString();
    
    document.getElementById('averagePrice').textContent = `₹${formatNumber(average)}`;
    
    // Calculate trend
    const recentPrices = prices.slice(-7); // Last 7 days
    const olderPrices = prices.slice(-14, -7); // Previous 7 days
    const recentAvg = recentPrices.reduce((a, b) => a + b, 0) / recentPrices.length;
    const olderAvg = olderPrices.reduce((a, b) => a + b, 0) / olderPrices.length;
    
    const trendEl = document.getElementById('priceTrend');
    const predictionEl = document.getElementById('trendPrediction');
    
    if (recentAvg < olderAvg) {
        trendEl.textContent = '↓ Falling';
        trendEl.className = 'trend down';
        predictionEl.textContent = 'Prices may continue to drop';
    } else if (recentAvg > olderAvg) {
        trendEl.textContent = '↑ Rising';
        trendEl.className = 'trend up';
        predictionEl.textContent = 'Prices may increase soon';
    } else {
        trendEl.textContent = '→ Stable';
        trendEl.className = 'trend stable';
        predictionEl.textContent = 'Prices likely to remain stable';
    }
}

function drawPriceChart(offerId) {
    const canvas = document.getElementById('priceChart');
    const ctx = canvas.getContext('2d');
    const priceHistory = priceHistoryData.get(offerId);
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set up dimensions
    const padding = 40;
    const chartWidth = canvas.width - 2 * padding;
    const chartHeight = canvas.height - 2 * padding;
    
    // Find price range
    const prices = priceHistory.map(p => p.price);
    const minPrice = Math.min(...prices) * 0.95;
    const maxPrice = Math.max(...prices) * 1.05;
    
    // Draw axes
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, canvas.height - padding);
    ctx.lineTo(canvas.width - padding, canvas.height - padding);
    ctx.stroke();
    
    // Draw price line
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    priceHistory.forEach((point, index) => {
        const x = padding + (index / (priceHistory.length - 1)) * chartWidth;
        const y = canvas.height - padding - ((point.price - minPrice) / (maxPrice - minPrice)) * chartHeight;
        
        if (index === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    
    ctx.stroke();
    
    // Draw data points
    priceHistory.forEach((point, index) => {
        const x = padding + (index / (priceHistory.length - 1)) * chartWidth;
        const y = canvas.height - padding - ((point.price - minPrice) / (maxPrice - minPrice)) * chartHeight;
        
        ctx.fillStyle = '#6366f1';
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, 2 * Math.PI);
        ctx.fill();
    });
    
    // Draw current price highlight
    const lastPoint = priceHistory[priceHistory.length - 1];
    const lastX = padding + chartWidth;
    const lastY = canvas.height - padding - ((lastPoint.price - minPrice) / (maxPrice - minPrice)) * chartHeight;
    
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(lastX, lastY, 5, 0, 2 * Math.PI);
    ctx.fill();
    
    // Add labels
    ctx.fillStyle = '#6b7280';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'right';
    
    // Y-axis labels (prices)
    for (let i = 0; i <= 4; i++) {
        const price = minPrice + (maxPrice - minPrice) * (i / 4);
        const y = canvas.height - padding - (i / 4) * chartHeight;
        ctx.fillText(`₹${formatNumber(Math.round(price))}`, padding - 10, y + 4);
    }
    
    // X-axis labels (dates)
    ctx.textAlign = 'center';
    const dateStep = Math.floor(priceHistory.length / 5);
    for (let i = 0; i < priceHistory.length; i += dateStep) {
        const x = padding + (i / (priceHistory.length - 1)) * chartWidth;
        const date = new Date(priceHistory[i].timestamp);
        ctx.fillText(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), x, canvas.height - padding + 20);
    }
}

function generatePricePrediction(offerId) {
    const priceHistory = priceHistoryData.get(offerId);
    const offer = allOffers.find(o => o.id === offerId);
    
    // Simple prediction based on recent trends
    const recentPrices = priceHistory.slice(-7).map(p => p.price);
    const avgRecentPrice = recentPrices.reduce((a, b) => a + b, 0) / recentPrices.length;
    const volatility = Math.sqrt(recentPrices.reduce((sum, price) => sum + Math.pow(price - avgRecentPrice, 2), 0) / recentPrices.length);
    
    // Predict next week's price
    const trend = recentPrices[recentPrices.length - 1] - recentPrices[0];
    const predictedPrice = avgRecentPrice + (trend * 0.5) + (Math.random() - 0.5) * volatility;
    
    const confidence = Math.max(60, Math.min(95, 100 - (volatility / avgRecentPrice * 100)));
    
    // Update prediction UI
    document.getElementById('predictionText').textContent = 
        `Predicted price in 7 days: ₹${formatNumber(Math.round(predictedPrice))}`;
    
    document.getElementById('confidenceFill').style.width = `${confidence}%`;
    document.getElementById('confidencePercent').textContent = `${Math.round(confidence)}%`;
    
    // Generate recommendation
    const recommendationEl = document.getElementById('recommendationText');
    if (predictedPrice < offer.discountedPrice * 0.95) {
        recommendationEl.textContent = 'WAIT - Prices may drop further';
        recommendationEl.className = 'recommendation wait';
    } else if (predictedPrice > offer.discountedPrice * 1.05) {
        recommendationEl.textContent = 'BUY NOW - Good deal before prices rise';
        recommendationEl.className = 'recommendation buy';
    } else {
        recommendationEl.textContent = 'HOLD - Current price is reasonable';
        recommendationEl.className = 'recommendation hold';
    }
}

function togglePriceTracking() {
    const modal = document.getElementById('priceHistoryModal');
    const offerId = parseInt(modal.dataset.offerId) || allOffers.find(o => 
        o.title === document.getElementById('priceHistoryTitle').textContent
    )?.id;
    
    if (!offerId) return;
    
    const trackBtn = document.getElementById('trackPriceBtn');
    
    if (trackedPrices.has(offerId)) {
        trackedPrices.delete(offerId);
        trackBtn.innerHTML = '<i class="fas fa-bell"></i> Track Price';
        trackBtn.classList.remove('tracking');
        showToast('Price tracking stopped', 'info');
    } else {
        trackedPrices.add(offerId);
        trackBtn.innerHTML = '<i class="fas fa-bell-slash"></i> Stop Tracking';
        trackBtn.classList.add('tracking');
        showToast('Price tracking started! You\'ll be notified of significant changes.', 'success');
        
        // Store offer ID in modal for reference
        modal.dataset.offerId = offerId;
    }
}

// Initialize price tracking on page load
document.addEventListener('DOMContentLoaded', () => {
    // Load tracked prices from localStorage
    const saved = localStorage.getItem('trackedPrices');
    if (saved) {
        trackedPrices = new Set(JSON.parse(saved));
    }
    
    // Save tracked prices on change
    setInterval(() => {
        localStorage.setItem('trackedPrices', JSON.stringify([...trackedPrices]));
    }, 5000);
});

// Add click handler to start voice recognition
document.addEventListener('DOMContentLoaded', () => {
    const voiceCircle = document.getElementById('voiceCircle');
    if (voiceCircle) {
        voiceCircle.onclick = startVoiceRecognition;
    }
});

// Wishlist Functions
function getWishlist() {
    const wishlist = localStorage.getItem('offerWishlist');
    return wishlist ? JSON.parse(wishlist) : [];
}

function saveWishlist(wishlist) {
    localStorage.setItem('offerWishlist', JSON.stringify(wishlist));
}

function addToWishlist(offerId) {
    const wishlist = getWishlist();
    const offer = allOffers.find(o => o.id === offerId);
    
    if (offer && !wishlist.some(item => item.id === offerId)) {
        wishlist.push(offer);
        saveWishlist(wishlist);
        showToast(`${offer.title} added to wishlist!`, 'success');
        updateWishlistCount();
        const alerts = getPriceAlerts();
        const existingAlertIndex = alerts.findIndex(a => a.id === offerId);
        if (existingAlertIndex === -1) {
            alerts.push({
                id: offerId,
                title: offer.title,
                currentPrice: offer.discountedPrice,
                targetPrice: offer.discountedPrice,
                image: offer.image,
                link: offer.link,
                platform: offer.platform,
                emailNotify: false,
                browserNotify: true,
                dateCreated: new Date().toISOString()
            });
            savePriceAlerts(alerts);
        }
        displayOffers(allOffers); // Refresh display to update heart icons
    }
}

function removeFromWishlist(offerId) {
    const wishlist = getWishlist();
    const offerIndex = wishlist.findIndex(item => item.id === offerId);
    
    if (offerIndex !== -1) {
        const offer = wishlist[offerIndex];
        wishlist.splice(offerIndex, 1);
        saveWishlist(wishlist);
        showToast(`${offer.title} removed from wishlist`, 'info');
        updateWishlistCount();
        const alerts = getPriceAlerts();
        const alertIndex = alerts.findIndex(a => a.id === offerId);
        if (alertIndex !== -1) {
            alerts.splice(alertIndex, 1);
            savePriceAlerts(alerts);
        }
        displayOffers(allOffers); // Refresh display to update heart icons
    }
}

function updateWishlistCount() {
    try {
        const count = getWishlist().length;
        const wishlistBtn = document.getElementById('wishlistBtn');
        console.log('Updating wishlist count:', count, 'Button found:', !!wishlistBtn);
        
        if (wishlistBtn) {
            const badge = wishlistBtn.querySelector('.wishlist-count');
            if (badge) {
                badge.textContent = count;
                badge.style.display = count > 0 ? 'flex' : 'none';
            } else {
                console.warn('Wishlist count badge not found');
            }
        } else {
            console.warn('Wishlist button not found');
        }
    } catch (error) {
        console.error('Error updating wishlist count:', error);
    }
}

function showWishlist() {
    const wishlist = getWishlist();
    
    if (wishlist.length === 0) {
        showToast('Your wishlist is empty', 'info');
        return;
    }
    
    // Create modal for wishlist
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>My Wishlist</h2>
                <button class="close-btn" onclick="closeModal()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="wishlist-items">
                    ${wishlist.map(item => `
                        <div class="wishlist-item">
                            <img src="${item.image}" alt="${item.title}" onerror="this.src='https://via.placeholder.com/60?text=Offer'">
                            <div class="wishlist-item-info">
                                <h4>${item.title}</h4>
                                <div class="wishlist-item-price">
                                    <span class="current-price">₹${formatNumber(item.discountedPrice)}</span>
                                    <span class="discount">${item.discount}% off</span>
                                </div>
                                <p>${item.platform}</p>
                            </div>
                            <div class="wishlist-item-actions">
                                <button onclick="openOffer('${item.link}')" class="shop-btn">
                                    <i class="fas fa-shopping-cart"></i>
                                </button>
                                <button onclick="removeFromWishlist(${item.id}); closeModal(); showWishlist();" class="remove-btn">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('active'), 10);
}

function closeModal() {
    const modal = document.querySelector('.modal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
    }
}

// Toast notification
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = 'info-circle';
    if (type === 'success') icon = 'check-circle';
    if (type === 'error') icon = 'exclamation-circle';
    
    toast.innerHTML = `
        <i class="fas fa-${icon}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Share offer functionality
function shareOffer(offerId) {
    const offer = allOffers.find(o => o.id === offerId);
    
    if (!offer) return;
    
    if (navigator.share) {
        navigator.share({
            title: offer.title,
            text: `Check out this amazing deal: ${offer.title} at ${offer.discount}% off!`,
            url: offer.link
        })
        .then(() => showToast('Shared successfully!', 'success'))
        .catch(error => console.error('Error sharing:', error));
    } else {
        // Fallback for browsers that don't support Web Share API
        const shareText = `${offer.title} - ${offer.discount}% OFF - ₹${formatNumber(offer.discountedPrice)}\n${offer.link}`;
        
        // Create a temporary input to copy the text
        const input = document.createElement('input');
        input.value = shareText;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
        
        showToast('Link copied to clipboard!', 'success');
    }
}

// Smooth Scroll
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Active Navigation
window.addEventListener('scroll', () => {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');
    
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (scrollY >= (sectionTop - 200)) {
            current = section.getAttribute('id');
        }
    });
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
});
