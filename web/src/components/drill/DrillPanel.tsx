import type { Drill } from '../../hooks/useDrill';
import { cn } from '../../lib/cn';
import { FACE_COLOR } from '../../lib/cube';
import { DRILL_LETTERS, type StickerSet } from '../../lib/drill';
import type { Face } from '../../lib/types';
import { Button } from '../ui/Button';
import { SEG_BUTTON_BASE, SEG_GROUP, Segmented, type SegOption } from '../ui/Segmented';
import { Bar, Meta, SectionHead } from '../ui/text';

const FACE_ORDER: readonly [Face, string][] = [['U', 'Up'], ['L', 'Left'], ['F', 'Front'], ['R', 'Right'], ['B', 'Back'], ['D', 'Down']];
const SETS: readonly SegOption<StickerSet>[] = [
  { value: 'edges', label: 'Edges' }, { value: 'corners', label: 'Corners' }, { value: 'both', label: 'Both' },
];

/** Faces to drill: independent toggles (at least one stays on). */
function FacePicker({ faces, onToggle }: { faces: Face[]; onToggle: (face: Face) => void }) {
  return (
    <div className={SEG_GROUP} role="group" aria-label="Faces to drill">
      {FACE_ORDER.map(([face, name]) => {
        const on = faces.includes(face);
        return (
          <button key={face} type="button" title={name} aria-pressed={on} onClick={() => onToggle(face)}
                  className={cn(SEG_BUTTON_BASE, 'inline-flex items-center gap-[5px] px-2 font-mono')}>
            <i className={cn('size-2 rounded-[2px]', on ? 'opacity-100' : 'opacity-35')} style={{ background: FACE_COLOR[face] }} />
            {face}
          </button>
        );
      })}
    </div>
  );
}

function Stat({ label, value, small }: { label: string; value: string | number; small?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-[11.5px] text-ink-3">{label}</dt>
      <dd className="m-0 font-mono text-[20px] leading-[normal] font-medium">
        {value}{small ? <small className="text-[11px] font-normal text-ink-3">{small}</small> : null}
      </dd>
    </div>
  );
}

/** Letter drill: type the letter of the blinking sticker. */
export function DrillPanel({ drill }: { drill: Drill }) {
  const { round, stats, history } = drill;
  const target = round?.target;
  const typed = round?.typed ?? null;
  const ok = typed !== null && typed === target?.letter;
  const verdict = typed === null ? null : ok ? 'ok' : 'bad';

  return (
    <section className="flex min-w-0 flex-col [grid-area:drill]" aria-label="Letter drill">
      <Bar title="Letter drill" meta={<Meta>type the letter of the blinking sticker</Meta>} rightClassName="flex-wrap">
        <FacePicker faces={drill.faces} onToggle={drill.toggleFace} />
        <Segmented options={SETS} value={drill.set} onChange={drill.chooseSet} label="Stickers to drill" />
      </Bar>
      <div className="flex flex-col gap-6 overflow-auto px-5 py-6 max-md:p-4">
        <div className="flex items-center gap-5">
          <div aria-hidden="true"
               className={cn('flex size-24 flex-none items-center justify-center rounded-md border font-mono text-[52px] leading-none font-medium',
                 verdict === 'ok' ? 'border-ok text-ok' : verdict === 'bad' ? 'border-bad-edge text-bad' : 'border-edge text-ink-3')}>
            {typed === null ? '?' : target?.letter}
          </div>
          <div>
            <Meta>{target ? `${target.kind === 'edge' ? 'Edge' : 'Corner'} sticker · ${target.face} face` : ''}</Meta>
            <p className="mt-0.5 mb-1.5 text-[15px] font-medium">Which letter is blinking?</p>
            <p aria-live="assertive"
               className={cn('m-0 min-h-[1.45em] font-mono text-[12.5px] leading-[normal]', verdict === 'ok' ? 'text-ok' : verdict === 'bad' ? 'text-bad' : 'text-ink-2')}>
              {verdict === 'ok' ? 'Correct' : verdict === 'bad' ? `Wrong: you typed ${typed}, it is ${target?.letter}` : ''}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-6 gap-1.5" aria-label="Answer letters">
          {DRILL_LETTERS.map(l => {
            const mark = typed === null ? null : l === target?.letter ? 'ok' : l === typed ? 'bad' : null;
            return (
              <button key={l} type="button" aria-label={`Answer ${l}`} onClick={() => drill.answer(l)}
                      className={cn('h-10 cursor-pointer rounded border bg-raise font-mono text-[15px] leading-[normal] font-medium transition-[background-color,border-color] duration-[120ms] hover:bg-raise-2 max-md:h-11',
                        mark === 'ok' ? 'border-ok text-ok' : mark === 'bad' ? 'border-bad-edge text-bad' : 'border-edge text-ink hover:border-edge-2')}>
                {l}
              </button>
            );
          })}
        </div>
        <dl className="m-0 grid grid-cols-4 gap-3 border-t border-rule pt-[18px] max-md:grid-cols-2">
          <Stat label="Correct" value={stats.ok} small={` / ${stats.n}`} />
          <Stat label="Accuracy" value={stats.n ? `${Math.round((stats.ok / stats.n) * 100)}%` : '–'} />
          <Stat label="Streak" value={stats.streak} small={` best ${stats.best}`} />
          <Stat label="Avg time" value={stats.n ? `${(stats.ms / stats.n / 1000).toFixed(1)}s` : '–'} />
        </dl>
        <div>
          <SectionHead title="Recent" meta="newest first" level={3} />
          <div className="flex min-h-6 flex-wrap gap-1">
            {history.map((h, i) => (
              <span key={history.length - i} title={h.ok ? `${h.letter}: correct` : `${h.letter}: you typed ${h.typed}`}
                    className={cn('inline-flex h-6 min-w-6 items-center justify-center rounded-[3px] border px-1 font-mono text-[12px] leading-[normal] font-semibold',
                      h.ok ? 'border-line-dim text-ok' : 'border-bad-edge text-bad')}>
                {h.letter}
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between gap-2.5">
          <Meta>Type A–X · space or ↵ skips the wait after a miss</Meta>
          <Button size="sm" onClick={drill.resetStats}>Reset stats</Button>
        </div>
      </div>
    </section>
  );
}
