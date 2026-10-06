import { useState } from "react";
import { useLocation, Link } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import { API_URL } from "./apiConfig";
import "./index.css";

function Report() {
  const location = useLocation();
  const { creatorSlug, creatorName, creatorId } = location.state || {};

  const [formData, setFormData] = useState({
    reason: "ai_suspicion",
    description: "",
    reporterEmail: "",
    reportedCreatorSlug: creatorSlug || "",
    reportedCreatorName: creatorName || "",
    reportedCreatorId: creatorId || "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg("");

    try {
      const res = await fetch(`${API_URL}/reports`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        throw new Error("Failed to submit report. Please try again.");
      }

      setSubmitted(true);
    } catch (err) {
      setErrorMsg(err.message || "An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <Header />

      {/* Top Back Navigation */}
      <div style={{ maxWidth: "900px", margin: "24px auto 0", padding: "0 20px" }}>
        <Link
          to={creatorSlug ? `/creators/${creatorSlug}` : "/certificates"}
          className="button"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "13px",
            padding: "8px 16px",
          }}
        >
          ← {creatorSlug ? `Back to ${creatorName || "Creator"}` : "Back to Directory"}
        </Link>
      </div>

      <section className="hero" style={{ padding: "60px 20px" }}>
        <div className="hero-box" style={{ maxWidth: "700px" }}>
          <h2>Report a Creator</h2>
          <p style={{ marginTop: "12px", fontSize: "16px" }}>
            Help us maintain integrity across our verified platform. Please provide details regarding your concern below.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="application-form">
          {submitted ? (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <h3 style={{ marginBottom: "16px" }}>Report Submitted</h3>
              <p style={{ marginBottom: "24px" }}>
                Thank you for bringing this to our attention. Our team will review the flag shortly.
              </p>
              <Link
                to={creatorSlug ? `/creators/${creatorSlug}` : "/certificates"}
                className="button"
              >
                Return to {creatorName || "Directory"}
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              
              {/* Reported Creator Info Notice */}
              {creatorName ? (
                <div
                  style={{
                    padding: "16px",
                    border: "1px solid var(--line, #d2cbc0)",
                    backgroundColor: "rgba(0,0,0,0.02)",
                  }}
                >
                  <span style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted-ink, #666)" }}>
                    Target Account
                  </span>
                  <h4 style={{ margin: "4px 0 0", fontSize: "20px" }}>{creatorName}</h4>
                </div>
              ) : (
                <label>
                  Creator / Account Link or Name <span className="required">*</span>
                  <input
                    type="text"
                    name="reportedCreatorName"
                    value={formData.reportedCreatorName}
                    onChange={handleChange}
                    placeholder="e.g. John Doe or profile-slug"
                    required
                  />
                </label>
              )}

              {/* Report Reason Dropdown */}
              <label>
                Reason for Report <span className="required">*</span>
                <select name="reason" value={formData.reason} onChange={handleChange} required>
                  <option value="ai_suspicion">Suspicion of AI use in work</option>
                  <option value="impersonation">Impersonation of account</option>
                  <option value="other">Other...</option>
                </select>
              </label>

              {/* Your Email */}
              <label>
                Your Email Address <span className="required">*</span>
                <input
                  type="email"
                  name="reporterEmail"
                  value={formData.reporterEmail}
                  onChange={handleChange}
                  placeholder="your.email@example.com"
                  required
                />
                <span className="form-note optional">We will only contact you if we need clarification.</span>
              </label>

              {/* Detailed Explanation */}
              <label>
                Details & Evidence <span className="required">*</span>
                <textarea
                  name="description"
                  rows="5"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Please describe the issue in detail, including links or references if applicable..."
                  required
                />
              </label>

              {errorMsg && (
                <div style={{ color: "var(--accent, #8d2d20)", fontSize: "14px", fontWeight: "600" }}>
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                className="button"
                disabled={submitting}
                style={{ marginTop: "10px", width: "100%" }}
              >
                {submitting ? "Submitting Report..." : "Submit Report"}
              </button>
            </form>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default Report;