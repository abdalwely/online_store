// Admin Dashboard Functions

async function loadOverviewData() {
    try {
        showLoading();
        
        // Load total stores
        const storesSnapshot = await db.collection('stores').get();
        document.getElementById('totalStores').textContent = storesSnapshot.size;
        
        // Load total traders
        const tradersSnapshot = await db.collection('users').where('type', '==', 'trader').get();
        document.getElementById('totalTraders').textContent = tradersSnapshot.size;
        
        // Load total orders (sum from all stores)
        let totalOrders = 0;
        let totalRevenue = 0;
        
        for (const storeDoc of storesSnapshot.docs) {
            const ordersSnapshot = await db.collection('stores').doc(storeDoc.id).collection('orders').get();
            totalOrders += ordersSnapshot.size;
            
            ordersSnapshot.docs.forEach(orderDoc => {
                const orderData = orderDoc.data();
                if (orderData.total) {
                    totalRevenue += orderData.total;
                }
            });
        }
        
        document.getElementById('totalOrders').textContent = totalOrders;
        document.getElementById('totalRevenue').textContent = formatPrice(totalRevenue);
        
        // Load chart (placeholder)
        drawStoresChart();
        
    } catch (error) {
        console.error('Error loading overview data:', error);
        showNotification('حدث خطأ في تحميل البيانات', 'error');
    } finally {
        hideLoading();
    }
}

async function loadStoresData() {
    try {
        showLoading();
        
        const storesSnapshot = await db.collection('stores').orderBy('createdAt', 'desc').get();
        const storesTable = document.getElementById('storesTable');
        storesTable.innerHTML = '';
        
        for (const doc of storesSnapshot.docs) {
            const store = doc.data();
            const storeId = doc.id;
            
            // Get trader info
            const traderDoc = await db.collection('users').doc(store.ownerId).get();
            const traderName = traderDoc.exists ? traderDoc.data().name : 'غير معروف';
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${store.name}</td>
                <td>${traderName}</td>
                <td><span class="status-badge status-${store.status}">${getStatusText(store.status)}</span></td>
                <td>${formatDate(store.createdAt?.toDate())}</td>
                <td>${store.plan || 'مجاني'}</td>
                <td>
                    <button class="btn btn-outline btn-sm" onclick="viewStore('${storeId}')">عرض</button>
                    <button class="btn btn-danger btn-sm" onclick="toggleStoreStatus('${storeId}', '${store.status}')">
                        ${store.status === 'active' ? 'تعطيل' : 'تفعيل'}
                    </button>
                </td>
            `;
            storesTable.appendChild(row);
        }
        
    } catch (error) {
        console.error('Error loading stores data:', error);
        showNotification('حدث خطأ في تحميل المتاجر', 'error');
    } finally {
        hideLoading();
    }
}

async function loadTemplatesData() {
    try {
        showLoading();
        
        const templatesSnapshot = await db.collection('templates').get();
        const templatesGrid = document.getElementById('templatesGrid');
        templatesGrid.innerHTML = '';
        
        if (templatesSnapshot.empty) {
            // Create default templates if none exist
            await createDefaultTemplates();
            loadTemplatesData(); // Reload
            return;
        }
        
        templatesSnapshot.docs.forEach(doc => {
            const template = doc.data();
            const templateId = doc.id;
            
            const templateCard = document.createElement('div');
            templateCard.className = 'template-card';
            templateCard.innerHTML = `
                <div class="template-preview" style="background: ${template.colors?.primary || '#1E40AF'}">
                    <div class="template-header">${template.name}</div>
                    <div class="template-sections">
                        ${template.sections?.map(section => `<div class="section">${section}</div>`).join('') || ''}
                    </div>
                </div>
                <div class="template-info">
                    <h3>${template.name}</h3>
                    <p>${template.description || 'قالب احترافي'}</p>
                    <div class="template-actions">
                        <button class="btn btn-outline" onclick="editTemplate('${templateId}')">تعديل</button>
                        <button class="btn btn-danger" onclick="deleteTemplate('${templateId}')">حذف</button>
                    </div>
                </div>
            `;
            templatesGrid.appendChild(templateCard);
        });
        
    } catch (error) {
        console.error('Error loading templates data:', error);
        showNotification('حدث خطأ في تحميل القوالب', 'error');
    } finally {
        hideLoading();
    }
}

async function loadPlansData() {
    try {
        showLoading();
        
        const plansSnapshot = await db.collection('plans').get();
        const plansGrid = document.getElementById('plansGrid');
        plansGrid.innerHTML = '';
        
        if (plansSnapshot.empty) {
            // Create default plans if none exist
            await createDefaultPlans();
            loadPlansData(); // Reload
            return;
        }
        
        plansSnapshot.docs.forEach(doc => {
            const plan = doc.data();
            const planId = doc.id;
            
            const planCard = document.createElement('div');
            planCard.className = 'plan-card';
            planCard.innerHTML = `
                <div class="plan-header">
                    <h3>${plan.name}</h3>
                    <div class="plan-price">${formatPrice(plan.price)}</div>
                </div>
                <div class="plan-features">
                    <ul>
                        <li>عدد المنتجات: ${plan.maxProducts}</li>
                        <li>مساحة التخزين: ${plan.storage}</li>
                        <li>الدعم الفني: ${plan.support}</li>
                        ${plan.features?.map(feature => `<li>${feature}</li>`).join('') || ''}
                    </ul>
                </div>
                <div class="plan-actions">
                    <button class="btn btn-outline" onclick="editPlan('${planId}')">تعديل</button>
                    <button class="btn btn-danger" onclick="deletePlan('${planId}')">حذف</button>
                </div>
            `;
            plansGrid.appendChild(planCard);
        });
        
    } catch (error) {
        console.error('Error loading plans data:', error);
        showNotification('حدث خطأ في تحميل الخطط', 'error');
    } finally {
        hideLoading();
    }
}

async function loadUsersData() {
    try {
        showLoading();
        
        const usersSnapshot = await db.collection('users').orderBy('createdAt', 'desc').get();
        const usersTable = document.getElementById('usersTable');
        usersTable.innerHTML = '';
        
        usersSnapshot.docs.forEach(doc => {
            const user = doc.data();
            const userId = doc.id;
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td>${user.type === 'admin' ? 'مدير' : 'تاجر'}</td>
                <td>${formatDate(user.createdAt?.toDate())}</td>
                <td><span class="status-badge status-active">نشط</span></td>
                <td>
                    <button class="btn btn-outline btn-sm" onclick="viewUser('${userId}')">عرض</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteUser('${userId}')">حذف</button>
                </td>
            `;
            usersTable.appendChild(row);
        });
        
    } catch (error) {
        console.error('Error loading users data:', error);
        showNotification('حدث خطأ في تحميل المستخدمين', 'error');
    } finally {
        hideLoading();
    }
}

// Helper functions
function getStatusText(status) {
    switch (status) {
        case 'active':
            return 'نشط';
        case 'inactive':
            return 'غير نشط';
        case 'suspended':
            return 'معلق';
        default:
            return status;
    }
}

async function toggleStoreStatus(storeId, currentStatus) {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    
    try {
        await db.collection('stores').doc(storeId).update({
            status: newStatus
        });
        
        showNotification(`تم ${newStatus === 'active' ? 'تفعيل' : 'تعطيل'} المتجر بنجاح`, 'success');
        loadStoresData(); // Reload stores data
        
    } catch (error) {
        console.error('Error toggling store status:', error);
        showNotification('حدث خطأ في تغيير حالة المتجر', 'error');
    }
}

function viewStore(storeId) {
    // Open store in new tab
    window.open(`/store/${storeId}`, '_blank');
}

async function createDefaultTemplates() {
    const templates = [
        {
            id: 'fashion',
            name: 'قالب الأزياء',
            description: 'قالب مخصص لمتاجر الملابس والأزياء',
            colors: {
                primary: '#E91E63',
                secondary: '#9C27B0',
                background: '#FAFAFA'
            },
            sections: ['الرئيسية', 'الأقسام', 'العروض', 'من نحن'],
            features: ['معرض صور', 'فلترة متقدمة', 'تقييمات']
        },
        {
            id: 'electronics',
            name: 'قالب الإلكترونيات',
            description: 'قالب مخصص لمتاجر الإلكترونيات',
            colors: {
                primary: '#2196F3',
                secondary: '#03A9F4',
                background: '#F5F5F5'
            },
            sections: ['الرئيسية', 'المنتجات', 'العلامات التجارية', 'الدعم'],
            features: ['مقارنة المنتجات', 'مواصفات تقنية', 'ضمان']
        }
    ];
    
    for (const template of templates) {
        await db.collection('templates').doc(template.id).set(template);
    }
}

async function createDefaultPlans() {
    const plans = [
        {
            id: 'free',
            name: 'الخطة المجانية',
            price: 0,
            maxProducts: 50,
            storage: '1 جيجا',
            support: 'بريد إلكتروني',
            features: ['متجر أساسي', 'دفع عند الاستلام']
        },
        {
            id: 'premium',
            name: 'الخطة المميزة',
            price: 99,
            maxProducts: 500,
            storage: '10 جيجا',
            support: 'هاتف وبريد',
            features: ['متجر متقدم', 'دفع إلكتروني', 'تقارير مفصلة']
        },
        {
            id: 'enterprise',
            name: 'خطة الشركات',
            price: 299,
            maxProducts: -1, // Unlimited
            storage: 'غير محدود',
            support: '24/7',
            features: ['جميع المميزات', 'API مخصص', 'دعم فني مخصص']
        }
    ];
    
    for (const plan of plans) {
        await db.collection('plans').doc(plan.id).set(plan);
    }
}

function drawStoresChart() {
    // Simple chart placeholder
    const canvas = document.getElementById('storesChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw simple bar chart
    const data = [10, 25, 40, 35, 60, 45, 70]; // Sample data
    const barWidth = width / data.length;
    const maxValue = Math.max(...data);
    
    ctx.fillStyle = '#1E40AF';
    
    data.forEach((value, index) => {
        const barHeight = (value / maxValue) * height * 0.8;
        const x = index * barWidth;
        const y = height - barHeight;
        
        ctx.fillRect(x + 10, y, barWidth - 20, barHeight);
    });
}

// Modal functions
function showCreateStoreModal() {
    // Implementation for creating store modal
    showNotification('ميزة إنشاء المتجر قيد التطوير', 'info');
}

function showCreateTemplateModal() {
    showNotification('ميزة إنشاء القوالب قيد التطوير', 'info');
}

function showCreatePlanModal() {
    showNotification('ميزة إنشاء الخطط قيد التطوير', 'info');
}

function editTemplate(templateId) {
    showNotification('ميزة تعديل القوالب قيد التطوير', 'info');
}

function deleteTemplate(templateId) {
    if (confirm('هل أنت متأكد من حذف هذا القالب؟')) {
        db.collection('templates').doc(templateId).delete()
            .then(() => {
                showNotification('تم حذف القالب بنجاح', 'success');
                loadTemplatesData();
            })
            .catch(error => {
                console.error('Error deleting template:', error);
                showNotification('حدث خطأ في حذف القالب', 'error');
            });
    }
}

function editPlan(planId) {
    showNotification('ميزة تعديل الخطط قيد التطوير', 'info');
}

function deletePlan(planId) {
    if (confirm('هل أنت متأكد من حذف هذه الخطة؟')) {
        db.collection('plans').doc(planId).delete()
            .then(() => {
                showNotification('تم حذف الخطة بنجاح', 'success');
                loadPlansData();
            })
            .catch(error => {
                console.error('Error deleting plan:', error);
                showNotification('حدث خطأ في حذف الخطة', 'error');
            });
    }
}

function viewUser(userId) {
    showNotification('ميزة عرض المستخدم قيد التطوير', 'info');
}

function deleteUser(userId) {
    if (confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
        // Implementation for deleting user
        showNotification('ميزة حذف المستخدم قيد التطوير', 'info');
    }
}

// Make functions globally available
window.loadOverviewData = loadOverviewData;
window.loadStoresData = loadStoresData;
window.loadTemplatesData = loadTemplatesData;
window.loadPlansData = loadPlansData;
window.loadUsersData = loadUsersData;
window.showCreateStoreModal = showCreateStoreModal;
window.showCreateTemplateModal = showCreateTemplateModal;
window.showCreatePlanModal = showCreatePlanModal;
window.toggleStoreStatus = toggleStoreStatus;
window.viewStore = viewStore;
window.editTemplate = editTemplate;
window.deleteTemplate = deleteTemplate;
window.editPlan = editPlan;
window.deletePlan = deletePlan;
window.viewUser = viewUser;
window.deleteUser = deleteUser;