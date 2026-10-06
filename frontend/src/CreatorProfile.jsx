import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import { API_URL, resolveCreatorImageUrl, resolveSafeExternalUrl } from "./apiConfig";
import "./index.css";

const TATTOO_GALLERY_PAGE_SIZE = 9;

function CreatorProfile() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [creator, setCreator] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [visibleCount, setVisibleCount] = useState(TATTOO_GALLERY_PAGE_SIZE);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    setCreator(null);
    fetch(`${API_URL}/creators/${encodeURIComponent(slug)}`)
      .then((res) => {
        if (res.status === 404) throw new Error("not-found");
        if (!res.ok) throw new Error(`Profile request failed (${res.status}).`);
        return res.json();
      })
      .then((data) => {
        if (active) setCreator(data);
      })
      .catch((requestError) => {
        if (requestError.message !== "not-found") {
          console.error("Could not load creator profile:", requestError);
        }
        if (active) setError(requestError.message === "not-found" ? "not-found" : "unavailable");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [slug, retryAttempt]);

  const isTattooCreator = creator?.category?.toLowerCase().includes("tattoo");
  const profileSections = creator?.sections || [];
  const aboutSectionIndex = profileSections.findIndex((section) => (
    section.title?.toLowerCase().startsWith("about ")
  ));

  useEffect(() => {
    setVisibleCount(TATTOO_GALLERY_PAGE_SIZE);
  }, [slug]);

  const handleReportRedirect = () => {
    navigate("/report", {
      state: {
        creatorSlug: slug,
        creatorName: creator?.name,
        creatorId: creator?._id || creator?.id,
      },
    });
  };

  if (loading) return <div style={{ padding: "2rem", textAlign: "center" }}>Loading creator profile...</div>;

  if (error || !creator) {
    return (
      <div>
        <Header />
        <section className="section" style={{ textAlign: "center", padding: "4rem 1rem" }}>
          <h2>{error === "not-found" ? "Creator Not Found" : "Creator Profile Unavailable"}</h2>
          <p style={{ margin: "1rem 0 2rem" }}>
            {error === "not-found"
              ? "We couldn't find a verified profile matching this link."
              : import.meta.env.DEV
                ? "Could not connect to the local backend at http://localhost:8080. Start the backend, then try again."
              : "We couldn't load this profile just now. Please check your connection and try again."}
          </p>
          {error === "unavailable" && (
            <button className="button" type="button" onClick={() => setRetryAttempt((attempt) => attempt + 1)}>
              Try again
            </button>
          )}
          <Link to="/certificates" className="button">Back to Creators</Link>
        </section>
        <Footer />
      </div>
    );
  }

  return (
    <div>
      <Header />

      {/* Top Back Navigation Bar */}
      <div style={{ maxWidth: "900px", margin: "24px auto 0", padding: "0 20px" }}>
        <Link
          to="/certificates"
          className="button"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "13px",
            padding: "8px 16px",
          }}
        >
          ← Back to All Creators
        </Link>
      </div>

      <section className="hero">
        <div className="hero-box profile-hero-box" style={{ maxWidth: "900px", position: "relative" }}>
          
          {/* Top-Right Small Report Icon */}
          <button
            type="button"
            onClick={handleReportRedirect}
            title="Report this profile"
            aria-label="Report this profile"
            style={{
              position: "absolute",
              top: "16px",
              right: "16px",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: "6px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#64748b",
              transition: "color 0.2s ease, transform 0.2s ease",
            }}
            onMouseOver={(e) => (e.currentTarget.style.color = "#dc2626")}
            onMouseOut={(e) => (e.currentTarget.style.color = "#64748b")}
          >
            {/* SVG Flag Icon */}
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
              <line x1="4" y1="22" x2="4" y2="15" />
            </svg>
          </button>

          <div className="profile-header">
            <img src={resolveCreatorImageUrl(creator.imageUrl)} alt={`${creator.name} profile`} className="profile-image" />
            <div className="profile-header-meta" style={{ flex: 1 }}>
              <div className="profile-badge-row" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                <span className="verified-badge">{creator.badgeText || "Verified Creator"}</span>
                {creator.rating && (
                  <span style={{ fontSize: "13px", fontWeight: "700", color: "var(--accent, #8d2d20)", border: "1px solid var(--line, #c8c8c8)", padding: "2px 8px" }}>
                    ★ {creator.rating}
                  </span>
                )}
              </div>
              <h2 style={{ fontSize: "32px", margin: "0 0 6px 0" }}>{creator.name}</h2>
              <p className="creator-category" style={{ margin: "0 0 10px 0" }}>{creator.category}</p>

              {(creator.studio || creator.location) && (
                <p style={{ fontSize: "14px", color: "#64748b", margin: "0 0 10px 0", fontWeight: "500" }}>
                  {creator.studio && <span>{creator.studio}</span>}
                  {creator.studio && creator.location && <span> • </span>}
                  {creator.location && <span>{creator.location}</span>}
                </p>
              )}

              {creator.styles && creator.styles.length > 0 && (
                <div className="profile-styles-row" style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "8px" }}>
                  {creator.styles.map((style) => (
                    <span
                      key={style}
                      style={{
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "var(--ink, #111111)",
                        backgroundColor: "rgba(0,0,0,0.05)",
                        border: "1px solid var(--line, #c8c8c8)",
                        padding: "3px 10px",
                      }}
                    >
                      {style}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {(creator.description || creator.bio) && (
            <p style={{ fontSize: "16px", lineHeight: "1.6", margin: "16px 0" }}>
              {creator.description || creator.bio}
            </p>
          )}

          {creator.aiFreeCard && (
            <div className="ai-free-card">
              <h3>{creator.aiFreeCard.title}</h3>
              <p>{creator.aiFreeCard.description}</p>
              <strong>Status: {creator.aiFreeCard.status}</strong>
            </div>
          )}
        </div>
      </section>

      {profileSections.map((section, idx) => (
        <section className="section" key={idx}>
          <h3>{section.title}</h3>
          <div className="certificate">
            <p style={{ lineHeight: "1.6", fontSize: "15px" }}>
              {idx === aboutSectionIndex && creator.bio ? creator.bio : section.content}
            </p>
          </div>
        </section>
      ))}
      {aboutSectionIndex < 0 && creator.bio && (
        <section className="section">
          <h3>About {creator.name}'s Work</h3>
          <div className="certificate">
            <p style={{ lineHeight: "1.6", fontSize: "15px" }}>{creator.bio}</p>
          </div>
        </section>
      )}

      {creator.gallery?.length > 0 && (
        <section className="section creator-gallery-section">
          <h3>Selected Work</h3>
          <div className="creator-gallery">
            {(isTattooCreator ? creator.gallery.slice(0, visibleCount) : creator.gallery).map((imageUrl, idx) => (
              <div 
                className="creator-gallery-item" 
                key={`${imageUrl}-${idx}`}
                onClick={() => setSelectedImage(imageUrl)}
                style={{ cursor: "pointer" }}
              >
                <img src={resolveCreatorImageUrl(imageUrl)} alt={`${creator.name} work`} loading="lazy" />
              </div>
            ))}
          </div>
          {isTattooCreator && visibleCount < creator.gallery.length && (
            <div className="gallery-load-more-wrap">
              <button
                type="button"
                className="button"
                onClick={() => setVisibleCount((count) => count + TATTOO_GALLERY_PAGE_SIZE)}
              >
                Load More ({creator.gallery.length - visibleCount} remaining)
              </button>
            </div>
          )}
        </section>
      )}

      {/* Image Lightbox Modal */}
      {selectedImage && (
        <div
          onClick={() => setSelectedImage(null)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.85)",
            backdropFilter: "blur(6px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            cursor: "zoom-out",
          }}
        >
          <div style={{ position: "relative", maxWidth: "90vw", maxHeight: "90vh" }} onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setSelectedImage(null)}
              style={{
                position: "absolute",
                top: "-40px",
                right: "0",
                background: "none",
                border: "none",
                color: "#ffffff",
                fontSize: "32px",
                cursor: "pointer",
                fontWeight: "bold",
              }}
              aria-label="Close image"
            >
              ×
            </button>
            <img
              src={resolveCreatorImageUrl(selectedImage)}
              alt="Enlarged work preview"
              style={{
                maxWidth: "90vw",
                maxHeight: "85vh",
                borderRadius: "12px",
                objectFit: "contain",
                boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
                display: "block",
              }}
            />
          </div>
        </div>
      )}

      {/* Social Links & Report Action Section */}
      <section className="section" id="socials" style={{ textAlign: "center", padding: "30px 20px" }}>
        {creator.socialLinks && creator.socialLinks.length > 0 && (
          <>
            <h3>Connect & Follow</h3>
            <div className="social-links" style={{ display: "flex", flexWrap: "wrap", gap: "12px", justifyContent: "center", marginBottom: "20px" }}>
              {creator.socialLinks.map((link, index) => {
                const safeUrl = resolveSafeExternalUrl(link.url);
                if (!safeUrl) return null;

                return (
                  <a
                    key={index}
                    href={safeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-link"
                    style={{
                      padding: "12px 22px",
                      borderRadius: "30px",
                      fontWeight: "600",
                      fontSize: "14px",
                      textDecoration: "none",
                      transition: "all 0.2s ease",
                    }}
                  >
                    {link.name}
                  </a>
                );
              })}
            </div>
          </>
        )}

        {/* Report Button */}
        <div style={{ marginTop: "16px" }}>
          <button
            type="button"
            onClick={handleReportRedirect}
            style={{
              background: "none",
              border: "1px solid #e2e8f0",
              color: "#64748b",
              padding: "8px 16px",
              borderRadius: "20px",
              fontSize: "13px",
              fontWeight: "500",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.2s ease",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = "#fca5a5";
              e.currentTarget.style.color = "#dc2626";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = "#e2e8f0";
              e.currentTarget.style.color = "#64748b";
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
              <line x1="4" y1="22" x2="4" y2="15" />
            </svg>
            Report Profile
          </button>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default CreatorProfile;