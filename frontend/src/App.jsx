import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./Home";
import VerifiedCreators from "./VerifiedCreators";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/certificates" element={<VerifiedCreators />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;