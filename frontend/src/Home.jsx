import "./Home.css";
import { Link } from "react-router-dom";
import { useLocation } from "react-router-dom";
import Header from "./Header";
import backgroundImage from "./assets/BackgroundHome.png";
import MapPage from "./MapPage";
import HomeFeaturedCreators from "./HomeFeaturedCreators";
import Footer from "./Footer";

function Home() {
  const { pathname } = useLocation();
  const isTattooHome = pathname === "/tattoos";

  return (
    <div
      className={`home-page ${isTattooHome ? "tattoo-home" : ""}`}
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <Header />

      <section
        className={`home-hero ${isTattooHome ? "tattoo-home-hero" : ""}`}
        style={isTattooHome ? { backgroundImage: `url(${backgroundImage})` } : undefined}
      >
        <div className="home-content">
          <div className="hero-box">
            <h2>AI-Free Confidence</h2>

            <p>
              Verify your work is AI-free. Meet creators who share your commitment. Champion human authenticity
            </p>

            <div className="hero-actions">
              <Link to={isTattooHome ? "/process/tattoos" : `/process${pathname}`}>
                <button className="button">Process</button>
              </Link>
              {isTattooHome ? (
                <Link to="/certificates?category=tattoos">
                  <button className="button secondary-button">View Creators</button>
                </Link>
              ) : (
                <Link to={`/certificates?category=${pathname.slice(1)}`}>
                  <button className="button secondary-button">View Creators</button>
                </Link>
              )}
            </div>
          </div>

        </div>
      </section>

      {!isTattooHome && (
        <HomeFeaturedCreators category={pathname.slice(1)} />
      )}

      {isTattooHome && (
        <section className="home-map" aria-label="Tattoo studio map and directory">
          <MapPage embedded />
        </section>
      )}

      <Footer />
    </div>
  );
}

export default Home;
