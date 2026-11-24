import { memo } from 'react';
import { cn } from '../../lib/cn';
import { computeStats, formatSolve, formatTime, type Solve } from '../../lib/timer';
import { Bar, Meta } from '../ui/text';

const RECENT = 8;

const show = (v: number | 'DNF' | null, prefix = '') => (v == null ? '–' : v === 'DNF' ? 'DNF' : prefix + formatTime(v));

function Row({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="flex items-baseline justify-between border-b border-rule-soft py-2.5">
      <dt className="text-ink-2">{label}</dt>
      <dd className={cn('m-0 font-mono text-[14px] font-medium tabular-nums', value === '–' ? 'text-ink-3' : value === 'DNF' ? 'text-bad' : tone)}>{value}</dd>
    </div>
  );
}

/** Right pane of the Timer: the statistics, always visible, and the latest solves. */
export const StatsPanel = memo(function StatsPanel({ solves }: { solves: readonly Solve[] }) {
  const s = computeStats(solves);
  const recent = solves.slice(-RECENT).reverse();
  return (
    <section className="flex min-h-0 min-w-0 flex-col [grid-area:stats]">
      <Bar title="Stats" meta={<Meta>AoN drops best and worst</Meta>} />
      <div className="min-h-0 flex-[1_1_auto] overflow-auto px-5 pb-4 max-md:px-4">
        <dl className="m-0">
          <Row label="Deviation" value={show(s.deviation, '±')} />
          <Row label="Mean" value={show(s.mean)} />
          <Row label="Best" value={show(s.best)} tone="text-accent" />
          <Row label="Count" value={String(s.count)} />
          {s.ao.map(a => <Row key={a.n} label={`Ao${a.n}`} value={show(a.value)} />)}
        </dl>
        <h3 className="mt-5 mb-2 text-[12px] font-semibold">Recent</h3>
        <ol className="m-0 flex list-none flex-col p-0 font-mono text-[12.5px]">
          {recent.map((r, i) => (
            <li key={solves.length - i} className="flex justify-between py-1">
              <span className="text-ink-3">#{solves.length - i}</span>
              <span className={r.penalty === 'dnf' ? 'text-bad' : r.penalty === 'plus2' ? 'text-accent' : undefined}>{formatSolve(r)}</span>
            </li>
          ))}
          {!recent.length && <li className="text-ink-3">No solves yet</li>}
        </ol>
      </div>
    </section>
  );
});
