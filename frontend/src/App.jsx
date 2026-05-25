import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./Home";
import VerifiedCreators from "./VerifiedCreators";
import SamuelGreenProfile from "./SamuelGreenProfile";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/certificates" element={<VerifiedCreators />} />
        <Route path="/creators/samuel-green" element={<SamuelGreenProfile />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;