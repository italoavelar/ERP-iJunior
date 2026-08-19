import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "./App.js";
import "./styles/tokens.css";

const savedTheme = window.localStorage.getItem("ijunior_theme");
document.documentElement.classList.add(savedTheme === "light" ? "light" : "dark");

const rootElement = document.getElementById("root");

if (rootElement === null) {
  throw new Error("Web application root element was not found.");
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
