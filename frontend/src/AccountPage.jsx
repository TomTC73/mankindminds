import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import { useAccount } from "./AccountContext";
import { API_URL, resolveCreatorImageUrl } from "./apiConfig";
import "./index.css";
import "./AccountPage.css";
const categories = ["Tattoos", "Music", "Writing", "Videos", "Art"];
const platforms = ["Instagram", "TikTok", "YouTube", "Website", "Other"];
const EMPTY_IMAGE_IDS = [];
function AccountPage() {
  const {
    account, loading, previewOnly, signIn, signUp, sendSignupVerificationCode,
    sendClaimVerificationCode, claimAccount, signOut, updateProfile,
    deleteAccount, uploadImage, deleteImage, loadImage,
  } = useAccount();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState("login");
  const [previewStatus, setPreviewStatus] = useState("PENDING");
  const accountStatus = previewOnly
    ? previewStatus
    : account?.status?.toUpperCase() || "PENDING";
  const accountStatusLabel = {
    PENDING: "Under review",
    APPROVED: "Approved",
    REJECTED: "Not approved",
    BANNED: "Restricted",
  }[accountStatus] || "In progress";
  const accountStatusMessage = {
    PENDING: previewOnly
      ? "Your profile is under review. You should hear back within 48 hours. It will remain private until approved. This is a local sample, not a real submission."
      : "Your profile is under review. You should hear back within 48 hours. It will remain private until it is approved.",
    APPROVED: "Your profile has been approved by the Mankind Minds team.",
    REJECTED: "Your submission was not approved. Please check your email for details or contact the team.",
    BANNED: "Your account is restricted. Please contact the team if you need help.",
  }[accountStatus] || "Your profile is being prepared. Please check back for updates.";
  const [form, setForm] = useState({
    email: "", password: "", displayName: "", category: "",
    socialPlatform: "Instagram", socialHandle: "", businessName: "",
    businessContactName: "", businessEmail: "", passwordConfirmation: "",
    description: "", bio: "", socialLinks: [], termsAgreement: false,
  });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [claimEmail, setClaimEmail] = useState("");
  const [claimCode, setClaimCode] = useState("");
  const [claimPassword, setClaimPassword] = useState("");
  const [claimPasswordConfirmation, setClaimPasswordConfirmation] = useState("");
  const [claimCodeSent, setClaimCodeSent] = useState(false);
  const initializedAccountIdentity = useRef(null);
  const tokenFromLink = searchParams.get("token");
  const isResetRoute = location.pathname === "/account/reset-password";
  useEffect(() => {
    if (resendCooldown <= 0) return undefined;
    const timer = window.setTimeout(() => setResendCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [resendCooldown]);
  useEffect(() => {
    if (!account) {
      initializedAccountIdentity.current = null;
      return;
    }
    const accountIdentity = `${account.id || ""}:${account.email || ""}`;
    if (initializedAccountIdentity.current === accountIdentity) return;
    initializedAccountIdentity.current = accountIdentity;
    setForm((previous) => ({
      ...previous,
      email: account.email || "",
      displayName: account.displayName || "",
      category: account.category || "Tattoos",
      socialPlatform: account.socialPlatform || "Instagram",
      socialHandle: account.socialHandle || "",
      description: account.description || "",
      bio: account.bio || "",
      socialLinks: Array.isArray(account.socialLinks)
        ? account.socialLinks
        : account.socialPlatform || account.socialHandle
          ? [{ name: account.socialPlatform || "Other", url: account.socialHandle || "" }]
          : [],
      businessName: account.businessName || "",
      businessContactName: account.businessContactName || "",
      businessEmail: account.businessEmail || "",
    }));
  }, [account]);
  useEffect(() => {
    if (!account?.legacyCreatorSlug) return undefined;
    let active = true;
    fetch(`${API_URL}/creators/${encodeURIComponent(account.legacyCreatorSlug)}`)
      .then((response) => {
        if (!response.ok) throw new Error(`Creator profile request failed (${response.status}).`);
        return response.json();
      })
      .then((creator) => {
        if (!active) return;
        setForm((previous) => ({
          ...previous,
          description: previous.description?.trim() || !creator.description
            ? previous.description
            : creator.description,
          bio: previous.bio?.trim() || !creator.bio
            ? previous.bio
            : creator.bio,
          socialLinks: previous.socialLinks?.some((link) => link?.name?.trim() && link?.url?.trim())
            ? previous.socialLinks
            : creator.socialLinks?.length ? creator.socialLinks : previous.socialLinks,
        }));
      })
      .catch((requestError) => {
        console.error("Could not load the existing creator details:", requestError);
        if (active) setError("Your existing profile details could not be loaded. Refresh to try again.");
      });
    return () => { active = false; };
  }, [account?.legacyCreatorSlug]);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState("");
  const [galleryPhotos, setGalleryPhotos] = useState([]);
  const [imageError, setImageError] = useState("");
  const galleryImageIds = account?.galleryImageIds || EMPTY_IMAGE_IDS;
  useEffect(() => {
    let active = true;
    const objectUrls = [];
    const loadLegacyPhoto = async () => {
      setProfilePhotoUrl("");
      if (!account?.legacyCreatorSlug) {
        return;
      }
      try {
        const response = await fetch(`${API_URL}/creators/${encodeURIComponent(account.legacyCreatorSlug)}`);
        if (!response.ok) throw new Error(`Creator profile request failed (${response.status}).`);
        const creator = await response.json();
        if (active) setProfilePhotoUrl(resolveCreatorImageUrl(creator.imageUrl));
      } catch (requestError) {
        console.error("Could not load the existing creator profile:", requestError);
        if (active) setImageError("Your existing profile picture could not be loaded. Refresh to try again.");
      }
    };
    if (account?.claimRequired) {
      setGalleryPhotos([]);
      setImageError("");
      loadLegacyPhoto();
      return () => { active = false; };
    }
    const imageIds = [
      ...(account?.profileImageId ? [account.profileImageId] : []),
      ...galleryImageIds,
    ];
    if (!imageIds.length) {
      setGalleryPhotos([]);
      setImageError("");
      loadLegacyPhoto();
      return () => { active = false; };
    }
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
        if (!account?.profileImageId) loadLegacyPhoto();
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
  }, [account?.claimRequired, account?.profileImageId, galleryImageIds, loadImage]);
  const change = (event) => setForm((previous) => ({
    ...previous,
    [event.target.name]: event.target.value,
  }));
  const changeSocialLink = (index, key, value) => setForm((previous) => ({
    ...previous,
    socialLinks: previous.socialLinks.map((link, linkIndex) => (
      linkIndex === index ? { ...link, [key]: value } : link
    )),
  }));
  const addSocialLink = () => setForm((previous) => (
    previous.socialLinks.length >= 12
      ? previous
      : { ...previous, socialLinks: [...previous.socialLinks, { name: "Instagram", url: "" }] }
  ));
  const removeSocialLink = (index) => setForm((previous) => ({
    ...previous,
    socialLinks: previous.socialLinks.filter((_, linkIndex) => linkIndex !== index),
  }));
  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      let signedInAccount;
      if (mode === "signup") {
        if (!verificationSent) {
          if (form.password !== form.passwordConfirmation) {
            throw new Error("The passwords do not match.");
          }
          await sendSignupVerificationCode(form.email.trim());
          setVerificationSent(true);
          setVerificationCode("");
          setResendCooldown(60);
          setMessage("If this email can be used to create an account, a verification code is on its way.");
          return;
        }
        const signupDetails = { ...form };
        delete signupDetails.passwordConfirmation;
        signedInAccount = await signUp({ account: signupDetails, code: verificationCode.trim() });
        setMessage("Your email is verified. Your account is created and pending staff approval; your profile stays private until approval.");
      } else {
        signedInAccount = await signIn({ identifier: form.email, password: form.password });
        setMessage(signedInAccount.claimRequired ? "" : "Signed in successfully.");
      }
      const next = searchParams.get("next");
      if (!signedInAccount?.claimRequired && next?.startsWith("/") && !next.startsWith("//")) {
        navigate(next === "/apply" || next.startsWith("/apply?") ? "/account" : next, { replace: true });
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };
  const openLocalPreview = async () => {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const preview = await import("./localAccountPreview");
      await signIn({ identifier: preview.email, password: preview.password });
      setMessage("Local preview opened. This sample account is read-only.");
    } catch (requestError) {
      setError(requestError.message || "Could not open the local preview.");
    } finally {
      setBusy(false);
    }
  };

  const sendClaimCode = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await sendClaimVerificationCode(claimEmail.trim());
      setClaimCodeSent(true);
      setResendCooldown(60);
      setMessage("If this email can be used to claim your account, a verification code is on its way.");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };
  const submitClaim = async (event) => {
    event.preventDefault();
    if (claimPassword !== claimPasswordConfirmation) {
      setError("The passwords do not match.");
      return;
    }
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await claimAccount({
        email: claimEmail.trim(),
        code: claimCode.trim(),
        newPassword: claimPassword,
      });
      setMessage("Your account is claimed. Your new email and password are ready to use.");
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
      navigate("/account", { replace: true });
      setMode("login");
      setMessage("Password updated. You can now sign in.");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };
  const saveProfile = async (event) => {
    event.preventDefault();
    const socialLinks = Array.isArray(form.socialLinks) ? form.socialLinks : [];
    const hasSocialLink = socialLinks.some((link) => link?.name?.trim() && link?.url?.trim());
    const missingFields = [
      !account?.profileImageId && "profile picture",
      !form.description.trim() && "description",
      !form.bio.trim() && "bio",
      !hasSocialLink && "at least one social or portfolio link",
    ].filter(Boolean);
    if (missingFields.length) {
      setMessage("");
      setError(`Complete your creator profile before saving. Missing: ${missingFields.join(", ")}.`);
      return;
    }
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const {
        email, displayName, category, description, bio, socialLinks,
        businessName, businessContactName, businessEmail,
      } = form;
      if (socialLinks.some((link) => !link?.name?.trim() || !link?.url?.trim())) {
        throw new Error("Complete both fields for each social link, or remove the blank link.");
      }
      const primarySocial = socialLinks[0] || { name: "Other", url: "" };
      await updateProfile({
        email, displayName, category,
        socialPlatform: primarySocial.name,
        socialHandle: primarySocial.url,
        socialLinks,
        businessName, businessContactName, businessEmail, description, bio,
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
    const oversizedFile = files.find((file) => file.size > 5 * 1024 * 1024);
    if (oversizedFile) {
      setImageError(`${oversizedFile.name} is larger than the 5 MB limit. Choose a smaller image.`);
      return;
    }
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
  const handleSignOut = async () => {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await signOut();
      setMessage("You have signed out.");
    } catch (requestError) {
      setError(requestError.message || "Could not sign out. Please try again.");
    } finally {
      setBusy(false);
    }
  };
  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      "Permanently delete your account, uploaded photos, and linked applications from our active systems? "
      + "Some information may need to be retained where law requires; email copies, backups, caches, and older separately published pages may not be removed immediately.",
    );
    if (!confirmed) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await deleteAccount();
      setMode("login");
      setMessage("Your account and linked active records have been deleted.");
      navigate("/account", { replace: true });
    } catch (requestError) {
      setError(requestError.message || "Could not delete your account. Please contact support.");
    } finally {
      setBusy(false);
    }
  };
  if (loading) {
    return <><Header /><main className="account-page account-section"><div className="account-loading" role="status"><span className="account-loading-mark" aria-hidden="true" />Loading your account…</div></main><Footer /></>;
  }
  return (
    <div>
      <Header />
      <main className={`account-page account-section ${account ? "account-page-dashboard" : ""}`}>
        <div className="account-shell">
          <div className="account-page-intro">
            <p className="account-eyebrow">MEMBER PORTAL</p>
            <h1>{account ? "Your creator account" : isResetRoute ? "Reset your password" : "A home for your creative work"}</h1>
            <p>{account
              ? "Keep your profile up to date, share your work and manage your account."
              : isResetRoute
                ? "Choose a new password to get back into your account."
                : "Sign in or create an account to manage your creator profile."}</p>
          </div>
          <div className={`account-panel ${account ? "account-dashboard" : "account-access-panel"}`}>
          {isResetRoute ? (
            <section className="account-reset-section">
              <h2>Set a new password</h2>
              <p className="account-section-description">Use a new password that you do not use on other sites.</p>
              {tokenFromLink ? (
                <form className="account-form" onSubmit={confirmReset}>
                  <label>New password (at least 12 characters)
                    <input type={showPassword ? "text" : "password"} value={resetPassword} onChange={(event) => setResetPassword(event.target.value)} minLength={12} maxLength={128} autoComplete="new-password" required />
                  </label>
                  <label>Confirm new password
                    <input type={showConfirmation ? "text" : "password"} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} minLength={12} maxLength={128} autoComplete="new-password" required />
                  </label>
                  <div className="account-password-options">
                    <label><input type="checkbox" checked={showPassword && showConfirmation} onChange={(event) => { setShowPassword(event.target.checked); setShowConfirmation(event.target.checked); }} /> Show passwords</label>
                  </div>
                  <button className="button account-primary-action" type="submit" disabled={busy}>{busy ? "Updating…" : "Update password"}</button>
                </form>
              ) : (
                <div className="account-notice account-notice-error" role="alert">
                  <p>This password-reset link is incomplete or invalid. Request a fresh link from the sign-in page.</p>
                  <Link to="/account" className="account-text-link">Return to sign in</Link>
                </div>
              )}
            </section>
          ) : account?.claimRequired ? (
            <section className="account-reset-section">
              <p className="account-eyebrow">CREATOR ACCOUNT CLAIM</p>
              <h2>Make this account yours</h2>
              <p className="account-section-description">
                You signed in with a one-time username. Verify an email address you control and choose a new password to claim this account.
              </p>
              <div className="account-notice account-privacy-notice">
                <span className="account-notice-icon" aria-hidden="true">i</span>
                <p><strong>Temporary sign-in:</strong> {account.loginUsername || account.email || "Provided by Mankind Minds staff"}. Your temporary password stops working when you finish this step.</p>
              </div>
              {!claimCodeSent ? (
                <form className="account-form" onSubmit={sendClaimCode}>
                  <label>Your email address
                    <input
                      type="email"
                      value={claimEmail}
                      onChange={(event) => setClaimEmail(event.target.value)}
                      autoComplete="email"
                      maxLength={254}
                      required
                    />
                  </label>
                  <button className="button account-primary-action" type="submit" disabled={busy}>
                    {busy ? "Sending…" : "Send verification code"}
                  </button>
                  <button className="account-text-button" type="button" disabled={busy} onClick={handleSignOut}>Sign out</button>
                </form>
              ) : (
                <form className="account-form" onSubmit={submitClaim}>
                  <label>Your email address
                    <input type="email" value={claimEmail} readOnly />
                  </label>
                  <label>Six-digit email verification code
                    <input
                      className="account-verification-code"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      pattern="[0-9]{6}"
                      maxLength={6}
                      value={claimCode}
                      onChange={(event) => setClaimCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                      required
                    />
                  </label>
                  <label>Choose a new password (at least 12 characters)
                    <input type="password" value={claimPassword} onChange={(event) => setClaimPassword(event.target.value)} minLength={12} maxLength={72} autoComplete="new-password" required />
                  </label>
                  <label>Confirm your new password
                    <input type="password" value={claimPasswordConfirmation} onChange={(event) => setClaimPasswordConfirmation(event.target.value)} minLength={12} maxLength={72} autoComplete="new-password" required />
                  </label>
                  <button className="button account-primary-action" type="submit" disabled={busy || claimCode.length !== 6}>
                    {busy ? "Claiming account…" : "Verify email & claim account"}
                  </button>
                  <div className="account-verification-actions">
                    <button className="account-text-button" type="button" disabled={busy || resendCooldown > 0} onClick={sendClaimCode}>
                      {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : "Resend code"}
                    </button>
                    <button className="account-text-button" type="button" disabled={busy} onClick={() => { setClaimCodeSent(false); setClaimCode(""); }}>
                      Change email
                    </button>
                  </div>
                </form>
              )}
            </section>
          ) : account ? (
            <>
              <section
                className={`account-status-banner account-status-banner-${accountStatus.toLowerCase()}`}
                aria-label={`Profile status: ${accountStatusLabel}`}
                role="status"
              >
                <div className="account-status-banner-mark" aria-hidden="true" />
                <div>
                  <p className="account-status-banner-label">PROFILE STATUS</p>
                  <h3>{accountStatusLabel}</h3>
                  <p className="account-status-banner-message">{accountStatusMessage}</p>
                </div>
              </section>
              <div className="account-dashboard-heading">
                <div>
                  <p className="account-eyebrow">ACCOUNT OVERVIEW</p>
                  <h2>Edit your profile</h2>
                  <p className="account-dashboard-lede">Keep your creator information clear, current, and ready to share.</p>
                </div>
                {accountStatus === "APPROVED" && (account.creatorSlug || account.legacyCreatorSlug) && (
                  <div className="account-dashboard-meta">
                    <Link className="account-public-profile-link" to={`/creators/${encodeURIComponent(account.creatorSlug || account.legacyCreatorSlug)}`}>View public profile ↗</Link>
                  </div>
                )}
              </div>
              {previewOnly && (
                <div className="account-notice account-preview-notice" role="status">
                  <span className="account-notice-icon" aria-hidden="true">D</span>
                  <div className="account-preview-notice-content">
                    <p><strong>Local preview account.</strong> This sample is read-only; changes and account actions are disabled.</p>
                    {import.meta.env.DEV && (
                      <div className="account-preview-status-toggle" role="group" aria-label="Developer preview profile status">
                        <span>Preview status</span>
                        <button
                          type="button"
                          aria-pressed={previewStatus === "PENDING"}
                          onClick={() => setPreviewStatus("PENDING")}
                        >
                          Under review
                        </button>
                        <button
                          type="button"
                          aria-pressed={previewStatus === "APPROVED"}
                          onClick={() => setPreviewStatus("APPROVED")}
                        >
                          Approved
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
              <form id="account-profile-form" className="account-form account-profile-form" onSubmit={saveProfile}>
                <div className="account-edit-introduction">
                  <p className="account-eyebrow">YOUR DETAILS</p>
                  <p>These details shape how people understand your work and how staff can review your profile.</p>
                </div>
                <fieldset className="account-preview-fieldset" disabled={previewOnly}>
                  <div className="account-profile-fields">
                    <ProfileFields
                      form={form}
                      onChange={change}
                      includeBusiness
                      includeSocials
                      onSocialChange={changeSocialLink}
                      onSocialAdd={addSocialLink}
                      onSocialRemove={removeSocialLink}
                    />
                  </div>
                </fieldset>
              </form>
              <section className="account-media">
                <div className="account-section-heading">
                  <div>
                    <p className="account-eyebrow">MAKE IT YOURS</p>
                    <h2>Your photos</h2>
                  </div>
                  <p>JPEG, PNG or WebP · up to 5 MB each</p>
                </div>
                <p className="account-section-description">A clear profile image and a few examples of your work help visitors get to know you.</p>
                <div className="account-photo-tools">
                  <div className="account-profile-photo">
                    {profilePhotoUrl ? <img src={profilePhotoUrl} alt="Your profile" /> : <span className="account-photo-placeholder" aria-hidden="true">{form.displayName?.trim()?.charAt(0)?.toUpperCase() || "＋"}</span>}
                  </div>
                  <div className="account-photo-actions">
                    <label className="account-upload-label">
                      <span className="account-upload-title">Profile picture <span className="required" aria-hidden="true">*</span></span>
                      <span className="account-upload-hint">Choose an image that represents you.</span>
                      <input type="file" accept="image/jpeg,image/png,image/webp" aria-required="true" disabled={busy || previewOnly} onChange={(event) => uploadPhotos(event, "profile")} />
                    </label>
                  </div>
                </div>
                <div className="account-gallery-heading">
                  <div>
                    <h3>Portfolio gallery</h3>
                    <p>{Math.max(0, 8 - galleryImageIds.length)} of 8 photo slots available</p>
                  </div>
                  <label className={`button account-upload-button ${busy || previewOnly || galleryPhotos.length >= 8 ? "is-disabled" : ""}`}>
                    Add photos
                    <input type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={busy || previewOnly || galleryPhotos.length >= 8} onChange={(event) => uploadPhotos(event, "gallery")} />
                  </label>
                </div>
                {galleryPhotos.length > 0 && (
                  <div className="account-gallery">
                    {galleryPhotos.map((photo) => (
                      <div className="account-gallery-item" key={photo.id}>
                        {photo.url ? <img src={photo.url} alt={`${form.displayName || "Your"} portfolio work`} /> : <div className="account-gallery-image-error">Photo unavailable</div>}
                        <button className="account-remove-photo" type="button" disabled={busy || previewOnly} onClick={() => removePhoto(photo.id)}>Remove photo</button>
                      </div>
                    ))}
                  </div>
                )}
                {galleryPhotos.length === 0 && <p className="account-gallery-empty">Your portfolio photos will appear here. Add up to eight examples of your work.</p>}
                {imageError && <p className="account-error" role="alert">{imageError}</p>}
              </section>
              <button
                className="button account-primary-action account-save-profile"
                type="submit"
                form="account-profile-form"
                disabled={busy || previewOnly}
              >
                {previewOnly ? "Preview only" : busy ? "Saving…" : "Save profile"}
              </button>
              <details className="account-advanced-options">
                <summary>
                  <span>
                    <strong>Advanced options</strong>
                    <small>Password, sign-in, and account controls</small>
                  </span>
                  <span className="account-advanced-chevron" aria-hidden="true">+</span>
                </summary>
                <div className="account-advanced-content">
                  <div className="account-advanced-action">
                    <div>
                      <strong>Password reset</strong>
                      <p>Send a secure password-reset link to your account email.</p>
                    </div>
                    <button className="account-secondary-action" type="button" disabled={busy || previewOnly} onClick={requestReset}>
                      Email reset link
                    </button>
                  </div>
                  <div className="account-advanced-action">
                    <div>
                      <strong>Sign out</strong>
                      <p>End your current session on this device.</p>
                    </div>
                    <button className="account-secondary-action" type="button" disabled={busy} onClick={handleSignOut}>
                      Sign out
                    </button>
                  </div>
                  <div className="account-advanced-action account-advanced-danger">
                    <div>
                      <strong>Delete account</strong>
                      <p>Permanently delete your account and active profile data.</p>
                    </div>
                    <button
                      className="account-secondary-action account-delete-action"
                      type="button"
                      disabled={busy || previewOnly}
                      onClick={handleDeleteAccount}
                    >
                      Delete account
                    </button>
                  </div>
                </div>
              </details>
            </>
          ) : (
            <>
              <h2>{mode === "signup" ? "Create your account" : "Sign in"}</h2>
              <p>{mode === "signup"
                ? "Create a private profile. It stays hidden from the public until staff review and approve it."
                : "Welcome back. Sign in to update your creator profile."}</p>
              <div className="account-mode-tabs" role="group" aria-label="Account access">
                  <button type="button" aria-pressed={mode === "login"} className={mode === "login" ? "active" : ""} onClick={() => { setMode("login"); setVerificationSent(false); setError(""); setMessage(""); }}>Sign in</button>
                  <button type="button" aria-pressed={mode === "signup"} className={mode === "signup" ? "active" : ""} onClick={() => { setMode("signup"); setVerificationSent(false); setError(""); setMessage(""); }}>Create account</button>
              </div>
                {mode === "signup" && verificationSent ? (
                  <form className="account-form account-verification-form" onSubmit={submit}>
                    <div className="account-verification-heading">
                      <span className="account-verification-icon" aria-hidden="true">✉</span>
                      <div>
                        <p className="account-eyebrow">EMAIL CHECK</p>
                        <h3>Verify your email</h3>
                        <p>Enter the six-digit code sent to <strong>{form.email}</strong>. It expires in 10 minutes.</p>
                      </div>
                    </div>
                    <label>Verification code
                      <input
                        className="account-verification-code"
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        pattern="[0-9]{6}"
                        maxLength={6}
                        value={verificationCode}
                        onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                        placeholder="000000"
                        aria-label="Six-digit email verification code"
                        required
                      />
                    </label>
                    <button className="button account-primary-action" type="submit" disabled={busy || verificationCode.length !== 6}>
                      {busy ? "Verifying…" : "Verify email & create account"}
                    </button>
                    <div className="account-verification-actions">
                      <button
                        className="account-text-button"
                        type="button"
                        disabled={busy || resendCooldown > 0}
                        onClick={async () => {
                          setBusy(true);
                          setError("");
                          setMessage("");
                          try {
                            await sendSignupVerificationCode(form.email.trim());
                            setResendCooldown(60);
                            setMessage("If this email can be used to create an account, a new verification code is on its way.");
                          } catch (requestError) {
                            setError(requestError.message);
                          } finally {
                            setBusy(false);
                          }
                        }}
                      >
                        {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : "Resend code"}
                      </button>
                      <button className="account-text-button" type="button" disabled={busy} onClick={() => { setVerificationSent(false); setVerificationCode(""); setError(""); setMessage(""); }}>
                        Change details or email
                      </button>
                    </div>
                  </form>
                ) : (
                <form className="account-form" onSubmit={submit}>
                {mode === "signup" && (
                  <>
                    <div className="account-form-section-label">
                      <span>01</span>
                      <div><strong>Your creator profile</strong><small>Start with the details people will see after approval.</small></div>
                    </div>
                    <div className="account-profile-fields account-signup-fields">
                      <ProfileFields
                        form={form}
                        onChange={change}
                        includeBusiness={false}
                        includeDescription={false}
                        includeBio={false}
                      />
                    </div>
                    <div className="account-form-section-label">
                      <span>02</span>
                      <div><strong>Sign-in details</strong><small>Use an email address you can access.</small></div>
                    </div>
                  </>
                )}
                <div className="account-auth-fields">
                  <label>{mode === "signup" ? "Email address" : "Email address or temporary username"}
                    <input type={mode === "signup" ? "email" : "text"} name="email" value={form.email} onChange={change} autoComplete={mode === "signup" ? "email" : "username"} maxLength={254} required />
                  </label>
                  <label>Password{mode === "signup" ? " (at least 12 characters)" : ""}
                    <input type={showPassword ? "text" : "password"} name="password" value={form.password} onChange={change} minLength={mode === "signup" ? 12 : undefined} maxLength={72} autoComplete={mode === "signup" ? "new-password" : "current-password"} required />
                  </label>
                  {mode === "signup" && (
                    <label>Confirm password
                      <input type={showConfirmation ? "text" : "password"} name="passwordConfirmation" value={form.passwordConfirmation} onChange={change} minLength={12} maxLength={72} autoComplete="new-password" required />
                    </label>
                  )}
                </div>
                {mode === "signup" && (
                  <>
                    <label className="account-password-options"><input type="checkbox" checked={showPassword && showConfirmation} onChange={(event) => { setShowPassword(event.target.checked); setShowConfirmation(event.target.checked); }} /> Show passwords while typing</label>
                    <label className="account-terms">
                      <input type="checkbox" checked={form.termsAgreement} onChange={(event) => setForm((previous) => ({ ...previous, termsAgreement: event.target.checked }))} required />
                      <span>I agree to the <Link to="/terms" target="_blank" rel="noreferrer">Terms &amp; Conditions</Link>.</span>
                    </label>
                    <p className="account-privacy-note">Your profile stays private while it is reviewed. Your email is used to manage your account and application.</p>
                  </>
                )}
                <button className="button account-primary-action" type="submit" disabled={busy}>
                  {busy ? "Please wait…" : mode === "signup" ? "Send verification code" : "Sign in"}
                </button>
              </form>
              )}
              {mode === "login" && <button className="account-text-button account-forgot-password" type="button" disabled={busy} onClick={requestReset}>Forgot password?</button>}
              {import.meta.env.DEV && mode === "login" && (
                <div className="account-local-preview-login">
                  <strong>Local design preview</strong>
                  <p>Open a read-only sample account to preview the signed-in page. This does not connect to or modify a real account.</p>
                  <button className="account-secondary-action" type="button" disabled={busy} onClick={openLocalPreview}>
                    Open sample profile
                  </button>
                </div>
              )}
            </>
          )}
          {error && <p className="account-error" role="alert">{error}</p>}
          {message && <p className="account-message" role="status">{message}</p>}
          {!account && !isResetRoute && searchParams.has("next") && (
            <p className="account-apply-note">After signing in, you’ll be returned to where you left off.</p>
          )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
function ProfileFields({
  form,
  onChange,
  includeBusiness,
  includeDescription = true,
  includeBio = true,
  includeSocials = false,
  onSocialChange,
  onSocialAdd,
  onSocialRemove,
}) {
  const identityFields = (
    <>
      <label>Display / creator name <span className="required" aria-hidden="true">*</span>
        <input name="displayName" value={form.displayName} onChange={onChange} maxLength={200} required />
      </label>
      <label>Creator category <span className="required" aria-hidden="true">*</span>
        <select name="category" value={form.category} onChange={onChange} required>
          <option value="" disabled>Select a creator category</option>
          {categories.map((category) => <option key={category} value={category}>{category}</option>)}
        </select>
      </label>
      {(includeBusiness || form.category === "Tattoos") && form.category === "Tattoos" && (
        <div className="account-optional-business">
          <div className="account-optional-business-heading">
            <span>Optional business details</span>
            <small>Only complete these if they apply to you.</small>
          </div>
          <label>Business / studio name (optional)
            <input name="businessName" value={form.businessName} onChange={onChange} maxLength={200} />
          </label>
          <label>Business contact name (optional)
            <input name="businessContactName" value={form.businessContactName} onChange={onChange} maxLength={200} />
          </label>
          <label>Business email (optional)
            <input type="email" name="businessEmail" value={form.businessEmail} onChange={onChange} maxLength={254} />
          </label>
        </div>
      )}
      {includeBusiness && <label>Email address <span className="required" aria-hidden="true">*</span>
        <input type="email" name="email" value={form.email} maxLength={254} readOnly aria-describedby="account-email-verified-help" required />
        <small id="account-email-verified-help" className="account-field-help">Email changes require a verification process. Contact support if you need to update this address.</small>
      </label>}
    </>
  );
  const socialFields = includeSocials ? (
    <div className="account-social-links-field">
      <p className="account-social-links-label">Social and portfolio links <span className="required" aria-hidden="true">*</span></p>
      {(form.socialLinks || []).map((link, index) => (
        <div className="account-social-link-row" key={`social-${index}`}>
          <label>Platform <span className="required" aria-hidden="true">*</span>
            <input
              value={link.name}
              maxLength={100}
              placeholder="Instagram, SoundCloud, website…"
              onChange={(event) => onSocialChange(index, "name", event.target.value)}
              required
            />
          </label>
          <label>Profile link <span className="required" aria-hidden="true">*</span>
            <input
              type="text"
              value={link.url}
              onChange={(event) => onSocialChange(index, "url", event.target.value)}
              maxLength={2048}
              placeholder="https://"
              required
            />
          </label>
          <button className="account-text-button" type="button" onClick={() => onSocialRemove(index)}>
            Remove
          </button>
        </div>
      ))}
      <button
        className="account-text-button"
        type="button"
        disabled={(form.socialLinks || []).length >= 12}
        onClick={onSocialAdd}
      >
        + Add another link
      </button>
    </div>
  ) : (
    <>
      <label>Primary social or portfolio type <span className="required" aria-hidden="true">*</span>
        <select name="socialPlatform" value={form.socialPlatform} onChange={onChange} required>
          {platforms.map((platform) => <option key={platform}>{platform}</option>)}
        </select>
      </label>
      <label>Social profile or portfolio link <span className="required" aria-hidden="true">*</span>
        <input name="socialHandle" value={form.socialHandle} onChange={onChange} maxLength={2048} required />
      </label>
    </>
  );
  const workFields = (
    <>
      {socialFields}
      {includeDescription && (
        <label>Description <span className="required" aria-hidden="true">*</span>
          <textarea
            name="description"
            value={form.description || ""}
            onChange={onChange}
            maxLength={4000}
            rows={4}
            aria-describedby="account-description-help"
            required
          />
          <small id="account-description-help" className="account-field-help">
            Shown on your creator card and at the top of your public page.
          </small>
        </label>
      )}
      {includeBio && (
        <label>Bio <span className="required" aria-hidden="true">*</span>
          <textarea
            name="bio"
            value={form.bio || ""}
            onChange={onChange}
            maxLength={4000}
            rows={5}
            aria-describedby="account-bio-help"
            required
          />
          <small id="account-bio-help" className="account-field-help">
            Shown in the About your work section on your public page.
          </small>
        </label>
      )}
    </>
  );

  if (includeBusiness && includeSocials) {
    return (
      <div className="account-profile-fields-inner account-profile-edit-fields">
        <section className="account-edit-group">
          <div className="account-edit-group-heading">
            <span>01</span>
            <div>
              <h3>Identity and contact</h3>
              <p>Your public name, creative category, and account email.</p>
            </div>
          </div>
          <div className="account-edit-grid">{identityFields}</div>
        </section>
        <section className="account-edit-group">
          <div className="account-edit-group-heading">
            <span>02</span>
            <div>
              <h3>Your creative work</h3>
              <p>Tell visitors what you do and where they can find your work.</p>
            </div>
          </div>
          <div className="account-edit-grid account-edit-work-grid">{workFields}</div>
        </section>
      </div>
    );
  }

  return (
    <div className="account-profile-fields-inner">
      {identityFields}
      {workFields}
    </div>
  );
}
export default AccountPage;
