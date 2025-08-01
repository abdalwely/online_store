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
let storeData = null;
let storeProducts = [];
let categories = [];

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
        
        // Load store data
        await loadStoreData();
        
        // Load products
        await loadStoreProducts();
        
        // Load categories
        loadCategories();
        
        // Load cart from localStorage
        loadCartFromStorage();
        
        // Update cart UI
        updateCartCount();
    } catch (error) {
        console.error('Error initializing store:', error);
        showNotification('حدث خطأ في تحميل المتجر: ' + error.message, 'error');
        const storeFrontend = document.getElementById('storeFrontend');
        if (storeFrontend) storeFrontend.innerHTML = '<div style="color:red;text-align:center;margin-top:2em">حدث خطأ في تحميل المتجر، يرجى المحاولة لاحقًا.<br>' + error.message + '</div>';
    } finally {
        hideLoading();
    }
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
                template: 'base-v2', // معرف القالب الأساسي
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
                    sections: [
                        {key: 'hero', label: 'البانر', enabled: true, order: 1},
                        {key: 'categories', label: 'الأقسام', enabled: true, order: 2},
                        {key: 'products', label: 'المنتجات', enabled: true, order: 3},
                        {key: 'offers', label: 'العروض', enabled: true, order: 4},
                        {key: 'about', label: 'من نحن', enabled: true, order: 5},
                        {key: 'contact', label: 'تواصل معنا', enabled: true, order: 6}
                    ],
                    allowCustomization: true,
                    layout: 'cards', // cards, grid, list
                    productCardOptions: {
                        showImage: true,
                        showBadges: true,
                        showWishlist: true,
                        showRatings: true,
                        showCategory: true,
                        showTags: true,
                        showStock: true,
                        showDiscount: true,
                        showNew: true
                    },
                    showDiscountBadge: true,
                    showNewBadge: true,
                    enableWishlist: true,
                    enableRatings: true,
                    enableMultiLang: true,
                    supportedLanguages: ['ar', 'en'],
                    defaultCurrency: 'SAR',
                    paymentMethods: ['cod', 'stripe', 'paypal'],
                    enableCoupons: true,
                    enableInstallments: false,
                    enableFlashSales: true,
                    enableProductShare: true,
                    enableProductOptions: true,
                    enableNotifications: true,
                    notifications: {
                        orderAccepted: true,
                        orderStatusChanged: true,
                        discountAvailable: true,
                        productBackInStock: true
                    },
                    shippingFee: 0,
                    freeShippingThreshold: 200,
                    codEnabled: true,
                    onlinePaymentEnabled: true,
                    allowGoogleLogin: true,
                    allowEmailLogin: true,
                    allowRegister: true,
                    saveCustomerLanguage: true,
                    i18n: {
                        ar: {
                            storeName: 'متجري التجريبي',
                            welcome: 'مرحباً بك في متجرنا',
                            about: 'نحن متجر إلكتروني متخصص في تقديم أفضل المنتجات بأسعار تنافسية وخدمة عملاء ممتازة.'
                        },
                        en: {
                            storeName: 'My Demo Store',
                            welcome: 'Welcome to our store',
                            about: 'We are an e-commerce store specializing in the best products at competitive prices and excellent customer service.'
                        }
                    }
                },
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                status: 'active',
                demo: true,
                features: {
                    responsive: true,
                    customizable: true,
                    multiLanguage: true,
                    coupons: true,
                    orders: true,
                    customers: true,
                    statistics: true,
                    wishlist: true,
                    ratings: true,
                    reviews: true,
                    notifications: true,
                    installments: false,
                    flashSales: true,
                    share: true
                }
            };
            await db.collection('stores').doc(currentStoreId).set(defaultStore);
            // إضافة منتجات تجريبية
            const demoProducts = [
                {
                    name: 'ساعة ذكية',
                    description: 'ساعة ذكية مقاومة للماء مع شاشة لمس.',
                    images: ['https://via.placeholder.com/300x300?text=ساعة'],
                    price: 299,
                    salePrice: 249,
                    quantity: 10,
                    category: 'إلكترونيات',
                    tags: ['جديد', 'خصم'],
                    status: 'active',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                    options: {colors: ['أسود', 'فضي'], sizes: ['صغير', 'كبير']}
                },
                {
                    name: 'حقيبة ظهر',
                    description: 'حقيبة ظهر عصرية للمدرسة أو العمل.',
                    images: ['https://via.placeholder.com/300x300?text=حقيبة'],
                    price: 120,
                    salePrice: 120,
                    quantity: 25,
                    category: 'إكسسوارات',
                    tags: ['جديد'],
                    status: 'active',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                    options: {colors: ['أحمر', 'أزرق']}
                }
            ];
            for (const product of demoProducts) {
                await db.collection('stores').doc(currentStoreId).collection('products').add(product);
            }
            storeData = defaultStore;
            updateStoreUI();
            return;
        }
        
        storeData = storeDoc.data();
        
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
        const storeFrontend = document.getElementById('storeFrontend');
        if (storeFrontend) storeFrontend.innerHTML = '<div style="color:red;text-align:center;margin-top:2em">خطأ: عناصر المتجر الأساسية غير موجودة في الصفحة (storeTitle أو footerStoreName)</div>';
        console.error('store.html is missing required elements: storeTitle or footerStoreName');
        return;
    }
    if (!storeData) return;
    
    // Update store title
    document.getElementById('storeTitle').textContent = storeData.name;
    document.getElementById('footerStoreName').textContent = storeData.name;
    
    // Update store logo if exists
    if (storeData.settings && storeData.settings.logo) {
        const logoImg = document.getElementById('storeLogoImg');
        logoImg.src = storeData.settings.logo;
        logoImg.style.display = 'block';
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
        if (settings.description) {
            document.getElementById('footerStoreDescription').textContent = settings.description;
        }
        
        if (settings.phone) {
            document.getElementById('footerStorePhone').textContent = 'الهاتف: ' + settings.phone;
        }
        
        if (settings.address) {
            document.getElementById('footerStoreAddress').textContent = 'العنوان: ' + settings.address;
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
    productsGrid.innerHTML = '';
    
    if (products.length === 0) {
        productsGrid.innerHTML = '<div class="text-center"><p>لا توجد منتجات متاحة حالياً</p></div>';
        return;
    }
    
    products.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.onclick = () => showProductDetails(product);
        
        productCard.innerHTML = `
            <div class="product-image">
                ${
                    product.image ? `<img src="${product.image}" alt="${product.name}">` :
                    (Array.isArray(product.images) && product.images.length > 0 ? `<img src="${product.images[0]}" alt="${product.name}">` : '<div class="placeholder">لا توجد صورة</div>')
                }
                ${product.stock === 0 ? '<div class="out-of-stock">نفد المخزون</div>' : ''}
            </div>
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <div class="product-price">${formatPrice(product.price)}</div>
                <p class="product-description">${product.description?.substring(0, 100) || ''}${product.description?.length > 100 ? '...' : ''}</p>
                <div class="product-actions">
                    <button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); addToCartQuick('${product.id}')" ${product.stock === 0 ? 'disabled' : ''}>
                        ${product.stock === 0 ? 'نفد المخزون' : 'إضافة للسلة'}
                    </button>
                </div>
            </div>
        `;
        productsGrid.appendChild(productCard);
    });
}

function loadCategories() {
    // Extract unique categories from products
    categories = [...new Set(storeProducts.map(product => product.category).filter(Boolean))];
    
    // Update category filter
    const categoryFilter = document.getElementById('categoryFilter');
    categoryFilter.innerHTML = '<option value="">جميع الأقسام</option>';
    
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categoryFilter.appendChild(option);
    });
    
    // Display categories grid
    displayCategories();
}

function displayCategories() {
    const categoriesGrid = document.getElementById('categoriesGrid');
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
        'أطفال': '🧸',
        'إكسسوارات': '👜'
    };
    return icons[category] || '📦';
}

// Product Details Modal Functions
function showProductDetails(product) {
    const modal = document.getElementById('productModal');
    
    // Update modal content
    document.getElementById('productModalImage').src = product.image || '';
    document.getElementById('productModalName').textContent = product.name;
    document.getElementById('productModalPrice').textContent = formatPrice(product.price);
    document.getElementById('productModalDescription').textContent = product.description || '';
    document.getElementById('productFullDescription').textContent = product.description || '';
    
    // Hide original price if no discount
    document.getElementById('productModalOriginalPrice').style.display = 'none';
    
    // Set product quantity
    document.getElementById('productQuantity').value = 1;
    document.getElementById('productQuantity').max = product.stock || 1;
    
    // Update add to cart button
    const addToCartBtn = modal.querySelector('.btn-primary');
    if (product.stock === 0) {
        addToCartBtn.textContent = 'نفد المخزون';
        addToCartBtn.disabled = true;
    } else {
        addToCartBtn.textContent = 'إضافة للسلة';
        addToCartBtn.disabled = false;
        addToCartBtn.onclick = () => addToCart(product.id);
    }
    
    // Update buy now button
    const buyNowBtn = modal.querySelector('.btn-outline');
    if (product.stock === 0) {
        buyNowBtn.disabled = true;
    } else {
        buyNowBtn.disabled = false;
        buyNowBtn.onclick = () => buyNow(product.id);
    }
    
    // Store current product for modal actions
    modal.dataset.productId = product.id;
    
    modal.classList.add('active');
}

function changeQuantity(delta) {
    const quantityInput = document.getElementById('productQuantity');
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
        quantity = parseInt(document.getElementById('productQuantity').value) || 1;
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
            price: product.price,
            image: product.image,
            quantity: quantity
        });
    }
    
    // Save cart to localStorage
    saveCartToStorage();
    
    // Update cart UI
    updateCartCount();
    
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
    document.getElementById('cartCount').textContent = totalItems;
}

function showCart() {
    updateCartDisplay();
    document.getElementById('cartModal').classList.add('active');
}

function updateCartDisplay() {
    const cartItems = document.getElementById('cartItems');
    cartItems.innerHTML = '';
    
    if (cart.length === 0) {
        cartItems.innerHTML = '<div class="text-center"><p>السلة فارغة</p></div>';
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
                <button onclick="changeCartItemQuantity(${index}, -1)">-</button>
                <span>${item.quantity}</span>
                <button onclick="changeCartItemQuantity(${index}, 1)">+</button>
            </div>
            <div class="cart-item-total">${formatPrice(itemTotal)}</div>
            <button class="cart-item-remove" onclick="removeFromCart(${index})">×</button>
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
    
    document.getElementById('subtotal').textContent = formatPrice(subtotal);
    document.getElementById('shippingCost').textContent = shippingCost === 0 ? 'مجاني' : formatPrice(shippingCost);
    document.getElementById('totalAmount').textContent = formatPrice(total);
}

function calculateShippingCost(subtotal) {
    if (!storeData || !storeData.settings) return 0;
    
    const settings = storeData.settings;
    const freeShippingThreshold = settings.freeShippingThreshold || 200;
    const shippingFee = settings.shippingFee || 0;
    
    return subtotal >= freeShippingThreshold ? 0 : shippingFee;
}

// Checkout Functions
function proceedToCheckout() {
    if (cart.length === 0) {
        showNotification('السلة فارغة', 'warning');
        return;
    }
    
    // Check if customer is logged in
    if (!currentCustomer) {
        showNotification('يجب تسجيل الدخول أولاً', 'warning');
        showCustomerLogin();
        return;
    }
    
    // For now, simulate order creation
    createOrder();
}

async function createOrder() {
    try {
        showLoading();
        
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const shippingCost = calculateShippingCost(subtotal);
        const total = subtotal + shippingCost;
        
        const orderData = {
            customerId: currentCustomer.uid,
            customerName: currentCustomer.displayName || currentCustomer.email,
            items: cart.map(item => ({
                productId: item.productId,
                name: item.name,
                price: item.price,
                quantity: item.quantity
            })),
            subtotal: subtotal,
            shippingCost: shippingCost,
            total: total,
            status: 'pending',
            paymentMethod: 'COD', // Default to cash on delivery
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // Create order in Firestore
        const orderRef = await db.collection('stores').doc(currentStoreId).collection('orders').add(orderData);
        
        // Update product stock
        for (const item of cart) {
            const productRef = db.collection('stores').doc(currentStoreId).collection('products').doc(item.productId);
            const product = storeProducts.find(p => p.id === item.productId);
            if (product) {
                await productRef.update({
                    stock: product.stock - item.quantity
                });
            }
        }
        
        // Update customer stats
        const customerRef = db.collection('stores').doc(currentStoreId).collection('customers').doc(currentCustomer.uid);
        await customerRef.update({
            totalOrders: firebase.firestore.FieldValue.increment(1),
            totalSpent: firebase.firestore.FieldValue.increment(total)
        });
        
        // Clear cart
        cart = [];
        saveCartToStorage();
        updateCartCount();
        
        closeModal('cartModal');
        showNotification(`تم إنشاء الطلب بنجاح! رقم الطلب: ${orderRef.id.substring(0, 8)}`, 'success');
        
        // Reload products to update stock
        await loadStoreProducts();
        
    } catch (error) {
        console.error('Error creating order:', error);
        showNotification('حدث خطأ في إنشاء الطلب', 'error');
    } finally {
        hideLoading();
    }
}

// Filter and Search Functions
function filterByCategory(category) {
    document.getElementById('categoryFilter').value = category;
    applyFilters();
}

function applyFilters() {
    const categoryFilter = document.getElementById('categoryFilter').value;
    const priceFilter = document.getElementById('priceFilter').value;
    const searchQuery = document.getElementById('searchInput').value.toLowerCase();
    
    let filteredProducts = storeProducts;
    
    // Filter by category
    if (categoryFilter) {
        filteredProducts = filteredProducts.filter(product => product.category === categoryFilter);
    }
    
    // Filter by price
    if (priceFilter) {
        const [min, max] = priceFilter.split('-').map(Number);
        if (max) {
            filteredProducts = filteredProducts.filter(product => product.price >= min && product.price <= max);
        } else {
            filteredProducts = filteredProducts.filter(product => product.price >= min);
        }
    }
    
    // Filter by search query
    if (searchQuery) {
        filteredProducts = filteredProducts.filter(product => 
            product.name.toLowerCase().includes(searchQuery) ||
            product.description?.toLowerCase().includes(searchQuery) ||
            product.category?.toLowerCase().includes(searchQuery)
        );
    }
    
    displayProducts(filteredProducts);
}

// Event Listeners
document.getElementById('categoryFilter').addEventListener('change', applyFilters);
document.getElementById('priceFilter').addEventListener('change', applyFilters);
document.getElementById('searchInput').addEventListener('input', applyFilters);

// Cart Storage Functions
function saveCartToStorage() {
    localStorage.setItem(`cart_${currentStoreId}`, JSON.stringify(cart));
}

function loadCartFromStorage() {
    const savedCart = localStorage.getItem(`cart_${currentStoreId}`);
    if (savedCart) {
        cart = JSON.parse(savedCart);
    }
}

// Customer Authentication for Store
function updateStoreForLoggedCustomer(user, customerData) {
    currentCustomer = user;
    
    // Update store header to show customer is logged in
    const loginBtn = document.querySelector('.store-actions .btn-outline');
    if (loginBtn) {
        loginBtn.textContent = `مرحباً ${customerData.name}`;
        loginBtn.onclick = () => showCustomerAccount();
    }
}

function showCustomerAccount() {
    showNotification('ميزة حساب العميل قيد التطوير', 'info');
}

// Initialize store when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the store page
    if (document.getElementById('storeFrontend')) {
        initializeStore();
    }
});

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
window.filterByCategory = filterByCategory;
window.updateStoreForLoggedCustomer = updateStoreForLoggedCustomer;