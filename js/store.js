// Store Frontend Functions

// عرض أي خطأ JS عام كتنبيه بدلاً من الصفحة البيضاء
window.addEventListener('error', function (e) {
  try {
    showNotification('حدث خطأ تقني في المتجر: ' + e.message, 'error');
    const loading = document.getElementById('loading');
    if (loading) loading.style.display = 'none';
    const storeFrontend = document.getElementById('storeFrontend');
    if (storeFrontend) storeFrontend.innerHTML = '<div style="color:red;text-align:center;margin-top:2em">حدث خطأ في تحميل المتجر، يرجى المحاولة لاحقًا.<br>' + e.message + '</div>';
  } catch (err) {}
});

let currentStoreId = null;
let currentCustomer = null;
let cart = [];
let wishlist = [];
let storeData = null;
let storeProducts = [];
let categories = [];
let currentStoreAuth = null; // مصادقة منفصلة لكل متجر

// Initialize store
async function initializeStore() {
    console.log('[store] initializeStore started');
    try {
        showLoading();
        
        // Get store ID from URL parameter
        const urlParams = new URLSearchParams(window.location.search);
        currentStoreId = urlParams.get('id');
        
        if (!currentStoreId) {
            // If no store ID, show demo store or redirect to platform
            currentStoreId = 'demo-store';
        }
        
        // Initialize store-specific authentication
        initializeStoreAuth();
        
        // Load store data
        await loadStoreData();
        
        // Load products
        await loadStoreProducts();
        
        // Load categories
        loadCategories();
        
        // Load cart and wishlist from localStorage
        loadCartFromStorage();
        loadWishlistFromStorage();
        
        // Update UI
        updateCartCount();
        updateWishlistCount();
        
        // Check if customer is logged in for this specific store
        checkStoreCustomerAuth();
        
    } catch (error) {
        console.error('Error initializing store:', error);
        showNotification('حدث خطأ في تحميل المتجر: ' + error.message, 'error');
        const storeFrontend = document.getElementById('storeFrontend');
        if (storeFrontend) storeFrontend.innerHTML = '<div style="color:red;text-align:center;margin-top:2em">حدث خطأ في تحميل المتجر، يرجى المحاولة لاحقًا.<br>' + error.message + '</div>';
    } finally {
        hideLoading();
    }
}

// Initialize store-specific authentication
function initializeStoreAuth() {
    // Create separate auth state for this store
    const storeAuthKey = `store_auth_${currentStoreId}`;
    currentStoreAuth = getLocalStorage(storeAuthKey, null);
    
    // Listen for auth changes specific to this store
    if (typeof auth !== 'undefined') {
        auth.onAuthStateChanged(function(user) {
            if (user && currentStoreAuth && currentStoreAuth.uid === user.uid) {
                // User is logged in for this store
                updateStoreUIForLoggedCustomer(user);
            } else if (!user && currentStoreAuth) {
                // User logged out
                currentStoreAuth = null;
                setLocalStorage(storeAuthKey, null);
                updateStoreUIForGuest();
            }
        });
    }
}

function checkStoreCustomerAuth() {
    if (currentStoreAuth) {
        // Customer is logged in for this store
        updateStoreUIForLoggedCustomer(currentStoreAuth);
    } else {
        updateStoreUIForGuest();
    }
}

function updateStoreUIForLoggedCustomer(customerData) {
    currentCustomer = customerData;
    
    // Update login button to show customer name
    const loginBtn = document.querySelector('.store-actions .btn-outline');
    if (loginBtn) {
        loginBtn.textContent = `مرحباً ${customerData.displayName || customerData.email}`;
        loginBtn.onclick = () => showCustomerAccount();
    }
    
    // Show customer-specific features
    document.querySelectorAll('.customer-only').forEach(el => {
        el.style.display = 'block';
    });
}

function updateStoreUIForGuest() {
    currentCustomer = null;
    
    // Update login button
    const loginBtn = document.querySelector('.store-actions .btn-outline');
    if (loginBtn) {
        loginBtn.textContent = 'تسجيل الدخول';
        loginBtn.onclick = () => showCustomerLogin();
    }
    
    // Hide customer-specific features
    document.querySelectorAll('.customer-only').forEach(el => {
        el.style.display = 'none';
    });
}

async function loadStoreData() {
    console.log('[store] loadStoreData started');
    try {
        const storeDoc = await db.collection('stores').doc(currentStoreId).get();
        
        if (!storeDoc.exists) {
            // إنشاء متجر افتراضي متكامل وقابل للتخصيص
            const defaultStore = {
                name: 'متجري التجريبي',
                ownerId: null,
                template: 'base-v2',
                settings: {
                    logo: '',
                    cover: '',
                    colors: {
                        primary: '#1E40AF',
                        secondary: '#0891B2',
                        background: '#F8FAFC',
                        text: '#1E293B',
                        card: '#FFF',
                        offer: '#F59E42',
                        danger: '#EF4444',
                        success: '#22C55E',
                        warning: '#F59E42'
                    },
                    fontFamily: 'Cairo',
                    description: 'متجر إلكتروني تجريبي قابل للتعديل بالكامل من لوحة التحكم.',
                    phone: '',
                    address: '',
                    language: 'ar',
                    shippingFee: 15,
                    freeShippingThreshold: 200,
                    codEnabled: true,
                    onlinePaymentEnabled: true,
                    allowCustomization: true,
                    enableWishlist: true,
                    enableRatings: true,
                    enableCoupons: true,
                    enableNotifications: true
                },
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                status: 'active',
                demo: true
            };
            
            await db.collection('stores').doc(currentStoreId).set(defaultStore);
            
            // إضافة منتجات تجريبية
            const demoProducts = [
                {
                    name: 'ساعة ذكية عصرية',
                    description: 'ساعة ذكية مقاومة للماء مع شاشة لمس عالية الدقة وبطارية تدوم طويلاً.',
                    images: ['https://images.pexels.com/photos/437037/pexels-photo-437037.jpeg?auto=compress&cs=tinysrgb&w=300'],
                    price: 299,
                    salePrice: 249,
                    stock: 15,
                    category: 'إلكترونيات',
                    tags: ['جديد', 'خصم', 'مميز'],
                    status: 'active',
                    rating: 4.5,
                    reviewsCount: 23,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                    options: {
                        colors: ['أسود', 'فضي', 'ذهبي'],
                        sizes: ['صغير', 'متوسط', 'كبير']
                    }
                },
                {
                    name: 'حقيبة ظهر أنيقة',
                    description: 'حقيبة ظهر عصرية ومريحة مناسبة للمدرسة والعمل والسفر.',
                    images: ['https://images.pexels.com/photos/2905238/pexels-photo-2905238.jpeg?auto=compress&cs=tinysrgb&w=300'],
                    price: 120,
                    salePrice: 120,
                    stock: 25,
                    category: 'إكسسوارات',
                    tags: ['جديد', 'عملي'],
                    status: 'active',
                    rating: 4.2,
                    reviewsCount: 18,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                    options: {
                        colors: ['أحمر', 'أزرق', 'أسود', 'بني']
                    }
                },
                {
                    name: 'سماعات لاسلكية',
                    description: 'سماعات بلوتوث عالية الجودة مع إلغاء الضوضاء وصوت نقي.',
                    images: ['https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=300'],
                    price: 199,
                    salePrice: 159,
                    stock: 30,
                    category: 'إلكترونيات',
                    tags: ['خصم', 'مميز', 'جودة عالية'],
                    status: 'active',
                    rating: 4.7,
                    reviewsCount: 45,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                    options: {
                        colors: ['أبيض', 'أسود', 'أزرق']
                    }
                },
                {
                    name: 'قميص قطني مريح',
                    description: 'قميص قطني عالي الجودة مريح ومناسب للاستخدام اليومي.',
                    images: ['https://images.pexels.com/photos/996329/pexels-photo-996329.jpeg?auto=compress&cs=tinysrgb&w=300'],
                    price: 85,
                    salePrice: 85,
                    stock: 40,
                    category: 'ملابس',
                    tags: ['جديد', 'مريح'],
                    status: 'active',
                    rating: 4.3,
                    reviewsCount: 12,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                    options: {
                        colors: ['أبيض', 'أزرق', 'رمادي'],
                        sizes: ['صغير', 'متوسط', 'كبير', 'كبير جداً']
                    }
                }
            ];
            
            for (const product of demoProducts) {
                await db.collection('stores').doc(currentStoreId).collection('products').add(product);
            }
            
            storeData = defaultStore;
        } else {
            storeData = storeDoc.data();
        }
        
        // Update store UI with store data
        updateStoreUI();
        
    } catch (error) {
        console.error('Error loading store data:', error);
        throw error;
    }
}

function updateStoreUI() {
    console.log('[store] updateStoreUI started');
    if (!storeData) return;
    
    // تحقق من عناصر DOM الأساسية
    const storeTitle = document.getElementById('storeTitle');
    const footerStoreName = document.getElementById('footerStoreName');
    if (!storeTitle || !footerStoreName) {
        console.error('store.html is missing required elements: storeTitle or footerStoreName');
        return;
    }
    
    // Update store title
    document.getElementById('storeTitle').textContent = storeData.name;
    document.getElementById('footerStoreName').textContent = storeData.name;
    
    // Update store logo if exists
    if (storeData.settings && storeData.settings.logo) {
        const logoImg = document.getElementById('storeLogoImg');
        if (logoImg) {
            logoImg.src = storeData.settings.logo;
            logoImg.style.display = 'block';
        }
    }
    
    // Update store settings
    if (storeData.settings) {
        const settings = storeData.settings;
        
        // Update colors
        if (settings.colors) {
            document.documentElement.style.setProperty('--primary-color', settings.colors.primary || '#1E40AF');
            document.documentElement.style.setProperty('--secondary-color', settings.colors.secondary || '#0891B2');
            document.documentElement.style.setProperty('--light-gray', settings.colors.background || '#F8FAFC');
        }
        
        // Update font family
        if (settings.fontFamily) {
            document.body.style.fontFamily = `'${settings.fontFamily}', sans-serif`;
        }
        
        // Update footer information
        const footerDesc = document.getElementById('footerStoreDescription');
        const footerPhone = document.getElementById('footerStorePhone');
        const footerAddress = document.getElementById('footerStoreAddress');
        
        if (footerDesc && settings.description) {
            footerDesc.textContent = settings.description;
        }
        
        if (footerPhone && settings.phone) {
            footerPhone.textContent = 'الهاتف: ' + settings.phone;
        }
        
        if (footerAddress && settings.address) {
            footerAddress.textContent = 'العنوان: ' + settings.address;
        }
    }
    
    // Update page title
    document.title = storeData.name + ' - متجر إلكتروني';
}

async function loadStoreProducts() {
    console.log('[store] loadStoreProducts started');
    try {
        const productsSnapshot = await db.collection('stores').doc(currentStoreId).collection('products')
            .where('status', '==', 'active')
            .orderBy('createdAt', 'desc')
            .get();
        
        storeProducts = [];
        productsSnapshot.docs.forEach(doc => {
            storeProducts.push({ id: doc.id, ...doc.data() });
        });
        
        // Display products
        displayProducts(storeProducts);
        
    } catch (error) {
        console.error('Error loading store products:', error);
    }
}

function displayProducts(products) {
    console.log('[store] displayProducts started, products.length =', products ? products.length : 'undefined');
   
    const productsGrid = document.getElementById('storeProductsGrid');
    if (!productsGrid) return;
    
    productsGrid.innerHTML = '';
    
    if (products.length === 0) {
        productsGrid.innerHTML = '<div class="text-center"><p>لا توجد منتجات متاحة حالياً</p></div>';
        return;
    }
    
    products.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.onclick = () => showProductDetails(product);
        
        const hasDiscount = product.salePrice && product.salePrice < product.price;
        const discountPercent = hasDiscount ? Math.round(((product.price - product.salePrice) / product.price) * 100) : 0;
        const finalPrice = product.salePrice || product.price;
        
        productCard.innerHTML = `
            <div class="product-image">
                ${
                    Array.isArray(product.images) && product.images.length > 0 
                        ? `<img src="${product.images[0]}" alt="${product.name}" loading="lazy">` 
                        : '<div class="placeholder">لا توجد صورة</div>'
                }
                ${product.stock === 0 ? '<div class="out-of-stock">نفد المخزون</div>' : ''}
                ${hasDiscount ? `<div class="discount-badge">-${discountPercent}%</div>` : ''}
                <div class="product-actions-overlay">
                    <button class="btn-icon wishlist-btn ${isInWishlist(product.id) ? 'active' : ''}" 
                            onclick="event.stopPropagation(); toggleWishlist('${product.id}')" 
                            title="إضافة للمفضلة">
                        ❤️
                    </button>
                    <button class="btn-icon quick-view-btn" 
                            onclick="event.stopPropagation(); showProductDetails(${JSON.stringify(product).replace(/"/g, '&quot;')})" 
                            title="عرض سريع">
                        👁️
                    </button>
                </div>
            </div>
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <div class="product-rating">
                    ${generateStars(product.rating || 0)}
                    <span class="rating-text">(${product.reviewsCount || 0})</span>
                </div>
                <div class="product-price">
                    <span class="current-price">${formatPrice(finalPrice)}</span>
                    ${hasDiscount ? `<span class="original-price">${formatPrice(product.price)}</span>` : ''}
                </div>
                <p class="product-description">${(product.description || '').substring(0, 100)}${(product.description || '').length > 100 ? '...' : ''}</p>
                <div class="product-actions">
                    <button class="btn btn-primary btn-sm" 
                            onclick="event.stopPropagation(); addToCartQuick('${product.id}')" 
                            ${product.stock === 0 ? 'disabled' : ''}>
                        ${product.stock === 0 ? 'نفد المخزون' : 'إضافة للسلة'}
                    </button>
                    <button class="btn btn-outline btn-sm" 
                            onclick="event.stopPropagation(); buyNow('${product.id}')"
                            ${product.stock === 0 ? 'disabled' : ''}>
                        اشترِ الآن
                    </button>
                </div>
            </div>
        `;
        productsGrid.appendChild(productCard);
    });
}

function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    let starsHTML = '';
    
    for (let i = 0; i < fullStars; i++) {
        starsHTML += '⭐';
    }
    
    if (hasHalfStar) {
        starsHTML += '⭐'; // يمكن استخدام نجمة نصف ممتلئة هنا
    }
    
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
        starsHTML += '☆';
    }
    
    return `<span class="stars">${starsHTML}</span>`;
}

function loadCategories() {
    // Extract unique categories from products
    categories = [...new Set(storeProducts.map(product => product.category).filter(Boolean))];
    
    // Update category filter
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
        categoryFilter.innerHTML = '<option value="">جميع الأقسام</option>';
        
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categoryFilter.appendChild(option);
        });
    }
    
    // Display categories grid
    displayCategories();
}

function displayCategories() {
    const categoriesGrid = document.getElementById('categoriesGrid');
    if (!categoriesGrid) return;
    
    categoriesGrid.innerHTML = '';
    
    if (categories.length === 0) {
        categoriesGrid.innerHTML = '<div class="text-center"><p>لا توجد أقسام متاحة</p></div>';
        return;
    }
    
    categories.forEach(category => {
        // Count products in this category
        const productCount = storeProducts.filter(p => p.category === category).length;
        
        const categoryCard = document.createElement('div');
        categoryCard.className = 'category-card';
        categoryCard.onclick = () => filterByCategory(category);
        
        categoryCard.innerHTML = `
            <div class="category-icon">${getCategoryIcon(category)}</div>
            <h3>${category}</h3>
            <p>${productCount} منتج</p>
        `;
        categoriesGrid.appendChild(categoryCard);
    });
}

function getCategoryIcon(category) {
    const icons = {
        'أزياء': '👕',
        'إلكترونيات': '📱',
        'منزل ومطبخ': '🏠',
        'رياضة': '⚽',
        'كتب': '📚',
        'طعام': '🍕',
        'ملابس رجالية': '👔',
        'ملابس نسائية': '👗',
        'ملابس': '👕',
        'أطفال': '🧸',
        'إكسسوارات': '👜'
    };
    return icons[category] || '📦';
}

// Wishlist Functions
function toggleWishlist(productId) {
    if (isInWishlist(productId)) {
        removeFromWishlist(productId);
    } else {
        addToWishlist(productId);
    }
}

function addToWishlist(productId) {
    const product = storeProducts.find(p => p.id === productId);
    if (!product) {
        showNotification('المنتج غير موجود', 'error');
        return;
    }
    
    if (!isInWishlist(productId)) {
        wishlist.push({
            productId: productId,
            name: product.name,
            price: product.salePrice || product.price,
            image: Array.isArray(product.images) ? product.images[0] : null,
            addedAt: new Date().toISOString()
        });
        
        saveWishlistToStorage();
        updateWishlistCount();
        updateWishlistButtons();
        showNotification('تم إضافة المنتج للمفضلة', 'success');
    }
}

function removeFromWishlist(productId) {
    const index = wishlist.findIndex(item => item.productId === productId);
    if (index > -1) {
        wishlist.splice(index, 1);
        saveWishlistToStorage();
        updateWishlistCount();
        updateWishlistButtons();
        showNotification('تم حذف المنتج من المفضلة', 'success');
    }
}

function isInWishlist(productId) {
    return wishlist.some(item => item.productId === productId);
}

function updateWishlistButtons() {
    document.querySelectorAll('.wishlist-btn').forEach(btn => {
        const productId = btn.getAttribute('onclick').match(/'([^']+)'/)[1];
        if (isInWishlist(productId)) {
            btn.classList.add('active');
            btn.style.color = '#ef4444';
        } else {
            btn.classList.remove('active');
            btn.style.color = '#6b7280';
        }
    });
}

function updateWishlistCount() {
    const wishlistCount = document.getElementById('wishlistCount');
    if (wishlistCount) {
        wishlistCount.textContent = wishlist.length;
    }
}

function showWishlist() {
    updateWishlistDisplay();
    document.getElementById('wishlistModal').classList.add('active');
}

function updateWishlistDisplay() {
    const wishlistItems = document.getElementById('wishlistItems');
    if (!wishlistItems) return;
    
    wishlistItems.innerHTML = '';
    
    if (wishlist.length === 0) {
        wishlistItems.innerHTML = '<div class="text-center"><p>المفضلة فارغة</p></div>';
        return;
    }
    
    wishlist.forEach((item, index) => {
        const wishlistItem = document.createElement('div');
        wishlistItem.className = 'wishlist-item';
        wishlistItem.innerHTML = `
            <div class="wishlist-item-image">
                ${item.image ? `<img src="${item.image}" alt="${item.name}">` : '<div class="placeholder">صورة</div>'}
            </div>
            <div class="wishlist-item-info">
                <div class="wishlist-item-name">${item.name}</div>
                <div class="wishlist-item-price">${formatPrice(item.price)}</div>
            </div>
            <div class="wishlist-item-actions">
                <button class="btn btn-primary btn-sm" onclick="addToCartFromWishlist('${item.productId}')">
                    إضافة للسلة
                </button>
                <button class="btn btn-danger btn-sm" onclick="removeFromWishlist('${item.productId}')">
                    حذف
                </button>
            </div>
        `;
        wishlistItems.appendChild(wishlistItem);
    });
}

function addToCartFromWishlist(productId) {
    addToCartQuick(productId);
    // Optionally remove from wishlist after adding to cart
    // removeFromWishlist(productId);
}

// Product Details Modal Functions
function showProductDetails(product) {
    const modal = document.getElementById('productModal');
    if (!modal) return;
    
    // Update modal content
    const modalImage = document.getElementById('productModalImage');
    const modalName = document.getElementById('productModalName');
    const modalPrice = document.getElementById('productModalPrice');
    const modalOriginalPrice = document.getElementById('productModalOriginalPrice');
    const modalDescription = document.getElementById('productModalDescription');
    const fullDescription = document.getElementById('productFullDescription');
    
    if (modalImage) {
        modalImage.src = Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : '';
    }
    if (modalName) modalName.textContent = product.name;
    
    const finalPrice = product.salePrice || product.price;
    const hasDiscount = product.salePrice && product.salePrice < product.price;
    
    if (modalPrice) modalPrice.textContent = formatPrice(finalPrice);
    if (modalOriginalPrice) {
        if (hasDiscount) {
            modalOriginalPrice.textContent = formatPrice(product.price);
            modalOriginalPrice.style.display = 'inline';
        } else {
            modalOriginalPrice.style.display = 'none';
        }
    }
    
    if (modalDescription) modalDescription.textContent = product.description || '';
    if (fullDescription) fullDescription.textContent = product.description || '';
    
    // Set product quantity
    const quantityInput = document.getElementById('productQuantity');
    if (quantityInput) {
        quantityInput.value = 1;
        quantityInput.max = product.stock || 1;
    }
    
    // Update add to cart button
    const addToCartBtn = modal.querySelector('.btn-primary');
    if (addToCartBtn) {
        if (product.stock === 0) {
            addToCartBtn.textContent = 'نفد المخزون';
            addToCartBtn.disabled = true;
        } else {
            addToCartBtn.textContent = 'إضافة للسلة';
            addToCartBtn.disabled = false;
            addToCartBtn.onclick = () => addToCart(product.id);
        }
    }
    
    // Update buy now button
    const buyNowBtn = modal.querySelector('.btn-outline');
    if (buyNowBtn) {
        if (product.stock === 0) {
            buyNowBtn.disabled = true;
        } else {
            buyNowBtn.disabled = false;
            buyNowBtn.onclick = () => buyNow(product.id);
        }
    }
    
    // Store current product for modal actions
    modal.dataset.productId = product.id;
    
    modal.classList.add('active');
}

function changeQuantity(delta) {
    const quantityInput = document.getElementById('productQuantity');
    if (!quantityInput) return;
    
    let newQuantity = parseInt(quantityInput.value) + delta;
    
    if (newQuantity < 1) newQuantity = 1;
    if (newQuantity > parseInt(quantityInput.max)) newQuantity = parseInt(quantityInput.max);
    
    quantityInput.value = newQuantity;
}

// Cart Functions
function addToCartQuick(productId) {
    addToCart(productId, 1);
}

function addToCart(productId, quantity = null) {
    const product = storeProducts.find(p => p.id === productId);
    if (!product) {
        showNotification('المنتج غير موجود', 'error');
        return;
    }
    
    if (product.stock === 0) {
        showNotification('المنتج غير متوفر في المخزون', 'error');
        return;
    }
    
    // Get quantity from modal if not provided
    if (quantity === null) {
        const quantityInput = document.getElementById('productQuantity');
        quantity = quantityInput ? parseInt(quantityInput.value) || 1 : 1;
    }
    
    // Check if product already in cart
    const existingItem = cart.find(item => item.productId === productId);
    
    if (existingItem) {
        const newQuantity = existingItem.quantity + quantity;
        if (newQuantity > product.stock) {
            showNotification(`الكمية المطلوبة غير متوفرة. المتوفر: ${product.stock}`, 'warning');
            return;
        }
        existingItem.quantity = newQuantity;
    } else {
        if (quantity > product.stock) {
            showNotification(`الكمية المطلوبة غير متوفرة. المتوفر: ${product.stock}`, 'warning');
            return;
        }
        
        cart.push({
            productId: productId,
            name: product.name,
            price: product.salePrice || product.price,
            originalPrice: product.price,
            image: Array.isArray(product.images) ? product.images[0] : null,
            quantity: quantity
        });
    }
    
    // Save cart to localStorage
    saveCartToStorage();
    
    // Update cart UI
    updateCartCount();
    
    // Add animation to cart button
    const cartBtn = document.querySelector('.cart-btn');
    if (cartBtn) {
        cartBtn.classList.add('cart-animation');
        setTimeout(() => cartBtn.classList.remove('cart-animation'), 600);
    }
    
    showNotification('تم إضافة المنتج للسلة بنجاح', 'success');
    
    // Close product modal if open
    closeModal('productModal');
}

function buyNow(productId) {
    addToCart(productId);
    showCart();
}

function updateCartCount() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartCount = document.getElementById('cartCount');
    if (cartCount) {
        cartCount.textContent = totalItems;
    }
}

function showCart() {
    updateCartDisplay();
    const cartModal = document.getElementById('cartModal');
    if (cartModal) {
        cartModal.classList.add('active');
    }
}

function updateCartDisplay() {
    const cartItems = document.getElementById('cartItems');
    if (!cartItems) return;
    
    cartItems.innerHTML = '';
    
    if (cart.length === 0) {
        cartItems.innerHTML = '<div class="text-center empty-cart"><div class="empty-cart-icon">🛒</div><h3>السلة فارغة</h3><p>لم تقم بإضافة أي منتجات بعد</p></div>';
        updateCartSummary(0);
        return;
    }
    
    let subtotal = 0;
    
    cart.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;
        
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <div class="cart-item-image">
                ${item.image ? `<img src="${item.image}" alt="${item.name}">` : '<div class="placeholder">صورة</div>'}
            </div>
            <div class="cart-item-info">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">${formatPrice(item.price)}</div>
            </div>
            <div class="cart-item-quantity">
                <button class="quantity-btn" onclick="changeCartItemQuantity(${index}, -1)">-</button>
                <span class="quantity-display">${item.quantity}</span>
                <button class="quantity-btn" onclick="changeCartItemQuantity(${index}, 1)">+</button>
            </div>
            <div class="cart-item-total">${formatPrice(itemTotal)}</div>
            <button class="cart-item-remove" onclick="removeFromCart(${index})" title="حذف المنتج">×</button>
        `;
        cartItems.appendChild(cartItem);
    });
    
    updateCartSummary(subtotal);
}

function changeCartItemQuantity(index, delta) {
    const item = cart[index];
    const product = storeProducts.find(p => p.id === item.productId);
    
    if (!product) {
        showNotification('المنتج غير موجود', 'error');
        return;
    }
    
    const newQuantity = item.quantity + delta;
    
    if (newQuantity <= 0) {
        removeFromCart(index);
        return;
    }
    
    if (newQuantity > product.stock) {
        showNotification(`الكمية المطلوبة غير متوفرة. المتوفر: ${product.stock}`, 'warning');
        return;
    }
    
    item.quantity = newQuantity;
    saveCartToStorage();
    updateCartDisplay();
    updateCartCount();
}

function removeFromCart(index) {
    cart.splice(index, 1);
    saveCartToStorage();
    updateCartDisplay();
    updateCartCount();
    showNotification('تم حذف المنتج من السلة', 'success');
}

function updateCartSummary(subtotal) {
    const shippingCost = calculateShippingCost(subtotal);
    const total = subtotal + shippingCost;
    
    const subtotalEl = document.getElementById('subtotal');
    const shippingCostEl = document.getElementById('shippingCost');
    const totalAmountEl = document.getElementById('totalAmount');
    
    if (subtotalEl) subtotalEl.textContent = formatPrice(subtotal);
    if (shippingCostEl) shippingCostEl.textContent = shippingCost === 0 ? 'مجاني' : formatPrice(shippingCost);
    if (totalAmountEl) totalAmountEl.textContent = formatPrice(total);
}

function calculateShippingCost(subtotal) {
    if (!storeData || !storeData.settings) return 0;
    
    const settings = storeData.settings;
    const freeShippingThreshold = settings.freeShippingThreshold || 200;
    const shippingFee = settings.shippingFee || 15;
    
    return subtotal >= freeShippingThreshold ? 0 : shippingFee;
}

// Checkout Functions
function proceedToCheckout() {
    if (cart.length === 0) {
        showNotification('السلة فارغة', 'warning');
        return;
    }
    
    // Check if customer is logged in for this store
    if (!currentCustomer) {
        showNotification('يجب تسجيل الدخول أولاً', 'warning');
        showCustomerLogin();
        return;
    }
    
    // Show checkout form
    showCheckoutForm();
}

function showCheckoutForm() {
    closeModal('cartModal');
    const checkoutModal = document.getElementById('checkoutModal');
    if (checkoutModal) {
        updateCheckoutSummary();
        checkoutModal.classList.add('active');
    }
}

function updateCheckoutSummary() {
    const checkoutItems = document.getElementById('checkoutItems');
    if (!checkoutItems) return;
    
    checkoutItems.innerHTML = '';
    
    let subtotal = 0;
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;
        
        const checkoutItem = document.createElement('div');
        checkoutItem.className = 'checkout-item';
        checkoutItem.innerHTML = `
            <span>${item.name} × ${item.quantity}</span>
            <span>${formatPrice(itemTotal)}</span>
        `;
        checkoutItems.appendChild(checkoutItem);
    });
    
    const shippingCost = calculateShippingCost(subtotal);
    const total = subtotal + shippingCost;
    
    const checkoutSubtotal = document.getElementById('checkoutSubtotal');
    const checkoutShipping = document.getElementById('checkoutShipping');
    const checkoutTotal = document.getElementById('checkoutTotal');
    
    if (checkoutSubtotal) checkoutSubtotal.textContent = formatPrice(subtotal);
    if (checkoutShipping) checkoutShipping.textContent = shippingCost === 0 ? 'مجاني' : formatPrice(shippingCost);
    if (checkoutTotal) checkoutTotal.textContent = formatPrice(total);
}

async function createOrder() {
    try {
        showLoading('جاري إنشاء الطلب...');
        
        // Get customer information from form
        const customerName = document.getElementById('customerName')?.value || currentCustomer.displayName || currentCustomer.email;
        const customerPhone = document.getElementById('customerPhone')?.value || '';
        const customerAddress = document.getElementById('customerAddress')?.value || '';
        const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value || 'COD';
        const orderNotes = document.getElementById('orderNotes')?.value || '';
        
        if (!customerName || !customerPhone || !customerAddress) {
            showNotification('يرجى ملء جميع البيانات المطلوبة', 'warning');
            return;
        }
        
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const shippingCost = calculateShippingCost(subtotal);
        const total = subtotal + shippingCost;
        
        const orderData = {
            customerId: currentCustomer.uid,
            customerName: customerName,
            customerPhone: customerPhone,
            customerAddress: customerAddress,
            customerEmail: currentCustomer.email,
            items: cart.map(item => ({
                productId: item.productId,
                name: item.name,
                price: item.price,
                originalPrice: item.originalPrice,
                quantity: item.quantity,
                image: item.image
            })),
            subtotal: subtotal,
            shippingCost: shippingCost,
            total: total,
            status: 'pending',
            paymentMethod: paymentMethod,
            orderNotes: orderNotes,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // Create order in Firestore
        const orderRef = await db.collection('stores').doc(currentStoreId).collection('orders').add(orderData);
        
        // Update product stock
        for (const item of cart) {
            const productRef = db.collection('stores').doc(currentStoreId).collection('products').doc(item.productId);
            const productDoc = await productRef.get();
            if (productDoc.exists) {
                const currentStock = productDoc.data().stock || 0;
                await productRef.update({
                    stock: Math.max(0, currentStock - item.quantity)
                });
            }
        }
        
        // Update or create customer record
        const customerRef = db.collection('stores').doc(currentStoreId).collection('customers').doc(currentCustomer.uid);
        const customerDoc = await customerRef.get();
        
        if (customerDoc.exists) {
            await customerRef.update({
                name: customerName,
                phone: customerPhone,
                address: customerAddress,
                totalOrders: firebase.firestore.FieldValue.increment(1),
                totalSpent: firebase.firestore.FieldValue.increment(total),
                lastOrderAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        } else {
            await customerRef.set({
                name: customerName,
                email: currentCustomer.email,
                phone: customerPhone,
                address: customerAddress,
                totalOrders: 1,
                totalSpent: total,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastOrderAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
        
        // Clear cart
        cart = [];
        saveCartToStorage();
        updateCartCount();
        
        // Close checkout modal
        closeModal('checkoutModal');
        
        // Show success message
        showOrderSuccess(orderRef.id);
        
        // Reload products to update stock
        await loadStoreProducts();
        
    } catch (error) {
        console.error('Error creating order:', error);
        showNotification('حدث خطأ في إنشاء الطلب', 'error');
    } finally {
        hideLoading();
    }
}

function showOrderSuccess(orderId) {
    const successModal = document.getElementById('orderSuccessModal');
    if (successModal) {
        const orderIdEl = document.getElementById('successOrderId');
        if (orderIdEl) {
            orderIdEl.textContent = orderId.substring(0, 8).toUpperCase();
        }
        successModal.classList.add('active');
    } else {
        showNotification(`تم إنشاء الطلب بنجاح! رقم الطلب: ${orderId.substring(0, 8).toUpperCase()}`, 'success');
    }
}

// Customer Authentication Functions
async function customerLogin() {
    const email = document.getElementById('customerLoginEmail')?.value;
    const password = document.getElementById('customerLoginPassword')?.value;
    
    if (!email || !password) {
        showNotification('يرجى ملء جميع الحقول', 'warning');
        return;
    }
    
    try {
        showLoading('جاري تسجيل الدخول...');
        
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Store customer auth for this specific store
        const storeAuthKey = `store_auth_${currentStoreId}`;
        const customerData = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            storeId: currentStoreId,
            loginAt: new Date().toISOString()
        };
        
        setLocalStorage(storeAuthKey, customerData);
        currentStoreAuth = customerData;
        
        // Update UI
        updateStoreUIForLoggedCustomer(customerData);
        
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
            case 'auth/too-many-requests':
                errorMessage = 'تم تجاوز عدد المحاولات المسموحة';
                break;
        }
        
        showNotification(errorMessage, 'error');
    } finally {
        hideLoading();
    }
}

async function customerRegister() {
    const name = document.getElementById('customerRegisterName')?.value;
    const email = document.getElementById('customerRegisterEmail')?.value;
    const password = document.getElementById('customerRegisterPassword')?.value;
    const confirmPassword = document.getElementById('customerRegisterConfirmPassword')?.value;
    
    if (!name || !email || !password || !confirmPassword) {
        showNotification('يرجى ملء جميع الحقول', 'warning');
        return;
    }
    
    if (password !== confirmPassword) {
        showNotification('كلمة المرور غير متطابقة', 'warning');
        return;
    }
    
    if (password.length < 6) {
        showNotification('كلمة المرور يجب أن تكون 6 أحرف على الأقل', 'warning');
        return;
    }
    
    try {
        showLoading('جاري إنشاء الحساب...');
        
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Update user profile
        await user.updateProfile({
            displayName: name
        });
        
        // Store customer auth for this specific store
        const storeAuthKey = `store_auth_${currentStoreId}`;
        const customerData = {
            uid: user.uid,
            email: user.email,
            displayName: name,
            storeId: currentStoreId,
            loginAt: new Date().toISOString()
        };
        
        setLocalStorage(storeAuthKey, customerData);
        currentStoreAuth = customerData;
        
        // Create customer record in store
        await db.collection('stores').doc(currentStoreId).collection('customers').doc(user.uid).set({
            name: name,
            email: email,
            totalOrders: 0,
            totalSpent: 0,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Update UI
        updateStoreUIForLoggedCustomer(customerData);
        
        closeModal('customerRegisterModal');
        showNotification('تم إنشاء الحساب بنجاح', 'success');
        
    } catch (error) {
        console.error('Customer register error:', error);
        let errorMessage = 'حدث خطأ في إنشاء الحساب';
        
        switch (error.code) {
            case 'auth/email-already-in-use':
                errorMessage = 'البريد الإلكتروني مستخدم بالفعل';
                break;
            case 'auth/invalid-email':
                errorMessage = 'البريد الإلكتروني غير صحيح';
                break;
            case 'auth/weak-password':
                errorMessage = 'كلمة المرور ضعيفة جداً';
                break;
        }
        
        showNotification(errorMessage, 'error');
    } finally {
        hideLoading();
    }
}

function customerLogout() {
    // Clear store-specific auth
    const storeAuthKey = `store_auth_${currentStoreId}`;
    setLocalStorage(storeAuthKey, null);
    currentStoreAuth = null;
    currentCustomer = null;
    
    // Update UI
    updateStoreUIForGuest();
    
    showNotification('تم تسجيل الخروج بنجاح', 'success');
}

function showCustomerAccount() {
    // Show customer account modal or page
    showNotification('ميزة حساب العميل قيد التطوير', 'info');
}

// Filter and Search Functions
function filterByCategory(category) {
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
        categoryFilter.value = category;
    }
    applyFilters();
}

function applyFilters() {
    const categoryFilter = document.getElementById('categoryFilter')?.value || '';
    const priceFilter = document.getElementById('priceFilter')?.value || '';
    const searchQuery = document.getElementById('searchInput')?.value.toLowerCase() || '';
    
    let filteredProducts = storeProducts;
    
    // Filter by category
    if (categoryFilter) {
        filteredProducts = filteredProducts.filter(product => product.category === categoryFilter);
    }
    
    // Filter by price
    if (priceFilter) {
        const [min, max] = priceFilter.split('-').map(Number);
        if (max) {
            filteredProducts = filteredProducts.filter(product => {
                const price = product.salePrice || product.price;
                return price >= min && price <= max;
            });
        } else {
            filteredProducts = filteredProducts.filter(product => {
                const price = product.salePrice || product.price;
                return price >= min;
            });
        }
    }
    
    // Filter by search query
    if (searchQuery) {
        filteredProducts = filteredProducts.filter(product => 
            product.name.toLowerCase().includes(searchQuery) ||
            (product.description && product.description.toLowerCase().includes(searchQuery)) ||
            (product.category && product.category.toLowerCase().includes(searchQuery))
        );
    }
    
    displayProducts(filteredProducts);
}

// Storage Functions
function saveCartToStorage() {
    setLocalStorage(`cart_${currentStoreId}`, cart);
}

function loadCartFromStorage() {
    cart = getLocalStorage(`cart_${currentStoreId}`, []);
}

function saveWishlistToStorage() {
    setLocalStorage(`wishlist_${currentStoreId}`, wishlist);
}

function loadWishlistFromStorage() {
    wishlist = getLocalStorage(`wishlist_${currentStoreId}`, []);
}

// Utility Functions
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the store page
    if (document.getElementById('storeFrontend')) {
        initializeStore();
    }
    
    // Add event listeners for filters
    const categoryFilter = document.getElementById('categoryFilter');
    const priceFilter = document.getElementById('priceFilter');
    const searchInput = document.getElementById('searchInput');
    
    if (categoryFilter) categoryFilter.addEventListener('change', applyFilters);
    if (priceFilter) priceFilter.addEventListener('change', applyFilters);
    if (searchInput) searchInput.addEventListener('input', debounce(applyFilters, 300));
    
    // Customer auth form listeners
    const customerLoginForm = document.getElementById('customerLoginForm');
    const customerRegisterForm = document.getElementById('customerRegisterForm');
    const checkoutForm = document.getElementById('checkoutForm');
    
    if (customerLoginForm) {
        customerLoginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            customerLogin();
        });
    }
    
    if (customerRegisterForm) {
        customerRegisterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            customerRegister();
        });
    }
    
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', function(e) {
            e.preventDefault();
            createOrder();
        });
    }
});

// Debounce function for search
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

// Make functions globally available
window.initializeStore = initializeStore;
window.showProductDetails = showProductDetails;
window.changeQuantity = changeQuantity;
window.addToCart = addToCart;
window.addToCartQuick = addToCartQuick;
window.buyNow = buyNow;
window.showCart = showCart;
window.changeCartItemQuantity = changeCartItemQuantity;
window.removeFromCart = removeFromCart;
window.proceedToCheckout = proceedToCheckout;
window.createOrder = createOrder;
window.filterByCategory = filterByCategory;
window.applyFilters = applyFilters;
window.toggleWishlist = toggleWishlist;
window.addToWishlist = addToWishlist;
window.removeFromWishlist = removeFromWishlist;
window.showWishlist = showWishlist;
window.addToCartFromWishlist = addToCartFromWishlist;
window.customerLogin = customerLogin;
window.customerRegister = customerRegister;
window.customerLogout = customerLogout;
window.showCustomerLogin = showCustomerLogin;
window.showCustomerRegister = showCustomerRegister;
window.closeModal = closeModal;
window.updateStoreForLoggedCustomer = updateStoreUIForLoggedCustomer;