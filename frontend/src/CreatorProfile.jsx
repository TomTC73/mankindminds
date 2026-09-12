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
        <section className="section" style={{ textAlign: "center" }}>
          <h2>Creator Not Found</h2>
          <p>We couldn't find a verified profile matching this link.</p>
          <Link to="/certificates" className="button">Back to Creators</Link>
        </section>
        <Footer />
      </div>
    );
  }

  return (
    <div>
      <Header />

      <section className="hero">
        <div className="hero-box profile-hero-box">
          <div className="profile-header">
            <img src={resolveCreatorImageUrl(creator.imageUrl)} alt={`${creator.name} profile`} className="profile-image" />
            <div>
              <span className="verified-badge">{creator.badgeText || "Verified Creator"}</span>
              <h2>{creator.name}</h2>
              <p className="creator-category">{creator.category}</p>
            </div>
          </div>

          <p>{creator.bio}</p>

          {creator.aiFreeCard && (
            <div className="ai-free-card">
              <h3>{creator.aiFreeCard.title}</h3>
              <p>{creator.aiFreeCard.description}</p>
              <strong>Verification Status: {creator.aiFreeCard.status}</strong>
            </div>
          )}
        </div>
      </section>

      {creator.sections?.map((section, idx) => (
        <section className="section" key={idx}>
          <h3>{section.title}</h3>
          <div className="certificate">
            <p>{section.content}</p>
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

      {creator.socialLinks && creator.socialLinks.length > 0 && (
        <section className="section" id="socials">
          <h3>Social Media & Links</h3>
          <div className="social-links">
            {creator.socialLinks.map((link, index) => {
              const safeUrl = resolveSafeExternalUrl(link.url);
              if (!safeUrl) return null;

              return (
                <a key={index} href={safeUrl} target="_blank" rel="noopener noreferrer" className="social-link">
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