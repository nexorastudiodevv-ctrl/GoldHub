/* eslint-disable no-restricted-globals */
// استيراد مكتبات Firebase داخل الـ Service Worker
// استخدام Compat SDK لضمان التوافقية العالية في بيئة الـ Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

const firebaseConfig = {
    apiKey: "AIzaSyBLHuPTH3RhwDTdxTDcgFRYPfvXZM3gco8",
    authDomain: "goldhub-1fdb1.firebaseapp.com", // تم تحديث النطاق ليتطابق مع app.js
    projectId: "goldhub-1fdb1",
    storageBucket: "goldhub-1fdb1.appspot.com",
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

const CACHE_NAME = 'gold-hub-v5';
const ASSETS = [
    'index.html',
    'manifest.json',
    'app.js',
    'dist/output.css',
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
    if (e.request.method !== 'GET' || e.request.url.includes('firebaseio.com')) return;

    e.respondWith(
        caches.match(e.request).then((cachedResponse) => {
            if (cachedResponse) {
                // إرجاع النسخة المخزنة فوراً للسرعة
                return cachedResponse;
            }

            return fetch(e.request).then((response) => {
                // التحقق من صحة الاستجابة قبل تخزينها
                if (!response || response.status !== 200 || (response.type !== 'basic' && response.type !== 'cors')) {
                    return response;
                }

                const responseToCache = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(e.request, responseToCache);
                });

                return response;
            }).catch(() => {
                // في حالة فشل الإنترنت تماماً وعدم وجود كاش
                if (e.request.mode === 'navigate') {
                    return caches.match('index.html');
                }
                return new Response("Offline", { status: 503 });
            });
        })
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