// Authentication functions
function showLogin() {
    document.getElementById('loginModal').classList.add('active');
  }
  
  function showRegister() {
    showRegisterTrader();
  }
  
  function showRegisterTrader() {
    document.getElementById('registerTraderModal').classList.add('active');
  }
  
  function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
  }
  
  function showCustomerLogin() {
    document.getElementById('customerLoginModal').classList.add('active');
  }
  
  function showCustomerRegister() {
    closeModal('customerLoginModal');
    document.getElementById('customerRegisterModal').classList.add('active');
  }
  
  function updateStoreForLoggedCustomer(user, customerData) {
    const loginBtn = document.querySelector('.store-actions .btn-outline');
    if (loginBtn) {
      loginBtn.textContent = `مرحباً ${customerData.name}`;
      loginBtn.onclick = null;
    }
  }
  
  function getCurrentStoreId() {
    return currentStore || 'demo-store';
  }
  
  async function logout() {
    try {
      showLoading();
      await auth.signOut();
  
      currentUser = null;
      currentUserType = null;
      currentStore = null;
  
      showLandingPage();
      showNotification('تم تسجيل الخروج بنجاح', 'success');
    } catch (error) {
      console.error('Logout error:', error);
      showNotification('حدث خطأ في تسجيل الخروج', 'error');
    } finally {
      hideLoading();
    }
  }
  
  // DOMContentLoaded
  document.addEventListener('DOMContentLoaded', function () {
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', async function (e) {
        e.preventDefault();
  
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        const type = document.getElementById('loginType').value;
  
        if (!email || !password || !type) {
          showNotification('يرجى ملء جميع الحقول', 'warning');
          return;
        }
  
        try {
          showLoading();
          const userCredential = await auth.signInWithEmailAndPassword(email, password);
          const user = userCredential.user;
  
          let userDoc = await db.collection('users').doc(user.uid).get();
  
          if (!userDoc.exists) {
            if (email === 'admin@platform.com') {
              await db.collection('users').doc(user.uid).set({
                name: 'Admin Name',
                email: 'admin@platform.com',
                type: 'admin',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
              });
  
              userDoc = await db.collection('users').doc(user.uid).get();
            } else {
              throw new Error('المستخدم غير موجود');
            }
          }
  
          const userData = userDoc.data();
  
          if (userData.type !== type) {
            throw new Error('نوع الحساب غير صحيح');
          }
  
          currentUser = user;
          currentUserType = userData.type;
  
          if (type === 'admin') {
            currentStore = null;
            showAdminDashboard();
          } else if (type === 'trader') {
            currentStore = userData.storeId;
            showTraderDashboard();
          }
  
          closeModal('loginModal');
          showNotification('تم تسجيل الدخول بنجاح', 'success');
        } catch (error) {
          console.error('Login error:', error);
          let errorMessage = 'حدث خطأ في تسجيل الدخول';
  
          switch (error.code) {
            case 'auth/user-not-found':
              errorMessage = 'المستخدم غير موجود';
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
      });
    }
  
    // Trader register form
    const registerTraderForm = document.getElementById('registerTraderForm');
    if (registerTraderForm) {
      registerTraderForm.addEventListener('submit', async function (e) {
        e.preventDefault();
  
        const name = document.getElementById('traderName').value;
        const email = document.getElementById('traderEmail').value;
        const password = document.getElementById('traderPassword').value;
        const storeName = document.getElementById('storeName').value;
        const storeCategory = document.getElementById('storeCategory').value;
  
        if (!name || !email || !password || !storeName || !storeCategory) {
          showNotification('يرجى ملء جميع الحقول', 'warning');
          return;
        }
  
        if (password.length < 6) {
          showNotification('كلمة المرور يجب أن تكون 6 أحرف على الأقل', 'warning');
          return;
        }
  
        try {
          showLoading();
  
          const userCredential = await auth.createUserWithEmailAndPassword(email, password);
          const user = userCredential.user;
          const storeId = generateId();
  
          await db.collection('users').doc(user.uid).set({
            name,
            email,
            type: 'trader',
            storeId,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          });
  
          await db.collection('stores').doc(storeId).set({
            name: storeName,
            category: storeCategory,
            ownerId: user.uid,
            ownerName: name,
            ownerEmail: email,
            status: 'active',
            template: 'default',
            settings: {
              colors: {
                primary: '#1E40AF',
                secondary: '#0891B2',
                background: '#F8FAFC',
              },
              logo: '',
              description: '',
              phone: '',
              address: '',
              shippingFee: 0,
              freeShippingThreshold: 200,
              codEnabled: true,
              onlinePaymentEnabled: false,
            },
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          });
  
          const collections = ['products', 'orders', 'customers', 'coupons'];
          for (const col of collections) {
            const docRef = db.collection('stores').doc(storeId).collection(col).doc('init');
            await docRef.set({ placeholder: true });
            await docRef.delete();
          }
  
          currentUser = user;
          currentUserType = 'trader';
          currentStore = storeId;
  
          showTraderDashboard();
          closeModal('registerTraderModal');
          showNotification('تم إنشاء المتجر بنجاح!', 'success');
        } catch (error) {
          console.error('Registration error:', error);
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
      });
    }
  
    // Customer login
    const customerLoginForm = document.getElementById('customerLoginForm');
    if (customerLoginForm) {
      customerLoginForm.addEventListener('submit', async function (e) {
        e.preventDefault();
  
        const email = document.getElementById('customerEmail').value;
        const password = document.getElementById('customerPassword').value;
  
        if (!email || !password) {
          showNotification('يرجى ملء جميع الحقول', 'warning');
          return;
        }
  
        try {
          showLoading();
  
          const userCredential = await auth.signInWithEmailAndPassword(email, password);
          const user = userCredential.user;
  
          const customerDoc = await db
            .collection('stores')
            .doc(getCurrentStoreId())
            .collection('customers')
            .doc(user.uid)
            .get();
  
          if (!customerDoc.exists) {
            throw new Error('العميل غير مسجل في هذا المتجر');
          }
  
          closeModal('customerLoginModal');
          showNotification('تم تسجيل الدخول بنجاح', 'success');
          updateStoreForLoggedCustomer(user, customerDoc.data());
        } catch (error) {
          console.error('Customer login error:', error);
          showNotification('حدث خطأ في تسجيل الدخول', 'error');
        } finally {
          hideLoading();
        }
      });
    }
  
    // Customer register
    const customerRegisterForm = document.getElementById('customerRegisterForm');
    if (customerRegisterForm) {
      customerRegisterForm.addEventListener('submit', async function (e) {
        e.preventDefault();
  
        const name = document.getElementById('customerName').value;
        const email = document.getElementById('customerRegEmail').value;
        const phone = document.getElementById('customerPhone').value;
        const password = document.getElementById('customerRegPassword').value;
  
        if (!name || !email || !phone || !password) {
          showNotification('يرجى ملء جميع الحقول', 'warning');
          return;
        }
  
        try {
          showLoading();
  
          const userCredential = await auth.createUserWithEmailAndPassword(email, password);
          const user = userCredential.user;
  
          await db
            .collection('stores')
            .doc(getCurrentStoreId())
            .collection('customers')
            .doc(user.uid)
            .set({
              name,
              email,
              phone,
              totalOrders: 0,
              totalSpent: 0,
              createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            });
  
          closeModal('customerRegisterModal');
          showNotification('تم إنشاء الحساب بنجاح!', 'success');
          updateStoreForLoggedCustomer(user, { name, email, phone });
        } catch (error) {
          console.error('Customer registration error:', error);
          let errorMessage = 'حدث خطأ في إنشاء الحساب';
  
          if (error.code === 'auth/email-already-in-use') {
            errorMessage = 'البريد الإلكتروني مستخدم بالفعل';
          }
  
          showNotification(errorMessage, 'error');
        } finally {
          hideLoading();
        }
      });
    }
  });
  
  // ✅ Make functions globally available
  window.showLogin = showLogin;
  window.showRegister = showRegister;
  window.showRegisterTrader = showRegisterTrader;
  window.closeModal = closeModal;
  window.logout = logout;
  window.showCustomerLogin = showCustomerLogin;
  window.showCustomerRegister = showCustomerRegister;
  