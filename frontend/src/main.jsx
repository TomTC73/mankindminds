import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

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
