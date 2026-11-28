// Page-view counting with GoatCounter: no cookies, no personal data, and nothing is sent to anyone
// else. It stays off until SITE is set, on a browser that asks not to be tracked, and on localhost.

/** Your GoatCounter site code: "bld" for bld.goatcounter.com. Leave empty to switch counting off. */
const SITE = 'miloshevski';

interface GoatCounter { count?: (v: { path: string; title?: string }) => void; no_onload?: boolean }
declare global { interface Window { goatcounter?: GoatCounter } }

const local = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
export const analyticsOn = Boolean(SITE) && !local && navigator.doNotTrack !== '1';

let ready = false;
let waiting: string | null = null;     // a page seen before the script arrived

/** Loads the counter. The pages are counted by trackPage, as the app never reloads between them. */
export function startAnalytics() {
  if (!analyticsOn) return;
  window.goatcounter = { no_onload: true };
  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://gc.zgo.at/count.js';
  script.dataset.goatcounter = `https://${SITE}.goatcounter.com/count`;
  script.onload = () => { ready = true; if (waiting) { trackPage(waiting); waiting = null; } };
  document.head.append(script);
}

/** Counts one page view; the path only, never the query (a scramble stays private). */
export function trackPage(path: string) {
  if (!analyticsOn) return;
  if (!ready) { waiting = path; return; }
  window.goatcounter?.count?.({ path, title: document.title });
}
