import "./Home.css";
import Header from "./Header";
import { Link } from "react-router-dom";

function Process() {
  return (
    <div>
      <Header />

      <section className="section">
        <h3>Our Verification Process</h3>

        <p className="section-intro">
          Every application is reviewed using our specialised analysis system to
          determine whether we have any reason to believe the submitted work is
          AI-generated.
        </p>

        <div className="grid">
          <div className="card">
            <span>01</span>
            <h4>Submit Your Work</h4>
            <p>
              Apply using your public social media profiles, portfolio links,
              and examples of your original work for review.
            </p>
          </div>

          <div className="card">
            <span>02</span>
            <h4>Analysis</h4>
            <p>
              Our specialised algorithms analyse the content available through
              the links you provide for indicators of AI-generated material.
            </p>
          </div>

          <div className="card">
            <span>03</span>
            <h4>Certification</h4>
            <p>
              If our analysis gives us no reason to believe your work is
              AI-generated, you'll receive an official Mankind Minds
              verification certificate to display online.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <h3>Current Verification Categories</h3>

        <p className="section-intro">
          We currently analyse the following types of creative work.
        </p>

        <div style={{ maxWidth: "700px", margin: "0 auto" }}>
          <h4>Images</h4>
          <p>
            Photography, digital art, illustrations, paintings, graphic design,
            concept art, and other visual media.
          </p>

          <br />

          <h4>Text</h4>
          <p>
            Stories, books, articles, essays, poetry, scripts, lyrics, blogs,
            and other written works.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="certificate">
          <h3>What Certification Means</h3>

          <p>
            A Mankind Minds certificate signifies that, based on our analysis,
            we found no reason to believe the submitted work is AI-generated
            within the categories reviewed. It provides creators with a
            professional, shareable way to demonstrate authenticity.
          </p>
        </div>
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

export default Process;