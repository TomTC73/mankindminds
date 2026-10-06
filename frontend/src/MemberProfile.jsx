import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import { API_URL, resolveSafeExternalUrl } from "./apiConfig";
import "./index.css";

function MemberProfile() {
  const { id } = useParams();
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetch(`${API_URL}/accounts/public/${encodeURIComponent(id)}`)
      .then((response) => {
        if (!response.ok) throw new Error("This profile is unavailable.");
        return response.json();
      })
      .then((data) => {
        if (active) setMember(data);
      })
      .catch((requestError) => {
        console.error("Could not load public member profile:", requestError);
        if (active) setError("This profile is unavailable right now. Please try again in a moment.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [id]);

  const socialUrl = resolveSafeExternalUrl(member?.socialHandle);
  const initials = member?.displayName?.trim()?.split(/\s+/).slice(0, 2).map((word) => word[0]).join("").toUpperCase();

  return (
    <div>
      <Header />
      <main className="member-profile-page">
        <div className="member-profile-shell">
          <Link to="/certificates" className="member-profile-back">← All verified creators</Link>
          {loading ? (
            <div className="member-profile-state" role="status">
              <span className="account-loading-mark" aria-hidden="true" />
              Loading creator profile…
            </div>
          ) : error || !member ? (
            <section className="member-profile-state member-profile-error" role="alert">
              <p className="account-eyebrow">PROFILE UNAVAILABLE</p>
              <h1>We couldn’t find this profile.</h1>
              <p>{error || "This profile may have been removed or is not publicly available."}</p>
              <Link to="/certificates" className="button">Explore verified creators</Link>
            </section>
          ) : (
            <>
              <article className="member-profile-card">
                <div className="member-profile-hero">
                  <div className="member-profile-avatar">
                    {member.profileImageUrl ? (
                      <img src={`${API_URL}${member.profileImageUrl}`} alt={`${member.displayName} profile`} />
                    ) : (
                      <span aria-hidden="true">{initials || "M"}</span>
                    )}
                  </div>
                  <div className="member-profile-identity">
                    <p className="account-eyebrow">AI-FREE VERIFIED CREATOR</p>
                    <h1>{member.displayName}</h1>
                    <div className="member-profile-meta">
                      {member.category && <span>{member.category}</span>}
                      {member.businessName && <span>{member.businessName}</span>}
                    </div>
                  </div>
                  <span className="member-profile-approved"><span aria-hidden="true">✓</span> Verified</span>
                </div>

                {(member.bio || member.socialHandle) && (
                  <div className="member-profile-about">
                    {member.bio && (
                      <section>
                        <h2>About</h2>
                        <p className="member-profile-bio">{member.bio}</p>
                      </section>
                    )}
                    {member.socialHandle && (
                      <section className="member-profile-links">
                        <h2>Find their work</h2>
                        {socialUrl ? (
                          <a href={socialUrl} target="_blank" rel="noopener noreferrer" className="member-profile-social-link">
                            {member.socialPlatform || "Portfolio"} <span aria-hidden="true">↗</span>
                          </a>
                        ) : (
                          <p>{member.socialPlatform || "Portfolio"}: {member.socialHandle}</p>
                        )}
                      </section>
                    )}
                  </div>
                )}

                {member.galleryImageUrls?.length > 0 && (
                  <section className="member-profile-work">
                    <div className="member-profile-section-heading">
                      <div>
                        <p className="account-eyebrow">SELECTED WORK</p>
                        <h2>Portfolio</h2>
                      </div>
                      <span>{member.galleryImageUrls.length} {member.galleryImageUrls.length === 1 ? "image" : "images"}</span>
                    </div>
                    <div className="member-profile-gallery">
                      {member.galleryImageUrls.map((imageUrl, index) => (
                        <figure key={imageUrl}>
                          <img
                            src={`${API_URL}${imageUrl}`}
                            alt={`${member.displayName} portfolio work ${index + 1}`}
                            loading="lazy"
                            decoding="async"
                          />
                        </figure>
                      ))}
                    </div>
                  </section>
                )}
              </article>
              <div className="member-profile-footer">
                <p>This creator has been reviewed and approved through the Mankind Minds AI-Free verification process.</p>
                <Link to="/certificates" className="member-profile-back">Back to all creators <span aria-hidden="true">→</span></Link>
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default MemberProfile;
