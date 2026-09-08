import "./Home.css";
import Header from "./Header";
import Footer from "./Footer";
import { Navigate, useParams } from "react-router-dom";

const processBySection = {
  tattoos: {
    title: "The Tattoo Verification Process",
    intro:
      "We review tattoo artists and studios so clients can find trusted, original work.",
    work: "Tattoo portfolios, studio pages, and examples of original tattoo work.",
  },
  music: {
    title: "Joplin Verification",
    intro:
      "A close review for musicians, producers, and performers who make their own work.",
    work: "Artist profiles, releases, performances, and examples of original music.",
    storyTitle: "Keep the music personal.",
    story:
      "Scott Joplin made syncopation feel precise and alive. His music is full of choices: a rhythm held back, a phrase repeated, and a feeling made deliberate.",
    figure: "Scott Joplin",
    division: "Mankind Minds / Music division",
    lede: "A listening-led standard inspired by a composer who made timing, touch, and persistence part of his language.",
    historyEyebrow: "Why Joplin?",
    historyTitle: "A rhythm with a distinct voice.",
    history: "Born in Texas in 1868, Scott Joplin became the best-known composer of ragtime. His music combined rigorous composition with the physical energy of performance, while his opera Treemonisha showed an ambition that reached beyond the commercial world that first made his name.",
    principleEyebrow: "The Joplin principle",
    sourceUrl: "https://www.britannica.com/biography/Scott-Joplin",
    sourceLabel: "Encyclopaedia Britannica",
    image: "https://upload.wikimedia.org/wikipedia/commons/c/ca/Scott_Joplin_19072.jpg",
    imageAlt: "Scott Joplin in 1903",
    imageCaption: "Scott Joplin, photographed in 1903.",
    secondImage: "https://upload.wikimedia.org/wikipedia/commons/6/68/Scott_Joplin_in_1912.jpg",
    secondImageAlt: "Cover of the first edition of Maple Leaf Rag",
    secondImageCaption: "The published score: a work made to be played, remembered, and passed on.",
  },
  writing: {
    title: "Ellison Verification",
    intro:
      "A careful review for writers working in a world full of automated language.",
    work: "Stories, books, articles, essays, poetry, scripts, lyrics, and blogs.",
    storyTitle: "A mind is more than its output.",
    story:
      "Harlan Ellison understood that technology can become dangerous when it replaces judgment. His fiction used machines as warnings, while keeping the writer's voice at the centre.",
    figure: "Harlan Ellison",
    division: "Mankind Minds / Writing division",
    lede: "A writing standard inspired by an author who made the dangers of automated power impossible to ignore.",
    historyEyebrow: "Why Ellison?",
    historyTitle: "A warning written in a human voice.",
    history: "Harlan Ellison was an American writer and editor known for science fiction, essays, television, and short stories. I Have No Mouth, and I Must Scream imagined a supercomputer called AM that had taken total control. We read it as a warning about power and authorship, not as a literal prediction of today's tools.",
    principleEyebrow: "The Ellison principle",
    sourceUrl: "https://en.wikipedia.org/wiki/Harlan_Ellison",
    sourceLabel: "Harlan Ellison biography",
    image: "https://upload.wikimedia.org/wikipedia/commons/4/4d/Harlan_Ellison%2C_A._E._van_Vogt_and_Lydia_van_Vogt.jpg",
    imageAlt: "Harlan Ellison with A. E. van Vogt and Lydia van Vogt",
    imageCaption: "Harlan Ellison with fellow science-fiction writers.",
    secondImage: "https://upload.wikimedia.org/wikipedia/commons/2/20/Harlan_Ellison_at_the_LA_Press_Club_%28cropped%29.jpg",
    secondImageAlt: "Harlan Ellison speaking at the Los Angeles Press Club",
    secondImageCaption: "Ellison speaking publicly: argument and authorship held in the open.",
  },
  art: {
    title: "Cassatt Verification",
    intro:
      "A studio-aware review for artists whose work is shaped by materials, decisions, and time.",
    work:
      "Photography, digital art, illustrations, paintings, graphic design, and concept art.",
    storyTitle: "Look for the hand behind the image.",
    story:
      "Mary Cassatt made intimacy visible through observation, repetition, and touch. Her work shows that an image is more than an output. It also records where the artist looked and what she noticed.",
    figure: "Mary Cassatt",
    division: "Mankind Minds / Art division",
    lede: "A studio-aware standard inspired by an artist who made close looking feel like a form of truth.",
    historyEyebrow: "Why Cassatt?",
    historyTitle: "Look for the hand behind the image.",
    history: "Mary Cassatt was an American painter and printmaker who built her career in France and exhibited with the Impressionists. She worked across painting, pastel, etching, aquatint, and drypoint, becoming known for intimate studies of women, mothers, and children.",
    principleEyebrow: "The Cassatt principle",
    sourceUrl: "https://www.britannica.com/biography/Mary-Cassatt",
    sourceLabel: "Encyclopaedia Britannica",
    image: "https://upload.wikimedia.org/wikipedia/commons/8/84/Mary_Cassatt_-_Under_the_Horse-Chestnut_Tree_-_Google_Art_Project.jpg?utm_source=commons.wikimedia.org",
    imageAlt: "Mary Cassatt painting Under the Horse-Chestnut Tree",
    imageCaption: "Mary Cassatt, Under the Horse-Chestnut Tree.",
    secondImage: "https://upload.wikimedia.org/wikipedia/commons/7/72/Mary_Cassatt_-_The_Child%27s_Bath_-_Google_Art_Project.jpg?utm_source=commons.wikimedia.org",
    secondImageAlt: "Mary Cassatt painting The Child's Bath",
    secondImageCaption: "The Child's Bath: observation, structure, and the trace of a hand.",
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
                Human review · AI-free assessment
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
            <div className="tattoo-process-gallery">
              <figure className="tattoo-process-image-frame">
                <img
                  src="/Tatooshops/image.png"
                  alt="Tattoo detail from a contemporary studio"
                />
                <figcaption>Living linework, carrying the tradition forward.</figcaption>
              </figure>
              <figure className="tattoo-process-image-frame tattoo-process-history-image">
                <img
                  src="https://www.tattooarchive.com/assets/img/history/burchett-george-charles.jpg"
                  alt="George Burchett tattooing his brother Charles"
                />
                <figcaption>George Burchett at work, from the Tattoo Archive.</figcaption>
              </figure>
            </div>
            <div className="tattoo-process-story-copy">
              <p className="eyebrow">The Burchett principle</p>
              <h2>Make the mark mean something.</h2>
              <p>
                Burchett collected references and translated them through his
                own hand. We look for the decisions, imperfections, and point
                of view that make a tattooist's work unmistakably theirs.
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
              <h2>Three checks. One clear decision.</h2>
            </div>
            <div className="tattoo-process-check-grid">
              <article>
                <span>01</span>
                <h3>Trace the practice</h3>
                <p>
                  We review studio history, portfolio continuity, process notes,
                  and the context around the work.
                </p>
              </article>
              <article>
                <span>02</span>
                <h3>Read the artwork</h3>
                <p>
                  Our image screening tools look for patterns associated with
                  synthetic imagery. A reviewer then considers the result
                  alongside the work and its history.
                </p>
              </article>
              <article>
                <span>03</span>
                <h3>Make the call</h3>
                <p>
                  A reviewer considers the evidence as a whole. If we find no
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
    <div className="process-page tattoo-process-page">
      <Header />
      <main>
        <section className="tattoo-process-hero">
          <div className="tattoo-process-hero-content">
            <p className="eyebrow">{process.division}</p>
            <h1>{process.title}</h1>
            <p className="tattoo-process-lede">{process.lede}</p>
            <div className="tattoo-process-stamp">
              Human-led review · AI-free assessment
            </div>
          </div>
        </section>

        <section className="tattoo-process-intro">
          <div>
            <p className="eyebrow">{process.historyEyebrow}</p>
            <h2>{process.historyTitle}</h2>
          </div>
          <p>{process.history}</p>
        </section>

        <section className="tattoo-process-story">
          <div className="tattoo-process-gallery">
            <figure className="tattoo-process-image-frame">
              <img src={process.image} alt={process.imageAlt} />
              <figcaption>{process.imageCaption}</figcaption>
            </figure>
            <figure className="tattoo-process-image-frame tattoo-process-history-image">
              <img src={process.secondImage} alt={process.secondImageAlt} />
              <figcaption>{process.secondImageCaption}</figcaption>
            </figure>
          </div>
          <div className="tattoo-process-story-copy">
            <p className="eyebrow">{process.principleEyebrow}</p>
            <h2>{process.storyTitle}</h2>
            <p>{process.story}</p>
            <p className="source-note">
              Historical references:{" "}
              <a href={process.sourceUrl} target="_blank" rel="noreferrer">
                {process.sourceLabel}
              </a>{" "}
              and image credits are linked through the public-domain source
              records where available.
            </p>
          </div>
        </section>

        <section className="tattoo-process-check">
          <div className="tattoo-process-check-heading">
            <p className="eyebrow">Our review</p>
            <h2>Three checks. One clear decision.</h2>
          </div>
          <div className="tattoo-process-check-grid">
            <article>
              <span>01</span>
              <h3>Trace the practice</h3>
              <p>
                We review drafts, credits, performances, studio history,
                portfolio continuity, and the context around the work.
              </p>
            </article>
            <article>
              <span>02</span>
              <h3>Read the evidence</h3>
              <p>
                Our specialist tools look for patterns associated with
                synthetic material. A reviewer then considers those results
                alongside the work itself.
              </p>
            </article>
            <article>
              <span>03</span>
              <h3>Make the call</h3>
              <p>
                A reviewer considers the evidence as a whole. If we find no reason
                to believe the submitted work is AI-generated, we issue{" "}
                {process.title}.
              </p>
            </article>
          </div>
        </section>

        <section className="tattoo-process-quote">
          <p>Good work carries the choices that made it.</p>
          <span>A working belief behind {process.title}</span>
        </section>
      </main>
      <Footer />
    </div>
  );
}

export default Process;