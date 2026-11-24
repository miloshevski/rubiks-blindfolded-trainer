import { useState } from 'react';
import { parseSolution } from '../../lib/solution';
import type { CubeData } from '../../lib/types';
import { Net } from '../cube/Net';
import { IconButton } from '../ui/IconButton';
import { IconHint, IconReset } from '../ui/icons';
import { ALG, Badge, Bar, Meta, tokenClass } from '../ui/text';

interface Props {
  cube: CubeData | null;
  error: string | null;
  /** Drawing a new scramble is only allowed between solves. */
  canRescramble: boolean;
  onRescramble: () => void;
}

/** Left pane of the Timer: the scramble, its unfolded cube, and the solution behind the hint button. */
export function ScramblePanel({ cube, error, canRescramble, onRescramble }: Props) {
  const [hint, setHint] = useState(false);
  const sections = cube && hint ? parseSolution(cube.solution) : [];

  return (
    <section className="flex min-h-0 min-w-0 flex-col [grid-area:scramble]">
      <Bar title="Scramble" meta={cube && <Meta>{cube.scramble.split(' ').length} moves</Meta>}>
        <IconButton label="New scramble" title="New scramble" disabled={!canRescramble} onClick={onRescramble}
                    className="disabled:cursor-default disabled:text-disabled">{IconReset}</IconButton>
        <IconButton label={hint ? 'Hide the solution' : 'Hint: show the solution'} title="Hint: show the solution"
                    aria-pressed={hint} onClick={() => setHint(h => !h)}
                    className={hint ? 'border-accent text-accent' : undefined}>{IconHint}</IconButton>
      </Bar>
      <div className="flex min-h-0 flex-[1_1_auto] flex-col gap-5 overflow-auto px-5 py-4 max-md:px-4">
        {error ? <p role="alert" className="m-0 text-[12.5px] text-bad">{error}</p> : (
          <p className="m-0 font-mono text-[16px] leading-[1.7] tracking-[.02em] break-words" aria-live="polite">
            {cube ? cube.scramble : <span className="text-ink-3">Loading…</span>}
          </p>
        )}
        {cube && <Net view={cube} letterMode="off" absoluteLetters={null} />}
        {sections.map(sec => (
          <div key={sec.kind}>
            <Meta className="mb-2 block tracking-[.08em] uppercase">{sec.kind}</Meta>
            {sec.solved ? <Meta>already solved</Meta> : (
              <div className="flex flex-col gap-2">
                {sec.rows.map((row, i) => (
                  <div key={i} className="flex gap-3">
                    <Badge tone={row.kind === 'parity' ? 'accent' : 'plain'} small={row.kind === 'parity'}>{row.letter}</Badge>
                    <div className={ALG}>
                      {row.moves.map((mv, j) => <span key={j} className={tokenClass(mv.role)}>{mv.m}</span>)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
