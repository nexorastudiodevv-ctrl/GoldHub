# TODO — إصلاح مشكلة تغيّر التخطيط (CLS)

## الهدف
تقليل نتيجة Cumulative Layout Shift من **0.531** إلى أقل من **0.1** لتحسين أداء PageSpeed.

## أسباب التغيّر (تحليل)
- [x] عناصر أسعار العيارات (`#price-24k/21k/18k/14k/12k`) تبدأ فارغة ثم تُملأ بالأسعار
- [x] قائمة العملات (`#currencyList`) تبدأ بـ 3 عناصر فقط ثم تُستبدل بعشرات العملات
- [x] السعر الرئيسي للذهب `#mainGoldPrice` يتغير عرضه عند التحديث
- [x] أيقونات FontAwesome تُحمَّل متأخرة (media="print") مما يغيّر التخطيط
- [x] صور أعلام العملات بدون أبعاد محجوزة (width/height)

## الخطوات التفصيلية
- [ ] إضافة CSS في `index.html` لحجز مساحات ثابتة:
  - `min-height` لعناصر `[id^="price-"]`
  - `min-height` لعناصر `[id^="making-"]`
  - `min-height` لحاوية `#currencyList`
  - `min-width` للسعر الرئيسي `#mainGoldPrice`
  - `min-width: 1em` لأيقونات FontAwesome
- [ ] إضافة `width` و `height` لصور أعلام العملات في `app.js`
- [ ] التحقق من الشفرة بعد التعديل (اختبار محلي)
- [ ] الرفع إلى GitHub (`main`)

