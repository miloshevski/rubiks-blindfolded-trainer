import { memo, useEffect, useRef, useState } from 'react';
import type { Source } from '../../hooks/usePlayback';
import { cn } from '../../lib/cn';
import type { SolutionSection } from '../../lib/solution';
import type { ParityAlg } from '../../lib/types';
import { Button } from '../ui/Button';
import { IconBad, IconOk } from '../ui/icons';
import { ALG, Badge, Bar, Meta, Pill, tokenClass, type TokenState } from '../ui/text';
import { tabVisibility, type PhoneTab } from './PhoneTabs';

const LEGEND = (
  <div className="flex flex-none flex-wrap gap-x-4 gap-y-1.5 border-b border-rule-soft px-5 py-2.5 text-[11.5px] text-ink-3 max-md:px-4">
    <span className="inline-flex items-center gap-1.5"><span className="font-mono">R U</span> setup</span>
    <span className="inline-flex items-center gap-1.5"><span className={cn('font-mono', tokenClass('core'))}>M2</span> swap</span>
    <span className="inline-flex items-center gap-1.5"><span className="font-mono text-ink-2">U' R'</span> undo</span>
    <span className="inline-flex items-center gap-1.5"><span className="font-mono">B L</span> played</span>
  </div>
);

interface Props {
  tab: PhoneTab;
  sections: SolutionSection[];
  parityAlg: ParityAlg;
  moveCount: number | null;
  verified: boolean | null;
  solutionText: string;
  pos: number;
  source: Source;
  playing: boolean;
  onJump: (pos: number) => void;
}

/** Right column of Solve mode: the solution, one row per target, following playback. */
export function SolutionSheet({ tab, sections, parityAlg, moveCount, verified, solutionText, pos, source, playing, onJump }: Props) {
  const scroller = useRef<HTMLDivElement>(null);
  const [copyLabel, setCopyLabel] = useState('Copy');

  const copy = async () => {
    if (!solutionText) return;
    try { await navigator.clipboard.writeText(solutionText); setCopyLabel('Copied'); }
    catch { setCopyLabel('Copy failed'); }
    setTimeout(() => setCopyLabel('Copy'), 1200);
  };

  // Keep the current row in view while playing (reference playback only).
  const ref = source === 'ref';
  useEffect(() => {
    const box = scroller.current;
    const row = box?.querySelector<HTMLElement>('[data-current]');
    if (!playing || !box || !row || box.scrollHeight <= box.clientHeight) return;
    const c = row.getBoundingClientRect(), b = box.getBoundingClientRect();
    if (c.top < b.top + 40) box.scrollTop -= b.top + 40 - c.top;
    else if (c.bottom > b.bottom - 40) box.scrollTop += c.bottom - b.bottom + 40;
  }, [pos, playing]);

  let n = 0, start = 0;
  return (
    <section className={cn('flex min-h-0 min-w-0 flex-col [grid-area:sheet]', tabVisibility('solution', tab, 'flex'))}>
      <Bar title="Solution" meta={<Meta>{moveCount == null ? '' : `${moveCount} moves`}</Meta>}>
        {verified == null ? null : (
          <span className={cn('inline-flex items-center gap-1.5 text-[12px]', verified ? 'text-ok' : 'text-bad')}>
            {verified ? IconOk : IconBad}{verified ? 'Verified solved' : 'Does not solve'}
          </span>
        )}
        <Button size="sm" onClick={copy}>{copyLabel}</Button>
      </Bar>
      {LEGEND}
      <div ref={scroller} className="flex-[1_1_auto] overflow-auto pt-1.5 pb-4 max-xl:overflow-visible">
        {sections.map(sec => {
          const moves = sec.rows.reduce((a, r) => a + r.moves.length, 0);
          const [title, sub] = sec.kind === 'edges' ? ['Edges', 'M2'] : sec.kind === 'parity' ? ['Parity', `alg ${parityAlg}`] : ['Corners', 'Old Pochmann'];
          const meta = sec.kind === 'parity' ? `odd edge count · ${moves}` : sec.solved ? 'already solved' : `${sec.rows.length} targets · ${moves}`;
          return [
            <div key={`${sec.kind}-h`} className="flex items-baseline justify-between gap-2.5 px-5 pt-4 pb-1.5 first:pt-3 max-md:px-4">
              <h3 className="m-0 text-[12px] font-semibold">{title} <small className="text-[12px] font-normal text-ink-3">· {sub}</small></h3>
              <Meta>{meta}</Meta>
            </div>,
            sec.solved ? <div key={`${sec.kind}-s`} className="py-[5px] pr-5 pl-[78px] font-mono text-[12.5px] leading-[normal] text-ink-3">Nothing to do</div> : null,
            ...sec.rows.map(r => {
              const s0 = start;
              start += r.moves.length;
              // Index of the move being shown inside this row: -1 before it, moves.length after it.
              const cursor = ref ? Math.max(-1, Math.min(r.moves.length, pos - 1 - s0)) : -1;
              return (
                <SolutionRowButton key={`${sec.kind}-${s0}`} number={++n} parity={sec.kind === 'parity'} letter={r.letter}
                                   exec={r.exec} moves={r.moves} cursor={cursor} start={s0} onJump={onJump} />
              );
            }),
          ];
        })}
      </div>
    </section>
  );
}

interface RowProps {
  number: number;
  parity: boolean;
  letter: string;
  exec: string | null;
  moves: SolutionSection['rows'][number]['moves'];
  cursor: number;
  start: number;
  onJump: (pos: number) => void;
}

// Memoized on a primitive cursor: during playback only the rows around the playhead re-render.
const SolutionRowButton = memo(function SolutionRowButton({ number, parity, letter, exec, moves, cursor, start, onJump }: RowProps) {
  const cur = cursor >= 0 && cursor < moves.length, done = cursor === moves.length;
  const state = (i: number): TokenState => (i === cursor ? 'now' : i < cursor ? 'played' : 'upcoming');
  return (
    <button type="button" title={`Jump to ${parity ? 'parity' : letter}`} onClick={() => onJump(start)} data-current={cur || undefined}
            className={cn(
              'grid w-full cursor-pointer grid-cols-[22px_24px_minmax(0,1fr)_26px] items-baseline gap-x-3 border-0 px-5 py-[5px] text-left',
              'focus-visible:-outline-offset-2 max-md:grid-cols-[24px_minmax(0,1fr)_22px] max-md:px-4',
              cur ? 'bg-row-current shadow-[inset_0_1px_0_#26282b,inset_0_-1px_0_#26282b]' : 'bg-transparent hover:bg-row-hover',
            )}>
      <span className="text-right font-mono text-[10.5px] leading-[normal] text-ink-3 max-md:hidden">{String(number).padStart(2, '0')}</span>
      <Badge small={parity} tone={cur ? 'current' : done ? 'done' : 'plain'}>{parity ? 'PAR' : letter}</Badge>
      <span className={ALG}>
        {moves.map((mv, i) => <span key={i} className={tokenClass(mv.role, state(i))}>{mv.m}</span>)}
        {exec ? <Pill className="ml-2" title={`Even position: executed as ${exec}`}>as {exec}</Pill> : null}
      </span>
      <span className="text-right font-mono text-[10.5px] leading-[normal] text-ink-3">{moves.length}</span>
    </button>
  );
});
