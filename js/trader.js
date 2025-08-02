// Trader Dashboard Functions - Complete Implementation

let currentTraderStore = null;
let traderProducts = [];
let traderOrders = [];
let traderCustomers = [];
let traderCoupons = [];

// Load Trader Dashboard Data
async function loadTraderDashboardData() {
    if (!currentUser || !currentStore) {
        showNotification('خطأ في تحميل بيانات التاجر', 'error');
        return;
    }
    
    try {
        showLoading('جاري تحميل بيانات المتجر...');
        
        // Load store data
        await loadTraderStoreData();
        
        // Load dashboard statistics
        await loadTraderStats();
        
        // Load recent orders
        await loadRecentOrders();
        
    } catch (error) {
        console.error('Error loading trader dashboard:', error);
        showNotification('حدث خطأ في تحميل البيانات', 'error');
    } finally {
        hideLoading();
    }
}

async function loadTraderStoreData() {
    try {
        const storeDoc = await db.collection('stores').doc(currentStore).get();
        if (storeDoc.exists) {
            currentTraderStore = { id: currentStore, ...storeDoc.data() };
            
            // Update store name in header
            const storeNameEl = document.getElementById('traderStoreName');
            if (storeNameEl) {
                storeNameEl.textContent = currentTraderStore.name;
            }
        }
    } catch (error) {
        console.error('Error loading trader store data:', error);
    }
}

async function loadTraderStats() {
    try {
        // Load products count
        const productsSnapshot = await db.collection('stores')
            .doc(currentStore)
            .collection('products')
            .get();
        
        const totalProducts = productsSnapshot.size;
        const activeProducts = productsSnapshot.docs.filter(doc => 
            doc.data().status === 'active'
        ).length;
        
        // Load orders count and revenue
        const ordersSnapshot = await db.collection('stores')
            .doc(currentStore)
            .collection('orders')
            .get();
        
        const totalOrders = ordersSnapshot.size;
        let totalRevenue = 0;
        let pendingOrders = 0;
        
        ordersSnapshot.docs.forEach(doc => {
            const order = doc.data();
            if (order.total) {
                totalRevenue += order.total;
            }
            if (order.status === 'pending') {
                pendingOrders++;
            }
        });
        
        // Load customers count
        const customersSnapshot = await db.collection('stores')
            .doc(currentStore)
            .collection('customers')
            .get();
        
        const totalCustomers = customersSnapshot.size;
        
        // Update dashboard stats
        updateDashboardStats({
            totalProducts,
            activeProducts,
            totalOrders,
            pendingOrders,
            totalRevenue,
            totalCustomers
        });
        
    } catch (error) {
        console.error('Error loading trader stats:', error);
    }
}

function updateDashboardStats(stats) {
    const elements = {
        totalProducts: document.getElementById('totalProducts'),
        activeProducts: document.getElementById('activeProducts'),
        totalOrders: document.getElementById('totalOrders'),
        pendingOrders: document.getElementById('pendingOrders'),
        totalRevenue: document.getElementById('totalRevenue'),
        totalCustomers: document.getElementById('totalCustomers')
    };
    
    if (elements.totalProducts) elements.totalProducts.textContent = stats.totalProducts;
    if (elements.activeProducts) elements.activeProducts.textContent = stats.activeProducts;
    if (elements.totalOrders) elements.totalOrders.textContent = stats.totalOrders;
    if (elements.pendingOrders) elements.pendingOrders.textContent = stats.pendingOrders;
    if (elements.totalRevenue) elements.totalRevenue.textContent = formatPrice(stats.totalRevenue);
    if (elements.totalCustomers) elements.totalCustomers.textContent = stats.totalCustomers;
}

async function loadRecentOrders() {
    try {
        const ordersSnapshot = await db.collection('stores')
            .doc(currentStore)
            .collection('orders')
            .orderBy('createdAt', 'desc')
            .limit(5)
            .get();
        
        const recentOrdersList = document.getElementById('recentOrdersList');
        if (!recentOrdersList) return;
        
        if (ordersSnapshot.empty) {
            recentOrdersList.innerHTML = '<p class="text-center">لا توجد طلبات حديثة</p>';
            return;
        }
        
        recentOrdersList.innerHTML = ordersSnapshot.docs.map(doc => {
            const order = { id: doc.id, ...doc.data() };
            return `
                <div class="recent-order-item">
                    <div class="order-info">
                        <strong>#${order.id.substring(0, 8)}</strong>
                        <span>${order.customerName}</span>
                    </div>
                    <div class="order-details">
                        <span class="status-badge status-${order.status}">${getOrderStatusText(order.status)}</span>
                        <strong>${formatPrice(order.total)}</strong>
                    </div>
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Error loading recent orders:', error);
    }
}

// Products Management
async function loadProductsData() {
    try {
        showLoading('جاري تحميل المنتجات...');
        
        const productsSnapshot = await db.collection('stores')
            .doc(currentStore)
            .collection('products')
            .orderBy('createdAt', 'desc')
            .get();
        
        traderProducts = productsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        renderProductsTable();
        
    } catch (error) {
        console.error('Error loading products:', error);
        showNotification('حدث خطأ في تحميل المنتجات', 'error');
    } finally {
        hideLoading();
    }
}

function renderProductsTable() {
    const productsTable = document.getElementById('productsTable');
    if (!productsTable) return;
    
    productsTable.innerHTML = '';
    
    if (traderProducts.length === 0) {
        productsTable.innerHTML = `
            <tr>
                <td colspan="7" class="text-center">لا توجد منتجات</td>
            </tr>
        `;
        return;
    }
    
    traderProducts.forEach(product => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div class="product-cell">
                    ${product.image ? 
                        `<img src="${product.image}" alt="${product.name}" class="product-thumb">` : 
                        '<div class="no-image-thumb">📷</div>'
                    }
                    <span>${product.name}</span>
                </div>
            </td>
            <td>${product.category}</td>
            <td>${formatPrice(product.price)}</td>
            <td>${product.stock}</td>
            <td><span class="status-badge status-${product.status}">${product.status === 'active' ? 'نشط' : 'غير نشط'}</span></td>
            <td>${formatDate(product.createdAt?.toDate())}</td>
            <td>
                <button class="btn btn-outline btn-sm" onclick="editProduct('${product.id}')">تعديل</button>
                <button class="btn btn-danger btn-sm" onclick="deleteProduct('${product.id}')">حذف</button>
                <button class="btn btn-outline btn-sm" onclick="toggleProductStatus('${product.id}', '${product.status}')">
                    ${product.status === 'active' ? 'إخفاء' : 'إظهار'}
                </button>
            </td>
        `;
        productsTable.appendChild(row);
    });
}

function showAddProductModal() {
    const modal = document.getElementById('productModal');
    if (!modal) return;
    
    modal.innerHTML = `
        <div class="modal-content large">
            <div class="modal-header">
                <h2>إضافة منتج جديد</h2>
                <button class="close">&times;</button>
            </div>
            <form id="productForm" class="product-form">
                <div class="form-section">
                    <h3>معلومات أساسية</h3>
                    <div class="form-row">
                        <div class="form-group">
                            <label>اسم المنتج *</label>
                            <input type="text" id="productName" required>
                        </div>
                        <div class="form-group">
                            <label>الفئة *</label>
                            <input type="text" id="productCategory" required>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>وصف المنتج</label>
                        <textarea id="productDescription" rows="4"></textarea>
                    </div>
                </div>
                
                <div class="form-section">
                    <h3>السعر والمخزون</h3>
                    <div class="form-row">
                        <div class="form-group">
                            <label>السعر *</label>
                            <input type="number" id="productPrice" min="0" step="0.01" required>
                        </div>
                        <div class="form-group">
                            <label>السعر الأصلي (اختياري)</label>
                            <input type="number" id="productOriginalPrice" min="0" step="0.01">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>الكمية المتوفرة *</label>
                            <input type="number" id="productStock" min="0" required>
                        </div>
                        <div class="form-group">
                            <label>الحالة</label>
                            <select id="productStatus">
                                <option value="active">نشط</option>
                                <option value="inactive">غير نشط</option>
                            </select>
                        </div>
                    </div>
                </div>
                
                <div class="form-section">
                    <h3>صورة المنتج</h3>
                    <div class="form-group">
                        <label>رفع صورة</label>
                        <input type="file" id="productImage" accept="image/*">
                        <div class="image-preview" id="imagePreview"></div>
                    </div>
                </div>
                
                <div class="form-actions">
                    <button type="button" class="btn btn-outline" onclick="closeModal('productModal')">إلغاء</button>
                    <button type="submit" class="btn btn-primary">إضافة المنتج</button>
                </div>
            </form>
        </div>
    `;
    
    modal.classList.add('active');
    setupProductForm();
}

function setupProductForm() {
    const form = document.getElementById('productForm');
    const imageInput = document.getElementById('productImage');
    const imagePreview = document.getElementById('imagePreview');
    
    // Image preview
    imageInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            handleImageUpload(file, (imageUrl) => {
                if (imageUrl) {
                    imagePreview.innerHTML = `<img src="${imageUrl}" alt="معاينة الصورة">`;
                }
            });
        }
    });
    
    // Form submission
    form.addEventListener('submit', handleProductSubmit);
}

async function handleProductSubmit(e) {
    e.preventDefault();
    
    try {
        showLoading('جاري إضافة المنتج...');
        
        const formData = {
            name: document.getElementById('productName').value,
            category: document.getElementById('productCategory').value,
            description: document.getElementById('productDescription').value,
            price: parseFloat(document.getElementById('productPrice').value),
            originalPrice: parseFloat(document.getElementById('productOriginalPrice').value) || null,
            stock: parseInt(document.getElementById('productStock').value),
            status: document.getElementById('productStatus').value,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // Handle image upload
        const imageFile = document.getElementById('productImage').files[0];
        if (imageFile) {
            const imageUrl = await uploadProductImage(imageFile);
            formData.image = imageUrl;
        }
        
        // Add product to database
        await db.collection('stores')
            .doc(currentStore)
            .collection('products')
            .add(formData);
        
        closeModal('productModal');
        showNotification('تم إضافة المنتج بنجاح', 'success');
        loadProductsData();
        
    } catch (error) {
        console.error('Error adding product:', error);
        showNotification('حدث خطأ في إضافة المنتج', 'error');
    } finally {
        hideLoading();
    }
}

async function uploadProductImage(file) {
    try {
        const fileName = `products/${currentStore}/${Date.now()}_${file.name}`;
        const storageRef = storage.ref().child(fileName);
        const snapshot = await storageRef.put(file);
        return await snapshot.ref.getDownloadURL();
    } catch (error) {
        console.error('Error uploading image:', error);
        throw error;
    }
}

async function editProduct(productId) {
    const product = traderProducts.find(p => p.id === productId);
    if (!product) return;
    
    const modal = document.getElementById('productModal');
    if (!modal) return;
    
    modal.innerHTML = `
        <div class="modal-content large">
            <div class="modal-header">
                <h2>تعديل المنتج</h2>
                <button class="close">&times;</button>
            </div>
            <form id="editProductForm" class="product-form">
                <div class="form-section">
                    <h3>معلومات أساسية</h3>
                    <div class="form-row">
                        <div class="form-group">
                            <label>اسم المنتج *</label>
                            <input type="text" id="editProductName" value="${product.name}" required>
                        </div>
                        <div class="form-group">
                            <label>الفئة *</label>
                            <input type="text" id="editProductCategory" value="${product.category}" required>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>وصف المنتج</label>
                        <textarea id="editProductDescription" rows="4">${product.description || ''}</textarea>
                    </div>
                </div>
                
                <div class="form-section">
                    <h3>السعر والمخزون</h3>
                    <div class="form-row">
                        <div class="form-group">
                            <label>السعر *</label>
                            <input type="number" id="editProductPrice" value="${product.price}" min="0" step="0.01" required>
                        </div>
                        <div class="form-group">
                            <label>السعر الأصلي (اختياري)</label>
                            <input type="number" id="editProductOriginalPrice" value="${product.originalPrice || ''}" min="0" step="0.01">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>الكمية المتوفرة *</label>
                            <input type="number" id="editProductStock" value="${product.stock}" min="0" required>
                        </div>
                        <div class="form-group">
                            <label>الحالة</label>
                            <select id="editProductStatus">
                                <option value="active" ${product.status === 'active' ? 'selected' : ''}>نشط</option>
                                <option value="inactive" ${product.status === 'inactive' ? 'selected' : ''}>غير نشط</option>
                            </select>
                        </div>
                    </div>
                </div>
                
                <div class="form-section">
                    <h3>صورة المنتج</h3>
                    <div class="form-group">
                        <label>رفع صورة جديدة (اختياري)</label>
                        <input type="file" id="editProductImage" accept="image/*">
                        <div class="image-preview" id="editImagePreview">
                            ${product.image ? `<img src="${product.image}" alt="الصورة الحالية">` : ''}
                        </div>
                    </div>
                </div>
                
                <div class="form-actions">
                    <button type="button" class="btn btn-outline" onclick="closeModal('productModal')">إلغاء</button>
                    <button type="submit" class="btn btn-primary">حفظ التغييرات</button>
                </div>
            </form>
        </div>
    `;
    
    modal.classList.add('active');
    
    // Setup form
    const form = document.getElementById('editProductForm');
    const imageInput = document.getElementById('editProductImage');
    const imagePreview = document.getElementById('editImagePreview');
    
    imageInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            handleImageUpload(file, (imageUrl) => {
                if (imageUrl) {
                    imagePreview.innerHTML = `<img src="${imageUrl}" alt="معاينة الصورة">`;
                }
            });
        }
    });
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        try {
            showLoading('جاري حفظ التغييرات...');
            
            const updateData = {
                name: document.getElementById('editProductName').value,
                category: document.getElementById('editProductCategory').value,
                description: document.getElementById('editProductDescription').value,
                price: parseFloat(document.getElementById('editProductPrice').value),
                originalPrice: parseFloat(document.getElementById('editProductOriginalPrice').value) || null,
                stock: parseInt(document.getElementById('editProductStock').value),
                status: document.getElementById('editProductStatus').value,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            // Handle image upload
            const imageFile = document.getElementById('editProductImage').files[0];
            if (imageFile) {
                const imageUrl = await uploadProductImage(imageFile);
                updateData.image = imageUrl;
            }
            
            // Update product in database
            await db.collection('stores')
                .doc(currentStore)
                .collection('products')
                .doc(productId)
                .update(updateData);
            
            closeModal('productModal');
            showNotification('تم تحديث المنتج بنجاح', 'success');
            loadProductsData();
            
        } catch (error) {
            console.error('Error updating product:', error);
            showNotification('حدث خطأ في تحديث المنتج', 'error');
        } finally {
            hideLoading();
        }
    });
}

async function deleteProduct(productId) {
    if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) return;
    
    try {
        showLoading('جاري حذف المنتج...');
        
        await db.collection('stores')
            .doc(currentStore)
            .collection('products')
            .doc(productId)
            .delete();
        
        showNotification('تم حذف المنتج بنجاح', 'success');
        loadProductsData();
        
    } catch (error) {
        console.error('Error deleting product:', error);
        showNotification('حدث خطأ في حذف المنتج', 'error');
    } finally {
        hideLoading();
    }
}

async function toggleProductStatus(productId, currentStatus) {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    
    try {
        await db.collection('stores')
            .doc(currentStore)
            .collection('products')
            .doc(productId)
            .update({ status: newStatus });
        
        showNotification(`تم ${newStatus === 'active' ? 'تفعيل' : 'إخفاء'} المنتج`, 'success');
        loadProductsData();
        
    } catch (error) {
        console.error('Error toggling product status:', error);
        showNotification('حدث خطأ في تغيير حالة المنتج', 'error');
    }
}

// Orders Management
async function loadOrdersData() {
    try {
        showLoading('جاري تحميل الطلبات...');
        
        const ordersSnapshot = await db.collection('stores')
            .doc(currentStore)
            .collection('orders')
            .orderBy('createdAt', 'desc')
            .get();
        
        traderOrders = ordersSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        renderOrdersTable();
        
    } catch (error) {
        console.error('Error loading orders:', error);
        showNotification('حدث خطأ في تحميل الطلبات', 'error');
    } finally {
        hideLoading();
    }
}

function renderOrdersTable() {
    const ordersTable = document.getElementById('ordersTable');
    if (!ordersTable) return;
    
    ordersTable.innerHTML = '';
    
    if (traderOrders.length === 0) {
        ordersTable.innerHTML = `
            <tr>
                <td colspan="6" class="text-center">لا توجد طلبات</td>
            </tr>
        `;
        return;
    }
    
    traderOrders.forEach(order => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>#${order.id.substring(0, 8)}</td>
            <td>${order.customerName}</td>
            <td>${order.items.length} منتج</td>
            <td>${formatPrice(order.total)}</td>
            <td><span class="status-badge status-${order.status}">${getOrderStatusText(order.status)}</span></td>
            <td>${formatDate(order.createdAt?.toDate())}</td>
            <td>
                <button class="btn btn-outline btn-sm" onclick="viewOrderDetails('${order.id}')">عرض</button>
                <select onchange="updateOrderStatus('${order.id}', this.value)" class="status-select">
                    <option value="">تغيير الحالة</option>
                    <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>قيد المراجعة</option>
                    <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>قيد التجهيز</option>
                    <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>تم الشحن</option>
                    <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>تم التسليم</option>
                    <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>ملغي</option>
                </select>
            </td>
        `;
        ordersTable.appendChild(row);
    });
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

async function updateOrderStatus(orderId, newStatus) {
    if (!newStatus) return;
    
    try {
        await db.collection('stores')
            .doc(currentStore)
            .collection('orders')
            .doc(orderId)
            .update({ 
                status: newStatus,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        
        showNotification('تم تحديث حالة الطلب', 'success');
        loadOrdersData();
        
    } catch (error) {
        console.error('Error updating order status:', error);
        showNotification('حدث خطأ في تحديث حالة الطلب', 'error');
    }
}

function viewOrderDetails(orderId) {
    const order = traderOrders.find(o => o.id === orderId);
    if (!order) return;
    
    const modal = document.getElementById('orderDetailsModal');
    if (!modal) {
        const orderModal = document.createElement('div');
        orderModal.id = 'orderDetailsModal';
        orderModal.className = 'modal';
        document.body.appendChild(orderModal);
    }
    
    document.getElementById('orderDetailsModal').innerHTML = `
        <div class="modal-content large">
            <div class="modal-header">
                <h2>تفاصيل الطلب #${order.id.substring(0, 8)}</h2>
                <button class="close">&times;</button>
            </div>
            <div class="order-details-content">
                <div class="order-info-section">
                    <h3>معلومات العميل</h3>
                    <div class="info-grid">
                        <div><strong>الاسم:</strong> ${order.customerName}</div>
                        <div><strong>الهاتف:</strong> ${order.customerPhone}</div>
                        <div><strong>البريد:</strong> ${order.customerEmail}</div>
                        <div><strong>العنوان:</strong> ${order.shippingAddress?.address}</div>
                        <div><strong>المدينة:</strong> ${order.shippingAddress?.city}</div>
                        <div><strong>طريقة الدفع:</strong> ${order.paymentMethod === 'cod' ? 'الدفع عند الاستلام' : 'دفع إلكتروني'}</div>
                    </div>
                </div>
                
                <div class="order-items-section">
                    <h3>المنتجات</h3>
                    <div class="order-items-list">
                        ${order.items.map(item => `
                            <div class="order-item-detail">
                                <span>${item.name}</span>
                                <span>الكمية: ${item.quantity}</span>
                                <span>السعر: ${formatPrice(item.price)}</span>
                                <span>المجموع: ${formatPrice(item.total)}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="order-summary-section">
                    <h3>ملخص الطلب</h3>
                    <div class="summary-details">
                        <div class="summary-row">
                            <span>المجموع الفرعي:</span>
                            <span>${formatPrice(order.subtotal)}</span>
                        </div>
                        <div class="summary-row">
                            <span>الشحن:</span>
                            <span>${formatPrice(order.shippingCost)}</span>
                        </div>
                        <div class="summary-row total">
                            <span>المجموع:</span>
                            <span>${formatPrice(order.total)}</span>
                        </div>
                    </div>
                </div>
                
                ${order.notes ? `
                    <div class="order-notes-section">
                        <h3>ملاحظات الطلب</h3>
                        <p>${order.notes}</p>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
    
    document.getElementById('orderDetailsModal').classList.add('active');
}

// Customers Management
async function loadCustomersData() {
    try {
        showLoading('جاري تحميل العملاء...');
        
        const customersSnapshot = await db.collection('stores')
            .doc(currentStore)
            .collection('customers')
            .orderBy('createdAt', 'desc')
            .get();
        
        traderCustomers = customersSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        renderCustomersTable();
        
    } catch (error) {
        console.error('Error loading customers:', error);
        showNotification('حدث خطأ في تحميل العملاء', 'error');
    } finally {
        hideLoading();
    }
}

function renderCustomersTable() {
    const customersTable = document.getElementById('customersTable');
    if (!customersTable) return;
    
    customersTable.innerHTML = '';
    
    if (traderCustomers.length === 0) {
        customersTable.innerHTML = `
            <tr>
                <td colspan="5" class="text-center">لا يوجد عملاء</td>
            </tr>
        `;
        return;
    }
    
    traderCustomers.forEach(customer => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${customer.name}</td>
            <td>${customer.email}</td>
            <td>${customer.phone || 'غير محدد'}</td>
            <td>${customer.totalOrders || 0}</td>
            <td>${formatPrice(customer.totalSpent || 0)}</td>
            <td>${formatDate(customer.createdAt?.toDate())}</td>
            <td>
                <button class="btn btn-outline btn-sm" onclick="viewCustomerDetails('${customer.id}')">عرض</button>
            </td>
        `;
        customersTable.appendChild(row);
    });
}

// Coupons Management
async function loadCouponsData() {
    try {
        showLoading('جاري تحميل الكوبونات...');
        
        const couponsSnapshot = await db.collection('stores')
            .doc(currentStore)
            .collection('coupons')
            .orderBy('createdAt', 'desc')
            .get();
        
        traderCoupons = couponsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        renderCouponsTable();
        
    } catch (error) {
        console.error('Error loading coupons:', error);
        showNotification('حدث خطأ في تحميل الكوبونات', 'error');
    } finally {
        hideLoading();
    }
}

function renderCouponsTable() {
    const couponsTable = document.getElementById('couponsTable');
    if (!couponsTable) return;
    
    couponsTable.innerHTML = '';
    
    if (traderCoupons.length === 0) {
        couponsTable.innerHTML = `
            <tr>
                <td colspan="7" class="text-center">لا توجد كوبونات</td>
            </tr>
        `;
        return;
    }
    
    traderCoupons.forEach(coupon => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${coupon.code}</td>
            <td>${coupon.type === 'percentage' ? `${coupon.value}%` : formatPrice(coupon.value)}</td>
            <td>${coupon.usedCount || 0} / ${coupon.maxUses}</td>
            <td><span class="status-badge status-${coupon.status}">${coupon.status === 'active' ? 'نشط' : 'غير نشط'}</span></td>
            <td>${formatDate(coupon.expiryDate?.toDate())}</td>
            <td>${formatDate(coupon.createdAt?.toDate())}</td>
            <td>
                <button class="btn btn-outline btn-sm" onclick="editCoupon('${coupon.id}')">تعديل</button>
                <button class="btn btn-danger btn-sm" onclick="deleteCoupon('${coupon.id}')">حذف</button>
            </td>
        `;
        couponsTable.appendChild(row);
    });
}

function showAddCouponModal() {
    const modal = document.getElementById('couponModal');
    if (!modal) return;
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>إضافة كوبون جديد</h2>
                <button class="close">&times;</button>
            </div>
            <form id="couponForm" class="coupon-form">
                <div class="form-row">
                    <div class="form-group">
                        <label>كود الكوبون *</label>
                        <input type="text" id="couponCode" required placeholder="مثال: DISCOUNT10">
                    </div>
                    <div class="form-group">
                        <label>نوع الخصم *</label>
                        <select id="couponType" required>
                            <option value="percentage">نسبة مئوية</option>
                            <option value="fixed">مبلغ ثابت</option>
                        </select>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>قيمة الخصم *</label>
                        <input type="number" id="couponValue" min="0" step="0.01" required>
                    </div>
                    <div class="form-group">
                        <label>الحد الأقصى للاستخدام</label>
                        <input type="number" id="couponMaxUses" min="1" value="100">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>تاريخ الانتهاء</label>
                        <input type="date" id="couponExpiryDate">
                    </div>
                    <div class="form-group">
                        <label>الحالة</label>
                        <select id="couponStatus">
                            <option value="active">نشط</option>
                            <option value="inactive">غير نشط</option>
                        </select>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-outline" onclick="closeModal('couponModal')">إلغاء</button>
                    <button type="submit" class="btn btn-primary">إضافة الكوبون</button>
                </div>
            </form>
        </div>
    `;
    
    modal.classList.add('active');
    
    document.getElementById('couponForm').addEventListener('submit', handleCouponSubmit);
}

async function handleCouponSubmit(e) {
    e.preventDefault();
    
    try {
        showLoading('جاري إضافة الكوبون...');
        
        const couponData = {
            code: document.getElementById('couponCode').value.toUpperCase(),
            type: document.getElementById('couponType').value,
            value: parseFloat(document.getElementById('couponValue').value),
            maxUses: parseInt(document.getElementById('couponMaxUses').value),
            usedCount: 0,
            status: document.getElementById('couponStatus').value,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        const expiryDate = document.getElementById('couponExpiryDate').value;
        if (expiryDate) {
            couponData.expiryDate = firebase.firestore.Timestamp.fromDate(new Date(expiryDate));
        }
        
        await db.collection('stores')
            .doc(currentStore)
            .collection('coupons')
            .add(couponData);
        
        closeModal('couponModal');
        showNotification('تم إضافة الكوبون بنجاح', 'success');
        loadCouponsData();
        
    } catch (error) {
        console.error('Error adding coupon:', error);
        showNotification('حدث خطأ في إضافة الكوبون', 'error');
    } finally {
        hideLoading();
    }
}

// Store Settings
async function loadStoreSettings() {
    if (!currentTraderStore) return;
    
    const form = document.getElementById('storeSettingsForm');
    if (!form) return;
    
    const settings = currentTraderStore.settings || {};
    
    // Fill form with current settings
    const elements = {
        storeName: document.getElementById('storeName'),
        storeDescription: document.getElementById('storeDescription'),
        storePhone: document.getElementById('storePhone'),
        storeAddress: document.getElementById('storeAddress'),
        primaryColor: document.getElementById('primaryColor'),
        secondaryColor: document.getElementById('secondaryColor'),
        shippingFee: document.getElementById('shippingFee'),
        freeShippingThreshold: document.getElementById('freeShippingThreshold'),
        codEnabled: document.getElementById('codEnabled'),
        onlinePaymentEnabled: document.getElementById('onlinePaymentEnabled')
    };
    
    if (elements.storeName) elements.storeName.value = currentTraderStore.name || '';
    if (elements.storeDescription) elements.storeDescription.value = settings.description || '';
    if (elements.storePhone) elements.storePhone.value = settings.phone || '';
    if (elements.storeAddress) elements.storeAddress.value = settings.address || '';
    if (elements.primaryColor) elements.primaryColor.value = settings.colors?.primary || '#1E40AF';
    if (elements.secondaryColor) elements.secondaryColor.value = settings.colors?.secondary || '#0891B2';
    if (elements.shippingFee) elements.shippingFee.value = settings.shippingFee || 15;
    if (elements.freeShippingThreshold) elements.freeShippingThreshold.value = settings.freeShippingThreshold || 200;
    if (elements.codEnabled) elements.codEnabled.checked = settings.codEnabled !== false;
    if (elements.onlinePaymentEnabled) elements.onlinePaymentEnabled.checked = settings.onlinePaymentEnabled === true;
    
    // Show current logo
    const logoPreview = document.getElementById('logoPreview');
    if (logoPreview && settings.logo) {
        logoPreview.innerHTML = `<img src="${settings.logo}" alt="شعار المتجر">`;
    }
}

async function saveStoreSettings(e) {
    e.preventDefault();
    
    try {
        showLoading('جاري حفظ الإعدادات...');
        
        const updateData = {
            name: document.getElementById('storeName').value,
            settings: {
                description: document.getElementById('storeDescription').value,
                phone: document.getElementById('storePhone').value,
                address: document.getElementById('storeAddress').value,
                colors: {
                    primary: document.getElementById('primaryColor').value,
                    secondary: document.getElementById('secondaryColor').value,
                    background: '#F8FAFC'
                },
                shippingFee: parseFloat(document.getElementById('shippingFee').value),
                freeShippingThreshold: parseFloat(document.getElementById('freeShippingThreshold').value),
                codEnabled: document.getElementById('codEnabled').checked,
                onlinePaymentEnabled: document.getElementById('onlinePaymentEnabled').checked
            },
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // Handle logo upload
        const logoFile = document.getElementById('storeLogo').files[0];
        if (logoFile) {
            const logoUrl = await uploadStoreLogo(logoFile);
            updateData.settings.logo = logoUrl;
        }
        
        await db.collection('stores').doc(currentStore).update(updateData);
        
        showNotification('تم حفظ الإعدادات بنجاح', 'success');
        loadTraderStoreData();
        
    } catch (error) {
        console.error('Error saving store settings:', error);
        showNotification('حدث خطأ في حفظ الإعدادات', 'error');
    } finally {
        hideLoading();
    }
}

async function uploadStoreLogo(file) {
    try {
        const fileName = `logos/${currentStore}/${Date.now()}_${file.name}`;
        const storageRef = storage.ref().child(fileName);
        const snapshot = await storageRef.put(file);
        return await snapshot.ref.getDownloadURL();
    } catch (error) {
        console.error('Error uploading logo:', error);
        throw error;
    }
}

function previewStore() {
    const storeUrl = `store.html?id=${currentStore}`;
    window.open(storeUrl, '_blank');
}

// Make functions globally available
window.loadTraderDashboardData = loadTraderDashboardData;
window.loadProductsData = loadProductsData;
window.loadOrdersData = loadOrdersData;
window.loadCustomersData = loadCustomersData;
window.loadCouponsData = loadCouponsData;
window.loadStoreSettings = loadStoreSettings;
window.showAddProductModal = showAddProductModal;
window.showAddCouponModal = showAddCouponModal;
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.toggleProductStatus = toggleProductStatus;
window.updateOrderStatus = updateOrderStatus;
window.viewOrderDetails = viewOrderDetails;
window.viewCustomerDetails = viewCustomerDetails;
window.editCoupon = editCoupon;
window.deleteCoupon = deleteCoupon;
window.saveStoreSettings = saveStoreSettings;
window.previewStore = previewStore;