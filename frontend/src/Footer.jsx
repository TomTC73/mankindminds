import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="footer">
      <p>© 2026 Mankind Minds. All rights reserved.</p>
      <p>
        <Link to="/terms">Terms & Conditions</Link>
        {" | "}
        <Link to="/privacy-policy">Privacy Policy</Link>
      </p>
    </footer>
  );
}

export default Footer;
