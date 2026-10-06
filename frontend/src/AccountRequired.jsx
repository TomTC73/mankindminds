import { Navigate, useLocation } from "react-router-dom";
import { useAccount } from "./AccountContext";

function AccountRequired() {
  const { account, loading } = useAccount();
  const location = useLocation();

  if (loading) {
    return <main className="section"><p role="status">Checking your sign-in…</p></main>;
  }

  if (!account) {
    return <Navigate to={`/account?next=${encodeURIComponent(`${location.pathname}${location.search}`)}`} replace />;
  }

  return <Navigate to="/account" replace />;
}

export default AccountRequired;
