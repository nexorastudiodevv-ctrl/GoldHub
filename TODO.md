# Performance Optimization TODO

## Step 1 — Logo / FontAwesome / Service Worker (in progress)
- [ ] 1. Create lightweight `icon.svg` (replace 2MB `icon.webp`)
- [ ] 2. Update `index.html`:
  - [ ] Embed inline SVG logo in sidebar (replace `icon.webp`)
  - [ ] Remove duplicate FontAwesome `<link>` tags; keep one non-render-blocking
  - [ ] Clean up unused legacy scripts
- [ ] 3. Update `sw.js`:
  - [ ] Fix stale `dist/output.css` → `styles.css`
  - [ ] Stale-While-Revalidate caching strategy for static assets

## Step 2 — Cache headers & reflow
- [ ] 4. Add cache headers in `firebase.json`
- [ ] 5. Fix forced reflow in `app.js` (`switchMarketTab`)

## Step 3 — Lazy-load heavy libraries
- [ ] 6. Lazy-load Leaflet & Quill only when sections open
