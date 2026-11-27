import { scrambleLabel } from '../../lib/paint';
import { useState } from 'react';
import { parseSolution } from '../../lib/solution';
import type { CubeData } from '../../lib/types';
import { Button } from '../ui/Button';
import { IconHint, IconReset, iconStar } from '../ui/icons';
import { ALG, Badge, Meta, tokenClass } from '../ui/text';

interface Props {
  cube: CubeData | null;
  error: string | null;
  /** Drawing a new scramble is only allowed between solves. */
  canRescramble: boolean;
  onRescramble: () => void;
  /** The scramble is saved in the favorites. */
  saved: boolean;
  favoriteCount: number;
  onToggleSaved: () => void;
  onOpenFavorites: () => void;
}

/** Top of the Timer: the scramble centred, New and Hint buttons, and the solution in a card under the hint button. */
export function ScramblePanel({ cube, error, canRescramble, onRescramble, saved, favoriteCount, onToggleSaved, onOpenFavorites }: Props) {
  const [hint, setHint] = useState(false);
  const sections = cube && hint ? parseSolution(cube.solution) : [];
  const targets = sections.reduce((n, s) => n + s.rows.length, 0);

  return (
    <section className="relative z-[3] flex flex-col items-center gap-3.5 px-6 pt-7 pb-2 text-center [grid-area:scramble] max-md:gap-2.5 max-md:px-3 max-md:pt-3.5 max-md:pb-1 max-md:[@media(max-height:700px)]:pt-2.5" aria-label="Scramble">
      {error ? <p role="alert" className="m-0 text-[12.5px] text-bad">{error}</p> : (
        <p className="m-0 max-w-[1000px] font-mono text-[26px] leading-normal font-medium tracking-[.02em] [overflow-wrap:anywhere] [word-spacing:.35em] max-md:text-[clamp(15px,4.6vw,20px)] max-md:leading-[1.55] max-md:[word-spacing:.15em] max-md:[@media(max-height:700px)]:text-[clamp(14px,4.2vw,18px)]"
           aria-live="polite">
          {cube ? scrambleLabel(cube.scramble) : <span className="text-ink-3">Loading…</span>}
        </p>
      )}
      <div className="flex gap-1.5">
        <Button size="sm" disabled={!canRescramble} onClick={onRescramble} title="New scramble" className="max-md:h-9">{IconReset} New</Button>
        <Button size="sm" variant={hint ? 'active' : 'default'} aria-pressed={hint} onClick={() => setHint(h => !h)}
                title="Hint: show the solution" className="max-md:h-9">{IconHint} Hint</Button>
        <Button size="sm" variant={saved ? 'active' : 'default'} aria-pressed={saved} disabled={!cube} onClick={onToggleSaved}
                title={saved ? 'Saved: press to remove' : 'Save this scramble to favorites'} className="max-md:h-9">{iconStar(saved)} {saved ? 'Saved' : 'Save'}</Button>
        <Button size="sm" onClick={onOpenFavorites} title="Open the saved scrambles" className="max-md:h-9">
          Favorites{favoriteCount ? ` ${favoriteCount}` : ''}
        </Button>
      </div>
      {hint && cube ? (
        <div data-no-hold className="absolute top-full left-1/2 max-h-[60vh] w-[min(520px,calc(100%-24px))] -translate-x-1/2 overflow-auto rounded-md border border-edge bg-raise text-left shadow-[0_12px_32px_rgba(0,0,0,.5)]">
          <div className="flex items-center justify-between border-b border-rule px-3 py-2">
            <span className="text-[11px] font-medium tracking-[.08em] text-ink-3 uppercase">Solution</span>
            <Meta>{targets} targets</Meta>
          </div>
          <div className="flex flex-col gap-3 px-3 py-2.5">
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
        </div>
      ) : null}
    </section>
  );
}
