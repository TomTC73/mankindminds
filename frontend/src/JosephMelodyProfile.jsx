import "./index.css";
import Header from "./Header";
import JosephMelodyImg from "./assets/joseph-melody.jpg";


function JosephMelodyProfile() {
  const socialLinks = [
    {
      name: "Instagram",
      url: "https://instagram.com/joesjpgs",
    },
    {
      name: "Email",
      url: "mailto:josephmelody2804@gmail.com",
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
            Joseph Melody is a verified photographer whose submitted creative portfolio has been reviewed by Mankind Minds and confirmed as AI-free.
          </p>

          <div className="ai-free-card">
            <h3>AI-Free Verification</h3>
            <p>
              Joseph’s submitted body of work was reviewed as part of the Mankind Minds verification process. His creative practice shows a human-led photographic process, including raw image capture, camera operations (both digital and film), and digital post-processing.
            </p>

            <strong>Verification Status: Proven AI-Free Creator</strong>
          </div>
        </div>
      </section>

      <section className="section">
        <h3>About Joseph’s Work</h3>

        <div className="certificate">
          <p>
            Joseph Melody is a photographer who creates images for a wide range of purposes, from capturing the essence of unique cultures through street photography to providing portfolio assets for student films.
          </p>
          <p>
            His submitted materials reflect a self-directed, intentional photographic process, utilizing physical cameras and traditional editing workflows to capture and share human-led visual stories. He is deeply passionate about the effort that goes into his photography and stands firmly against AI-generated imagery.
          </p>
        </div>
      </section>

      <section className="section">
        <h3>Verification Review</h3>

        <div className="certificate">
          <p>
           Mankind Minds reviews the materials submitted by each creator to assess whether their creative output is human-made and free from AI generation. For photographers, this can include raw images, metadata, camera specifications, editing workflows, portfolio links, and wider creative evidence.
         </p>


         <p>
           Joseph has declared that his submitted creative work was made
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

export default JosephMelodyProfile;
