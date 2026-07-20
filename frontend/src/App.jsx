import { useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import Home from "./Home";
import About from "./About";
import Process from "./Process";
import VerifiedCreators from "./VerifiedCreators";
import SamuelGreenProfile from "./SamuelGreenProfile";
import OliverValentineProfile from "./OliverValentineProfile";
import JosephMelodyProfile from "./JosephMelodyProfile";
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
        <Route path="/about" element={<About />} />
        <Route path="/process" element={<Process />} />
        <Route path="/certificates" element={<VerifiedCreators />} />

        <Route
          path="/creators/samuel-green"
          element={<SamuelGreenProfile />}
        />

        <Route
          path="/creators/oliver-valentine"
          element={<OliverValentineProfile />}
        />

        <Route
          path="/creators/joseph-melody"
          element={<JosephMelodyProfile />}
        />

        <Route path="/apply" element={<CreatorApplication />} />

        <Route
          path="/privacy-policy"
          element={<PrivacyPolicy />}
        />

        <Route
          path="/terms"
          element={<Terms />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;