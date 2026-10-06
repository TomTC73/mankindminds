import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import { API_URL } from "./apiConfig";
import "./index.css";

function MemberProfile() {
  const { id } = useParams();
  const [creatorSlug, setCreatorSlug] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetch(`${API_URL}/accounts/public/${encodeURIComponent(id)}`)
      .then((response) => {
        if (!response.ok) throw new Error(`Profile request failed (${response.status}).`);
        return response.json();
      })
      .then((account) => {
        if (!account.creatorSlug) throw new Error("This creator has no public profile link.");
        if (active) setCreatorSlug(account.creatorSlug);
      })
      .catch((requestError) => {
        console.error("Could not redirect the old member profile link:", requestError);
        if (active) setError("This profile is unavailable right now. Please try again later.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [id]);

  if (creatorSlug) {
    return <Navigate to={`/creators/${encodeURIComponent(creatorSlug)}`} replace />;
  }

  return (
    <div>
      <Header />
      <main className="member-profile-page">
        <div className="member-profile-shell">
          <Link to="/certificates" className="member-profile-back">← All verified creators</Link>
          {loading ? (
            <div className="member-profile-state" role="status">
              <span className="account-loading-mark" aria-hidden="true" />
              Opening creator profile…
            </div>
          ) : (
            <section className="member-profile-state member-profile-error" role="alert">
              <p className="account-eyebrow">PROFILE UNAVAILABLE</p>
              <h1>We couldn’t open this creator profile.</h1>
              <p>{error}</p>
              <Link to="/certificates" className="button">Explore verified creators</Link>
            </section>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default MemberProfile;
