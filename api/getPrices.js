/*************************************************
 * Serverless Function (Vercel)
 * Endpoint: /api/getPrices
 *
 * Purpose (Economical + Professional):
 * - Read last update timestamp from Firebase Realtime Database (market_prices.lastUpdated)
 * - If < 8 hours: return stored prices from Firebase without calling GoldAPI
 * - If >= 8 hours: fetch gold price from GoldAPI.io using process.env.GOLD_API_KEY
 *                  then update Firebase (market_prices.gold + lastUpdated)
 * - If Firebase/GoldAPI fails: return last known prices (fallback constants)
 *
 * Env vars (set in Vercel Dashboard):
 *   - GOLD_API_KEY
 *   - FIREBASE_DATABASE_URL (optional but recommended)
 *************************************************/

// IMPORTANT:
// - Do NOT expose GOLD_API_KEY to client.
// - This file runs only on Vercel serverless.

import { initializeApp, getApps } from "firebase-admin/app";
import { getDatabase, ref, get, set as fbSet } from "firebase-admin/database";

function safeNumber(v, def) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : def;
}

function getFirebaseConfig(databaseURL) {
  // For Firebase Admin SDK with Realtime DB, databaseURL is enough (no auth required for public DB rules).
  return {
    databaseURL,
  };
}

function initFirebaseAdmin(databaseURL) {
  if (getApps().length) return;
  initializeApp(getFirebaseConfig(databaseURL));
}

export default async function handler(req, res) {
  const fallback = {
    rates: {
      USD: 1,
      EUR: 0.92,
      EGP: 48.5,
      SAR: 3.75,
      AED: 3.67,
      GBP: 0.79,
      KWD: 0.31,
      QAR: 3.64,
      TRY: 32.5,
      JPY: 156.0,
      CAD: 1.36,
      BHD: 0.37,
      OMR: 0.38,
      JOD: 0.71,
      AUD: 1.5,
      CHF: 0.91,
      CNY: 7.24,
    },
    metals: {
      // oz USD
      goldOzUsd: 2350.75,
      silverOzUsd: 28.0,
      platinumOzUsd: 980.0,
      copperUsd: 4.5,
    },
    lastUpdated: 0,
  };

  const MAX_AGE_MS = 8 * 60 * 60 * 1000; // 8 hours

  try {
    const databaseURL = process.env.FIREBASE_DATABASE_URL;
    if (!databaseURL) {
      // Firebase not configured on Vercel => just fallback (or still attempt currency)
      return res.status(200).json({ ok: false, error: "Missing FIREBASE_DATABASE_URL", ...fallback });
    }

    initFirebaseAdmin(databaseURL);
    const db = getDatabase();

    const marketRef = ref(db, "market_prices");

    // 1) Read last data from Firebase
    let firebaseData = null;
    try {
      const snap = await get(marketRef);
      firebaseData = snap?.val() || null;
    } catch (e) {
      firebaseData = null;
    }

    const lastUpdated = safeNumber(firebaseData?.lastUpdated, fallback.lastUpdated);
    const goldOzUsdFromFirebase = safeNumber(firebaseData?.gold, fallback.metals.goldOzUsd);

    const ageMs = Date.now() - lastUpdated;
    const shouldRefresh = !lastUpdated || ageMs >= MAX_AGE_MS;

    // Helper: also refresh rates (cheap/free) every time endpoint is hit.
    // (Does not affect GoldAPI request count.)
    let rates = { ...fallback.rates };
    try {
      const currencyUrl = `https://open.er-api.com/v6/latest/USD`;
      const currencyRes = await fetch(currencyUrl);
      if (currencyRes.ok) {
        const currData = await currencyRes.json();
        rates = { ...fallback.rates, ...(currData?.rates || {}) };
        rates.USD = 1;
      }
    } catch {
      // keep fallback
    }

    // 2) If cached is fresh (< 8h) => return stored prices without calling GoldAPI
    if (!shouldRefresh && firebaseData) {
      return res.status(200).json({
        ok: true,
        rates,
        metals: {
          goldOzUsd: goldOzUsdFromFirebase,
          silverOzUsd: safeNumber(firebaseData?.silver, fallback.metals.silverOzUsd),
          platinumOzUsd: safeNumber(firebaseData?.platinum, fallback.metals.platinumOzUsd),
          copperUsd: safeNumber(firebaseData?.copper, fallback.metals.copperUsd),
        },
        lastUpdated,
        cached: true,
      });
    }

    // 3) Cached is stale => call GoldAPI and update Firebase
    let goldOzUsd = goldOzUsdFromFirebase;

    try {
      const GOLD_API_KEY = process.env.GOLD_API_KEY;
      if (!GOLD_API_KEY) throw new Error("Missing GOLD_API_KEY");

      // GoldAPI.io endpoint shape varies by plan/version.
      // We try a common pattern. If your provider uses another path, adjust here.
      // This must be server-side only.
      const urlCandidates = [
        `https://goldapi.io/api/XAU/USD`,
        `https://www.goldapi.io/api/XAU/USD`,
      ];

      let lastErr = null;
      for (const url of urlCandidates) {
        try {
          const r = await fetch(url, {
            headers: {
              // Typical GoldAPI.io expects: x-access-token
              "x-access-token": GOLD_API_KEY,
            },
          });
          if (!r.ok) throw new Error(`GoldAPI failed: ${r.status}`);
          const data = await r.json();

          // Try multiple known fields
          const candidate =
            data?.price_usd ??
            data?.price ??
            data?.xau?.price ??
            data?.data?.price;

          const price = safeNumber(candidate, 0);
          if (!price) throw new Error("Gold price missing/invalid");

          goldOzUsd = price;
          break;
        } catch (e) {
          lastErr = e;
        }
      }

      if (!goldOzUsd || goldOzUsd <= 0) throw lastErr || new Error("Gold price invalid");

      // Update Firebase (economical: only this refresh writes once per 8h)
      await fbSet(marketRef, {
        ...(firebaseData || {}),
        gold: goldOzUsd,
        lastUpdated: Date.now(),
      });

      return res.status(200).json({
        ok: true,
        rates,
        metals: {
          goldOzUsd,
          silverOzUsd: safeNumber(firebaseData?.silver, fallback.metals.silverOzUsd),
          platinumOzUsd: safeNumber(firebaseData?.platinum, fallback.metals.platinumOzUsd),
          copperUsd: safeNumber(firebaseData?.copper, fallback.metals.copperUsd),
        },
        lastUpdated: Date.now(),
        cached: false,
      });
    } catch (e) {
      // 4) Fallback: if GoldAPI fails, return last stored values (if any)
      const nowLastUpdated = lastUpdated || fallback.lastUpdated;
      return res.status(200).json({
        ok: false,
        error: e?.message || "GoldAPI refresh failed",
        rates,
        metals: {
          goldOzUsd: goldOzUsdFromFirebase,
          silverOzUsd: safeNumber(firebaseData?.silver, fallback.metals.silverOzUsd),
          platinumOzUsd: safeNumber(firebaseData?.platinum, fallback.metals.platinumOzUsd),
          copperUsd: safeNumber(firebaseData?.copper, fallback.metals.copperUsd),
        },
        lastUpdated: nowLastUpdated,
        cached: false,
      });
    }
  } catch (e) {
    return res.status(200).json({ ok: false, error: e?.message || "Unknown error", ...fallback });
  }
}


