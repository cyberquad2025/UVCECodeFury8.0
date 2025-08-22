// Global variables
let currentUser = null;
let cropsData = [];
let equipmentData = [];

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    loadSampleData();
    checkAuthStatus();
    initializeEventListeners();
});

// Load sample data for demonstration
function loadSampleData() {
    // Sample crops data
    cropsData = [
        {
            id: 1,
            name: 'Organic Wheat',
            type: 'Grains',
            quantity: '500 kg',
            price: '₹2,500',
            location: 'Karnataka',
            quality: 'Grade A',
            farmer: 'Rajesh Kumar',
            image: 'wheat',
            date: '2024-01-15'
        },
        {
            id: 2,
            name: 'Fresh Tomatoes',
            type: 'Vegetables',
            quantity: '200 kg',
            price: '₹1,800',
            location: 'Maharashtra',
            quality: 'Fresh Harvest',
            farmer: 'Sunita Patil',
            image: 'tomato',
            date: '2024-01-14'
        },
        {
            id: 3,
            name: 'Basmati Rice',
            type: 'Grains',
            quantity: '1000 kg',
            price: '₹4,200',
            location: 'Punjab',
            quality: 'Premium',
            farmer: 'Harpreet Singh',
            image: 'rice',
            date: '2024-01-13'
        },
        {
            id: 4,
            name: 'Alphonso Mangoes',
            type: 'Fruits',
            quantity: '300 kg',
            price: '₹3,500',
            location: 'Maharashtra',
            quality: 'Export Quality',
            farmer: 'Vikram Desai',
            image: 'mango',
            date: '2024-01-12'
        }
    ];

    // Sample equipment data
    equipmentData = [
        {
            id: 1,
            name: 'Tractor',
            type: 'Heavy Equipment',
            price: '₹8,000/day',
            rental: true,
            purchase: '₹5,50,000',
            location: 'Karnataka',
            owner: 'Farm Equipment Rentals',
            condition: 'Excellent',
            image: 'tractor'
        },
        {
            id: 2,
            name: 'Harvester',
            type: 'Harvesting',
            price: '₹12,000/day',
            rental: true,
            purchase: '₹8,75,000',
            location: 'Punjab',
            owner: 'Green Fields Co.',
            condition: 'Good',
            image: 'harvester'
        },
        {
            id: 3,
            name: 'Irrigation System',
            type: 'Water Management',
            price: '₹2,500/day',
            rental: true,
            purchase: '₹1,20,000',
            location: 'Maharashtra',
            owner: 'Water Solutions Ltd.',
            condition: 'New',
            image: 'irrigation'
        },
        {
            id: 4,
            name: 'Sprayer',
            type: 'Crop Protection',
            price: '₹800/day',
            rental: true,
            purchase: '₹45,000',
            location: 'Tamil Nadu',
            owner: 'Agro Tools',
            condition: 'Very Good',
            image: 'sprayer'
        }
    ];

    // Save to localStorage for persistence
    localStorage.setItem('cropsData', JSON.stringify(cropsData));
    localStorage.setItem('equipmentData', JSON.stringify(equipmentData));
}

// Check authentication status
function checkAuthStatus() {
    const user = localStorage.getItem('currentUser');
    if (user) {
        currentUser = JSON.parse(user);
        updateAuthUI();
    }
}

// Update UI based on authentication status
function updateAuthUI() {
    const authLinks = document.querySelectorAll('.auth-link');
    if (currentUser) {
        authLinks.forEach(link => {
            link.textContent = `Welcome, ${currentUser.name}`;
            link.href = 'dashboard.html';
        });
    }
}

// Initialize event listeners
function initializeEventListeners() {
    // Login form submission
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Signup form submission
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
    }

    // Crop filter functionality
    const cropFilters = document.querySelectorAll('.crop-filter');
    cropFilters.forEach(filter => {
        filter.addEventListener('change', filterCrops);
    });

    // Equipment filter functionality
    const equipmentFilters = document.querySelectorAll('.equipment-filter');
    equipmentFilters.forEach(filter => {
        filter.addEventListener('change', filterEquipment);
    });
}

// Handle login
function handleLogin(e) {
    e.preventDefault();
    const phone = e.target.querySelector('input[type="tel"]').value;
    const password = e.target.querySelector('input[type="password"]').value;

    // Simulate login (in real app, this would call an API)
    const user = {
        name: 'Demo Farmer',
        phone: phone,
        location: 'Karnataka',
        joined: new Date().toISOString()
    };

    currentUser = user;
    localStorage.setItem('currentUser', JSON.stringify(user));
    
    showNotification('Login successful! Welcome back.', 'success');
    updateAuthUI();
    
    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
    modal.hide();

    // Redirect to dashboard after 1 second
    setTimeout(() => {
        window.location.href = 'dashboard.html';
    }, 1000);
}

// Handle signup
function handleSignup(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const user = {
        name: formData.get('name'),
        phone: formData.get('phone'),
        location: formData.get('location'),
        farmSize: formData.get('farmSize'),
        joined: new Date().toISOString()
    };

    currentUser = user;
    localStorage.setItem('currentUser', JSON.stringify(user));
    
    showNotification('Account created successfully!', 'success');
    updateAuthUI();
    
    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('signupModal'));
    modal.hide();

    // Redirect to dashboard after 1 second
    setTimeout(() => {
        window.location.href = 'dashboard.html';
    }, 1000);
}

// Show login modal
function showLogin() {
    const modal = new bootstrap.Modal(document.getElementById('loginModal'));
    modal.show();
}

// Show signup modal
function showSignup() {
    const modal = new bootstrap.Modal(document.getElementById('signupModal'));
    modal.show();
}

// Show notification
function showNotification(message, type = 'info') {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${type === 'success' ? 'success' : 'info'} border-0`;
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;

    // Add to container
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    container.appendChild(toast);

    // Show toast
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();

    // Remove after hide
    toast.addEventListener('hidden.bs.toast', () => {
        toast.remove();
    });
}

// Filter crops
function filterCrops() {
    const typeFilter = document.getElementById('cropTypeFilter').value;
    const locationFilter = document.getElementById('locationFilter').value;
    
    let filteredCrops = cropsData;
    
    if (typeFilter !== 'all') {
        filteredCrops = filteredCrops.filter(crop => crop.type === typeFilter);
    }
    
    if (locationFilter !== 'all') {
        filteredCrops = filteredCrops.filter(crop => crop.location === locationFilter);
    }
    
    displayCrops(filteredCrops);
}

// Filter equipment
function filterEquipment() {
    const typeFilter = document.getElementById('equipmentTypeFilter').value;
    const locationFilter = document.getElementById('equipmentLocationFilter').value;
    
    let filteredEquipment = equipmentData;
    
    if (typeFilter !== 'all') {
        filteredEquipment = filteredEquipment.filter(item => item.type === typeFilter);
    }
    
    if (locationFilter !== 'all') {
        filteredEquipment = filteredEquipment.filter(item => item.location === locationFilter);
    }
    
    displayEquipment(filteredEquipment);
}

// Display crops (to be implemented in marketplace.js)
function displayCrops(crops) {
    // This will be implemented in the marketplace page
    console.log('Displaying crops:', crops);
}

// Display equipment (to be implemented in equipment.js)
function displayEquipment(equipment) {
    // This will be implemented in the equipment page
    console.log('Displaying equipment:', equipment);
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(amount);
}

// Get crop image placeholder
function getCropImage(type) {
    const images = {
        'wheat': '🌾',
        'tomato': '🍅',
        'rice': '🍚',
        'mango': '🥭',
        'default': '🌱'
    };
    return images[type] || images.default;
}

// Get equipment image placeholder
function getEquipmentImage(type) {
    const images = {
        'tractor': '🚜',
        'harvester': '🌾',
        'irrigation': '💧',
        'sprayer': '🧴',
        'default': '⚙️'
    };
    return images[type] || images.default;
}

// Logout function
function logout() {
    localStorage.removeItem('currentUser');
    currentUser = null;
    showNotification('Logged out successfully', 'info');
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1000);
}

// Export functions for use in other files
window.FarmConnect = {
    showNotification,
    formatCurrency,
    getCropImage,
    getEquipmentImage,
    logout,
    currentUser
};
