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
    // ملاحظة: لا تكرر نفس المفتاح مرتين - احتفظ برابط Firebase الرسمي هنا
    projectId: "goldhub-1fdb1",
    storageBucket: "goldhub-1fdb1.appspot.com",
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
const historyRef = ref(db, 'price_history');
const articlesRef = ref(db, 'articles');
let editArticleId = null;
let allArticlesData = {};
let quill;

// إعدادات الروابط الخارجية (APIs) لسهولة التحديث والصيانة
const EXTERNAL_APIS = {
    CURRENCY: 'https://open.er-api.com/v6/latest/USD',
    GOLD: 'https://api.binance.com/api/v3/ticker/price?symbol=PAXGUSDT', // سعر الأونصة العالمي (PAXG)
    SILVER: 'https://api.binance.com/api/v3/ticker/price?symbol=XAGUSDT', // سعر أونصة الفضة العالمي (XAG)
    IRON: null // تم تعطيل الرابط القديم (404). يرجى إدخال رابط JSON جديد هنا لاحقاً.
};

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
        gold_oz: "سعر أونصة الذهب بالدولار", gold_g: "سعر جرام الذهب بالدولار", silver_oz: "أوقية فضة", platinum_oz: "أوقية بلاتين", iron_ezz: "حديد عز (طن)", iron_egyptians: "حديد المصريين (طن)", iron_garhy: "حديد الجارحي (طن)",
        home: "الرئيسية", gold_markets: "أسواق الذهب", currency_markets: "أسعار العملات",
        admin_panel: "لوحة التحكم", wallet: "المحفظة الشخصية", about: "من نحن", contact: "اتصل بنا",
        privacy: "سياسة الخصوصية", live_market: "سوق المال المباشر", sub_heading: "تحديثات فورية لأسعار الذهب العالمية والمعادن",
        up: "صعود", down: "هبوط", stable: "ثابت", live_update: "تحديث مباشر", share: "مشاركة السعر",
        converter: "محول العملات السريع", result: "النتيجة التقريبية", search: "ابحث عن عملة أو عيار..."
    },
    en: {
        gold_oz: "Gold Price per Ounce (USD)", gold_g: "Gold Price per Gram (USD)", silver_oz: "Silver Ounce", platinum_oz: "Platinum Ounce", iron_ezz: "Ezz Steel (Ton)", iron_egyptians: "Egyptian Steel (Ton)", iron_garhy: "El Garhy Steel (Ton)",
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
    price18k: document.getElementById('price-18k'),
    price14k: document.getElementById('price-14k'),
    price12k: document.getElementById('price-12k'),
    making24kDisplay: document.getElementById('making-24k-display'),
    making21kDisplay: document.getElementById('making-21k-display'),
    making18kDisplay: document.getElementById('making-18k-display'),
    making14kDisplay: document.getElementById('making-14k-display'),
    making12kDisplay: document.getElementById('making-12k-display'),
    trend24k: document.getElementById('trend-24k'),
    trend21k: document.getElementById('trend-21k'),
    trend18k: document.getElementById('trend-18k'),
    trend14k: document.getElementById('trend-14k'),
    trend12k: document.getElementById('trend-12k'),
    silverPrice: document.getElementById('silverPrice'),
    platinumPrice: document.getElementById('platinumPrice'),
    silverTrend: document.getElementById('silverTrend'),
    platinumTrend: document.getElementById('platinumTrend'),
    ironEzzPrice: document.getElementById('ironEzzPrice'),
    ironEzzTrend: document.getElementById('ironEzzTrend'),
    ironEgyptiansPrice: document.getElementById('ironEgyptiansPrice'),
    ironEgyptiansTrend: document.getElementById('ironEgyptiansTrend'),
    ironGarhyPrice: document.getElementById('ironGarhyPrice'),
    ironGarhyTrend: document.getElementById('ironGarhyTrend'),
    currencyList: document.getElementById('currencyList'),
    historicalSection: document.getElementById('historicalSection'),
    historicalTableBody: document.getElementById('historicalTableBody'),
    marketTabs: document.getElementById('marketTabs'),
    nearbySection: document.getElementById('nearbySection'),
    nearbyExchangesList: document.getElementById('nearbyExchangesList'),
    conversionResult: document.getElementById('conversionResult'),
    amountInput: document.getElementById('amountInput'),
    searchNewAreaBtn: document.getElementById('searchNewAreaBtn'),
    searchNewAreaText: document.getElementById('searchNewAreaText'),
    displayCurrency: document.getElementById('displayCurrency'),
    targetCurrency: document.getElementById('targetCurrency'),
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
    lastUpdateTime: document.getElementById('lastUpdateTime'),
    unitToggleBtn: document.getElementById('unitToggleBtn'),
    goldPriceLabel: document.getElementById('goldPriceLabel'),
    alertThreshold: document.getElementById('alertThreshold'),
    setAlertBtn: document.getElementById('setAlertBtn'),
    soundSelect: document.getElementById('soundSelect'),
    alertDirection: document.getElementById('alertDirection'), // إضافة عنصر اتجاه التنبيه
    editorContainer: document.getElementById('editor-container'),
    articlePreviewContainer: document.getElementById('articlePreviewContainer')
};

// تحسين الأداء: إنشاء كائنات تنسيق الأرقام مرة واحدة وإعادة استخدامها
const formatters = {
    usd: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }),
    egp: new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    metal: new Intl.NumberFormat('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 }),
    crypto: new Intl.NumberFormat('en-US', { minimumFractionDigits: 6 })
};

// وظيفة تحريك الأرقام (Number Ticker) لإعطاء إحساس بالحيوية
function animateNumber(element, start, end, formatter) {
    if (!element) return;
    const duration = 1000;
    const startTime = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOutQuad = t => t * (2 - t);
        const current = start + (end - start) * easeOutQuad(progress);
        element.textContent = formatter.format(current);
        if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
}

// نظام التبويبات (Tabs) لتنظيم الواجهة
let activeMarketTab = 'gold';

window.switchMarketTab = (tabId) => {
    activeMarketTab = tabId;

    // 1. إضافة Haptic Feedback (اهتزاز لمسي خفيف جداً) للهواتف
    if ("vibrate" in navigator) {
        navigator.vibrate(15); // اهتزاز قصير جداً (15 ملي ثانية) لمحاكاة نقرة حقيقية
    }

    // 2. تشغيل صوت نقرة بسيطة (UI Click Sound)
    try {
        // تم تقليل جلب الملفات الصوتية لتحسين الأداء
    } catch (e) { }

    // تحديث شكل أزرار التبويبات
    document.querySelectorAll('.market-tab-btn').forEach(btn => {
        const isActive = btn.dataset.marketTab === tabId;
        btn.classList.toggle('bg-cyan-500/10', isActive);
        btn.classList.toggle('text-cyan-400', isActive);
        btn.classList.toggle('border', isActive);
        btn.classList.toggle('border-cyan-500/20', isActive);
        btn.classList.toggle('text-slate-500', !isActive);
        btn.setAttribute('aria-selected', isActive);
    });

    // جلب العناصر الأساسية
    const goldSection = document.getElementById('goldSection');
    const currencySection = document.getElementById('currencySection');
    const goldMainCard = document.getElementById('goldMainCard');
    const goldCaratsGrid = document.getElementById('goldCaratsGrid');
    const metalsGrid = document.getElementById('metalsGrid');
    const converter = document.getElementById('currencyConverterContainer');
    const historicalSection = document.getElementById('historicalSection');

    const isDesktop = window.innerWidth >= 1024;

    if (!isDesktop) {
        // منطق الهواتف: إخفاء الأقسام غير المطلوبة تماماً
        goldSection.classList.toggle('hidden', tabId !== 'gold' && tabId !== 'metals' && tabId !== 'history');
        currencySection.classList.toggle('hidden', tabId !== 'currencies' && tabId !== 'favorites');
        historicalSection?.classList.toggle('hidden', tabId !== 'history');

        if (tabId === 'gold') {
            goldMainCard.classList.remove('hidden');
            goldCaratsGrid.classList.remove('hidden');
            metalsGrid.classList.add('hidden');
        } else if (tabId === 'metals') {
            goldMainCard.classList.add('hidden');
            goldCaratsGrid.classList.add('hidden');
            metalsGrid.classList.remove('hidden');
        } else if (tabId === 'history') {
            goldMainCard.classList.add('hidden');
            goldCaratsGrid.classList.add('hidden');
            renderHistoricalTable();
        }

        if (converter) converter.classList.toggle('hidden', tabId === 'favorites');
    } else {
        // منطق الكمبيوتر: توسيع القسم النشط وتوزيع المساحات
        goldSection.classList.remove('hidden', 'lg:col-span-2', 'lg:col-span-3');
        currencySection.classList.remove('hidden', 'lg:col-span-1', 'lg:col-span-3');
        historicalSection?.classList.add('hidden');

        if (tabId === 'gold' || tabId === 'metals' || tabId === 'history') {
            goldSection.classList.add('lg:col-span-3');
            currencySection.classList.add('hidden');
            goldMainCard.classList.toggle('hidden', tabId !== 'gold');
            goldCaratsGrid.classList.toggle('hidden', tabId !== 'gold');
            metalsGrid.classList.toggle('hidden', tabId !== 'metals');
            if (tabId === 'history') {
                historicalSection?.classList.remove('hidden');
                renderHistoricalTable();
            }
        } else {
            currencySection.classList.add('lg:col-span-3');
            goldSection.classList.add('hidden');
            if (converter) converter.classList.toggle('hidden', tabId === 'favorites');
        }
    }

    // تفعيل تأثير الانتقال للعناصر المرئية
    const activeContainers = [goldSection, currencySection, goldMainCard, goldCaratsGrid, metalsGrid, converter, historicalSection];
    activeContainers.forEach(el => {
        if (el && !el.classList.contains('hidden')) {
            el.classList.remove('tab-switch-anim');
            void el.offsetWidth; // إجبار المتصفح على إعادة الحساب لتشغيل الأنميشن
            el.classList.add('tab-switch-anim');
        }
    });

    // إعادة رسم القوائم بناءً على الفلتر الجديد
    renderCurrencies();
};

// دالة Debounce لتحسين أداء البحث والمدخلات
function debounce(func, timeout = 300) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => {
            func.apply(this, args);
        }, timeout);
    };
}

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

// دالة مساعدة لتحويل رمز الدولة أو العملة إلى Emoji مناسب للأعلام (تصلح خطأ ReferenceError)
function getFlagEmoji(code) {
    const countryCode = currencyToCountryCode[code];
    if (!countryCode || ['gold', 'silver', 'platinum'].includes(countryCode)) {
        if (code === 'XAU') return '💰';
        if (code === 'XAG') return '🥈';
        if (code === 'XPT') return '💍';
        return '🏳️';
    }
    return countryCode
        .toUpperCase()
        .replace(/./g, char => String.fromCodePoint(char.charCodeAt(0) + 127397));
}

// ثابت الأونصة (أونصة تروي) بدقة عالية لاستخدامه في التحويلات (جرام ⇄ أونصة)
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
let ironEzzPrice = parseFloat(localStorage.getItem('last_iron_ezz_price')) || 41000.00;
let ironEgyptiansPrice = parseFloat(localStorage.getItem('last_iron_egyptians_price')) || 40500.00;
let ironGarhyPrice = parseFloat(localStorage.getItem('last_iron_garhy_price')) || 40200.00;

// تهيئة أولية لأسعار المعادن في كائن التحويل لضمان عمل المحول فوراً
exchangeRates["XAU"] = 1 / goldPrice;
exchangeRates["XAG"] = 1 / silverPrice;
exchangeRates["XPT"] = 1 / platinumPrice;

let isManualMode = false;
let caratPrices = { k24: goldPrice / OUNCE_TO_GRAM, k21: (goldPrice / OUNCE_TO_GRAM) * 0.875, k18: (goldPrice / OUNCE_TO_GRAM) * 0.75, k14: (goldPrice / OUNCE_TO_GRAM) * (14/24), k12: (goldPrice / OUNCE_TO_GRAM) * 0.5 };
let previousSilverPrice = silverPrice;
let previousPlatinumPrice = platinumPrice;
let previousIronEzzPrice = ironEzzPrice;
let previousIronEgyptiansPrice = ironEgyptiansPrice;
let previousIronGarhyPrice = ironGarhyPrice;
let makingCharges = { k24: 0, k21: 0, k18: 0, k14: 0, k12: 0 };
let priceHistory = [goldPrice];
let timeLabels = [new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })];
let goldChart;
let previousGoldPrice = goldPrice;
let previousCaratPrices = { k24: 0, k21: 0, k18: 0, k14: 0, k12: 0 };
// وحدة العرض الافتراضية: 'oz' للأونصة أو 'g' للجرام
let displayUnit = localStorage.getItem('displayUnit') || 'oz';
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
    const targetEl = document.getElementById('targetCurrency');

    if (!targetEl) return;

    const searchTerm = "";
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

    targetEl.innerHTML = optionsHtml;
    targetEl.value = currentTarget;
}

// عرض قائمة العملات في الواجهة
function renderCurrencies() {
    if (!domElements.currencyList) return;
    const searchTerm = domElements.searchInput?.value.toLowerCase() || "";

    const favorites = JSON.parse(localStorage.getItem('favoriteCurrencies')) || [];

    // تصفية العملات بناءً على التبويب النشط والبحث
    const filteredRates = Object.entries(exchangeRates).filter(([code]) => {
        const isMetal = ['XAU', 'XAG', 'XPT'].includes(code);
        const matchesSearch = code.toLowerCase().includes(searchTerm);

        if (activeMarketTab === 'favorites') {
            return matchesSearch && favorites.includes(code) && !isMetal;
        }
        return matchesSearch && !isMetal;
    });

    domElements.currencyList.innerHTML = filteredRates.map(([code, rate]) => {
        const flagUrl = getSafeFlagUrl(code);
        const isFavorite = favorites.includes(code);
        const starIconClass = isFavorite ? 'fa-solid fa-star text-yellow-400' : 'fa-regular fa-star text-slate-500 group-hover:text-yellow-400';

        return `
            <div class="flex items-center justify-between p-3 bg-slate-900/40 border border-slate-800 rounded-xl hover:border-cyan-500/30 transition-all group">
                <div class="flex items-center gap-2.5">
                    <img src="${flagUrl}" class="w-8 h-6 rounded object-cover shadow-sm" alt="${code}" onerror="this.src='https://cdn-icons-png.flaticon.com/512/272/272525.png'">
                    <div>
                        <div class="text-xs font-bold text-slate-100">${code}</div>
                        <div class="flex items-center gap-1.5 text-[9px] text-emerald-500/90 font-bold uppercase tracking-wider">
                            <span class="relative flex h-1.5 w-1.5">
                                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span class="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                            </span>
                            ${translations[currentLang].live_update}
                        </div>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <button class="text-lg p-1 focus:outline-none" onclick="toggleFavoriteCurrency('${code}')">
                        <i class="${starIconClass}"></i>
                    </button>
                    <div class="text-sm font-mono font-bold text-cyan-400 group-hover:scale-105 transition-transform">${rate.toFixed(2)}</div>
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
    if (!("Notification" in window)) return;

    // التحقق مما إذا كان المستخدم قد حظر الإشعارات مسبقاً لتجنب إرسال طلب مرفوض
    if (Notification.permission === 'denied') {
        console.warn('🔔 الإشعارات محظورة من قبل المستخدم. يمكن إعادة تفعيلها من إعدادات المتصفح.');
        return;
    }

    try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            const vapidKey = 'BMvP9_J0V6-m9_9j9-GvE_REPLACE_WITH_ACTUAL_KEY';
            
            if (vapidKey.includes('REPLACE_WITH_ACTUAL_KEY')) {
                console.warn('🔔 تنبيه: يرجى استبدال مفتاح VAPID بمفتاح حقيقي من Firebase Console لتفعيل الإشعارات.');
                return;
            }

            const token = await getToken(messaging, {
                vapidKey: vapidKey,
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

        const apiRequests = [];
        const apiKeys = [];

        apiRequests.push(fetch(EXTERNAL_APIS.CURRENCY).catch(err => {
            console.error("❌ فشل جلب العملات:", err);
            addApiLog(`❌ فشل جلب العملات: ${err.message || 'خطأ غير معروف'}`);
            return { status: 'rejected', reason: err };
        }));
        apiKeys.push('CURRENCY');

        apiRequests.push(fetch(EXTERNAL_APIS.GOLD).catch(err => {
            console.error("❌ فشل جلب الذهب:", err);
            addApiLog(`❌ فشل جلب الذهب: ${err.message || 'خطأ غير معروف'}`);
            return { status: 'rejected', reason: err };
        }));
        apiKeys.push('GOLD');

        if (EXTERNAL_APIS.SILVER) {
            apiRequests.push(fetch(EXTERNAL_APIS.SILVER).catch(err => {
                console.error("❌ فشل جلب سعر الفضة من Binance:", err);
                addApiLog(`❌ فشل جلب الفضة: ${err.message || 'خطأ غير معروف'}`);
                return { status: 'rejected', reason: err };
            }));
            apiKeys.push('SILVER');
        }

        if (EXTERNAL_APIS.IRON) {
            apiRequests.push(fetch(EXTERNAL_APIS.IRON).catch(err => {
                console.error("❌ فشل جلب سعر الحديد:", err);
                addApiLog(`❌ فشل جلب الحديد: ${err.message || 'خطأ غير معروف'}`);
                return { status: 'rejected', reason: err };
            }));
            apiKeys.push('IRON');
        }

        const results = await Promise.allSettled(apiRequests);

        const processedResults = {};
        results.forEach((result, index) => {
            processedResults[apiKeys[index]] = result;
        });

        const currRes = processedResults.CURRENCY;
        if (currRes && currRes.status === 'fulfilled' && currRes.value.ok) {
            const currData = await currRes.value.json();
            if (currData?.rates) {
                // تحديث كائن الأسعار بجميع العملات التي يوفرها الـ API
                exchangeRates = { ...exchangeRates, ...currData.rates };

                // التأكد من وجود الدولار كقاعدة
                exchangeRates["USD"] = 1;
                
                if (currData.rates.XPT) {
                    previousPlatinumPrice = platinumPrice;
                    platinumPrice = 1 / currData.rates.XPT;
                    localStorage.setItem('last_platinum_price', platinumPrice);
                }
                localStorage.setItem('last_rates', JSON.stringify(exchangeRates));
            }
            renderConverterOptions();
        } else if (currRes && currRes.status === 'rejected') {
            // Error already logged in the catch block of the fetch call
        } else {
            addApiLog("⚠️ فشل جلب العملات (استجابة غير صالحة).");
        }

        const goldRes = processedResults.GOLD;
        if (goldRes && goldRes.status === 'fulfilled' && goldRes.value.ok) {
            const goldData = await goldRes.value.json();
            // Binance يرجع السعر في حقل price كـ string
            if (goldData && goldData.price) {
                goldPrice = parseFloat(goldData.price);
                // تحديث معدل الذهب في كائن الصرف (1 دولار = كم أوقية)
                exchangeRates["XAU"] = 1 / goldPrice;
                localStorage.setItem('last_gold_price', goldPrice);
                
                // ربط العيارات برمجياً بسعر الأونصة الجديد
                const gram24USD = goldPrice / OUNCE_TO_GRAM;
                caratPrices.k24 = gram24USD;
                caratPrices.k21 = gram24USD * 0.875;
                caratPrices.k18 = gram24USD * 0.75;
                caratPrices.k14 = gram24USD * (14/24);
                caratPrices.k12 = gram24USD * 0.5;
            }
        } else if (goldRes && goldRes.status === 'rejected') {
            // Error already logged in the catch block of the fetch call
        } else {
            addApiLog("⚠️ فشل جلب الذهب (استجابة غير صالحة).");
        }
        
        // معالجة بيانات الفضة من Binance
        const silverRes = processedResults.SILVER;
        if (silverRes && silverRes.status === 'fulfilled' && silverRes.value.ok) {
            const silverData = await silverRes.value.json();
            if (silverData && silverData.price) {
                previousSilverPrice = silverPrice;
                silverPrice = parseFloat(silverData.price);
                exchangeRates["XAG"] = 1 / silverPrice; // تحديث معدل الفضة في كائن الصرف
                localStorage.setItem('last_silver_price', silverPrice);
            }
        } else if (silverRes && silverRes.status === 'rejected') {
            // Error already logged in the catch block of the fetch call
        } else {
            addApiLog("⚠️ فشل جلب الفضة (استجابة غير صالحة).");
        }

        // معالجة بيانات الحديد من المصدر المجاني
        const ironRes = processedResults.IRON;
        if (ironRes && ironRes.status === 'fulfilled' && ironRes.value.ok) {
            const ironData = await ironRes.value.json();
            const record = ironData?.record || ironData;
            if (record && record.ezz) {
                previousIronEzzPrice = ironEzzPrice;
                ironEzzPrice = record.ezz;
                previousIronEgyptiansPrice = ironEgyptiansPrice;
                ironEgyptiansPrice = record.egyptians;
                previousIronGarhyPrice = ironGarhyPrice;
                ironGarhyPrice = record.garhy;
            }
        } else if (ironRes && ironRes.status === 'rejected') {
            // Error already logged in the catch block of the fetch call
        } else {
            addApiLog("⚠️ أسعار الحديد تستخدم البيانات المحلية (رابط API غير متاح أو استجابة غير صالحة).");
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
        },
        plugins: [{
            id: 'glow',
            beforeDatasetsDraw: (chart) => {
                const { ctx } = chart;
                ctx.save();
                ctx.shadowBlur = 15;
                ctx.shadowColor = chart.data.datasets[0].borderColor;
            },
            afterDatasetsDraw: (chart) => {
                chart.ctx.restore();
            }
        }]
    });
}

function updateChart(newPrice) {
    if (!goldChart) return;

    // تحديد لون التوهج بناءً على الاتجاه (أخضر للصعود، أحمر للهبوط)
    const isUp = newPrice >= previousGoldPrice;
    const color = isUp ? '#10b981' : '#ef4444'; // Emerald-500 أو Red-500
    const rgba = isUp ? '16, 185, 129' : '239, 68, 68';

    const dataset = goldChart.data.datasets[0];
    dataset.borderColor = color;

    // تحديث التدرج اللوني للحقن (Fill) ليتناسب مع الاتجاه الجديد
    const ctx = goldChart.ctx;
    const gradient = ctx.createLinearGradient(0, 0, 0, 200);
    gradient.addColorStop(0, `rgba(${rgba}, 0.3)`);
    gradient.addColorStop(1, `rgba(${rgba}, 0)`);
    dataset.backgroundColor = gradient;

    priceHistory.push(newPrice);
    timeLabels.push(new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }));
    if (priceHistory.length > 20) { priceHistory.shift(); timeLabels.shift(); }
    goldChart.update();
}

onValue(pricesRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
        previousGoldPrice = goldPrice;
        previousCaratPrices = { ...caratPrices };
        
        // تحديث سعر الأونصة من قاعدة البيانات
        goldPrice = Number(data.gold) || goldPrice;
        exchangeRates = data.rates || exchangeRates;

        // إعادة حساب العيارات بناءً على سعر الأونصة المحدث يدوياً لضمان الربط
        const gram24USD = goldPrice / OUNCE_TO_GRAM;
        caratPrices = {
            k24: data.carats?.k24 || gram24USD,
            k21: data.carats?.k21 || (gram24USD * 0.875),
            k18: data.carats?.k18 || (gram24USD * 0.75),
            k14: data.carats?.k14 || (gram24USD * (14/24)),
            k12: data.carats?.k12 || (gram24USD * 0.5)
        };

        // تحديث سعر الفضة من Firebase فقط إذا كان موجوداً، وإلا فسيتم الاحتفاظ بآخر قيمة من API أو القيمة الافتراضية
        // هذا يضمن أن الفضة لا يتم تجاوزها بقيمة قديمة إذا لم يقم المدير بتحديثها
        // إذا لم يتم توفيرها من قبل المدير، فستظل قيمة API هي السائدة (أو القيمة الافتراضية إذا فشل API)
        if (data.silver !== undefined) { previousSilverPrice = silverPrice; silverPrice = data.silver; }
        if (data.ironEzz) { previousIronEzzPrice = ironEzzPrice; ironEzzPrice = data.ironEzz; }
        if (data.ironEgyptians) { previousIronEgyptiansPrice = ironEgyptiansPrice; ironEgyptiansPrice = data.ironEgyptians; }
        if (data.ironGarhy) { previousIronGarhyPrice = ironGarhyPrice; ironGarhyPrice = data.ironGarhy; }
        if (data.makingCharges) makingCharges = data.makingCharges;
        isManualMode = true;
        renderConverterOptions();
        updateUI();
    } else {
        isManualMode = false;
        fetchApiPrices();
    }
});

// دالة عرض جدول البيانات التاريخية (مقتبس من الموقع المطلوب)
function renderHistoricalTable() {
    const container = domElements.historicalTableBody;
    if (!container) return;

    onValue(historyRef, (snapshot) => {
        const data = snapshot.val();
        if (!data) {
            container.innerHTML = '<tr><td colspan="5" class="py-10 text-center text-slate-500 italic">لا توجد بيانات تاريخية متاحة حالياً</td></tr>';
            return;
        }

        const historyArray = Object.entries(data).sort((a, b) => b[1].timestamp - a[1].timestamp).slice(0, 10);
        const displayRate = exchangeRates[domElements.displayCurrency?.value || "EGP"] || 1;

        container.innerHTML = historyArray.map(([id, entry]) => {
            const ozPrice = entry.gold_price;
            const g24 = (ozPrice / OUNCE_TO_GRAM) * displayRate;
            const g21 = g24 * 0.875;
            const g18 = g24 * 0.75;

            return `
                <tr class="hover:bg-slate-800/30 transition-colors">
                    <td class="py-4 px-4 font-mono text-cyan-400">${entry.date}</td>
                    <td class="py-4 px-4 text-white font-bold">${formatters.egp.format(g24)}</td>
                    <td class="py-4 px-4 text-white font-bold">${formatters.egp.format(g21)}</td>
                    <td class="py-4 px-4 text-white font-bold">${formatters.egp.format(g18)}</td>
                    <td class="py-4 px-4 text-slate-400 font-mono">$${formatters.egp.format(ozPrice)}</td>
                </tr>`;
        }).join('');
    });
}

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
    // استخدام العناصر المخزنة في domElements لتحسين الأداء
    const amount = parseFloat(domElements.amountInput?.value) || 0;
    const fromCurrency = "USD"; // العملة الأساسية ثابتة حالياً في محول العملات السريع
    const toCurrency = domElements.targetCurrency?.value || "EGP";

    // مزامنة أسعار المعادن الحالية قبل إجراء عملية التحويل
    if (goldPrice > 0) exchangeRates["XAU"] = 1 / goldPrice;
    if (silverPrice > 0) exchangeRates["XAG"] = 1 / silverPrice;
    if (platinumPrice > 0) exchangeRates["XPT"] = 1 / platinumPrice;

    // تأكيد وجود العملات المرجعية لتجنب الأخطاء الحسابية
    exchangeRates["USD"] = 1;

    const fromRate = exchangeRates[fromCurrency] || 0;
    const toRate = exchangeRates[toCurrency] || 0;

    if (fromRate === 0 || toRate === 0) {
        if (domElements.conversionResult) domElements.conversionResult.textContent = "---";
        return;
    }

    // العملية الحسابية الأساسية: تحويل المبلغ للعملة الأساسية (الدولار) ثم للعملة المستهدفة
    const result = amount * (toRate / fromRate);
    const isMetal = ['XAU', 'XAG', 'XPT'].includes(toCurrency);

    // استخدام الفورمات المجهز مسبقاً حسب نوع العملة
    const formatted = isMetal ? formatters.metal.format(result) : formatters.egp.format(result);

    if (domElements.conversionResult) domElements.conversionResult.textContent = `${formatted} ${toCurrency}`;
}

function updateUI() {
    // جلب العملة المختارة للعرض (EGP, USD, SAR, etc.)
    const selectedDisplayCurrency = domElements.displayCurrency?.value || "EGP";
    const displayRate = exchangeRates[selectedDisplayCurrency] || 1;
    const currencySymbol = selectedDisplayCurrency;

    // تحديث وقت آخر تحديث للسعر في الواجهة
    if (domElements.lastUpdateTime) {
        const now = new Date();
        const timeStr = now.toLocaleTimeString(currentLang === 'ar' ? 'ar-EG' : 'en-GB', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        domElements.lastUpdateTime.textContent = `(${timeStr})`;
    }

    // تحسين الأداء: تحديث الرسم البياني فقط إذا كان تبويب الذهب نشطاً ومرئياً
    const isGoldVisible = !document.getElementById('goldMainCard').classList.contains('hidden');
    if (isGoldVisible && goldPrice !== previousGoldPrice) {
        updateChart(goldPrice);
    }

    // تحديث السعر الرئيسي بالدولار
    if (domElements.mainGoldPrice) {
        const prevMain = displayUnit === 'oz' ? previousGoldPrice : (previousGoldPrice / OUNCE_TO_GRAM);
        const currMain = displayUnit === 'oz' ? goldPrice : (goldPrice / OUNCE_TO_GRAM);
        const mainFormatter = displayUnit === 'oz' ? formatters.usd : formatters.metal;
        animateNumber(domElements.mainGoldPrice, prevMain, currMain, mainFormatter);
    }

    // الربط الرياضي النهائي: اشتقاق الأسعار المحلية من سعر الأونصة العالمي الحالي والسابقة
    const currentGram24USD = goldPrice / OUNCE_TO_GRAM;
    const prevGram24USD = previousGoldPrice / OUNCE_TO_GRAM;

    const currentPrices = { k24: currentGram24USD, k21: currentGram24USD * 0.875, k18: currentGram24USD * 0.75, k14: currentGram24USD * (14/24), k12: currentGram24USD * 0.5 };
    const prevPrices = { k24: prevGram24USD, k21: prevGram24USD * 0.875, k18: prevGram24USD * 0.75, k14: prevGram24USD * (14/24), k12: prevGram24USD * 0.5 };

    // حساب المصنعية بناءً على العملة المختارة (تحويل من الجنيه للعملة الحالية)
    const m24 = selectedDisplayCurrency === 'EGP' ? (makingCharges?.k24 || 0) : (makingCharges?.k24 || 0) * (displayRate / (exchangeRates.EGP || 1));
    const m21 = selectedDisplayCurrency === 'EGP' ? (makingCharges?.k21 || 0) : (makingCharges?.k21 || 0) * (displayRate / (exchangeRates.EGP || 1));
    const m18 = selectedDisplayCurrency === 'EGP' ? (makingCharges?.k18 || 0) : (makingCharges?.k18 || 0) * (displayRate / (exchangeRates.EGP || 1));
    const m14 = selectedDisplayCurrency === 'EGP' ? (makingCharges?.k14 || 0) : (makingCharges?.k14 || 0) * (displayRate / (exchangeRates.EGP || 1));
    const m12 = selectedDisplayCurrency === 'EGP' ? (makingCharges?.k12 || 0) : (makingCharges?.k12 || 0) * (displayRate / (exchangeRates.EGP || 1));

    // تحديث أسعار الذهب (الخام بدون مصنعية)
    if (domElements.price24k) animateNumber(domElements.price24k, prevPrices.k24 * displayRate, currentPrices.k24 * displayRate, formatters.egp);
    if (domElements.price21k) animateNumber(domElements.price21k, prevPrices.k21 * displayRate, currentPrices.k21 * displayRate, formatters.egp);
    if (domElements.price18k) animateNumber(domElements.price18k, prevPrices.k18 * displayRate, currentPrices.k18 * displayRate, formatters.egp);
    if (domElements.price14k) animateNumber(domElements.price14k, prevPrices.k14 * displayRate, currentPrices.k14 * displayRate, formatters.egp);
    if (domElements.price12k) animateNumber(domElements.price12k, prevPrices.k12 * displayRate, currentPrices.k12 * displayRate, formatters.egp);

    // عرض المصنعية بشكل منفصل
    const updateMakingDisplay = (el, val) => {
        if (!el) return;
        const label = currentLang === 'ar' ? '+ مصنعية: ' : '+ Making: ';
        el.textContent = val > 0 ? `${label}${formatters.egp.format(val)} ${currencySymbol}` : "";
    };
    updateMakingDisplay(domElements.making24kDisplay, m24);
    updateMakingDisplay(domElements.making21kDisplay, m21);
    updateMakingDisplay(domElements.making18kDisplay, m18);
    updateMakingDisplay(domElements.making14kDisplay, m14);
    updateMakingDisplay(domElements.making12kDisplay, m12);

    // تحديث أسعار المعادن الأخرى
    if (domElements.silverPrice) domElements.silverPrice.textContent = formatters.usd.format(silverPrice);
    if (domElements.platinumPrice) domElements.platinumPrice.textContent = formatters.usd.format(platinumPrice);

    if (domElements.ironEzzPrice) domElements.ironEzzPrice.textContent = `${formatters.egp.format(ironEzzPrice)} ${currencySymbol}`;
    if (domElements.ironEgyptiansPrice) domElements.ironEgyptiansPrice.textContent = `${formatters.egp.format(ironEgyptiansPrice)} ${currencySymbol}`;
    if (domElements.ironGarhyPrice) domElements.ironGarhyPrice.textContent = `${formatters.egp.format(ironGarhyPrice)} ${currencySymbol}`;

    // تحديث عيارات الفضة بالعملة المختارة
    const silverGramDisplay = (silverPrice / OUNCE_TO_GRAM) * displayRate;
    const silverElements = {
        'silver-999': 0.999, 'silver-925': 0.925, 'silver-900': 0.900, 'silver-800': 0.800
    };

    // تحسين الأداء: تحديث الفضة فقط إذا كان تبويب المعادن نشطاً
    if (!document.getElementById('metalsGrid').classList.contains('hidden')) {
        Object.entries(silverElements).forEach(([id, multiplier]) => {
            const el = document.getElementById(id);
            if (el) el.textContent = `${formatters.egp.format(silverGramDisplay * multiplier)} ${currencySymbol}`;
        });
    }

    // تحديث مؤشرات التغيير
    const updateTrend = (el, current, previous) => {
        if (!el) return;
        const isUp = current >= previous;
        el.innerHTML = `<i class="fa-solid fa-caret-${isUp ? 'up text-green-500' : 'down text-red-500'}"></i>`;
    };

    updateTrend(domElements.trend24k, currentPrices.k24, prevPrices.k24);
    updateTrend(domElements.trend21k, currentPrices.k21, prevPrices.k21);
    updateTrend(domElements.trend18k, currentPrices.k18, prevPrices.k18);
    updateTrend(domElements.trend14k, currentPrices.k14, prevPrices.k14);
    updateTrend(domElements.trend12k, currentPrices.k12, prevPrices.k12);
    updateTrend(domElements.silverTrend, silverPrice, previousSilverPrice);
    updateTrend(domElements.platinumTrend, platinumPrice, previousPlatinumPrice);
    updateTrend(domElements.ironEzzTrend, ironEzzPrice, previousIronEzzPrice);
    updateTrend(domElements.ironEgyptiansTrend, ironEgyptiansPrice, previousIronEgyptiansPrice);
    updateTrend(domElements.ironGarhyTrend, ironGarhyPrice, previousIronGarhyPrice);

    if (domElements.targetCurrency && !domElements.targetCurrency.options.length) renderConverterOptions();
    renderCurrencies();
    calculateConversion();

    // تحديث تسمية وحدة السعر وزر التبديل
    if (domElements.goldPriceLabel) {
        domElements.goldPriceLabel.textContent = displayUnit === 'oz' ? translations[currentLang].gold_oz : translations[currentLang].gold_g;
    }
    if (domElements.unitToggleBtn) {
        domElements.unitToggleBtn.textContent = displayUnit === 'oz' ? (currentLang === 'ar' ? 'عرض بالجرام' : 'Show per gram') : (currentLang === 'ar' ? 'عرض بالأونصة' : 'Show per ounce');
        domElements.unitToggleBtn.onclick = () => {
            displayUnit = displayUnit === 'oz' ? 'g' : 'oz';
            localStorage.setItem('displayUnit', displayUnit);
            updateUI();
        };
    }
}

function simulateMarket() {
    let alertThreshold = localStorage.getItem('goldPriceAlert') ? parseFloat(localStorage.getItem('goldPriceAlert')) : null;
    let alertSound = localStorage.getItem('selectedNotificationSound');
    let alertDirection = localStorage.getItem('alertDirection') || 'above'; // 'above' or 'below'

    // التحقق من شرط التنبيه بناءً على الاتجاه
    if (alertThreshold !== null && ((alertDirection === 'above' && goldPrice >= alertThreshold) || (alertDirection === 'below' && goldPrice <= alertThreshold))) {
        // 1. تشغيل نغمة التنبيه المختارة
        if (alertSound) {
            const audio = new Audio(alertSound);
            audio.play().catch(e => console.warn("Audio playback failed:", e));
        }

        // 2. إرسال إشعار النظام
        if (Notification.permission === "granted") {
            new Notification("تنبيه الذهب | GoldHub", {
                body: `وصل سعر الذهب الآن إلى $${goldPrice}`,
                icon: 'icon.png'
            });
        }

        // إضافة الاهتزاز للهواتف لتعزيز التنبيه "الحقيقي"
        if ("vibrate" in navigator) {
            navigator.vibrate([200, 100, 200]);
        }

        // 3. عرض رسالة Toast وتصفير التنبيه بعد إطلاقه
        showToast(`تم الوصول للسعر المستهدف: $${goldPrice}`);
        addApiLog(`🔔 تنبيه: وصل السعر للهدف $${alertThreshold}`);
        localStorage.removeItem('goldPriceAlert');

        // مسح قيمة المدخل في الواجهة
        if (domElements.alertThreshold) domElements.alertThreshold.value = '';
        // إعادة شكل الزر للوضع الافتراضي (أزرق)
        domElements.setAlertBtn?.classList.remove('bg-amber-500/20', 'text-amber-400', 'border-amber-500/40');
        domElements.setAlertBtn?.classList.add('bg-cyan-500/10', 'text-cyan-400', 'border-cyan-500/20');
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
    // العودة للأعلى تلقائياً عند تغيير القسم
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const sections = ['goldSection', 'currencySection', 'walletSection', 'articlesSection', 'aboutSection', 'contactSection', 'privacySection', 'faqSection', 'nearbySection'];
    sections.forEach(s => document.getElementById(s)?.classList.add('hidden'));

    if (sectionName === 'home') {
        document.getElementById('goldSection').classList.remove('hidden');
        document.getElementById('currencySection').classList.remove('hidden');
        document.getElementById('latestArticlesHome')?.classList.remove('hidden');
    } else {
        document.getElementById(sectionName + 'Section')?.classList.remove('hidden');
        document.getElementById('latestArticlesHome')?.classList.add('hidden');
    }

    if (sectionName === 'nearby') {
        initMap();
    }

    // تحديث الحالة النشطة في أزرار التنقل للهواتف
    const mobileLinks = ['mobileHomeLink', 'mobileGoldLink', 'mobileCurrencyLink', 'mobileArticlesLink', 'mobileWalletLink', 'mobileAboutLink', 'mobileContactLink'];
    mobileLinks.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.classList.remove('text-cyan-400');
            el.classList.add('text-slate-500');
        }
    });
    const activeId = 'mobile' + sectionName.charAt(0).toUpperCase() + sectionName.slice(1) + 'Link';
    document.getElementById(activeId)?.classList.add('text-cyan-400');
};

// دالة حساب المسافة بين نقطتين (صيغة هافرسين)
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // نصف قطر الأرض بالكيلومتر
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // المسافة بالكيلومتر
}

// تعريف أيقونة مخصصة لمكاتب الصرافة
const exchangeIcon = L.divIcon({
    className: 'custom-exchange-icon', // يمكن استخدام هذه الفئة لتخصيص إضافي في CSS
    html: '<div class="bg-cyan-500/80 border border-cyan-500 rounded-full w-8 h-8 flex items-center justify-center text-white text-sm shadow-lg"><i class="fa-solid fa-money-bill-transfer"></i></div>',
    iconSize: [32, 32], // حجم الأيقونة
    iconAnchor: [16, 32], // نقطة ارتكاز الأيقونة (أسفل المنتصف)
    popupAnchor: [0, -32] // نقطة ظهور النافذة المنبثقة بالنسبة لنقطة الارتكاز
});
// --- منطق الخريطة ---
let initialUserLat = 0; // لتخزين خط العرض الأولي للمستخدم/مصر
let initialUserLon = 0; // لتخزين خط الطول الأولي للمستخدم/مصر
let isSelectingNewArea = false; // لتحديد ما إذا كان المستخدم في وضع اختيار منطقة جديدة
let currentSearchCenterMarker = null; // العلامة التي تشير إلى مركز البحث الحالي

// كائنات الخريطة والعلامات
let leafletMap = null;
let mapMarkers = [];

async function initMap() {
    if (!document.getElementById('map')) return;

    // إذا كانت الخريطة موجودة بالفعل، لا ننشئها من جديد
    if (leafletMap) return;

    addApiLog("🗺️ جاري تهيئة الخريطة...");

    // إحداثيات وسط جمهورية مصر العربية للعرض الشامل
    const egyptLat = 26.8206;
    const egyptLon = 30.8025;

    navigator.geolocation.getCurrentPosition(async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        initialUserLat = lat;
        initialUserLon = lon;
        setupMap(lat, lon, 14); // تقريب عالي لموقع المستخدم
    }, () => {
        showToast("يتم الآن عرض خريطة جمهورية مصر العربية.");
        initialUserLat = egyptLat;
        initialUserLon = egyptLon;
        setupMap(egyptLat, egyptLon, 6); // تقريب منخفض لعرض خريطة مصر بالكامل
    });
}

function setupMap(lat, lon, zoom = 14) {
    leafletMap = L.map('map').setView([lat, lon], zoom);
    // إنشاء pane مخصص لطبقة التسميات لضمان ظهورها فوق كل شيء آخر (بما في ذلك العلامات)
    leafletMap.createPane('labelsPane');
    leafletMap.getPane('labelsPane').style.zIndex = 650; // أعلى من العلامات (600)
    leafletMap.getPane('labelsPane').style.pointerEvents = 'none'; // السماح بالنقرات بالمرور من خلالها

    // تعريف طبقات الخريطة
    const layers = {
        osm: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }),
        satellite: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles &copy; Esri &mdash; Source: Esri, Maxar'
        }),
        labels: L.tileLayer('https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png', {
            attribution: '© CartoDB',
            pane: 'labelsPane' // استخدام الـ pane المخصص
        })
    };

    // البدء بخريطة القمر الصناعي مع طبقة التسميات افتراضياً
    layers.satellite.addTo(leafletMap);
    layers.labels.addTo(leafletMap);
    let activeLayerKey = 'satellite';

    // منطق تبديل الطبقات عند النقر على الزر
    const toggleBtn = document.getElementById('toggleMapLayerBtn');
    const toggleText = document.getElementById('mapLayerText');
    if (toggleText) toggleText.textContent = "خريطة عادية"; // النص الأولي للزر

    if (toggleBtn) {
        toggleBtn.onclick = () => {
            if (activeLayerKey === 'satellite') {
                // التبديل إلى خريطة عادية (OSM)
                leafletMap.removeLayer(layers.satellite);
                leafletMap.removeLayer(layers.labels);
                layers.osm.addTo(leafletMap);
                activeLayerKey = 'osm';
                if (toggleText) toggleText.textContent = "قمر صناعي";
            } else {
                // التبديل إلى قمر صناعي + تسميات
                leafletMap.removeLayer(layers.osm);
                layers.satellite.addTo(leafletMap);
                layers.labels.addTo(leafletMap); // إضافة التسميات مرة أخرى
                activeLayerKey = 'satellite';
                if (toggleText) toggleText.textContent = "خريطة عادية";
            }
        };
    }

    // إضافة مستمع لحدث النقر على الخريطة
    leafletMap.on('click', handleMapClick);
    // إضافة مستمع لحدث حركة الماوس لتغيير المؤشر
    leafletMap.on('mousemove', handleMapMouseMove);

    // جلب مكاتب الصرافة القريبة بناءً على الموقع الحالي
    fetchNearbyExchanges(lat, lon);
}

function clearMapMarkers() {
    mapMarkers.forEach(marker => {
        if (leafletMap && leafletMap.hasLayer(marker)) {
            leafletMap.removeLayer(marker);
        }
    });
    mapMarkers = [];

    if (currentSearchCenterMarker && leafletMap && leafletMap.hasLayer(currentSearchCenterMarker)) {
        leafletMap.removeLayer(currentSearchCenterMarker);
        currentSearchCenterMarker = null;
    }
}

function handleMapClick(e) {
    if (isSelectingNewArea) {
        isSelectingNewArea = false;
        leafletMap.getContainer().style.cursor = ''; // إعادة المؤشر الافتراضي
        if (domElements.searchNewAreaText) domElements.searchNewAreaText.textContent = "بحث في منطقة أخرى";
        showToast("جاري البحث في المنطقة الجديدة...");
        fetchNearbyExchanges(e.latlng.lat, e.latlng.lng);
    }
}

function handleMapMouseMove() {
    if (isSelectingNewArea) {
        leafletMap.getContainer().style.cursor = 'crosshair'; // تغيير المؤشر إلى علامة زائد
    } else {
        leafletMap.getContainer().style.cursor = ''; // إعادة المؤشر الافتراضي
    }
}

async function fetchNearbyExchanges(lat, lon) {
    const radius = 5000; // 5 كيلومتر

    // مسح العلامات القديمة قبل جلب الجديدة
    clearMapMarkers();

    // إضافة علامة لمركز البحث الحالي
    currentSearchCenterMarker = L.marker([lat, lon]).addTo(leafletMap)
        .bindPopup('<b>مركز البحث الحالي</b>').openPopup();

    const query = `[out:json];node(around:${radius},${lat},${lon})["amenity"="bureau_de_change"];out;`;
    const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;

    try {
        const res = await fetch(url);
        const data = await res.json();

        if (domElements.nearbyExchangesList) domElements.nearbyExchangesList.innerHTML = ""; // مسح القائمة الجانبية

        data.elements.forEach(el => {
            const name = el.tags['name:ar'] || el.tags.name || "مكتب صرافة";
            const dist = calculateDistance(lat, lon, el.lat, el.lon).toFixed(2);

            // إنشاء محتوى النافذة المنبثقة مع زر الاتجاهات
            const popupContent = `
                <div class="text-right font-sans">
                    <b class="text-slate-900 block mb-1">${name}</b>
                    <span class="text-[10px] text-cyan-600 font-bold"><i class="fa-solid fa-location-dot"></i> يبعد عنك ${dist} كم</span>
                    <div class="mt-3 border-t border-slate-100 pt-2">
                        <button onclick="window.openDirections(${el.lat}, ${el.lon})" 
                                class="bg-cyan-500 hover:bg-cyan-600 text-white text-[10px] font-bold py-1.5 px-3 rounded-lg transition-all flex items-center gap-2 w-full justify-center">
                            <i class="fa-solid fa-diamond-turn-right"></i> الحصول على الاتجاهات
                        </button>
                    </div>
                </div>
            `;
            const marker = L.marker([el.lat, el.lon], { icon: exchangeIcon }).addTo(leafletMap);
            marker.bindPopup(popupContent);
            mapMarkers.push(marker);

            // إضافة المكتب إلى القائمة النصية الجانبية
            if (domElements.nearbyExchangesList) {
                const item = document.createElement('div');
                item.className = "p-3 bg-slate-900/40 border border-slate-800 rounded-xl hover:border-cyan-500/30 transition cursor-pointer group";
                item.innerHTML = `
                    <div class="flex justify-between items-start gap-2">
                        <div class="overflow-hidden">
                            <p class="text-xs font-bold text-white group-hover:text-cyan-400 transition-colors truncate">${name}</p>
                            <p class="text-[10px] text-slate-500 mt-1"><i class="fa-solid fa-location-dot"></i> يبعد ${dist} كم</p>
                        </div>
                    </div>
                `;
                item.onclick = () => {
                    leafletMap.setView([el.lat, el.lon], 16);
                    marker.openPopup();
                };
                domElements.nearbyExchangesList.appendChild(item);
            }
        });

        if (data.elements.length === 0) {
            showToast("لم يتم العثور على مكاتب صرافة قريبة جداً.");
            if (domElements.nearbyExchangesList) domElements.nearbyExchangesList.innerHTML = '<p class="text-xs text-slate-500 italic text-center py-10">لم يتم العثور على مكاتب قريبة</p>';
        } else {
            addApiLog(`✅ تم العثور على ${data.elements.length} مكتب صرافة.`);
        }
    } catch (err) {
        addApiLog("❌ فشل جلب بيانات المكاتب.");
    }
}

// وظيفة عالمية لفتح خرائط جوجل بالاتجاهات
window.openDirections = (lat, lon) => {
    // استخدام رابط Universal Link لفتح خرائط جوجل مباشرة
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;
    window.open(url, '_blank');
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

        // إضافة تأثير Parallax بسيط عند تحريك الماوس
        document.addEventListener('mousemove', (e) => {
            const moveX = (e.clientX - window.innerWidth / 2) * 0.01;
            const moveY = (e.clientY - window.innerHeight / 2) * 0.01;
            const blobs = document.querySelectorAll('.bg-blob');
            blobs.forEach((blob, index) => {
                const factor = (index + 1) * 0.5;
                blob.style.transform = `translate(${moveX * factor}px, ${moveY * factor}px)`;
            });
        });
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

    // تهيئة التبويبات
    document.querySelectorAll('.market-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchMarketTab(btn.dataset.marketTab));
    });

    // تسجيل الـ Service Worker وطلب إذن الإشعارات
    if ('serviceWorker' in navigator) {
        // استخدام المسار النسبي الصحيح للـ Service Worker
        navigator.serviceWorker.register('./sw.js')
            .then((registration) => {
                console.log('✅ Service Worker جاهز');
                initPushNotifications(registration);
            })
            .catch((error) => {
                console.error('❌ Service Worker registration failed:', error);
            });
    }

    setInterval(simulateMarket, 5000);
    setInterval(() => { if (!isManualMode) fetchApiPrices(); }, 60000);

    // --- أحداث لوحة التحكم ---
    // استخدام Debounce للبحث لتقليل العمليات الحسابية المتكررة أثناء الكتابة السريعة
    const debouncedRenderCurrencies = debounce(() => renderCurrencies());
    document.getElementById('searchInput')?.addEventListener('input', debouncedRenderCurrencies);
    document.getElementById('amountInput')?.addEventListener('input', calculateConversion);
    document.getElementById('targetCurrency')?.addEventListener('change', calculateConversion);
    document.getElementById('amountInput')?.addEventListener('change', calculateConversion);

    // حدث التحديد التلقائي للموقع والدولة
    document.getElementById('autoDetectBtn')?.addEventListener('click', async () => {
        addApiLog("📍 جاري تحديد موقعك...");
        try {
            const res = await fetch('https://ipapi.co/json/');
            const data = await res.json();

            if (data.currency) {
                const detectedCurrency = data.currency;
                const select = domElements.displayCurrency;

                // إضافة العملة للقائمة إذا لم تكن موجودة
                const optionExists = Array.from(select.options).some(opt => opt.value === detectedCurrency);
                if (!optionExists) {
                    const newOpt = new Option(`عرض بـ (${detectedCurrency})`, detectedCurrency);
                    select.add(newOpt);
                }
                select.value = detectedCurrency;

                // تحديد اللغة بناءً على قائمة الدول العربية
                const arabCountries = ['EG', 'SA', 'AE', 'KW', 'QA', 'BH', 'OM', 'JO', 'LB', 'SY', 'IQ', 'MA', 'DZ', 'TN', 'LY', 'SD', 'YE', 'PS'];
                currentLang = arabCountries.includes(data.country_code) ? 'ar' : 'en';

                localStorage.setItem('site_lang', currentLang);
                applyTranslations();
                updateUI();

                showToast(`تم التحديد: ${data.country_name} (${detectedCurrency})`);
                addApiLog(`✅ تم تحديد الموقع: ${data.country_name}`);
            }
        } catch (error) {
            addApiLog("❌ فشل تحديد الموقع تلقائياً");
            showToast("عذراً، تعذر تحديد الموقع");
        }
    });

    // تحديث الواجهة عند تغيير عملة العرض يدوياً
    domElements.displayCurrency?.addEventListener('change', () => {
        updateUI();
    });

    // إغلاق مودال المقال
    document.getElementById('closeArticleModalBtn')?.addEventListener('click', () => domElements.articleModal.classList.add('hidden'));

    // وظيفة فتح لوحة التحكم المشتركة
    const handleOpenAdmin = () => {
        if (auth.currentUser?.email === ADMIN_EMAIL) {
            domElements.adminPanel.classList.remove('hidden');
            if (!domElements.loginModal.classList.contains('hidden')) {
                domElements.loginModal.classList.add('hidden');
            }
            // تعبئة القيم الحالية في المدخلات اليدوية عند الفتح
            document.getElementById('manualGoldPrice').value = goldPrice;
            document.getElementById('manualSilverPrice').value = silverPrice;
            document.getElementById('manualIronEzzPrice').value = ironEzzPrice;
            document.getElementById('manualIronEgyptiansPrice').value = ironEgyptiansPrice;
            document.getElementById('manualIronGarhyPrice').value = ironGarhyPrice;
            document.getElementById('manualEGP').value = exchangeRates.EGP;
            document.getElementById('manualSAR').value = exchangeRates.SAR;
            document.getElementById('manualEUR').value = exchangeRates.EUR;
        } else {
            domElements.loginModal.classList.remove('hidden');
        }
    };

    // ربط الحدث بزر الكمبيوتر وزر الهاتف
    document.getElementById('openAdminBtn')?.addEventListener('click', handleOpenAdmin);
    document.getElementById('mobileAdminBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        handleOpenAdmin();
    });

    // إغلاق لوحة التحكم
    document.getElementById('closeAdminBtn')?.addEventListener('click', () => domElements.adminPanel.classList.add('hidden'));
    document.getElementById('closeLoginBtn')?.addEventListener('click', () => domElements.loginModal.classList.add('hidden'));

    // برمجة الربط التلقائي بين سعر الأونصة والعيارات في لوحة التحكم
    const manualGoldInput = document.getElementById('manualGoldPrice');
    const manual24kInput = document.getElementById('manual24k');
    const manual21kInput = document.getElementById('manual21k');
    const manual18kInput = document.getElementById('manual18k');
    const manual14kInput = document.getElementById('manual14k');
    const manual12kInput = document.getElementById('manual12k');

    manualGoldInput?.addEventListener('input', (e) => {
        const ozPrice = parseFloat(e.target.value);
        if (ozPrice > 0) {
            const g24 = ozPrice / OUNCE_TO_GRAM;
            if (manual24kInput) manual24kInput.value = g24.toFixed(2);
            if (manual21kInput) manual21kInput.value = (g24 * 0.875).toFixed(2);
            if (manual18kInput) manual18kInput.value = (g24 * 0.75).toFixed(2);
            if (manual14kInput) manual14kInput.value = (g24 * (14/24)).toFixed(2);
            if (manual12kInput) manual12kInput.value = (g24 * 0.5).toFixed(2);
        }
    });

    // تهيئة محرر Quill
    if (document.getElementById('editor-container')) {
        quill = new Quill('#editor-container', {
            theme: 'snow',
            placeholder: 'اكتب محتوى المقال هنا...',
            modules: {
                toolbar: [
                    [{ 'header': [2, 3, false] }], // إضافة العناوين الفرعية للـ SEO
                    ['bold', 'italic', 'underline'],
                    ['link', 'image'],
                    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                    [{ 'direction': 'rtl' }]]
            }
        });
    }

    // معالجة تسجيل الدخول للمدير
    document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;

        // التحقق الأولي من البريد الإلكتروني قبل محاولة تسجيل الدخول
        if (email !== ADMIN_EMAIL) {
            showToast("عذراً، هذا البريد لا يملك صلاحيات وصول إدارية");
            return;
        }

        const spinner = document.getElementById('loginSpinner');
        spinner.classList.remove('hidden');
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            if (userCredential.user.email === ADMIN_EMAIL) {
                handleOpenAdmin(); // فتح اللوحة بعد التحقق
                showToast("تم تسجيل الدخول بنجاح ✅");
            }
        } catch (err) {
            alert("فشل الدخول: تأكد من كلمة المرور والبريد");
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
        { id: 'nearbyLink', section: 'nearby' }, { id: 'mobileNearbyLink', section: 'nearby' },
        { id: 'articlesLink', section: 'articles' }, { id: 'mobileArticlesLink', section: 'articles' },
        { id: 'faqLink', section: 'faq' },
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

    // --- برمجة زر ضبط التنبيه ---
    domElements.setAlertBtn?.addEventListener('click', () => {
        const threshold = parseFloat(domElements.alertThreshold.value);
        const selectedSound = domElements.soundSelect.value;
        const selectedDirection = domElements.alertDirection.value; // جلب اتجاه التنبيه

        if (threshold > 0) {
            // طلب إذن الإشعارات برمجياً عند التفعيل لضمان عملها "حقيقياً"
            if (Notification.permission !== "granted") {
                Notification.requestPermission();
            }

            localStorage.setItem('goldPriceAlert', threshold);
            localStorage.setItem('selectedNotificationSound', selectedSound);
            localStorage.setItem('alertDirection', selectedDirection); // حفظ اتجاه التنبيه
            showToast(`تم ضبط التنبيه: ${selectedDirection === 'above' ? 'أعلى من' : 'أقل من'} $${threshold}`);
            addApiLog(`🎯 تم ضبط تنبيه السعر ${selectedDirection === 'above' ? 'أعلى من' : 'أقل من'} $${threshold}`);

            // تغيير شكل الزر ليوضح أن هناك تنبيهاً نشطاً (ذهبي)
            domElements.setAlertBtn.classList.remove('bg-cyan-500/10', 'text-cyan-400', 'border-cyan-500/20');
            domElements.setAlertBtn.classList.add('bg-amber-500/20', 'text-amber-400', 'border-amber-500/40');
        } else {
            showToast("يرجى إدخال سعر صحيح للتنبيه");
        }
    });

    // استعادة حالة التنبيه النشط عند فتح الصفحة (Persistence)
    const savedAlert = localStorage.getItem('goldPriceAlert');
    if (savedAlert && domElements.alertThreshold && domElements.setAlertBtn) {
        domElements.alertThreshold.value = savedAlert;
        domElements.setAlertBtn.classList.remove('bg-cyan-500/10', 'text-cyan-400', 'border-cyan-500/20');
        domElements.setAlertBtn.classList.add('bg-amber-500/20', 'text-amber-400', 'border-amber-500/40');
        if (localStorage.getItem('alertDirection')) {
            domElements.alertDirection.value = localStorage.getItem('alertDirection');
        }
    }

    // حدث زر "بحث في منطقة أخرى"
    domElements.searchNewAreaBtn?.addEventListener('click', () => {
        isSelectingNewArea = !isSelectingNewArea;
        if (isSelectingNewArea) {
            if (domElements.searchNewAreaText) domElements.searchNewAreaText.textContent = "انقر على الخريطة...";
            showToast("انقر على الخريطة لتحديد منطقة البحث الجديدة.");
        } else {
            if (domElements.searchNewAreaText) domElements.searchNewAreaText.textContent = "بحث في منطقة أخرى";
            leafletMap.getContainer().style.cursor = ''; // إعادة المؤشر الافتراضي
            showToast("تم إلغاء وضع البحث في منطقة أخرى.");
        }
    });

    // تحديث الخريطة
    document.getElementById('refreshMapBtn')?.addEventListener('click', () => {
        if (leafletMap) {
            leafletMap.remove(); // حذف كائن الخريطة القديم من الذاكرة
            leafletMap = null;
        }
        document.getElementById('map').innerHTML = "";
        if (domElements.nearbyExchangesList) domElements.nearbyExchangesList.innerHTML = '<p class="text-xs text-slate-500 italic text-center py-10">جاري البحث عن مكاتب قريبة...</p>';
        // إعادة تهيئة الخريطة والبحث عن المكاتب في الموقع الأولي
        initMap();
    });

    // حفظ الأسعار يدوياً إلى Firebase
    document.getElementById('saveManualPrices')?.addEventListener('click', async () => {
        const manualEgpRate = parseFloat(document.getElementById('manualEGP').value) || exchangeRates.EGP;
        const currentManualGoldPrice = parseFloat(document.getElementById('manualGoldPrice').value) || goldPrice;

        // حساب أسعار العيارات يدوياً أو من المدخلات
        const manualCarats = {
            k24: parseFloat(document.getElementById('manual24k').value) || (parseFloat(document.getElementById('manual24kEGP').value) / manualEgpRate) || (currentManualGoldPrice / OUNCE_TO_GRAM),
            k21: parseFloat(document.getElementById('manual21k').value) || (parseFloat(document.getElementById('manual21kEGP').value) / manualEgpRate) || ((currentManualGoldPrice / OUNCE_TO_GRAM) * 0.875),
            k18: parseFloat(document.getElementById('manual18k').value) || (parseFloat(document.getElementById('manual18kEGP').value) / manualEgpRate) || ((currentManualGoldPrice / OUNCE_TO_GRAM) * 0.75),
            k14: parseFloat(document.getElementById('manual14k').value) || (parseFloat(document.getElementById('manual14kEGP').value) / manualEgpRate) || ((currentManualGoldPrice / OUNCE_TO_GRAM) * (14/24)),
            k12: parseFloat(document.getElementById('manual12k').value) || (parseFloat(document.getElementById('manual12kEGP').value) / manualEgpRate) || ((currentManualGoldPrice / OUNCE_TO_GRAM) * 0.5)
        };

        const newPrices = {
            gold: parseFloat(document.getElementById('manualGoldPrice').value) || goldPrice,
            silver: parseFloat(document.getElementById('manualSilverPrice').value) || silverPrice,
            ironEzz: parseFloat(document.getElementById('manualIronEzzPrice').value) || ironEzzPrice,
            ironEgyptians: parseFloat(document.getElementById('manualIronEgyptiansPrice').value) || ironEgyptiansPrice,
            ironGarhy: parseFloat(document.getElementById('manualIronGarhyPrice').value) || ironGarhyPrice,
            carats: manualCarats,
            rates: {
                EGP: manualEgpRate,
                SAR: parseFloat(document.getElementById('manualSAR').value) || exchangeRates.SAR,
                EUR: parseFloat(document.getElementById('manualEUR').value) || exchangeRates.EUR
            },
            makingCharges: {
                k24: parseFloat(document.getElementById('making24k').value) || 0,
                k21: parseFloat(document.getElementById('making21k').value) || 0,
                k18: parseFloat(document.getElementById('making18k').value) || 0,
                k14: parseFloat(document.getElementById('making14k').value) || 0,
                k12: parseFloat(document.getElementById('making12k').value) || 0
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
        domElements.scrollIcon.classList.remove('fa-arrow-down');
        domElements.scrollIcon.classList.add('fa-arrow-up');
    } else { // إذا كان المستخدم في أي مكان آخر
        domElements.scrollIcon.classList.remove('fa-arrow-up');
        domElements.scrollIcon.classList.add('fa-arrow-down');
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
        "publisher": {
            "@type": "Organization",
            "name": "GoldHub",
            "logo": {
                "@type": "ImageObject",
                "url": "https://gold-hub.com/icon.png"
            }
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
