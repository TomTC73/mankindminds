import "./index.css";
import Header from "./Header";
import { useState } from "react";
import { Link } from "react-router-dom";

function CreatorApplication() {
  const [socials, setSocials] = useState({
    website: "",
    instagram: "",
    tiktok: "",
    youtube: "",
    other_social: "",
  });

  const handleSubmit = (e) => {
    const hasSocial = Object.values(socials).some(
      (social) => social.trim() !== ""
    );

    if (!hasSocial) {
      e.preventDefault();
      alert("Please provide at least one social media or portfolio link.");
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

          <label>
            <span>
              Social Media / Portfolio Links{" "}
              <span className="required">*</span>
            </span>
          </label>

          <label>
            Website
            <input
              type="url"
              name="website"
              placeholder="https://yourwebsite.com"
              onChange={(e) =>
                setSocials({
                  ...socials,
                  website: e.target.value,
                })
              }
            />
          </label>

          <label>
            Instagram
            <input
              type="url"
              name="instagram"
              placeholder="https://instagram.com/yourusername"
              onChange={(e) =>
                setSocials({
                  ...socials,
                  instagram: e.target.value,
                })
              }
            />
          </label>

          <label>
            TikTok
            <input
              type="url"
              name="tiktok"
              placeholder="https://tiktok.com/@yourusername"
              onChange={(e) =>
                setSocials({
                  ...socials,
                  tiktok: e.target.value,
                })
              }
            />
          </label>

          <label>
            YouTube
            <input
              type="url"
              name="youtube"
              placeholder="https://youtube.com/@yourusername"
              onChange={(e) =>
                setSocials({
                  ...socials,
                  youtube: e.target.value,
                })
              }
            />
          </label>

          <label>
            Other Portfolio Link
            <input
              type="url"
              name="other_social"
              placeholder="https://yourportfolio.com"
              onChange={(e) =>
                setSocials({
                  ...socials,
                  other_social: e.target.value,
                })
              }
            />
          </label>

          <label>
            <span>
              Tell Us About Your Work{" "}
              <span className="optional">(Optional)</span>
            </span>

            <textarea
              name="about_work"
              placeholder="Tell us about what you create, your process, and the type of work you submit."
              rows="6"
            ></textarea>
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
              <a href="/terms" target="_blank">
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