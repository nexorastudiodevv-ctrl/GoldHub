# 🛠️ Gold & Currency Hub - دليل المطور

## 📁 هيكل المشروع

```
GOOD/
├── index.html           # الملف الرئيسي للموقع
├── manifest.json        # إعدادات PWA
├── sw.js               # Service Worker
├── database.rules.json  # قوانين Firebase
├── robots.txt          # تعليمات محركات البحث
├── sitemap.xml         # خريطة الموقع
├── .hintrc            # إعدادات linter
├── .vscode/           # إعدادات VS Code
└── /                  # ملفات توثيق

```

---

## 🔧 البيئة التقنية

### التقنيات المستخدمة:
- **HTML5** - البنية الأساسية
- **CSS3 + Tailwind CSS** - التصميم والتنسيق
- **JavaScript (ES6+)** - البرمجة
- **Chart.js** - الرسوم البيانية
- **Firebase** - قاعدة البيانات والمصادقة
- **PWA** - تطبيق ويب تقدمي

### المكتبات الخارجية:
- Tailwind CSS v3+
- FontAwesome 6.4.0
- Chart.js (آخر إصدار)
- Firebase SDK v10.7.1

---

## 🔑 المفاهيم الرئيسية

### 1. Firebase Integration
```javascript
const firebaseConfig = {
    apiKey: "AIzaSyBLHuPTH3RhwDTdxTDcgFRYPfvXZM3gco8",
    authDomain: "goldhub-1fdb1.firebaseapp.com",
    projectId: "goldhub-1fdb1",
    // ...
};
```

### 2. البيانات الحية
```javascript
// قراءة البيانات مباشرة
onValue(pricesRef, (snapshot) => {
    const data = snapshot.val();
    // تحديث الواجهة
});
```

### 3. المصادقة
```javascript
// تسجيل دخول الإداريين فقط
signInWithEmailAndPassword(auth, email, password)
```

### 4. مصادر البيانات
- **API الذهب:** https://www.goldapi.io/api/XAU/USD
- **أسعار الصرف:** https://open.er-api.com/v6/latest/USD
- **Firebase Realtime Database**

---

## 💾 تخزين البيانات

### في قاعدة البيانات:
```json
{
  "market_prices": {
    "gold": 2350.75,
    "rates": {
      "EGP": 47.50,
      "SAR": 3.75,
      "EUR": 0.9215
    },
    "carats": {
      "k24": 75.50,
      "k21": 69.15,
      "k18": 56.62
    },
    "makingCharges": {
      "k24": 0,
      "k21": 0,
      "k18": 0
    },
    "lastUpdated": 1234567890
  }
}
```

### في LocalStorage:
```javascript
// التنبيهات
localStorage.setItem('goldPriceAlert', 2350);

// النغمات المختارة
localStorage.setItem('selectedNotificationSound', 'url');
```

---

## 🔐 قوانين الأمان (Firebase Rules)

```json
{
  "market_prices": {
    ".read": true,  // الجميع يقرأ
    ".write": "auth != null && auth.token.email === 'admin@email.com'",  // الإداريين فقط
    ".validate": "newData.hasChildren(['gold', 'rates'])"
  }
}
```

---

## 🚀 وظائف رئيسية

### جلب الأسعار الحقيقية
```javascript
async function fetchApiPrices() {
    // جلب أسعار العملات
    const currRes = await fetch('https://open.er-api.com/v6/latest/USD');
    
    // جلب سعر الذهب
    const goldRes = await fetch('https://www.goldapi.io/api/XAU/USD', {
        headers: { "x-access-token": GOLD_API_KEY }
    });
}
```

### تحديث الواجهة
```javascript
function updateUI() {
    // حساب الأسعار
    // تحديث العناصر
    // تحديث الرسم البياني
    updateChart(goldPrice);
}
```

### الإشعارات
```javascript
function showToast(msg) {
    // عرض إشعار مخصص
    // تشغيل صوت
    // اهتزاز (إن أمكن)
}
```

---

## 📊 الرسوم البيانية

### التهيئة
```javascript
function initChart() {
    const ctx = document.getElementById('goldChart').getContext('2d');
    goldChart = new Chart(ctx, {
        type: 'line',
        data: {...},
        options: {...}
    });
}
```

### التحديث
```javascript
function updateChart(newPrice) {
    priceHistory.push(newPrice);
    if (priceHistory.length > 20) priceHistory.shift();
    goldChart.update();
}
```

---

## 📱 PWA Configuration

### manifest.json
```json
{
    "name": "Gold & Currency Hub",
    "short_name": "GoldHub",
    "display": "standalone",
    "theme_color": "#090f1c"
}
```

### Service Worker
- تخزين مؤقت للملفات
- العمل بدون إنترنت
- معالجة الإشعارات

---

## 🔄 دورة حياة التطبيق

1. **التحميل الأول**
   - تسجيل Service Worker
   - تحميل البيانات من Firebase
   - تهيئة الرسم البياني

2. **العمل المستمر**
   - التحديث كل 5 ثوان (simulateMarket)
   - جلب API كل 5 دقائق
   - مراقبة Firebase البيانات

3. **التفاعل مع المستخدم**
   - حسابات التحويل
   - التنبيهات
   - المشاركة

---

## 🐛 تصحيح الأخطاء

### أدوات التطوير
```javascript
// في Console
console.log() // السجلات العادية
console.error() // الأخطاء
console.warn() // التحذيرات
```

### مراقب الأخطاء العالمي
```javascript
window.addEventListener('error', (event) => {
    console.error(`خطأ: ${event.message}`);
});
```

---

## 🚀 النشر

### على Vercel/Netlify:
1. دفع الملفات إلى GitHub
2. ربط المستودع
3. تفعيل النشر التلقائي

### على خادم عادي:
1. تحميل الملفات عبر FTP
2. تفعيل HTTPS (مهم!)
3. تكوين service worker

---

## 📚 المراجع والموارد

- [Firebase Documentation](https://firebase.google.com/docs)
- [PWA Documentation](https://developers.google.com/web/progressive-web-apps)
- [Chart.js Documentation](https://www.chartjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)

---

## 🔗 API Keys المطلوبة

```javascript
// Gold API (مجاني)
GOLD_API_KEY = "goldapi-27be1d90d09787c664ff9166a860f5a1-io"

// Firebase (محمي)
firebaseConfig = { /* ... */ }

// Open Exchange Rates (مجاني)
// لا يحتاج مفتاح
```

---

## ✅ قائمة التحقق قبل النشر

- [ ] جميع الأخطاء تم حلها
- [ ] لا توجد تحذيرات في Console
- [ ] Service Worker يعمل
- [ ] الإشعارات تعمل
- [ ] الأسعار تتحدث
- [ ] الرسم البياني يظهر
- [ ] PWA قابل للتثبيت
- [ ] الأداء جيد
- [ ] الأمان مفعل (HTTPS)

---

## 🚨 المشاكل الشائعة والحلول

### مشكلة: Firebase connection refused
**الحل:** تحقق من قوانين الأمان والمصادقة

### مشكلة: Service Worker لا يتسجل
**الحل:** استخدم HTTPS أو localhost فقط

### مشكلة: API Limits reached
**الحل:** زد المدة بين الطلبات أو استخدم خطة مدفوعة

---

**آخر تحديث:** 18 مايو 2026
**الإصدار:** 1.0 (مستقر)
