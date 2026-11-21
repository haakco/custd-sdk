import { CustdHostedAppProvider } from "@haakco/custd-react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./styles.css";

const root = document.getElementById("root");
if (!root) throw new Error("index.html needs a #root element");

// No configuration: the provider reads /.well-known/custd.json, which Custd serves on the app's host.
createRoot(root).render(
  <StrictMode>
    <CustdHostedAppProvider>
      <App />
    </CustdHostedAppProvider>
  </StrictMode>,
);
