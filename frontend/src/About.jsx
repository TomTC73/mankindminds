import "./Home.css";
import { Link } from "react-router-dom";
import Header from "./Header";


function About() {
  return (
    <div>
      <Header />

      <section className="section" id="about">
        <h3>About Mankind Minds</h3>

        <p className="section-intro">
          A simple verification platform designed to help creators present their
          AI-Free status clearly, professionally, and confidently.
        </p>

        <div className="grid">
          <div className="card">
            <span>01</span>
            <h4>Trusted Verification</h4>
            <p>
              We help creators prove their identity, credibility, and
              authenticity through a clean verification process.
            </p>
          </div>

          <div className="card">
            <span>02</span>
            <h4>Shareable Certificates</h4>
            <p>
              Each verified creator receives a simple certificate that can be
              shared with brands, followers, and collaborators.
            </p>
          </div>

          <div className="card">
            <span>03</span>
            <h4>Built for Creators</h4>
            <p>
              Our platform is made for creators who want to build trust and
              present themselves more professionally online.
            </p>
          </div>
        </div>
      </section>

      <section className="section" id="process">
        <h3>How It Works</h3>

        <p className="section-intro">
          Creator certification should be clear, simple, and easy to understand.
        </p>

        <div className="grid steps">
          <div className="card step">
            <h4>Submit Details</h4>
            <p>
              Creators provide the information needed to confirm their identity
              and online presence.
            </p>
          </div>

          <div className="card step">
            <h4>Get Verified</h4>
            <p>
              Their profile is scanned against
              our algorithms to confirm we have no reason to doubt the creator is AI-Free.
            </p>
          </div>

          <div className="card step">
            <h4>Receive Certificate</h4>
            <p>
              Verified creators receive certification they can display and share
              anywhere online.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="certificate">
          <h3>Certificate Preview</h3>

          <p>
            A clean, professional certificate that communicates trust at a
            glance.
          </p>

          <div className="certificate-preview">
            <h4>Certificate of Verification</h4>

            <p>This certifies that</p>

            <p className="certificate-name">Creator Name</p>

            <p>
              has been verified by Mankind Minds for authenticity,
              credibility, and creator status.
            </p>

            <p className="certificate-meta">Certificate ID: MM-2026-001</p>
          </div>
        </div>
      </section>

      <section className="cta">
        <h3>Start Building Trust</h3>

        <p>
          Explore verified creators and see how certification can strengthen a
          creator’s professional presence.
        </p>

        <Link to="/certificates">
          <button className="button">Browse Certificates</button>
        </Link>
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

export default About;
