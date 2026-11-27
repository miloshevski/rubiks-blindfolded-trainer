import { useEffect, useState } from 'react';

// Chrome and Edge announce that the app can be installed; Safari on iPhone has no such event.
interface InstallPrompt extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let saved: InstallPrompt | null = null;        // the event can arrive before the page that wants it is open
addEventListener('beforeinstallprompt', e => { e.preventDefault(); saved = e as InstallPrompt; });

const standalone = () => matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true;
const onIphone = () => /iPhone|iPad|iPod/.test(navigator.userAgent) && !('MSStream' in window);

/** Whether to offer installing the app, and how: a button (`install`) or, on iPhone, a hint. */
export function useInstall() {
  const [prompt, setPrompt] = useState<InstallPrompt | null>(saved);
  const [installed, setInstalled] = useState(standalone);
  useEffect(() => {
    const onPrompt = (e: Event) => { e.preventDefault(); saved = e as InstallPrompt; setPrompt(saved); };
    const onInstalled = () => { saved = null; setPrompt(null); setInstalled(true); };
    addEventListener('beforeinstallprompt', onPrompt);
    addEventListener('appinstalled', onInstalled);
    return () => { removeEventListener('beforeinstallprompt', onPrompt); removeEventListener('appinstalled', onInstalled); };
  }, []);
  const install = async () => {
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') setInstalled(true);
    saved = null;
    setPrompt(null);
  };
  return { canInstall: !installed && !!prompt, iphoneHint: !installed && !prompt && onIphone(), install };
}
