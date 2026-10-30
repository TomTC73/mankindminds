const CONSENT_KEY = "mankind_minds_analytics_consent";
const VISITOR_ID_KEY = "mankind_minds_analytics_id";
const CHANGE_EVENT = "mankind-minds-consent-change";

// Returns "granted", "denied" or null (not chosen yet).
export function getAnalyticsConsent() {
  try {
    const value = window.localStorage.getItem(CONSENT_KEY);
    return value === "granted" || value === "denied" ? value : null;
  } catch {
    return null;
  }
}

export function setAnalyticsConsent(value) {
  try {
    window.localStorage.setItem(CONSENT_KEY, value);
    if (value !== "granted") window.localStorage.removeItem(VISITOR_ID_KEY);
  } catch {
    // Storage unavailable: the choice simply is not remembered.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function subscribeToConsent(callback) {
  window.addEventListener(CHANGE_EVENT, callback);
  return () => window.removeEventListener(CHANGE_EVENT, callback);
}

export function openConsentSettings() {
  try {
    window.localStorage.removeItem(CONSENT_KEY);
  } catch {
    // Ignore.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}
