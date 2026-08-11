// 1. ADDED THIS: Imported useEffect and useRef hooks from React
import { useEffect, useRef } from "react";
import "./Home.css";
import { Link } from "react-router-dom";
import Header from "./Header";
import backgroundImage from "./assets/BackgroundHome.png";

function Home() {
  // 2. ADDED THIS: Created a ref to hold the map HTML element
  const mapRef = useRef(null);

  useEffect(() => {
    // Set map center (e.g., London coordinates)
    const location = { lat: 51.5074, lng: -0.1278 };

    // Check if Google Maps script is available
    if (window.google && mapRef.current) {
      const map = new window.google.maps.Map(mapRef.current, {
        center: location,
        zoom: 12,
      });

      // Add a marker to the map
      new window.google.maps.Marker({
        position: location,
        map: map,
        title: "Verified Creator Hub",
      });
    }
  }, []);

  return (
    <div>
      <Header />

      <section
        className="home-hero"
        style={{
          backgroundImage: `url(${backgroundImage})`,
        }}
      >
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
      </section>

      {/* 3. ADDED THIS: The section containing your map div */}
      <section className="map-section">
        <h3>Find Certified Creators Near You</h3>
        <div ref={mapRef} className="map-container"></div>
      </section>
    </div>
  );
}

export default Home;