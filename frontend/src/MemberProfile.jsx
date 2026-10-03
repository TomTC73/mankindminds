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
        if (active) setError(requestError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [id]);

  const socialUrl = resolveSafeExternalUrl(member?.socialHandle);

  return (
    <div>
      <Header />
      <main className="section">
        <div className="account-panel">
          {loading ? (
            <p role="status">Loading member profile…</p>
          ) : error || !member ? (
            <>
              <h2>Profile unavailable</h2>
              <p>{error || "This profile is unavailable."}</p>
              <Link to="/certificates" className="button">Back to creators</Link>
            </>
          ) : (
            <>
              <p className="account-status account-status-approved">Approved member</p>
              <h2>{member.displayName}</h2>
              <p className="creator-category">{member.category}</p>
              {member.businessName && <p>{member.businessName}</p>}
              {member.socialPlatform && <p>{member.socialPlatform}</p>}
              {member.socialHandle && (
                <p>
                  {socialUrl ? (
                    <a href={socialUrl} target="_blank" rel="noreferrer">
                      {member.socialHandle}
                    </a>
                  ) : (
                    member.socialHandle
                  )}
                </p>
              )}
              <Link to="/certificates" className="button">Back to creators</Link>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default MemberProfile;
