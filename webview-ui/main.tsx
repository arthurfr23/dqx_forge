import { createRoot } from "react-dom/client";
import { App } from "./App";
// O esbuild emite dist/webview.css a partir deste import.
import "./styles.css";

const container = document.getElementById("root");
if (container) {
  createRoot(container).render(<App />);
}
