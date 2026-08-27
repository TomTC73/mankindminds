import "./Home.css";
import { Link } from "react-router-dom";
import { useLocation } from "react-router-dom";
import Header from "./Header";
import backgroundImage from "./assets/BackgroundHome.png";
import MapPage from "./MapPage";

function Home() {
  const { pathname } = useLocation();
  const isTattooHome = pathname === "/tattoos";

  return (
    <div
      className="home-page"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <Header />

      <section className="home-hero">
        <div className="home-content">
          <div className="hero-box">
            <h2>Human Creativity Certified</h2>

            <p>
              Verify creators, showcase trusted certificates, and give brands,
              followers, and collaborators confidence in who they are working with.
            </p>

            <Link to="/certificates">
              <button className="button">View Creators</button>
            </Link>

            <Link to="/about">
              <button className="button secondary-button">
                About Verification
              </button>
            </Link>
          </div>

        </div>
      </section>

      {isTattooHome && (
        <section className="home-map" aria-label="Tattoo studio map and directory">
          <MapPage embedded />
        </section>
      )}

    </div>
  );
}

export default Home;
