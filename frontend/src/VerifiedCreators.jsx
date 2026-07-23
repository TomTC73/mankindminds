import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import { API_URL, resolveCreatorImageUrl } from "./apiConfig";
import "./index.css";

function VerifiedCreators() {
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/creators`)
      .then((res) => res.json())
      .then((data) => {
        setCreators(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching creators:", err);
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <Header />
      <section className="hero">
        <div className="hero-box">
          <h2>View Our Verified Creators</h2>
          <p>
            Explore trusted creators who have been reviewed and verified as AI-Free through
            our certification process.
          </p>
        </div>
      </section>

      <section className="section" id="creators">
        <h3>Verified Creators</h3>

        {loading ? (
          <p>Loading creators...</p>
        ) : (
          <div className="creator-tabs">
            {creators.map((creator) => (
              <div className="creator-tab" key={creator.slug}>
                <div className="creator-avatar">
                  {creator.imageUrl ? (
                    <img
                      src={resolveCreatorImageUrl(creator.imageUrl)}
                      alt={`${creator.name} profile`}
                      className="creator-avatar-img"
                    />
                  ) : (
                    creator.name.split(" ").map((w) => w[0]).join("")
                  )}
                </div>

                <div className="creator-info">
                  <h4>{creator.name}</h4>
                  <p className="creator-category">{creator.category}</p>
                  <p>{creator.description}</p>
                </div>

                <span className="verified-badge">Verified</span>

                <Link to={`/creators/${creator.slug}`}>
                  <button className="button creator-button">View Profile</button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}

export default VerifiedCreators;