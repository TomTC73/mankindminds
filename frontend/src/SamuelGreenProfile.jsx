import "./index.css";
import Header from "./Header";
import samuelGreenImg from "./assets/samuel-green.jpg";

function SamuelGreenProfile() {
  const socialLinks = [
    {
      name: "Website",
      url: "https://samuelgreenillustration.com/",
    },
    {
      name: "Instagram",
      url: "https://instagram.com/samuelgreen_illustration",
    },
    {
      name: "TikTok",
      url: "https://www.tiktok.com/@samuelgreen_illustration",
    },
    {
      name: "Linktree",
      url: "https://linktr.ee/samuelgreenillustration",
    },
    {
      name: "Email",
      url: "mailto:samueljgreen31@gmail.com",
    },
  ];

  return (
    <div>
      <Header />

      <section className="hero">
        <div className="hero-box profile-hero-box">
          <div className="profile-header">
            <img
              src={samuelGreenImg}
              alt="Samuel Green profile"
              className="profile-image"
            />

            <div>
              <span className="verified-badge">Verified Creator</span>
              <h2>Samuel Green</h2>
              <p className="creator-category">Illustrator</p>
            </div>
          </div>

          <p>
            Samuel Green is a verified illustrator whose creative work has been
            reviewed by Mankind Minds and confirmed as AI-free.
          </p>

          <div className="ai-free-card">
            <h3>AI-Free Verification</h3>
            <p>
              Samuel’s portfolio demonstrates traditional and self-directed
              creative practice, including hand-drawn watercolour and coloured
              pencil illustration, mixed media experimentation, analogue
              techniques, Risograph printing, branding, children’s books,
              posters, and physical merchandise.
            </p>

            <strong>Verification Status: Proven AI-Free</strong>
          </div>
        </div>
      </section>

      <section className="section">
        <h3>About Samuel’s Work</h3>

        <div className="certificate">
          <p>
            Samuel creates illustration-led projects across children’s books,
            character design, branding, environmental campaigns, book covers,
            and visual storytelling. His portfolio includes projects such as
            <em> A Sleepy Winter</em>, <em>Nature’s Adventurers</em>,
            <em> Waves of Change</em>, and <em>Family is Forever</em>.
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

export default SamuelGreenProfile;
