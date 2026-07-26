import "./index.css";
import Header from "./Header";
import { useState } from "react";
import { Link } from "react-router-dom";

function CreatorApplication() {
  const [selectedPlatform, setSelectedPlatform] = useState("Instagram");
  const [platformHandle, setPlatformHandle] = useState("");

  const handleSubmit = (e) => {
    if (!platformHandle.trim()) {
      e.preventDefault();
      alert("Please provide a social media or portfolio link/username.");
    }
  };

  // Helper function to return relevant placeholder text based on selected option
  const getPlaceholder = () => {
    switch (selectedPlatform) {
      case "Instagram":
      case "TikTok":
        return "@yourusername";
      case "YouTube":
        return "https://youtube.com/@yourusername";
      case "Website":
        return "https://yourwebsite.com";
      default:
        return "https://yourportfolio.com";
    }
  };

  return (
    <div>
      <Header />

      <section className="section">
        <h3>Apply to Become Verified</h3>

        <form
          className="application-form"
          action="https://api.web3forms.com/submit"
          method="POST"
          onSubmit={handleSubmit}
        >
          <input
            type="hidden"
            name="access_key"
            value="a268b81e-bb0f-4add-822b-edbb7c854136"
          />

          <input
            type="hidden"
            name="subject"
            value="New Verified Creator Application"
          />

          <input
            type="hidden"
            name="from_name"
            value="Mankind Minds Website"
          />

          {/* Hidden inputs to pass selected platform & handle to Web3Forms */}
          <input
            type="hidden"
            name="social_platform"
            value={selectedPlatform}
          />
          <input
            type="hidden"
            name="social_handle"
            value={platformHandle}
          />

          <label>
            <span>
              Creator Name <span className="required">*</span>
            </span>

            <input
              type="text"
              name="creator_name"
              placeholder="Your name or creator name"
              required
            />
          </label>

          <label>
            <span>
              Email Address <span className="required">*</span>
            </span>

            <input
              type="email"
              name="email"
              placeholder="your@email.com"
              required
            />
          </label>

          <label>
            <span>
              Creator Category <span className="optional">(Optional)</span>
            </span>

            <input
              type="text"
              name="category"
              placeholder="Photographer, artist, writer..."
            />
          </label>

          {/* Mobile-friendly flexible layout container */}
          <label>
            <span>
              Primary Social Media / Portfolio <span className="required">*</span>
            </span>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "10px",
                marginTop: "5px",
                width: "100%",
                boxSizing: "border-box",
              }}
            >
              <select
                value={selectedPlatform}
                onChange={(e) => setSelectedPlatform(e.target.value)}
                style={{
                  padding: "8px",
                  borderRadius: "4px",
                  minWidth: "120px",
                  boxSizing: "border-box",
                }}
              >
                <option value="Instagram">Instagram</option>
                <option value="TikTok">TikTok</option>
                <option value="YouTube">YouTube</option>
                <option value="Website">Website</option>
                <option value="Other">Other Portfolio</option>
              </select>

              <input
                type="text"
                value={platformHandle}
                placeholder={getPlaceholder()}
                onChange={(e) => setPlatformHandle(e.target.value)}
                required
                style={{
                  flex: "1 1 200px",
                  minWidth: "0",
                  maxWidth: "100%",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </label>

          <label className="checkbox-label">
            <input
              type="checkbox"
              name="terms_agreement"
              value="Agreed"
              required
            />

            <span>
              I agree to the{" "}
              <a href="/terms" target="_blank" rel="noreferrer">
                Terms & Conditions
              </a>
              . <span className="required">*</span>
            </span>
          </label>

          <label className="checkbox-label">
            <input
              type="checkbox"
              name="ai_free_confirmation"
              value="Confirmed"
              required
            />

            <span>
              I confirm that the submitted work represents my own creative work and that the information provided in this application is accurate. <span className="required">*</span>
            </span>
          </label>

          <p className="form-note">
            Please make sure your links are public or viewable by anyone with
            the link. We use your submitted profiles and examples of work for
            verification.
          </p>

          <button className="button" type="submit">
            Submit Application
          </button>
        </form>
      </section>

      <footer className="footer">
        <p>
          © 2026 Mankind Minds. All rights reserved.
        </p>

        <p>
          Verification provided by Mankind Minds represents an assessment based on
          submitted information and available evidence at the time of review. It does
          not guarantee that a creator has never used AI tools.
        </p>

        <p>
          <Link to="/privacy-policy">Privacy Policy</Link>
          {" | "}
          <Link to="/terms">Terms & Conditions</Link>
        </p>
      </footer>
    </div>
  );
}

export default CreatorApplication;