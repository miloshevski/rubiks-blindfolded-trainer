import { lazy, Suspense, useEffect, type ComponentType } from 'react';
import { useLocal } from './lib/local';
import { UpdateNotice } from './components/local/UpdateNotice';
import { LocalStatus } from './components/local/LocalStatus';
import { Header } from './components/header/Header';
import { MODE_PATH, canonicalizeUrl, useMode, useSearch } from './lib/route';
import type { AppMode } from './lib/types';

// Each page is its own chunk, loaded the first time it is visited (the Pairs dictionary alone
// is 576 words).
const PAGES: Record<AppMode, ComponentType> = {
  home: lazy(() => import('./pages/HomePage')),
  learn: lazy(() => import('./pages/LearnPage')),
  practice: lazy(() => import('./pages/PracticePage')),
  timer: lazy(() => import('./pages/TimerPage')),
  stats: lazy(() => import('./pages/StatsPage')),
  settings: lazy(() => import('./pages/SettingsPage')),
  solve: lazy(() => import('./pages/SolvePage')),
  drill: lazy(() => import('./pages/DrillPage')),
  algs: lazy(() => import('./pages/AlgorithmsPage')),
  pairs: lazy(() => import('./pages/PairsPage')),
};

// While a page loads, keep the header so the page switch does not flash away.
const loading = (
  <>
    <Header />
    <p className="m-0 px-5 py-4 text-[12.5px] text-ink-3">Loading…</p>
  </>
);

export function App() {
  const { data } = useLocal();
  const mode = useMode();
  const search = useSearch();
  const Page = PAGES[mode];
  useEffect(() => {
    for (const key of ['cues', 'colorblind', 'motion'])
      document.documentElement.dataset[key] = data.preferences[`appearance.${key}`] ?? 'false';
  }, [data.preferences]);
  useEffect(() => {
    document.title = `${mode === 'home' ? 'Learn blindfold cubing' : mode[0].toUpperCase() + mode.slice(1)} · Blindfold Trainer`;
    const origin = import.meta.env.VITE_PUBLIC_ORIGIN;
    if (origin) {
      const canonical =
        document.querySelector<HTMLLinkElement>('link[rel="canonical"]') ??
        document.head.appendChild(document.createElement('link'));
      canonical.rel = 'canonical';
      canonical.href = new URL(MODE_PATH[mode], origin).toString();
    }
    const description = document.querySelector('meta[name="description"]');
    description?.setAttribute(
      'content',
      `M2 edges and Old Pochmann corners: ${mode}, personal mnemonic dictionaries, and verified blindfold practice.`,
    );
  }, [mode]);
  useEffect(canonicalizeUrl, []);
  return (
    <Suspense fallback={loading}>
      <LocalStatus />
      <UpdateNotice />
      <Page key={mode === 'practice' ? search : mode} />
    </Suspense>
  );
}
