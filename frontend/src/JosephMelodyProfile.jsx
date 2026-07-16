import "./index.css";
import Header from "./Header";
import JosephMelodyImg from "./assets/joseph-melody.jpg";


function JosephMelodyProfile() {
  const socialLinks = [
    {
      name: "Website",
      url: "https://example.com/joseph-melody",
    },
    {
      name: "Instagram",
      url: "https://instagram.com/josephmelody",
    },
    {
      name: "TikTok",
      url: "https://www.tiktok.com/@josephmelody",
    },
    {
      name: "Email",
      url: "mailto:joseph@melodyexample.com",
    },
  ];

  return (
    <div>
      <Header />

      <section className="hero">
        <div className="hero-box profile-hero-box">
          <div className="profile-header">
            <img
                            src={JosephMelodyImg}
                            alt="Joseph Melody profile"
                            className="profile-image"
                          />

            <div>
              <span className="verified-badge">Verified Creator</span>
              <h2>Joseph Melody</h2>
              <p className="creator-category">Creator</p>
            </div>
          </div>

          <p>
            Joseph Melody is a verified creator with a sample profile page ready
            for content replacement. Replace this text with real details about
            Joseph’s creative work, background, and verification story.
          </p>

          <div className="ai-free-card">
            <h3>AI-Free Verification</h3>
            <p>
              This section is a placeholder for the verification summary. Add
              Joseph’s own verification details here, including submission
              materials, creative process, and why his work qualifies as
              AI-free.
            </p>

            <strong>Verification Status: Sample AI-Free Profile</strong>
          </div>
        </div>
      </section>

      <section className="section">
        <h3>About Joseph’s Work</h3>

        <div className="certificate">
          <p>
            Use this area to describe the creator’s work, creative focus, and
            examples of what they make. Replace this sample text with Joseph’s
            actual projects and creative strengths.
          </p>
        </div>
      </section>

      <section className="section">
        <h3>Verification Review</h3>

        <div className="certificate">
          <p>
            Add the review details here once the creator’s work has been
            assessed. This is the place to explain how the submitted materials
            were checked and what evidence supports the AI-free claim.
          </p>
        </div>
      </section>

      <section className="section" id="socials">
        <h3>Social Media & Links</h3>

        <div className="social-links">
          {socialLinks.map((link, index) => (
            <a
              key={index}
              href={link.url}
              target="_blank"
              rel="noreferrer"
              className="social-link"
            >
              {link.name}
            </a>
          ))}
        </div>
      </section>

      <footer className="footer">
        <p>© 2026 Mankind Minds. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default JosephMelodyProfile;
