import { useRef, useState, type PointerEvent } from 'react';
import { cn } from '../../lib/cn';
import { PHASE_NAME, phaseRuns, type Segment } from '../../lib/solution';

interface Props {
  segments: Segment[];
  pos: number;
  total: number;
  current: Segment | undefined;
  /** Scrub to position p (pointer down / drag). */
  onScrub: ((p: number) => void) | null;
}

interface Tip { seg: Segment; left: number }

/** Solve timeline: one block per target; hover shows the target, click or drag scrubs. */
export function Timeline({ segments, pos, total, current, onScrub }: Props) {
  const tape = useRef<HTMLDivElement>(null);
  const scrubbing = useRef(false);
  const [tip, setTip] = useState<Tip | null>(null);

  const posAt = (x: number) => {
    const r = tape.current!.getBoundingClientRect();
    return Math.round(Math.max(0, Math.min(1, (x - r.left) / r.width)) * total);
  };
  const down = (e: PointerEvent<HTMLDivElement>) => {
    if (!onScrub) return;
    scrubbing.current = true;
    tape.current!.setPointerCapture(e.pointerId);
    onScrub(posAt(e.clientX));
  };
  const move = (e: PointerEvent<HTMLDivElement>) => {
    if (scrubbing.current) onScrub?.(posAt(e.clientX));
    const block = (e.target as Element).closest<HTMLElement>('[data-seg]');
    const seg = block ? segments[Number(block.dataset.seg)] : undefined;
    if (!block || !seg) { setTip(null); return; }
    const r = tape.current!.getBoundingClientRect(), b = block.getBoundingClientRect();
    setTip({ seg, left: Math.max(60, Math.min(r.width - 60, b.left - r.left + b.width / 2)) });
  };
  const end = () => { scrubbing.current = false; };

  return (
    <div className="relative">
      <div ref={tape} className="flex cursor-pointer touch-none items-end gap-0.5 pb-0.5" aria-label="Solve timeline"
           onPointerDown={down} onPointerMove={move} onPointerUp={end} onPointerCancel={end} onPointerLeave={() => setTip(null)}>
        {segments.map((s, i) => {
          const cur = s === current, done = s.end < pos || (s.end === pos && !cur), len = s.end - s.start;
          return (
            <div key={i} data-seg={i} className="group flex min-w-0 flex-[1_1_0] flex-col gap-[5px]" style={{ flexGrow: len }}>
              <span className={cn('overflow-hidden text-center font-mono text-[10.5px] leading-3 whitespace-nowrap', cur ? 'text-ink' : 'text-ink-3')}>
                {len >= 3 ? s.letter : ''}
              </span>
              <i className={cn('block rounded-[1px] transition-colors duration-[120ms]',
                cur ? 'h-2 bg-ink' : 'h-1.5', !cur && (done ? 'bg-played' : s.phase === 'parity' ? 'bg-tape-parity' : 'bg-line'),
                done ? 'group-hover:bg-played-hover' : 'group-hover:bg-disabled')} />
            </div>
          );
        })}
      </div>
      <div className="pointer-events-none absolute top-3.5 bottom-[18px] -ml-px w-0.5 rounded-[1px] bg-accent"
           style={{ left: total ? `${(pos / total) * 100}%` : '0' }} />
      {tip ? (
        <div className="pointer-events-none absolute -top-[26px] -translate-x-1/2 rounded-[3px] bg-ink px-2 py-0.5 font-mono text-[11px] leading-[normal] whitespace-nowrap text-bg"
             style={{ left: tip.left }}>
          <b className="font-semibold">{tip.seg.phase === 'parity' ? 'Parity' : tip.seg.letter}</b>
          {` · ${tip.seg.end - tip.seg.start} moves · ${tip.seg.start + 1}–${tip.seg.end}`}
        </div>
      ) : null}
      <div className="mt-2 flex gap-0.5">
        {phaseRuns(segments).map((run, i) => (
          <div key={i} title={`${PHASE_NAME[run.phase]} · ${run.moves} moves`} style={{ flexGrow: run.moves }}
               className="min-w-0 flex-[1_1_0] overflow-hidden border-t border-line-3 pt-1 font-mono text-[10.5px] leading-[normal] whitespace-nowrap text-ink-3">
            {run.phase === 'parity' ? 'P' : `${PHASE_NAME[run.phase]} ${run.moves}`}
          </div>
        ))}
      </div>
    </div>
  );
}
