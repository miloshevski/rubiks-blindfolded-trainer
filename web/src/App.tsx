import { lazy, Suspense, useEffect, type ComponentType } from 'react';
import { Header } from './components/header/Header';
import { canonicalizeUrl, useMode } from './lib/route';
import type { AppMode } from './lib/types';

// Each page is its own chunk, loaded the first time it is visited (the Pairs dictionary alone
// is 576 words).
const PAGES: Record<AppMode, ComponentType> = {
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
  const Page = PAGES[useMode()];
  useEffect(canonicalizeUrl, []);
  return (
    <Suspense fallback={loading}>
      <Page />
    </Suspense>
  );
}
