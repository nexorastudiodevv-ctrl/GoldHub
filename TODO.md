# TODO: Lighthouse Critical Request Chain Optimization

## Goals
- Reduce render-blocking from FontAwesome (~600ms).
- Prevent heavy Firebase SDKs (Auth, Analytics, Messaging) from chain-loading and freezing LCP.
- Prevent `getProjectConfig` from blocking the core UI render.

## Steps

### Step 1: `index.html` — Make FontAwesome non-blocking
- [ ] Replace the render-blocking FontAwesome `<link rel="stylesheet">` with the `preload` + `media="print" onload` + `<noscript>` pattern.

### Step 2: `index.html` — Document deferred ES-module imports
- [ ] Add a comment near `<script type="module" src="app.js">` explaining Firebase is loaded via deferred ES-module/dynamic imports.

### Step 3: `app.js` — Split Firebase loading
- [ ] Keep static imports for `firebase-app` + `firebase-database`.
- [ ] Convert `firebase-auth`, `firebase-analytics`, `firebase-messaging` to lazy dynamic `import()`.
- [ ] Create `initLazyFirebaseServices()` triggered via `requestIdleCallback`/`setTimeout` after core UI renders.
- [ ] Initialize `auth`, `analytics`, `messaging` as `null` initially.

### Step 4: `app.js` — Update Auth/Messaging usages
- [ ] Guard all `auth`/`messaging` usages with async awaits for `initLazyFirebaseServices()`:
  - `initPushNotifications` (messaging)
  - Admin-panel check (`auth.currentUser`)
  - Login handler (`signInWithEmailAndPassword`)
  - Logout handler (`signOut`)
  - Articles listener (`auth.currentUser`)
- [ ] Handle possibly-null `auth`/`messaging`.

### Follow-up
- [ ] Verify page loads fast and prices render quickly.
- [ ] Confirm admin login still works.
