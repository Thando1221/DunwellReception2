import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initOfflineSyncEngine } from "./lib/offlineSync";
import { registerSW } from "virtual:pwa-register";

// Register service worker for offline website capability
registerSW({ immediate: true });

// Start offline auto-sync background listeners and interval
initOfflineSyncEngine();

createRoot(document.getElementById("root")!).render(<App />);
