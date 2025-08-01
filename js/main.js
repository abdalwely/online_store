// Main JavaScript File - Global Functions and Utilities

// Global variables
let currentPage = 'landing';
let isLoading = false;

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Hide loading screen
    setTimeout(() => {
        hideLoading();
    }, 1000);
    
    // Set up global event listeners
    setupGlobalEventListeners();
    
    // Check authentication state
    // تحقق من حالة المستخدم فقط إذا لم تكن صفحة المتجر
    if (typeof auth !== 'undefined' && !document.getElementById('storeFrontend')) {
        auth.onAuthStateChanged(function(user) {
            if (user) {
                checkUserTypeAndRedirect(user);
            } else {
                showLandingPage();
            }
        });
    }
    
    // Initialize page-specific functionality
    initializePageSpecific();
}

function setupGlobalEventListeners() {
    // Modal close events
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            e.target.classList.remove('active');
        }
        
        if (e.target.classList.contains('close')) {
            const modal = e.target.closest('.modal');
            if (modal) {
                modal.classList.remove('active');
            }
        }
    });
    
    // Tab switching
    document.addEventListener('click', function(e) {
        if (e.target.hasAttribute('data-tab')) {
            const tabId = e.target.getAttribute('data-tab');
            switchTab(tabId);
        }
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Escape key to close modals
        if (e.key === 'Escape') {
            const activeModal = document.querySelector('.modal.active');
            if (activeModal) {
                activeModal.classList.remove('active');
            }
        }
    });
    
    // Handle forms
    setupFormHandlers();
}

function setupFormHandlers() {
    // Prevent default form submission for forms with custom handlers
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        if (form.dataset.handled === 'true') {
            form.addEventListener('submit', function(e) {
                e.preventDefault();
            });
        }
    });
}

function initializePageSpecific() {
    // Check what page we're on and initialize accordingly
    if (document.getElementById('storeFrontend')) {
        // Store frontend
        if (typeof initializeStore === 'function') {
            initializeStore();
        }
    } else if (document.getElementById('adminDashboard')) {
        // Admin dashboard - will be initialized by auth
    } else if (document.getElementById('traderDashboard')) {
        // Trader dashboard - will be initialized by auth
    } else {
        // Landing page
        initializeLandingPage();
    }
}

function initializeLandingPage() {
    // Add smooth scrolling for navigation
    const navLinks = document.querySelectorAll('a[href^="#"]');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
    
    // Add animation on scroll
    observeElements();
}

function observeElements() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
            }
        });
    }, observerOptions);
    
    // Observe elements that should animate
    const animatedElements = document.querySelectorAll('.feature-card, .stat-card, .product-card');
    animatedElements.forEach(el => {
        observer.observe(el);
    });
}

// Navigation Functions
function showFeatures() {
    const featuresSection = document.getElementById('featuresSection');
    if (featuresSection) {
        featuresSection.scrollIntoView({ behavior: 'smooth' });
    }
}

// Loading Functions (Enhanced)
function showLoading(message = 'جاري التحميل...') {
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
        const loadingText = loadingElement.querySelector('p');
        if (loadingText) {
            loadingText.textContent = message;
        }
        loadingElement.style.display = 'flex';
    }
    isLoading = true;
}

function hideLoading() {
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
        loadingElement.style.display = 'none';
    }
    isLoading = false;
}

// Notification System (Enhanced)
let notificationQueue = [];
let isShowingNotification = false;

function showNotification(message, type = 'info', duration = 5000) {
    const notification = {
        message,
        type,
        duration,
        id: Date.now()
    };
    
    notificationQueue.push(notification);
    
    if (!isShowingNotification) {
        processNotificationQueue();
    }
}

function processNotificationQueue() {
    if (notificationQueue.length === 0) {
        isShowingNotification = false;
        return;
    }
    
    isShowingNotification = true;
    const notification = notificationQueue.shift();
    
    displayNotification(notification);
}

function displayNotification(notification) {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(n => n.remove());
    
    // Create notification element
    const notificationEl = document.createElement('div');
    notificationEl.className = `notification notification-${notification.type}`;
    notificationEl.innerHTML = `
        <div class="notification-content">
            <div class="notification-icon">${getNotificationIcon(notification.type)}</div>
            <span class="notification-message">${notification.message}</span>
            <button class="notification-close" onclick="closeNotification(this)">&times;</button>
        </div>
        <div class="notification-progress"></div>
    `;
    
    // Add styles if not already added
    if (!document.querySelector('#notification-styles')) {
        addNotificationStyles();
    }
    
    // Add to page
    document.body.appendChild(notificationEl);
    
    // Animate in
    setTimeout(() => {
        notificationEl.classList.add('show');
    }, 10);
    
    // Auto remove
    const progressBar = notificationEl.querySelector('.notification-progress');
    if (progressBar) {
        progressBar.style.animation = `notificationProgress ${notification.duration}ms linear`;
    }
    
    setTimeout(() => {
        closeNotification(notificationEl);
    }, notification.duration);
}

function addNotificationStyles() {
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
        
        .notification.show {
            transform: translateX(0);
        }
        
        .notification-content {
            padding: 16px;
            display: flex;
            align-items: center;
            gap: 12px;
        }
        
        .notification-icon {
            font-size: 20px;
        }
        
        .notification-message {
            flex: 1;
            font-weight: 500;
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
        
        .notification-progress {
            height: 3px;
            background: rgba(0, 0, 0, 0.1);
            position: relative;
        }
        
        .notification-progress::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            height: 100%;
            background: currentColor;
            width: 100%;
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
        
        @keyframes notificationProgress {
            from { width: 100%; }
            to { width: 0%; }
        }
        
        @media (max-width: 480px) {
            .notification {
                right: 10px;
                left: 10px;
                min-width: auto;
                max-width: none;
            }
        }
    `;
    document.head.appendChild(styles);
}

function getNotificationIcon(type) {
    const icons = {
        info: 'ℹ️',
        success: '✅',
        warning: '⚠️',
        error: '❌'
    };
    return icons[type] || icons.info;
}

function closeNotification(element) {
    let notificationEl;
    if (typeof element === 'string') {
        return; // Called from onclick attribute
    } else if (element.classList.contains('notification')) {
        notificationEl = element;
    } else {
        notificationEl = element.closest('.notification');
    }
    
    if (notificationEl) {
        notificationEl.classList.remove('show');
        setTimeout(() => {
            if (notificationEl.parentElement) {
                notificationEl.remove();
            }
            processNotificationQueue();
        }, 300);
    }
}

// Utility Functions
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

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Image Upload Helper
function handleImageUpload(file, callback) {
    if (!file) {
        callback(null);
        return;
    }
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
        showNotification('يرجى اختيار صورة صالحة', 'error');
        callback(null);
        return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        showNotification('حجم الصورة كبير جداً (الحد الأقصى 5 ميجا)', 'error');
        callback(null);
        return;
    }
    
    // Create preview
    const reader = new FileReader();
    reader.onload = function(e) {
        callback(e.target.result);
    };
    reader.readAsDataURL(file);
}

// Form Validation Helpers
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validatePhone(phone) {
    const re = /^(05|5)[0-9]{8}$/;
    return re.test(phone.replace(/\s/g, ''));
}

function validateRequired(value) {
    return value && value.trim().length > 0;
}

// Local Storage Helpers
function setLocalStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.warn('Could not save to localStorage:', error);
    }
}

function getLocalStorage(key, defaultValue = null) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.warn('Could not read from localStorage:', error);
        return defaultValue;
    }
}

function removeLocalStorage(key) {
    try {
        localStorage.removeItem(key);
    } catch (error) {
        console.warn('Could not remove from localStorage:', error);
    }
}

// Performance Monitoring
function measurePerformance(name, fn) {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    console.log(`${name} took ${(end - start).toFixed(2)} milliseconds`);
    return result;
}

// Error Handling
function handleError(error, context = 'عملية') {
    console.error(`Error in ${context}:`, error);
    
    let userMessage = `حدث خطأ في ${context}`;
    
    if (error.code) {
        switch (error.code) {
            case 'permission-denied':
                userMessage = 'ليس لديك صلاحية للقيام بهذه العملية';
                break;
            case 'not-found':
                userMessage = 'البيانات المطلوبة غير موجودة';
                break;
            case 'already-exists':
                userMessage = 'البيانات موجودة بالفعل';
                break;
            case 'invalid-argument':
                userMessage = 'البيانات المدخلة غير صحيحة';
                break;
            case 'unavailable':
                userMessage = 'الخدمة غير متاحة حالياً، يرجى المحاولة لاحقاً';
                break;
            default:
                userMessage = `حدث خطأ: ${error.message}`;
        }
    } else if (error.message) {
        userMessage = error.message;
    }
    
    showNotification(userMessage, 'error');
}

// Analytics Helper (placeholder for future implementation)
function trackEvent(eventName, parameters = {}) {
    console.log('Event tracked:', eventName, parameters);
    // Here you can integrate with Google Analytics, Firebase Analytics, etc.
}

// Make utility functions globally available
window.showFeatures = showFeatures;
window.formatPrice = formatPrice;
window.formatDate = formatDate;
window.generateId = generateId;
window.showNotification = showNotification;
window.closeNotification = closeNotification;
window.showLoading = showLoading;
window.hideLoading = hideLoading;
window.handleError = handleError;
window.validateEmail = validateEmail;
window.validatePhone = validatePhone;
window.validateRequired = validateRequired;
window.handleImageUpload = handleImageUpload;
window.setLocalStorage = setLocalStorage;
window.getLocalStorage = getLocalStorage;
window.removeLocalStorage = removeLocalStorage;
window.debounce = debounce;
window.throttle = throttle;
window.trackEvent = trackEvent;