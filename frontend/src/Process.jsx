import "./Home.css";
import Header from "./Header";
import Footer from "./Footer";
import { Navigate, useParams } from "react-router-dom";

const processBySection = {
  tattoos: {
    title: "The Tattoo Verification Process",
    intro:
      "We review tattoo artists and studios to help clients discover trusted, human-led tattoo work.",
    work: "Tattoo portfolios, studio pages, and examples of original tattoo work.",
  },
  music: {
    title: "The Music Verification Process",
    intro:
      "We review musicians and producers to help listeners and collaborators find authentic creative work.",
    work: "Artist profiles, releases, performances, and examples of original music.",
  },
  writing: {
    title: "The Writing Verification Process",
    intro:
      "We review writers to help readers and collaborators identify original written work.",
    work: "Stories, books, articles, essays, poetry, scripts, lyrics, and blogs.",
  },
  art: {
    title: "The Art Verification Process",
    intro:
      "We review artists to help audiences and collaborators discover authentic visual work.",
    work:
      "Photography, digital art, illustrations, paintings, graphic design, and concept art.",
  },
};

function Process() {
  const { section } = useParams();
  const process = processBySection[section];

  if (!process) {
    return <Navigate to="/process/tattoos" replace />;
  }

  if (section === "tattoos") {
    return (
      <div className="process-page tattoo-process-page">
        <Header />

        <main>
          <section className="tattoo-process-hero">
            <div className="tattoo-process-hero-content">
              <p className="eyebrow">Mankind Minds / Tattoo division</p>
              <h1>Burchett Verification</h1>
              <p className="tattoo-process-lede">
                A modern standard for tattoo work inspired by George
                “Professor” Burchett.
              </p>
              <div className="tattoo-process-stamp">
                Human-led review · AI-free assessment
              </div>
            </div>
          </section>

          <section className="tattoo-process-intro">
            <div>
              <p className="eyebrow">Why Burchett?</p>
              <h2>Tradition with a sharper lens.</h2>
            </div>
            <p>
              Born in Brighton in 1872, George Burchett-Davis became a
              full-time tattooist around 1900. Known as the “King of
              Tattooists”, he worked in London and drew on influences gathered
              through worldwide travel.
            </p>
          </section>

          <section className="tattoo-process-story">
            <div className="tattoo-process-image-frame">
              <img
                src="/Tatooshops/image.png"
                alt="Tattoo detail from a contemporary studio"
              />
              <p>Living linework, carrying the tradition forward.</p>
            </div>
            <div className="tattoo-process-story-copy">
              <p className="eyebrow">The Burchett principle</p>
              <h2>Make the mark mean something.</h2>
              <p>
                Burchett collected references and translated them through a
                human hand. We look for the decisions, imperfections, and point
                of view that make a tattooist’s work unmistakably theirs.
              </p>
              <p className="source-note">
                Historical references:{" "}
                <a
                  href="https://en.wikipedia.org/wiki/George_Burchett"
                  target="_blank"
                  rel="noreferrer"
                >
                  George Burchett overview
                </a>{" "}
                and the{" "}
                <a
                  href="https://www.tattooarchive.com/history/burchett_george_charles.php"
                  target="_blank"
                  rel="noreferrer"
                >
                  Tattoo Archive
                </a>
                .
              </p>
            </div>
          </section>

          <section className="tattoo-process-check">
            <div className="tattoo-process-check-heading">
              <p className="eyebrow">Our review</p>
              <h2>Three passes. One human signature.</h2>
            </div>
            <div className="tattoo-process-check-grid">
              <article>
                <span>01</span>
                <h3>Trace the practice</h3>
                <p>
                  We follow the public trail: studio history, portfolio
                  continuity, process notes, and the lived context around the
                  work.
                </p>
              </article>
              <article>
                <span>02</span>
                <h3>Read the artwork</h3>
                <p>
                  Our image screening algorithms look for patterns associated
                  with synthetic imagery. The result is a signal for review,
                  never a substitute for a human eye.
                </p>
              </article>
              <article>
                <span>03</span>
                <h3>Make the call</h3>
                <p>
                  A reviewer weighs the evidence together. When we find no
                  reason to believe the submitted tattoo work is AI-generated,
                  we issue Burchett Verification.
                </p>
              </article>
            </div>
          </section>

          <section className="tattoo-process-quote">
            <p>
              A tattoo records a person, a place, and a point in time.
            </p>
            <span>A working belief behind Burchett Verification</span>
          </section>
        </main>

        <Footer />
      </div>
    );
  }

  return (
    <div>
      <Header />

      <section className="section">
        <h3>{process.title}</h3>

        <p className="section-intro">{process.intro}</p>

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
        <h3>What We Review</h3>

        <p className="section-intro">{process.work}</p>

        <div style={{ maxWidth: "700px", margin: "0 auto" }}>
          <p>
            We assess the work submitted for this category and the public
            information that supports its origin and authenticity.
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

    <Footer />
    </div>
  );
}

export default Process;