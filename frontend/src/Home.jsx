import React from "react";
import "./Home.css";

export default function Home() {
  return (
    <div>
      <header className="header">
        <div className="logo">Mankind Minds</div>
        <nav className="nav">
          <a href="#">About</a>
          <a href="#">Submit</a>
          <a href="#">Certificates</a>
        </nav>
      </header>

      <section className="hero">
        <div className="hero-box">
          <h2>Prove Your Work is Human</h2>
          <p>
            Submit your creative work. Our system analyzes it, and real people
            verify it. Earn a certificate that proves your work is authentically
            human-made.
          </p>
          <button className="button">Submit Your Work</button>
        </div>
      </section>

      <section className="section">
        <h3>How It Works</h3>
        <div className="grid">
          <div className="card">
            <h4>1. Submit</h4>
            <p>Upload your text, image, or video for analysis.</p>
          </div>

          <div className="card">
            <h4>2. Scan</h4>
            <p>Our AI evaluates patterns and originality signals.</p>
          </div>

          <div className="card">
            <h4>3. Verify</h4>
            <p>
              Human reviewers confirm authenticity and issue certification.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="certificate">
          <h3>A New Standard of Trust</h3>
          <p>
            Like a Fairtrade label for creativity, Mankind Minds certification
            shows your work was made by a real human mind.
          </p>

          <div className="certificate-preview">
            <p>[ Certificate Preview ]</p>
          </div>
        </div>
      </section>

      <footer className="footer">
        <p>© {new Date().getFullYear()} Mankind Minds</p>
      </footer>
    </div>
  );
}
