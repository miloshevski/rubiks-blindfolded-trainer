import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './index.css';
import { startAnalytics } from './lib/analytics';

startAnalytics();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Installable and partly offline: see public/sw.js. Only in the built app (the dev server must not cache).
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  addEventListener('load', () => { navigator.serviceWorker.register('/sw.js').catch(() => { /* the app works without it */ }); });
}
