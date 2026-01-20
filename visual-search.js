// Visual Search JavaScript
let uploadedImage = null;

// Initialize visual search functionality
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔍 Visual Search page loaded');
    
    // Setup file upload
    const fileInput = document.getElementById('fileInput');
    const uploadArea = document.getElementById('uploadArea');
    
    // File input change handler
    fileInput.addEventListener('change', handleFileSelect);
    
    // Drag and drop handlers
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    
    // Click to upload
    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });
    
    // Enter key search
    document.getElementById('searchInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
});

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function(e) {
            uploadedImage = e.target.result;
            displayImagePreview(uploadedImage);
        };
        reader.readAsDataURL(file);
    }
}

function handleDragOver(event) {
    event.preventDefault();
    event.currentTarget.classList.add('dragover');
}

function handleDragLeave(event) {
    event.preventDefault();
    event.currentTarget.classList.remove('dragover');
}

function handleDrop(event) {
    event.preventDefault();
    event.currentTarget.classList.remove('dragover');
    
    const files = event.dataTransfer.files;
    if (files.length > 0 && files[0].type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function(e) {
            uploadedImage = e.target.result;
            displayImagePreview(uploadedImage);
        };
        reader.readAsDataURL(files[0]);
    }
}

function displayImagePreview(imageSrc) {
    const preview = document.getElementById('imagePreview');
    const previewImg = document.getElementById('previewImg');
    
    previewImg.src = imageSrc;
    preview.style.display = 'block';
    
    // Hide upload area
    document.getElementById('uploadArea').style.display = 'none';
    
    console.log('✅ Image preview displayed');
}

function clearImage() {
    uploadedImage = null;
    document.getElementById('imagePreview').style.display = 'none';
    document.getElementById('uploadArea').style.display = 'block';
    document.getElementById('fileInput').value = '';
    
    // Clear results
    vsHideResults();
    
    console.log('🗑️ Image cleared');
}

function performSearch() {
    const searchTerm = document.getElementById('searchInput').value.trim();
    const category = document.getElementById('categoryFilter').value;
    
    if (!searchTerm && !uploadedImage) {
        alert('Please enter a search term or upload an image');
        return;
    }
    
    if (searchTerm) {
        searchByText(searchTerm, category);
    } else if (uploadedImage) {
        searchByImage();
    }
}

function searchByText(searchTerm, category = '') {
    console.log(`🔍 Searching for: "${searchTerm}" in category: ${category || 'All'}`);
    
    vsShowLoading();
    
    // Simulate API call delay
    setTimeout(() => {
        // Get all offers from main app
        fetch('/api/offers')
            .then(response => response.json())
            .then(data => {
                let offers = data.offers || [];
                
                // Filter by category if selected
                if (category) {
                    offers = offers.filter(offer => 
                        offer.category.toLowerCase() === category.toLowerCase()
                    );
                }
                
                // Filter by search term
                const filteredOffers = offers.filter(offer => {
                    const searchLower = searchTerm.toLowerCase();
                    return (
                        offer.title.toLowerCase().includes(searchLower) ||
                        offer.description.toLowerCase().includes(searchLower) ||
                        offer.category.toLowerCase().includes(searchLower) ||
                        offer.platform.toLowerCase().includes(searchLower)
                    );
                });
                
                displayResults(filteredOffers, searchTerm);
            })
            .catch(error => {
                console.error('❌ Search error:', error);
                vsShowError('Failed to search products');
            });
    }, 1000);
}

function searchByImage() {
    if (!uploadedImage) {
        alert('Please upload an image first');
        return;
    }
    
    console.log('🖼️ Searching by uploaded image');
    vsShowLoading();
    
    // Simulate image analysis and search
    setTimeout(() => {
        // For demo purposes, return random offers
        fetch('/api/offers')
            .then(response => response.json())
            .then(data => {
                const offers = data.offers || [];
                
                // Randomly select some offers to simulate image search results
                const shuffled = offers.sort(() => 0.5 - Math.random());
                const selected = shuffled.slice(0, Math.min(8, offers.length));
                
                displayResults(selected, 'Image Search');
            })
            .catch(error => {
                console.error('❌ Image search error:', error);
                vsShowError('Failed to analyze image');
            });
    }, 1500);
}

function displayResults(offers, searchType) {
    vsHideLoading();
    
    const resultsContainer = document.getElementById('resultsContainer');
    const searchResults = document.getElementById('searchResults');
    const noResults = document.getElementById('noResults');
    
    if (offers.length === 0) {
        searchResults.style.display = 'none';
        noResults.style.display = 'block';
        return;
    }
    
    resultsContainer.innerHTML = '';
    
    offers.forEach(offer => {
        const card = createResultCard(offer);
        resultsContainer.appendChild(card);
    });
    
    searchResults.style.display = 'block';
    noResults.style.display = 'none';
    
    console.log(`✅ Displayed ${offers.length} results for ${searchType}`);
}

function createResultCard(offer) {
    const card = document.createElement('div');
    card.className = 'result-card';
    
    const savings = offer.originalPrice - offer.discountedPrice;
    
    card.innerHTML = `
        <img src="${offer.image}" alt="${offer.title}" class="result-image">
        <div class="result-info">
            <div class="result-title">${offer.title}</div>
            <div style="margin: 10px 0;">
                <span class="result-price">₹${offer.discountedPrice.toLocaleString()}</span>
                <span class="result-original-price">₹${offer.originalPrice.toLocaleString()}</span>
                <span class="result-discount">${offer.discount}% OFF</span>
            </div>
            <p style="color: #6c757d; margin-bottom: 10px;">${offer.description}</p>
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #28a745; font-weight: bold;">
                    Save ₹${savings.toLocaleString()}
                </span>
                <span style="color: #6c757d; font-size: 14px;">
                    ${offer.platform}
                </span>
            </div>
            <div style="margin-top: 15px;">
                <button class="btn btn-primary btn-sm" onclick="window.open('${offer.link}', '_blank')">
                    View Deal
                </button>
                <button class="btn btn-outline-secondary btn-sm" onclick="saveOffer(${offer.id})">
                    ❤️ Save
                </button>
            </div>
        </div>
    `;
    
    return card;
}

function saveOffer(offerId) {
    // Check if user is logged in
    fetch('/api/auth/user')
        .then(response => response.json())
        .then(userData => {
            if (userData.success && userData.user) {
                // Save offer to user's saved offers
                fetch('/api/users/save-offer', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ offerId })
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        showToast('Offer saved successfully!', 'success');
                    } else {
                        showToast('Failed to save offer', 'error');
                    }
                })
                .catch(error => {
                    console.error('❌ Save offer error:', error);
                    showToast('Error saving offer', 'error');
                });
            } else {
                showToast('Please login to save offers', 'warning');
            }
        })
        .catch(error => {
            console.log('User not logged in, showing login prompt');
            // Redirect to main app for login
            window.opener.focus();
            window.close();
        });
}

function vsShowLoading() {
    document.getElementById('searchLoading').style.display = 'block';
    document.getElementById('searchResults').style.display = 'none';
    document.getElementById('noResults').style.display = 'none';
}

function vsHideLoading() {
    document.getElementById('searchLoading').style.display = 'none';
}

function vsHideResults() {
    document.getElementById('searchResults').style.display = 'none';
    document.getElementById('noResults').style.display = 'none';
}

function vsShowError(message) {
    vsHideLoading();
    const noResults = document.getElementById('noResults');
    noResults.innerHTML = `
        <i>❌</i>
        <h3>Error</h3>
        <p>${message}</p>
    `;
    noResults.style.display = 'block';
}

function showToast(message, type = 'info') {
    // Simple toast notification
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: bold;
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    
    // Set background color based on type
    switch(type) {
        case 'success':
            toast.style.background = '#28a745';
            break;
        case 'error':
            toast.style.background = '#dc3545';
            break;
        case 'warning':
            toast.style.background = '#ffc107';
            toast.style.color = '#212529';
            break;
        default:
            toast.style.background = '#007bff';
    }
    
    document.body.appendChild(toast);
    
    // Remove after 3 seconds
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

// Add animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .btn-sm {
        padding: 8px 16px;
        font-size: 14px;
    }
    
    .btn-outline-secondary {
        background: transparent;
        border: 1px solid #6c757d;
        color: #6c757d;
    }
    
    .btn-outline-secondary:hover {
        background: #6c757d;
        color: white;
    }
`;
document.head.appendChild(style);

console.log('✅ Visual Search JavaScript loaded');
