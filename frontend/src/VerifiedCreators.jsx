import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import { API_URL, resolveCreatorImageUrl } from "./apiConfig";
import "./index.css";

const categoryGroups = {
  music: {
    label: "Music",
    matches: ["music", "musician", "songwriter", "producer", "band"],
  },
  writing: {
    label: "Writing",
    matches: ["writing", "writer", "author", "poet", "journalist"],
  },
  videos: {
    label: "Videos",
    matches: ["video", "videos", "filmmaker", "videographer", "editor", "director"],
  },
  art: {
    label: "Art",
    matches: ["art", "artist", "illustrator", "photographer", "designer"],
  },
};

const categoryOrder = Object.keys(categoryGroups);

function getCreatorCategory(category) {
  const normalizedCategory = category?.toLowerCase() || "";
  return categoryOrder.find((key) =>
    categoryGroups[key].matches.some((match) => normalizedCategory.includes(match)),
  );
}

function VerifiedCreators() {
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const activeCategory = searchParams.get("category")?.toLowerCase();
  const activeCategoryGroup = categoryGroups[activeCategory] || null;
  const filteredCreators = activeCategoryGroup
    ? creators.filter((creator) => getCreatorCategory(creator.category) === activeCategory)
    : creators;

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
    <div className="verified-creators-page">
      <Header />
      <section className="hero verified-creators-hero">
        <div className="hero-box">
          <h2>View Our Verified Creators</h2>
          <p>
            Explore trusted creators who have been reviewed and verified as AI-Free through
            our certification process.
          </p>
        </div>
      </section>

      <section className="section" id="creators">
        <h3>{activeCategoryGroup ? `${activeCategoryGroup.label} Certificates` : "Verified Creator Certificates"}</h3>

        <nav className="certificate-category-tabs" aria-label="Certificate categories">
          {categoryOrder.map((categoryKey) => (
            <Link
              key={categoryKey}
              to={`/certificates?category=${categoryKey}`}
              className={`certificate-category-tab ${activeCategory === categoryKey ? "is-active" : ""}`}
            >
              {categoryGroups[categoryKey].label}
            </Link>
          ))}
        </nav>

        {loading ? (
          <p>Loading creators...</p>
        ) : filteredCreators.length === 0 ? (
          <p className="certificate-empty-state">
            No verified {activeCategoryGroup?.label.toLowerCase() || "creator"} certificates yet.
          </p>
        ) : (
          <div className="creator-tabs">
            {filteredCreators.map((creator) => {
              const creatorCategory = getCreatorCategory(creator.category);

              return (
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
                  <p className="creator-category">
                    {categoryGroups[creatorCategory]?.label || creator.category} Certificate
                    <span> · {creator.category}</span>
                  </p>
                  <p>{creator.description}</p>
                </div>

                <span className="verified-badge">Verified</span>

                <Link to={`/creators/${creator.slug}`}>
                  <button className="button creator-button">View Profile</button>
                </Link>
              </div>
              );
            })}
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}

export default VerifiedCreators;