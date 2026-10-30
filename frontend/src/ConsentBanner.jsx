import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAnalyticsConsent, setAnalyticsConsent, subscribeToConsent } from "./consent";

function ConsentBanner() {
  const [choice, setChoice] = useState(getAnalyticsConsent);

  useEffect(() => subscribeToConsent(() => setChoice(getAnalyticsConsent())), []);

  if (choice) return null;

  return (
    <div className="consent-banner" role="dialog" aria-label="Analytics preferences">
      <p>
        We would like to use anonymous analytics to see how the site is used. You can change your mind
        at any time. See our <Link to="/privacy-policy">Privacy Policy</Link>.
      </p>
      <div className="consent-actions">
        <button type="button" className="consent-reject" onClick={() => setAnalyticsConsent("denied")}>
          Reject
        </button>
        <button type="button" className="consent-accept" onClick={() => setAnalyticsConsent("granted")}>
          Accept
        </button>
      </div>
    </div>
  );
}

export default ConsentBanner;
