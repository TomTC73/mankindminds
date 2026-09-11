import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { API_URL } from "./apiConfig";

const VISITOR_ID_KEY = "mankind_minds_analytics_id";

function getAnonymousVisitorId() {
  try {
    let visitorId = window.localStorage.getItem(VISITOR_ID_KEY);
    if (!visitorId) {
      visitorId = window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
      window.localStorage.setItem(VISITOR_ID_KEY, visitorId);
    }
    return visitorId;
  } catch {
    return `session-${Date.now()}`;
  }
}

function AnalyticsTracker() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    const controller = new AbortController();
    const payload = {
      sessionId: getAnonymousVisitorId(),
      path: `${pathname}${search}`,
      referrer: document.referrer || "",
      screenWidth: window.screen.width,
    };

    fetch(`${API_URL}/analytics/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
      keepalive: true,
    }).catch(() => {
      // Analytics must never interrupt the public site.
    });

    return () => controller.abort();
  }, [pathname, search]);

  return null;
}

export default AnalyticsTracker;
