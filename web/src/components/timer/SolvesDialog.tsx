import { useEffect, useRef } from 'react';
import { formatSolve, type Solve } from '../../lib/timer';
import { Button } from '../ui/Button';
import { Meta } from '../ui/text';

interface Props {
  solves: readonly Solve[];
  onClose: () => void;
}

/** Every saved solve, newest first, with its scramble. Esc, Close or a click outside closes it. */
export function SolvesDialog({ solves, onClose }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { dialog.current?.showModal(); }, []);

  return (
    <dialog ref={dialog} aria-label="All solves" onClose={onClose}
            onClick={e => { if (e.target === e.currentTarget) dialog.current?.close(); }}
            className="m-auto flex max-h-[85vh] w-[min(440px,94vw)] flex-col overflow-hidden rounded-md border border-line bg-bg p-0 text-ink backdrop:bg-black/75">
      <div className="flex flex-none items-center justify-between border-b border-rule px-4 py-3">
        <h2 className="m-0 text-[13px] font-semibold">All solves</h2>
        <Meta>{solves.length} {solves.length === 1 ? 'solve' : 'solves'}</Meta>
      </div>
      <ol className="m-0 min-h-0 flex-[1_1_auto] list-none overflow-auto p-0">
        {solves.map((s, i) => (
          <li key={i} className="border-b border-rule-soft px-4 py-2">
            <div className="flex items-baseline justify-between gap-3 font-mono tabular-nums">
              <span className="text-[11px] text-ink-3">#{i + 1}</span>
              <span className={`text-[15px] font-medium ${s.penalty === 'dnf' ? 'text-bad' : s.penalty === 'plus2' ? 'text-accent' : 'text-ink'}`}>{formatSolve(s)}</span>
            </div>
            {s.scramble ? <p className="m-0 mt-0.5 font-mono text-[11px] leading-[1.5] break-words text-ink-3">{s.scramble}</p> : null}
          </li>
        )).reverse()}
      </ol>
      <div className="flex flex-none justify-center border-t border-rule px-4 py-3">
        <Button onClick={() => dialog.current?.close()}>Close</Button>
      </div>
    </dialog>
  );
}
