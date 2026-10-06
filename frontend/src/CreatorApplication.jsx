import "./index.css";
import Header from "./Header";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { API_URL } from "./apiConfig";
import { useAccount } from "./AccountContext";

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
  const { account, token } = useAccount();
  const [selectedPlatform, setSelectedPlatform] = useState("Instagram");
  const [platformHandle, setPlatformHandle] = useState("");
  const [applicationType, setApplicationType] = useState("individual");
  const [businessName, setBusinessName] = useState("");
  const [businessContact, setBusinessContact] = useState("");
  const [businessEmail, setBusinessEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (
      selectedCategory === "Tattoos" &&
      applicationType === "business" &&
      (!businessContact.trim() ||
        !businessName.trim() ||
        !businessEmail.trim())
    ) {
      setErrorMsg("Please complete your name, business name, and email address.");
      return;
    } else if (applicationType === "individual" && !platformHandle.trim()) {
      setErrorMsg("Please provide a social media or portfolio link/username.");
      return;
    }

    const formData = new FormData(e.currentTarget);
    const isBusiness = applicationType === "business";
    const application = {
      applicationType,
      creatorName: isBusiness ? null : formData.get("creator_name")?.trim(),
      email: isBusiness ? null : formData.get("email")?.trim(),
      category: selectedCategory,
      socialPlatform: selectedPlatform,
      socialHandle: isBusiness ? null : platformHandle.trim(),
      businessContactName: isBusiness ? businessContact.trim() : null,
      businessName: isBusiness ? businessName.trim() : null,
      businessEmail: isBusiness ? businessEmail.trim() : null,
      termsAgreement: formData.get("terms_agreement") === "Agreed",
      aiFreeConfirmation: formData.get("ai_free_confirmation") === "Confirmed",
    };

    setSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/applications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(application),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error || "Failed to submit your application. Please try again.");
      }

      setSubmitted(true);
    } catch (error) {
      setErrorMsg(error.message || "An unexpected error occurred.");
    } finally {
      setSubmitting(false);
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

  if (account?.claimRequired) {
    return (
      <div>
        <Header />
        <main className="section creator-application-page">
          <div className="creator-application-shell">
            <header className="creator-application-heading">
              <p className="account-eyebrow">CREATOR ACCOUNT</p>
              <h1>Claim your account first</h1>
              <p>Verify your email address and choose a new password before continuing to the application.</p>
              <Link className="button" to="/account">Continue account claim</Link>
            </header>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div>
      <Header />

      <main className="section creator-application-page">
        <div className="creator-application-shell">
        <header className="creator-application-heading">
          <p className="account-eyebrow">CREATOR APPLICATION</p>
          <h1>Apply to become verified</h1>
          <p>Tell us about your creative work. Our team reviews every application individually.</p>
        </header>
        {account && (
          <div className="application-account-note">
            <span className="application-account-avatar" aria-hidden="true">{account.displayName?.trim()?.charAt(0)?.toUpperCase() || "M"}</span>
            <p><strong>Applying as {account.displayName}.</strong><br />Your account email is {account.email}. <Link to="/account">Edit your profile</Link></p>
          </div>
        )}

        {submitted ? (
          <div className="application-success" role="status">
            <span className="application-success-mark" aria-hidden="true">✓</span>
            <p className="account-eyebrow">APPLICATION RECEIVED</p>
            <h2>Thank you for applying.</h2>
            <p>Your application has been sent to our team for review. We’ll be in touch using the contact details on your account.</p>
            <Link className="button" to="/account">Back to your account</Link>
          </div>
        ) : (
          <form
            className={`application-form ${applicationType}-application`}
            onSubmit={handleSubmit}
          >

          {selectedCategory === "Tattoos" && (
            <div className="application-type-tabs" role="group" aria-label="Tattoo application type">
              <button
                type="button"
                className={applicationType === "individual" ? "active" : ""}
                aria-pressed={applicationType === "individual"}
                onClick={() => setApplicationType("individual")}
              >
                Apply as an individual
              </button>
              <button
                type="button"
                className={applicationType === "business" ? "active" : ""}
                aria-pressed={applicationType === "business"}
                onClick={() => setApplicationType("business")}
              >
                Apply as a business
              </button>
            </div>
          )}

          {selectedCategory === "Tattoos" && applicationType === "business" && (
            <div className="building-application-fields">
              <label>
                <span>Your Name <span className="required">*</span></span>
                <input name="business_contact_name" value={businessContact} onChange={(event) => setBusinessContact(event.target.value)} required />
              </label>
              <label>
                <span>Your Business <span className="required">*</span></span>
                <input name="business_name" value={businessName} onChange={(event) => setBusinessName(event.target.value)} required />
              </label>
              <label>
                <span>Your Email <span className="required">*</span></span>
                <input type="email" name="business_email" value={businessEmail} onChange={(event) => setBusinessEmail(event.target.value)} required />
              </label>
              <p className="business-application-note">
                For further queries, email{" "}
                <a href="mailto:admin@mankindminds.com">admin@mankindminds.com</a> or call{" "}
                <a href="tel:07305438010">07305438010</a> to speak with Dan,
                Head of Onboarding.
              </p>
            </div>
          )}

          <label className={applicationType === "business" ? "individual-only" : ""}>
            <span>
              Creator Name <span className="required">*</span>
            </span>

            <input
              type="text"
              name="creator_name"
              defaultValue={account?.displayName || ""}
              placeholder="Your name or creator name"
              required={applicationType === "individual"}
            />
          </label>

          <label className={applicationType === "business" ? "individual-only" : ""}>
            <span>
              Email Address <span className="required">*</span>
            </span>

            <input
              type="email"
              name="email"
              defaultValue={account?.email || ""}
              placeholder="your@email.com"
              required={applicationType === "individual"}
            />
          </label>

          <label className={applicationType === "business" ? "individual-only" : ""}>
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
          <label className={applicationType === "business" ? "individual-only" : ""}>
            <span>
              Primary Social Media / Portfolio <span className="required">*</span>
            </span>
            <div className="application-social-fields">
              <select
                className="platform-select"
                name="social_platform"
                value={selectedPlatform}
                onChange={(e) => setSelectedPlatform(e.target.value)}
              >
                <option value="Instagram">Instagram</option>
                <option value="TikTok">TikTok</option>
                <option value="YouTube">YouTube</option>
                <option value="Website">Website</option>
                <option value="Other">Other Portfolio</option>
              </select>

              <input
                type="text"
                name="social_handle"
                value={platformHandle}
                placeholder={getPlaceholder()}
                onChange={(e) => setPlatformHandle(e.target.value)}
                required={applicationType === "individual"}
              />
            </div>
          </label>

          <label className="checkbox-label">
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

          <label className="checkbox-label">
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

          {errorMsg && <div className="application-error" role="alert">{errorMsg}</div>}

          <button className="button" type="submit" disabled={submitting}>
            {submitting ? "Submitting Application..." : "Submit Application"}
          </button>
          </form>
        )}
        </div>
      </main>

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
