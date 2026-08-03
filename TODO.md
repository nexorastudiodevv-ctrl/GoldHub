# TODO — تحديث SEO إلى الدومين الجديد nexorastudio-eg.com

## الأهداف
- [x] استبدال جميع إشارات `gold-hub.com` في ملفات الموقع بالدومين الجديد `nexorastudio-eg.com`
- [x] تحديث `robots.txt` ليشير إلى ملف Sitemap الجديد
- [x] تحديث `sitemap.xml` بجميع روابط الدومين الجديد
- [x] تحديث `app.js` (روابط schema الخاصة بالمقالات)
- [x] تحديث إصدار ذاكرة التخزين المؤقت لـ Service Worker (`gold-hub-v5` → `gold-hub-v6`)
- [x] التحقق من صحة الملفات بعد التعديل

## الخطوات التفصيلية
- [x] تعديل `index.html` — جميع الإشارات في JSON-LD
- [x] تعديل `robots.txt` — سطر Sitemap
- [x] تعديل `sitemap.xml` — جميع الروابط
- [x] تعديل `app.js` — مراجع `goldcurrencyhub.com`
- [x] تعديل `sw.js` — رفع إصدار الكاش إلى `gold-hub-v6`

## خطوات ما بعد التعديل
- [x] نشر التحديثات على GitHub Pages (push إلى main)
- [ ] في Google Search Console: التحقق من الملكية للدومين `nexorastudio-eg.com`
- [ ] إرسال `sitemap.xml` في Search Console
- [ ] إعادة فحص الفهرس
