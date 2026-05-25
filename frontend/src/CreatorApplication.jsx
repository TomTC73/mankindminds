import "./index.css";
import { Link } from "react-router-dom";

function CreatorApplication() {
  return (
    <div>
      <header className="header">
        <h1 className="logo">Mankind Minds</h1>

        <nav className="nav">
          <Link to="/">Home</Link>
          <Link to="/certificates">Creators</Link>
        </nav>
      </header>

      <section className="section">
        <h3>Apply to Become Verified</h3>

        <form
          className="application-form"
          action="https://api.web3forms.com/submit"
          method="POST"
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
            Creator Name
            <input
              type="text"
              name="creator_name"
              placeholder="Your name or creator name"
              required
            />
          </label>

          <label>
            Email Address
            <input
              type="email"
              name="email"
              placeholder="your@email.com"
              required
            />
          </label>

          <label>
            Creator Category
            <input
              type="text"
              name="category"
              placeholder="Illustrator, musician, writer, filmmaker..."
              required
            />
          </label>

          <label>
            Website
            <input
              type="url"
              name="website"
              placeholder="https://yourwebsite.com"
            />
          </label>

          <label>
            Instagram
            <input
              type="url"
              name="instagram"
              placeholder="https://instagram.com/yourusername"
            />
          </label>

          <label>
            TikTok
            <input
              type="url"
              name="tiktok"
              placeholder="https://tiktok.com/@yourusername"
            />
          </label>

          <label>
            YouTube
            <input
              type="url"
              name="youtube"
              placeholder="https://youtube.com/@yourusername"
            />
          </label>

          <label>
            Other Social Media / Portfolio Links
            <textarea
              name="other_links"
              placeholder="Add any extra social media, Linktree, Behance, shop links, portfolio links, etc."
              rows="5"
            ></textarea>
          </label>

          <label>
            Links to media you created
            <textarea
              name="media_links"
              placeholder="Paste links to examples of your original work. You can use Google Drive, Dropbox, YouTube, Instagram, Behance, your website, Linktree, etc."
              rows="6"
              required
            ></textarea>
          </label>

          <label>
            Tell us about your work
            <textarea
              name="about_work"
              placeholder="Describe what you create, your process, and why you want to be verified."
              rows="6"
              required
            ></textarea>
          </label>

          <label>
            How was this work created?
            <textarea
              name="creation_process"
              placeholder="Explain your creative process. For example: hand drawn, painted, photographed, filmed, edited, written, recorded, designed, etc."
              rows="6"
              required
            ></textarea>
          </label>

          <label>
            AI-Free Declaration
            <textarea
              name="ai_free_declaration"
              placeholder="Please confirm whether the submitted work was created without AI generation, and explain anything important we should know."
              rows="5"
              required
            ></textarea>
          </label>

          <p className="form-note">
            Please make sure your media links are public or set to viewable by
            anyone with the link. File uploads are not supported on this form
            yet.
          </p>

          <button className="button" type="submit">
            Submit Application
          </button>
        </form>
      </section>

      <footer className="footer">
        <p>© 2026 Mankind Minds. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default CreatorApplication;