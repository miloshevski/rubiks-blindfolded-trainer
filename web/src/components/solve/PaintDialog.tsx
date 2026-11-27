import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { cn } from '../../lib/cn';
import { FACE_COLOR } from '../../lib/cube';
import { blankGrid, colourCounts, gridFromFacelets, paintedScramble, solvedGrid, type Grid } from '../../lib/paint';
import { FACES, type CubeView, type Face } from '../../lib/types';
import { Button } from '../ui/Button';
import { Meta } from '../ui/text';

// Unfolded cube: U above F, then L F R B across, D below F.
const NET_AREA: Record<Face, string> = { U: '1 / 2', L: '2 / 1', F: '2 / 2', R: '2 / 3', B: '2 / 4', D: '3 / 2' };
const NET_FACES: readonly Face[] = ['U', 'L', 'F', 'R', 'B', 'D'];
// The colours in the order of the number keys: white, green, red, blue, orange, yellow.
const PALETTE: readonly { face: Face; name: string }[] = [
  { face: 'U', name: 'White' }, { face: 'F', name: 'Green' }, { face: 'R', name: 'Red' },
  { face: 'B', name: 'Blue' }, { face: 'L', name: 'Orange' }, { face: 'D', name: 'Yellow' },
];

interface Props {
  /** The cube on screen, to start from. */
  start: CubeView | null;
  /** Solves the painted cube; answers why it cannot, or '' when it worked (the dialog then closes). */
  onSolve: (scramble: string) => Promise<string>;
  onClose: () => void;
}

/** Paint a cube by hand: pick a colour, tap or drag over the stickers, then solve it. */
export function PaintDialog({ start, onSolve, onClose }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [grid, setGrid] = useState<Grid>(blankGrid);
  const [colour, setColour] = useState<Face>('U');
  const [problem, setProblem] = useState('');
  const [busy, setBusy] = useState(false);
  const painting = useRef(false);
  useEffect(() => { dialog.current?.showModal(); }, []);
  const close = () => dialog.current?.close();

  const counts = colourCounts(grid);
  const scramble = paintedScramble(grid);
  const missing = FACES.reduce((n, f) => n + grid[f].filter(c => !c).length, 0);

  const paint = (face: Face, i: number) => {
    if (i === 4) return;                      // centres never move
    setProblem('');
    setGrid(g => (g[face][i] === colour ? g : { ...g, [face]: g[face].map((c, k) => (k === i ? colour : c)) }));
  };
  const cellAt = (e: PointerEvent) => {
    const el = document.elementFromPoint(e.clientX, e.clientY)?.closest<HTMLElement>('[data-cell]');
    return el ? ([el.dataset.face as Face, Number(el.dataset.cell)] as const) : null;
  };
  const down = (e: PointerEvent) => {
    const cell = cellAt(e);
    if (!cell) return;
    painting.current = true;
    paint(...cell);
  };
  const move = (e: PointerEvent) => {
    if (!painting.current) return;
    const cell = cellAt(e);
    if (cell) paint(...cell);
  };
  const keyDown = (e: KeyboardEvent) => {
    const n = Number(e.key);
    if (n >= 1 && n <= 6 && !e.ctrlKey && !e.metaKey && !e.altKey) setColour(PALETTE[n - 1].face);
  };

  const solve = async () => {
    if (!scramble || busy) return;
    setBusy(true);
    const why = await onSolve(scramble);
    setBusy(false);
    if (why) setProblem(why); else close();
  };

  return (
    <dialog ref={dialog} aria-label="Paint a cube" onClose={onClose} onKeyDown={keyDown}
            onClick={e => { if (e.target === e.currentTarget) close(); }}
            className="m-auto flex max-h-[94vh] w-[min(560px,96vw)] flex-col overflow-hidden rounded-md border border-line bg-bg p-0 text-ink backdrop:bg-black/75">
      <div className="flex flex-none items-center justify-between border-b border-rule px-4 py-3">
        <h2 className="m-0 text-[13px] font-semibold">Paint your cube</h2>
        <Meta>{missing ? `${missing} stickers left` : 'all painted'}</Meta>
      </div>

      <div className="flex min-h-0 flex-[1_1_auto] flex-col items-center gap-4 overflow-auto px-4 py-4">
        <p className="m-0 max-w-[46ch] text-center text-[12.5px] leading-[1.55] text-ink-3">
          Hold the cube with white on top and green in front, as in the picture, then colour every sticker the way yours looks. Drag to paint many at once.
        </p>

        <div className="flex flex-wrap justify-center gap-2 max-[420px]:gap-1.5" role="radiogroup" aria-label="Colour to paint with">
          {PALETTE.map(({ face, name }, n) => (
            <button key={face} type="button" role="radio" aria-checked={colour === face} aria-label={`${name} (${n + 1})`} title={`${name} (key ${n + 1})`}
                    onClick={() => setColour(face)}
                    className={cn('flex w-[52px] max-[420px]:w-[44px] cursor-pointer flex-col items-center gap-1 rounded border bg-transparent p-1.5 text-ink transition-colors duration-[120ms]',
                      colour === face ? 'border-accent bg-accent-bg' : 'border-line hover:border-edge-2')}>
              <span className="block h-7 w-full rounded-[3px] border border-black/40" style={{ background: FACE_COLOR[face] }} />
              <span className={cn('font-mono text-[10.5px] leading-[normal]', counts[face] > 9 ? 'text-bad' : counts[face] === 9 ? 'text-ok' : 'text-ink-3')}>{counts[face]}/9</span>
            </button>
          ))}
        </div>

        <div className="grid touch-none gap-[6px] [--s:30px] [grid-template-columns:repeat(4,calc(var(--s)*3+4px))] [grid-template-rows:repeat(3,calc(var(--s)*3+4px))] select-none max-[420px]:[--s:24px]"
             onPointerDown={down} onPointerMove={move} onPointerUp={() => { painting.current = false; }}
             onPointerCancel={() => { painting.current = false; }} onPointerLeave={() => { painting.current = false; }} aria-label="Unfolded cube">
          {NET_FACES.map(face => (
            <div key={face} className="grid [grid-template-columns:repeat(3,var(--s))] [grid-template-rows:repeat(3,var(--s))] gap-0.5" style={{ gridArea: NET_AREA[face] }}>
              {grid[face].map((c, i) => (
                <button key={i} type="button" data-face={face} data-cell={i} onClick={() => paint(face, i)} disabled={i === 4} tabIndex={i === 4 ? -1 : 0}
                        aria-label={`${face} ${i + 1}${c ? `, ${PALETTE.find(p => p.face === c)?.name}` : ', not painted'}`}
                        className={cn('block rounded-[3px] border p-0 enabled:cursor-pointer', c ? 'border-black/40' : 'border-dashed border-line-2 bg-sunk')}
                        style={c ? { background: FACE_COLOR[c] } : undefined} />
              ))}
            </div>
          ))}
        </div>

        <p role="alert" className="m-0 min-h-[2.6em] max-w-[52ch] text-center font-mono text-[11.5px] leading-[1.5] text-bad">{problem}</p>
      </div>

      <div className="flex flex-none flex-wrap items-center justify-between gap-2 border-t border-rule px-4 py-3">
        <div className="flex gap-2">
          <Button size="sm" onClick={() => { setProblem(''); setGrid(blankGrid()); }}>Clear</Button>
          <Button size="sm" onClick={() => { setProblem(''); setGrid(solvedGrid()); }}>Solved</Button>
          <Button size="sm" disabled={!start} onClick={() => { if (start) { setProblem(''); setGrid(gridFromFacelets(start.facelets)); } }}>Current cube</Button>
        </div>
        <div className="flex gap-2">
          <Button onClick={close}>Cancel</Button>
          <Button variant="primary" disabled={!scramble || busy} onClick={solve}>{busy ? 'Solving…' : 'Solve it'}</Button>
        </div>
      </div>
    </dialog>
  );
}
