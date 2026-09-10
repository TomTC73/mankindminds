import "./index.css";
import Header from "./Header";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

const categories = ["Tattoos", "Music", "Writing", "Videos", "Art"];

const categoryFromSection = {
  "/tattoos": "Tattoos",
  "/music": "Music",
  "/writing": "Writing",
  "/videos": "Videos",
  "/art": "Art",
};

function CreatorApplication() {
  const location = useLocation();
  const [selectedPlatform, setSelectedPlatform] = useState("Instagram");
  const [platformHandle, setPlatformHandle] = useState("");
  const [applicationType, setApplicationType] = useState("individual");
  const [buildingName, setBuildingName] = useState("");
  const [buildingContact, setBuildingContact] = useState("");
  const [buildingEmail, setBuildingEmail] = useState("");
  const [buildingPhone, setBuildingPhone] = useState("");
  const [buildingAddress, setBuildingAddress] = useState("");
  const [buildingPostcode, setBuildingPostcode] = useState("");
  const [buildingWebsite, setBuildingWebsite] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(() => {
    const requestedCategory = new URLSearchParams(location.search).get("category");
    const matchingCategory = categories.find(
      (category) => category.toLowerCase() === requestedCategory?.toLowerCase(),
    );

    return (
      matchingCategory ||
      categoryFromSection[sessionStorage.getItem("selectedSection")] ||
      "Tattoos"
    );
  });

  const handleSubmit = (e) => {
    if (
      selectedCategory === "Tattoos" &&
      applicationType === "building" &&
      (!buildingName.trim() ||
        !buildingContact.trim() ||
        !buildingEmail.trim() ||
        !buildingAddress.trim() ||
        !buildingPostcode.trim())
    ) {
      e.preventDefault();
      alert("Please complete the building name, contact details, and address.");
    } else if (applicationType === "individual" && !platformHandle.trim()) {
      e.preventDefault();
      alert("Please provide a social media or portfolio link/username.");
    }
  };

  // Helper function to return relevant placeholder text based on selected option
  const getPlaceholder = () => {
    switch (selectedPlatform) {
      case "Instagram":
      case "TikTok":
        return "@yourusername";
      case "YouTube":
        return "https://youtube.com/@yourusername";
      case "Website":
        return "https://yourwebsite.com";
      default:
        return "https://yourportfolio.com";
    }
  };

  return (
    <div>
      <Header />

      <section className="section">
        <h3>Apply to Become Verified</h3>

        <form
          className={`application-form ${applicationType}-application`}
          action="https://api.web3forms.com/submit"
          method="POST"
          onSubmit={handleSubmit}
        >
          <input
            type="hidden"
            name="access_key"
            value="a268b81e-bb0f-4add-822b-edbb7c854136"
          />

          <input
            type="hidden"
            name="subject"
            value="New Verified Creator Application"
          />

          <input
            type="hidden"
            name="from_name"
            value="Mankind Minds Website"
          />

          {/* Hidden inputs to pass selected platform & handle to Web3Forms */}
          <input
            type="hidden"
            name="social_platform"
            value={selectedPlatform}
          />
          <input
            type="hidden"
            name="social_handle"
            value={platformHandle}
          />
          <input type="hidden" name="application_type" value={applicationType} />

          {selectedCategory === "Tattoos" && (
            <div className="application-type-tabs" role="tablist" aria-label="Tattoo application type">
              <button
                type="button"
                className={applicationType === "individual" ? "active" : ""}
                onClick={() => setApplicationType("individual")}
              >
                Apply as an individual
              </button>
              <button
                type="button"
                className={applicationType === "building" ? "active" : ""}
                onClick={() => setApplicationType("building")}
              >
                Register a building
              </button>
            </div>
          )}

          {selectedCategory === "Tattoos" && applicationType === "building" && (
            <div className="building-application-fields">
              <label>
                <span>Building / Studio Name <span className="required">*</span></span>
                <input name="building_name" value={buildingName} onChange={(event) => setBuildingName(event.target.value)} required />
              </label>
              <label>
                <span>Primary Contact Name <span className="required">*</span></span>
                <input name="building_contact" value={buildingContact} onChange={(event) => setBuildingContact(event.target.value)} required />
              </label>
              <label>
                <span>Contact Email <span className="required">*</span></span>
                <input type="email" name="building_email" value={buildingEmail} onChange={(event) => setBuildingEmail(event.target.value)} required />
              </label>
              <label>
                <span>Contact Phone</span>
                <input name="building_phone" value={buildingPhone} onChange={(event) => setBuildingPhone(event.target.value)} />
              </label>
              <label>
                <span>Full Address <span className="required">*</span></span>
                <textarea name="building_address" value={buildingAddress} onChange={(event) => setBuildingAddress(event.target.value)} required />
              </label>
              <label>
                <span>Postcode <span className="required">*</span></span>
                <input name="building_postcode" value={buildingPostcode} onChange={(event) => setBuildingPostcode(event.target.value)} required />
              </label>
              <label>
                <span>Website</span>
                <input name="building_website" value={buildingWebsite} onChange={(event) => setBuildingWebsite(event.target.value)} />
              </label>
              <label>
                <span>About the building</span>
                <textarea name="building_description" placeholder="Tell us about the studio and the artists working there." />
              </label>
            </div>
          )}

          <label className={applicationType === "building" ? "individual-only" : ""}>
            <span>
              Creator Name <span className="required">*</span>
            </span>

            <input
              type="text"
              name="creator_name"
              placeholder="Your name or creator name"
              required
            />
          </label>

          <label className={applicationType === "building" ? "individual-only" : ""}>
            <span>
              Email Address <span className="required">*</span>
            </span>

            <input
              type="email"
              name="email"
              placeholder="your@email.com"
              required={applicationType === "individual"}
            />
          </label>

          <label className={applicationType === "building" ? "individual-only" : ""}>
            <span>
              Creator Category <span className="required">*</span>
            </span>

            <select
              name="category"
              value={selectedCategory}
              onChange={(event) => {
                const category = event.target.value;
                setSelectedCategory(category);
                if (category !== "Tattoos") setApplicationType("individual");
              }}
              required
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>

          {/* Mobile-friendly flexible layout container */}
          <label className={applicationType === "building" ? "individual-only" : ""}>
            <span>
              Primary Social Media / Portfolio <span className="required">*</span>
            </span>
            <div
              style={{
                display: "flex",
                flexWrap: "nowrap",
                gap: "10px",
                marginTop: "5px",
                width: "100%",
                boxSizing: "border-box",
              }}
            >
              <select
                className="platform-select"
                value={selectedPlatform}
                onChange={(e) => setSelectedPlatform(e.target.value)}
                style={{
                  padding: "8px",
                  borderRadius: "4px",
                  minWidth: "120px",
                  boxSizing: "border-box",
                }}
              >
                <option value="Instagram">Instagram</option>
                <option value="TikTok">TikTok</option>
                <option value="YouTube">YouTube</option>
                <option value="Website">Website</option>
                <option value="Other">Other Portfolio</option>
              </select>

              <input
                type="text"
                value={platformHandle}
                placeholder={getPlaceholder()}
                onChange={(e) => setPlatformHandle(e.target.value)}
                required={applicationType === "individual"}
                style={{
                  flex: "1 1 200px",
                  minWidth: "0",
                  maxWidth: "100%",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </label>

          <label className={`checkbox-label ${applicationType === "building" ? "individual-only" : ""}`}>
            <input
              type="checkbox"
              name="terms_agreement"
              value="Agreed"
              required
            />

            <span>
              I agree to the{" "}
              <a href="/terms" target="_blank" rel="noreferrer">
                Terms & Conditions
              </a>
              . <span className="required">*</span>
            </span>
          </label>

          <label className={`checkbox-label ${applicationType === "building" ? "individual-only" : ""}`}>
            <input
              type="checkbox"
              name="ai_free_confirmation"
              value="Confirmed"
              required
            />

            <span>
              I confirm that the submitted work represents my own creative work and that the information provided in this application is accurate. <span className="required">*</span>
            </span>
          </label>

          <p className="form-note">
            Please make sure your links are public or viewable by anyone with
            the link. We use your submitted profiles and examples of work for
            verification.
          </p>

          <button className="button" type="submit">
            Submit Application
          </button>
        </form>
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

export default CreatorApplication;
