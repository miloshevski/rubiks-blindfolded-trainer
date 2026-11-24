import { translate } from '../../lib/local';
import type { SolutionRow } from '../../lib/solution';
import { Pill } from '../ui/text';

const LETTERS = 'flex flex-wrap gap-x-3.5 gap-y-1 font-mono text-[22px] leading-[30px] font-medium tracking-[.06em]';

/** Memo letters in pairs; an edge target executed as its opposite is underlined (dotted). */
function MemoLetters({ memo, rows = [], parity }: { memo: string; rows?: SolutionRow[]; parity?: boolean }) {
  const letters = memo.replace(/\s+/g, '');
  if (!letters) return <div className={LETTERS}><span className="text-[14px] tracking-normal text-ink-3">solved</span></div>;
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
                      className="underline decoration-ink-3 decoration-dotted decoration-[1.5px] underline-offset-[6px]">
                  {letters[k]}
                </span>
              ) : <span key={k}>{letters[k]}</span>;
            })}
            {last ? <Pill>PARITY</Pill> : null}
          </span>
        );
      })}
    </div>
  );
}

interface Props {
  edgeMemo: string;
  cornerMemo: string;
  edgeRows: SolutionRow[];
  hasParity: boolean;
}

export function MemoPanel({ edgeMemo, cornerMemo, edgeRows, hasParity }: Props) {
  const subs = edgeRows.filter(r => r.exec);
  return (
    <div className="grid grid-cols-[56px_minmax(0,1fr)] items-baseline gap-y-3.5">
      <span className="text-[12px] text-ink-3">Edges</span>
      <div>
        <MemoLetters memo={translate(edgeMemo, 'edges')} rows={edgeRows} parity={hasParity} />
        {subs.length ? (
          <p className="mt-1.5 text-[11.5px] text-ink-3">
            <b className="font-mono text-[11.5px] leading-[normal] font-normal text-ink-2">{subs.map(r => `${r.letter} → ${r.exec}`).join('  ')}</b>
            {'  even position, executed as opposite'}
          </p>
        ) : null}
      </div>
      <span className="text-[12px] text-ink-3">Corners</span>
      <MemoLetters memo={translate(cornerMemo, 'corners')} />
    </div>
  );
}

export const memoTargets = (edgeMemo: string, cornerMemo: string) =>
  `${edgeMemo.replace(/\s+/g, '').length} + ${cornerMemo.replace(/\s+/g, '').length} targets`;
