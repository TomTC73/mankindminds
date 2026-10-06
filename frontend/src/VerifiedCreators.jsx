import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import { API_URL, resolveCreatorImageUrl } from "./apiConfig";
import "./index.css";

const categoryGroups = {
  tattoos: {
    label: "Tattoos",
    matches: ["tattoo", "tattoos", "tattooist", "tattoo artist"],
  },
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
    matches: ["video", "videos", "filmmaker", "videographer", "editor", "director", "content creator"],
  },
  art: {
    label: "Art",
    matches: ["art", "artist", "illustrator", "photographer", "designer"],
  },
};

const categoryOrder = Object.keys(categoryGroups);

const nicheLabels = {
  music: "Musician",
  videos: "Content Creator",
  writing: "Writer",
  art: "Artist",
  tattoos: "Tattooist",
};

function getCreatorCategory(category) {
  const normalizedCategory = category?.toLowerCase() || "";
  return categoryOrder.find((key) =>
    categoryGroups[key].matches.some((match) => normalizedCategory.includes(match)),
  );
}

function getCreatorNiche(category) {
  const normalizedCategory = category?.toLowerCase() || "";
  return nicheLabels[normalizedCategory] || category;
}

function VerifiedCreators() {
  const [creators, setCreators] = useState([]);
  const [memberAccounts, setMemberAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creatorError, setCreatorError] = useState("");
  const [memberError, setMemberError] = useState("");
  const [searchParams] = useSearchParams();
  const activeCategory = searchParams.get("category")?.toLowerCase();
  const activeCategoryGroup = categoryGroups[activeCategory] || null;
  const filteredCreators = activeCategoryGroup
    ? creators.filter((creator) => getCreatorCategory(creator.category) === activeCategory)
    : creators;
  const filteredMemberAccounts = activeCategoryGroup
    ? memberAccounts.filter((member) => getCreatorCategory(member.category) === activeCategory)
    : memberAccounts;

  useEffect(() => {
    let active = true;
    Promise.allSettled([
      fetch(`${API_URL}/creators`).then((response) => {
        if (!response.ok) throw new Error("Could not load creator certificates.");
        return response.json();
      }),
      fetch(`${API_URL}/accounts/public`).then((response) => {
        if (!response.ok) throw new Error("Could not load approved member profiles.");
        return response.json();
      }),
    ])
      .then(([creatorResult, memberResult]) => {
        if (!active) return;
        if (creatorResult.status === "fulfilled") {
          setCreators(creatorResult.value);
        } else {
          console.error("Error fetching creators:", creatorResult.reason);
          setCreatorError("Creator certificates could not be loaded.");
        }
        if (memberResult.status === "fulfilled") {
          setMemberAccounts(memberResult.value);
        } else {
          console.error("Error fetching approved member profiles:", memberResult.reason);
          setMemberError("Approved member profiles could not be loaded.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
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
        ) : creatorError ? (
          <p role="alert">{creatorError}</p>
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
                    <span> · {getCreatorNiche(creator.category)}</span>
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

        <h3 className="approved-members-heading">Approved Community Members</h3>
        <p className="approved-members-intro">
          Profiles appear here only after staff approval. These profiles are separate from AI-Free certificates.
        </p>
        {loading ? (
          <p>Loading approved member profiles...</p>
        ) : memberError ? (
          <p role="alert">{memberError}</p>
        ) : filteredMemberAccounts.length === 0 ? (
          <p className="certificate-empty-state">No approved member profiles yet.</p>
        ) : (
          <div className="creator-tabs">
            {filteredMemberAccounts.map((member) => (
              <div className="creator-tab" key={member.id}>
                <div className="creator-avatar">
                  {member.profileImageUrl ? (
                    <img src={`${API_URL}${member.profileImageUrl}`} alt={`${member.displayName} profile`} className="creator-avatar-img" />
                  ) : (
                    member.displayName?.split(" ").map((word) => word[0]).join("")
                  )}
                </div>
                <div className="creator-info">
                  <h4>{member.displayName}</h4>
                  <p className="creator-category">{member.category} · Approved member</p>
                  {member.businessName && <p>{member.businessName}</p>}
                </div>
                <span className="verified-badge">Approved</span>
                <Link to={`/members/${member.id}`}>
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