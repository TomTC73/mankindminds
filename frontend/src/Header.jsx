import "./Header.css";
import { Link } from "react-router-dom";
import image from "./assets/favicon.png";

function Header() {
  return (
    <header className="header">
      <Link to="/" className="logo-container">
        <img src={image} alt="Logo" className="logo-image" />
      </Link>

      <nav className="nav">
        <Link to="/about">About</Link>
        <Link to="/process">Process</Link>
        <Link to="/certificates">Certificates</Link>
        <Link to="/map">Map</Link>
        <Link to="/apply" className="contact-link">
          Apply
        </Link>
      </nav>
    </header>
  );
}

export default Header;