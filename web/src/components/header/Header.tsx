import type { MouseEvent, ReactNode } from 'react';
import { navigate, useMode } from '../../lib/route';
import type { AppMode, ParityAlg } from '../../lib/types';
import { BrandMark } from '../ui/icons';
import { Segmented, type SegOption } from '../ui/Segmented';

const MODES: readonly SegOption<AppMode>[] = [
  { value: 'tutorial', label: 'Learn', className: 'max-md:hidden' },   // phones reach it from the home page
  { value: 'solve', label: 'Solve' },
  { value: 'drill', label: 'Letter drill' },
  { value: 'algs', label: 'Algorithms' },
  { value: 'pairs', label: 'Pairs' },
  { value: 'timer', label: 'Timer' },
];

export const PARITY: readonly SegOption<ParityAlg>[] = [
  { value: '1', title: "D' L2 D M2 D' L2 D", label: <><span className="font-mono">1</span> · D' L2 D…</> },
  { value: '2', title: "M2 U' M U2 M U' M' U2 M' U2", label: <><span className="font-mono">2</span> · M2 U' M U2…</> },
];

const brand = (
  <div className="flex items-center gap-2.5">
    {BrandMark}
    <b className="text-[13.5px] font-semibold tracking-[-.005em]">Blindfold Trainer</b>
    <span className="rounded-[3px] border border-line px-1.5 py-px font-mono text-[11px] leading-[normal] text-ink-3">M2 / OP</span>
  </div>
);

interface Props {
  /** Page-specific controls, shown after the mode switch (Solve: scramble and parity). */
  children?: ReactNode;
}

/** Command bar: the brand, the page switch, and whatever controls the current page adds. */
export function Header({ children }: Props) {
  const mode = useMode();
  const goHome = (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    navigate('home');
  };
  return (
    <header className="flex flex-none flex-wrap items-center gap-x-5 gap-y-2.5 border-b border-rule px-5 py-2.5 max-md:px-4 max-md:py-3">
      <a href="/" onClick={goHome} aria-label="Blindfold Trainer home"
         className="rounded text-inherit no-underline outline-offset-4 focus-visible:outline-2 focus-visible:outline-accent">{brand}</a>
      <Segmented options={MODES} value={mode} onChange={navigate} label="Mode" />
      {children}
    </header>
  );
}
