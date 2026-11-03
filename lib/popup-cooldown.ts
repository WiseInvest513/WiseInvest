declare global {
  interface Window { __wisePopupShownAt?: number; }
}

const POPUP_SHOWN_AT_KEY = "wise-popup-last-shown-at-v1";
const POPUP_INTERVAL_MS = 3 * 60 * 60 * 1000;

// Shared by automatic recommendations and the manual community entry on this site.
function getPopupShownAt() {
  let latest = window.__wisePopupShownAt || 0;
  for (const storageName of ["localStorage", "sessionStorage"] as const) {
    try {
      const storage = window[storageName];
      const values = [
        Number(storage.getItem(POPUP_SHOWN_AT_KEY)),
        Number(storage.getItem("wise-ipo-stockcoin-promo-dismissed-at")),
      ];
      try {
        values.push(Number(JSON.parse(storage.getItem("wise_invest_recommendation_log") || "null")?.lastShownTime));
      } catch { /* Ignore an invalid legacy record. */ }
      for (const value of values) {
        if (Number.isFinite(value) && value > 0 && value <= Date.now()) latest = Math.max(latest, value);
      }
    } catch { /* Storage may be unavailable in a restricted browser. */ }
  }
  return latest;
}

export function shouldShowAutomaticPopup() {
  return Date.now() - getPopupShownAt() >= POPUP_INTERVAL_MS;
}

export function recordPopupShown() {
  const now = Date.now();
  window.__wisePopupShownAt = now;
  for (const storageName of ["localStorage", "sessionStorage"] as const) {
    try { window[storageName].setItem(POPUP_SHOWN_AT_KEY, String(now)); } catch { /* Keep the in-page fallback. */ }
  }
}
