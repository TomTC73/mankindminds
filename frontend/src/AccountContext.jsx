import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { API_URL } from "./apiConfig";

const AccountContext = createContext(null);
const TOKEN_KEY = "mankindMindsAccountToken";
const LOCAL_PREVIEW_TOKEN = "local-account-preview-only";

export function AccountProvider({ children }) {
  const [token, setToken] = useState(() => sessionStorage.getItem(TOKEN_KEY));
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(Boolean(token));
  const [previewOnly, setPreviewOnly] = useState(
    import.meta.env.DEV && token === LOCAL_PREVIEW_TOKEN,
  );

  const clearSession = useCallback(() => {
    sessionStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setAccount(null);
    setLoading(false);
    setPreviewOnly(false);
  }, []);

  const request = useCallback(async (path, options = {}, sessionToken = token) => {
    if (import.meta.env.DEV && sessionToken === LOCAL_PREVIEW_TOKEN) {
      throw new Error("The local preview account is read-only.");
    }
    const isFormData = options.body instanceof FormData;
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        ...(options.body && !isFormData ? { "Content-Type": "application/json" } : {}),
        ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
        ...options.headers,
      },
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      if (response.status === 401 && sessionToken) clearSession();
      throw new Error(body?.error || "The request failed. Please try again.");
    }
    return response.status === 204 ? null : response.json();
  }, [clearSession, token]);

  useEffect(() => {
    let active = true;
    if (!token) {
      setAccount(null);
      setLoading(false);
      return () => { active = false; };
    }
    if (import.meta.env.DEV && token === LOCAL_PREVIEW_TOKEN) {
      setLoading(true);
      import("./localAccountPreview")
        .then(({ account: previewAccount }) => {
          if (active) {
            setAccount(previewAccount);
            setPreviewOnly(true);
            setLoading(false);
          }
        })
        .catch((error) => {
          console.error("Could not load the local account preview:", error);
          if (active) clearSession();
        });
      return () => { active = false; };
    }
    setLoading(true);
    request("/accounts/me", {}, token)
      .then((result) => { if (active) setAccount(result); })
      .catch(() => { if (active) clearSession(); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [clearSession, request, token]);

  const establishSession = useCallback((result) => {
    sessionStorage.setItem(TOKEN_KEY, result.accessToken);
    setToken(result.accessToken);
    setAccount(result.account);
    setPreviewOnly(false);
    setLoading(false);
  }, []);

  const signIn = useCallback(async (credentials) => {
    if (import.meta.env.DEV) {
      const preview = await import("./localAccountPreview");
      const identifier = credentials.identifier || credentials.email;
      if (identifier === preview.email && credentials.password === preview.password) {
        sessionStorage.setItem(TOKEN_KEY, LOCAL_PREVIEW_TOKEN);
        setToken(LOCAL_PREVIEW_TOKEN);
        setAccount(preview.account);
        setPreviewOnly(true);
        setLoading(false);
        return preview.account;
      }
    }
    const result = await request("/accounts/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    }, null);
    establishSession(result);
    return result.account;
  }, [establishSession, request]);

  const sendSignupVerificationCode = useCallback(async (email) => {
    return request("/accounts/signup/send-code", {
      method: "POST",
      body: JSON.stringify({ email }),
    }, null);
  }, [request]);

  const signUp = useCallback(async (verification) => {
    const result = await request("/accounts/signup/verify", {
      method: "POST",
      body: JSON.stringify(verification),
    }, null);
    establishSession(result);
    return result.account;
  }, [establishSession, request]);

  const sendClaimVerificationCode = useCallback(async (email) => {
    return request("/accounts/claim/send-code", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  }, [request]);

  const claimAccount = useCallback(async (claim) => {
    const result = await request("/accounts/claim", {
      method: "POST",
      body: JSON.stringify(claim),
    });
    setAccount(result.account);
    return result.account;
  }, [request]);

  const signOut = useCallback(async () => {
    if (previewOnly) {
      clearSession();
      return;
    }
    try {
      await request("/accounts/logout", { method: "POST" });
    } finally {
      clearSession();
    }
  }, [clearSession, previewOnly, request]);

  const updateProfile = useCallback(async (profile) => {
    const updated = await request("/accounts/me", {
      method: "PUT",
      body: JSON.stringify(profile),
    });
    setAccount(updated);
    return updated;
  }, [request]);

  const deleteAccount = useCallback(async () => {
    await request("/accounts/me", { method: "DELETE" });
    clearSession();
  }, [clearSession, request]);

  const uploadImage = useCallback(async (file, kind) => {
    const body = new FormData();
    body.append("file", file);
    body.append("kind", kind);
    const updated = await request("/accounts/me/images", { method: "POST", body });
    setAccount(updated);
    return updated;
  }, [request]);

  const deleteImage = useCallback(async (imageId) => {
    const updated = await request(`/accounts/me/images/${encodeURIComponent(imageId)}`, {
      method: "DELETE",
    });
    setAccount(updated);
    return updated;
  }, [request]);

  const loadImage = useCallback(async (imageId) => {
    const response = await fetch(`${API_URL}/accounts/me/images/${encodeURIComponent(imageId)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      if (response.status === 401) clearSession();
      throw new Error("Could not load this photo.");
    }
    return URL.createObjectURL(await response.blob());
  }, [clearSession, token]);

  const value = useMemo(() => ({
    account, token, loading, previewOnly, request, signIn, signUp, sendSignupVerificationCode,
    sendClaimVerificationCode, claimAccount, signOut, updateProfile,
    deleteAccount, uploadImage, deleteImage, loadImage,
  }), [account, loading, previewOnly, request, signIn, signUp, sendSignupVerificationCode,
    sendClaimVerificationCode, claimAccount, signOut, token, updateProfile, deleteAccount,
    uploadImage, deleteImage, loadImage]);

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}

export function useAccount() {
  const value = useContext(AccountContext);
  if (!value) throw new Error("useAccount must be used inside AccountProvider.");
  return value;
}
