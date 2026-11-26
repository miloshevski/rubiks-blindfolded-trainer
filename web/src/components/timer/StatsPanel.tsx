import { memo } from 'react';
import { cn } from '../../lib/cn';
import { computeStats, formatTime, type Solve } from '../../lib/timer';
import type { CubeData } from '../../lib/types';
import { Net } from '../cube/Net';
import { Zoomable } from '../ui/Zoomable';

const show = (v: number | 'DNF' | null, prefix = '') => (v == null ? '–' : v === 'DNF' ? 'DNF' : prefix + formatTime(v));

function Tile({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex min-w-0 flex-col gap-1 rounded border border-rule bg-raise px-3 py-2.5 max-md:gap-0.5 max-md:px-2 max-md:py-1.5 max-md:[@media(max-height:700px)]:py-1">
      <span className="text-[11px] font-medium tracking-[.08em] text-ink-3 uppercase max-md:text-[10px]">{label}</span>
      <span className={cn('font-mono text-[18px] font-medium whitespace-nowrap max-md:text-[15px] max-md:[@media(max-height:700px)]:text-[14px]',
        value === '–' ? 'text-ink-3' : value === 'DNF' ? 'text-bad' : accent ? 'text-accent' : 'text-ink')}>{value}</span>
    </div>
  );
}

const SIDE = 'grid w-full max-w-[380px] grid-cols-2 gap-2.5 max-md:max-w-none max-md:gap-1.5';

/** Bottom bar of the Timer: statistics left, the scrambled cube's net in the middle (click to enlarge), averages right. */
export const StatsPanel = memo(function StatsPanel({ solves, cube }: { solves: readonly Solve[]; cube: CubeData | null }) {
  const s = computeStats(solves);
  return (
    <section aria-label="Statistics"
             className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-6 border-t border-rule px-6 py-[18px] [grid-area:bar]
                        max-md:grid-cols-2 max-md:[grid-template-areas:'net_net'_'l_r'] max-md:gap-2.5 max-md:px-3 max-md:pt-2.5 max-md:pb-[calc(10px+env(safe-area-inset-bottom))]">
      <div className={cn(SIDE, 'justify-self-start max-md:[grid-area:l]')}>
        <Tile label="Deviation" value={show(s.deviation, '±')} />
        <Tile label="Mean" value={show(s.mean)} />
        <Tile label="Best" value={show(s.best)} accent />
        <Tile label="Count" value={String(s.count)} />
      </div>
      {cube ? (
        <Zoomable label="cube net" tapAnywhere className="rounded-md border border-rule bg-sunk p-2.5 transition-colors duration-[120ms] hover:border-edge-2 max-md:[grid-area:net] max-md:justify-self-center max-md:p-1.5"
                  enlarged={<Net view={cube} letterMode="off" absoluteLetters={null} />}>
          <Net view={cube} letterMode="off" absoluteLetters={null} compact />
        </Zoomable>
      ) : <div className="size-[100px] max-md:[grid-area:net]" aria-hidden />}
      <div className={cn(SIDE, 'justify-self-end max-md:[grid-area:r]')}>
        {s.ao.map(a => <Tile key={a.n} label={`Ao${a.n}`} value={show(a.value)} />)}
      </div>
    </section>
  );
});
