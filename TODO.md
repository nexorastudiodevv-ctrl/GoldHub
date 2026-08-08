# TODO - خطة تحسين أداء الموقع (Tailwind v4 + Lazy Loading)

## الخطوات

- [ ] 1. تحديث `input.css` إلى صيغة Tailwind v4 مع نقل إعدادات `tailwind.config.js` إلى `@theme`
- [ ] 2. توليد ملف `dist/output.css` النهائي المصغّر بأمر CLI
- [ ] 3. تعديل `index.html`:
  - [ ] استبدال سكريبت Tailwind CDN بـ `<link preload>` + `<link stylesheet>`
  - [ ] إضافة أبعاد ثابتة (min-height/aspect-ratio) لحاويات الخرائط والرسوم البيانية والبطاقات
  - [ ] تحميل FontAwesome بشكل غير حاجب مع `font-display: swap`
  - [ ] حذف وسوم CDN لـ Leaflet و Quill (سيتم تحميلها ديناميكياً)
- [ ] 4. تعديل `app.js`:
  - [ ] إضافة `loadScript()` و `loadStyle()`
  - [ ] تحميل Chart.js ديناميكياً بعد أول عرض
  - [ ] تحميل Leaflet عبر Intersection Observer عند اقتراب قسم الخريطة
  - [ ] تحويل Firebase Auth إلى Dynamic `import()`
- [ ] 5. تحديث `sw.js` لمصفوفة الكاش الجديدة (dist/output.css، حذف القديم)
- [ ] 6. اختبار الموقع محلياً وإعادة قياس الأداء
