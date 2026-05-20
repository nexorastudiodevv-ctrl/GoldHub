// استيراد مكتبات Firebase بشكل صحيح
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut, sendPasswordResetEmail, setPersistence, browserSessionPersistence, browserLocalPersistence } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getDatabase, ref, set, onValue, remove } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";
import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging.js";

// مراقب الأخطاء العالمي
window.addEventListener('error', (event) => {
    console.error(`🔴 خطأ برمجي: ${event.message} \nفي الملف: ${event.filename} \nالسطر: ${event.lineno}`);
});

// مراقب أخطاء الوعود
window.addEventListener('unhandledrejection', (event) => {
    console.error('🔴 خطأ في الوعود (Promise):', event.reason);
    if (typeof showToast === 'function') showToast("حدث خطأ غير متوقع: " + event.reason.message);
});

// إعدادات Firebase الحقيقية
const firebaseConfig = {
    apiKey: "AIzaSyBLHuPTH3RhwDTdxTDcgFRYPfvXZM3gco8",
    authDomain: "goldhub-1fdb1.firebaseapp.com",
    projectId: "goldhub-1fdb1",
    storageBucket: "goldhub-1fdb1.firebasestorage.app",
    messagingSenderId: "646245822812",
    appId: "1:646245822812:web:54a6380fa2eafec0391199",
    measurementId: "G-SN6Q2JB1RB",
    databaseURL: "https://goldhub-1fdb1-default-rtdb.firebaseio.com/"
};

// تهيئة Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);
const analytics = getAnalytics(app);
const messaging = getMessaging(app);
const pricesRef = ref(db, 'market_prices');
const articlesRef = ref(db, 'articles');
let editArticleId = null;
let allArticlesData = {};
let quill;

// ربط رموز العملات برموز الدول للحصول على الأعلام
const currencyToCountryCode = {
    "USD": "US", "EUR": "EU", "EGP": "EG", "SAR": "SA", "GBP": "GB",
    "XAU": "gold", "XAG": "silver", "XPT": "platinum",
    "JPY": "JP", "AED": "AE", "KWD": "KW", "QAR": "QA", "BHD": "BH", 
    "OMR": "OM", "JOD": "JO", "TRY": "TR", "CAD": "CA", "AUD": "AU", 
    "CHF": "CH", "CNY": "CN", "XAF": "CM", "XOF": "SN", "XPF": "PF", 
    "XCD": "LC", "ANG": "CW"
};

// نظام الترجمة
const translations = {
    ar: {
        gold_oz: "أوقية ذهب", silver_oz: "أوقية فضة", platinum_oz: "أوقية بلاتين",
        home: "الرئيسية", gold_markets: "أسواق الذهب", currency_markets: "أسعار العملات",
        admin_panel: "لوحة التحكم", wallet: "المحفظة الشخصية", about: "من نحن", contact: "اتصل بنا",
        privacy: "سياسة الخصوصية", live_market: "سوق المال المباشر", sub_heading: "تحديثات فورية لأسعار الذهب العالمية والمعادن",
        up: "صعود", down: "هبوط", stable: "ثابت", live_update: "تحديث مباشر", share: "مشاركة السعر",
        converter: "محول العملات السريع", result: "النتيجة التقريبية", search: "ابحث عن عملة أو عيار..."
    },
    en: {
        gold_oz: "Gold Ounce", silver_oz: "Silver Ounce", platinum_oz: "Platinum Ounce",
        home: "Home", gold_markets: "Gold Markets", currency_markets: "Currencies",
        admin_panel: "Admin Panel", wallet: "My Wallet", about: "About Us", contact: "Contact Us",
        privacy: "Privacy Policy", live_market: "Live Market Hub", sub_heading: "Real-time updates for global gold and metal prices",
        up: "Up", down: "Down", stable: "Stable", live_update: "Live Update", share: "Share Price",
        converter: "Currency Converter", result: "Approximate Result", search: "Search currency or carat..."
    }
};

let currentLang = localStorage.getItem('site_lang') || 'ar';

// كاش لعناصر DOM
const domElements = {
    mainGoldPrice: document.getElementById('mainGoldPrice'),
    price24k: document.getElementById('price-24k'),
    price21k: document.getElementById('price-21k'),
    price21kRaw: document.getElementById('price-21k-raw'),
    price18k: document.getElementById('price-18k'),
    trend24k: document.getElementById('trend-24k'),
    trend21k: document.getElementById('trend-21k'),
    trend18k: document.getElementById('trend-18k'),
    silverPrice: document.getElementById('silverPrice'),
    platinumPrice: document.getElementById('platinumPrice'),
    silverTrend: document.getElementById('silverTrend'),
    platinumTrend: document.getElementById('platinumTrend'),
    currencyList: document.getElementById('currencyList'),
    conversionResult: document.getElementById('conversionResult'),
    amountInput: document.getElementById('amountInput'),
    baseCurrency: document.getElementById('baseCurrency'),
    targetCurrency: document.getElementById('targetCurrency'),
    conversionResultDisplay: document.getElementById('conversionResultDisplay'),
    baseFlagImg: document.getElementById('baseFlagImg'),
    targetFlagImg: document.getElementById('targetFlagImg'),
    swapCurrenciesBtn: document.getElementById('swapCurrenciesBtn'),
    apiLogs: document.getElementById('apiLogs'),
    articleModal: document.getElementById('articleModal'),
    articleModalTitle: document.getElementById('articleModalTitle'),
    articleModalImage: document.getElementById('articleModalImage'),
    articleModalDate: document.getElementById('articleModalDate'),
    articleModalContent: document.getElementById('articleModalContent'),
    adminPanel: document.getElementById('adminPanel'),
    loginModal: document.getElementById('loginModal'),
    scrollToTopBottomBtn: document.getElementById('scrollToTopBottomBtn'),
    scrollIcon: document.getElementById('scrollIcon'),
    searchInput: document.getElementById('searchInput'),
    notificationsBell: document.getElementById('notificationsBell'),
    notificationsDropdown: document.getElementById('notificationsDropdown'),
    notificationsList: document.getElementById('notificationsList'),
    bellDot: document.getElementById('bellDot'),
    converterSearch: document.getElementById('converterSearch'),
    editorContainer: document.getElementById('editor-container'),
    articlePreviewContainer: document.getElementById('articlePreviewContainer')
};

// وظيفة لإضافة إشعار جديد إلى القائمة
window.addInternalNotification = (title, id, type = 'article') => {
    const list = domElements.notificationsList;
    const dot = domElements.bellDot;
    if (!list || !dot) return;

    // إظهار النقطة الحمراء
    dot.classList.remove('hidden');

    // إزالة رسالة "لا توجد إشعارات"
    const emptyMsg = list.querySelector('p.italic');
    if (emptyMsg) emptyMsg.remove();

    // منع التكرار
    if (document.getElementById(`noti-${id}`)) return;

    const entry = document.createElement('div');
    entry.id = `noti-${id}`;
    entry.className = "p-3 bg-slate-900/60 border border-slate-800/50 rounded-xl hover:border-cyan-500/30 transition cursor-pointer flex gap-3 items-center text-right";
    entry.onclick = () => {
        if (type === 'article') window.openArticleModal(id);
        domElements.notificationsDropdown.classList.add('hidden');
    };
    
    const icon = type === 'article' ? 'fa-newspaper' : 'fa-chart-line';
    entry.innerHTML = `
        <div class="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400 shrink-0">
            <i class="fa-solid ${icon} text-xs"></i>
        </div>
        <div class="overflow-hidden">
            <p class="text-[11px] font-bold text-slate-200 truncate">${title}</p>
            <p class="text-[9px] text-slate-500 mt-0.5">${type === 'article' ? 'مقال جديد متاح الآن' : 'تحديث جديد في الأسعار'}</p>
        </div>
    `;
    list.prepend(entry);
};

// دالة مساعدة للحصول على رابط العلم بشكل آمن لتجنب أخطاء 404
function getSafeFlagUrl(code) {
    const country = currencyToCountryCode[code];
    if (['gold', 'silver', 'platinum'].includes(country)) {
        return 'icon.webp';
    }
    const finalCode = country || (code.startsWith('X') ? null : code.substring(0, 2));
    if (!finalCode) return 'icon.webp';
    return `https://flagcdn.com/w40/${finalCode.toLowerCase()}.png`;
}

const OUNCE_TO_GRAM = 31.1034768;
let exchangeRates = JSON.parse(localStorage.getItem('last_rates')) || {
    "USD": 1, "EUR": 0.92, "EGP": 48.50, "SAR": 3.75, "AED": 3.67, "GBP": 0.79,
    "KWD": 0.31, "QAR": 3.64, "TRY": 32.50, "JPY": 156.0, "CAD": 1.36,
    "BHD": 0.37, "OMR": 0.38, "JOD": 0.71, "AUD": 1.50, "CHF": 0.91, 
    "CNY": 7.24, "TRY": 32.50
};

let goldPrice = parseFloat(localStorage.getItem('last_gold_price')) || 2350.75;
let silverPrice = parseFloat(localStorage.getItem('last_silver_price')) || 28.00;
let platinumPrice = parseFloat(localStorage.getItem('last_platinum_price')) || 980.00;

// تهيئة أولية لأسعار المعادن في كائن التحويل لضمان عمل المحول فوراً
exchangeRates["XAU"] = 1 / goldPrice;
exchangeRates["XAG"] = 1 / silverPrice;
exchangeRates["XPT"] = 1 / platinumPrice;

let isManualMode = false;
let caratPrices = { k24: goldPrice / OUNCE_TO_GRAM, k21: (goldPrice / OUNCE_TO_GRAM) * 0.875, k18: (goldPrice / OUNCE_TO_GRAM) * 0.75 };
let previousSilverPrice = silverPrice;
let previousPlatinumPrice = platinumPrice;
let silverCaratPrices = { s999: 0, s925: 0, s900: 0, s800: 0 };
let makingCharges = { k24: 0, k21: 0, k18: 0 };
let priceHistory = [goldPrice];
let silverPriceHistory = [silverPrice];
let timeLabels = [new Date().toLocaleTimeString('ar-EG', {hour: '2-digit', minute:'2-digit'})];
let goldChart;
let silverChart;
let previousGoldPrice = goldPrice;
let previousCaratPrices = { k24: 0, k21: 0, k18: 0 };
const ADMIN_EMAIL = "alfaydahmd02@gmail.com";

function addApiLog(msg) {
    const container = domElements.apiLogs;
    if (!container) return;
    const time = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const entry = document.createElement('div');
    entry.className = "flex justify-between border-b border-slate-800/50 pb-1 animate-fade-in";
    entry.innerHTML = `<span>${msg}</span><span class="text-slate-600">${time}</span>`;
    const placeholder = container.querySelector('p.italic');
    if (placeholder) placeholder.remove();
    container.prepend(entry);
    if (container.children.length > 20) container.lastElementChild.remove();
}

// تطبيق الترجمة على العناصر التي تحمل data-i18n
window.applyTranslations = () => {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[currentLang][key]) {
            if (el.tagName === 'INPUT') el.placeholder = translations[currentLang][key];
            else el.textContent = translations[currentLang][key];
        }
    });
    document.documentElement.dir = currentLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = currentLang;
};

// تحديث خيارات محول العملات مع ميزة البحث
function renderConverterOptions() {
    // جلب العناصر مباشرة لضمان عدم وجود أخطاء Null
    const baseEl = document.getElementById('baseCurrency');
    const targetEl = document.getElementById('targetCurrency');
    const searchEl = document.getElementById('converterSearch');

    if (!baseEl || !targetEl) return;

    const searchTerm = searchEl ? searchEl.value.toLowerCase() : "";
    const currentBase = baseEl ? baseEl.value : "USD";
    const currentTarget = targetEl ? targetEl.value : "EGP";
    
    // دمج العملات والمعادن في قائمة واحدة مرتبة
    let availableCurrencies = [...new Set(["USD", "XAU", "XAG", "XPT", ...Object.keys(exchangeRates)])];
    availableCurrencies = availableCurrencies.sort();

    const favorites = JSON.parse(localStorage.getItem('favoriteCurrencies')) || [];

    const filteredFavorites = favorites.filter(code => 
        availableCurrencies.includes(code) && code.toLowerCase().includes(searchTerm)
    );
    const filteredNonFavorites = availableCurrencies.filter(code => 
        !favorites.includes(code) && code.toLowerCase().includes(searchTerm)
    );

    let optionsHtml = '';

    if (filteredFavorites.length > 0) {
        optionsHtml += `<optgroup label="⭐ المفضلة">`;
        optionsHtml += filteredFavorites.map(code => 
            `<option value="${code}">${getFlagEmoji(code)} ${code}</option>`
        ).join('');
        optionsHtml += `</optgroup>`;
    }

    if (filteredNonFavorites.length > 0) {
        if (filteredFavorites.length > 0) {
            optionsHtml += `<optgroup label="العملات الأخرى">`;
        }
        optionsHtml += filteredNonFavorites.map(code => 
            `<option value="${code}">${getFlagEmoji(code)} ${code}</option>`
        ).join('');
        if (filteredFavorites.length > 0) {
            optionsHtml += `</optgroup>`;
        }
    }

    baseEl.innerHTML = optionsHtml;
    targetEl.innerHTML = optionsHtml;

    baseEl.value = currentBase;
    targetEl.value = currentTarget;
}

// عرض قائمة العملات في الواجهة
function renderCurrencies() {
    if (!domElements.currencyList) return;
    const searchTerm = domElements.searchInput?.value.toLowerCase() || "";
    
    const favorites = JSON.parse(localStorage.getItem('favoriteCurrencies')) || [];

    // تصفية العملات واستبعاد المعادن من القائمة الرئيسية إذا كانت قيمتها صغيرة جداً للعرض العادي
    const filteredRates = Object.entries(exchangeRates).filter(([code]) => {
        const isMetal = ['XAU', 'XAG', 'XPT'].includes(code);
        return code.toLowerCase().includes(searchTerm) && !isMetal;
    });

    domElements.currencyList.innerHTML = filteredRates.map(([code, rate]) => {
        const flagUrl = getSafeFlagUrl(code);
        const isFavorite = favorites.includes(code);
        const starIconClass = isFavorite ? 'fa-solid fa-star text-yellow-400' : 'fa-regular fa-star text-slate-500 group-hover:text-yellow-400';

        return `
            <div class="flex items-center justify-between p-4 bg-slate-900/40 border border-slate-800 rounded-xl hover:border-cyan-500/30 transition-all group">
                <div class="flex items-center gap-3">
                    <img src="${flagUrl}" class="w-8 h-6 rounded object-cover shadow-sm" alt="${code}" onerror="this.src='https://cdn-icons-png.flaticon.com/512/272/272525.png'">
                    <div>
                        <div class="font-bold text-slate-100">${code}</div>
                        <div class="flex items-center gap-1.5 text-[9px] text-emerald-500/90 font-bold uppercase tracking-wider">
                            <span class="relative flex h-1.5 w-1.5">
                                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span class="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                            </span>
                            ${translations[currentLang].live_update}
                        </div>
                    </div>
                </div>
                <div class="flex items-center gap-3">
                    <button class="text-lg p-1 focus:outline-none" onclick="toggleFavoriteCurrency('${code}')">
                        <i class="${starIconClass}"></i>
                    </button>
                    <div class="text-right">
                        <div class="text-lg font-mono font-bold text-cyan-400 group-hover:scale-105 transition-transform">${rate.toFixed(2)}</div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// دالة لتبديل حالة العملة كمفضلة
window.toggleFavoriteCurrency = (currencyCode) => {
    let favorites = JSON.parse(localStorage.getItem('favoriteCurrencies')) || [];
    if (favorites.includes(currencyCode)) favorites = favorites.filter(code => code !== currencyCode);
    else favorites.push(currencyCode);
    localStorage.setItem('favoriteCurrencies', JSON.stringify(favorites));
    showToast(favorites.includes(currencyCode) ? `${currencyCode} أضيفت للمفضلة` : `${currencyCode} أزيلت من المفضلة`);
    renderConverterOptions(); // تحديث قوائم المحول
    renderCurrencies(); // تحديث قائمة العملات الرئيسية (لتغيير أيقونة النجمة)
};

// طلب الإذن بالإشعارات والحصول على التوكن
async function initPushNotifications(registration) {
    try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            // استبدل بمفتاح VAPID الخاص بك من Firebase Console
            const token = await getToken(messaging, { 
                vapidKey: 'BMvP9_J0V6-m9_9j9-GvE_REPLACE_WITH_ACTUAL_KEY',
                serviceWorkerRegistration: registration
            });
            
            if (token) {
                console.log('✅ FCM Token:', token);
                const tokenPath = `fcm_tokens/${token.replace(/\./g, '_')}`;
                set(ref(db, tokenPath), {
                    token: token,
                    lastUpdated: Date.now(),
                    active: true
                });
            }
        }
    } catch (error) {
        console.warn('⚠️ Push Notifications setup failed:', error.message);
    }
}

async function fetchApiPrices() {
    if (isManualMode) return;
    addApiLog("📡 جاري جلب البيانات من API...");
    try {
        previousGoldPrice = goldPrice;
        previousCaratPrices = { ...caratPrices };
        
        // استخدام try-catch داخلي لكل طلب لضمان عدم توقف البقية عند فشل أحدهم (CORS)
        const [currRes, goldRes] = await Promise.allSettled([
            fetch('https://open.er-api.com/v6/latest/USD'),
            fetch('https://api.binance.com/api/v3/ticker/price?symbol=PAXGUSDT')
        ]);
        if (currRes.status === 'fulfilled' && currRes.value.ok) {
            const currData = await currRes.value.json();
            if (currData?.rates) {
                // تحديث كائن الأسعار بجميع العملات التي يوفرها الـ API
                exchangeRates = { ...exchangeRates, ...currData.rates };
                
                // التأكد من وجود الدولار كقاعدة
                exchangeRates["USD"] = 1;

                // دمج أسعار الفضة والبلاتين من الـ API لضمان دقة المحول
                if (currData.rates.XAG) exchangeRates["XAG"] = currData.rates.XAG;
                if (currData.rates.XPT) exchangeRates["XPT"] = currData.rates.XPT;

                if (currData.rates.XAG) {
                    previousSilverPrice = silverPrice;
                    silverPrice = 1 / currData.rates.XAG; // تحويل المعدل إلى سعر أوقية بالدولار
                    localStorage.setItem('last_silver_price', silverPrice);
                }
                if (currData.rates.XPT) {
                    previousPlatinumPrice = platinumPrice;
                    platinumPrice = 1 / currData.rates.XPT;
                    localStorage.setItem('last_platinum_price', platinumPrice);
                }
                localStorage.setItem('last_rates', JSON.stringify(exchangeRates));
            }
            renderConverterOptions();
        }
        
        if (goldRes.status === 'fulfilled' && goldRes.value.ok) {
            const goldData = await goldRes.value.json();
            if (goldData?.price) {
                goldPrice = parseFloat(goldData.price);
                // تحديث معدل الذهب في كائن الصرف (1 دولار = كم أوقية)
                exchangeRates["XAU"] = 1 / goldPrice;
                localStorage.setItem('last_gold_price', goldPrice);
                const currentK24 = goldPrice / OUNCE_TO_GRAM;
                caratPrices = { k24: currentK24, k21: currentK24 * 0.875, k18: currentK24 * 0.75 };
            }
        }
        updateUI();
    } catch (error) {
        addApiLog(`❌ فشل التحديث: ${error.message}`);
    }
}

function initChart() {
    const ctx = document.getElementById('goldChart').getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 200);
    gradient.addColorStop(0, 'rgba(6, 182, 212, 0.3)');
    gradient.addColorStop(1, 'rgba(6, 182, 212, 0)');
    goldChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: timeLabels,
            datasets: [{
                data: priceHistory,
                borderColor: '#06b6d4',
                borderWidth: 3,
                fill: true,
                backgroundColor: gradient,
                tension: 0.4,
                pointRadius: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { x: { display: false }, y: { ticks: { color: '#64748b', font: { size: 10 } } } }
        }
    });
}

function updateChart(newPrice) {
    if (!goldChart) return;
    priceHistory.push(newPrice);
    timeLabels.push(new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }));
    if (priceHistory.length > 20) { priceHistory.shift(); timeLabels.shift(); }
    goldChart.update('none');
}

onValue(pricesRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
        previousGoldPrice = goldPrice;
        previousCaratPrices = { ...caratPrices };
        goldPrice = data.gold;
        exchangeRates = data.rates || exchangeRates;
        if (data.silver) { previousSilverPrice = silverPrice; silverPrice = data.silver; }
        if (data.carats) caratPrices = { ...data.carats };
        if (data.makingCharges) makingCharges = data.makingCharges;
        isManualMode = true;
        renderConverterOptions();
        updateUI();
    } else {
        isManualMode = false;
        fetchApiPrices();
    }
});

// مراقبة المقالات من Firebase
onValue(articlesRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) {
        if (domElements.notificationsList) domElements.notificationsList.innerHTML = `<p class="text-[10px] text-slate-500 text-center py-6 italic">لا توجد إشعارات جديدة حالياً</p>`;
        return;
    }
    allArticlesData = data;
    const articlesArray = Object.entries(data).reverse();
    
    // إضافة آخر 3 مقالات كإشعارات تلقائية
    articlesArray.slice(0, 3).forEach(([id, art]) => addInternalNotification(art.title, id));

    const articleHTML = (id, art) => `
        <div class="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden hover:border-cyan-500/50 transition-all cursor-pointer group" onclick="openArticleModal('${id}')">
            <div class="relative overflow-hidden h-48">
                <img src="${art.image}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="${art.title}">
            </div>
            <div class="p-6">
                <h3 class="text-xl font-bold mb-2 text-slate-100">${art.title}</h3>
                <p class="text-slate-400 text-sm line-clamp-2">${art.summary || 'اقرأ المزيد حول هذا الموضوع...'}</p>
            </div>
        </div>`;

    // تحديث صفحة المقالات الكاملة
    const fullList = document.getElementById('articlesList');
    if (fullList) {
        fullList.innerHTML = articlesArray.map(([id, art]) => articleHTML(id, art)).join('');
    }

    // تحديث قسم أحدث المقالات في الرئيسية (أول 3 مقالات فقط)
    const latestList = document.getElementById('latestArticlesList');
    if (latestList) {
        latestList.innerHTML = articlesArray.slice(0, 3).map(([id, art]) => articleHTML(id, art)).join('');
    }
    
    if (auth.currentUser?.email === ADMIN_EMAIL) renderAdminArticles();
});

function calculateConversion() {
    const amountInput = document.getElementById('amountInput');
    const baseCurrency = document.getElementById('baseCurrency');
    const targetCurrency = document.getElementById('targetCurrency');
    const resultDisplay = document.getElementById('conversionResultDisplay');
    const resultText = document.getElementById('conversionResult');

    if (!amountInput || !baseCurrency || !targetCurrency) return;

    const amount = parseFloat(amountInput.value) || 0;
    const fromCurrency = baseCurrency.value;
    const toCurrency = targetCurrency.value;

    // مزامنة أسعار المعادن الحالية قبل إجراء عملية التحويل
    if (goldPrice > 0) exchangeRates["XAU"] = 1 / goldPrice;
    if (silverPrice > 0) exchangeRates["XAG"] = 1 / silverPrice;
    if (platinumPrice > 0) exchangeRates["XPT"] = 1 / platinumPrice;
    
    // تأكيد وجود الدولار لتجنب القسمة على صفر
    exchangeRates["USD"] = 1;

    const fromRate = exchangeRates[fromCurrency] || 0;
    const toRate = exchangeRates[toCurrency] || 0;

    if (fromRate === 0 || toRate === 0) {
        if (resultText) resultText.textContent = "---";
        return;
    }

    const result = amount * (toRate / fromRate);
    const isMetal = ['XAU', 'XAG', 'XPT'].includes(toCurrency);
    const precision = isMetal ? 4 : 2;
    
    const formatted = result.toLocaleString('en-US', {
        minimumFractionDigits: precision,
        maximumFractionDigits: precision
    });

    if (resultDisplay) resultDisplay.textContent = formatted;
    if (resultText) resultText.textContent = `${formatted} ${toCurrency}`;

    // تحديث الأعلام الصورية في الواجهة
    if (domElements.baseFlagImg) {
        domElements.baseFlagImg.src = getSafeFlagUrl(fromCurrency);
    }
    if (domElements.targetFlagImg) {
        domElements.targetFlagImg.src = getSafeFlagUrl(toCurrency);
    }
}

function updateUI() {
    const egpRate = exchangeRates["EGP"] || 1;

    // تحديث الرسم البياني فقط عند استدعاء تحديث الواجهة ببيانات جديدة
    updateChart(goldPrice);
    
    // تحديث السعر الرئيسي بالدولار
    if (domElements.mainGoldPrice) {
        domElements.mainGoldPrice.textContent = `$${goldPrice.toLocaleString(undefined, {minimumFractionDigits: 2})}`;
    }
    
    const baseK24 = caratPrices.k24 || (goldPrice / OUNCE_TO_GRAM);
    const baseK21 = caratPrices.k21 || (baseK24 * 0.875);
    const baseK18 = caratPrices.k18 || (baseK24 * 0.75);

    // تحديث أسعار الذهب بالجنيه المصري
    if (domElements.price24k) domElements.price24k.textContent = `${(baseK24 * egpRate + (makingCharges.k24 || 0)).toLocaleString(undefined, {minimumFractionDigits: 2})} EGP`;
    if (domElements.price21k) domElements.price21k.textContent = `${(baseK21 * egpRate + (makingCharges.k21 || 0)).toLocaleString(undefined, {minimumFractionDigits: 2})} EGP`;
    if (domElements.price18k) domElements.price18k.textContent = `${(baseK18 * egpRate + (makingCharges.k18 || 0)).toLocaleString(undefined, {minimumFractionDigits: 2})} EGP`;
    
    // تحديث أسعار المعادن الأخرى
    if (domElements.silverPrice) domElements.silverPrice.textContent = `$${silverPrice.toFixed(2)}`;
    if (domElements.platinumPrice) domElements.platinumPrice.textContent = `$${platinumPrice.toFixed(2)}`;
    
    // تحديث عيارات الفضة بالجنيه
    const silverGramEGP = (silverPrice / OUNCE_TO_GRAM) * egpRate;
    const silverElements = {
        'silver-999': 0.999, 'silver-925': 0.925, 'silver-900': 0.900, 'silver-800': 0.800
    };
    Object.entries(silverElements).forEach(([id, multiplier]) => {
        const el = document.getElementById(id);
        if (el) el.textContent = `${(silverGramEGP * multiplier).toFixed(2)} EGP`;
    });

    // تحديث مؤشرات التغيير
    const updateTrend = (el, current, previous) => {
        if (!el) return;
        const isUp = current >= previous;
        el.innerHTML = `<i class="fa-solid fa-caret-${isUp ? 'up text-green-500' : 'down text-red-500'}"></i>`;
    };

    updateTrend(domElements.trend24k, goldPrice, previousGoldPrice);
    updateTrend(domElements.trend21k, baseK21, previousCaratPrices.k21);
    updateTrend(domElements.trend18k, baseK18, previousCaratPrices.k18);
    updateTrend(domElements.silverTrend, silverPrice, previousSilverPrice);
    updateTrend(domElements.platinumTrend, platinumPrice, previousPlatinumPrice);

    if (domElements.targetCurrency && !domElements.targetCurrency.options.length) renderConverterOptions();
    renderCurrencies();
    calculateConversion();
}

function simulateMarket() {
    let alertThreshold = localStorage.getItem('goldPriceAlert') ? parseFloat(localStorage.getItem('goldPriceAlert')) : null;
    if (alertThreshold && goldPrice >= alertThreshold) {
        if (Notification.permission === "granted") new Notification("تنبيه الذهب", { body: `وصل السعر إلى $${goldPrice}` });
        showToast(`وصل السعر إلى $${goldPrice}`);
        localStorage.removeItem('goldPriceAlert');
    }
}

window.showToast = (msg) => {
    const toast = document.getElementById('alertToast');
    document.getElementById('toastMessage').textContent = msg;
    toast.classList.remove('-translate-y-32', 'opacity-0');
    toast.classList.add('translate-y-0', 'opacity-100');
    setTimeout(() => { toast.classList.add('-translate-y-32', 'opacity-0'); toast.classList.remove('translate-y-0', 'opacity-100'); }, 4000);
};

// التنقل بين الأقسام
window.showSection = (sectionName) => {
    const sections = ['goldSection', 'currencySection', 'walletSection', 'articlesSection', 'aboutSection', 'contactSection', 'privacySection'];
    sections.forEach(s => document.getElementById(s)?.classList.add('hidden'));
    
    if (sectionName === 'home') {
        document.getElementById('goldSection').classList.remove('hidden');
        document.getElementById('currencySection').classList.remove('hidden');
        document.getElementById('latestArticlesHome')?.classList.remove('hidden');
    } else {
        document.getElementById(sectionName + 'Section')?.classList.remove('hidden');
        document.getElementById('latestArticlesHome')?.classList.add('hidden');
    }
};

document.addEventListener('DOMContentLoaded', () => {
    // تغليف التهيئة بـ try-catch لضمان عمل التنقل حتى لو فشل الرسم البياني
    try {
        applyTranslations();
        // 1. بناء القوائم أولاً
        renderConverterOptions();
        // 2. تهيئة الرسم البياني
        if (typeof Chart !== 'undefined') initChart();
        // 3. تحديث واجهة المستخدم والحسابات
        updateUI(); 
        handleScrollToTopBottom();
    } catch (err) {
        console.error("⚠️ فشل في تهيئة بعض الخصائص البصرية:", err);
    }

    // --- أحداث مركز الإشعارات ---
    domElements.notificationsBell?.addEventListener('click', (e) => {
        e.stopPropagation();
        domElements.notificationsDropdown?.classList.toggle('hidden');
        domElements.bellDot?.classList.add('hidden'); // إخفاء النقطة عند فتح القائمة
    });

    // إغلاق الإشعارات عند النقر في الخارج
    document.addEventListener('click', (e) => {
        if (!domElements.notificationsDropdown?.contains(e.target) && e.target !== domElements.notificationsBell) {
            domElements.notificationsDropdown?.classList.add('hidden');
        }
    });

    document.getElementById('clearNotifications')?.addEventListener('click', () => {
        if (domElements.notificationsList) {
            domElements.notificationsList.innerHTML = `<p class="text-[10px] text-slate-500 text-center py-6 italic">لا توجد إشعارات جديدة حالياً</p>`;
        }
        domElements.bellDot?.classList.add('hidden');
    });

    // إظهار القسم الرئيسي افتراضياً
    showSection('home');

    // تسجيل الـ Service Worker وطلب إذن الإشعارات
    if ('serviceWorker' in navigator) {
        // استخدام المسار النسبي الصحيح للـ Service Worker
        navigator.serviceWorker.register('./sw.js')
            .then((registration) => {
                console.log('✅ Service Worker جاهز');
                initPushNotifications(registration);
            });
    }

    setInterval(simulateMarket, 5000);
    setInterval(() => { if (!isManualMode) fetchApiPrices(); }, 60000);
    
    // --- أحداث لوحة التحكم ---
    document.getElementById('searchInput')?.addEventListener('input', renderCurrencies);
    document.getElementById('converterSearch')?.addEventListener('input', renderConverterOptions);
    document.getElementById('amountInput')?.addEventListener('input', calculateConversion);
    document.getElementById('baseCurrency')?.addEventListener('change', calculateConversion);
    document.getElementById('targetCurrency')?.addEventListener('change', calculateConversion);
    document.getElementById('amountInput')?.addEventListener('change', calculateConversion);

    // ميزة تبديل العملات
    domElements.swapCurrenciesBtn?.addEventListener('click', () => {
        const temp = domElements.baseCurrency.value;
        domElements.baseCurrency.value = domElements.targetCurrency.value;
        domElements.targetCurrency.value = temp;
        calculateConversion();
    });
    
    // إغلاق مودال المقال
    document.getElementById('closeArticleModalBtn')?.addEventListener('click', () => domElements.articleModal.classList.add('hidden'));

    // فتح لوحة التحكم أو تسجيل الدخول
    document.getElementById('openAdminBtn').addEventListener('click', () => {
        if (auth.currentUser?.email === ADMIN_EMAIL) {
            domElements.adminPanel.classList.remove('hidden');
            // تعبئة القيم الحالية في المدخلات اليدوية عند الفتح
            document.getElementById('manualGoldPrice').value = goldPrice;
            document.getElementById('manualSilverPrice').value = silverPrice;
            document.getElementById('manualEGP').value = exchangeRates.EGP;
            document.getElementById('manualSAR').value = exchangeRates.SAR;
            document.getElementById('manualEUR').value = exchangeRates.EUR;
        } else {
            domElements.loginModal.classList.remove('hidden');
        }
    });

    // إغلاق لوحة التحكم
    document.getElementById('closeAdminBtn')?.addEventListener('click', () => domElements.adminPanel.classList.add('hidden'));
    document.getElementById('closeLoginBtn')?.addEventListener('click', () => domElements.loginModal.classList.add('hidden'));

    // تهيئة محرر Quill
    if (document.getElementById('editor-container')) {
        quill = new Quill('#editor-container', {
            theme: 'snow',
            placeholder: 'اكتب محتوى المقال هنا...',
            modules: { toolbar: [['bold', 'italic', 'underline'], ['link', 'image'], [{ 'list': 'ordered'}, { 'list': 'bullet' }], [{ 'direction': 'rtl' }]] }
        });
    }

    // معالجة تسجيل الدخول للمدير
    document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const spinner = document.getElementById('loginSpinner');
        spinner.classList.remove('hidden');
        try {
            await signInWithEmailAndPassword(auth, document.getElementById('loginEmail').value, document.getElementById('loginPassword').value);
            domElements.loginModal.classList.add('hidden');
            domElements.adminPanel.classList.remove('hidden');
            showToast("تم تسجيل الدخول بنجاح");
        } catch (err) {
            alert("خطأ في بيانات الدخول: " + err.message);
        } finally {
            spinner.classList.add('hidden');
        }
    });

    // تسجيل الخروج
    document.getElementById('logoutBtn')?.addEventListener('click', async () => {
        await signOut(auth);
        domElements.adminPanel.classList.add('hidden');
        showToast("تم تسجيل الخروج");
    });

    // إضافة/تعديل مقال
    document.getElementById('addArticleBtn')?.addEventListener('click', async () => {
        const title = document.getElementById('articleTitle').value;
        const image = document.getElementById('articleImage').value;
        const content = quill.root.innerHTML;
        const summary = quill.getText(0, 150).trim() + "...";

        if (!title || !content) return alert("يرجى إكمال الحقول الأساسية");

        const id = editArticleId || Date.now().toString();
        await set(ref(db, `articles/${id}`), {
            title, image, content, summary, 
            date: new Date().toLocaleDateString('ar-EG'),
            timestamp: Date.now()
        });

        showToast(editArticleId ? "تم تعديل المقال" : "تم نشر المقال");
        resetArticleForm();
    });

    document.getElementById('cancelEditBtn')?.addEventListener('click', resetArticleForm);

    // حذف البيانات والعودة للوضع التلقائي
    document.getElementById('resetToAutoBtn')?.addEventListener('click', async () => {
        if (confirm("هل أنت متأكد من حذف البيانات السحابية والعودة للوضع التلقائي؟")) {
            await remove(pricesRef);
            location.reload();
        }
    });

    // البحث في مقالات لوحة التحكم
    document.getElementById('adminArticleSearch')?.addEventListener('input', (e) => {
        renderAdminArticles(e.target.value.toLowerCase());
    });

    // أحداث التنقل (Desktop & Mobile)
    const navMapping = [
        { id: 'homeLink', section: 'home' }, { id: 'mobileHomeLink', section: 'home' },
        { id: 'goldMarketsLink', section: 'gold' }, { id: 'mobileGoldLink', section: 'gold' },
        { id: 'currencyMarketsLink', section: 'currency' }, { id: 'mobileCurrencyLink', section: 'currency' },
        { id: 'articlesLink', section: 'articles' }, { id: 'mobileArticlesLink', section: 'articles' },
        { id: 'walletLink', section: 'wallet' }, { id: 'mobileWalletLink', section: 'wallet' },
        { id: 'aboutLink', section: 'about' }, { id: 'mobileAboutLink', section: 'about' },
        { id: 'contactLink', section: 'contact' }, { id: 'mobileContactLink', section: 'contact' },
        { id: 'privacyLink', section: 'privacy' }
    ];

    navMapping.forEach(nav => {
        document.getElementById(nav.id)?.addEventListener('click', (e) => {
            e.preventDefault();
            showSection(nav.section);
        });
    });

    // تبديل اللغة
    document.getElementById('langToggle')?.addEventListener('click', window.toggleLanguage);

    // حفظ الأسعار يدوياً إلى Firebase
    document.getElementById('saveManualPrices')?.addEventListener('click', async () => {
        const newPrices = {
            gold: parseFloat(document.getElementById('manualGoldPrice').value) || goldPrice,
            silver: parseFloat(document.getElementById('manualSilverPrice').value) || silverPrice,
            rates: {
                EGP: parseFloat(document.getElementById('manualEGP').value) || exchangeRates.EGP,
                SAR: parseFloat(document.getElementById('manualSAR').value) || exchangeRates.SAR,
                EUR: parseFloat(document.getElementById('manualEUR').value) || exchangeRates.EUR
            },
            lastUpdated: Date.now()
        };

        try {
            await set(pricesRef, newPrices);
            showToast("تم تحديث الأسعار عالمياً بنجاح ✅");
            domElements.adminPanel.classList.add('hidden');
        } catch (err) {
            alert("فشل التحديث: " + err.message);
        }
    });
    
    // ميزة طي القائمة الجانبية (Sidebar Toggle)
    const toggleSidebar = document.getElementById('toggleSidebar');
    const sidebar = document.getElementById('sidebar');
    const toggleIcon = document.getElementById('toggleIcon');
    
    toggleSidebar?.addEventListener('click', () => {
        sidebar.classList.toggle('md:w-72');
        sidebar.classList.toggle('md:w-20');
        toggleIcon.classList.toggle('fa-chevron-right');
        toggleIcon.classList.toggle('fa-chevron-left');
        document.querySelectorAll('.sidebar-text').forEach(el => {
            el.classList.toggle('hidden');
        });
    });
});

// وظيفة للتعامل مع زر التنقل للأعلى/للأسفل
function handleScrollToTopBottom() {
    if (!domElements.scrollToTopBottomBtn || !domElements.scrollIcon) return;

    const scrollThreshold = 200; // المسافة بالبكسل التي يجب أن ينزلها المستخدم لإظهار الزر
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = document.documentElement.clientHeight;
    const scrollTop = window.scrollY || document.documentElement.scrollTop;

    // إظهار أو إخفاء الزر
    if (scrollTop > scrollThreshold) {
        domElements.scrollToTopBottomBtn.classList.remove('hidden');
    } else {
        domElements.scrollToTopBottomBtn.classList.add('hidden');
    }

    // تغيير الأيقونة بناءً على موقع التمرير
    if (scrollTop + clientHeight >= scrollHeight - scrollThreshold) { // إذا كان المستخدم قريباً من الأسفل
        domElements.scrollIcon.className = 'fa-solid fa-arrow-up text-xl';
    } else { // إذا كان المستخدم في أي مكان آخر
        domElements.scrollIcon.className = 'fa-solid fa-arrow-down text-xl';
    }
}

// إضافة مستمع لحدث التمرير
window.addEventListener('scroll', handleScrollToTopBottom);

// إضافة مستمع لحدث النقر على الزر
domElements.scrollToTopBottomBtn?.addEventListener('click', () => {
    if (domElements.scrollIcon.classList.contains('fa-arrow-up')) {
        window.scrollTo({ top: 0, behavior: 'smooth' }); // الذهاب للأعلى
    } else {
        window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' }); // الذهاب للأسفل
    }
});

// تبديل اللغة
window.toggleLanguage = () => {
    currentLang = currentLang === 'ar' ? 'en' : 'ar';
    localStorage.setItem('site_lang', currentLang);
    applyTranslations();
    renderCurrencies();
};

// دالة لتحديث البيانات المهيكلة للمقال بشكل ديناميكي (SEO)
function updateArticleSchema(article) {
    let script = document.getElementById('dynamic-article-schema');
    if (!script) {
        script = document.createElement('script');
        script.id = 'dynamic-article-schema';
        script.type = 'application/ld+json';
        document.head.appendChild(script);
    }
    
    const schema = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": article.title,
        "image": article.image || "icon.png",
        "datePublished": article.timestamp ? new Date(article.timestamp).toISOString() : new Date().toISOString(),
        "author": {
            "@type": "Organization",
            "name": "GoldHub"
        },
        "description": article.summary || article.title
    };
    
    script.text = JSON.stringify(schema);
}

// تصدير الدوال للنافذة لتعمل مع onclick
window.openArticleModal = (id) => {
    const art = allArticlesData[id];
    if (art) {
        domElements.articleModalTitle.textContent = art.title;
        domElements.articleModalContent.innerHTML = art.content;
        domElements.articleModal.classList.remove('hidden');

        // تحديث البيانات المهيكلة (JSON-LD) فور فتح المقال
        updateArticleSchema(art);
    }
};

function renderAdminArticles(filter = "") {
    const container = document.getElementById('adminArticlesList');
    if (!container) return;
    const articles = Object.entries(allArticlesData).filter(([id, art]) => 
        art.title.toLowerCase().includes(filter)
    ).reverse();
    
    container.innerHTML = articles.map(([id, art]) => `
        <div class="flex items-center justify-between p-2 bg-slate-900/50 rounded-lg border border-slate-800">
            <span class="text-xs text-white truncate w-40">${art.title}</span>
            <div class="flex gap-2">
                <button onclick="editArticle('${id}')" class="text-cyan-400 hover:text-cyan-300 p-1"><i class="fa-solid fa-pen"></i></button>
                <button onclick="deleteArticle('${id}')" class="text-red-400 hover:text-red-300 p-1"><i class="fa-solid fa-trash"></i></button>
            </div>
        </div>
    `).join('') || '<p class="text-slate-500 text-center text-xs py-2">لا توجد نتائج</p>';
}

window.editArticle = (id) => {
    const art = allArticlesData[id];
    if (!art) return;
    editArticleId = id;
    document.getElementById('articleTitle').value = art.title;
    document.getElementById('articleImage').value = art.image || "";
    quill.root.innerHTML = art.content;
    document.getElementById('cancelEditBtn').classList.remove('hidden');
    document.getElementById('addArticleBtn').textContent = "تحديث المقال";
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.deleteArticle = async (id) => {
    if (confirm("هل أنت متأكد من حذف هذا المقال؟")) await remove(ref(db, `articles/${id}`));
};

function resetArticleForm() {
    editArticleId = null;
    document.getElementById('articleTitle').value = "";
    document.getElementById('articleImage').value = "";
    quill.setContents([]);
    document.getElementById('cancelEditBtn').classList.add('hidden');
    document.getElementById('addArticleBtn').textContent = "نشر المقال الآن";
}
