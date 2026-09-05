import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initOfflineSyncEngine } from "./lib/offlineSync";

// Start offline auto-sync background listeners and interval
initOfflineSyncEngine();

createRoot(document.getElementById("root")!).render(<App />);
