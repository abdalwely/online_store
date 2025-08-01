// Internationalization (i18n) System

const translations = {
    ar: {
        // Navigation
        home: "الرئيسية",
        categories: "الأقسام",
        products: "المنتجات",
        offers: "العروض",
        about: "من نحن",
        contact: "اتصل بنا",
        
        // User Interface
        login: "تسجيل الدخول",
        register: "إنشاء حساب",
        logout: "تسجيل الخروج",
        profile: "الملف الشخصي",
        my_orders: "طلباتي",
        wishlist: "المفضلة",
        shopping_cart: "سلة التسوق",
        
        // Hero Section
        hero_title: "مرحباً بك في متجرنا",
        hero_subtitle: "اكتشف أفضل المنتجات بأسعار مميزة",
        shop_now: "تسوق الآن",
        view_offers: "عرض العروض",
        
        // Features
        free_shipping: "شحن مجاني",
        free_shipping_desc: "للطلبات أكثر من 200 ريال",
        easy_return: "إرجاع سهل",
        easy_return_desc: "خلال 14 يوم من الشراء",
        secure_payment: "دفع آمن",
        secure_payment_desc: "طرق دفع متعددة وآمنة",
        support_247: "دعم 24/7",
        support_247_desc: "خدمة عملاء متاحة دائماً",
        
        // Products
        all_products: "جميع المنتجات",
        featured_products: "المنتجات المميزة",
        featured_products_desc: "أفضل منتجاتنا المختارة خصيصاً لك",
        categories_desc: "تصفح منتجاتنا حسب الفئات",
        add_to_cart: "إضافة للسلة",
        buy_now: "اشترِ الآن",
        quick_view: "عرض سريع",
        share: "مشاركة",
        
        // Filters and Sorting
        all_categories: "جميع الأقسام",
        all_prices: "جميع الأسعار",
        sort_newest: "الأحدث",
        sort_price_low: "السعر: من الأقل للأعلى",
        sort_price_high: "السعر: من الأعلى للأقل",
        sort_name: "الاسم",
        sort_rating: "التقييم",
        load_more: "تحميل المزيد",
        
        // Product Details
        description: "الوصف",
        specifications: "المواصفات",
        reviews: "التقييمات",
        shipping: "الشحن",
        product_details: "تفاصيل المنتج",
        product_specifications: "مواصفات المنتج",
        size: "الحجم",
        color: "اللون",
        quantity: "الكمية",
        
        // Reviews
        add_review: "إضافة تقييم",
        rating: "التقييم",
        review_title: "عنوان التقييم",
        review_comment: "التعليق",
        submit_review: "إرسال التقييم",
        customer_reviews: "آراء العملاء",
        customer_reviews_desc: "ماذا يقول عملاؤنا عنا",
        
        // Cart
        subtotal: "المجموع الفرعي",
        discount: "الخصم",
        shipping: "الشحن",
        tax: "الضريبة",
        total: "المجموع",
        discount_coupon: "كوبون الخصم",
        enter_coupon: "أدخل كود الكوبون",
        apply: "تطبيق",
        continue_shopping: "متابعة التسوق",
        checkout: "إتمام الطلب",
        
        // Checkout
        shipping_info: "معلومات الشحن",
        payment_method: "طريقة الدفع",
        order_review: "مراجعة الطلب",
        shipping_address: "عنوان الشحن",
        first_name: "الاسم الأول",
        last_name: "الاسم الأخير",
        phone: "رقم الهاتف",
        email: "البريد الإلكتروني",
        address: "العنوان",
        city: "المدينة",
        postal_code: "الرمز البريدي",
        save_address: "حفظ هذا العنوان للمرات القادمة",
        
        // Payment Methods
        cash_on_delivery: "الدفع عند الاستلام",
        cash_on_delivery_desc: "ادفع نقداً عند استلام الطلب",
        online_payment: "الدفع الإلكتروني",
        online_payment_desc: "ادفع بالبطاقة الائتمانية أو mada",
        installment_payment: "الدفع بالتقسيط",
        installment_payment_desc: "قسط مشترياتك على 3 أو 6 أشهر",
        
        // Card Details
        card_information: "معلومات البطاقة",
        card_number: "رقم البطاقة",
        expiry_date: "تاريخ الانتهاء",
        cvv: "CVV",
        cardholder_name: "اسم حامل البطاقة",
        
        // Order
        order_summary: "ملخص الطلب",
        order_notes: "ملاحظات الطلب",
        order_notes_placeholder: "أي ملاحظات إضافية للطلب (اختياري)",
        place_order: "تأكيد الطلب",
        previous: "السابق",
        next: "التالي",
        
        // Order Status
        all_orders: "جميع الطلبات",
        pending: "قيد المراجعة",
        processing: "قيد التجهيز",
        shipped: "تم الشحن",
        delivered: "تم التسليم",
        cancelled: "ملغي",
        
        // Authentication
        customer_login: "تسجيل دخول العميل",
        create_account: "إنشاء حساب",
        password: "كلمة المرور",
        confirm_password: "تأكيد كلمة المرور",
        remember_me: "تذكرني",
        forgot_password: "نسيت كلمة المرور؟",
        or: "أو",
        login_google: "تسجيل الدخول بجوجل",
        no_account: "ليس لديك حساب؟",
        have_account: "لديك حساب؟",
        agree_terms: "أوافق على الشروط والأحكام",
        
        // About
        about_us: "من نحن",
        about_description: "نحن متجر إلكتروني متخصص في تقديم أفضل المنتجات بأسعار تنافسية وخدمة عملاء ممتازة.",
        happy_customers: "عميل سعيد",
        products_available: "منتج متاح",
        years_experience: "سنوات خبرة",
        
        // Contact
        contact_us: "تواصل معنا",
        contact_us_desc: "نحن هنا لمساعدتك في أي وقت",
        send_message: "أرسل لنا رسالة",
        name: "الاسم",
        subject: "الموضوع",
        message: "الرسالة",
        working_hours: "ساعات العمل",
        working_hours_desc: "السبت - الخميس: 9:00 ص - 10:00 م",
        
        // Footer
        quick_links: "روابط سريعة",
        customer_service: "خدمة العملاء",
        contact_info: "معلومات التواصل",
        newsletter: "النشرة البريدية",
        your_email: "بريدك الإلكتروني",
        subscribe: "اشترك",
        powered_by: "تم التطوير بواسطة",
        faq: "الأسئلة الشائعة",
        return_policy: "سياسة الإرجاع",
        payment_methods: "طرق الدفع",
        shipping_delivery: "الشحن والتوصيل",
        privacy_policy: "سياسة الخصوصية",
        
        // Flash Sale
        flash_sale: "عرض محدود",
        hours: "ساعة",
        minutes: "دقيقة",
        seconds: "ثانية",
        
        // Special Offers
        special_offers: "العروض الخاصة",
        special_offers_desc: "لا تفوت هذه العروض المحدودة",
        
        // Shipping Info
        shipping_delivery_info: "معلومات الشحن والتوصيل",
        standard_shipping: "الشحن العادي",
        standard_shipping_desc: "مدة التوصيل: 3-5 أيام عمل",
        standard_shipping_cost: "التكلفة: 15 ريال (مجاني للطلبات أكثر من 200 ريال)",
        express_shipping: "الشحن السريع",
        express_shipping_desc: "مدة التوصيل: 1-2 أيام عمل",
        express_shipping_cost: "التكلفة: 30 ريال",
        return_exchange_policy: "سياسة الاستبدال والإرجاع",
        return_period: "إمكانية الإرجاع خلال 14 يوم من تاريخ الاستلام",
        return_condition: "يجب أن يكون المنتج في حالته الأصلية",
        return_cost: "نتحمل تكلفة الإرجاع في حالة وجود عيب في المنتج",
        refund_period: "يتم استرداد المبلغ خلال 5-7 أيام عمل",
        
        // Product Features
        free_shipping_over: "شحن مجاني للطلبات أكثر من 200 ريال",
        return_policy_14: "إمكانية الإرجاع خلال 14 يوم",
        quality_guarantee: "ضمان الجودة",
        customer_support: "دعم العملاء 24/7",
        
        // Related Products
        related_products: "منتجات ذات صلة",
        
        // Share
        share_product: "مشاركة المنتج",
        share_whatsapp: "واتساب",
        share_twitter: "تويتر",
        share_facebook: "فيسبوك",
        copy_link: "نسخ الرابط",
        
        // Live Chat
        live_chat: "دردشة مباشرة",
        customer_support: "دعم العملاء",
        welcome_message: "مرحباً! كيف يمكنني مساعدتك؟",
        type_message: "اكتب رسالتك...",
        send: "إرسال",
        
        // Search
        search_products: "ابحث عن المنتجات...",
        
        // Common
        cancel: "إلغاء",
        save: "حفظ",
        edit: "تعديل",
        delete: "حذف",
        view: "عرض",
        close: "إغلاق",
        loading: "جاري التحميل...",
        error: "حدث خطأ",
        success: "تم بنجاح",
        warning: "تحذير",
        info: "معلومات"
    },
    
    en: {
        // Navigation
        home: "Home",
        categories: "Categories",
        products: "Products",
        offers: "Offers",
        about: "About Us",
        contact: "Contact",
        
        // User Interface
        login: "Login",
        register: "Register",
        logout: "Logout",
        profile: "Profile",
        my_orders: "My Orders",
        wishlist: "Wishlist",
        shopping_cart: "Shopping Cart",
        
        // Hero Section
        hero_title: "Welcome to Our Store",
        hero_subtitle: "Discover the best products at amazing prices",
        shop_now: "Shop Now",
        view_offers: "View Offers",
        
        // Features
        free_shipping: "Free Shipping",
        free_shipping_desc: "For orders over 200 SAR",
        easy_return: "Easy Returns",
        easy_return_desc: "Within 14 days of purchase",
        secure_payment: "Secure Payment",
        secure_payment_desc: "Multiple secure payment methods",
        support_247: "24/7 Support",
        support_247_desc: "Customer service always available",
        
        // Products
        all_products: "All Products",
        featured_products: "Featured Products",
        featured_products_desc: "Our best products specially selected for you",
        categories_desc: "Browse our products by categories",
        add_to_cart: "Add to Cart",
        buy_now: "Buy Now",
        quick_view: "Quick View",
        share: "Share",
        
        // Filters and Sorting
        all_categories: "All Categories",
        all_prices: "All Prices",
        sort_newest: "Newest",
        sort_price_low: "Price: Low to High",
        sort_price_high: "Price: High to Low",
        sort_name: "Name",
        sort_rating: "Rating",
        load_more: "Load More",
        
        // Product Details
        description: "Description",
        specifications: "Specifications",
        reviews: "Reviews",
        shipping: "Shipping",
        product_details: "Product Details",
        product_specifications: "Product Specifications",
        size: "Size",
        color: "Color",
        quantity: "Quantity",
        
        // Reviews
        add_review: "Add Review",
        rating: "Rating",
        review_title: "Review Title",
        review_comment: "Comment",
        submit_review: "Submit Review",
        customer_reviews: "Customer Reviews",
        customer_reviews_desc: "What our customers say about us",
        
        // Cart
        subtotal: "Subtotal",
        discount: "Discount",
        shipping: "Shipping",
        tax: "Tax",
        total: "Total",
        discount_coupon: "Discount Coupon",
        enter_coupon: "Enter coupon code",
        apply: "Apply",
        continue_shopping: "Continue Shopping",
        checkout: "Checkout",
        
        // Checkout
        shipping_info: "Shipping Information",
        payment_method: "Payment Method",
        order_review: "Order Review",
        shipping_address: "Shipping Address",
        first_name: "First Name",
        last_name: "Last Name",
        phone: "Phone",
        email: "Email",
        address: "Address",
        city: "City",
        postal_code: "Postal Code",
        save_address: "Save this address for future orders",
        
        // Payment Methods
        cash_on_delivery: "Cash on Delivery",
        cash_on_delivery_desc: "Pay cash when you receive your order",
        online_payment: "Online Payment",
        online_payment_desc: "Pay with credit card or mada",
        installment_payment: "Installment Payment",
        installment_payment_desc: "Split your purchases over 3 or 6 months",
        
        // Card Details
        card_information: "Card Information",
        card_number: "Card Number",
        expiry_date: "Expiry Date",
        cvv: "CVV",
        cardholder_name: "Cardholder Name",
        
        // Order
        order_summary: "Order Summary",
        order_notes: "Order Notes",
        order_notes_placeholder: "Any additional notes for your order (optional)",
        place_order: "Place Order",
        previous: "Previous",
        next: "Next",
        
        // Order Status
        all_orders: "All Orders",
        pending: "Pending",
        processing: "Processing",
        shipped: "Shipped",
        delivered: "Delivered",
        cancelled: "Cancelled",
        
        // Authentication
        customer_login: "Customer Login",
        create_account: "Create Account",
        password: "Password",
        confirm_password: "Confirm Password",
        remember_me: "Remember Me",
        forgot_password: "Forgot Password?",
        or: "Or",
        login_google: "Login with Google",
        no_account: "Don't have an account?",
        have_account: "Have an account?",
        agree_terms: "I agree to the terms and conditions",
        
        // About
        about_us: "About Us",
        about_description: "We are an online store specialized in providing the best products at competitive prices with excellent customer service.",
        happy_customers: "Happy Customers",
        products_available: "Products Available",
        years_experience: "Years Experience",
        
        // Contact
        contact_us: "Contact Us",
        contact_us_desc: "We're here to help you anytime",
        send_message: "Send us a message",
        name: "Name",
        subject: "Subject",
        message: "Message",
        working_hours: "Working Hours",
        working_hours_desc: "Saturday - Thursday: 9:00 AM - 10:00 PM",
        
        // Footer
        quick_links: "Quick Links",
        customer_service: "Customer Service",
        contact_info: "Contact Information",
        newsletter: "Newsletter",
        your_email: "Your Email",
        subscribe: "Subscribe",
        powered_by: "Powered by",
        faq: "FAQ",
        return_policy: "Return Policy",
        payment_methods: "Payment Methods",
        shipping_delivery: "Shipping & Delivery",
        privacy_policy: "Privacy Policy",
        
        // Flash Sale
        flash_sale: "Flash Sale",
        hours: "Hours",
        minutes: "Minutes",
        seconds: "Seconds",
        
        // Special Offers
        special_offers: "Special Offers",
        special_offers_desc: "Don't miss these limited offers",
        
        // Shipping Info
        shipping_delivery_info: "Shipping & Delivery Information",
        standard_shipping: "Standard Shipping",
        standard_shipping_desc: "Delivery time: 3-5 business days",
        standard_shipping_cost: "Cost: 15 SAR (Free for orders over 200 SAR)",
        express_shipping: "Express Shipping",
        express_shipping_desc: "Delivery time: 1-2 business days",
        express_shipping_cost: "Cost: 30 SAR",
        return_exchange_policy: "Return & Exchange Policy",
        return_period: "Returns accepted within 14 days of delivery",
        return_condition: "Product must be in original condition",
        return_cost: "We cover return costs for defective products",
        refund_period: "Refunds processed within 5-7 business days",
        
        // Product Features
        free_shipping_over: "Free shipping for orders over 200 SAR",
        return_policy_14: "14-day return policy",
        quality_guarantee: "Quality Guarantee",
        customer_support: "24/7 Customer Support",
        
        // Related Products
        related_products: "Related Products",
        
        // Share
        share_product: "Share Product",
        share_whatsapp: "WhatsApp",
        share_twitter: "Twitter",
        share_facebook: "Facebook",
        copy_link: "Copy Link",
        
        // Live Chat
        live_chat: "Live Chat",
        customer_support: "Customer Support",
        welcome_message: "Hello! How can I help you?",
        type_message: "Type your message...",
        send: "Send",
        
        // Search
        search_products: "Search products...",
        
        // Common
        cancel: "Cancel",
        save: "Save",
        edit: "Edit",
        delete: "Delete",
        view: "View",
        close: "Close",
        loading: "Loading...",
        error: "Error",
        success: "Success",
        warning: "Warning",
        info: "Information"
    }
};

// Current language
let currentLanguage = 'ar';

// Initialize i18n
function initializeI18n() {
    // Get language from localStorage or browser
    const savedLanguage = localStorage.getItem('preferred-language');
    const browserLanguage = navigator.language.startsWith('ar') ? 'ar' : 'en';
    
    currentLanguage = savedLanguage || browserLanguage;
    
    // Set document direction and language
    document.documentElement.lang = currentLanguage;
    document.documentElement.dir = currentLanguage === 'ar' ? 'rtl' : 'ltr';
    
    // Apply translations
    applyTranslations();
    
    // Update language selector
    updateLanguageSelector();
}

// Apply translations to the page
function applyTranslations() {
    const elements = document.querySelectorAll('[data-i18n]');
    
    elements.forEach(element => {
        const key = element.getAttribute('data-i18n');
        const translation = getTranslation(key);
        
        if (translation) {
            element.textContent = translation;
        }
    });
    
    // Handle placeholder translations
    const placeholderElements = document.querySelectorAll('[data-i18n-placeholder]');
    
    placeholderElements.forEach(element => {
        const key = element.getAttribute('data-i18n-placeholder');
        const translation = getTranslation(key);
        
        if (translation) {
            element.placeholder = translation;
        }
    });
    
    // Handle option translations
    const optionElements = document.querySelectorAll('[data-i18n-option]');
    
    optionElements.forEach(element => {
        const key = element.getAttribute('data-i18n-option');
        const translation = getTranslation(key);
        
        if (translation) {
            element.textContent = translation;
        }
    });
}

// Get translation for a key
function getTranslation(key) {
    const languageTranslations = translations[currentLanguage];
    
    if (!languageTranslations) {
        return translations['ar'][key] || key;
    }
    
    return languageTranslations[key] || translations['ar'][key] || key;
}

// Change language
function changeLanguage(language) {
    if (language && language !== currentLanguage) {
        currentLanguage = language;
        
        // Save to localStorage
        localStorage.setItem('preferred-language', language);
        
        // Update document attributes
        document.documentElement.lang = language;
        document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
        
        // Apply translations
        applyTranslations();
        
        // Update language selector
        updateLanguageSelector();
        
        // Trigger custom event
        document.dispatchEvent(new CustomEvent('languageChanged', {
            detail: { language: language }
        }));
        
        // Show notification
        if (typeof showNotification === 'function') {
            const message = language === 'ar' ? 'تم تغيير اللغة إلى العربية' : 'Language changed to English';
            showNotification(message, 'success');
        }
    }
}

// Toggle between Arabic and English
function toggleLanguage() {
    const newLanguage = currentLanguage === 'ar' ? 'en' : 'ar';
    changeLanguage(newLanguage);
}

// Update language selector
function updateLanguageSelector() {
    const languageSelect = document.getElementById('languageSelect');
    const currentLangSpan = document.getElementById('currentLang');
    
    if (languageSelect) {
        languageSelect.value = currentLanguage;
    }
    
    if (currentLangSpan) {
        currentLangSpan.textContent = currentLanguage === 'ar' ? 'العربية' : 'English';
    }
}

// Format numbers based on language
function formatNumber(number, options = {}) {
    const locale = currentLanguage === 'ar' ? 'ar-SA' : 'en-US';
    return new Intl.NumberFormat(locale, options).format(number);
}

// Format currency based on language
function formatCurrency(amount, currency = 'SAR') {
    const locale = currentLanguage === 'ar' ? 'ar-SA' : 'en-US';
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }).format(amount);
}

// Format date based on language
function formatDate(date, options = {}) {
    const locale = currentLanguage === 'ar' ? 'ar-SA' : 'en-US';
    const defaultOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    };
    
    return new Intl.DateTimeFormat(locale, { ...defaultOptions, ...options }).format(date);
}

// Get current language
function getCurrentLanguage() {
    return currentLanguage;
}

// Check if current language is RTL
function isRTL() {
    return currentLanguage === 'ar';
}

// Add translation dynamically
function addTranslation(language, key, value) {
    if (!translations[language]) {
        translations[language] = {};
    }
    
    translations[language][key] = value;
}

// Get all translations for current language
function getCurrentTranslations() {
    return translations[currentLanguage] || translations['ar'];
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeI18n();
});

// Listen for language change events
document.addEventListener('languageChanged', function(event) {
    // Update any dynamic content that needs language-specific formatting
    updateDynamicContent();
});

// Update dynamic content based on language
function updateDynamicContent() {
    // Update prices
    const priceElements = document.querySelectorAll('.price, .current-price, .original-price');
    priceElements.forEach(element => {
        const amount = parseFloat(element.dataset.amount);
        if (!isNaN(amount)) {
            element.textContent = formatCurrency(amount);
        }
    });
    
    // Update dates
    const dateElements = document.querySelectorAll('.date, .created-date, .updated-date');
    dateElements.forEach(element => {
        const dateValue = element.dataset.date;
        if (dateValue) {
            const date = new Date(dateValue);
            element.textContent = formatDate(date);
        }
    });
    
    // Update numbers
    const numberElements = document.querySelectorAll('.number, .count, .quantity');
    numberElements.forEach(element => {
        const number = parseFloat(element.dataset.number);
        if (!isNaN(number)) {
            element.textContent = formatNumber(number);
        }
    });
}

// Export functions for global use
window.initializeI18n = initializeI18n;
window.applyTranslations = applyTranslations;
window.getTranslation = getTranslation;
window.changeLanguage = changeLanguage;
window.toggleLanguage = toggleLanguage;
window.getCurrentLanguage = getCurrentLanguage;
window.isRTL = isRTL;
window.formatNumber = formatNumber;
window.formatCurrency = formatCurrency;
window.formatDate = formatDate;
window.addTranslation = addTranslation;
window.getCurrentTranslations = getCurrentTranslations;