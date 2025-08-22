// Marketplace specific functionality
document.addEventListener('DOMContentLoaded', function() {
    initializeMarketplace();
});

function initializeMarketplace() {
    // Load crops data
    loadCropsData();
    
    // Initialize event listeners
    setupMarketplaceEventListeners();
    
    // Check if user is logged in for selling
    checkSellingEligibility();
}

function loadCropsData() {
    // Try to load from localStorage first
    const savedCrops = localStorage.getItem('cropsData');
    if (savedCrops) {
        cropsData = JSON.parse(savedCrops);
        displayCrops(cropsData);
    } else {
        // Load sample data if none exists
        setTimeout(() => {
            displayCrops(cropsData);
        }, 1000);
    }
}

function setupMarketplaceEventListeners() {
    // Search functionality
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }
    
    // Filter functionality
    const typeFilter = document.getElementById('cropTypeFilter');
    const locationFilter = document.getElementById('locationFilter');
    
    if (typeFilter) typeFilter.addEventListener('change', applyFilters);
    if (locationFilter) locationFilter.addEventListener('change', applyFilters);
    
    // Sell crop form
    const sellForm = document.getElementById('sellCropForm');
    if (sellForm) {
        sellForm.addEventListener('submit', handleSellCrop);
    }
}

function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    const filteredCrops = cropsData.filter(crop => 
        crop.name.toLowerCase().includes(searchTerm) ||
        crop.type.toLowerCase().includes(searchTerm) ||
        crop.location.toLowerCase().includes(searchTerm) ||
        crop.farmer.toLowerCase().includes(searchTerm)
    );
    displayCrops(filteredCrops);
}

function applyFilters() {
    const typeFilter = document.getElementById('cropTypeFilter').value;
    const locationFilter = document.getElementById('locationFilter').value;
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    let filteredCrops = cropsData;
    
    // Apply type filter
    if (typeFilter !== 'all') {
        filteredCrops = filteredCrops.filter(crop => crop.type === typeFilter);
    }
    
    // Apply location filter
    if (locationFilter !== 'all') {
        filteredCrops = filteredCrops.filter(crop => crop.location === locationFilter);
    }
    
    // Apply search filter
    if (searchTerm) {
        filteredCrops = filteredCrops.filter(crop => 
            crop.name.toLowerCase().includes(searchTerm) ||
            crop.type.toLowerCase().includes(searchTerm) ||
            crop.location.toLowerCase().includes(searchTerm) ||
            crop.farmer.toLowerCase().includes(searchTerm)
        );
    }
    
    displayCrops(filteredCrops);
}

function displayCrops(crops) {
    const container = document.getElementById('cropsContainer');
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');
    
    // Hide loading state
    if (loadingState) loadingState.style.display = 'none';
    
    if (!crops || crops.length === 0) {
        // Show empty state
        if (emptyState) emptyState.style.display = 'block';
        if (container) container.innerHTML = '';
        return;
    }
    
    // Hide empty state
    if (emptyState) emptyState.style.display = 'none';
    
    // Generate crops HTML
    const cropsHTML = crops.map(crop => `
        <div class="col-md-6 col-lg-4 mb-4">
            <div class="card crop-card h-100">
                <div class="crop-image position-relative d-flex align-items-center justify-content-center">
                    <span class="display-1">${getCropImage(crop.image)}</span>
                    <div class="price-tag">${crop.price}</div>
                </div>
                <div class="card-body">
                    <h5 class="card-title">${crop.name}</h5>
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <span class="badge bg-success">${crop.type}</span>
                        <span class="text-muted small">${crop.quantity}</span>
                    </div>
                    <p class="card-text mb-2">
                        <i class="fas fa-user-tie me-2 text-success"></i>
                        ${crop.farmer}
                    </p>
                    <p class="card-text mb-2">
                        <i class="fas fa-map-marker-alt me-2 text-success"></i>
                        ${crop.location}
                    </p>
                    <p class="card-text mb-3">
                        <i class="fas fa-star me-2 text-warning"></i>
                        Quality: ${crop.quality}
                    </p>
                    <div class="d-flex justify-content-between align-items-center">
                        <small class="text-muted">Listed: ${formatDate(crop.date)}</small>
                        <button class="btn btn-sm btn-success" onclick="showCropDetails(${crop.id})">
                            <i class="fas fa-shopping-cart me-1"></i>Buy
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
    
    if (container) container.innerHTML = cropsHTML;
}

function showCropDetails(cropId) {
    const crop = cropsData.find(c => c.id === cropId);
    if (!crop) return;
    
    // Show crop details in a modal or redirect to detail page
    const modalContent = `
        <div class="modal-header">
            <h5 class="modal-title">${crop.name} Details</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">
            <div class="text-center mb-4">
                <span class="display-1">${getCropImage(crop.image)}</span>
            </div>
            <div class="row mb-3">
                <div class="col-6">
                    <strong>Type:</strong> ${crop.type}
                </div>
                <div class="col-6">
                    <strong>Quantity:</strong> ${crop.quantity}
                </div>
            </div>
            <div class="row mb-3">
                <div class="col-6">
                    <strong>Price:</strong> ${crop.price}
                </div>
                <div class="col-6">
                    <strong>Quality:</strong> ${crop.quality}
                </div>
            </div>
            <div class="row mb-3">
                <div class="col-6">
                    <strong>Location:</strong> ${crop.location}
                </div>
                <div class="col-6">
                    <strong>Farmer:</strong> ${crop.farmer}
                </div>
            </div>
            <div class="mb-3">
                <strong>Listed On:</strong> ${formatDate(crop.date)}
            </div>
        </div>
        <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
            <button type="button" class="btn btn-success" onclick="initiatePurchase(${crop.id})">
                <i class="fas fa-shopping-cart me-1"></i>Purchase Now
            </button>
        </div>
    `;
    
    showCustomModal('Crop Details', modalContent);
}

function initiatePurchase(cropId) {
    if (!currentUser) {
        showNotification('Please login to purchase crops', 'info');
        showLogin();
        return;
    }
    
    const crop = cropsData.find(c => c.id === cropId);
    if (crop) {
        showNotification(`Purchase initiated for ${crop.name} at ${crop.price}`, 'success');
        // In a real app, this would redirect to checkout or show a purchase form
    }
}

function showSellCropModal() {
    if (!currentUser) {
        showNotification('Please login to sell your crops', 'info');
        showLogin();
        return;
    }
    
    const modal = new bootstrap.Modal(document.getElementById('sellCropModal'));
    modal.show();
}

function handleSellCrop(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const newCrop = {
        id: Date.now(),
        name: formData.get('cropName') || 'Unknown Crop',
        type: formData.get('cropType') || 'Unknown',
        quantity: `${formData.get('quantity')} ${formData.get('unit')}`,
        price: `₹${formData.get('price')}`,
        location: formData.get('location') || 'Unknown',
        quality: formData.get('quality') || 'Standard',
        farmer: currentUser?.name || 'Anonymous Farmer',
        image: 'default',
        date: new Date().toISOString().split('T')[0]
    };
    
    // Add to crops data
    cropsData.unshift(newCrop);
    localStorage.setItem('cropsData', JSON.stringify(cropsData));
    
    showNotification('Crop listed successfully!', 'success');
    
    // Close modal and refresh display
    const modal = bootstrap.Modal.getInstance(document.getElementById('sellCropModal'));
    modal.hide();
    
    displayCrops(cropsData);
}

function checkSellingEligibility() {
    // This could check if user has completed profile, verification, etc.
    // For now, just check if logged in
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function showCustomModal(title, content) {
    // Create modal dynamically
    const modalId = 'customModal';
    let modal = document.getElementById(modalId);
    
    if (!modal) {
        modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = modalId;
        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    ${content}
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    } else {
        modal.querySelector('.modal-content').innerHTML = content;
    }
    
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
}

// Make functions available globally
window.showSellCropModal = showSellCropModal;
window.showCropDetails = showCropDetails;
window.initiatePurchase = initiatePurchase;
