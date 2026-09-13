import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import { API_URL, resolveCreatorImageUrl, resolveSafeExternalUrl } from "./apiConfig";
import "./index.css";

const TATTOO_GALLERY_PAGE_SIZE = 9;

function CreatorProfile() {
  const { slug } = useParams();
  const [creator, setCreator] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [visibleCount, setVisibleCount] = useState(TATTOO_GALLERY_PAGE_SIZE);

  useEffect(() => {
    fetch(`${API_URL}/creators/${encodeURIComponent(slug)}`)
      .then((res) => {
        if (!res.ok) throw new Error("Creator not found");
        return res.json();
      })
      .then((data) => {
        setCreator(data);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [slug]);

  const isTattooCreator = creator?.category?.toLowerCase().includes("tattoo");

  useEffect(() => {
    setVisibleCount(TATTOO_GALLERY_PAGE_SIZE);
  }, [slug]);

  if (loading) return <div style={{ padding: "2rem", textAlign: "center" }}>Loading creator profile...</div>;

  if (error || !creator) {
    return (
      <div>
        <Header />
        <section className="section" style={{ textAlign: "center", padding: "4rem 1rem" }}>
          <h2>Creator Not Found</h2>
          <p style={{ margin: "1rem 0 2rem" }}>We couldn't find a verified profile matching this link.</p>
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
      <div style={{ maxWidth: "1000px", margin: "20px auto 0", padding: "0 20px" }}>
        <Link
          to="/certificates"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            textDecoration: "none",
            color: "#475569",
            fontWeight: "600",
            fontSize: "14px",
            background: "#f1f5f9",
            padding: "8px 16px",
            borderRadius: "8px",
            transition: "all 0.2s ease",
          }}
        >
          ← Back to All Creators
        </Link>
      </div>

      <section className="hero">
        <div className="hero-box profile-hero-box" style={{ maxWidth: "900px" }}>
          <div className="profile-header">
            <img src={resolveCreatorImageUrl(creator.imageUrl)} alt={`${creator.name} profile`} className="profile-image" />
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                <span className="verified-badge">{creator.badgeText || "Verified Creator"}</span>
                {creator.rating && (
                  <span style={{ fontSize: "13px", fontWeight: "700", color: "#d97706", backgroundColor: "#fef3c7", padding: "2px 8px", borderRadius: "12px" }}>
                    ★ {creator.rating}
                  </span>
                )}
              </div>
              <h2 style={{ fontSize: "32px", margin: "0 0 6px 0" }}>{creator.name}</h2>
              <p className="creator-category" style={{ margin: "0 0 10px 0" }}>{creator.category}</p>

              {(creator.studio || creator.location) && (
                <p style={{ fontSize: "14px", color: "#64748b", margin: "0 0 10px 0", fontWeight: "500" }}>
                  {creator.studio && <span>📍 {creator.studio}</span>}
                  {creator.studio && creator.location && <span> • </span>}
                  {creator.location && <span>{creator.location}</span>}
                </p>
              )}

              {creator.styles && creator.styles.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "8px" }}>
                  {creator.styles.map((style) => (
                    <span
                      key={style}
                      style={{
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#0f172a",
                        backgroundColor: "#e2e8f0",
                        padding: "3px 10px",
                        borderRadius: "16px",
                      }}
                    >
                      {style}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <p style={{ fontSize: "16px", lineHeight: "1.6", color: "#334155", margin: "16px 0" }}>{creator.bio}</p>

          {creator.aiFreeCard && (
            <div className="ai-free-card" style={{ borderRadius: "12px", border: "1px solid #1B8A5A", backgroundColor: "#f0fdf4", padding: "20px" }}>
              <h3 style={{ margin: "0 0 8px 0", color: "#166534" }}>{creator.aiFreeCard.title}</h3>
              <p style={{ margin: "0 0 12px 0", color: "#15803d" }}>{creator.aiFreeCard.description}</p>
              <strong style={{ color: "#166534", fontSize: "14px" }}>✓ Status: {creator.aiFreeCard.status}</strong>
            </div>
          )}
        </div>
      </section>

      {creator.sections?.map((section, idx) => (
        <section className="section" key={idx}>
          <h3>{section.title}</h3>
          <div className="certificate">
            <p style={{ lineHeight: "1.6", fontSize: "15px" }}>{section.content}</p>
          </div>
        </section>
      ))}

      {creator.gallery?.length > 0 && (
        <section className="section creator-gallery-section">
          <h3>Selected Work</h3>
          <div className="creator-gallery">
            {(isTattooCreator ? creator.gallery.slice(0, visibleCount) : creator.gallery).map((imageUrl, idx) => (
              <div className="creator-gallery-item" key={`${imageUrl}-${idx}`}>
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

      {creator.socialLinks && creator.socialLinks.length > 0 && (
        <section className="section" id="socials" style={{ textAlign: "center", padding: "30px 20px" }}>
          <h3>Connect & Follow</h3>
          <div className="social-links" style={{ display: "flex", flexWrap: "wrap", gap: "12px", justifyContent: "center" }}>
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
        </section>
      )}

      <Footer />
    </div>
  );
}

export default CreatorProfile;