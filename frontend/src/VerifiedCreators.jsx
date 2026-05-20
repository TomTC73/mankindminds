import "./index.css";
import { Link } from "react-router-dom";

function VerifiedCreators() {
  const creators = [
    {
      name: "Samuel Green",
      category: "Illustrator",
      description:
        "sharing creativity & inspiration! A UK based illustrator, with a range of products.",
      imageUrl:
        "https://scontent-man2-1.cdninstagram.com/v/t51.2885-19/501385646_18052020740461268_2359320855962906776_n.jpg?stp=dst-jpg_s150x150_tt6&efg=eyJ2ZW5jb2RlX3RhZyI6InByb2ZpbGVfcGljLmRqYW5nby4xMDgwLmMyIn0&_nc_ht=scontent-man2-1.cdninstagram.com&_nc_cat=108&_nc_oc=Q6cZ2gHnG9CDw42hQnQundY7HTjJUdzMhE8zIRgPlHtsTBsIba4jR9Ql4NlvhlTyfSshe-M&_nc_ohc=PwQDi_b04IcQ7kNvwG6CEqk&_nc_gid=u9u9oBLXtkU1lOVZlkCNEA&edm=AP4sbd4BAAAA&ccb=7-5&oh=00_Af5snuSd1qO1XpLu0PJLQPfu80CzKe5lfT_ySJFWRPGpAA&oe=6A13D5AD&_nc_sid=7a9f4b",
    },
    {
      name: "Leo Martinez",
      category: "Fitness Coach",
      description:
        "Shares simple workout routines, nutrition tips, and beginner-friendly programs.",
      imageUrl: "",
    },
    {
      name: "Maya Chen",
      category: "Digital Artist",
      description:
        "Creates modern illustrations, brand visuals, and creative tutorials.",
      imageUrl: "",
    },
    {
      name: "Noah Williams",
      category: "Tech Reviewer",
      description:
        "Reviews everyday tech, productivity tools, and creator equipment.",
      imageUrl: "",
    },
    {
      name: "Sofia Patel",
      category: "Travel Creator",
      description:
        "Documents city guides, hidden gems, and practical travel advice.",
      imageUrl: "",
    },
    {
      name: "Ethan Brooks",
      category: "Music Producer",
      description:
        "Produces original tracks, shares sound design tips, and creator resources.",
      imageUrl: "",
    },
  ];

  return (
    <div>
      <header className="header">
        <h1 className="logo">Creator Certify</h1>

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

              <button className="button creator-button">View Profile</button>
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
        <p>© 2026 Creator Certify. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default VerifiedCreators;