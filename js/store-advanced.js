// Store Advanced Functions - Complete E-commerce Store

let currentStoreId = null;
let currentStoreData = null;
let currentCustomer = null;
let cart = [];
let wishlist = [];
let categories = [];
let products = [];
let filteredProducts = [];
let currentFilters = {
    category: 'all',
    priceRange: 'all',
    sortBy: 'newest'
};

// Initialize store
async function initializeStore() {
    try {
        showLoading('جاري تحميل المتجر...');
        
        // Get store ID from URL
        const urlParams = new URLSearchParams(window.location.search);
        currentStoreId = urlParams.get('id') || getStoreIdFromPath();
        
        if (!currentStoreId) {
            showNotification('معرف المتجر غير صحيح', 'error');
            return;
        }
        
        // Load store data
        await loadStoreData();
        
        // Load customer session for this specific store
        await loadCustomerSession();
        
        // Load cart and wishlist from localStorage for this store
        loadCartFromStorage();
        loadWishlistFromStorage();
        
        // Update UI
        updateCartCounter();
        updateWishlistCounter();
        
        // Load store content
        await loadStoreCategories();
        await loadStoreProducts();
        
        // Setup event listeners
        setupStoreEventListeners();
        
        // Initialize components
        initializeProductFilters();
        initializeSearchFunctionality();
        
    } catch (error) {
        console.error('Error initializing store:', error);
        showNotification('حدث خطأ في تحميل المتجر', 'error');
    } finally {
        hideLoading();
    }
}

function getStoreIdFromPath() {
    // Extract store ID from URL path or search params
    const path = window.location.pathname;
    const match = path.match(/\/store\/([^\/]+)/);
    return match ? match[1] : null;
}

async function loadStoreData() {
    try {
        const storeDoc = await db.collection('stores').doc(currentStoreId).get();
        
        if (!storeDoc.exists) {
            throw new Error('المتجر غير موجود');
        }
        
        currentStoreData = { id: currentStoreId, ...storeDoc.data() };
        
        // Apply store branding
        applyStoreBranding();
        
    } catch (error) {
        console.error('Error loading store data:', error);
        showNotification('المتجر غير موجود أو غير متاح', 'error');
        throw error;
    }
}

function applyStoreBranding() {
    if (!currentStoreData) return;
    
    const settings = currentStoreData.settings || {};
    
    // Update store name
    const storeNameElements = document.querySelectorAll('.store-name, .store-title');
    storeNameElements.forEach(el => {
        el.textContent = currentStoreData.name;
    });
    
    // Update store description
    const storeDescElements = document.querySelectorAll('.store-description');
    storeDescElements.forEach(el => {
        el.textContent = settings.description || 'مرحباً بكم في متجرنا الإلكتروني';
    });
    
    // Update store logo
    if (settings.logo) {
        const logoElements = document.querySelectorAll('.store-logo img');
        logoElements.forEach(el => {
            el.src = settings.logo;
            el.style.display = 'block';
        });
    }
    
    // Apply colors
    if (settings.colors) {
        const root = document.documentElement;
        root.style.setProperty('--primary-color', settings.colors.primary || '#1E40AF');
        root.style.setProperty('--secondary-color', settings.colors.secondary || '#0891B2');
        root.style.setProperty('--background-color', settings.colors.background || '#F8FAFC');
    }
    
    // Update contact info
    const phoneElements = document.querySelectorAll('.store-phone');
    phoneElements.forEach(el => {
        el.textContent = settings.phone || '';
    });
    
    const addressElements = document.querySelectorAll('.store-address');
    addressElements.forEach(el => {
        el.textContent = settings.address || '';
    });
    
    // Update page title
    document.title = currentStoreData.name || 'متجر إلكتروني';
}

// Customer Authentication for specific store
async function loadCustomerSession() {
    const customerData = getLocalStorage(`customer_${currentStoreId}`);
    if (customerData && customerData.uid) {
        try {
            // Verify customer exists in this store
            const customerDoc = await db.collection('stores')
                .doc(currentStoreId)
                .collection('customers')
                .doc(customerData.uid)
                .get();
            
            if (customerDoc.exists) {
                currentCustomer = { uid: customerData.uid, ...customerDoc.data() };
                updateCustomerUI();
            } else {
                // Customer not found, clear session
                removeLocalStorage(`customer_${currentStoreId}`);
            }
        } catch (error) {
            console.error('Error loading customer session:', error);
            removeLocalStorage(`customer_${currentStoreId}`);
        }
    }
}

function updateCustomerUI() {
    const loginBtn = document.querySelector('.customer-login-btn');
    const customerInfo = document.querySelector('.customer-info');
    
    if (currentCustomer) {
        if (loginBtn) {
            loginBtn.style.display = 'none';
        }
        if (customerInfo) {
            customerInfo.style.display = 'block';
            customerInfo.innerHTML = `
                <span>مرحباً ${currentCustomer.name}</span>
                <button onclick="customerLogout()" class="btn btn-outline btn-sm">تسجيل الخروج</button>
            `;
        }
    } else {
        if (loginBtn) {
            loginBtn.style.display = 'block';
        }
        if (customerInfo) {
            customerInfo.style.display = 'none';
        }
    }
}

async function customerLogin(email, password) {
    try {
        showLoading('جاري تسجيل الدخول...');
        
        // Sign in with Firebase Auth
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Check if customer exists in this store
        let customerDoc = await db.collection('stores')
            .doc(currentStoreId)
            .collection('customers')
            .doc(user.uid)
            .get();
        
        if (!customerDoc.exists) {
            // Create customer record in this store
            const customerData = {
                uid: user.uid,
                email: user.email,
                name: user.displayName || email.split('@')[0],
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                totalOrders: 0,
                totalSpent: 0
            };
            
            await db.collection('stores')
                .doc(currentStoreId)
                .collection('customers')
                .doc(user.uid)
                .set(customerData);
            
            currentCustomer = customerData;
        } else {
            currentCustomer = { uid: user.uid, ...customerDoc.data() };
        }
        
        // Save session for this store only
        setLocalStorage(`customer_${currentStoreId}`, {
            uid: user.uid,
            email: user.email,
            name: currentCustomer.name
        });
        
        updateCustomerUI();
        closeModal('customerLoginModal');
        showNotification('تم تسجيل الدخول بنجاح', 'success');
        
    } catch (error) {
        console.error('Customer login error:', error);
        let errorMessage = 'حدث خطأ في تسجيل الدخول';
        
        switch (error.code) {
            case 'auth/user-not-found':
                errorMessage = 'البريد الإلكتروني غير مسجل';
                break;
            case 'auth/wrong-password':
                errorMessage = 'كلمة المرور غير صحيحة';
                break;
            case 'auth/invalid-email':
                errorMessage = 'البريد الإلكتروني غير صحيح';
                break;
        }
        
        showNotification(errorMessage, 'error');
    } finally {
        hideLoading();
    }
}

async function customerRegister(name, email, password, phone) {
    try {
        showLoading('جاري إنشاء الحساب...');
        
        // Create user with Firebase Auth
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Update user profile
        await user.updateProfile({
            displayName: name
        });
        
        // Create customer record in this store
        const customerData = {
            uid: user.uid,
            email: email,
            name: name,
            phone: phone || '',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            totalOrders: 0,
            totalSpent: 0
        };
        
        await db.collection('stores')
            .doc(currentStoreId)
            .collection('customers')
            .doc(user.uid)
            .set(customerData);
        
        currentCustomer = customerData;
        
        // Save session for this store only
        setLocalStorage(`customer_${currentStoreId}`, {
            uid: user.uid,
            email: email,
            name: name
        });
        
        updateCustomerUI();
        closeModal('customerRegisterModal');
        showNotification('تم إنشاء الحساب بنجاح', 'success');
        
    } catch (error) {
        console.error('Customer register error:', error);
        let errorMessage = 'حدث خطأ في إنشاء الحساب';
        
        switch (error.code) {
            case 'auth/email-already-in-use':
                errorMessage = 'البريد الإلكتروني مستخدم بالفعل';
                break;
            case 'auth/weak-password':
                errorMessage = 'كلمة المرور ضعيفة جداً';
                break;
            case 'auth/invalid-email':
                errorMessage = 'البريد الإلكتروني غير صحيح';
                break;
        }
        
        showNotification(errorMessage, 'error');
    } finally {
        hideLoading();
    }
}

function customerLogout() {
    currentCustomer = null;
    removeLocalStorage(`customer_${currentStoreId}`);
    updateCustomerUI();
    
    // Clear cart and wishlist
    cart = [];
    wishlist = [];
    saveCartToStorage();
    saveWishlistToStorage();
    updateCartCounter();
    updateWishlistCounter();
    
    showNotification('تم تسجيل الخروج بنجاح', 'success');
}

// Categories Management
async function loadStoreCategories() {
    try {
        const productsSnapshot = await db.collection('stores')
            .doc(currentStoreId)
            .collection('products')
            .where('status', '==', 'active')
            .get();
        
        const categorySet = new Set();
        productsSnapshot.docs.forEach(doc => {
            const product = doc.data();
            if (product.category) {
                categorySet.add(product.category);
            }
        });
        
        categories = Array.from(categorySet);
        renderCategories();
        
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

function renderCategories() {
    const categoriesGrid = document.getElementById('categoriesGrid');
    if (!categoriesGrid) return;
    
    categoriesGrid.innerHTML = '';
    
    categories.forEach(category => {
        const categoryCard = document.createElement('div');
        categoryCard.className = 'category-card';
        categoryCard.innerHTML = `
            <div class="category-icon">🏷️</div>
            <h3>${category}</h3>
        `;
        categoryCard.addEventListener('click', () => filterByCategory(category));
        categoriesGrid.appendChild(categoryCard);
    });
}

// Products Management
async function loadStoreProducts() {
    try {
        const productsSnapshot = await db.collection('stores')
            .doc(currentStoreId)
            .collection('products')
            .where('status', '==', 'active')
            .orderBy('createdAt', 'desc')
            .get();
        
        products = productsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        filteredProducts = [...products];
        renderProducts();
        
    } catch (error) {
        console.error('Error loading products:', error);
        showNotification('حدث خطأ في تحميل المنتجات', 'error');
    }
}

function renderProducts() {
    const productsGrid = document.getElementById('productsGrid');
    if (!productsGrid) return;
    
    productsGrid.innerHTML = '';
    
    if (filteredProducts.length === 0) {
        productsGrid.innerHTML = `
            <div class="no-products">
                <div class="no-products-icon">📦</div>
                <h3>لا توجد منتجات</h3>
                <p>لم يتم العثور على منتجات تطابق البحث</p>
            </div>
        `;
        return;
    }
    
    filteredProducts.forEach(product => {
        const productCard = createProductCard(product);
        productsGrid.appendChild(productCard);
    });
}

function createProductCard(product) {
    const productCard = document.createElement('div');
    productCard.className = 'product-card';
    
    const isInWishlist = wishlist.some(item => item.id === product.id);
    const isInCart = cart.some(item => item.id === product.id);
    
    productCard.innerHTML = `
        <div class="product-image">
            ${product.image ? `<img src="${product.image}" alt="${product.name}">` : '<div class="no-image">📷</div>'}
            <div class="product-actions">
                <button class="wishlist-btn ${isInWishlist ? 'active' : ''}" onclick="toggleWishlist('${product.id}')">
                    ${isInWishlist ? '❤️' : '🤍'}
                </button>
                <button class="quick-view-btn" onclick="showProductDetails('${product.id}')">👁️</button>
            </div>
        </div>
        <div class="product-info">
            <h3 class="product-name">${product.name}</h3>
            <p class="product-category">${product.category}</p>
            <div class="product-price">
                <span class="current-price">${formatPrice(product.price)}</span>
                ${product.originalPrice && product.originalPrice > product.price ? 
                    `<span class="original-price">${formatPrice(product.originalPrice)}</span>` : ''}
            </div>
            <div class="product-rating">
                <div class="stars">⭐⭐⭐⭐⭐</div>
                <span class="rating-text">(${product.reviews || 0} تقييم)</span>
            </div>
            <div class="product-buttons">
                <button class="btn btn-primary add-to-cart-btn ${isInCart ? 'in-cart' : ''}" 
                        onclick="addToCart('${product.id}')" 
                        ${product.stock <= 0 ? 'disabled' : ''}>
                    ${isInCart ? 'في السلة' : product.stock <= 0 ? 'غير متوفر' : 'إضافة للسلة'}
                </button>
                <button class="btn btn-outline" onclick="buyNow('${product.id}')" 
                        ${product.stock <= 0 ? 'disabled' : ''}>
                    اشترِ الآن
                </button>
            </div>
        </div>
    `;
    
    return productCard;
}

// Cart Management
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    if (product.stock <= 0) {
        showNotification('المنتج غير متوفر', 'warning');
        return;
    }
    
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        if (existingItem.quantity < product.stock) {
            existingItem.quantity += 1;
            showNotification('تم زيادة الكمية في السلة', 'success');
        } else {
            showNotification('الكمية المطلوبة غير متوفرة', 'warning');
            return;
        }
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            quantity: 1,
            maxStock: product.stock
        });
        showNotification('تم إضافة المنتج للسلة', 'success');
    }
    
    saveCartToStorage();
    updateCartCounter();
    updateProductCardButtons(productId);
    
    // Add animation
    const cartBtn = document.querySelector('.cart-btn');
    if (cartBtn) {
        cartBtn.classList.add('cart-animation');
        setTimeout(() => cartBtn.classList.remove('cart-animation'), 600);
    }
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCartToStorage();
    updateCartCounter();
    updateProductCardButtons(productId);
    renderCartItems();
    showNotification('تم حذف المنتج من السلة', 'success');
}

function updateCartQuantity(productId, newQuantity) {
    const item = cart.find(item => item.id === productId);
    if (!item) return;
    
    if (newQuantity <= 0) {
        removeFromCart(productId);
        return;
    }
    
    if (newQuantity > item.maxStock) {
        showNotification('الكمية المطلوبة غير متوفرة', 'warning');
        return;
    }
    
    item.quantity = newQuantity;
    saveCartToStorage();
    updateCartCounter();
    renderCartItems();
}

function clearCart() {
    cart = [];
    saveCartToStorage();
    updateCartCounter();
    renderCartItems();
    showNotification('تم إفراغ السلة', 'success');
}

function updateCartCounter() {
    const cartCount = document.querySelector('.cart-count');
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    if (cartCount) {
        cartCount.textContent = totalItems;
        cartCount.style.display = totalItems > 0 ? 'block' : 'none';
    }
}

function saveCartToStorage() {
    setLocalStorage(`cart_${currentStoreId}`, cart);
}

function loadCartFromStorage() {
    cart = getLocalStorage(`cart_${currentStoreId}`, []);
}

// Wishlist Management
function toggleWishlist(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const existingIndex = wishlist.findIndex(item => item.id === productId);
    
    if (existingIndex > -1) {
        wishlist.splice(existingIndex, 1);
        showNotification('تم حذف المنتج من المفضلة', 'success');
    } else {
        wishlist.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image
        });
        showNotification('تم إضافة المنتج للمفضلة', 'success');
    }
    
    saveWishlistToStorage();
    updateWishlistCounter();
    updateProductCardButtons(productId);
}

function updateWishlistCounter() {
    const wishlistCount = document.querySelector('.wishlist-count');
    if (wishlistCount) {
        wishlistCount.textContent = wishlist.length;
        wishlistCount.style.display = wishlist.length > 0 ? 'block' : 'none';
    }
}

function saveWishlistToStorage() {
    setLocalStorage(`wishlist_${currentStoreId}`, wishlist);
}

function loadWishlistFromStorage() {
    wishlist = getLocalStorage(`wishlist_${currentStoreId}`, []);
}

// Product Filters and Search
function initializeProductFilters() {
    const categoryFilter = document.getElementById('categoryFilter');
    const priceFilter = document.getElementById('priceFilter');
    const sortFilter = document.getElementById('sortFilter');
    
    if (categoryFilter) {
        categoryFilter.innerHTML = '<option value="all">جميع الأقسام</option>';
        categories.forEach(category => {
            categoryFilter.innerHTML += `<option value="${category}">${category}</option>`;
        });
        categoryFilter.addEventListener('change', handleFilterChange);
    }
    
    if (priceFilter) {
        priceFilter.addEventListener('change', handleFilterChange);
    }
    
    if (sortFilter) {
        sortFilter.addEventListener('change', handleFilterChange);
    }
}

function initializeSearchFunctionality() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleSearch, 300));
    }
}

function handleFilterChange() {
    const categoryFilter = document.getElementById('categoryFilter');
    const priceFilter = document.getElementById('priceFilter');
    const sortFilter = document.getElementById('sortFilter');
    
    currentFilters.category = categoryFilter ? categoryFilter.value : 'all';
    currentFilters.priceRange = priceFilter ? priceFilter.value : 'all';
    currentFilters.sortBy = sortFilter ? sortFilter.value : 'newest';
    
    applyFilters();
}

function handleSearch(event) {
    const searchTerm = event.target.value.toLowerCase().trim();
    applyFilters(searchTerm);
}

function applyFilters(searchTerm = '') {
    filteredProducts = products.filter(product => {
        // Search filter
        if (searchTerm && !product.name.toLowerCase().includes(searchTerm) && 
            !product.description.toLowerCase().includes(searchTerm)) {
            return false;
        }
        
        // Category filter
        if (currentFilters.category !== 'all' && product.category !== currentFilters.category) {
            return false;
        }
        
        // Price filter
        if (currentFilters.priceRange !== 'all') {
            const price = product.price;
            switch (currentFilters.priceRange) {
                case 'under-100':
                    if (price >= 100) return false;
                    break;
                case '100-500':
                    if (price < 100 || price > 500) return false;
                    break;
                case '500-1000':
                    if (price < 500 || price > 1000) return false;
                    break;
                case 'over-1000':
                    if (price <= 1000) return false;
                    break;
            }
        }
        
        return true;
    });
    
    // Apply sorting
    switch (currentFilters.sortBy) {
        case 'price-low':
            filteredProducts.sort((a, b) => a.price - b.price);
            break;
        case 'price-high':
            filteredProducts.sort((a, b) => b.price - a.price);
            break;
        case 'name':
            filteredProducts.sort((a, b) => a.name.localeCompare(b.name, 'ar'));
            break;
        case 'newest':
        default:
            filteredProducts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            break;
    }
    
    renderProducts();
}

function filterByCategory(category) {
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
        categoryFilter.value = category;
        currentFilters.category = category;
        applyFilters();
    }
}

// Product Details Modal
function showProductDetails(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const modal = document.getElementById('productModal');
    if (!modal) return;
    
    const isInWishlist = wishlist.some(item => item.id === productId);
    const isInCart = cart.some(item => item.id === productId);
    
    modal.innerHTML = `
        <div class="modal-content large">
            <div class="modal-header">
                <h2>${product.name}</h2>
                <button class="close">&times;</button>
            </div>
            <div class="product-details">
                <div class="product-image">
                    ${product.image ? `<img src="${product.image}" alt="${product.name}">` : '<div class="no-image">📷</div>'}
                </div>
                <div class="product-info">
                    <div class="product-category">${product.category}</div>
                    <h2>${product.name}</h2>
                    <div class="product-price">
                        <span class="current-price">${formatPrice(product.price)}</span>
                        ${product.originalPrice && product.originalPrice > product.price ? 
                            `<span class="original-price">${formatPrice(product.originalPrice)}</span>` : ''}
                    </div>
                    <div class="product-rating">
                        <div class="stars">⭐⭐⭐⭐⭐</div>
                        <span class="rating-text">(${product.reviews || 0} تقييم)</span>
                    </div>
                    <div class="product-description">
                        <p>${product.description || 'لا يوجد وصف متاح'}</p>
                    </div>
                    <div class="quantity-selector">
                        <label>الكمية:</label>
                        <div class="quantity-controls">
                            <button onclick="changeQuantity(-1)">-</button>
                            <input type="number" id="productQuantity" value="1" min="1" max="${product.stock}">
                            <button onclick="changeQuantity(1)">+</button>
                        </div>
                        <span class="stock-info">متوفر: ${product.stock} قطعة</span>
                    </div>
                    <div class="product-actions">
                        <button class="btn btn-primary" onclick="addToCartWithQuantity('${productId}')" 
                                ${product.stock <= 0 ? 'disabled' : ''}>
                            ${isInCart ? 'في السلة' : 'إضافة للسلة'}
                        </button>
                        <button class="btn btn-outline" onclick="buyNow('${productId}')" 
                                ${product.stock <= 0 ? 'disabled' : ''}>
                            اشترِ الآن
                        </button>
                        <button class="btn btn-outline wishlist-btn ${isInWishlist ? 'active' : ''}" 
                                onclick="toggleWishlist('${productId}')">
                            ${isInWishlist ? '❤️ في المفضلة' : '🤍 إضافة للمفضلة'}
                        </button>
                    </div>
                </div>
            </div>
            <div class="product-tabs">
                <div class="tab-buttons">
                    <button class="tab-btn active" data-tab="description">الوصف</button>
                    <button class="tab-btn" data-tab="specifications">المواصفات</button>
                    <button class="tab-btn" data-tab="reviews">التقييمات</button>
                </div>
                <div class="tab-content">
                    <div class="tab-pane active" id="description">
                        <p>${product.description || 'لا يوجد وصف متاح'}</p>
                    </div>
                    <div class="tab-pane" id="specifications">
                        <p>المواصفات غير متوفرة حالياً</p>
                    </div>
                    <div class="tab-pane" id="reviews">
                        <p>لا توجد تقييمات حالياً</p>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    modal.classList.add('active');
    setupProductModalEvents();
}

function setupProductModalEvents() {
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            switchProductTab(tabId);
        });
    });
}

function changeQuantity(change) {
    const quantityInput = document.getElementById('productQuantity');
    if (!quantityInput) return;
    
    const currentValue = parseInt(quantityInput.value);
    const newValue = currentValue + change;
    const maxValue = parseInt(quantityInput.max);
    
    if (newValue >= 1 && newValue <= maxValue) {
        quantityInput.value = newValue;
    }
}

function addToCartWithQuantity(productId) {
    const quantityInput = document.getElementById('productQuantity');
    const quantity = quantityInput ? parseInt(quantityInput.value) : 1;
    
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    if (product.stock < quantity) {
        showNotification('الكمية المطلوبة غير متوفرة', 'warning');
        return;
    }
    
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        const newQuantity = existingItem.quantity + quantity;
        if (newQuantity <= product.stock) {
            existingItem.quantity = newQuantity;
            showNotification(`تم تحديث الكمية في السلة (${newQuantity})`, 'success');
        } else {
            showNotification('الكمية المطلوبة غير متوفرة', 'warning');
            return;
        }
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            quantity: quantity,
            maxStock: product.stock
        });
        showNotification(`تم إضافة ${quantity} من المنتج للسلة`, 'success');
    }
    
    saveCartToStorage();
    updateCartCounter();
    closeModal('productModal');
}

// Cart Modal
function showCart() {
    const modal = document.getElementById('cartModal');
    if (!modal) return;
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>سلة التسوق</h2>
                <button class="close">&times;</button>
            </div>
            <div class="cart-items" id="cartItems">
                ${renderCartItems()}
            </div>
            <div class="cart-summary">
                ${renderCartSummary()}
            </div>
        </div>
    `;
    
    modal.classList.add('active');
}

function renderCartItems() {
    if (cart.length === 0) {
        return `
            <div class="empty-cart">
                <div class="empty-cart-icon">🛒</div>
                <h3>السلة فارغة</h3>
                <p>لم تقم بإضافة أي منتجات للسلة بعد</p>
                <button class="btn btn-primary" onclick="closeModal('cartModal')">تصفح المنتجات</button>
            </div>
        `;
    }
    
    return cart.map(item => `
        <div class="cart-item">
            <div class="cart-item-image">
                ${item.image ? `<img src="${item.image}" alt="${item.name}">` : '<div class="no-image">📷</div>'}
            </div>
            <div class="cart-item-info">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">${formatPrice(item.price)}</div>
            </div>
            <div class="quantity-controls">
                <button onclick="updateCartQuantity('${item.id}', ${item.quantity - 1})">-</button>
                <span>${item.quantity}</span>
                <button onclick="updateCartQuantity('${item.id}', ${item.quantity + 1})">+</button>
            </div>
            <div class="cart-item-total">${formatPrice(item.price * item.quantity)}</div>
            <button class="remove-item" onclick="removeFromCart('${item.id}')">&times;</button>
        </div>
    `).join('');
}

function renderCartSummary() {
    if (cart.length === 0) return '';
    
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shippingFee = currentStoreData?.settings?.shippingFee || 15;
    const freeShippingThreshold = currentStoreData?.settings?.freeShippingThreshold || 200;
    const shipping = subtotal >= freeShippingThreshold ? 0 : shippingFee;
    const total = subtotal + shipping;
    
    return `
        <div class="summary-row">
            <span>المجموع الفرعي:</span>
            <span>${formatPrice(subtotal)}</span>
        </div>
        <div class="summary-row">
            <span>الشحن:</span>
            <span>${shipping === 0 ? 'مجاني' : formatPrice(shipping)}</span>
        </div>
        ${subtotal < freeShippingThreshold ? 
            `<div class="free-shipping-notice">
                أضف ${formatPrice(freeShippingThreshold - subtotal)} للحصول على شحن مجاني
            </div>` : ''}
        <div class="summary-row total">
            <span>المجموع:</span>
            <span>${formatPrice(total)}</span>
        </div>
        <div class="cart-actions">
            <button class="btn btn-outline" onclick="clearCart()">إفراغ السلة</button>
            <button class="btn btn-primary" onclick="proceedToCheckout()">إتمام الطلب</button>
        </div>
    `;
}

// Checkout Process
function proceedToCheckout() {
    if (!currentCustomer) {
        closeModal('cartModal');
        showCustomerLogin();
        showNotification('يرجى تسجيل الدخول أولاً', 'warning');
        return;
    }
    
    if (cart.length === 0) {
        showNotification('السلة فارغة', 'warning');
        return;
    }
    
    showCheckoutModal();
}

function showCheckoutModal() {
    const modal = document.getElementById('checkoutModal');
    if (!modal) {
        // Create checkout modal if it doesn't exist
        const checkoutModal = document.createElement('div');
        checkoutModal.id = 'checkoutModal';
        checkoutModal.className = 'modal';
        document.body.appendChild(checkoutModal);
    }
    
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shippingFee = currentStoreData?.settings?.shippingFee || 15;
    const freeShippingThreshold = currentStoreData?.settings?.freeShippingThreshold || 200;
    const shipping = subtotal >= freeShippingThreshold ? 0 : shippingFee;
    const total = subtotal + shipping;
    
    document.getElementById('checkoutModal').innerHTML = `
        <div class="modal-content large">
            <div class="modal-header">
                <h2>إتمام الطلب</h2>
                <button class="close">&times;</button>
            </div>
            <form id="checkoutForm" class="checkout-form">
                <div class="checkout-sections">
                    <div class="checkout-section">
                        <h3>معلومات التوصيل</h3>
                        <div class="form-row">
                            <div class="form-group">
                                <label>الاسم الكامل *</label>
                                <input type="text" id="customerName" value="${currentCustomer.name}" required>
                            </div>
                            <div class="form-group">
                                <label>رقم الهاتف *</label>
                                <input type="tel" id="customerPhone" value="${currentCustomer.phone || ''}" required>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>العنوان *</label>
                            <textarea id="customerAddress" rows="3" required placeholder="العنوان التفصيلي للتوصيل"></textarea>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>المدينة *</label>
                                <input type="text" id="customerCity" required>
                            </div>
                            <div class="form-group">
                                <label>الرمز البريدي</label>
                                <input type="text" id="postalCode">
                            </div>
                        </div>
                    </div>
                    
                    <div class="checkout-section">
                        <h3>طريقة الدفع</h3>
                        <div class="payment-methods">
                            ${currentStoreData?.settings?.codEnabled ? `
                                <label class="payment-method">
                                    <input type="radio" name="paymentMethod" value="cod" checked>
                                    <div class="payment-info">
                                        <strong>الدفع عند الاستلام</strong>
                                        <p>ادفع نقداً عند استلام الطلب</p>
                                    </div>
                                </label>
                            ` : ''}
                            ${currentStoreData?.settings?.onlinePaymentEnabled ? `
                                <label class="payment-method">
                                    <input type="radio" name="paymentMethod" value="online">
                                    <div class="payment-info">
                                        <strong>الدفع الإلكتروني</strong>
                                        <p>ادفع بالبطاقة الائتمانية أو mada</p>
                                    </div>
                                </label>
                            ` : ''}
                        </div>
                    </div>
                    
                    <div class="checkout-section">
                        <h3>ملخص الطلب</h3>
                        <div class="order-items">
                            ${cart.map(item => `
                                <div class="order-item">
                                    <span>${item.name} × ${item.quantity}</span>
                                    <span>${formatPrice(item.price * item.quantity)}</span>
                                </div>
                            `).join('')}
                        </div>
                        <div class="order-summary">
                            <div class="summary-row">
                                <span>المجموع الفرعي:</span>
                                <span>${formatPrice(subtotal)}</span>
                            </div>
                            <div class="summary-row">
                                <span>الشحن:</span>
                                <span>${shipping === 0 ? 'مجاني' : formatPrice(shipping)}</span>
                            </div>
                            <div class="summary-row total">
                                <span>المجموع:</span>
                                <span>${formatPrice(total)}</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="form-group">
                    <label>ملاحظات الطلب (اختياري)</label>
                    <textarea id="orderNotes" rows="3" placeholder="أي ملاحظات إضافية للطلب"></textarea>
                </div>
                
                <div class="checkout-actions">
                    <button type="button" class="btn btn-outline" onclick="closeModal('checkoutModal')">إلغاء</button>
                    <button type="submit" class="btn btn-primary">تأكيد الطلب</button>
                </div>
            </form>
        </div>
    `;
    
    document.getElementById('checkoutModal').classList.add('active');
    
    // Setup form submission
    document.getElementById('checkoutForm').addEventListener('submit', handleCheckoutSubmit);
}

async function handleCheckoutSubmit(e) {
    e.preventDefault();
    
    try {
        showLoading('جاري إنشاء الطلب...');
        
        // Get form data
        const formData = new FormData(e.target);
        const customerName = document.getElementById('customerName').value;
        const customerPhone = document.getElementById('customerPhone').value;
        const customerAddress = document.getElementById('customerAddress').value;
        const customerCity = document.getElementById('customerCity').value;
        const postalCode = document.getElementById('postalCode').value;
        const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
        const orderNotes = document.getElementById('orderNotes').value;
        
        // Validate required fields
        if (!customerName || !customerPhone || !customerAddress || !customerCity) {
            showNotification('يرجى ملء جميع الحقول المطلوبة', 'warning');
            return;
        }
        
        // Calculate totals
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const shippingFee = currentStoreData?.settings?.shippingFee || 15;
        const freeShippingThreshold = currentStoreData?.settings?.freeShippingThreshold || 200;
        const shipping = subtotal >= freeShippingThreshold ? 0 : shippingFee;
        const total = subtotal + shipping;
        
        // Create order
        const orderData = {
            customerId: currentCustomer.uid,
            customerName: customerName,
            customerPhone: customerPhone,
            customerEmail: currentCustomer.email,
            shippingAddress: {
                address: customerAddress,
                city: customerCity,
                postalCode: postalCode
            },
            items: cart.map(item => ({
                productId: item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                total: item.price * item.quantity
            })),
            subtotal: subtotal,
            shippingCost: shipping,
            total: total,
            paymentMethod: paymentMethod,
            status: 'pending',
            notes: orderNotes,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // Save order to database
        const orderRef = await db.collection('stores')
            .doc(currentStoreId)
            .collection('orders')
            .add(orderData);
        
        // Update customer data
        await db.collection('stores')
            .doc(currentStoreId)
            .collection('customers')
            .doc(currentCustomer.uid)
            .update({
                name: customerName,
                phone: customerPhone,
                totalOrders: firebase.firestore.FieldValue.increment(1),
                totalSpent: firebase.firestore.FieldValue.increment(total),
                lastOrderAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        
        // Update product stock
        for (const item of cart) {
            await db.collection('stores')
                .doc(currentStoreId)
                .collection('products')
                .doc(item.id)
                .update({
                    stock: firebase.firestore.FieldValue.increment(-item.quantity)
                });
        }
        
        // Clear cart
        cart = [];
        saveCartToStorage();
        updateCartCounter();
        
        // Show success message
        closeModal('checkoutModal');
        showOrderSuccess(orderRef.id);
        
    } catch (error) {
        console.error('Error creating order:', error);
        showNotification('حدث خطأ في إنشاء الطلب', 'error');
    } finally {
        hideLoading();
    }
}

function showOrderSuccess(orderId) {
    const modal = document.getElementById('orderSuccessModal');
    if (!modal) {
        const successModal = document.createElement('div');
        successModal.id = 'orderSuccessModal';
        successModal.className = 'modal';
        document.body.appendChild(successModal);
    }
    
    document.getElementById('orderSuccessModal').innerHTML = `
        <div class="modal-content">
            <div class="order-success">
                <div class="success-icon">✅</div>
                <h2>تم إنشاء الطلب بنجاح!</h2>
                <p>رقم الطلب: <strong>#${orderId.substring(0, 8)}</strong></p>
                <p>سيتم التواصل معك قريباً لتأكيد الطلب</p>
                <div class="success-actions">
                    <button class="btn btn-primary" onclick="closeModal('orderSuccessModal')">متابعة التسوق</button>
                    <button class="btn btn-outline" onclick="showCustomerOrders()">عرض طلباتي</button>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('orderSuccessModal').classList.add('active');
}

// Customer Orders
function showCustomerOrders() {
    if (!currentCustomer) {
        showCustomerLogin();
        return;
    }
    
    loadCustomerOrders();
}

async function loadCustomerOrders() {
    try {
        showLoading('جاري تحميل الطلبات...');
        
        const ordersSnapshot = await db.collection('stores')
            .doc(currentStoreId)
            .collection('orders')
            .where('customerId', '==', currentCustomer.uid)
            .orderBy('createdAt', 'desc')
            .get();
        
        const orders = ordersSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        showOrdersModal(orders);
        
    } catch (error) {
        console.error('Error loading customer orders:', error);
        showNotification('حدث خطأ في تحميل الطلبات', 'error');
    } finally {
        hideLoading();
    }
}

function showOrdersModal(orders) {
    const modal = document.getElementById('ordersModal');
    if (!modal) {
        const ordersModal = document.createElement('div');
        ordersModal.id = 'ordersModal';
        ordersModal.className = 'modal';
        document.body.appendChild(ordersModal);
    }
    
    document.getElementById('ordersModal').innerHTML = `
        <div class="modal-content large">
            <div class="modal-header">
                <h2>طلباتي</h2>
                <button class="close">&times;</button>
            </div>
            <div class="orders-list">
                ${orders.length === 0 ? `
                    <div class="no-orders">
                        <div class="no-orders-icon">📦</div>
                        <h3>لا توجد طلبات</h3>
                        <p>لم تقم بإنشاء أي طلبات بعد</p>
                        <button class="btn btn-primary" onclick="closeModal('ordersModal')">تصفح المنتجات</button>
                    </div>
                ` : orders.map(order => `
                    <div class="customer-order">
                        <div class="order-header">
                            <div class="order-info">
                                <h4>طلب #${order.id.substring(0, 8)}</h4>
                                <p>${formatDate(order.createdAt?.toDate())}</p>
                            </div>
                            <div class="order-status">
                                <span class="status-badge status-${order.status}">${getOrderStatusText(order.status)}</span>
                            </div>
                        </div>
                        <div class="order-items">
                            ${order.items.map(item => `
                                <div class="order-item">
                                    <span>${item.name} × ${item.quantity}</span>
                                    <span>${formatPrice(item.total)}</span>
                                </div>
                            `).join('')}
                        </div>
                        <div class="order-footer">
                            <div class="order-total">المجموع: ${formatPrice(order.total)}</div>
                            <div class="order-actions">
                                <button class="btn btn-outline btn-sm" onclick="showOrderDetails('${order.id}')">التفاصيل</button>
                                ${order.status === 'pending' ? `
                                    <button class="btn btn-danger btn-sm" onclick="cancelOrder('${order.id}')">إلغاء</button>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    document.getElementById('ordersModal').classList.add('active');
}

function getOrderStatusText(status) {
    const statusTexts = {
        pending: 'قيد المراجعة',
        processing: 'قيد التجهيز',
        shipped: 'تم الشحن',
        delivered: 'تم التسليم',
        cancelled: 'ملغي'
    };
    return statusTexts[status] || status;
}

// Buy Now Function
function buyNow(productId) {
    const product = products.find(p => p.id === productId);
    if (!product || product.stock <= 0) {
        showNotification('المنتج غير متوفر', 'warning');
        return;
    }
    
    // Clear cart and add only this product
    cart = [{
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity: 1,
        maxStock: product.stock
    }];
    
    saveCartToStorage();
    updateCartCounter();
    
    // Proceed to checkout
    proceedToCheckout();
}

// Helper Functions
function updateProductCardButtons(productId) {
    const isInCart = cart.some(item => item.id === productId);
    const isInWishlist = wishlist.some(item => item.id === productId);
    
    // Update add to cart buttons
    const cartButtons = document.querySelectorAll(`[onclick="addToCart('${productId}')"]`);
    cartButtons.forEach(btn => {
        btn.textContent = isInCart ? 'في السلة' : 'إضافة للسلة';
        btn.classList.toggle('in-cart', isInCart);
    });
    
    // Update wishlist buttons
    const wishlistButtons = document.querySelectorAll(`[onclick="toggleWishlist('${productId}')"]`);
    wishlistButtons.forEach(btn => {
        btn.textContent = isInWishlist ? '❤️' : '🤍';
        btn.classList.toggle('active', isInWishlist);
    });
}

// Event Listeners Setup
function setupStoreEventListeners() {
    // Customer login form
    const customerLoginForm = document.getElementById('customerLoginForm');
    if (customerLoginForm) {
        customerLoginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const email = document.getElementById('customerEmail').value;
            const password = document.getElementById('customerPassword').value;
            await customerLogin(email, password);
        });
    }
    
    // Customer register form
    const customerRegisterForm = document.getElementById('customerRegisterForm');
    if (customerRegisterForm) {
        customerRegisterForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const name = document.getElementById('customerRegName').value;
            const email = document.getElementById('customerRegEmail').value;
            const password = document.getElementById('customerRegPassword').value;
            const phone = document.getElementById('customerRegPhone').value;
            await customerRegister(name, email, password, phone);
        });
    }
    
    // Cart button
    const cartBtn = document.querySelector('.cart-btn');
    if (cartBtn) {
        cartBtn.addEventListener('click', showCart);
    }
    
    // Wishlist button
    const wishlistBtn = document.querySelector('.wishlist-btn');
    if (wishlistBtn) {
        wishlistBtn.addEventListener('click', showWishlist);
    }
    
    // Customer login button
    const customerLoginBtn = document.querySelector('.customer-login-btn');
    if (customerLoginBtn) {
        customerLoginBtn.addEventListener('click', showCustomerLogin);
    }
}

// Modal Functions
function showCustomerLogin() {
    const modal = document.getElementById('customerLoginModal');
    if (modal) {
        modal.classList.add('active');
    }
}

function showCustomerRegister() {
    closeModal('customerLoginModal');
    const modal = document.getElementById('customerRegisterModal');
    if (modal) {
        modal.classList.add('active');
    }
}

function showWishlist() {
    const modal = document.getElementById('wishlistModal');
    if (!modal) {
        const wishlistModal = document.createElement('div');
        wishlistModal.id = 'wishlistModal';
        wishlistModal.className = 'modal';
        document.body.appendChild(wishlistModal);
    }
    
    document.getElementById('wishlistModal').innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>المفضلة</h2>
                <button class="close">&times;</button>
            </div>
            <div class="wishlist-items">
                ${wishlist.length === 0 ? `
                    <div class="empty-wishlist">
                        <div class="empty-wishlist-icon">💝</div>
                        <h3>المفضلة فارغة</h3>
                        <p>لم تقم بإضافة أي منتجات للمفضلة بعد</p>
                        <button class="btn btn-primary" onclick="closeModal('wishlistModal')">تصفح المنتجات</button>
                    </div>
                ` : wishlist.map(item => `
                    <div class="wishlist-item">
                        <div class="wishlist-item-image">
                            ${item.image ? `<img src="${item.image}" alt="${item.name}">` : '<div class="no-image">📷</div>'}
                        </div>
                        <div class="wishlist-item-info">
                            <div class="wishlist-item-name">${item.name}</div>
                            <div class="wishlist-item-price">${formatPrice(item.price)}</div>
                        </div>
                        <div class="wishlist-item-actions">
                            <button class="btn btn-primary btn-sm" onclick="addToCart('${item.id}')">إضافة للسلة</button>
                            <button class="btn btn-outline btn-sm" onclick="toggleWishlist('${item.id}')">حذف</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    document.getElementById('wishlistModal').classList.add('active');
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
    }
}

// Utility Functions
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

// Initialize store when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('storeFrontend')) {
        initializeStore();
    }
});

// Make functions globally available
window.initializeStore = initializeStore;
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateCartQuantity = updateCartQuantity;
window.clearCart = clearCart;
window.toggleWishlist = toggleWishlist;
window.showProductDetails = showProductDetails;
window.showCart = showCart;
window.showWishlist = showWishlist;
window.showCustomerLogin = showCustomerLogin;
window.showCustomerRegister = showCustomerRegister;
window.customerLogout = customerLogout;
window.proceedToCheckout = proceedToCheckout;
window.buyNow = buyNow;
window.showCustomerOrders = showCustomerOrders;
window.closeModal = closeModal;
window.changeQuantity = changeQuantity;
window.addToCartWithQuantity = addToCartWithQuantity;
window.filterByCategory = filterByCategory;