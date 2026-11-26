import { cn } from '../../lib/cn';
import type { SolutionRow } from '../../lib/solution';
import type { MemoCycle } from '../../lib/types';
import { Pill } from '../ui/text';

const LETTERS = 'flex flex-wrap gap-x-3.5 gap-y-1 font-mono text-[22px] leading-[30px] font-medium tracking-[.06em]';

// Each cycle gets its own underline colour (they repeat after four); a flipped edge or twisted
// corner is yellow instead, since it is not a cycle between pieces.
const CYCLE_COLOR = ['border-face-b', 'border-face-f', 'border-face-l', 'border-face-r'];

/** Per letter: its cycle's colour classes. */
function letterColors(cycles: MemoCycle[]): string[] {
  const out: string[] = [];
  let n = 0;
  for (const c of cycles) {
    const cls = c.kind === 'flip' ? 'border-accent text-accent' : CYCLE_COLOR[n++ % CYCLE_COLOR.length];
    for (let i = 0; i < c.size; i++) out.push(cls);
  }
  return out;
}

/** Memo letters in pairs, each underlined in its cycle's colour; an edge target executed as its opposite is underlined (dotted). */
function MemoLetters({ memo, cycles, rows = [], parity }: { memo: string; cycles: MemoCycle[]; rows?: SolutionRow[]; parity?: boolean }) {
  const letters = memo.replace(/\s+/g, '');
  if (!letters) return <div className={LETTERS}><span className="text-[14px] tracking-normal text-ink-3">solved</span></div>;
  const colors = letterColors(cycles);
  const mark = (k: number) => cn('border-b-2', colors[k]);
  const pairs: number[][] = [];
  for (let i = 0; i < letters.length; i += 2) pairs.push(i + 1 < letters.length ? [i, i + 1] : [i]);
  return (
    <div className={LETTERS}>
      {pairs.map((pair, p) => {
        const last = p === pairs.length - 1 && parity;
        return (
          <span key={p} className={last ? 'inline-flex items-center gap-2' : undefined}>
            {pair.map(k => {
              const exec = rows[k]?.exec;
              return exec ? (
                <span key={k} title={`Executed as ${exec}`}
                      className={cn(mark(k), 'underline decoration-ink-3 decoration-dotted decoration-[1.5px] underline-offset-[6px]')}>
                  {letters[k]}
                </span>
              ) : <span key={k} className={mark(k)}>{letters[k]}</span>;
            })}
            {last ? <Pill>PARITY</Pill> : null}
          </span>
        );
      })}
    </div>
  );
}

/** "3 cycles · flipped: AQ" under a memo row. */
function CycleSummary({ memo, cycles, flip }: { memo: string; cycles: MemoCycle[]; flip: string }) {
  const letters = memo.replace(/\s+/g, '');
  const flips: string[] = [];
  let at = 0;
  for (const c of cycles) {
    if (c.kind === 'flip') flips.push(letters.slice(at, at + c.size));
    at += c.size;
  }
  const count = cycles.length - flips.length;
  if (!count && !flips.length) return null;
  return (
    <p className="mt-1.5 text-[11.5px] text-ink-3">
      {count} {count === 1 ? 'cycle' : 'cycles'}
      {flips.length ? <> · {flip}: <b className="font-mono text-[11.5px] leading-[normal] font-normal text-accent">{flips.join(' ')}</b></> : null}
    </p>
  );
}

/** What the underlines under the memo letters mean. */
function Legend() {
  return (
    <ul className="m-0 mt-3.5 flex list-none flex-wrap gap-x-4 gap-y-1.5 p-0 text-[11.5px] text-ink-3" aria-label="Legend">
      <li className="flex items-center gap-1.5">
        <span aria-hidden className="flex gap-0.5">
          {CYCLE_COLOR.map(c => <i key={c} className={cn('block h-0 w-3 border-b-2', c)} />)}
        </span>
        one colour per cycle
      </li>
      <li className="flex items-center gap-1.5">
        <i aria-hidden className="block h-0 w-3 border-b-2 border-accent" />
        <span className="text-accent">flipped edge / twisted corner</span>
      </li>
      <li className="flex items-center gap-1.5">
        <i aria-hidden className="block h-0 w-3 border-b-[1.5px] border-dotted border-ink-3" />
        executed as opposite
      </li>
    </ul>
  );
}

interface Props {
  edgeMemo: string;
  cornerMemo: string;
  edgeCycles: MemoCycle[];
  cornerCycles: MemoCycle[];
  edgeRows: SolutionRow[];
  hasParity: boolean;
}

export function MemoPanel({ edgeMemo, cornerMemo, edgeCycles, cornerCycles, edgeRows, hasParity }: Props) {
  const subs = edgeRows.filter(r => r.exec);
  return (
    <>
    <div className="grid grid-cols-[56px_minmax(0,1fr)] items-baseline gap-y-3.5">
      <span className="text-[12px] text-ink-3">Edges</span>
      <div>
        <MemoLetters memo={edgeMemo} cycles={edgeCycles} rows={edgeRows} parity={hasParity} />
        <CycleSummary memo={edgeMemo} cycles={edgeCycles} flip="flipped" />
        {subs.length ? (
          <p className="mt-1.5 text-[11.5px] text-ink-3">
            <b className="font-mono text-[11.5px] leading-[normal] font-normal text-ink-2">{subs.map(r => `${r.letter} → ${r.exec}`).join('  ')}</b>
            {'  even position, executed as opposite'}
          </p>
        ) : null}
      </div>
      <span className="text-[12px] text-ink-3">Corners</span>
      <div>
        <MemoLetters memo={cornerMemo} cycles={cornerCycles} />
        <CycleSummary memo={cornerMemo} cycles={cornerCycles} flip="twisted" />
      </div>
    </div>
    <Legend />
    </>
  );
}

export const memoTargets = (edgeMemo: string, cornerMemo: string) =>
  `${edgeMemo.replace(/\s+/g, '').length} + ${cornerMemo.replace(/\s+/g, '').length} targets`;
