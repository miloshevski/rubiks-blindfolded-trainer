import type { ReactNode } from 'react';
import { navigate, useMode } from '../../lib/route';
import type { AppMode, ParityAlg } from '../../lib/types';
import { BrandMark } from '../ui/icons';
import { Segmented, type SegOption } from '../ui/Segmented';

const MODES: readonly SegOption<AppMode>[] = [
  { value: 'home', label: 'Home' }, { value: 'learn', label: 'Learn' }, { value: 'practice', label: 'Practice' },
  { value: 'solve', label: 'Solve' },
  { value: 'algs', label: 'Algorithms' },
  { value: 'pairs', label: 'Pairs' },
  { value: 'timer', label: 'Timer' }, { value: 'stats', label: 'Statistics' }, { value: 'settings', label: 'Settings' },
];

export const PARITY: readonly SegOption<ParityAlg>[] = [
  { value: '1', title: "M2 U' M U2 M U' M' U2 M' U2", label: <><span className="font-mono">1</span> · M2 U' M U2…</> },
  { value: '2', title: "D' L2 D M2 D' L2 D", label: <><span className="font-mono">2</span> · D' L2 D…</> },
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
  return (
    <header className="flex flex-none flex-wrap items-center gap-x-5 gap-y-2.5 border-b border-rule px-5 py-2.5 max-md:px-4 max-md:py-3">
      {brand}
      <Segmented options={MODES} value={mode === 'drill' ? 'practice' : mode} onChange={m => navigate(m)} label="Mode" className="max-w-full flex-wrap" />
      {children}
    </header>
  );
}
