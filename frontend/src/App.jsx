import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./Home";
import About from "./About";
import Process from "./Process";
import VerifiedCreators from "./VerifiedCreators";
import SamuelGreenProfile from "./SamuelGreenProfile";
import OliverValentineProfile from "./OliverValentineProfile";
import CreatorApplication from "./CreatorApplication";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/process" element={<Process />} />
        <Route path="/certificates" element={<VerifiedCreators />} />
        <Route path="/creators/samuel-green" element={<SamuelGreenProfile />} />
        <Route
          path="/creators/oliver-valentine"
          element={<OliverValentineProfile />}
        />
        <Route path="/apply" element={<CreatorApplication />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;