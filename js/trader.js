// Trader Dashboard Functions

let currentStoreData = null;
let storeProducts = [];
let storeOrders = [];
let storeCustomers = [];
let storeCoupons = [];
let storeTemplates = [];

async function loadTraderDashboardData() {
    try {
        showLoading();
        
        if (!currentStore) {
            showNotification('خطأ: لم يتم العثور على معرف المتجر', 'error');
            return;
        }
        
        // Load store data
        const storeDoc = await db.collection('stores').doc(currentStore).get();
        if (storeDoc.exists) {
            currentStoreData = storeDoc.data();
            
            // Update store name in header
            document.getElementById('traderName').textContent = currentStoreData.name;
        }
        
        // Load dashboard statistics
        await loadTraderStats();
        
        // Load store templates for customization
        await loadStoreTemplates();
        
    } catch (error) {
        console.error('Error loading trader dashboard:', error);
        showNotification('حدث خطأ في تحميل البيانات', 'error');
    } finally {
        hideLoading();
    }
}

async function loadStoreTemplates() {
    try {
        // Load available templates for store customization
        const templatesSnapshot = await db.collection('templates').get();
        
        storeTemplates = [];
        templatesSnapshot.docs.forEach(doc => {
            storeTemplates.push({ id: doc.id, ...doc.data() });
        });
        
        // Update template selector in appearance settings
        updateTemplateSelector();
        
    } catch (error) {
        console.error('Error loading templates:', error);
        // Create default templates if none exist
        await createDefaultTemplates();
    }
}

function updateTemplateSelector() {
    const templateSelector = document.getElementById('templateSelector');
    if (!templateSelector) return;
    
    templateSelector.innerHTML = '<option value="">اختر القالب</option>';
    
    storeTemplates.forEach(template => {
        const option = document.createElement('option');
        option.value = template.id;
        option.textContent = template.name;
        if (currentStoreData && currentStoreData.template === template.id) {
            option.selected = true;
        }
        templateSelector.appendChild(option);
    });
}

async function createDefaultTemplates() {
    const defaultTemplates = [
        {
            id: 'modern',
            name: 'قالب عصري',
            description: 'تصميم عصري ومتطور',
            colors: {
                primary: '#1E40AF',
                secondary: '#0891B2',
                background: '#F8FAFC'
            },
            layout: 'grid',
            features: ['hero_slider', 'categories', 'featured_products', 'testimonials']
        },
        {
            id: 'classic',
            name: 'قالب كلاسيكي',
            description: 'تصميم كلاسيكي أنيق',
            colors: {
                primary: '#7C3AED',
                secondary: '#EC4899',
                background: '#FAFAFA'
            },
            layout: 'list',
            features: ['hero_banner', 'categories', 'products', 'about']
        },
        {
            id: 'minimal',
            name: 'قالب بسيط',
            description: 'تصميم بسيط ونظيف',
            colors: {
                primary: '#059669',
                secondary: '#0891B2',
                background: '#FFFFFF'
            },
            layout: 'minimal',
            features: ['hero_simple', 'products', 'contact']
        }
    ];
    
    for (const template of defaultTemplates) {
        await db.collection('templates').doc(template.id).set(template);
    }
    
    storeTemplates = defaultTemplates;
    updateTemplateSelector();
}

async function loadTraderStats() {
    try {
        // Load products count
        const productsSnapshot = await db.collection('stores').doc(currentStore).collection('products').get();
        const productsCount = productsSnapshot.size;
        document.getElementById('traderTotalProducts').textContent = productsCount;
        
        // Load orders and calculate stats
        const ordersSnapshot = await db.collection('stores').doc(currentStore).collection('orders').get();
        let totalOrders = 0;
        let totalRevenue = 0;
        
        ordersSnapshot.docs.forEach(doc => {
            const order = doc.data();
            totalOrders++;
            if (order.total) {
                totalRevenue += order.total;
            }
        });
        
        document.getElementById('traderTotalOrders').textContent = totalOrders;
        document.getElementById('traderTotalRevenue').textContent = formatPrice(totalRevenue);
        
        // Load customers count
        const customersSnapshot = await db.collection('stores').doc(currentStore).collection('customers').get();
        document.getElementById('traderTotalCustomers').textContent = customersSnapshot.size;
        
        // Load recent orders
        await loadRecentOrders();
        
    } catch (error) {
        console.error('Error loading trader stats:', error);
    }
}

async function loadRecentOrders() {
    try {
        const ordersSnapshot = await db.collection('stores').doc(currentStore).collection('orders')
            .orderBy('createdAt', 'desc')
            .limit(5)
            .get();
        
        const recentOrdersTable = document.getElementById('recentOrdersTable');
        recentOrdersTable.innerHTML = '';
        
        if (ordersSnapshot.empty) {
            recentOrdersTable.innerHTML = '<tr><td colspan="5" class="text-center">لا توجد طلبات حتى الآن</td></tr>';
            return;
        }
        
        for (const doc of ordersSnapshot.docs) {
            const order = doc.data();
            const orderId = doc.id;
            
            // Get customer info
            let customerName = 'غير معروف';
            if (order.customerId) {
                const customerDoc = await db.collection('stores').doc(currentStore).collection('customers').doc(order.customerId).get();
                if (customerDoc.exists) {
                    customerName = customerDoc.data().name;
                }
            }
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${orderId.substring(0, 8)}...</td>
                <td>${customerName}</td>
                <td>${formatPrice(order.total || 0)}</td>
                <td><span class="status-badge status-${getOrderStatusClass(order.status)}">${getOrderStatusText(order.status)}</span></td>
                <td>${formatDate(order.createdAt?.toDate())}</td>
            `;
            recentOrdersTable.appendChild(row);
        }
        
    } catch (error) {
        console.error('Error loading recent orders:', error);
    }
}

async function loadProductsData() {
    try {
        showLoading();
        
        const productsSnapshot = await db.collection('stores').doc(currentStore).collection('products')
            .orderBy('createdAt', 'desc')
            .get();
        
        const productsGrid = document.getElementById('productsGrid');
        productsGrid.innerHTML = '';
        
        if (productsSnapshot.empty) {
            productsGrid.innerHTML = '<div class="text-center"><p>لا توجد منتجات حتى الآن</p><button class="btn btn-primary" onclick="showAddProductModal()">إضافة أول منتج</button></div>';
            return;
        }
        
        storeProducts = [];
        productsSnapshot.docs.forEach(doc => {
            const product = { id: doc.id, ...doc.data() };
            storeProducts.push(product);
            
            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            productCard.innerHTML = `
                <div class="product-image">
                    ${product.image ? `<img src="${product.image}" alt="${product.name}">` : '<div class="placeholder">لا توجد صورة</div>'}
                </div>
                <div class="product-info">
                    <h3 class="product-name">${product.name}</h3>
                    <div class="product-price">${formatPrice(product.price)}</div>
                    <p class="product-description">${product.description?.substring(0, 100) || ''}...</p>
                    <div class="product-meta">
                        <span class="stock">المخزون: ${product.stock || 0}</span>
                        <span class="status-badge ${product.status === 'active' ? 'status-active' : 'status-inactive'}">
                            ${product.status === 'active' ? 'نشط' : 'معطل'}
                        </span>
                    </div>
                    <div class="product-actions">
                        <button class="btn btn-outline btn-sm" onclick="editProduct('${doc.id}')">تعديل</button>
                        <button class="btn btn-danger btn-sm" onclick="deleteProduct('${doc.id}')">حذف</button>
                    </div>
                </div>
            `;
            productsGrid.appendChild(productCard);
        });
        
    } catch (error) {
        console.error('Error loading products:', error);
        showNotification('حدث خطأ في تحميل المنتجات', 'error');
    } finally {
        hideLoading();
    }
}

async function loadOrdersData() {
    try {
        showLoading();
        
        const ordersSnapshot = await db.collection('stores').doc(currentStore).collection('orders')
            .orderBy('createdAt', 'desc')
            .get();
        
        const ordersTable = document.getElementById('ordersTable');
        ordersTable.innerHTML = '';
        
        if (ordersSnapshot.empty) {
            ordersTable.innerHTML = '<tr><td colspan="7" class="text-center">لا توجد طلبات حتى الآن</td></tr>';
            return;
        }
        
        storeOrders = [];
        for (const doc of ordersSnapshot.docs) {
            const order = { id: doc.id, ...doc.data() };
            storeOrders.push(order);
            
            // Get customer info
            let customerName = 'غير معروف';
            if (order.customerId) {
                const customerDoc = await db.collection('stores').doc(currentStore).collection('customers').doc(order.customerId).get();
                if (customerDoc.exists) {
                    customerName = customerDoc.data().name;
                }
            }
            
            // Get products info
            let productsText = 'غير محدد';
            if (order.items && order.items.length > 0) {
                productsText = order.items.map(item => `${item.name || 'منتج'} (${item.quantity || 1})`).join(', ');
            }
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${doc.id.substring(0, 8)}...</td>
                <td>${customerName}</td>
                <td>${productsText}</td>
                <td>${formatPrice(order.total || 0)}</td>
                <td><span class="status-badge status-${getOrderStatusClass(order.status)}">${getOrderStatusText(order.status)}</span></td>
                <td>${formatDate(order.createdAt?.toDate())}</td>
                <td>
                    <select onchange="updateOrderStatus('${doc.id}', this.value)" class="order-status-select">
                        <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>قيد المراجعة</option>
                        <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>قيد التجهيز</option>
                        <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>تم الشحن</option>
                        <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>تم التسليم</option>
                        <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>ملغي</option>
                    </select>
                    <button class="btn btn-outline btn-sm" onclick="viewOrderDetails('${doc.id}')">تفاصيل</button>
                </td>
            `;
            ordersTable.appendChild(row);
        }
        
    } catch (error) {
        console.error('Error loading orders:', error);
        showNotification('حدث خطأ في تحميل الطلبات', 'error');
    } finally {
        hideLoading();
    }
}

async function loadCustomersData() {
    try {
        showLoading();
        
        const customersSnapshot = await db.collection('stores').doc(currentStore).collection('customers')
            .orderBy('createdAt', 'desc')
            .get();
        
        const customersTable = document.getElementById('customersTable');
        customersTable.innerHTML = '';
        
        if (customersSnapshot.empty) {
            customersTable.innerHTML = '<tr><td colspan="6" class="text-center">لا يوجد عملاء حتى الآن</td></tr>';
            return;
        }
        
        storeCustomers = [];
        customersSnapshot.docs.forEach(doc => {
            const customer = { id: doc.id, ...doc.data() };
            storeCustomers.push(customer);
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${customer.name}</td>
                <td>${customer.email}</td>
                <td>${customer.phone || 'غير محدد'}</td>
                <td>${customer.totalOrders || 0}</td>
                <td>${formatPrice(customer.totalSpent || 0)}</td>
                <td>${formatDate(customer.createdAt?.toDate())}</td>
            `;
            customersTable.appendChild(row);
        });
        
    } catch (error) {
        console.error('Error loading customers:', error);
        showNotification('حدث خطأ في تحميل العملاء', 'error');
    } finally {
        hideLoading();
    }
}

async function loadCouponsData() {
    try {
        showLoading();
        
        const couponsSnapshot = await db.collection('stores').doc(currentStore).collection('coupons')
            .orderBy('createdAt', 'desc')
            .get();
        
        const couponsTable = document.getElementById('couponsTable');
        couponsTable.innerHTML = '';
        
        if (couponsSnapshot.empty) {
            couponsTable.innerHTML = '<tr><td colspan="7" class="text-center">لا توجد كوبونات حتى الآن</td></tr>';
            return;
        }
        
        storeCoupons = [];
        couponsSnapshot.docs.forEach(doc => {
            const coupon = { id: doc.id, ...doc.data() };
            storeCoupons.push(coupon);
            
            const isExpired = coupon.expiryDate && new Date(coupon.expiryDate.toDate()) < new Date();
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><code>${coupon.code}</code></td>
                <td>${coupon.type === 'percentage' ? 'نسبة مئوية' : 'مبلغ ثابت'}</td>
                <td>${coupon.type === 'percentage' ? coupon.value + '%' : formatPrice(coupon.value)}</td>
                <td>${coupon.expiryDate ? formatDate(coupon.expiryDate.toDate()) : 'بلا انتهاء'}</td>
                <td>${coupon.usedCount || 0} / ${coupon.maxUses || '∞'}</td>
                <td><span class="status-badge status-${isExpired ? 'inactive' : 'active'}">${isExpired ? 'منتهي' : 'نشط'}</span></td>
                <td>
                    <button class="btn btn-outline btn-sm" onclick="editCoupon('${doc.id}')">تعديل</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteCoupon('${doc.id}')">حذف</button>
                </td>
            `;
            couponsTable.appendChild(row);
        });
        
    } catch (error) {
        console.error('Error loading coupons:', error);
        showNotification('حدث خطأ في تحميل الكوبونات', 'error');
    } finally {
        hideLoading();
    }
}

// Product Management Functions
function showAddProductModal() {
    document.getElementById('addProductModal').classList.add('active');
    // Reset form
    document.getElementById('addProductForm').reset();
    document.getElementById('imagePreview').innerHTML = '';
}

// Handle product image preview
document.getElementById('productImage').addEventListener('change', function(e) {
    const file = e.target.files[0];
    const preview = document.getElementById('imagePreview');
    
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.innerHTML = `<img src="${e.target.result}" alt="معاينة الصورة">`;
        };
        reader.readAsDataURL(file);
    } else {
        preview.innerHTML = '';
    }
});

// Add product form handler
document.getElementById('addProductForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    try {
        showLoading();
        
        const formData = new FormData(this);
        const file = document.getElementById('productImage').files[0];
        
        let imageUrl = '';
        
        // Upload image if provided
        if (file) {
            const imageRef = storage.ref(`stores/${currentStore}/products/${generateId()}_${file.name}`);
            const snapshot = await imageRef.put(file);
            imageUrl = await snapshot.ref.getDownloadURL();
        }
        
        // Create product data
        const productData = {
            name: document.getElementById('productName').value,
            category: document.getElementById('productCategory').value,
            price: parseFloat(document.getElementById('productPrice').value),
            stock: parseInt(document.getElementById('productStock').value),
            description: document.getElementById('productDescriptionInput').value,
            image: imageUrl,
            status: 'active',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // Save to Firestore
        await db.collection('stores').doc(currentStore).collection('products').add(productData);
        
        closeModal('addProductModal');
        showNotification('تم إضافة المنتج بنجاح!', 'success');
        loadProductsData(); // Reload products
        
    } catch (error) {
        console.error('Error adding product:', error);
        showNotification('حدث خطأ في إضافة المنتج', 'error');
    } finally {
        hideLoading();
    }
});

async function deleteProduct(productId) {
    if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
        return;
    }
    
    try {
        showLoading();
        
        // Get product data to delete image
        const productDoc = await db.collection('stores').doc(currentStore).collection('products').doc(productId).get();
        if (productDoc.exists) {
            const productData = productDoc.data();
            
            // Delete image from storage if exists
            if (productData.image) {
                try {
                    const imageRef = storage.refFromURL(productData.image);
                    await imageRef.delete();
                } catch (error) {
                    console.warn('Could not delete image:', error);
                }
            }
        }
        
        // Delete product document
        await db.collection('stores').doc(currentStore).collection('products').doc(productId).delete();
        
        showNotification('تم حذف المنتج بنجاح', 'success');
        loadProductsData(); // Reload products
        
    } catch (error) {
        console.error('Error deleting product:', error);
        showNotification('حدث خطأ في حذف المنتج', 'error');
    } finally {
        hideLoading();
    }
}

function editProduct(productId) {
    // Find product data
    const product = storeProducts.find(p => p.id === productId);
    if (!product) {
        showNotification('لم يتم العثور على المنتج', 'error');
        return;
    }
    
    // Fill form with product data
    document.getElementById('productName').value = product.name;
    document.getElementById('productCategory').value = product.category;
    document.getElementById('productPrice').value = product.price;
    document.getElementById('productStock').value = product.stock;
    document.getElementById('productDescriptionInput').value = product.description;
    
    // Show image preview if exists
    if (product.image) {
        document.getElementById('imagePreview').innerHTML = `<img src="${product.image}" alt="صورة المنتج">`;
    }
    
    // Change form handler to update instead of add
    const form = document.getElementById('addProductForm');
    form.onsubmit = async function(e) {
        e.preventDefault();
        await updateProduct(productId);
    };
    
    // Change modal title
    document.querySelector('#addProductModal .modal-header h2').textContent = 'تعديل المنتج';
    
    showAddProductModal();
}

async function updateProduct(productId) {
    try {
        showLoading();
        
        const file = document.getElementById('productImage').files[0];
        let imageUrl = '';
        
        // Get current product data
        const currentProduct = storeProducts.find(p => p.id === productId);
        
        // Upload new image if provided
        if (file) {
            const imageRef = storage.ref(`stores/${currentStore}/products/${generateId()}_${file.name}`);
            const snapshot = await imageRef.put(file);
            imageUrl = await snapshot.ref.getDownloadURL();
            
            // Delete old image if exists
            if (currentProduct.image) {
                try {
                    const oldImageRef = storage.refFromURL(currentProduct.image);
                    await oldImageRef.delete();
                } catch (error) {
                    console.warn('Could not delete old image:', error);
                }
            }
        } else {
            imageUrl = currentProduct.image; // Keep existing image
        }
        
        // Update product data
        const productData = {
            name: document.getElementById('productName').value,
            category: document.getElementById('productCategory').value,
            price: parseFloat(document.getElementById('productPrice').value),
            stock: parseInt(document.getElementById('productStock').value),
            description: document.getElementById('productDescriptionInput').value,
            image: imageUrl,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // Update in Firestore
        await db.collection('stores').doc(currentStore).collection('products').doc(productId).update(productData);
        
        closeModal('addProductModal');
        showNotification('تم تحديث المنتج بنجاح!', 'success');
        loadProductsData(); // Reload products
        
        // Reset form handler
        document.getElementById('addProductForm').onsubmit = null;
        document.querySelector('#addProductModal .modal-header h2').textContent = 'إضافة منتج جديد';
        
    } catch (error) {
        console.error('Error updating product:', error);
        showNotification('حدث خطأ في تحديث المنتج', 'error');
    } finally {
        hideLoading();
    }
}

// Order Management Functions
async function updateOrderStatus(orderId, newStatus) {
    try {
        await db.collection('stores').doc(currentStore).collection('orders').doc(orderId).update({
            status: newStatus,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        showNotification('تم تحديث حالة الطلب بنجاح', 'success');
        
        // Update stats
        loadTraderStats();
        
    } catch (error) {
        console.error('Error updating order status:', error);
        showNotification('حدث خطأ في تحديث حالة الطلب', 'error');
    }
}

function viewOrderDetails(orderId) {
    const order = storeOrders.find(o => o.id === orderId);
    if (!order) {
        showNotification('لم يتم العثور على الطلب', 'error');
        return;
    }
    
    // Create order details modal content
    let orderDetailsHTML = `
        <h3>تفاصيل الطلب #${orderId.substring(0, 8)}</h3>
        <div class="order-info">
            <p><strong>الحالة:</strong> ${getOrderStatusText(order.status)}</p>
            <p><strong>التاريخ:</strong> ${formatDate(order.createdAt?.toDate())}</p>
            <p><strong>المجموع:</strong> ${formatPrice(order.total || 0)}</p>
            <p><strong>طريقة الدفع:</strong> ${order.paymentMethod === 'COD' ? 'الدفع عند الاستلام' : 'دفع إلكتروني'}</p>
        </div>
        <h4>المنتجات:</h4>
        <div class="order-items">
    `;
    
    if (order.items && order.items.length > 0) {
        order.items.forEach(item => {
            orderDetailsHTML += `
                <div class="order-item">
                    <span>${item.name || 'منتج'}</span>
                    <span>الكمية: ${item.quantity || 1}</span>
                    <span>${formatPrice(item.price || 0)}</span>
                </div>
            `;
        });
    }
    
    orderDetailsHTML += '</div>';
    
    // Show in a simple alert for now (can be enhanced with a proper modal)
    alert(orderDetailsHTML.replace(/<[^>]*>/g, '\n'));
}

// Coupon Management Functions
function showAddCouponModal() {
    // Implementation for coupon modal (can be enhanced)
    const code = prompt('كود الكوبون:');
    const type = confirm('اضغط موافق للنسبة المئوية، إلغاء للمبلغ الثابت') ? 'percentage' : 'fixed';
    const value = parseFloat(prompt('القيمة:'));
    const maxUses = parseInt(prompt('عدد مرات الاستخدام (اتركه فارغاً للا محدود):') || '0');
    
    if (code && value) {
        addCoupon(code, type, value, maxUses);
    }
}

async function addCoupon(code, type, value, maxUses) {
    try {
        showLoading();
        
        // Check if coupon code already exists
        const existingCoupon = await db.collection('stores').doc(currentStore).collection('coupons')
            .where('code', '==', code)
            .get();
        
        if (!existingCoupon.empty) {
            showNotification('كود الكوبون موجود بالفعل', 'warning');
            return;
        }
        
        const couponData = {
            code: code,
            type: type,
            value: value,
            maxUses: maxUses || null,
            usedCount: 0,
            status: 'active',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        await db.collection('stores').doc(currentStore).collection('coupons').add(couponData);
        
        showNotification('تم إضافة الكوبون بنجاح!', 'success');
        loadCouponsData();
        
    } catch (error) {
        console.error('Error adding coupon:', error);
        showNotification('حدث خطأ في إضافة الكوبون', 'error');
    } finally {
        hideLoading();
    }
}

async function deleteCoupon(couponId) {
    if (!confirm('هل أنت متأكد من حذف هذا الكوبون؟')) {
        return;
    }
    
    try {
        await db.collection('stores').doc(currentStore).collection('coupons').doc(couponId).delete();
        showNotification('تم حذف الكوبون بنجاح', 'success');
        loadCouponsData();
    } catch (error) {
        console.error('Error deleting coupon:', error);
        showNotification('حدث خطأ في حذف الكوبون', 'error');
    }
}

function editCoupon(couponId) {
    showNotification('ميزة تعديل الكوبون قيد التطوير', 'info');
}

// Store Appearance Functions
function saveAppearance() {
    if (!currentStoreData) {
        showNotification('لم يتم تحميل بيانات المتجر', 'error');
        return;
    }
    
    const primaryColor = document.getElementById('primaryColor').value;
    const secondaryColor = document.getElementById('secondaryColor').value;
    const backgroundColor = document.getElementById('backgroundColor').value;
    const fontFamily = document.getElementById('fontFamily').value;
    const selectedTemplate = document.getElementById('templateSelector').value;
    const heroImage = document.getElementById('heroImageUrl').value;
    const enableFlashSale = document.getElementById('enableFlashSale').checked;
    const enableLiveChat = document.getElementById('enableLiveChat').checked;
    const enableReviews = document.getElementById('enableReviews').checked;
    const enableWishlist = document.getElementById('enableWishlist').checked;
    
    const appearanceData = {
        'settings.colors.primary': primaryColor,
        'settings.colors.secondary': secondaryColor,
        'settings.colors.background': backgroundColor,
        'settings.fontFamily': fontFamily,
        'template': selectedTemplate,
        'settings.heroImage': heroImage,
        'settings.features.flashSale': enableFlashSale,
        'settings.features.liveChat': enableLiveChat,
        'settings.features.reviews': enableReviews,
        'settings.features.wishlist': enableWishlist,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    db.collection('stores').doc(currentStore).update(appearanceData)
        .then(() => {
            showNotification('تم حفظ إعدادات المظهر بنجاح!', 'success');
            currentStoreData.settings = {
                ...currentStoreData.settings,
                colors: {
                    ...currentStoreData.settings.colors,
                    primary: primaryColor,
                    secondary: secondaryColor,
                    background: backgroundColor
                },
                fontFamily: fontFamily,
                heroImage: heroImage,
                features: {
                    ...currentStoreData.settings.features,
                    flashSale: enableFlashSale,
                    liveChat: enableLiveChat,
                    reviews: enableReviews,
                    wishlist: enableWishlist
                }
            };
            currentStoreData.template = selectedTemplate;
        })
        .catch(error => {
            console.error('Error saving appearance:', error);
            showNotification('حدث خطأ في حفظ الإعدادات', 'error');
        });
}

// Handle logo upload
document.getElementById('logoUpload').addEventListener('change', async function(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
        showLoading();
        
        const logoRef = storage.ref(`stores/${currentStore}/logo_${generateId()}_${file.name}`);
        const snapshot = await logoRef.put(file);
        const logoUrl = await snapshot.ref.getDownloadURL();
        
        // Update store logo
        await db.collection('stores').doc(currentStore).update({
            'settings.logo': logoUrl,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Show preview
        document.getElementById('logoPreview').innerHTML = `<img src="${logoUrl}" alt="شعار المتجر">`;
        
        showNotification('تم رفع الشعار بنجاح!', 'success');
        
    } catch (error) {
        console.error('Error uploading logo:', error);
        showNotification('حدث خطأ في رفع الشعار', 'error');
    } finally {
        hideLoading();
    }
});

// Store Preview Function
function previewStore() {
    const storeUrl = `${window.location.origin}/store.html?id=${currentStore}`;
    window.open(storeUrl, '_blank');
}

// Helper Functions
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

function getOrderStatusClass(status) {
    const classMap = {
        'pending': 'pending',
        'processing': 'warning',
        'shipped': 'info',
        'delivered': 'active',
        'cancelled': 'inactive'
    };
    return classMap[status] || 'pending';
}

// Initialize appearance settings when loading the appearance tab
function loadAppearanceSettings() {
    if (currentStoreData && currentStoreData.settings) {
        const settings = currentStoreData.settings;
        
        if (settings.colors) {
            document.getElementById('primaryColor').value = settings.colors.primary || '#1E40AF';
            document.getElementById('secondaryColor').value = settings.colors.secondary || '#0891B2';
            document.getElementById('backgroundColor').value = settings.colors.background || '#F8FAFC';
        }
        
        if (settings.fontFamily) {
            document.getElementById('fontFamily').value = settings.fontFamily;
        }
        
        if (settings.heroImage) {
            document.getElementById('heroImageUrl').value = settings.heroImage;
        }
        
        // Load feature toggles
        if (settings.features) {
            const features = settings.features;
            document.getElementById('enableFlashSale').checked = features.flashSale || false;
            document.getElementById('enableLiveChat').checked = features.liveChat || false;
            document.getElementById('enableReviews').checked = features.reviews || false;
            document.getElementById('enableWishlist').checked = features.wishlist || false;
        }
        
        if (settings.logo) {
            document.getElementById('logoPreview').innerHTML = `<img src="${settings.logo}" alt="شعار المتجر">`;
        }
    }
    
    // Load template selector
    if (currentStoreData && currentStoreData.template) {
        const templateSelector = document.getElementById('templateSelector');
        if (templateSelector) {
            templateSelector.value = currentStoreData.template;
        }
    }
}

// Order status filter
document.getElementById('orderStatusFilter').addEventListener('change', function() {
    const selectedStatus = this.value;
    filterOrdersByStatus(selectedStatus);
});

function filterOrdersByStatus(status) {
    const rows = document.querySelectorAll('#ordersTable tr');
    rows.forEach(row => {
        if (status === '') {
            row.style.display = '';
        } else {
            const statusElement = row.querySelector('.status-badge');
            if (statusElement) {
                const rowStatus = statusElement.className.includes('status-' + getOrderStatusClass(status));
                row.style.display = rowStatus ? '' : 'none';
            }
        }
    });
}

// Store settings form handler
function saveStoreSettings() {
    const storeName = document.getElementById('settingsStoreName').value;
    const storeDescription = document.getElementById('storeDescription').value;
    const storePhone = document.getElementById('storePhone').value;
    const storeAddress = document.getElementById('storeAddress').value;
    const storeEmail = document.getElementById('storeEmail').value;
    const storeWebsite = document.getElementById('storeWebsite').value;
    const shippingFee = parseFloat(document.getElementById('shippingFee').value) || 0;
    const freeShippingThreshold = parseFloat(document.getElementById('freeShippingThreshold').value) || 0;
    const expressShippingFee = parseFloat(document.getElementById('expressShippingFee').value) || 0;
    const codEnabled = document.getElementById('codEnabled').checked;
    const onlinePaymentEnabled = document.getElementById('onlinePaymentEnabled').checked;
    const installmentEnabled = document.getElementById('installmentEnabled').checked;
    const taxEnabled = document.getElementById('taxEnabled').checked;
    const taxRate = parseFloat(document.getElementById('taxRate').value) || 0;
    
    const settingsData = {
        name: storeName,
        'settings.description': storeDescription,
        'settings.phone': storePhone,
        'settings.address': storeAddress,
        'settings.email': storeEmail,
        'settings.website': storeWebsite,
        'settings.shippingFee': shippingFee,
        'settings.freeShippingThreshold': freeShippingThreshold,
        'settings.expressShippingFee': expressShippingFee,
        'settings.codEnabled': codEnabled,
        'settings.onlinePaymentEnabled': onlinePaymentEnabled,
        'settings.installmentEnabled': installmentEnabled,
        'settings.taxEnabled': taxEnabled,
        'settings.taxRate': taxRate,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    db.collection('stores').doc(currentStore).update(settingsData)
        .then(() => {
            showNotification('تم حفظ إعدادات المتجر بنجاح!', 'success');
            // Update current store data
            currentStoreData.name = storeName;
            currentStoreData.settings = {
                ...currentStoreData.settings,
                description: storeDescription,
                phone: storePhone,
                address: storeAddress,
                email: storeEmail,
                website: storeWebsite,
                shippingFee: shippingFee,
                freeShippingThreshold: freeShippingThreshold,
                expressShippingFee: expressShippingFee,
                codEnabled: codEnabled,
                onlinePaymentEnabled: onlinePaymentEnabled,
                installmentEnabled: installmentEnabled,
                taxEnabled: taxEnabled,
                taxRate: taxRate
            };
        })
        .catch(error => {
            console.error('Error saving store settings:', error);
            showNotification('حدث خطأ في حفظ الإعدادات', 'error');
        });
}

// Load store settings when tab is opened
function loadStoreSettings() {
    if (currentStoreData) {
        document.getElementById('settingsStoreName').value = currentStoreData.name || '';
        
        if (currentStoreData.settings) {
            const settings = currentStoreData.settings;
            document.getElementById('storeDescription').value = settings.description || '';
            document.getElementById('storePhone').value = settings.phone || '';
            document.getElementById('storeAddress').value = settings.address || '';
            document.getElementById('storeEmail').value = settings.email || '';
            document.getElementById('storeWebsite').value = settings.website || '';
            document.getElementById('shippingFee').value = settings.shippingFee || 0;
            document.getElementById('freeShippingThreshold').value = settings.freeShippingThreshold || 200;
            document.getElementById('expressShippingFee').value = settings.expressShippingFee || 30;
            document.getElementById('codEnabled').checked = settings.codEnabled !== false;
            document.getElementById('onlinePaymentEnabled').checked = settings.onlinePaymentEnabled || false;
            document.getElementById('installmentEnabled').checked = settings.installmentEnabled || false;
            document.getElementById('taxEnabled').checked = settings.taxEnabled || false;
            document.getElementById('taxRate').value = settings.taxRate || 15;
        }
    }
}

// Advanced Product Management
async function addProductWithVariants() {
    const productData = {
        name: document.getElementById('productName').value,
        category: document.getElementById('productCategory').value,
        price: parseFloat(document.getElementById('productPrice').value),
        originalPrice: parseFloat(document.getElementById('productOriginalPrice').value) || null,
        stock: parseInt(document.getElementById('productStock').value),
        description: document.getElementById('productDescriptionInput').value,
        shortDescription: document.getElementById('productShortDescription').value,
        tags: document.getElementById('productTags').value.split(',').map(tag => tag.trim()).filter(Boolean),
        status: 'active',
        featured: document.getElementById('productFeatured').checked,
        isNew: document.getElementById('productIsNew').checked,
        onSale: document.getElementById('productOnSale').checked,
        specifications: {},
        options: {
            sizes: [],
            colors: []
        },
        seoTitle: document.getElementById('productSeoTitle').value,
        seoDescription: document.getElementById('productSeoDescription').value,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    // Handle product specifications
    const specInputs = document.querySelectorAll('.spec-input');
    specInputs.forEach(input => {
        const key = input.dataset.specKey;
        const value = input.value.trim();
        if (key && value) {
            productData.specifications[key] = value;
        }
    });
    
    // Handle product variants (sizes, colors)
    const sizeInputs = document.querySelectorAll('.size-input:checked');
    sizeInputs.forEach(input => {
        productData.options.sizes.push(input.value);
    });
    
    const colorInputs = document.querySelectorAll('.color-input:checked');
    colorInputs.forEach(input => {
        productData.options.colors.push(input.value);
    });
    
    return productData;
}

// Store Analytics Functions
async function loadStoreAnalytics() {
    try {
        showLoading('جاري تحميل التحليلات...');
        
        // Load sales analytics
        const salesData = await calculateSalesAnalytics();
        updateSalesCharts(salesData);
        
        // Load product performance
        const productPerformance = await calculateProductPerformance();
        updateProductPerformanceChart(productPerformance);
        
        // Load customer analytics
        const customerData = await calculateCustomerAnalytics();
        updateCustomerCharts(customerData);
        
    } catch (error) {
        console.error('Error loading analytics:', error);
        showNotification('حدث خطأ في تحميل التحليلات', 'error');
    } finally {
        hideLoading();
    }
}

async function calculateSalesAnalytics() {
    // Sample analytics data (in real app, this would be calculated from orders)
    const last30Days = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        // Generate sample sales data
        const sales = Math.floor(Math.random() * 1000) + 100;
        const orders = Math.floor(Math.random() * 20) + 1;
        
        last30Days.push({
            date: date.toISOString().split('T')[0],
            sales: sales,
            orders: orders
        });
    }
    
    return {
        daily: last30Days,
        totalSales: last30Days.reduce((sum, day) => sum + day.sales, 0),
        totalOrders: last30Days.reduce((sum, day) => sum + day.orders, 0),
        averageOrderValue: last30Days.reduce((sum, day) => sum + day.sales, 0) / last30Days.reduce((sum, day) => sum + day.orders, 0)
    };
}

async function calculateProductPerformance() {
    // Calculate which products are performing best
    const productPerformance = storeProducts.map(product => ({
        id: product.id,
        name: product.name,
        sales: Math.floor(Math.random() * 100) + 10, // Sample data
        revenue: (Math.floor(Math.random() * 100) + 10) * product.price,
        views: Math.floor(Math.random() * 1000) + 50
    }));
    
    return productPerformance.sort((a, b) => b.revenue - a.revenue);
}

async function calculateCustomerAnalytics() {
    // Sample customer analytics
    return {
        newCustomers: Math.floor(Math.random() * 50) + 10,
        returningCustomers: Math.floor(Math.random() * 100) + 20,
        customerRetentionRate: Math.floor(Math.random() * 30) + 60,
        averageOrdersPerCustomer: Math.floor(Math.random() * 5) + 2
    };
}

function updateSalesCharts(salesData) {
    // Update sales chart (using simple canvas drawing)
    const canvas = document.getElementById('salesChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw sales chart
    const maxSales = Math.max(...salesData.daily.map(day => day.sales));
    const barWidth = width / salesData.daily.length;
    
    ctx.fillStyle = '#1E40AF';
    
    salesData.daily.forEach((day, index) => {
        const barHeight = (day.sales / maxSales) * height * 0.8;
        const x = index * barWidth;
        const y = height - barHeight;
        
        ctx.fillRect(x + 2, y, barWidth - 4, barHeight);
    });
    
    // Update analytics summary
    document.getElementById('totalSalesAmount').textContent = formatPrice(salesData.totalSales);
    document.getElementById('totalOrdersCount').textContent = salesData.totalOrders;
    document.getElementById('averageOrderValue').textContent = formatPrice(salesData.averageOrderValue);
}

function updateProductPerformanceChart(productPerformance) {
    const performanceList = document.getElementById('productPerformanceList');
    if (!performanceList) return;
    
    performanceList.innerHTML = '';
    
    productPerformance.slice(0, 10).forEach((product, index) => {
        const item = document.createElement('div');
        item.className = 'performance-item';
        item.innerHTML = `
            <div class="performance-rank">${index + 1}</div>
            <div class="performance-product">
                <div class="product-name">${product.name}</div>
                <div class="product-stats">
                    <span>المبيعات: ${product.sales}</span>
                    <span>الإيرادات: ${formatPrice(product.revenue)}</span>
                    <span>المشاهدات: ${product.views}</span>
                </div>
            </div>
        `;
        performanceList.appendChild(item);
    });
}

function updateCustomerCharts(customerData) {
    // Update customer analytics display
    document.getElementById('newCustomersCount').textContent = customerData.newCustomers;
    document.getElementById('returningCustomersCount').textContent = customerData.returningCustomers;
    document.getElementById('retentionRate').textContent = customerData.customerRetentionRate + '%';
    document.getElementById('avgOrdersPerCustomer').textContent = customerData.averageOrdersPerCustomer;
}

// Advanced Coupon Management
function showAdvancedCouponModal() {
    const modalHTML = `
        <div class="modal active" id="advancedCouponModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>إنشاء كوبون متقدم</h2>
                    <button class="close" onclick="closeModal('advancedCouponModal')">&times;</button>
                </div>
                <form id="advancedCouponForm" class="coupon-form">
                    <div class="form-row">
                        <div class="form-group">
                            <label>كود الكوبون</label>
                            <input type="text" id="couponCode" required>
                        </div>
                        <div class="form-group">
                            <label>نوع الخصم</label>
                            <select id="couponType" required>
                                <option value="percentage">نسبة مئوية</option>
                                <option value="fixed">مبلغ ثابت</option>
                                <option value="free_shipping">شحن مجاني</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>قيمة الخصم</label>
                            <input type="number" id="couponValue" min="0" required>
                        </div>
                        <div class="form-group">
                            <label>الحد الأدنى للطلب</label>
                            <input type="number" id="couponMinAmount" min="0">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>عدد مرات الاستخدام</label>
                            <input type="number" id="couponMaxUses" min="1">
                        </div>
                        <div class="form-group">
                            <label>تاريخ الانتهاء</label>
                            <input type="datetime-local" id="couponExpiryDate">
                        </div>
                    </div>
                    <div class="form-group">
                        <label>المنتجات المشمولة</label>
                        <select id="couponProducts" multiple>
                            <!-- Products will be loaded here -->
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="checkbox">
                            <input type="checkbox" id="couponFirstTimeOnly">
                            <span>للعملاء الجدد فقط</span>
                        </label>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn btn-outline" onclick="closeModal('advancedCouponModal')">إلغاء</button>
                        <button type="submit" class="btn btn-primary">إنشاء الكوبون</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Load products for coupon selection
    const productsSelect = document.getElementById('couponProducts');
    storeProducts.forEach(product => {
        const option = document.createElement('option');
        option.value = product.id;
        option.textContent = product.name;
        productsSelect.appendChild(option);
    });
    
    // Handle form submission
    document.getElementById('advancedCouponForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        await createAdvancedCoupon();
    });
}

async function createAdvancedCoupon() {
    try {
        showLoading('جاري إنشاء الكوبون...');
        
        const couponData = {
            code: document.getElementById('couponCode').value.toUpperCase(),
            type: document.getElementById('couponType').value,
            value: parseFloat(document.getElementById('couponValue').value),
            minAmount: parseFloat(document.getElementById('couponMinAmount').value) || 0,
            maxUses: parseInt(document.getElementById('couponMaxUses').value) || null,
            expiryDate: document.getElementById('couponExpiryDate').value ? 
                firebase.firestore.Timestamp.fromDate(new Date(document.getElementById('couponExpiryDate').value)) : null,
            applicableProducts: Array.from(document.getElementById('couponProducts').selectedOptions).map(option => option.value),
            firstTimeOnly: document.getElementById('couponFirstTimeOnly').checked,
            usedCount: 0,
            status: 'active',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // Check if coupon code already exists
        const existingCoupon = await db.collection('stores').doc(currentStore).collection('coupons')
            .where('code', '==', couponData.code)
            .get();
        
        if (!existingCoupon.empty) {
            showNotification('كود الكوبون موجود بالفعل', 'warning');
            return;
        }
        
        await db.collection('stores').doc(currentStore).collection('coupons').add(couponData);
        
        closeModal('advancedCouponModal');
        document.getElementById('advancedCouponModal').remove();
        showNotification('تم إنشاء الكوبون بنجاح!', 'success');
        loadCouponsData();
        
    } catch (error) {
        console.error('Error creating advanced coupon:', error);
        showNotification('حدث خطأ في إنشاء الكوبون', 'error');
    } finally {
        hideLoading();
    }
}

// Store Theme Management
function applyStoreTheme(templateId) {
    const template = storeTemplates.find(t => t.id === templateId);
    if (!template) return;
    
    // Apply template colors
    if (template.colors) {
        document.getElementById('primaryColor').value = template.colors.primary;
        document.getElementById('secondaryColor').value = template.colors.secondary;
        document.getElementById('backgroundColor').value = template.colors.background;
        
        // Apply colors to preview
        document.documentElement.style.setProperty('--store-primary', template.colors.primary);
        document.documentElement.style.setProperty('--store-secondary', template.colors.secondary);
        document.documentElement.style.setProperty('--store-light', template.colors.background);
    }
    
    // Apply template features
    if (template.features) {
        template.features.forEach(feature => {
            const featureCheckbox = document.getElementById(`enable${feature.charAt(0).toUpperCase() + feature.slice(1)}`);
            if (featureCheckbox) {
                featureCheckbox.checked = true;
            }
        });
    }
    
    showNotification(`تم تطبيق قالب ${template.name}`, 'success');
}

// SEO Management
function updateStoreSEO() {
    const seoData = {
        'settings.seo.title': document.getElementById('seoTitle').value,
        'settings.seo.description': document.getElementById('seoDescription').value,
        'settings.seo.keywords': document.getElementById('seoKeywords').value,
        'settings.seo.ogImage': document.getElementById('seoOgImage').value,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    db.collection('stores').doc(currentStore).update(seoData)
        .then(() => {
            showNotification('تم تحديث إعدادات SEO بنجاح!', 'success');
        })
        .catch(error => {
            console.error('Error updating SEO:', error);
            showNotification('حدث خطأ في تحديث إعدادات SEO', 'error');
        });
}

// Override loadTabData function for trader-specific tabs
const originalLoadTabData = window.loadTabData;
window.loadTabData = function(tabId) {
    // Call original function for common tabs
    if (originalLoadTabData) {
        originalLoadTabData(tabId);
    }
    
    // Handle trader-specific tabs
    switch(tabId) {
        case 'appearance':
            loadAppearanceSettings();
            break;
        case 'store-settings':
            loadStoreSettings();
            break;
        case 'analytics':
            loadStoreAnalytics();
            break;
    }
};

// Make functions globally available
window.loadTraderDashboardData = loadTraderDashboardData;
window.loadProductsData = loadProductsData;
window.loadOrdersData = loadOrdersData;
window.loadCustomersData = loadCustomersData;
window.loadCouponsData = loadCouponsData;
window.showAddProductModal = showAddProductModal;
window.deleteProduct = deleteProduct;
window.editProduct = editProduct;
window.updateOrderStatus = updateOrderStatus;
window.viewOrderDetails = viewOrderDetails;
window.showAddCouponModal = showAddCouponModal;
window.deleteCoupon = deleteCoupon;
window.editCoupon = editCoupon;
window.saveAppearance = saveAppearance;
window.previewStore = previewStore;
window.saveStoreSettings = saveStoreSettings;
window.loadStoreTemplates = loadStoreTemplates;
window.applyStoreTheme = applyStoreTheme;
window.showAdvancedCouponModal = showAdvancedCouponModal;
window.createAdvancedCoupon = createAdvancedCoupon;
window.loadStoreAnalytics = loadStoreAnalytics;
window.updateStoreSEO = updateStoreSEO;