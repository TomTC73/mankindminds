import { useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import Home from "./Home";
import MapPage from "./MapPage";
import About from "./About";
import Process from "./Process";
import VerifiedCreators from "./VerifiedCreators";
import CreatorProfile from "./CreatorProfile";
import CreatorApplication from "./CreatorApplication";
import PrivacyPolicy from "./PrivacyPolicy";
import Terms from "./Terms";

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/about" element={<About />} />
        <Route path="/process" element={<Process />} />
        <Route path="/certificates" element={<VerifiedCreators />} />

        {/* Dynamic Route to handle ALL creators */}
        <Route path="/creators/:slug" element={<CreatorProfile />} />

        <Route path="/apply" element={<CreatorApplication />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<Terms />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;