import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";

// Register service worker for PWA (non-blocking, won't cause white screen)
try {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      // Use relative path so it works on any base URL (e.g., GitHub Pages subdirectory)
      const swPath = new URL('./sw.js', window.location.href).href;
      navigator.serviceWorker.register(swPath, { scope: './' })
        .then((registration) => {
          console.log('SW registered:', registration.scope);
          
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('New content available, refresh to update');
                }
              });
            }
          });
        })
        .catch((error) => {
          console.log('SW registration failed (non-critical):', error);
        });
    });
  }
} catch (e) {
  console.log('SW setup skipped:', e);
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
