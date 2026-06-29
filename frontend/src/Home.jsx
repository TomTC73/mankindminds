import "./Home.css";
import { Link } from "react-router-dom";
import Header from "./Header";

function Home() {
  return (
    <div>
      <Header />

      <section className="hero">
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
            <button className="button secondary-button">About Verification</button>
          </Link>
        </div>
      </section>
    </div>
  );
}

export default Home;