// Dashboard specific functionality
document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
});

function initializeDashboard() {
    // Check if user is logged in
    if (!currentUser) {
        showNotification('Please login to access dashboard', 'info');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
        return;
    }
    
    // Load dashboard data
    loadDashboardData();
    
    // Update user info
    updateUserInfo();
    
    // Load user's listings
    loadUserListings();
}

function loadDashboardData() {
    // Simulate loading dashboard stats
    setTimeout(() => {
        updateDashboardStats();
    }, 1000);
}

function updateUserInfo() {
    const userName = document.getElementById('userName');
    const userLocation = document.getElementById('userLocation');
    
    if (userName && currentUser) {
        userName.textContent = currentUser.name || 'Farmer';
    }
    
    if (userLocation && currentUser) {
        userLocation.textContent = currentUser.location || 'Karnataka';
    }
}

function updateDashboardStats() {
    // Simulate some stats based on user activity
    const totalEarnings = document.getElementById('totalEarnings');
    const activeListings = document.getElementById('activeListings');
    const totalSales = document.getElementById('totalSales');
    
    if (totalEarnings) {
        totalEarnings.textContent = '₹12,500';
    }
    
    if (activeListings) {
        // Count user's active listings
        const userCrops = cropsData.filter(crop => crop.farmer === currentUser?.name);
        activeListings.textContent = userCrops.length;
    }
    
    if (totalSales) {
        totalSales.textContent = '8';
    }
}

function loadUserListings() {
    const container = document.getElementById('myListingsContainer');
    if (!container) return;
    
    // Get user's listings
    const userCrops = cropsData.filter(crop => crop.farmer === currentUser?.name);
    
    if (userCrops.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="fas fa-seedling fa-3x text-muted mb-3"></i>
                <h5>No active listings</h5>
                <p class="text-muted">Start by listing your crops for sale</p>
                <a href="marketplace.html" class="btn btn-success">Sell Your Crops</a>
            </div>
        `;
        return;
    }
    
    // Display user's listings
    const listingsHTML = userCrops.map(crop => `
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
                        <i class="fas fa-map-marker-alt me-2 text-success"></i>
                        ${crop.location}
                    </p>
                    <p class="card-text mb-3">
                        <i class="fas fa-star me-2 text-warning"></i>
                        Quality: ${crop.quality}
                    </p>
                    <div class="d-flex justify-content-between align-items-center">
                        <small class="text-muted">Listed: ${formatDate(crop.date)}</small>
                        <div class="btn-group">
                            <button class="btn btn-sm btn-outline-success" onclick="editListing(${crop.id})">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger" onclick="deleteListing(${crop.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = listingsHTML;
}

function editListing(cropId) {
    const crop = cropsData.find(c => c.id === cropId);
    if (!crop) return;
    
    showNotification(`Edit functionality for ${crop.name} would open here`, 'info');
    // In a real app, this would open an edit form
}

function deleteListing(cropId) {
    if (!confirm('Are you sure you want to delete this listing?')) return;
    
    const index = cropsData.findIndex(c => c.id === cropId);
    if (index !== -1) {
        cropsData.splice(index, 1);
        localStorage.setItem('cropsData', JSON.stringify(cropsData));
        showNotification('Listing deleted successfully', 'success');
        loadUserListings();
        updateDashboardStats();
    }
}

// Add CSS for activity timeline
const style = document.createElement('style');
style.textContent = `
    .activity-timeline {
        position: relative;
        padding-left: 30px;
    }
    
    .activity-item {
        position: relative;
        padding: 15px 0;
        border-left: 2px solid #28a745;
    }
    
    .activity-item:last-child {
        border-left: 2px solid transparent;
    }
    
    .activity-icon {
        position: absolute;
        left: -36px;
        top: 15px;
        width: 24px;
        height: 24px;
        background: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid #28a745;
    }
    
    .activity-content {
        margin-left: 20px;
    }
    
    .crop-health-item {
        margin-bottom: 20px;
    }
    
    .crop-health-item:last-child {
        margin-bottom: 0;
    }
    
    .weather-info {
        text-align: center;
    }
`;

document.head.appendChild(style);

// Format date function (redefined for dashboard context)
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Make functions available globally
window.editListing = editListing;
window.deleteListing = deleteListing;
