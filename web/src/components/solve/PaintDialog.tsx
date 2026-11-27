import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { oneOf, useStoredState } from '../../hooks/useStoredState';
import { cn } from '../../lib/cn';
import { FACE_COLOR } from '../../lib/cube';
import { blankGrid, colourCounts, gridFromFacelets, paintedScramble, solvedGrid, type Grid } from '../../lib/paint';
import { FACES, type CubeView, type Face } from '../../lib/types';
import { Button } from '../ui/Button';
import { Segmented, type SegOption } from '../ui/Segmented';
import { Meta } from '../ui/text';

// Unfolded cube: U above F, then L F R B across, D below F.
const NET_AREA: Record<Face, string> = { U: '1 / 2', L: '2 / 1', F: '2 / 2', R: '2 / 3', B: '2 / 4', D: '3 / 2' };
const NET_FACES: readonly Face[] = ['U', 'L', 'F', 'R', 'B', 'D'];
// The colours in the order of the number keys: white, green, red, blue, orange, yellow.
const PALETTE: readonly { face: Face; name: string }[] = [
  { face: 'U', name: 'White' }, { face: 'F', name: 'Green' }, { face: 'R', name: 'Red' },
  { face: 'B', name: 'Blue' }, { face: 'L', name: 'Orange' }, { face: 'D', name: 'Yellow' },
];
const NAME = Object.fromEntries(PALETTE.map(p => [p.face, p.name])) as Record<Face, string>;
type Method = 'chooser' | 'palette';
const METHODS: readonly SegOption<Method>[] = [
  { value: 'palette', label: 'Pick a colour', title: 'Pick a colour, then tap or drag over the stickers' },
  { value: 'chooser', label: 'Tap a sticker', title: 'Tap a sticker, then choose its colour from a list of six' },
];
const PICKER = { w: 3 * 52 + 2 * 8 + 20, h: 2 * 52 + 8 + 20 };   // the colour chooser's size in px, for placing it

interface Props {
  /** The cube on screen, to start from. */
  start: CubeView | null;
  /** Solves the painted cube; answers why it cannot, or '' when it worked (the dialog then closes). */
  onSolve: (scramble: string) => Promise<string>;
  onClose: () => void;
}

/** Paint a cube by hand: tap a sticker, tap the colour it has on your cube, then solve it. */
export function PaintDialog({ start, onSolve, onClose }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const net = useRef<HTMLDivElement>(null);
  const [grid, setGrid] = useState<Grid>(blankGrid);
  const [method, setMethod] = useStoredState<Method>('bld.paint2', 'palette', oneOf<Method>('chooser', 'palette'));
  const [colour, setColour] = useState<Face>('U');          // palette method: the colour being painted with
  const painting = useRef(false);
  const [open, setOpen] = useState<{ face: Face; i: number } | null>(null);   // the sticker being painted
  const [spot, setSpot] = useState({ left: 0, top: 0 });
  const [problem, setProblem] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { dialog.current?.showModal(); }, []);
  const close = () => dialog.current?.close();

  const counts = colourCounts(grid);
  const scramble = paintedScramble(grid);
  const missing = FACES.reduce((n, f) => n + grid[f].filter(c => !c).length, 0);

  // The chooser sits next to its sticker (below it, or above when there is no room), inside the net.
  useLayoutEffect(() => {
    if (!open || !net.current) return;
    const cell = net.current.querySelector<HTMLElement>(`[data-face="${open.face}"][data-cell="${open.i}"]`);
    if (!cell) return;
    const box = net.current.getBoundingClientRect(), c = cell.getBoundingClientRect();
    const left = Math.min(Math.max(c.left - box.left + c.width / 2 - PICKER.w / 2, 0), Math.max(0, box.width - PICKER.w));
    const below = c.bottom - box.top + 8;
    setSpot({ left, top: below + PICKER.h <= box.height ? below : Math.max(0, c.top - box.top - PICKER.h - 8) });
  }, [open]);

  const choose = (face: Face) => {
    if (!open) return;
    setProblem('');
    setGrid(g => ({ ...g, [open.face]: g[open.face].map((c, k) => (k === open.i ? face : c)) }));
    setOpen(null);
  };
  const paint = (face: Face, i: number) => {
    if (i === 4) return;                      // centres never move
    setProblem('');
    setGrid(g => (g[face][i] === colour ? g : { ...g, [face]: g[face].map((c, k) => (k === i ? colour : c)) }));
  };
  const cellAt = (e: PointerEvent) => {
    const el = document.elementFromPoint(e.clientX, e.clientY)?.closest<HTMLElement>('[data-cell]');
    return el ? ([el.dataset.face as Face, Number(el.dataset.cell)] as const) : null;
  };
  const pressed = (e: PointerEvent) => {
    if (method !== 'palette') return;
    const cell = cellAt(e);
    if (!cell) return;
    painting.current = true;
    paint(...cell);
  };
  const dragged = (e: PointerEvent) => {
    if (!painting.current) return;
    const cell = cellAt(e);
    if (cell) paint(...cell);
  };
  const released = () => { painting.current = false; };
  const stickerClick = (face: Face, i: number, here: boolean) => {
    if (method === 'palette') paint(face, i);                  // (a drag already painted it; this is for keys and taps)
    else setOpen(here ? null : { face, i });
  };
  const keyDown = (e: KeyboardEvent) => {
    const n = Number(e.key);
    if (n < 1 || n > 6 || e.ctrlKey || e.metaKey || e.altKey) return;
    if (method === 'palette') setColour(PALETTE[n - 1].face);
    else if (open) { e.preventDefault(); choose(PALETTE[n - 1].face); }
  };

  const solve = async () => {
    if (!scramble || busy) return;
    setBusy(true);
    const why = await onSolve(scramble);
    setBusy(false);
    if (why) setProblem(why); else close();
  };
  const fill = (g: Grid) => { setProblem(''); setOpen(null); setGrid(g); };

  return (
    <dialog ref={dialog} aria-label="Paint a cube" onClose={onClose} onKeyDown={keyDown}
            onCancel={e => { if (open) { e.preventDefault(); setOpen(null); } }}
            onClick={e => { if (e.target === e.currentTarget) close(); }}
            className="m-auto flex max-h-[96vh] w-[min(920px,97vw)] flex-col overflow-hidden rounded-md border border-line bg-bg p-0 text-ink backdrop:bg-black/75">
      <div className="flex flex-none items-center justify-between border-b border-rule px-5 py-3.5 max-md:px-4">
        <h2 className="m-0 text-[15px] font-semibold">Paint your cube</h2>
        <Meta className="text-[12px]">{missing ? `${missing} stickers left` : 'all painted'}</Meta>
      </div>

      <div className="flex min-h-0 flex-[1_1_auto] flex-col items-center justify-center gap-4 overflow-hidden px-5 py-4 max-md:px-3 md:flex-row md:gap-8" onClick={() => setOpen(null)}>
        <div className="flex w-full flex-col items-center gap-3 md:order-last md:w-[230px] md:flex-none md:items-stretch" onClick={e => e.stopPropagation()}>
          <p className="m-0 text-center text-[13px] leading-[1.55] text-ink-3 md:text-left">
            Hold your cube with white on top and green in front, then colour every sticker the way yours looks.
          </p>
          <Segmented options={METHODS} value={method} onChange={m => { setMethod(m); setOpen(null); }} label="How to paint" className="self-center md:self-start" />
          <p className="m-0 text-center text-[12.5px] leading-[1.55] text-ink-3 md:text-left">
            {method === 'chooser' ? 'Tap a sticker, then tap the colour it has on your cube.' : 'Pick a colour, then tap or drag over the stickers that have it.'}
          </p>

          {method === 'palette' ? (
            <div className="flex flex-wrap justify-center gap-2 max-[420px]:gap-1.5 md:justify-start" role="radiogroup" aria-label="Colour to paint with">
              {PALETTE.map(({ face, name }, n) => (
                <button key={face} type="button" role="radio" aria-checked={colour === face} aria-label={`${name} (${n + 1})`} title={`${name} (key ${n + 1})`}
                        onClick={() => setColour(face)}
                        className={cn('flex w-[64px] cursor-pointer flex-col items-center gap-1 rounded border bg-transparent p-1.5 text-ink transition-colors duration-[120ms] max-[420px]:w-[46px]',
                          colour === face ? 'border-accent bg-accent-bg' : 'border-line hover:border-edge-2')}>
                  <span className="block h-9 w-full rounded-[3px] border border-black/40 max-[420px]:h-7" style={{ background: FACE_COLOR[face] }} />
                  <span className={cn('font-mono text-[11px] leading-[normal]', counts[face] > 9 ? 'text-bad' : counts[face] === 9 ? 'text-ok' : 'text-ink-3')}>{counts[face]}/9</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap justify-center gap-x-3 gap-y-1.5 font-mono text-[12px] text-ink-3 md:grid md:grid-cols-2 md:justify-start" aria-label="Stickers painted per colour">
              {PALETTE.map(({ face, name }) => (
                <span key={face} className={cn('inline-flex items-center gap-1.5', counts[face] > 9 && 'text-bad', counts[face] === 9 && 'text-ok')}>
                  <span className="size-3 rounded-[2px] border border-black/40" style={{ background: FACE_COLOR[face] }} />{name} {counts[face]}/9
                </span>
              ))}
            </div>
          )}
          <p role="alert" className="m-0 min-h-[3em] text-center font-mono text-[12px] leading-[1.5] text-bad md:text-left">{problem}</p>
        </div>

        <div ref={net} className="relative" onClick={e => e.stopPropagation()}>
          <div className={cn('grid gap-2 [--s:min(48px,calc((100dvh_-_200px)/9),calc((100vw_-_340px)/12))] [grid-template-columns:repeat(4,calc(var(--s)*3+4px))] [grid-template-rows:repeat(3,calc(var(--s)*3+4px))] max-md:gap-1 max-md:[--s:min(27px,calc((100dvh_-_430px)/9),calc((100vw_-_90px)/12))]', method === 'palette' && 'touch-none')}
               onPointerDown={pressed} onPointerMove={dragged} onPointerUp={released} onPointerCancel={released} onPointerLeave={released}
               aria-label="Unfolded cube">
            {NET_FACES.map(face => (
              <div key={face} className="grid gap-0.5 [grid-template-columns:repeat(3,var(--s))] [grid-template-rows:repeat(3,var(--s))]" style={{ gridArea: NET_AREA[face] }}>
                {grid[face].map((c, i) => {
                  const here = open?.face === face && open.i === i;
                  return (
                    <button key={i} type="button" data-face={face} data-cell={i} disabled={i === 4} tabIndex={i === 4 ? -1 : 0}
                            aria-haspopup={method === 'chooser' || undefined} aria-expanded={method === 'chooser' ? here : undefined}
                            aria-label={`${face} sticker ${i + 1}: ${c ? NAME[c] : 'not painted'}`}
                            onClick={() => stickerClick(face, i, here)}
                            className={cn('block rounded-[4px] border p-0 enabled:cursor-pointer enabled:hover:brightness-110',
                              c ? 'border-black/40' : 'border-dashed border-line-2 bg-sunk',
                              here && method === 'chooser' && 'shadow-[0_0_0_2px_var(--color-bg),0_0_0_4px_var(--color-accent)]')}
                            style={c ? { background: FACE_COLOR[c] } : undefined} />
                  );
                })}
              </div>
            ))}
          </div>

          {open && method === 'chooser' ? (
            <div role="menu" aria-label="Colour of this sticker"
                 className="absolute z-10 grid [grid-template-columns:repeat(3,52px)] gap-2 rounded-md border border-edge-2 bg-raise p-2.5 shadow-[0_8px_28px_rgba(0,0,0,.6)]"
                 style={{ left: spot.left, top: spot.top }}>
              {PALETTE.map(({ face, name }, n) => (
                <button key={face} type="button" role="menuitem" title={`${name} (key ${n + 1})`} aria-label={`${name} (${n + 1})`} onClick={() => choose(face)}
                        className="h-[52px] cursor-pointer rounded border border-black/40 p-0 transition-transform duration-[100ms] hover:scale-105 focus-visible:scale-105"
                        style={{ background: FACE_COLOR[face] }} />
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex flex-none flex-wrap items-center justify-between gap-2 border-t border-rule px-5 py-3.5 max-md:px-4">
        <div className="flex gap-2">
          <Button size="sm" onClick={() => fill(blankGrid())}>Clear</Button>
          <Button size="sm" onClick={() => fill(solvedGrid())}>Solved</Button>
          <Button size="sm" disabled={!start} onClick={() => start && fill(gridFromFacelets(start.facelets))}>Current cube</Button>
        </div>
        <div className="flex gap-2">
          <Button onClick={close}>Cancel</Button>
          <Button variant="primary" disabled={!scramble || busy} onClick={solve}>{busy ? 'Solving…' : 'Solve it'}</Button>
        </div>
      </div>
    </dialog>
  );
}
