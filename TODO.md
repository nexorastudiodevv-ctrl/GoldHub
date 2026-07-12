# TODO - GoldHub: Cache ذكي لأسعار الذهب (اقتصادي)

- [ ] تحديث `api/getPrices.js`:
  - [ ] إضافة قراءة Firebase Realtime Database لمسار يحتوي على آخر وقت تحديث سعر الذهب (market_prices.lastUpdated أو ما يعادله)
  - [ ] إذا كان الفرق الزمني < 8 ساعات: إعادة آخر سعر مخزن في Firebase بدون أي طلب GoldAPI
  - [ ] إذا كان الفرق الزمني >= 8 ساعات: جلب سعر الذهب من GoldAPI.io باستخدام `process.env.GOLD_API_KEY` ثم تحديث Firebase بالمعدل + وقت التحديث
  - [ ] إضافة fallback: إذا فشل أي شيء، يتم إرجاع آخر سعر مخزّن مسبقاً داخل الدالة (fallback ثابت)
  - [ ] التأكد من عدم إرسال مفتاح GoldAPI للعميل

- [ ] تحديث `app.js`:
  - [ ] جعل fetch يعمل عند تحميل الصفحة مرة واحدة (بدل setInterval المستمر)
  - [ ] تقليل استهلاك الدالة مع الإبقاء على زر التحديث اليدوي (اختياري)

- [ ] تحديث Firebase structure (اختياري حسب الموجود):
  - [ ] التأكد من وجود الحقول اللازمة مثل `market_prices.gold` و `market_prices.lastUpdated`

- [ ] اختبار محلي (اختياري):
  - [ ] تشغيل build/serve والتحقق أن fetch('/api/getPrices') يحدّث الواجهة

- [ ] رفع التغييرات إلى GitHub

