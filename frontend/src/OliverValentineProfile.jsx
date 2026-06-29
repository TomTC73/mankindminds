import "./index.css";
import Header from "./Header";
import oliverValentineImg from "./assets/oliver-valentine.jpg";

function OliverValentineProfile() {
  const socialLinks = [
    {
      name: "Instagram - OhValentine",
      url: "https://www.instagram.com/ohvalentineband?igsh=cXRzN3V4enFyZmxi&utm_source=qr",
    },
    {
      name: "Instagram - Oliver Valentine Music",
      url: "https://www.instagram.com/olivervalentinemusic?igsh=NzQ3bng1ZnFuZTk4&utm_source=qr",
    },
    {
      name: "TikTok",
      url: "https://www.tiktok.com/@olivervalentinemusic?_r=1&_t=ZN-96erZFTlLT4",
    },
    {
      name: "SoundCloud",
      url: "https://soundcloud.com/oh-valentine-65974085",
    },
    {
      name: "Email",
      url: "mailto:olivervalentinemusic@gmail.com",
    },
  ];

  return (
    <div>
      <Header />

      <section className="hero">
        <div className="hero-box profile-hero-box">
          <div className="profile-header">
            <img
              src={oliverValentineImg}
              alt="Oliver Valentine profile"
              className="profile-image"
            />

            <div>
              <span className="verified-badge">Verified Creator</span>
              <h2>Oliver Valentine</h2>
              <p className="creator-category">Musician</p>
            </div>
          </div>

          <p>
            Oliver Valentine is a verified musician and songwriter whose
            submitted creative portfolio has been reviewed by Mankind Minds and
            confirmed as AI-free.
          </p>

          <div className="ai-free-card">
            <h3>AI-Free Creator Verification</h3>
            <p>
              Oliver’s submitted body of work was reviewed as part of the
              Mankind Minds verification process. His creative practice shows a
              human-led music process, including songwriting, vocals, production,
              live instrumentation, and band collaboration with OhValentine.
            </p>

            <strong>Verification Status: Proven AI-Free Creator</strong>
          </div>
        </div>
      </section>

      <section className="section">
        <h3>About Oliver’s Work</h3>

        <div className="certificate">
          <p>
            Oliver Valentine is a musician and songwriter in a band called
            OhValentine. They make noughties-inspired indie rock music and
            perform around Brighton.
          </p>

          <p>
            His submitted materials reflect a self-directed music process,
            including writing, vocals, production, live instrumental recording,
            and band-led performance.
          </p>
        </div>
      </section>

      <section className="section">
        <h3>Verification Review</h3>

        <div className="certificate">
          <p>
            Mankind Minds reviews the materials submitted by each creator to
            assess whether their creative output is human-made and free from AI
            generation. For musicians, this can include submitted tracks,
            recordings, production notes, live performance materials, social
            profiles, project links, and wider creative evidence.
          </p>

          <p>
            Oliver has declared that his submitted creative work was made
            entirely without the use of AI. Based on the reviewed materials, his
            creator profile has been approved as AI-free.
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

export default OliverValentineProfile;
