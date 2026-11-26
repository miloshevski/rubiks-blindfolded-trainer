import { memo } from 'react';
import { cn } from '../../lib/cn';
import { computeStats, formatTime, type Solve } from '../../lib/timer';
import type { CubeData } from '../../lib/types';
import { Net } from '../cube/Net';
import { Zoomable } from '../ui/Zoomable';

const show = (v: number | 'DNF' | null, prefix = '') => (v == null ? '–' : v === 'DNF' ? 'DNF' : prefix + formatTime(v));

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex min-w-0 items-baseline justify-between gap-2 py-1 max-md:py-0.5">
      <dt className="m-0 truncate text-[12px] text-ink-3 max-md:text-[11px]">{label}</dt>
      <dd className={cn('m-0 font-mono text-[16px] font-medium whitespace-nowrap tabular-nums max-md:text-[13px]',
        value === '–' ? 'text-ink-3' : value === 'DNF' ? 'text-bad' : accent ? 'text-accent' : 'text-ink')}>{value}</dd>
    </div>
  );
}

const SIDE = 'm-0 w-full max-w-[300px] min-w-0';

/** Bottom bar of the Timer: statistics left, the scrambled cube's net in the middle (click to enlarge), averages right. */
export const StatsPanel = memo(function StatsPanel({ solves, cube }: { solves: readonly Solve[]; cube: CubeData | null }) {
  const s = computeStats(solves);
  return (
    <section aria-label="Statistics"
             className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-6 border-t border-rule px-6 py-3 [grid-area:bar]
                        max-md:gap-3 max-md:px-3 max-md:py-2 max-md:pb-[calc(8px+env(safe-area-inset-bottom))]">
      <dl className={cn(SIDE, 'justify-self-start')}>
        <Stat label="Deviation" value={show(s.deviation, '±')} />
        <Stat label="Mean" value={show(s.mean)} />
        <Stat label="Best" value={show(s.best)} accent />
        <Stat label="Count" value={String(s.count)} />
      </dl>
      {cube ? (
        <Zoomable label="cube net" tapAnywhere className="rounded-sm"
                  enlarged={<Net view={cube} letterMode="off" absoluteLetters={null} />}>
          <Net view={cube} letterMode="off" absoluteLetters={null} compact />
        </Zoomable>
      ) : <div className="h-[94px] w-[126px] max-md:h-16 max-md:w-[86px]" aria-hidden />}
      <dl className={cn(SIDE, 'justify-self-end')}>
        {s.ao.map(a => <Stat key={a.n} label={`Ao${a.n}`} value={show(a.value)} />)}
      </dl>
    </section>
  );
});
