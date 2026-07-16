import "./index.css";
import { Link } from "react-router-dom";
import Header from "./Header";
import samuelGreenImg from "./assets/samuel-green.jpg";
import OliverValentineImg from "./assets/oliver-valentine.jpg";
import JosephMelodyImg from "./assets/joseph-melody.jpg";

function VerifiedCreators() {
  const creators = [
    {
      name: "Samuel Green",
      category: "Illustrator",
      description:
        "sharing creativity & inspiration! A UK based illustrator, with a range of products.",
      imageUrl: samuelGreenImg,
      profileUrl: "/creators/samuel-green",
    },
    {
      name: "Oliver Valentine",
      category: "Musician",
      description:
        "Musician and songwriter in OhValentine, creating noughties-inspired indie rock and performing around Brighton.",
      imageUrl: OliverValentineImg,
      profileUrl: "/creators/oliver-valentine",
    },
    {
      name: "Joseph Melody",
      category: "Photographer",
      description:
        "Sample creator page ready for replacement. Add Joseph’s real bio, work, and verification details here.",
      imageUrl: JosephMelodyImg,
      profileUrl: "/creators/joseph-melody",
    },
  ];

  return (
    <div>
      <Header />

      <section className="hero">
        <div className="hero-box">
          <h2>View Our Verified Creators</h2>
          <p>
            Explore trusted creators who have been reviewed and verified as AI-Free through
            our certification process.
          </p>

          <Link to="/apply">
            <button className="button">Apply now</button>
          </Link>
        </div>
      </section>

      <section className="section" id="creators">
        <h3>Verified Creators</h3>

        <div className="creator-tabs">
          {creators.map((creator, index) => (
            <div className="creator-tab" key={index}>
              <div className="creator-avatar">
                {creator.imageUrl ? (
                  <img
                    src={creator.imageUrl}
                    alt={`${creator.name} profile`}
                    className="creator-avatar-img"
                  />
                ) : (
                  creator.name
                    .split(" ")
                    .map((word) => word.charAt(0))
                    .join("")
                )}
              </div>

              <div className="creator-info">
                <h4>{creator.name}</h4>
                <p className="creator-category">{creator.category}</p>
                <p>{creator.description}</p>
              </div>

              <span className="verified-badge">Verified</span>

              <Link to={creator.profileUrl}>
                <button className="button creator-button">View Profile</button>
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="section" id="apply">
        <div className="certificate">
          <h3>Want to become a verified creator?</h3>
          <p>
            Apply for verification and show your audience that your creator
            profile has been reviewed and approved.
          </p>

          <Link to="/apply">
            <button className="button">Apply Now</button>
          </Link>
        </div>
      </section>

      <footer className="footer">
        <p>© 2026 Mankind Minds. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default VerifiedCreators;