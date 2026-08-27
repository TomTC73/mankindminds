import "./Header.css";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import logo from "./assets/favicon.png";

const sections = [
  { label: "Tattoos", path: "/tattoos" },
  { label: "Music", path: "/music" },
  { label: "Writing", path: "/writing" },
  { label: "Art", path: "/art" },
];

function Header() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const switcherRef = useRef(null);
  const sectionFromPath = sections.find((section) => section.path === pathname);
  const [selectedSection, setSelectedSection] = useState(() => {
    const savedSection = sessionStorage.getItem("selectedSection");
    return (
      sectionFromPath?.path ||
      (sections.some((section) => section.path === savedSection)
        ? savedSection
        : "/tattoos")
    );
  });
  const selectedLabel = sections.find(
    (section) => section.path === selectedSection,
  ).label;
  const isTattooSection = selectedSection === "/tattoos";

  useEffect(() => {
    if (sectionFromPath) {
      setSelectedSection(sectionFromPath.path);
      sessionStorage.setItem("selectedSection", sectionFromPath.path);
    }
  }, [sectionFromPath]);

  useEffect(() => {
    const closeOnOutsideClick = (event) => {
      if (!switcherRef.current?.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    const closeOnEscape = (event) => {
      if (event.key === "Escape") setIsMenuOpen(false);
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  const selectSection = (path) => {
    setIsMenuOpen(false);
    setSelectedSection(path);
    sessionStorage.setItem("selectedSection", path);
    navigate(path);
  };

  return (
    <header className="header">
      <div className="section-switcher" ref={switcherRef}>
        <button
          type="button"
          className="section-switcher-trigger"
          aria-expanded={isMenuOpen}
          aria-controls="section-menu"
          onClick={() => setIsMenuOpen((isOpen) => !isOpen)}
        >
          {selectedLabel}
          <span className="section-switcher-chevron" aria-hidden="true" />
        </button>
        <div
          id="section-menu"
          className={`section-menu ${isMenuOpen ? "is-open" : ""}`}
          aria-hidden={!isMenuOpen}
        >
          {sections.map((section) => (
            <button
              type="button"
              key={section.path}
              className={`section-menu-option ${
                section.path === selectedSection ? "is-active" : ""
              }`}
              tabIndex={isMenuOpen ? 0 : -1}
              onClick={() => selectSection(section.path)}
            >
              {section.label}
            </button>
          ))}
        </div>
      </div>

      <Link to="/tattoos" className="logo-container" aria-label="Mankind Minds home">
        <img src={logo} alt="Mankind Minds" className="logo-image" />
      </Link>

      <nav className="nav">
        <Link to="/process">Process</Link>
        <Link to={isTattooSection ? "/map" : "/certificates"}>
          {isTattooSection ? "Map" : "Certificates"}
        </Link>
        <Link
          to={{
            pathname: "/apply",
            search: `?category=${selectedLabel.toLowerCase()}`,
          }}
          className="contact-link"
        >
          Apply
        </Link>
      </nav>
    </header>
  );
}

export default Header;
