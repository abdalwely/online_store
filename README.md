# منصة المتاجر الإلكترونية - E-commerce Platform

منصة شاملة لإنشاء وإدارة المتاجر الإلكترونية الجاهزة مع قوالب احترافية وإدارة كاملة.

## 🚀 المميزات الرئيسية

### للمديرين (Admin)
- إدارة شاملة لجميع المتاجر والتجار
- إنشاء وتعديل القوالب الجاهزة
- إدارة الخطط والاشتراكات
- مراقبة الإحصائيات العامة
- إدارة المستخدمين

### للتجار (Traders)
- لوحة تحكم مستقلة لكل تاجر
- إدارة المنتجات (إضافة، تعديل، حذف)
- إدارة الطلبات وتتبع حالتها
- إدارة العملاء
- إنشاء كوبونات الخصم
- تخصيص مظهر المتجر (الألوان، الشعار، الخطوط)
- إعدادات الشحن والدفع
- إحصائيات مفصلة

### للعملاء (Customers)
- تصفح المنتجات حسب الفئات
- البحث والفلترة المتقدمة
- عرض تفاصيل المنتج مع التقييمات
- إضافة المنتجات للسلة
- تطبيق كوبونات الخصم
- إتمام الطلب بطرق دفع متعددة
- تتبع الطلبات
- تسجيل الدخول وإنشاء الحساب

## 🛠️ التقنيات المستخدمة

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend**: Firebase (Firestore, Authentication, Storage)
- **Database**: Cloud Firestore
- **Authentication**: Firebase Auth
- **Storage**: Firebase Storage
- **Styling**: CSS Grid, Flexbox, Custom CSS
- **Icons**: Unicode Emojis, Lucide React

## 📁 هيكل المشروع

```
/
├── index.html              # الصفحة الرئيسية للمنصة
├── store.html             # واجهة المتجر للعملاء
├── css/
│   └── main.css           # ملف التصميم الرئيسي
├── js/
│   ├── firebase-config.js # إعدادات Firebase
│   ├── auth.js           # نظام المصادقة
│   ├── admin.js          # وظائف المدير
│   ├── trader.js         # وظائف التاجر
│   ├── store.js          # واجهة المتجر
│   └── main.js           # الوظائف العامة
└── README.md             # ملف التوثيق
```

## 🗄️ هيكل قاعدة البيانات

### Collections الرئيسية:

#### `users` - المستخدمين
```javascript
{
  uid: "user_id",
  name: "اسم المستخدم",
  email: "email@example.com",
  type: "admin|trader",
  storeId: "store_id", // للتجار فقط
  createdAt: timestamp
}
```

#### `stores` - المتاجر
```javascript
{
  storeId: "store_id",
  name: "اسم المتجر",
  ownerId: "user_id",
  ownerName: "اسم التاجر",
  category: "الفئة",
  status: "active|inactive",
  template: "template_id",
  settings: {
    colors: { primary: "#1E40AF", secondary: "#0891B2" },
    logo: "image_url",
    description: "وصف المتجر",
    phone: "رقم الهاتف",
    address: "العنوان",
    shippingFee: 15,
    freeShippingThreshold: 200,
    codEnabled: true,
    onlinePaymentEnabled: false
  },
  createdAt: timestamp
}
```

#### `stores/{storeId}/products` - منتجات المتجر
```javascript
{
  productId: "product_id",
  name: "اسم المنتج",
  category: "الفئة",
  price: 100,
  stock: 50,
  description: "وصف المنتج",
  image: "image_url",
  status: "active|inactive",
  createdAt: timestamp
}
```

#### `stores/{storeId}/orders` - طلبات المتجر
```javascript
{
  orderId: "order_id",
  customerId: "customer_id",
  customerName: "اسم العميل",
  items: [
    {
      productId: "product_id",
      name: "اسم المنتج",
      price: 100,
      quantity: 2
    }
  ],
  subtotal: 200,
  shippingCost: 15,
  total: 215,
  status: "pending|processing|shipped|delivered|cancelled",
  paymentMethod: "COD|CARD",
  createdAt: timestamp
}
```

#### `stores/{storeId}/customers` - عملاء المتجر
```javascript
{
  customerId: "customer_id",
  name: "اسم العميل",
  email: "email@example.com",
  phone: "رقم الهاتف",
  totalOrders: 5,
  totalSpent: 1000,
  createdAt: timestamp
}
```

#### `stores/{storeId}/coupons` - كوبونات المتجر
```javascript
{
  couponId: "coupon_id",
  code: "DISCOUNT10",
  type: "percentage|fixed",
  value: 10,
  maxUses: 100,
  usedCount: 25,
  status: "active|inactive",
  expiryDate: timestamp,
  createdAt: timestamp
}
```

## ⚙️ إعداد المشروع

### 1. إعداد Firebase

1. إنشاء مشروع جديد في [Firebase Console](https://console.firebase.google.com/)
2. تفعيل Firestore Database
3. تفعيل Authentication (Email/Password)
4. تفعيل Storage
5. نسخ إعدادات المشروع إلى `js/firebase-config.js`

```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};
```

### 2. قواعد الأمان في Firestore

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Stores collection
    match /stores/{storeId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        (resource.data.ownerId == request.auth.uid || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.type == 'admin');
      
      // Store subcollections
      match /{collection}/{document} {
        allow read, write: if request.auth != null && 
          (resource.data.ownerId == request.auth.uid || 
           get(/databases/$(database)/documents/stores/$(storeId)).data.ownerId == request.auth.uid ||
           get(/databases/$(database)/documents/users/$(request.auth.uid)).data.type == 'admin');
      }
    }
  }
}
```

### 3. قواعد الأمان في Storage

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /stores/{storeId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        request.auth.uid == firestore.get(/databases/(default)/documents/stores/$(storeId)).data.ownerId;
    }
  }
}
```

## 🚀 تشغيل المشروع

1. تحميل الملفات إلى خادم ويب
2. تحديث إعدادات Firebase في `js/firebase-config.js`
3. فتح `index.html` في المتصفح

### حسابات افتراضية للاختبار:

**مدير المنصة:**
- البريد الإلكتروني: `admin@platform.com`
- كلمة المرور: `admin123456`

## 📱 الواجهات الرئيسية

### 1. الصفحة الرئيسية (`index.html`)
- عرض مميزات المنصة
- تسجيل الدخول للمديرين والتجار
- إنشاء حساب تاجر جديد

### 2. لوحة تحكم المدير
- إحصائيات عامة
- إدارة المتاجر
- إدارة القوالب
- إدارة الخطط
- إدارة المستخدمين

### 3. لوحة تحكم التاجر
- إحصائيات المتجر
- إدارة المنتجات
- إدارة الطلبات
- إدارة العملاء
- إدارة الكوبونات
- تخصيص المظهر
- إعدادات المتجر

### 4. واجهة المتجر (`store.html`)
- عرض المنتجات
- تصفح الفئات
- سلة التسوق
- إتمام الطلب
- تسجيل دخول العملاء

## 🎨 التخصيص

### تخصيص الألوان
يمكن للتجار تخصيص ألوان متجرهم من خلال لوحة التحكم:
- اللون الأساسي
- اللون الثانوي
- لون الخلفية

### تخصيص الخطوط
خطوط متاحة:
- Cairo (افتراضي)
- Amiri
- Tajawal
- Almarai

### رفع الشعار
يمكن للتجار رفع شعار مخصص لمتجرهم.

## 📈 الإحصائيات

### للمديرين:
- إجمالي المتاجر
- إجمالي التجار
- إجمالي الطلبات
- إجمالي الإيرادات

### للتجار:
- إجمالي المنتجات
- إجمالي الطلبات
- إجمالي العملاء
- إجمالي المبيعات

## 🔒 الأمان

- تشفير جميع البيانات
- قواعد أمان صارمة في Firestore
- مصادقة آمنة عبر Firebase Auth
- التحقق من الصلاحيات قبل كل عملية

## 🌐 دعم اللغات

المنصة تدعم حالياً:
- العربية (افتراضي)
- إمكانية إضافة لغات أخرى بسهولة

## 📞 الدعم الفني

لأي استفسارات أو مشاكل تقنية، يرجى فتح issue في المشروع أو التواصل مع فريق التطوير.

## 📄 الترخيص

هذا المشروع مفتوح المصدر ومتاح للاستخدام والتطوير.

---

تم تطوير هذه المنصة لتكون حلاً شاملاً لإنشاء وإدارة المتاجر الإلكترونية بسهولة ومرونة عالية.