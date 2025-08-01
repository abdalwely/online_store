// Advanced Store Frontend Functions

let currentStoreId = null;
let currentCustomer = null;

// تحميل العميل الحالي من التخزين المحلي الخاص بالمتجر
function loadCurrentCustomer() {
    const savedCustomer = localStorage.getItem(`customer_${currentStoreId}`);
    if (savedCustomer) {
        currentCustomer = JSON.parse(savedCustomer);
    } else {
        currentCustomer = null;
    }
}

// حفظ العميل الحالي في التخزين المحلي الخاص بالمتجر
function saveCurrentCustomer(customer) {
    localStorage.setItem(`customer_${currentStoreId}` , JSON.stringify(customer));
    currentCustomer = customer;
}

// تسجيل خروج العميل من المتجر الحالي فقط
function customerLogout() {
    localStorage.removeItem(`customer_${currentStoreId}`);
    currentCustomer = null;
    showNotification('تم تسجيل الخروج بنجاح', 'success');
    updateCartCount();
    updateWishlistCount();
    // أي تحديثات إضافية للواجهة
}
window.customerLogout = customerLogout;
let cart = [];
let wishlist = [];
let storeData = null;
let storeProducts = [];
let categories = [];
let currentProductsPage = 1;
let productsPerPage = 12;
let currentFilters = {};
let currentSort = 'newest';
let currentView = 'grid';
let flashSaleTimer = null;

// Initialize store
async function initializeStore() {
    // تحميل العميل الحالي المخزن لهذا المتجر
    loadCurrentCustomer();
    console.log("initializeStore started");
    try {
        showLoading('جاري تحميل المتجر...');
        console.log('بعد showLoading');
        // Get store ID from URL parameter
        const urlParams = new URLSearchParams(window.location.search);
        currentStoreId = urlParams.get('id');
        console.log('currentStoreId:', currentStoreId);
        if (!currentStoreId) {
            // If no store ID, show demo store
            currentStoreId = 'demo-store';
            console.log('سيتم إنشاء المتجر التجريبي');
            await createDemoStore();
            console.log('تم إنشاء المتجر التجريبي');
        }
        // Load store data
        console.log('قبل loadStoreData');
        await loadStoreData();
        console.log('بعد loadStoreData');
        // Load products
        console.log('قبل loadStoreProducts');
        await loadStoreProducts();
        console.log('بعد loadStoreProducts');
        // Load categories
        loadCategories();
        console.log('بعد loadCategories');
        // Load cart and wishlist from localStorage
        loadCartFromStorage();
        loadWishlistFromStorage();
        console.log('بعد تحميل cart/wishlist');
        // Update UI
        updateCartCount();
        updateWishlistCount();
        console.log('بعد تحديث العدادات');
        // Initialize event listeners
        initializeEventListeners();
        console.log('بعد تفعيل الأحداث');
        // Initialize flash sale if active
        initializeFlashSale();
        console.log('بعد العروض الفلاشية');
        // Initialize back to top button
        initializeBackToTop();
        console.log('بعد زر العودة للأعلى');
        // Initialize live chat
        initializeLiveChat();
        console.log('بعد الدردشة الحية');
        
    } catch (error) {
        console.error('Error initializing store:', error);
        showNotification('حدث خطأ في تحميل المتجر', 'error');
    } finally {
        hideLoading();
    }
}

// Create demo store for testing
async function createDemoStore() {
    const demoStoreData = {
        name: "متجر تجريبي",
        category: "عام",
        status: "active",
        settings: {
            colors: {
                primary: "#1E40AF",
                secondary: "#0891B2",
                background: "#F8FAFC"
            },
            logo: "",
            description: "متجر إلكتروني تجريبي لعرض المنتجات",
            phone: "+966 50 123 4567",
            address: "الرياض، المملكة العربية السعودية",
            shippingFee: 15,
            freeShippingThreshold: 200,
            codEnabled: true,
            onlinePaymentEnabled: true
        }
    };
    
    // Create demo products
    const demoProducts = [
        {
            id: 'demo-1',
            name: 'قميص رجالي كلاسيكي',
            category: 'ملابس رجالية',
            price: 120,
            originalPrice: 150,
            stock: 25,
            description: 'قميص رجالي أنيق مصنوع من القطن الخالص، مناسب للمناسبات الرسمية والكاجوال',
            image: 'https://images.pexels.com/photos/996329/pexels-photo-996329.jpeg',
            status: 'active',
            featured: true,
            isNew: true,
            rating: 4.5,
            reviewsCount: 24,
            tags: ['قطن', 'رجالي', 'كلاسيكي'],
            specifications: {
                'المادة': 'قطن 100%',
                'اللون': 'أبيض',
                'الأحجام المتاحة': 'S, M, L, XL',
                'العناية': 'غسيل عادي'
            },
            options: {
                sizes: ['S', 'M', 'L', 'XL'],
                colors: ['أبيض', 'أزرق', 'رمادي']
            }
        },
        {
            id: 'demo-2',
            name: 'فستان نسائي أنيق',
            category: 'ملابس نسائية',
            price: 200,
            stock: 15,
            description: 'فستان نسائي أنيق مناسب للمناسبات الخاصة',
            image: 'https://images.pexels.com/photos/985635/pexels-photo-985635.jpeg',
            status: 'active',
            featured: true,
            rating: 4.8,
            reviewsCount: 18,
            tags: ['نسائي', 'أنيق', 'مناسبات'],
            specifications: {
                'المادة': 'شيفون',
                'اللون': 'أسود',
                'الأحجام المتاحة': 'S, M, L',
                'العناية': 'تنظيف جاف'
            }
        },
        {
            id: 'demo-3',
            name: 'حذاء رياضي',
            category: 'أحذية',
            price: 300,
            originalPrice: 350,
            stock: 30,
            description: 'حذاء رياضي مريح مناسب للجري والأنشطة الرياضية',
            image: 'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg',
            status: 'active',
            onSale: true,
            rating: 4.3,
            reviewsCount: 32,
            tags: ['رياضي', 'مريح', 'جري'],
            specifications: {
                'المادة': 'جلد صناعي ومطاط',
                'اللون': 'أسود وأبيض',
                'الأحجام المتاحة': '40, 41, 42, 43, 44',
                'النوع': 'رياضي'
            }
        }
    ];
    
    // Store demo data in memory
    storeData = demoStoreData;
    storeProducts = demoProducts;
}

async function loadStoreData() {
    try {
        if (currentStoreId === 'demo-store') {
            // Demo store data already loaded
            updateStoreUI();
            return;
        }
        
        // Real-time store data
        db.collection('stores').doc(currentStoreId).onSnapshot((storeDoc) => {
            if (!storeDoc.exists) {
                // Fallback to demo store if not found
                createDemoStore();
                updateStoreUI();
                return;
            }
            storeData = storeDoc.data();
            updateStoreUI();
        });
        
    } catch (error) {
        console.error('Error loading store data:', error);
        // Fallback to demo store
        await createDemoStore();
        updateStoreUI();
    }
}

function updateStoreUI() {
    console.log('بدأ updateStoreUI', storeData);
    if (!storeData) return;
    // Update store title and branding
    try {
        document.getElementById('storeTitle').textContent = storeData.name;
        console.log('تم تحديث storeTitle');
    } catch (e) {
        console.error('storeTitle غير موجود');
    }
    try {
        document.getElementById('footerStoreName').textContent = storeData.name;
        console.log('تم تحديث footerStoreName');
    } catch (e) {
        console.error('footerStoreName غير موجود');
    }
    try {
        document.getElementById('footerCopyright').textContent = storeData.name;
        console.log('تم تحديث footerCopyright');
    } catch (e) {
        console.error('footerCopyright غير موجود');
    }
    
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
            document.documentElement.style.setProperty('--store-primary', settings.colors.primary || '#1E40AF');
            document.documentElement.style.setProperty('--store-secondary', settings.colors.secondary || '#0891B2');
            document.documentElement.style.setProperty('--store-light', settings.colors.background || '#F8FAFC');
        }
        
        // Update font family
        if (settings.fontFamily) {
            document.documentElement.style.setProperty('--store-font-family', `'${settings.fontFamily}', sans-serif`);
        }
        
        // Update contact information
        if (settings.phone) {
            document.getElementById('headerPhone').textContent = settings.phone;
            document.getElementById('contactPhone').textContent = settings.phone;
            document.getElementById('footerStorePhone').textContent = 'الهاتف: ' + settings.phone;
        }
        
        if (settings.email) {
            document.getElementById('headerEmail').textContent = settings.email;
            document.getElementById('contactEmail').textContent = settings.email;
            document.getElementById('footerStoreEmail').textContent = 'البريد: ' + settings.email;
        }
        
        if (settings.address) {
            document.getElementById('contactAddress').textContent = settings.address;
            document.getElementById('footerStoreAddress').textContent = 'العنوان: ' + settings.address;
        }
        
        if (settings.description) {
            document.getElementById('footerStoreDescription').textContent = settings.description;
            document.getElementById('aboutDescription').textContent = settings.description;
        }
    }
    
    // Update page title
    document.title = storeData.name + ' - متجر إلكتروني';
}

async function loadStoreProducts() {
    try {
        if (currentStoreId === 'demo-store') {
            // Demo products already loaded
            displayProducts(storeProducts);
            displayFeaturedProducts();
            return;
        }
        
        // Real-time products
        db.collection('stores').doc(currentStoreId).collection('products')
            .where('status', '==', 'active')
            .orderBy('createdAt', 'desc')
            .onSnapshot((productsSnapshot) => {
                storeProducts = [];
                productsSnapshot.docs.forEach(doc => {
                    storeProducts.push({ id: doc.id, ...doc.data() });
                });
                // Display products
                displayProducts(storeProducts);
                displayFeaturedProducts();
            });
        
    } catch (error) {
        console.error('Error loading store products:', error);
        // Use demo products as fallback
        displayProducts(storeProducts);
        displayFeaturedProducts();
    }
}

function displayProducts(products) {
    console.log('بدأ displayProducts', products);

    const productsGrid = document.getElementById('storeProductsGrid');
    productsGrid.innerHTML = '';
    
    if (products.length === 0) {
        productsGrid.innerHTML = `
            <div class="no-products">
                <div class="no-products-icon">📦</div>
                <h3>لا توجد منتجات متاحة</h3>
                <p>عذراً، لا توجد منتجات تطابق معايير البحث الخاصة بك</p>
            </div>
        `;
        return;
    }
    
    // Apply pagination
    const startIndex = (currentProductsPage - 1) * productsPerPage;
    const endIndex = startIndex + productsPerPage;
    const paginatedProducts = products.slice(startIndex, endIndex);
    
    paginatedProducts.forEach(product => {
        const productCard = createProductCard(product);
        productsGrid.appendChild(productCard);
    });
    
    // Update load more button
    updateLoadMoreButton(products.length);
}

function createProductCard(product) {
    const productCard = document.createElement('div');
    productCard.className = `product-card ${currentView === 'list' ? 'list-view' : ''}`;
    productCard.onclick = () => showProductDetails(product);
    
    // Calculate discount percentage
    const discountPercentage = product.originalPrice ? 
        Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0;
    
    productCard.innerHTML = `
        <div class="product-image">
            ${product.image ? `<img src="${product.image}" alt="${product.name}" loading="lazy">` : '<div class="placeholder">لا توجد صورة</div>'}
            
            <!-- Product Badges -->
            <div class="product-badges">
                ${product.isNew ? '<span class="product-badge new">جديد</span>' : ''}
                ${product.onSale || discountPercentage > 0 ? `<span class="product-badge sale">خصم ${discountPercentage}%</span>` : ''}
                ${product.featured ? '<span class="product-badge featured">مميز</span>' : ''}
                ${product.stock === 0 ? '<span class="product-badge out-of-stock">نفد المخزون</span>' : ''}
            </div>
            
            <!-- Product Actions Overlay -->
            <div class="product-actions-overlay">
                <button class="action-btn" onclick="event.stopPropagation(); quickView('${product.id}')" title="عرض سريع">
                    👁️
                </button>
                <button class="action-btn" onclick="event.stopPropagation(); toggleWishlistItem('${product.id}')" title="إضافة للمفضلة">
                    ${wishlist.includes(product.id) ? '❤️' : '🤍'}
                </button>
                <button class="action-btn" onclick="event.stopPropagation(); addToCartQuick('${product.id}')" title="إضافة للسلة" ${product.stock === 0 ? 'disabled' : ''}>
                    🛒
                </button>
                <button class="action-btn" onclick="event.stopPropagation(); shareProduct('${product.id}')" title="مشاركة">
                    📤
                </button>
            </div>
        </div>
        
        <div class="product-info">
            <h3 class="product-name">${product.name}</h3>
            
            <!-- Product Rating -->
            <div class="product-rating">
                <div class="stars">
                    ${generateStars(product.rating || 0)}
                </div>
                <span class="rating-text">(${product.rating || 0}) ${product.reviewsCount || 0} تقييم</span>
            </div>
            
            <!-- Product Price -->
            <div class="product-price">
                <span class="current-price" data-amount="${product.price}">${formatCurrency(product.price)}</span>
                ${product.originalPrice ? `<span class="original-price" data-amount="${product.originalPrice}">${formatCurrency(product.originalPrice)}</span>` : ''}
                ${discountPercentage > 0 ? `<span class="discount-badge">${discountPercentage}% خصم</span>` : ''}
            </div>
            
            <!-- Product Description -->
            <p class="product-description">${product.description?.substring(0, 100) || ''}${product.description?.length > 100 ? '...' : ''}</p>
            
            <!-- Stock Status -->
            <div class="stock-status ${product.stock > 0 ? (product.stock < 5 ? 'low-stock' : 'in-stock') : 'out-of-stock'}">
                ${product.stock > 0 ? (product.stock < 5 ? `متبقي ${product.stock} قطع فقط` : 'متوفر') : 'نفد المخزون'}
            </div>
            
            <!-- Product Actions -->
            <div class="product-actions">
                <button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); addToCartQuick('${product.id}')" ${product.stock === 0 ? 'disabled' : ''}>
                    ${product.stock === 0 ? 'نفد المخزون' : 'إضافة للسلة'}
                </button>
                <button class="btn btn-outline btn-sm" onclick="event.stopPropagation(); showProductDetails(${JSON.stringify(product).replace(/"/g, '&quot;')})">
                    عرض التفاصيل
                </button>
            </div>
        </div>
    `;
    
    return productCard;
}

function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    let starsHTML = '';
    
    // Full stars
    for (let i = 0; i < fullStars; i++) {
        starsHTML += '<span class="star filled">★</span>';
    }
    
    // Half star
    if (hasHalfStar) {
        starsHTML += '<span class="star half">★</span>';
    }
    
    // Empty stars
    for (let i = 0; i < emptyStars; i++) {
        starsHTML += '<span class="star empty">☆</span>';
    }
    
    return starsHTML;
}

function displayFeaturedProducts() {
    const featuredProducts = storeProducts.filter(product => product.featured).slice(0, 8);
    const featuredGrid = document.getElementById('featuredProductsGrid');
    
    if (!featuredGrid) return;
    
    featuredGrid.innerHTML = '';
    
    featuredProducts.forEach(product => {
        const productCard = createProductCard(product);
        featuredGrid.appendChild(productCard);
    });
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
        'ملابس رجالية': '👔',
        'ملابس نسائية': '👗',
        'أحذية': '👟',
        'إكسسوارات': '👜',
        'إلكترونيات': '📱',
        'منزل ومطبخ': '🏠',
        'رياضة': '⚽',
        'كتب': '📚',
        'طعام': '🍕',
        'أطفال': '🧸',
        'جمال': '💄',
        'صحة': '💊'
    };
    return icons[category] || '📦';
}

// Product Details Modal Functions
function showProductDetails(product) {
    const modal = document.getElementById('productModal');
    
    // Update modal content
    document.getElementById('productModalImage').src = product.image || '';
    document.getElementById('productModalName').textContent = product.name;
    document.getElementById('productModalPrice').textContent = formatCurrency(product.price);
    document.getElementById('productModalDescription').textContent = product.description || '';
    document.getElementById('productFullDescription').textContent = product.description || '';
    
    // Update original price and discount
    const originalPriceEl = document.getElementById('productModalOriginalPrice');
    const discountEl = document.getElementById('discountPercentage');
    
    if (product.originalPrice && product.originalPrice > product.price) {
        originalPriceEl.textContent = formatCurrency(product.originalPrice);
        originalPriceEl.style.display = 'inline';
        
        const discountPercentage = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
        discountEl.textContent = `${discountPercentage}% خصم`;
        discountEl.style.display = 'inline';
    } else {
        originalPriceEl.style.display = 'none';
        discountEl.style.display = 'none';
    }
    
    // Update rating
    const starsEl = document.getElementById('productStars');
    const ratingEl = document.getElementById('productRating');
    
    if (starsEl) {
        starsEl.innerHTML = generateStars(product.rating || 0);
    }
    
    if (ratingEl) {
        ratingEl.textContent = `(${product.rating || 0}) ${product.reviewsCount || 0} تقييم`;
    }
    
    // Update stock status
    const stockStatusEl = document.getElementById('stockStatus');
    const stockCountEl = document.getElementById('stockCount');
    
    if (stockStatusEl) {
        if (product.stock > 0) {
            stockStatusEl.textContent = product.stock < 5 ? 'كمية محدودة' : 'متوفر في المخزون';
            stockStatusEl.className = `stock-status ${product.stock < 5 ? 'low-stock' : 'in-stock'}`;
        } else {
            stockStatusEl.textContent = 'نفد المخزون';
            stockStatusEl.className = 'stock-status out-of-stock';
        }
    }
    
    if (stockCountEl) {
        stockCountEl.textContent = product.stock > 0 ? `(${product.stock} متوفر)` : '';
    }
    
    // Update product badges
    const badgesEl = document.getElementById('productBadges');
    if (badgesEl) {
        let badgesHTML = '';
        
        if (product.isNew) badgesHTML += '<span class="product-badge new">جديد</span>';
        if (product.onSale || (product.originalPrice && product.originalPrice > product.price)) {
            const discountPercentage = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
            badgesHTML += `<span class="product-badge sale">خصم ${discountPercentage}%</span>`;
        }
        if (product.featured) badgesHTML += '<span class="product-badge featured">مميز</span>';
        
        badgesEl.innerHTML = badgesHTML;
    }
    
    // Update product options (size, color, etc.)
    updateProductOptions(product);
    
    // Update specifications
    updateProductSpecifications(product);
    
    // Update reviews
    updateProductReviews(product);
    
    // Load related products
    loadRelatedProducts(product);
    
    // Set product quantity
    document.getElementById('productQuantity').value = 1;
    document.getElementById('productQuantity').max = product.stock || 1;
    
    // Update action buttons
    updateProductActionButtons(product);
    
    // Store current product for modal actions
    modal.dataset.productId = product.id;
    
    modal.classList.add('active');
}

function updateProductOptions(product) {
    const sizeOptions = document.getElementById('sizeOptions');
    const colorOptions = document.getElementById('colorOptions');
    
    // Handle size options
    if (product.options && product.options.sizes && product.options.sizes.length > 0) {
        const sizeSelector = sizeOptions.querySelector('.size-selector');
        sizeSelector.innerHTML = '';
        
        product.options.sizes.forEach(size => {
            const sizeBtn = document.createElement('button');
            sizeBtn.className = 'size-option';
            sizeBtn.textContent = size;
            sizeBtn.onclick = () => selectSize(sizeBtn, size);
            sizeSelector.appendChild(sizeBtn);
        });
        
        sizeOptions.style.display = 'block';
    } else {
        sizeOptions.style.display = 'none';
    }
    
    // Handle color options
    if (product.options && product.options.colors && product.options.colors.length > 0) {
        const colorSelector = colorOptions.querySelector('.color-selector');
        colorSelector.innerHTML = '';
        
        product.options.colors.forEach(color => {
            const colorBtn = document.createElement('button');
            colorBtn.className = 'color-option';
            colorBtn.style.backgroundColor = getColorCode(color);
            colorBtn.title = color;
            colorBtn.onclick = () => selectColor(colorBtn, color);
            colorSelector.appendChild(colorBtn);
        });
        
        colorOptions.style.display = 'block';
    } else {
        colorOptions.style.display = 'none';
    }
}

function getColorCode(colorName) {
    const colorMap = {
        'أبيض': '#ffffff',
        'أسود': '#000000',
        'أحمر': '#ff0000',
        'أزرق': '#0000ff',
        'أخضر': '#008000',
        'أصفر': '#ffff00',
        'رمادي': '#808080',
        'بني': '#8b4513',
        'وردي': '#ffc0cb',
        'بنفسجي': '#800080'
    };
    
    return colorMap[colorName] || '#cccccc';
}

function selectSize(button, size) {
    // Remove selected class from all size options
    document.querySelectorAll('.size-option').forEach(btn => btn.classList.remove('selected'));
    
    // Add selected class to clicked button
    button.classList.add('selected');
    
    // Store selected size
    button.closest('.product-options').dataset.selectedSize = size;
}

function selectColor(button, color) {
    // Remove selected class from all color options
    document.querySelectorAll('.color-option').forEach(btn => btn.classList.remove('selected'));
    
    // Add selected class to clicked button
    button.classList.add('selected');
    
    // Store selected color
    button.closest('.product-options').dataset.selectedColor = color;
}

function updateProductSpecifications(product) {
    const specsTable = document.getElementById('specsTable');
    if (!specsTable) return;
    
    specsTable.innerHTML = '';
    
    if (product.specifications) {
        Object.entries(product.specifications).forEach(([key, value]) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <th>${key}</th>
                <td>${value}</td>
            `;
            specsTable.appendChild(row);
        });
    } else {
        specsTable.innerHTML = '<tr><td colspan="2">لا توجد مواصفات متاحة</td></tr>';
    }
}

function updateProductReviews(product) {
    // Update average rating
    const averageRatingEl = document.getElementById('averageRating');
    const overallStarsEl = document.getElementById('overallStars');
    const totalReviewsEl = document.getElementById('totalReviews');
    
    if (averageRatingEl) averageRatingEl.textContent = product.rating || '0';
    if (overallStarsEl) overallStarsEl.innerHTML = generateStars(product.rating || 0);
    if (totalReviewsEl) totalReviewsEl.textContent = `${product.reviewsCount || 0} تقييم`;
    
    // Update rating breakdown
    updateRatingBreakdown(product);
    
    // Load reviews list
    loadProductReviews(product.id);
}

function updateRatingBreakdown(product) {
    const ratingBreakdown = document.getElementById('ratingBreakdown');
    if (!ratingBreakdown) return;
    
    // Sample rating distribution (in real app, this would come from database)
    const ratingDistribution = {
        5: 60,
        4: 25,
        3: 10,
        2: 3,
        1: 2
    };
    
    const totalReviews = product.reviewsCount || 0;
    
    ratingBreakdown.innerHTML = '';
    
    for (let rating = 5; rating >= 1; rating--) {
        const count = Math.round((ratingDistribution[rating] / 100) * totalReviews);
        const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
        
        const ratingBar = document.createElement('div');
        ratingBar.className = 'rating-bar';
        ratingBar.innerHTML = `
            <span class="rating-label">${rating} نجوم</span>
            <div class="rating-progress">
                <div class="rating-fill" style="width: ${percentage}%"></div>
            </div>
            <span class="rating-count">${count}</span>
        `;
        
        ratingBreakdown.appendChild(ratingBar);
    }
}

function loadProductReviews(productId) {
    const reviewsList = document.getElementById('reviewsList');
    if (!reviewsList) return;
    
    // Sample reviews (in real app, this would come from database)
    const sampleReviews = [
        {
            id: '1',
            customerName: 'أحمد محمد',
            rating: 5,
            title: 'منتج ممتاز',
            comment: 'منتج ممتاز وجودة عالية، أنصح بشرائه. وصل في الوقت المحدد والتعبئة كانت ممتازة.',
            date: new Date('2024-01-15'),
            verified: true
        },
        {
            id: '2',
            customerName: 'فاطمة أحمد',
            rating: 4,
            title: 'جيد جداً',
            comment: 'جيد جداً ولكن التوصيل تأخر قليلاً. المنتج كما هو موضح في الصور.',
            date: new Date('2024-01-10'),
            verified: true
        },
        {
            id: '3',
            customerName: 'محمد علي',
            rating: 5,
            title: 'راض جداً',
            comment: 'راض جداً عن المنتج والخدمة. سأطلب مرة أخرى بالتأكيد.',
            date: new Date('2024-01-05'),
            verified: false
        }
    ];
    
    reviewsList.innerHTML = '';
    
    sampleReviews.forEach(review => {
        const reviewItem = document.createElement('div');
        reviewItem.className = 'review-item';
        reviewItem.innerHTML = `
            <div class="review-header">
                <div class="review-author">
                    <strong>${review.customerName}</strong>
                    ${review.verified ? '<span class="verified-badge">✓ مشتري موثق</span>' : ''}
                </div>
                <div class="review-meta">
                    <div class="review-stars">${generateStars(review.rating)}</div>
                    <span class="review-date">${formatDate(review.date)}</span>
                </div>
            </div>
            <div class="review-content">
                <h5 class="review-title">${review.title}</h5>
                <p class="review-comment">${review.comment}</p>
            </div>
        `;
        reviewsList.appendChild(reviewItem);
    });
}

function loadRelatedProducts(product) {
    const relatedGrid = document.getElementById('relatedProductsGrid');
    if (!relatedGrid) return;
    
    // Find related products (same category, excluding current product)
    const relatedProducts = storeProducts
        .filter(p => p.category === product.category && p.id !== product.id)
        .slice(0, 4);
    
    relatedGrid.innerHTML = '';
    
    relatedProducts.forEach(relatedProduct => {
        const productCard = createProductCard(relatedProduct);
        productCard.classList.add('related-product');
        relatedGrid.appendChild(productCard);
    });
}

function updateProductActionButtons(product) {
    const addToCartBtn = document.querySelector('#productModal .btn-primary');
    const buyNowBtn = document.querySelector('#productModal .btn-outline');
    const wishlistBtn = document.getElementById('wishlistBtn');
    
    if (addToCartBtn) {
        if (product.stock === 0) {
            addToCartBtn.textContent = 'نفد المخزون';
            addToCartBtn.disabled = true;
        } else {
            addToCartBtn.textContent = 'إضافة للسلة';
            addToCartBtn.disabled = false;
        }
    }
    
    if (buyNowBtn) {
        buyNowBtn.disabled = product.stock === 0;
    }
    
    if (wishlistBtn) {
        const isInWishlist = wishlist.includes(product.id);
        wishlistBtn.classList.toggle('active', isInWishlist);
        wishlistBtn.querySelector('.wishlist-icon').textContent = isInWishlist ? '❤️' : '🤍';
    }
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
        const quantityInput = document.getElementById('productQuantity');
        quantity = quantityInput ? parseInt(quantityInput.value) || 1 : 1;
    }
    
    // Get selected options
    const productOptions = document.querySelector('.product-options');
    const selectedSize = productOptions ? productOptions.dataset.selectedSize : null;
    const selectedColor = productOptions ? productOptions.dataset.selectedColor : null;
    
    // Check if product already in cart with same options
    const existingItemIndex = cart.findIndex(item => 
        item.productId === productId && 
        item.selectedSize === selectedSize && 
        item.selectedColor === selectedColor
    );
    
    if (existingItemIndex !== -1) {
        const newQuantity = cart[existingItemIndex].quantity + quantity;
        if (newQuantity > product.stock) {
            showNotification(`الكمية المطلوبة غير متوفرة. المتوفر: ${product.stock}`, 'warning');
            return;
        }
        cart[existingItemIndex].quantity = newQuantity;
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
            quantity: quantity,
            selectedSize: selectedSize,
            selectedColor: selectedColor
        });
    }
    
    // Save cart to localStorage
    saveCartToStorage();
    
    // Update cart UI
    updateCartCount();
    
    // Show success notification
    showNotification('تم إضافة المنتج للسلة بنجاح', 'success');
    
    // Close product modal if open
    closeModal('productModal');
    
    // Add animation effect
    animateAddToCart();
}

function animateAddToCart() {
    // Create a flying cart animation
    const cartBtn = document.querySelector('.cart-btn');
    if (cartBtn) {
        cartBtn.classList.add('cart-animation');
        setTimeout(() => {
            cartBtn.classList.remove('cart-animation');
        }, 600);
    }
}

function buyNow(productId) {
    addToCart(productId);
    setTimeout(() => {
        showCart();
    }, 500);
}

function updateCartCount() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartCountEl = document.getElementById('cartCount');
    if (cartCountEl) {
        cartCountEl.textContent = totalItems;
        
        // Add bounce animation
        if (totalItems > 0) {
            cartCountEl.classList.add('bounce');
            setTimeout(() => {
                cartCountEl.classList.remove('bounce');
            }, 600);
        }
    }
}

function showCart() {
    updateCartDisplay();
    document.getElementById('cartModal').classList.add('active');
}

function updateCartDisplay() {
    const cartItems = document.getElementById('cartItems');
    cartItems.innerHTML = '';
    
    if (cart.length === 0) {
        cartItems.innerHTML = `
            <div class="empty-cart">
                <div class="empty-cart-icon">🛒</div>
                <h3>السلة فارغة</h3>
                <p>لم تقم بإضافة أي منتجات للسلة بعد</p>
                <button class="btn btn-primary" onclick="continueShopping()">ابدأ التسوق</button>
            </div>
        `;
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
                <div class="cart-item-price">${formatCurrency(item.price)}</div>
                ${item.selectedSize || item.selectedColor ? `
                    <div class="cart-item-options">
                        ${item.selectedSize ? `الحجم: ${item.selectedSize}` : ''}
                        ${item.selectedSize && item.selectedColor ? ' | ' : ''}
                        ${item.selectedColor ? `اللون: ${item.selectedColor}` : ''}
                    </div>
                ` : ''}
            </div>
            <div class="cart-item-quantity">
                <button onclick="changeCartItemQuantity(${index}, -1)">-</button>
                <span>${item.quantity}</span>
                <button onclick="changeCartItemQuantity(${index}, 1)">+</button>
            </div>
            <div class="cart-item-total">${formatCurrency(itemTotal)}</div>
            <button class="cart-item-remove" onclick="removeFromCart(${index})" title="حذف من السلة">×</button>
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
    const item = cart[index];
    cart.splice(index, 1);
    saveCartToStorage();
    updateCartDisplay();
    updateCartCount();
    showNotification(`تم حذف ${item.name} من السلة`, 'success');
}

function updateCartSummary(subtotal) {
    const shippingCost = calculateShippingCost(subtotal);
    const taxAmount = calculateTax(subtotal);
    const total = subtotal + shippingCost + taxAmount;
    
    document.getElementById('subtotal').textContent = formatCurrency(subtotal);
    
    const shippingEl = document.getElementById('shippingCost');
    shippingEl.textContent = shippingCost === 0 ? 'مجاني' : formatCurrency(shippingCost);
    
    const taxEl = document.getElementById('taxAmount');
    const taxRow = document.getElementById('taxRow');
    if (taxAmount > 0) {
        taxEl.textContent = formatCurrency(taxAmount);
        taxRow.style.display = 'flex';
    } else {
        taxRow.style.display = 'none';
    }
    
    document.getElementById('totalAmount').textContent = formatCurrency(total);
}

function calculateShippingCost(subtotal) {
    if (!storeData || !storeData.settings) return 0;
    
    const settings = storeData.settings;
    const freeShippingThreshold = settings.freeShippingThreshold || 200;
    const shippingFee = settings.shippingFee || 15;
    
    return subtotal >= freeShippingThreshold ? 0 : shippingFee;
}

function calculateTax(subtotal) {
    // VAT calculation (15% in Saudi Arabia)
    const taxRate = 0.15;
    return subtotal * taxRate;
}

function continueShopping() {
    closeModal('cartModal');
    scrollToProducts();
}

// Wishlist Functions
function toggleWishlistItem(productId) {
    const index = wishlist.indexOf(productId);
    
    if (index === -1) {
        wishlist.push(productId);
        showNotification('تم إضافة المنتج للمفضلة', 'success');
    } else {
        wishlist.splice(index, 1);
        showNotification('تم حذف المنتج من المفضلة', 'info');
    }
    
    saveWishlistToStorage();
    updateWishlistCount();
    updateWishlistUI();
}

function updateWishlistCount() {
    const wishlistCountEl = document.getElementById('wishlistCount');
    if (wishlistCountEl) {
        wishlistCountEl.textContent = wishlist.length;
    }
}

function showWishlist() {
    updateWishlistDisplay();
    document.getElementById('wishlistModal').classList.add('active');
}

function updateWishlistDisplay() {
    const wishlistItems = document.getElementById('wishlistItems');
    wishlistItems.innerHTML = '';
    
    if (wishlist.length === 0) {
        wishlistItems.innerHTML = `
            <div class="empty-wishlist">
                <div class="empty-wishlist-icon">❤️</div>
                <h3>المفضلة فارغة</h3>
                <p>لم تقم بإضافة أي منتجات للمفضلة بعد</p>
                <button class="btn btn-primary" onclick="closeModal('wishlistModal')">ابدأ التسوق</button>
            </div>
        `;
        return;
    }
    
    wishlist.forEach(productId => {
        const product = storeProducts.find(p => p.id === productId);
        if (!product) return;
        
        const wishlistItem = document.createElement('div');
        wishlistItem.className = 'wishlist-item';
        wishlistItem.innerHTML = `
            <div class="wishlist-item-image">
                ${product.image ? `<img src="${product.image}" alt="${product.name}">` : '<div class="placeholder">صورة</div>'}
            </div>
            <div class="wishlist-item-info">
                <div class="wishlist-item-name">${product.name}</div>
                <div class="wishlist-item-price">${formatCurrency(product.price)}</div>
                <div class="wishlist-item-stock ${product.stock > 0 ? 'in-stock' : 'out-of-stock'}">
                    ${product.stock > 0 ? 'متوفر' : 'نفد المخزون'}
                </div>
            </div>
            <div class="wishlist-item-actions">
                <button class="btn btn-primary btn-sm" onclick="addToCartQuick('${product.id}')" ${product.stock === 0 ? 'disabled' : ''}>
                    إضافة للسلة
                </button>
                <button class="btn btn-outline btn-sm" onclick="showProductDetails(${JSON.stringify(product).replace(/"/g, '&quot;')})">
                    عرض التفاصيل
                </button>
                <button class="btn btn-danger btn-sm" onclick="toggleWishlistItem('${product.id}')">
                    حذف
                </button>
            </div>
        `;
        wishlistItems.appendChild(wishlistItem);
    });
}

function updateWishlistUI() {
    // Update wishlist buttons in product cards
    document.querySelectorAll('.action-btn').forEach(btn => {
        if (btn.title === 'إضافة للمفضلة') {
            const productId = btn.onclick.toString().match(/'([^']+)'/)[1];
            btn.textContent = wishlist.includes(productId) ? '❤️' : '🤍';
        }
    });
}

// Coupon Functions
function applyCoupon() {
    const couponCode = document.getElementById('couponCode').value.trim();
    
    if (!couponCode) {
        showNotification('يرجى إدخال كود الكوبون', 'warning');
        return;
    }
    
    // Sample coupon validation (in real app, this would be server-side)
    const validCoupons = {
        'WELCOME10': { type: 'percentage', value: 10, minAmount: 100 },
        'SAVE20': { type: 'percentage', value: 20, minAmount: 200 },
        'FLAT50': { type: 'fixed', value: 50, minAmount: 150 }
    };
    
    const coupon = validCoupons[couponCode.toUpperCase()];
    
    if (!coupon) {
        showNotification('كود الكوبون غير صحيح', 'error');
        return;
    }
    
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    if (subtotal < coupon.minAmount) {
        showNotification(`الحد الأدنى للطلب ${formatCurrency(coupon.minAmount)} لاستخدام هذا الكوبون`, 'warning');
        return;
    }
    
    // Apply coupon
    let discountAmount = 0;
    if (coupon.type === 'percentage') {
        discountAmount = (subtotal * coupon.value) / 100;
    } else {
        discountAmount = coupon.value;
    }
    
    // Update UI
    const discountRow = document.getElementById('discountRow');
    const discountAmountEl = document.getElementById('discountAmount');
    
    discountRow.style.display = 'flex';
    discountAmountEl.textContent = '-' + formatCurrency(discountAmount);
    
    // Update total
    const shippingCost = calculateShippingCost(subtotal);
    const taxAmount = calculateTax(subtotal);
    const total = subtotal - discountAmount + shippingCost + taxAmount;
    
    document.getElementById('totalAmount').textContent = formatCurrency(total);
    
    showNotification(`تم تطبيق كوبون الخصم! وفرت ${formatCurrency(discountAmount)}`, 'success');
    
    // Disable coupon input
    document.getElementById('couponCode').disabled = true;
    document.querySelector('.coupon-input button').disabled = true;
}

// Checkout Functions
function proceedToCheckout() {
    if (cart.length === 0) {
        showNotification('السلة فارغة', 'warning');
        return;
    }
    
    // Close cart modal and open checkout
    closeModal('cartModal');
    showCheckout();
}

function showCheckout() {
    updateCheckoutDisplay();
    document.getElementById('checkoutModal').classList.add('active');
    
    // Reset to first step
    currentCheckoutStep = 1;
    showCheckoutStep(1);
}

let currentCheckoutStep = 1;

function showCheckoutStep(step) {
    // Hide all steps
    document.querySelectorAll('.checkout-step').forEach(stepEl => {
        stepEl.classList.remove('active');
    });
    
    // Show current step
    document.getElementById(`step${step}`).classList.add('active');
    
    // Update step indicators
    document.querySelectorAll('.step').forEach((stepEl, index) => {
        stepEl.classList.remove('active', 'completed');
        if (index + 1 === step) {
            stepEl.classList.add('active');
        } else if (index + 1 < step) {
            stepEl.classList.add('completed');
        }
    });
    
    // Update navigation buttons
    const prevBtn = document.getElementById('prevStepBtn');
    const nextBtn = document.getElementById('nextStepBtn');
    const submitBtn = document.getElementById('submitOrderBtn');
    
    prevBtn.style.display = step > 1 ? 'block' : 'none';
    nextBtn.style.display = step < 3 ? 'block' : 'none';
    submitBtn.style.display = step === 3 ? 'block' : 'none';
    
    currentCheckoutStep = step;
}

function nextStep() {
    if (validateCurrentStep()) {
        if (currentCheckoutStep < 3) {
            showCheckoutStep(currentCheckoutStep + 1);
        }
    }
}

function previousStep() {
    if (currentCheckoutStep > 1) {
        showCheckoutStep(currentCheckoutStep - 1);
    }
}

function validateCurrentStep() {
    const currentStep = document.getElementById(`step${currentCheckoutStep}`);
    const requiredFields = currentStep.querySelectorAll('[required]');
    
    for (let field of requiredFields) {
        if (!field.value.trim()) {
            field.focus();
            showNotification('يرجى ملء جميع الحقول المطلوبة', 'warning');
            return false;
        }
    }
    
    return true;
}

function updateCheckoutDisplay() {
    // Update checkout items
    const checkoutItems = document.getElementById('checkoutItems');
    const summaryItems = document.getElementById('summaryItems');
    
    let itemsHTML = '';
    let summaryHTML = '';
    let subtotal = 0;
    
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;
        
        itemsHTML += `
            <div class="checkout-item">
                <div class="item-image">
                    ${item.image ? `<img src="${item.image}" alt="${item.name}">` : '<div class="placeholder">صورة</div>'}
                </div>
                <div class="item-details">
                    <div class="item-name">${item.name}</div>
                    <div class="item-options">
                        ${item.selectedSize ? `الحجم: ${item.selectedSize}` : ''}
                        ${item.selectedSize && item.selectedColor ? ' | ' : ''}
                        ${item.selectedColor ? `اللون: ${item.selectedColor}` : ''}
                    </div>
                    <div class="item-quantity">الكمية: ${item.quantity}</div>
                </div>
                <div class="item-price">${formatCurrency(itemTotal)}</div>
            </div>
        `;
        
        summaryHTML += `
            <div class="summary-item">
                <div class="item-info">
                    <div class="item-image">
                        ${item.image ? `<img src="${item.image}" alt="${item.name}">` : '<div class="placeholder">صورة</div>'}
                    </div>
                    <div class="item-details">
                        <div class="item-name">${item.name}</div>
                        <div class="item-quantity">الكمية: ${item.quantity}</div>
                    </div>
                </div>
                <div class="item-price">${formatCurrency(itemTotal)}</div>
            </div>
        `;
    });
    
    checkoutItems.innerHTML = itemsHTML;
    summaryItems.innerHTML = summaryHTML;
    
    // Update totals
    const shippingCost = calculateShippingCost(subtotal);
    const taxAmount = calculateTax(subtotal);
    const total = subtotal + shippingCost + taxAmount;
    
    document.getElementById('checkoutSubtotal').textContent = formatCurrency(subtotal);
    document.getElementById('checkoutShipping').textContent = formatCurrency(shippingCost);
    document.getElementById('checkoutTax').textContent = formatCurrency(taxAmount);
    document.getElementById('checkoutTotal').textContent = formatCurrency(total);
}

async function submitOrder() {
    if (!validateCurrentStep()) {
        return;
    }
    
    try {
        showLoading('جاري إنشاء الطلب...');
        
        // Collect order data
        const orderData = {
            customerId: currentCustomer ? currentCustomer.uid : 'guest',
            customerName: document.getElementById('shippingFirstName').value + ' ' + document.getElementById('shippingLastName').value,
            customerEmail: document.getElementById('shippingEmail').value,
            customerPhone: document.getElementById('shippingPhone').value,
            shippingAddress: {
                name: document.getElementById('shippingFirstName').value + ' ' + document.getElementById('shippingLastName').value,
                phone: document.getElementById('shippingPhone').value,
                email: document.getElementById('shippingEmail').value,
                address: document.getElementById('shippingAddress').value,
                city: document.getElementById('shippingCity').value,
                postalCode: document.getElementById('shippingPostal').value
            },
            items: cart.map(item => ({
                productId: item.productId,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                selectedSize: item.selectedSize,
                selectedColor: item.selectedColor
            })),
            subtotal: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
            shippingCost: calculateShippingCost(cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)),
            taxAmount: calculateTax(cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)),
            total: 0, // Will be calculated
            paymentMethod: document.querySelector('input[name="paymentMethod"]:checked').value,
            orderNotes: document.getElementById('orderNotes').value,
            status: 'pending',
            createdAt: new Date()
        };
        
        orderData.total = orderData.subtotal + orderData.shippingCost + orderData.taxAmount;
        
        // إنشاء الطلب في Firestore
        const orderRef = await db.collection('stores').doc(currentStoreId).collection('orders').add({
            ...orderData,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Clear cart
        cart = [];
        saveCartToStorage();
        updateCartCount();
        
        // Close checkout modal
        closeModal('checkoutModal');
        
        // Show success message
        showOrderSuccess(orderRef.id);
        
    } catch (error) {
        console.error('Error creating order:', error);
        showNotification('حدث خطأ في إنشاء الطلب', 'error');
    } finally {
        hideLoading();
    }
}

function showOrderSuccess(orderId) {
    const successHTML = `
        <div class="order-success">
            <div class="success-icon">✅</div>
            <h2>تم إنشاء طلبك بنجاح!</h2>
            <p>رقم الطلب: <strong>${orderId}</strong></p>
            <p>سيتم التواصل معك قريباً لتأكيد الطلب</p>
            <div class="success-actions">
                <button class="btn btn-primary" onclick="continueShopping()">متابعة التسوق</button>
                <button class="btn btn-outline" onclick="showMyOrders()">عرض طلباتي</button>
            </div>
        </div>
    `;
    
    // Create and show success modal
    const successModal = document.createElement('div');
    successModal.className = 'modal active';
    successModal.innerHTML = `
        <div class="modal-content">
            ${successHTML}
        </div>
    `;
    
    document.body.appendChild(successModal);
    
    // Auto close after 10 seconds
    setTimeout(() => {
        successModal.remove();
    }, 10000);
}

// Filter and Search Functions
function filterByCategory(category) {
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
        categoryFilter.value = category;
    }
    
    currentFilters.category = category;
    applyFilters();
    
    // Scroll to products section
    scrollToProducts();
}

function applyFilters() {
    const categoryFilter = document.getElementById('categoryFilter').value;
    const priceFilter = document.getElementById('priceFilter').value;
    const searchQuery = document.getElementById('globalSearchInput').value.toLowerCase();
    
    let filteredProducts = [...storeProducts];
    
    // Filter by category
    if (categoryFilter) {
        filteredProducts = filteredProducts.filter(product => product.category === categoryFilter);
    }
    
    // Filter by price
    if (priceFilter) {
        if (priceFilter === '500+') {
            filteredProducts = filteredProducts.filter(product => product.price >= 500);
        } else {
            const [min, max] = priceFilter.split('-').map(Number);
            filteredProducts = filteredProducts.filter(product => product.price >= min && product.price <= max);
        }
    }
    
    // Filter by search query
    if (searchQuery) {
        filteredProducts = filteredProducts.filter(product => 
            product.name.toLowerCase().includes(searchQuery) ||
            product.description?.toLowerCase().includes(searchQuery) ||
            product.category?.toLowerCase().includes(searchQuery) ||
            product.tags?.some(tag => tag.toLowerCase().includes(searchQuery))
        );
    }
    
    // Apply sorting
    filteredProducts = sortProducts(filteredProducts, currentSort);
    
    // Reset pagination
    currentProductsPage = 1;
    
    // Display filtered products
    displayProducts(filteredProducts);
}

function sortProducts(products, sortBy) {
    switch (sortBy) {
        case 'price_low':
            return products.sort((a, b) => a.price - b.price);
        case 'price_high':
            return products.sort((a, b) => b.price - a.price);
        case 'name':
            return products.sort((a, b) => a.name.localeCompare(b.name));
        case 'rating':
            return products.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        case 'newest':
        default:
            return products.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }
}

function performSearch() {
    const searchQuery = document.getElementById('globalSearchInput').value.trim();
    
    if (!searchQuery) {
        showNotification('يرجى إدخال كلمة البحث', 'warning');
        return;
    }
    
    applyFilters();
    scrollToProducts();
    
    // Hide search bar
    toggleSearch();
}

function changeView(view) {
    currentView = view;
    
    // Update view buttons
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-view="${view}"]`).classList.add('active');
    
    // Update products grid
    const productsGrid = document.getElementById('storeProductsGrid');
    if (view === 'list') {
        productsGrid.classList.add('list-view');
    } else {
        productsGrid.classList.remove('list-view');
    }
}

function loadMoreProducts() {
    currentProductsPage++;
    
    // Get current filtered products
    let filteredProducts = [...storeProducts];
    
    // Apply current filters
    const categoryFilter = document.getElementById('categoryFilter').value;
    const priceFilter = document.getElementById('priceFilter').value;
    const searchQuery = document.getElementById('globalSearchInput').value.toLowerCase();
    
    if (categoryFilter) {
        filteredProducts = filteredProducts.filter(product => product.category === categoryFilter);
    }
    
    if (priceFilter) {
        if (priceFilter === '500+') {
            filteredProducts = filteredProducts.filter(product => product.price >= 500);
        } else {
            const [min, max] = priceFilter.split('-').map(Number);
            filteredProducts = filteredProducts.filter(product => product.price >= min && product.price <= max);
        }
    }
    
    if (searchQuery) {
        filteredProducts = filteredProducts.filter(product => 
            product.name.toLowerCase().includes(searchQuery) ||
            product.description?.toLowerCase().includes(searchQuery) ||
            product.category?.toLowerCase().includes(searchQuery)
        );
    }
    
    // Apply sorting
    filteredProducts = sortProducts(filteredProducts, currentSort);
    
    // Get products for current page
    const startIndex = (currentProductsPage - 1) * productsPerPage;
    const endIndex = startIndex + productsPerPage;
    const newProducts = filteredProducts.slice(startIndex, endIndex);
    
    // Append new products
    const productsGrid = document.getElementById('storeProductsGrid');
    newProducts.forEach(product => {
        const productCard = createProductCard(product);
        productsGrid.appendChild(productCard);
    });
    
    // Update load more button
    updateLoadMoreButton(filteredProducts.length);
}

function updateLoadMoreButton(totalProducts) {
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    const currentlyShown = currentProductsPage * productsPerPage;
    
    if (currentlyShown >= totalProducts) {
        loadMoreBtn.style.display = 'none';
    } else {
        loadMoreBtn.style.display = 'block';
        const remaining = totalProducts - currentlyShown;
        loadMoreBtn.textContent = `تحميل المزيد (${remaining} منتج متبقي)`;
    }
}

// UI Helper Functions
function toggleSearch() {
    const searchBar = document.getElementById('searchBar');
    searchBar.classList.toggle('active');
    
    if (searchBar.classList.contains('active')) {
        document.getElementById('globalSearchInput').focus();
    }
}

function toggleUserMenu() {
    const userDropdown = document.getElementById('userDropdown');
    userDropdown.classList.toggle('active');
}

function scrollToProducts() {
    document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
}

function scrollToOffers() {
    document.getElementById('offers').scrollIntoView({ behavior: 'smooth' });
}

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Storage Functions
function saveCartToStorage() {
    localStorage.setItem(`cart_${currentStoreId}`, JSON.stringify(cart));
}

function loadCartFromStorage() {
    const savedCart = localStorage.getItem(`cart_${currentStoreId}`);
    if (savedCart) {
        cart = JSON.parse(savedCart);
    }
}

function saveWishlistToStorage() {
    localStorage.setItem(`wishlist_${currentStoreId}`, JSON.stringify(wishlist));
}

function loadWishlistFromStorage() {
    const savedWishlist = localStorage.getItem(`wishlist_${currentStoreId}`);
    if (savedWishlist) {
        wishlist = JSON.parse(savedWishlist);
    }
}

// Event Listeners
function initializeEventListeners() {
    // Filter and sort event listeners
    document.getElementById('categoryFilter').addEventListener('change', applyFilters);
    document.getElementById('priceFilter').addEventListener('change', applyFilters);
    document.getElementById('sortFilter').addEventListener('change', function() {
        currentSort = this.value;
        applyFilters();
    });
    
    // Search event listeners
    document.getElementById('globalSearchInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
    
    // Payment method change listener
    document.querySelectorAll('input[name="paymentMethod"]').forEach(radio => {
        radio.addEventListener('change', function() {
            const cardDetails = document.getElementById('cardDetails');
            if (this.value === 'CARD') {
                cardDetails.style.display = 'block';
            } else {
                cardDetails.style.display = 'none';
            }
        });
    });
    
    // Close modals when clicking outside
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            e.target.classList.remove('active');
        }
    });
    
    // Close user dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.user-menu')) {
            document.getElementById('userDropdown').classList.remove('active');
        }
    });
}

// Flash Sale Functions
function initializeFlashSale() {
    // Check if there's an active flash sale
    const flashSaleEndTime = localStorage.getItem('flashSaleEndTime');
    
    if (flashSaleEndTime && new Date(flashSaleEndTime) > new Date()) {
        startFlashSaleCountdown(new Date(flashSaleEndTime));
        document.getElementById('flashSale').style.display = 'block';
    } else {
        // Set a demo flash sale (ends in 2 hours)
        const endTime = new Date(Date.now() + 2 * 60 * 60 * 1000);
        localStorage.setItem('flashSaleEndTime', endTime.toISOString());
        startFlashSaleCountdown(endTime);
        document.getElementById('flashSale').style.display = 'block';
    }
}

function startFlashSaleCountdown(endTime) {
    function updateCountdown() {
        const now = new Date().getTime();
        const distance = endTime.getTime() - now;
        
        if (distance < 0) {
            // Flash sale ended
            document.getElementById('flashSale').style.display = 'none';
            localStorage.removeItem('flashSaleEndTime');
            if (flashSaleTimer) {
                clearInterval(flashSaleTimer);
            }
            return;
        }
        
        const hours = Math.floor(distance / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        
        document.getElementById('hours').textContent = hours.toString().padStart(2, '0');
        document.getElementById('minutes').textContent = minutes.toString().padStart(2, '0');
        document.getElementById('seconds').textContent = seconds.toString().padStart(2, '0');
    }
    
    updateCountdown();
    flashSaleTimer = setInterval(updateCountdown, 1000);
}

// Back to Top Button
function initializeBackToTop() {
    const backToTopBtn = document.getElementById('backToTop');
    
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            backToTopBtn.classList.add('visible');
        } else {
            backToTopBtn.classList.remove('visible');
        }
    });
}

// Live Chat Functions
function initializeLiveChat() {
    // Initialize chat with welcome message
    const chatMessages = document.getElementById('chatMessages');
    if (chatMessages && chatMessages.children.length === 0) {
        addChatMessage('مرحباً! كيف يمكنني مساعدتك؟', 'bot');
    }
}

function toggleChat() {
    const chatWindow = document.getElementById('chatWindow');
    chatWindow.classList.toggle('active');
    
    if (chatWindow.classList.contains('active')) {
        document.getElementById('chatMessageInput').focus();
    }
}

function sendChatMessage() {
    const messageInput = document.getElementById('chatMessageInput');
    const message = messageInput.value.trim();
    
    if (!message) return;
    
    // Add user message
    addChatMessage(message, 'user');
    
    // Clear input
    messageInput.value = '';
    
    // Simulate bot response
    setTimeout(() => {
        const botResponse = generateBotResponse(message);
        addChatMessage(botResponse, 'bot');
    }, 1000);
}

function addChatMessage(message, sender) {
    const chatMessages = document.getElementById('chatMessages');
    const messageEl = document.createElement('div');
    messageEl.className = `chat-message ${sender}`;
    messageEl.textContent = message;
    
    chatMessages.appendChild(messageEl);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function generateBotResponse(userMessage) {
    const responses = {
        'مرحبا': 'مرحباً بك! كيف يمكنني مساعدتك اليوم؟',
        'السعر': 'يمكنك مشاهدة أسعار جميع المنتجات في صفحة المنتجات. هل تبحث عن منتج معين؟',
        'الشحن': 'نوفر شحن مجاني للطلبات أكثر من 200 ريال. الشحن العادي يستغرق 3-5 أيام عمل.',
        'الدفع': 'نقبل الدفع عند الاستلام والدفع الإلكتروني بالبطاقات الائتمانية.',
        'الإرجاع': 'يمكنك إرجاع المنتجات خلال 14 يوم من تاريخ الاستلام.',
        'default': 'شكراً لك على تواصلك معنا. سيقوم أحد ممثلي خدمة العملاء بالرد عليك قريباً.'
    };
    
    const lowerMessage = userMessage.toLowerCase();
    
    for (const [key, response] of Object.entries(responses)) {
        if (lowerMessage.includes(key)) {
            return response;
        }
    }
    
    return responses.default;
}

// Share Functions
function shareProduct(productId) {
    const product = storeProducts.find(p => p.id === productId);
    if (!product) return;
    
    // Store current product for sharing
    window.currentSharingProduct = product;
    
    document.getElementById('shareModal').classList.add('active');
}

function shareToWhatsApp() {
    const product = window.currentSharingProduct;
    if (!product) return;
    
    const text = `تحقق من هذا المنتج الرائع: ${product.name}\nالسعر: ${formatCurrency(product.price)}\n${window.location.href}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    
    window.open(url, '_blank');
    closeModal('shareModal');
}

function shareToTwitter() {
    const product = window.currentSharingProduct;
    if (!product) return;
    
    const text = `تحقق من هذا المنتج الرائع: ${product.name} - ${formatCurrency(product.price)}`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(window.location.href)}`;
    
    window.open(url, '_blank');
    closeModal('shareModal');
}

function shareToFacebook() {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`;
    
    window.open(url, '_blank');
    closeModal('shareModal');
}

function copyProductLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
        showNotification('تم نسخ الرابط بنجاح', 'success');
        closeModal('shareModal');
    }).catch(() => {
        showNotification('فشل في نسخ الرابط', 'error');
    });
}

// Quick View Function
function quickView(productId) {
    const product = storeProducts.find(p => p.id === productId);
    if (!product) return;
    
    const quickViewContent = document.querySelector('#quickViewModal .quick-view-content');
    quickViewContent.innerHTML = `
        <div class="quick-view-product">
            <div class="quick-view-image">
                ${product.image ? `<img src="${product.image}" alt="${product.name}">` : '<div class="placeholder">لا توجد صورة</div>'}
            </div>
            <div class="quick-view-info">
                <h3>${product.name}</h3>
                <div class="product-rating">
                    <div class="stars">${generateStars(product.rating || 0)}</div>
                    <span class="rating-text">(${product.rating || 0}) ${product.reviewsCount || 0} تقييم</span>
                </div>
                <div class="product-price">
                    <span class="current-price">${formatCurrency(product.price)}</span>
                    ${product.originalPrice ? `<span class="original-price">${formatCurrency(product.originalPrice)}</span>` : ''}
                </div>
                <p class="product-description">${product.description || ''}</p>
                <div class="quick-view-actions">
                    <button class="btn btn-primary" onclick="addToCartQuick('${product.id}'); closeModal('quickViewModal')">إضافة للسلة</button>
                    <button class="btn btn-outline" onclick="showProductDetails(${JSON.stringify(product).replace(/"/g, '&quot;')}); closeModal('quickViewModal')">عرض التفاصيل</button>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('quickViewModal').classList.add('active');
}

// Customer Authentication Functions
function showCustomerLogin() {
    closeModal('customerRegisterModal');
    document.getElementById('customerLoginModal').classList.add('active');
}

function showCustomerRegister() {
    closeModal('customerLoginModal');
    document.getElementById('customerRegisterModal').classList.add('active');
}

function showMyOrders() {
    // Load customer orders
    loadCustomerOrders();
    document.getElementById('myOrdersModal').classList.add('active');
}

async function loadCustomerOrders() {
    const customerOrders = document.getElementById('customerOrders');
    customerOrders.innerHTML = '';
    try {
        // جلب الطلبات من Firestore للعميل الحالي فقط
        let query = db.collection('stores').doc(currentStoreId).collection('orders');
        if (currentCustomer) {
            query = query.where('customerId', '==', currentCustomer.uid);
        }
        query = query.orderBy('createdAt', 'desc');
        const snapshot = await query.get();
        if (snapshot.empty) {
            customerOrders.innerHTML = `
                <div class="no-orders">
                    <div class="no-orders-icon">📦</div>
                    <h3>لا توجد طلبات</h3>
                    <p>لم تقم بأي طلبات حتى الآن</p>
                    <button class="btn btn-primary" onclick="closeModal('myOrdersModal')">ابدأ التسوق</button>
                </div>
            `;
            return;
        }
        snapshot.forEach(doc => {
            const order = doc.data();
            const orderEl = document.createElement('div');
            orderEl.className = 'customer-order';
            orderEl.innerHTML = `
                <div class="order-header">
                    <div class="order-info">
                        <h4>طلب رقم: ${doc.id}</h4>
                        <p>تاريخ الطلب: ${order.createdAt ? formatDate(order.createdAt.toDate ? order.createdAt.toDate() : order.createdAt) : ''}</p>
                    </div>
                    <div class="order-status">
                        <span class="status-badge status-${order.status}">${getOrderStatusText(order.status)}</span>
                    </div>
                </div>
                <div class="order-items">
                    ${(order.items || []).map(item => `
                        <div class="order-item">
                            <span>${item.name}</span>
                            <span>الكمية: ${item.quantity}</span>
                            <span>${formatCurrency(item.price)}</span>
                        </div>
                    `).join('')}
                </div>
                <div class="order-footer">
                    <div class="order-total">المجموع: ${formatCurrency(order.total)}</div>
                    <div class="order-actions">
                        <button class="btn btn-outline btn-sm" onclick="trackOrder('${doc.id}')">تتبع الطلب</button>
                        ${order.status === 'delivered' ? '<button class="btn btn-primary btn-sm" onclick="reorderItems(\'' + doc.id + '\')">إعادة الطلب</button>' : ''}
                    </div>
                </div>
            `;
            customerOrders.appendChild(orderEl);
        });
    } catch (error) {
        customerOrders.innerHTML = `<div class='text-center'><p>حدث خطأ أثناء تحميل الطلبات</p></div>`;
    }
}

function getOrderStatusText(status) {
    const statusMap = {
        'pending': 'قيد المراجعة',
        'processing': 'قيد التجهيز',
        'shipped': 'تم الشحن',
        'delivered': 'تم التسليم',
        'cancelled': 'ملغي'
    };
    return statusMap[status] || status;
}

function trackOrder(orderId) {
    showNotification(`تتبع الطلب ${orderId} - هذه الميزة قيد التطوير`, 'info');
}

function reorderItems(orderId) {
    showNotification(`إعادة طلب العناصر من الطلب ${orderId} - هذه الميزة قيد التطوير`, 'info');
}

// Review Functions
function showAddReview() {
    document.getElementById('addReviewModal').classList.add('active');
    
    // Initialize rating input
    const ratingStars = document.querySelectorAll('#ratingInput .star');
    ratingStars.forEach((star, index) => {
        star.addEventListener('click', function() {
            const rating = index + 1;
            updateRatingInput(rating);
        });
    });
}

function updateRatingInput(rating) {
    const ratingStars = document.querySelectorAll('#ratingInput .star');
    ratingStars.forEach((star, index) => {
        if (index < rating) {
            star.textContent = '★';
            star.classList.add('active');
        } else {
            star.textContent = '☆';
            star.classList.remove('active');
        }
    });
    
    // Store rating value
    document.getElementById('ratingInput').dataset.rating = rating;
}

// Notification Functions
function showNotification(message, type = 'info', duration = 5000) {
    const toast = document.getElementById('notificationToast');
    const toastIcon = toast.querySelector('.toast-icon');
    const toastMessage = toast.querySelector('.toast-message');
    
    // Set icon based on type
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    
    toastIcon.textContent = icons[type] || icons.info;
    toastMessage.textContent = message;
    
    // Set toast type
    toast.className = `notification-toast ${type}`;
    
    // Show toast
    toast.classList.add('show');
    
    // Auto hide
    setTimeout(() => {
        hideNotification();
    }, duration);
}

function hideNotification() {
    const toast = document.getElementById('notificationToast');
    toast.classList.remove('show');
}

// Initialize store when page loads
document.addEventListener('DOMContentLoaded', function() {
    initializeStore();
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
window.continueShopping = continueShopping;
window.applyCoupon = applyCoupon;
window.nextStep = nextStep;
window.previousStep = previousStep;
window.submitOrder = submitOrder;
window.toggleWishlistItem = toggleWishlistItem;
window.showWishlist = showWishlist;
window.filterByCategory = filterByCategory;
window.performSearch = performSearch;
window.changeView = changeView;
window.loadMoreProducts = loadMoreProducts;
window.toggleSearch = toggleSearch;
window.toggleUserMenu = toggleUserMenu;
window.scrollToProducts = scrollToProducts;
window.scrollToOffers = scrollToOffers;
window.scrollToTop = scrollToTop;
window.shareProduct = shareProduct;
window.shareToWhatsApp = shareToWhatsApp;
window.shareToTwitter = shareToTwitter;
window.shareToFacebook = shareToFacebook;
window.copyProductLink = copyProductLink;
window.quickView = quickView;
window.showCustomerLogin = showCustomerLogin;
window.showCustomerRegister = showCustomerRegister;
window.showMyOrders = showMyOrders;
window.trackOrder = trackOrder;
window.reorderItems = reorderItems;
window.showAddReview = showAddReview;
window.toggleChat = toggleChat;
window.sendChatMessage = sendChatMessage;
window.showNotification = showNotification;
window.closeModal = closeModal;

// تأكد من تحميل المنتجات قبل أي عملية إضافة للسلة أو شراء الآن
function getProductById(productId) {
    // استخدم storeProducts المحدث
    return storeProducts.find(p => p.id === productId);
}

window.hideNotification = hideNotification;

// دالة إغلاق أي نافذة منبثقة
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}
window.closeModal = closeModal;

// دالة الملف الشخصي المؤقتة
function showProfileItem() {
    alert('ميزة الملف الشخصي تحت التطوير');
}
window.showProfileItem = showProfileItem;