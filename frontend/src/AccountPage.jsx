import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import { useAccount } from "./AccountContext";
import { API_URL } from "./apiConfig";
import "./index.css";

const categories = ["Tattoos", "Music", "Writing", "Videos", "Art"];
const platforms = ["Instagram", "TikTok", "YouTube", "Website", "Other"];
const EMPTY_IMAGE_IDS = [];

function AccountPage() {
  const {
    account, loading, signIn, signUp, signOut, updateProfile,
    uploadImage, deleteImage, loadImage,
  } = useAccount();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({
    email: "", password: "", displayName: "", category: "Tattoos",
    socialPlatform: "Instagram", socialHandle: "", businessName: "",
    businessContactName: "", businessEmail: "", passwordConfirmation: "",
    termsAgreement: false,
  });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const tokenFromLink = searchParams.get("token");
  const isResetRoute = location.pathname === "/account/reset-password";

  useEffect(() => {
    if (!account) return;
    setForm((previous) => ({
      ...previous,
      email: account.email || "",
      displayName: account.displayName || "",
      category: account.category || "Tattoos",
      socialPlatform: account.socialPlatform || "Instagram",
      socialHandle: account.socialHandle || "",
      bio: account.bio || "",
      businessName: account.businessName || "",
      businessContactName: account.businessContactName || "",
      businessEmail: account.businessEmail || "",
    }));
  }, [account]);

  const [profilePhotoUrl, setProfilePhotoUrl] = useState("");
  const [galleryPhotos, setGalleryPhotos] = useState([]);
  const [imageError, setImageError] = useState("");
  const galleryImageIds = account?.galleryImageIds || EMPTY_IMAGE_IDS;

  useEffect(() => {
    let active = true;
    const objectUrls = [];
    const imageIds = [
      ...(account?.profileImageId ? [account.profileImageId] : []),
      ...galleryImageIds,
    ];
    Promise.allSettled(imageIds.map((imageId) => loadImage(imageId)))
      .then((results) => {
        if (!active) {
          results.forEach((result) => {
            if (result.status === "fulfilled") URL.revokeObjectURL(result.value);
          });
          return;
        }
        const fulfilledUrls = results.map((result) => {
          if (result.status === "rejected") {
            console.error("Could not load account photo:", result.reason);
            return "";
          }
          objectUrls.push(result.value);
          return result.value;
        });
        setProfilePhotoUrl(account?.profileImageId ? fulfilledUrls[0] : "");
        setGalleryPhotos(galleryImageIds.map((id, index) => ({
          id,
          url: fulfilledUrls[index + (account?.profileImageId ? 1 : 0)],
        })));
        setImageError(results.some((result) => result.status === "rejected")
          ? "Some photos could not be loaded. Refresh to try again."
          : "");
      });
    return () => {
      active = false;
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [account?.profileImageId, galleryImageIds, loadImage]);

  const change = (event) => setForm((previous) => ({
    ...previous,
    [event.target.name]: event.target.value,
  }));

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      if (mode === "signup") {
        if (form.password !== form.passwordConfirmation) {
          throw new Error("The passwords do not match.");
        }
        const { passwordConfirmation, ...signupDetails } = form;
        await signUp(signupDetails);
        setMessage("Your account is created and pending staff approval. Your profile stays private until it is approved.");
      } else {
        await signIn({ email: form.email, password: form.password });
        setMessage("Signed in successfully.");
      }
      const next = searchParams.get("next");
      if (next?.startsWith("/") && !next.startsWith("//")) navigate(next, { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  const requestReset = async () => {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`${API_URL}/accounts/password-reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not request a reset link.");
      setMessage(result.message);
    } catch (requestError) {
      setError(requestError.message || "Could not request a reset link.");
    } finally {
      setBusy(false);
    }
  };

  const confirmReset = async (event) => {
    event.preventDefault();
    if (resetPassword !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`${API_URL}/accounts/password-reset/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: tokenFromLink, newPassword: resetPassword }),
      });
      if (!response.ok) {
        const result = await response.json().catch(() => null);
        throw new Error(result?.error || "Could not reset the password.");
      }
      setMessage("Password updated. You can now sign in.");
      navigate("/account", { replace: true });
      setMode("login");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const {
        email, displayName, category, socialPlatform, socialHandle,
        businessName, businessContactName, businessEmail, bio,
      } = form;
      await updateProfile({
        email, displayName, category, socialPlatform, socialHandle,
        businessName, businessContactName, businessEmail, bio,
      });
      setMessage("Your profile has been saved.");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  const uploadPhotos = async (event, kind) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (!files.length) return;
    const remainingSlots = 8 - galleryImageIds.length;
    if (kind === "gallery" && files.length > remainingSlots) {
      setImageError(`You can add ${remainingSlots} more gallery photo${remainingSlots === 1 ? "" : "s"}.`);
      return;
    }
    setBusy(true);
    setError("");
    setMessage("");
    setImageError("");
    try {
      for (const file of files) await uploadImage(file, kind);
      setMessage(kind === "profile" ? "Your profile photo has been updated." : "Your gallery photo(s) have been added.");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  const removePhoto = async (imageId) => {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await deleteImage(imageId);
      setMessage("Photo removed.");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <><Header /><main className="section"><p role="status">Loading your account…</p></main><Footer /></>;
  }

  return (
    <div>
      <Header />
      <section className="section account-section">
        <div className="account-panel">
          {isResetRoute ? (
            <section>
              <h2>Set a new password</h2>
              {tokenFromLink ? (
                <form className="account-form" onSubmit={confirmReset}>
                  <label>New password (at least 12 characters)
                    <input type="password" value={resetPassword} onChange={(event) => setResetPassword(event.target.value)} minLength={12} maxLength={128} autoComplete="new-password" required />
                  </label>
                  <label>Confirm new password
                    <input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} minLength={12} maxLength={128} autoComplete="new-password" required />
                  </label>
                  <button className="button" type="submit" disabled={busy}>{busy ? "Updating…" : "Update password"}</button>
                </form>
              ) : (
                <p>This reset link is missing its token. Request a fresh link from the sign-in page.</p>
              )}
            </section>
          ) : account ? (
            <>
              <h2>Your account</h2>
              <p className={`account-status account-status-${(account.status || "PENDING").toLowerCase()}`}>
                Status: {account.status || "PENDING"}
              </p>
              {account.status !== "APPROVED" && (
                <p>Your profile is private until staff approve it. You can still view and edit your account details below.</p>
              )}
              <form className="account-form" onSubmit={saveProfile}>
                <ProfileFields form={form} onChange={change} includeBusiness />
                <button className="button" type="submit" disabled={busy}>{busy ? "Saving…" : "Save profile"}</button>
              </form>
              <section className="account-media">
                <h3>Your photos</h3>
                <p>Choose a JPEG, PNG, or WebP image up to 5 MB. Photos stay private until your account is approved.</p>
                <div className="account-profile-photo">
                  {profilePhotoUrl ? <img src={profilePhotoUrl} alt="Your profile" /> : <span>No profile photo</span>}
                </div>
                <label className="account-upload-label">
                  Upload profile picture
                  <input type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={(event) => uploadPhotos(event, "profile")} />
                </label>
                <label className="account-upload-label">
                  Add portfolio photos ({Math.max(0, 8 - galleryImageIds.length)} remaining)
                  <input type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={busy || galleryPhotos.length >= 8} onChange={(event) => uploadPhotos(event, "gallery")} />
                </label>
                {galleryPhotos.length > 0 && (
                  <div className="account-gallery">
                    {galleryPhotos.map((photo) => (
                      <div className="account-gallery-item" key={photo.id}>
                        {photo.url && <img src={photo.url} alt="Your portfolio work" />}
                        <button className="button account-secondary-action" type="button" disabled={busy} onClick={() => removePhoto(photo.id)}>Remove photo</button>
                      </div>
                    ))}
                  </div>
                )}
                {imageError && <p className="account-error" role="alert">{imageError}</p>}
              </section>
              <button className="button account-secondary-action" type="button" disabled={busy} onClick={requestReset}>Email me a password reset link</button>
              <button className="button account-secondary-action" type="button" onClick={async () => { await signOut(); setMessage("You have signed out."); }}>Sign out</button>
            </>
          ) : (
            <>
              <h2>{mode === "signup" ? "Create your account" : "Sign in"}</h2>
              <p>{mode === "signup"
                ? "Create a private profile. It will remain hidden until staff review and approve it."
                : "Sign in to manage your profile and apply for verification."}</p>
              <div className="account-mode-tabs" role="tablist" aria-label="Account access">
                <button type="button" className={mode === "login" ? "active" : ""} onClick={() => { setMode("login"); setError(""); }}>Sign in</button>
                <button type="button" className={mode === "signup" ? "active" : ""} onClick={() => { setMode("signup"); setError(""); }}>Create account</button>
              </div>
              <form className="account-form" onSubmit={submit}>
                {mode === "signup" && <ProfileFields form={form} onChange={change} includeBusiness={false} />}
                <label>Email address
                  <input type="email" name="email" value={form.email} onChange={change} autoComplete="email" required />
                </label>
                <label>Password{mode === "signup" ? " (at least 12 characters)" : ""}
                  <input type="password" name="password" value={form.password} onChange={change} minLength={mode === "signup" ? 12 : undefined} maxLength={72} autoComplete={mode === "signup" ? "new-password" : "current-password"} required />
                </label>
                {mode === "signup" && (
                  <>
                    <label>Confirm password
                      <input type="password" name="passwordConfirmation" value={form.passwordConfirmation} onChange={change} minLength={12} maxLength={72} autoComplete="new-password" required />
                    </label>
                    <label className="account-terms">
                      <input type="checkbox" checked={form.termsAgreement} onChange={(event) => setForm((previous) => ({ ...previous, termsAgreement: event.target.checked }))} required />
                      <span>I agree to the <Link to="/terms" target="_blank" rel="noreferrer">Terms & Conditions</Link>.</span>
                    </label>
                  </>
                )}
                <button className="button" type="submit" disabled={busy}>
                  {busy ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}
                </button>
              </form>
              {mode === "login" && <button className="button account-secondary-action" type="button" disabled={busy} onClick={requestReset}>Forgot your password?</button>}
            </>
          )}
          {error && <p className="account-error" role="alert">{error}</p>}
          {message && <p className="account-message" role="status">{message}</p>}
          {!account && !isResetRoute && (
            <p className="account-apply-note">Already signed in? <Link to={`/apply${location.search || "?category=tattoos"}`}>Continue to apply</Link>.</p>
          )}
          {account && <p className="account-apply-note"><Link to="/apply?category=tattoos">Continue to a creator application</Link></p>}
        </div>
      </section>
      <Footer />
    </div>
  );
}

function ProfileFields({ form, onChange, includeBusiness }) {
  return (
    <>
      <label>Display / creator name
        <input name="displayName" value={form.displayName} onChange={onChange} maxLength={200} required />
      </label>
      <label>Creator category
        <select name="category" value={form.category} onChange={onChange} required>
          {categories.map((category) => <option key={category}>{category}</option>)}
        </select>
      </label>
      <label>Primary social or portfolio type
        <select name="socialPlatform" value={form.socialPlatform} onChange={onChange} required>
          {platforms.map((platform) => <option key={platform}>{platform}</option>)}
        </select>
      </label>
      <label>Social profile or portfolio link
        <input name="socialHandle" value={form.socialHandle} onChange={onChange} maxLength={2048} />
      </label>
      <label>Bio
        <textarea name="bio" value={form.bio} onChange={onChange} maxLength={4000} rows={5} />
      </label>
      {(includeBusiness || form.category === "Tattoos") && form.category === "Tattoos" && (
        <>
          <label>Business / studio name (optional)
            <input name="businessName" value={form.businessName} onChange={onChange} maxLength={200} />
          </label>
          <label>Business contact name (optional)
            <input name="businessContactName" value={form.businessContactName} onChange={onChange} maxLength={200} />
          </label>
          <label>Business email (optional)
            <input type="email" name="businessEmail" value={form.businessEmail} onChange={onChange} maxLength={254} />
          </label>
        </>
      )}
      {includeBusiness && <label>Email address
        <input type="email" name="email" value={form.email} onChange={onChange} maxLength={254} required />
      </label>}
    </>
  );
}

export default AccountPage;
