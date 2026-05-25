import "./index.css";
import { Link } from "react-router-dom";
import samuelGreenImg from "./assets/samuel-green.jpg";

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
  ];

  return (
    <div>
      <header className="header">
        <h1 className="logo">Mankind Minds</h1>

        <nav className="nav">
          <Link to="/">Home</Link>
          <a href="#creators">Creators</a>
          <a href="#apply">Apply</a>
        </nav>
      </header>

      <section className="hero">
        <div className="hero-box">
          <h2>View Our Verified Creators</h2>
          <p>
            Explore trusted creators who have been reviewed and verified through
            our certification process.
          </p>

          <a href="#apply">
            <button className="button">Become Verified</button>
          </a>
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
                  creator.name.charAt(0)
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

          <button className="button">Apply Now</button>
        </div>
      </section>

      <footer className="footer">
        <p>© 2026 Mankind Minds. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default VerifiedCreators;