/* eslint-disable no-restricted-globals */
// استيراد مكتبات Firebase داخل الـ Service Worker
// استخدام Compat SDK لضمان التوافقية العالية في بيئة الـ Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

const firebaseConfig = {
    apiKey: "AIzaSyBLHuPTH3RhwDTdxTDcgFRYPfvXZM3gco8",
    authDomain: "gold-hub.com", // تحديث النطاق هنا أيضاً
    projectId: "goldhub-1fdb1",
    storageBucket: "goldhub-1fdb1.firebasestorage.app",
    messagingSenderId: "646245822812",
    appId: "1:646245822812:web:54a6380fa2eafec0391199",
    databaseURL: "https://goldhub-1fdb1-default-rtdb.firebaseio.com/"
};

let messaging = null;

try {
    firebase.initializeApp(firebaseConfig);
    // التحقق من دعم المتصفح للمراسلة قبل البدء
    messaging = firebase.messaging();
    console.log("🚀 Firebase Messaging initialized in SW");
} catch (err) {
    console.error("⚠️ Failed to initialize Firebase Messaging in SW:", err);
}

const CACHE_NAME = 'gold-hub-v2';
const ASSETS = [
    'index.html',
    'manifest.json',
    'app.js',
    'icon.png',
    'icon.webp',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://cdn.jsdelivr.net/npm/chart.js',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
    'https://cdn.jsdelivr.net/npm/quill@1.3.6/dist/quill.snow.css'
];

// تثبيت الـ Service Worker وتخزين الملفات الأساسية
self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).catch(() => {
            console.log('Cache installation completed with some files unavailable');
        })
    );
    self.skipWaiting();
});

// تنظيف الـ Cache القديم
self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then(names => {
            return Promise.all(
                names.map(name => {
                    if (name !== CACHE_NAME) {
                        return caches.delete(name);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// استراتيجية الاستجابة: حاول الشبكة أولاً، إذا فشلت استخدم التخزين المؤقت
self.addEventListener('fetch', (e) => {
    // تجاهل الطلبات التي ليست من نوع GET (مثل رفع الصور عبر POST) لأن التخزين المؤقت لا يدعمها
    if (e.request.method !== 'GET') return;

    e.respondWith(
        fetch(e.request)
            .then(response => {
                // السماح بتخزين الأصول الخارجية (CORS) مثل الأعلام
                if (!response || response.status !== 200) {
                    return response;
                }
                const resClone = response.clone();
                if (e.request.url.startsWith('http')) {
                    caches.open(CACHE_NAME).then(cache => cache.put(e.request, resClone));
                }
                return response;
            })
            .catch(() => caches.match(e.request).then(res => res || new Response("Offline Content Unavailable", { status: 404 })))
    );
});

// التعامل مع الرسائل الواردة في الخلفية
if (messaging) {
    messaging.onBackgroundMessage((payload) => {
        console.log('Received background message: ', payload);
        const notificationTitle = payload?.notification?.title || "تحديث من GoldHub";
        const notificationOptions = {
            body: payload?.notification?.body || "توجد تحديثات جديدة في أسعار السوق.",
            icon: payload?.notification?.icon || 'icon.png',
            badge: 'icon.png'
        };
        self.registration.showNotification(notificationTitle, notificationOptions);
    });
}

// التعامل مع إشعارات النظام في الخلفية
self.addEventListener('notificationclick', (e) => {
    e.notification.close();
    e.waitUntil(
        clients.matchAll({ type: 'window' }).then(clientList => {
            // إذا كان هناك نافذة مفتوحة، ركز عليها
            for (let i = 0; i < clientList.length; i++) {
                if (clientList[i].url === '/' && 'focus' in clientList[i]) {
                    return clientList[i].focus();
                }
            }
            // إذا لم توجد نافذة، افتح واحدة جديدة
            if (clients.openWindow) {
                return clients.openWindow('/');
            }
        })
    );
});

// معالج الأخطاء العامة
self.addEventListener('error', (event) => {
    console.error('Service Worker Error:', event);
});