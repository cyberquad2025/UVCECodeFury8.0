// Equipment marketplace specific functionality
document.addEventListener('DOMContentLoaded', function() {
    initializeEquipmentMarketplace();
});

function initializeEquipmentMarketplace() {
    // Load equipment data
    loadEquipmentData();
    
    // Initialize event listeners
    setupEquipmentEventListeners();
    
    // Check if user is logged in for listing equipment
    checkListingEligibility();
}

function loadEquipmentData() {
    // Try to load from localStorage first
    const savedEquipment = localStorage.getItem('equipmentData');
    if (savedEquipment) {
        equipmentData = JSON.parse(savedEquipment);
        displayEquipment(equipmentData);
    } else {
        // Load sample data if none exists
        setTimeout(() => {
            displayEquipment(equipmentData);
        }, 1000);
    }
}

function setupEquipmentEventListeners() {
    // Filter functionality
    const typeFilter = document.getElementById('equipmentTypeFilter');
    const locationFilter = document.getElementById('equipmentLocationFilter');
    const availabilityFilter = document.getElementById('availabilityFilter');
    
    if (typeFilter) typeFilter.addEventListener('change', applyEquipmentFilters);
    if (locationFilter) locationFilter.addEventListener('change', applyEquipmentFilters);
    if (availabilityFilter) availabilityFilter.addEventListener('change', applyEquipmentFilters);
    
    // List equipment form
    const listForm = document.getElementById('listEquipmentForm');
    if (listForm) {
        listForm.addEventListener('submit', handleListEquipment);
    }
}

function applyEquipmentFilters() {
    const typeFilter = document.getElementById('equipmentTypeFilter').value;
    const locationFilter = document.getElementById('equipmentLocationFilter').value;
    const availabilityFilter = document.getElementById('availabilityFilter').value;
    
    let filteredEquipment = equipmentData;
    
    // Apply type filter
    if (typeFilter !== 'all') {
        filteredEquipment = filteredEquipment.filter(item => item.type === typeFilter);
    }
    
    // Apply location filter
    if (locationFilter !== 'all') {
        filteredEquipment = filteredEquipment.filter(item => item.location === locationFilter);
    }
    
    // Apply availability filter
    if (availabilityFilter !== 'all') {
        if (availabilityFilter === 'rental') {
            filteredEquipment = filteredEquipment.filter(item => item.rental);
        } else if (availabilityFilter === 'purchase') {
            filteredEquipment = filteredEquipment.filter(item => item.purchase);
        }
    }
    
    displayEquipment(filteredEquipment);
}

function displayEquipment(equipment) {
    const container = document.getElementById('equipmentContainer');
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');
    
    // Hide loading state
    if (loadingState) loadingState.style.display = 'none';
    
    if (!equipment || equipment.length === 0) {
        // Show empty state
        if (emptyState) emptyState.style.display = 'block';
        if (container) container.innerHTML = '';
        return;
    }
    
    // Hide empty state
    if (emptyState) emptyState.style.display = 'none';
    
    // Generate equipment HTML
    const equipmentHTML = equipment.map(item => `
        <div class="col-md-6 col-lg-4 mb-4">
            <div class="card equipment-card h-100">
                <div class="position-relative">
                    <div class="equipment-image d-flex align-items-center justify-content-center py-4" style="background: linear-gradient(135deg, #e8f5e8, #c8e6c9);">
                        <span class="display-1">${getEquipmentImage(item.image)}</span>
                    </div>
                    ${item.rental ? `<span class="rental-badge position-absolute top-0 start-0 m-3">For Rent</span>` : ''}
                    ${item.condition === 'New' ? `<span class="badge bg-success position-absolute top-0 end-0 m-3">New</span>` : ''}
                </div>
                <div class="card-body">
                    <h5 class="card-title">${item.name}</h5>
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <span class="badge bg-info">${item.type}</span>
                        <span class="badge bg-${getConditionBadgeColor(item.condition)}">${item.condition}</span>
                    </div>
                    <p class="card-text mb-2">
                        <i class="fas fa-user-tie me-2 text-success"></i>
                        ${item.owner}
                    </p>
                    <p class="card-text mb-2">
                        <i class="fas fa-map-marker-alt me-2 text-success"></i>
                        ${item.location}
                    </p>
                    <div class="pricing-info mb-3">
                        ${item.rental ? `
                            <p class="card-text mb-1">
                                <i class="fas fa-calendar-day me-2 text-warning"></i>
                                Rent: <strong>${item.price}</strong>
                            </p>
                        ` : ''}
                        ${item.purchase ? `
                            <p class="card-text mb-1">
                                <i class="fas fa-shopping-cart me-2 text-primary"></i>
                                Buy: <strong>${item.purchase}</strong>
                            </p>
                        ` : ''}
                    </div>
                    <div class="d-flex gap-2">
                        ${item.rental ? `
                            <button class="btn btn-sm btn-warning flex-fill" onclick="showRentalModal(${item.id})">
                                <i class="fas fa-calendar-check me-1"></i>Rent
                            </button>
                        ` : ''}
                        ${item.purchase ? `
                            <button class="btn btn-sm btn-primary flex-fill" onclick="showPurchaseModal(${item.id})">
                                <i class="fas fa-shopping-cart me-1"></i>Buy
                            </button>
                        ` : ''}
                        <button class="btn btn-sm btn-outline-secondary" onclick="showEquipmentDetails(${item.id})">
                            <i class="fas fa-info"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
    
    if (container) container.innerHTML = equipmentHTML;
}

function getConditionBadgeColor(condition) {
    const colors = {
        'New': 'success',
        'Excellent': 'primary',
        'Good': 'info',
        'Fair': 'warning'
    };
    return colors[condition] || 'secondary';
}

function showEquipmentDetails(equipmentId) {
    const item = equipmentData.find(e => e.id === equipmentId);
    if (!item) return;
    
    const modalContent = `
        <div class="modal-header">
            <h5 class="modal-title">${item.name} Details</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">
            <div class="text-center mb-4">
                <span class="display-1">${getEquipmentImage(item.image)}</span>
            </div>
            <div class="row mb-3">
                <div class="col-6">
                    <strong>Type:</strong> ${item.type}
                </div>
                <div class="col-6">
                    <strong>Condition:</strong> 
                    <span class="badge bg-${getConditionBadgeColor(item.condition)}">${item.condition}</span>
                </div>
            </div>
            <div class="row mb-3">
                <div class="col-6">
                    <strong>Owner:</strong> ${item.owner}
                </div>
                <div class="col-6">
                    <strong>Location:</strong> ${item.location}
                </div>
            </div>
            ${item.rental ? `
                <div class="mb-3">
                    <strong>Rental Price:</strong> ${item.price}
                </div>
            ` : ''}
            ${item.purchase ? `
                <div class="mb-3">
                    <strong>Purchase Price:</strong> ${item.purchase}
                </div>
            ` : ''}
        </div>
        <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
            ${item.rental ? `
                <button type="button" class="btn btn-warning" onclick="initiateRental(${item.id})">
                    <i class="fas fa-calendar-check me-1"></i>Rent Now
                </button>
            ` : ''}
            ${item.purchase ? `
                <button type="button" class="btn btn-primary" onclick="initiatePurchaseEquipment(${item.id})">
                    <i class="fas fa-shopping-cart me-1"></i>Buy Now
                </button>
            ` : ''}
        </div>
    `;
    
    showCustomModal('Equipment Details', modalContent);
}

function showRentalModal(equipmentId) {
    if (!currentUser) {
        showNotification('Please login to rent equipment', 'info');
        showLogin();
        return;
    }
    
    const item = equipmentData.find(e => e.id === equipmentId);
    if (item) {
        showNotification(`Rental process started for ${item.name}`, 'info');
        // In a real app, this would show a rental form with dates, etc.
    }
}

function showPurchaseModal(equipmentId) {
    if (!currentUser) {
        showNotification('Please login to purchase equipment', 'info');
        showLogin();
        return;
    }
    
    const item = equipmentData.find(e => e.id === equipmentId);
    if (item) {
        showNotification(`Purchase process started for ${item.name}`, 'info');
        // In a real app, this would show a purchase form
    }
}

function initiateRental(equipmentId) {
    showRentalModal(equipmentId);
}

function initiatePurchaseEquipment(equipmentId) {
    showPurchaseModal(equipmentId);
}

function showListEquipmentModal() {
    if (!currentUser) {
        showNotification('Please login to list equipment', 'info');
        showLogin();
        return;
    }
    
    const modal = new bootstrap.Modal(document.getElementById('listEquipmentModal'));
    modal.show();
}

function handleListEquipment(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const newEquipment = {
        id: Date.now(),
        name: formData.get('equipmentName') || 'Unknown Equipment',
        type: formData.get('equipmentType') || 'Unknown',
        price: formData.get('rentalPrice') ? `₹${formData.get('rentalPrice')}/day` : null,
        rental: !!formData.get('rentalPrice'),
        purchase: formData.get('purchasePrice') ? `₹${formData.get('purchasePrice')}` : null,
        location: formData.get('location') || 'Unknown',
        condition: formData.get('condition') || 'Good',
        owner: currentUser?.name || 'Anonymous Owner',
        image: 'default',
        delivery: formData.get('deliveryAvailable') === 'on'
    };
    
    // Add to equipment data
    equipmentData.unshift(newEquipment);
    localStorage.setItem('equipmentData', JSON.stringify(equipmentData));
    
    showNotification('Equipment listed successfully!', 'success');
    
    // Close modal and refresh display
    const modal = bootstrap.Modal.getInstance(document.getElementById('listEquipmentModal'));
    modal.hide();
    
    displayEquipment(equipmentData);
}

function checkListingEligibility() {
    // This could check if user has completed profile, verification, etc.
    // For now, just check if logged in
}

// Make functions available globally
window.showListEquipmentModal = showListEquipmentModal;
window.showEquipmentDetails = showEquipmentDetails;
window.showRentalModal = showRentalModal;
window.showPurchaseModal = showPurchaseModal;
window.initiateRental = initiateRental;
window.initiatePurchaseEquipment = initiatePurchaseEquipment;
