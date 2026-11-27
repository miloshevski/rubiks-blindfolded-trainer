import { lazy, Suspense, useEffect, type ComponentType } from 'react';
import { Header } from './components/header/Header';
import { canonicalizeUrl, PAGE_TITLE, useMode } from './lib/route';
import type { AppMode } from './lib/types';

// Each page is its own chunk, loaded the first time it is visited (the Pairs dictionary alone
// is 576 words).
const PAGES: Record<AppMode, ComponentType> = {
  home: lazy(() => import('./pages/HomePage')),
  tutorial: lazy(() => import('./pages/TutorialPage')),
  solve: lazy(() => import('./pages/SolvePage')),
  drill: lazy(() => import('./pages/DrillPage')),
  algs: lazy(() => import('./pages/AlgorithmsPage')),
  pairs: lazy(() => import('./pages/PairsPage')),
  timer: lazy(() => import('./pages/TimerPage')),
};

// While a page loads, keep the header so the page switch does not flash away.
const loading = (
  <>
    <Header />
    <p className="m-0 px-5 py-4 text-[12.5px] text-ink-3">Loading…</p>
  </>
);

export function App() {
  const mode = useMode();
  const Page = PAGES[mode];
  useEffect(canonicalizeUrl, []);
  useEffect(() => { document.title = PAGE_TITLE[mode]; }, [mode]);
  return (
    <Suspense fallback={loading}>
      <Page />
    </Suspense>
  );
}
