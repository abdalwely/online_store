// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyD21vT0hBfAOwX0LuVYGOfg7FBPxVuaPbs",
  authDomain: "housingsa-ab542.firebaseapp.com",
  databaseURL: "https://housingsa-ab542-default-rtdb.firebaseio.com",
  projectId: "housingsa-ab542",
  storageBucket: "housingsa-ab542.appspot.com",
  messagingSenderId: "866511745374",
  appId: "1:866511745374:web:af20fb65816563e03e1fcf",
  measurementId: "G-LDBQ1STZ1Y"
};


// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Configure Firestore settings
db.settings({
    timestampsInSnapshots: true
});

// Global variables
let currentUser = null;
let currentUserType = null;
let currentStore = null;

// Utility functions
function showLoading(message = 'جاري التحميل...') {
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
        const loadingText = loadingElement.querySelector('p');
        if (loadingText) {
            loadingText.textContent = message;
        }
        loadingElement.style.display = 'flex';
    }
}

function hideLoading() {
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
        loadingElement.style.display = 'none';
    }
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span>${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">&times;</button>
        </div>
    `;
    
    // Add notification styles if not exists
    if (!document.querySelector('#notification-styles')) {
        const styles = document.createElement('style');
        styles.id = 'notification-styles';
        styles.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: white;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                z-index: 10000;
                min-width: 300px;
                max-width: 400px;
                transform: translateX(100%);
                transition: transform 0.3s ease;
                overflow: hidden;
            }
            
            .notification-content {
                padding: 16px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
            }
            
            .notification-close {
                background: none;
                border: none;
                font-size: 18px;
                cursor: pointer;
                color: #666;
                padding: 0;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 4px;
            }
            
            .notification-close:hover {
                background: rgba(0, 0, 0, 0.1);
            }
            
            .notification-info {
                border-right: 4px solid #3b82f6;
                color: #3b82f6;
            }
            
            .notification-success {
                border-right: 4px solid #10b981;
                color: #10b981;
            }
            
            .notification-warning {
                border-right: 4px solid #f59e0b;
                color: #f59e0b;
            }
            
            .notification-error {
                border-right: 4px solid #ef4444;
                color: #ef4444;
            }
        `;
        document.head.appendChild(styles);
    }
    
    // Add to page
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 10);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 300);
        }
    }, 5000);
}

function formatPrice(price) {
    if (typeof price !== 'number') {
        price = parseFloat(price) || 0;
    }
    
    return new Intl.NumberFormat('ar-SA', {
        style: 'currency',
        currency: 'SAR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }).format(price);
}

function formatDate(date) {
    if (!date) return 'غير محدد';
    
    if (!(date instanceof Date)) {
        date = new Date(date);
    }
    
    return new Intl.DateTimeFormat('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Initialize app when page loads
document.addEventListener('DOMContentLoaded', function() {
    hideLoading();
    
    // Check if user is already logged in
    auth.onAuthStateChanged(function(user) {
        if (user) {
            // User is signed in
            checkUserTypeAndRedirect(user);
        } else {
            // User is signed out
            if (document.getElementById('landing')) {
                showLandingPage();
            }
        }
    });

    // Initialize page event listeners
    initializeEventListeners();
});

function initializeEventListeners() {
    // Modal close events
    document.querySelectorAll('.close').forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) {
                modal.classList.remove('active');
            }
        });
    });

    // Click outside modal to close
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('active');
            }
        });
    });

    // Tab switching for dashboards
    document.querySelectorAll('.sidebar-menu li').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            if (tabId) {
                switchTab(tabId);
            }
        });
    });

    // Product tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            switchProductTab(tabId);
        });
    });
}

function switchTab(tabId) {
    // Remove active class from all sidebar items
    document.querySelectorAll('.sidebar-menu li').forEach(item => {
        item.classList.remove('active');
    });
    
    // Add active class to clicked item
    const clickedItem = document.querySelector(`[data-tab="${tabId}"]`);
    if (clickedItem) {
        clickedItem.classList.add('active');
    }
    
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Show selected tab content
    const targetTab = document.getElementById(tabId);
    if (targetTab) {
        targetTab.classList.add('active');
        
        // Load tab data if needed
        loadTabData(tabId);
    }
}

function switchProductTab(tabId) {
    // Remove active class from all tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Add active class to clicked button
    const clickedBtn = document.querySelector(`[data-tab="${tabId}"]`);
    if (clickedBtn) {
        clickedBtn.classList.add('active');
    }
    
    // Hide all tab panes
    document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.classList.remove('active');
    });
    
    // Show selected tab pane
    const targetPane = document.getElementById(tabId);
    if (targetPane) {
        targetPane.classList.add('active');
    }
}

function loadTabData(tabId) {
    switch(tabId) {
        case 'overview':
            if (typeof loadOverviewData === 'function') {
                loadOverviewData();
            }
            break;
        case 'stores':
            if (typeof loadStoresData === 'function') {
                loadStoresData();
            }
            break;
        case 'templates':
            if (typeof loadTemplatesData === 'function') {
                loadTemplatesData();
            }
            break;
        case 'plans':
            if (typeof loadPlansData === 'function') {
                loadPlansData();
            }
            break;
        case 'users':
            if (typeof loadUsersData === 'function') {
                loadUsersData();
            }
            break;
        case 'dashboard':
            if (typeof loadTraderDashboardData === 'function') {
                loadTraderDashboardData();
            }
            break;
        case 'products':
            if (typeof loadProductsData === 'function') {
                loadProductsData();
            }
            break;
        case 'orders':
            if (typeof loadOrdersData === 'function') {
                loadOrdersData();
            }
            break;
        case 'customers':
            if (typeof loadCustomersData === 'function') {
                loadCustomersData();
            }
            break;
        case 'coupons':
            if (typeof loadCouponsData === 'function') {
                loadCouponsData();
            }
            break;
    }
}

async function checkUserTypeAndRedirect(user) {
    try {
        showLoading('جاري التحقق من بيانات المستخدم...');
        
        // Get user data from Firestore
        const userDoc = await db.collection('users').doc(user.uid).get();
        
        if (userDoc.exists) {
            const userData = userDoc.data();
            currentUser = user;
            currentUserType = userData.type;
            
            if (userData.type === 'admin') {
                showAdminDashboard();
            } else if (userData.type === 'trader') {
                currentStore = userData.storeId;
                showTraderDashboard();
            }
        } else {
            // User not found in database, logout
            await auth.signOut();
            showNotification('حدث خطأ في تسجيل الدخول', 'error');
        }
    } catch (error) {
        console.error('Error checking user type:', error);
        showNotification('حدث خطأ في تسجيل الدخول', 'error');
    } finally {
        hideLoading();
    }
}

function showLandingPage() {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    const landing = document.getElementById('landing');
    if (landing) {
        landing.classList.add('active');
    }
}

function showAdminDashboard() {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    const adminDashboard = document.getElementById('adminDashboard');
    if (adminDashboard) {
        adminDashboard.classList.add('active');
        
        // Set admin name
        if (currentUser) {
            const adminNameEl = document.getElementById('adminName');
            if (adminNameEl) {
                adminNameEl.textContent = currentUser.email;
            }
        }
        
        // Load initial data
        if (typeof loadOverviewData === 'function') {
            loadOverviewData();
        }
    }
}

function showTraderDashboard() {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    const traderDashboard = document.getElementById('traderDashboard');
    if (traderDashboard) {
        traderDashboard.classList.add('active');
        
        // Set trader name
        if (currentUser) {
            const traderNameEl = document.getElementById('traderName');
            if (traderNameEl) {
                traderNameEl.textContent = currentUser.email;
            }
        }
        
        // Load initial data
        if (typeof loadTraderDashboardData === 'function') {
            loadTraderDashboardData();
        }
    }
}

// Create default admin account if it doesn't exist
async function createDefaultAdmin() {
    try {
        // Check if admin exists
        const adminQuery = await db.collection('users').where('type', '==', 'admin').limit(1).get();
        
        if (adminQuery.empty) {
            // Create default admin account
            const defaultAdmin = {
                email: 'admin@platform.com',
                password: 'admin123456'
            };
            
            const userCredential = await auth.createUserWithEmailAndPassword(defaultAdmin.email, defaultAdmin.password);
            const user = userCredential.user;
            
            // Add admin to Firestore
            await db.collection('users').doc(user.uid).set({
                name: 'مدير المنصة',
                email: defaultAdmin.email,
                type: 'admin',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            console.log('Default admin account created:', defaultAdmin.email);
        }
    } catch (error) {
        console.warn('Could not create default admin:', error);
    }
}

// Initialize default admin on app start (only in development)
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    createDefaultAdmin();
}

// Export global functions for use in other files
window.firebaseConfig = firebaseConfig;
window.auth = auth;
window.db = db;
window.storage = storage;
window.currentUser = currentUser;
window.currentUserType = currentUserType;
window.currentStore = currentStore;
window.showLoading = showLoading;
window.hideLoading = hideLoading;
window.showNotification = showNotification;
window.formatPrice = formatPrice;
window.formatDate = formatDate;
window.generateId = generateId;
window.switchTab = switchTab;
window.switchProductTab = switchProductTab;
window.loadTabData = loadTabData;
window.checkUserTypeAndRedirect = checkUserTypeAndRedirect;
window.showLandingPage = showLandingPage;
window.showAdminDashboard = showAdminDashboard;
window.showTraderDashboard = showTraderDashboard;