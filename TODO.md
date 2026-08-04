# TODO - إضافة أزرار مشاركة المقالات (فيسبوك، تويتر، لينكدإن، واتساب، تيليجرام، نسخ الرابط)

## Steps

1. [x] Edit `index.html`: Add share buttons row (فيسبوك، تويتر، لينكدإن، واتساب، تيليجرام، نسخ الرابط) inside the article modal `#articleModal`.
2. [x] Edit `app.js`:
   - Add `currentArticleId` variable.
   - Update `openArticleModal` to store the current article ID and display image/date.
   - Add `window.shareArticle(platform)` function that opens the appropriate share popup/link with the article title & URL.
3. [ ] Test the share buttons in the browser.
