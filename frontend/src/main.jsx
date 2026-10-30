import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/newsreader/400.css";
import "@fontsource/newsreader/500.css";
import "./index.css";
import "./theme.css";

const redirectPath = sessionStorage.getItem("redirectPath");

if (redirectPath && redirectPath !== "/") {
  sessionStorage.removeItem("redirectPath");
  window.history.replaceState(null, "", redirectPath);
} else {
  sessionStorage.removeItem("redirectPath");
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
