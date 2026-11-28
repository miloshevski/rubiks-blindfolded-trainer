import { useEffect, useRef, useState } from 'react';
import { cn } from '../../lib/cn';
import type { Grid } from '../../lib/paint';
import { averageRgb, classifyScan, SCAN_FRAME, SCAN_ORDER, squareCentre, type Rgb } from '../../lib/scan';
import type { Face } from '../../lib/types';
import { Button } from '../ui/Button';
import { Meta } from '../ui/text';

const FACE_NAME: Record<Face, string> = { U: 'Up', L: 'Left', F: 'Front', R: 'Right', B: 'Back', D: 'Down' };
const PATCH = 0.035;        // half the side of the patch averaged in each square, as a fraction of the view

interface Props {
  /** The scanned cube, painted into a grid. */
  onDone: (grid: Grid) => void;
  onCancel: () => void;
}

/** Shows the camera with a 3×3 guide, asks for one face after another and reads their colours. */
export function ScanPanel({ onDone, onCancel }: Props) {
  const video = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const [shots, setShots] = useState<Rgb[][]>([]);     // the nine colours read from each face so far
  const step = shots.length;

  useEffect(() => {
    let stream: MediaStream | null = null, live = true;
    navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false })
      .then(s => {
        if (!live) { s.getTracks().forEach(t => t.stop()); return; }
        stream = s;
        const el = video.current;
        if (el) { el.srcObject = s; el.play().then(() => setReady(true), () => setReady(true)); }
      })
      .catch(() => live && setError('The camera could not be opened. Allow camera access for this site, or paint the cube by hand.'));
    return () => { live = false; stream?.getTracks().forEach(t => t.stop()); };
  }, []);

  const capture = () => {
    const el = video.current;
    if (!el || !el.videoWidth) return;
    const side = Math.min(el.videoWidth, el.videoHeight);       // the view shows the middle square of the picture
    const x0 = (el.videoWidth - side) / 2, y0 = (el.videoHeight - side) / 2;
    const canvas = document.createElement('canvas');
    canvas.width = el.videoWidth; canvas.height = el.videoHeight;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    ctx.drawImage(el, 0, 0);
    const half = Math.max(2, Math.round(side * PATCH));
    const colours: Rgb[] = [];
    for (let i = 0; i < 9; i++) {
      const cx = Math.round(x0 + squareCentre(i % 3) * side), cy = Math.round(y0 + squareCentre(Math.floor(i / 3)) * side);
      colours.push(averageRgb(ctx.getImageData(cx - half, cy - half, half * 2, half * 2).data));
    }
    const next = [...shots, colours];
    if (next.length < 6) { setShots(next); return; }
    const samples = {} as Record<Face, Rgb[]>;
    SCAN_ORDER.forEach(({ face }, n) => { samples[face] = next[n]; });
    onDone(classifyScan(samples));
  };

  const current = SCAN_ORDER[Math.min(step, 5)];
  const css = (c: Rgb) => `rgb(${Math.round(c[0])} ${Math.round(c[1])} ${Math.round(c[2])})`;
  const { start, size } = SCAN_FRAME;
  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-bg" role="group" aria-label="Scan the cube with the camera">
      <div className="flex flex-none items-center justify-between border-b border-rule px-5 py-3.5 max-md:px-4">
        <h2 className="m-0 text-[15px] font-semibold">Scan your cube</h2>
        <Meta className="text-[12px]">face {step + 1} of 6</Meta>
      </div>

      <div className="flex min-h-0 flex-[1_1_auto] flex-col items-center justify-evenly gap-3 overflow-hidden px-4 py-3">
        <p className="m-0 max-w-[420px] text-center text-[13px] leading-[1.5]">
          <b>{FACE_NAME[current.face]} face.</b> {current.hold} Fit the cube into the nine squares.
        </p>

        {error ? <p role="alert" className="m-0 max-w-[420px] text-center font-mono text-[12px] leading-[1.5] text-bad">{error}</p> : (
          <div className="relative aspect-square w-[min(420px,100%,calc(100dvh_-_330px))] overflow-hidden rounded-md border border-line bg-sunk">
            <video ref={video} playsInline muted className="absolute inset-0 size-full object-cover" />
            <div className="pointer-events-none absolute grid grid-cols-3 grid-rows-3 gap-[3px]"
                 style={{ left: `${start * 100}%`, top: `${start * 100}%`, width: `${size * 100}%`, height: `${size * 100}%` }}>
              {Array.from({ length: 9 }, (_, i) => (
                <i key={i} className={cn('rounded-[4px] border-2 border-white/90 shadow-[0_0_0_1px_rgba(0,0,0,.5)]', i === 4 && 'bg-white/15')} />
              ))}
            </div>
            {!ready && <span className="absolute inset-0 grid place-items-center text-[12.5px] text-ink-3">Opening the camera…</span>}
          </div>
        )}

        <div className="flex gap-1.5" aria-label="Faces scanned so far">
          {SCAN_ORDER.map(({ face }, n) => (
            <div key={face} title={FACE_NAME[face]}
                 className={cn('grid gap-px rounded-[3px] p-px [grid-template-columns:repeat(3,9px)] [grid-template-rows:repeat(3,9px)]',
                   n === step ? 'shadow-[0_0_0_2px_var(--color-accent)]' : 'opacity-80')}>
              {Array.from({ length: 9 }, (_, i) => (
                <i key={i} className={cn('block rounded-[1px]', !shots[n] && 'border border-dashed border-line-2 bg-sunk')}
                   style={shots[n] ? { background: css(shots[n][i]) } : undefined} />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-none flex-wrap items-center justify-between gap-2 border-t border-rule px-5 py-3.5 max-md:flex-col-reverse max-md:items-stretch max-md:px-3">
        <Button onClick={onCancel} className="max-md:h-11">Cancel</Button>
        <div className="flex gap-2 max-md:[&>button]:h-11 max-md:[&>button]:flex-1">
          <Button disabled={step === 0} onClick={() => setShots(s => s.slice(0, -1))}>Retake last</Button>
          <Button variant="primary" disabled={!ready || Boolean(error)} onClick={capture}>{step === 5 ? 'Scan last face' : 'Scan this face'}</Button>
        </div>
      </div>
    </div>
  );
}
