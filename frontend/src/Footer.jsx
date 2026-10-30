import { Link } from "react-router-dom";
import { openConsentSettings } from "./consent";

function Footer() {
  return (
    <footer className="footer">
      <p>© 2026 Mankind Minds. All rights reserved.</p>
      <p>
        <Link to="/terms">Terms & Conditions</Link>
        {" | "}
        <Link to="/privacy-policy">Privacy Policy</Link>
        {" | "}
        <button type="button" className="footer-link-button" onClick={openConsentSettings}>
          Analytics preferences
        </button>
      </p>
    </footer>
  );
}

export default Footer;
