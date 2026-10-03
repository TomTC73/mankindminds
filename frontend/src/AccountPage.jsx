import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import { useAccount } from "./AccountContext";
import { API_URL } from "./apiConfig";
import "./index.css";

const categories = ["Tattoos", "Music", "Writing", "Videos", "Art"];
const platforms = ["Instagram", "TikTok", "YouTube", "Website", "Other"];

function AccountPage() {
  const { account, loading, signIn, signUp, signOut, updateProfile } = useAccount();
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
      businessName: account.businessName || "",
      businessContactName: account.businessContactName || "",
      businessEmail: account.businessEmail || "",
    }));
  }, [account]);

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
        businessName, businessContactName, businessEmail,
      } = form;
      await updateProfile({
        email, displayName, category, socialPlatform, socialHandle,
        businessName, businessContactName, businessEmail,
      });
      setMessage("Your profile has been saved.");
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
