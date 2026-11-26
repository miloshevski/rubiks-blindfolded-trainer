import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { cn } from '../../lib/cn';

interface FitProps {
  children: ReactNode;
  /** Natural width in px for content that wraps (text); omit for content with a fixed size. */
  width?: number;
  maxZoom: number;
  /** The dialog is open and laid out, so the content can be measured. */
  active: boolean;
}

/** Shows its content as large as the window allows, up to `maxZoom` times its natural size. */
function Fit({ children, width, maxZoom, active }: FitProps) {
  const box = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  useLayoutEffect(() => {
    const el = box.current;
    if (!el || !active) return;
    const fit = () => {
      el.style.zoom = '1';
      const { offsetWidth: w, offsetHeight: h } = el;
      if (!w || !h) return;
      // Leave room for the dialog's padding and its Close button.
      const z = Math.min(maxZoom, (innerWidth * 0.94 - 56) / w, (innerHeight * 0.94 - 110) / h);
      el.style.zoom = String(Math.max(z, 1));
      setZoom(Math.max(z, 1));
    };
    fit();
    addEventListener('resize', fit);
    return () => removeEventListener('resize', fit);
  }, [maxZoom, width, active]);
  return <div ref={box} data-zoom={zoom} style={width ? { width } : undefined}>{children}</div>;
}

interface Props {
  /** What is shown in place (and, without `enlarged`, again in the dialog). */
  children: ReactNode;
  /** A different, bigger rendering for the dialog. */
  enlarged?: ReactNode;
  label: string;
  /** Natural width of the enlarged content, for content that wraps (see `Fit`). */
  width?: number;
  maxZoom?: number;
  className?: string;
  /** Full-screen dim overlay that closes on any tap, with a hint, instead of a card with a Close button. */
  tapAnywhere?: boolean;
}

/** Click or tap (or Enter / Space) to see the content enlarged in a dialog; Esc, the Close button or a click outside closes it. */
export function Zoomable({ children, enlarged, label, width, maxZoom = 3, className, tapAnywhere }: Props) {
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (open) { dialog.current?.showModal(); setShown(true); }   // eslint-disable-line react-hooks/set-state-in-effect
    else setShown(false);
  }, [open]);

  const keyDown = (e: KeyboardEvent) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(true); }
  };

  return (
    <>
      <div role="button" tabIndex={0} title="Click to enlarge" aria-label={`Enlarge ${label}`}
           onClick={() => setOpen(true)} onKeyDown={keyDown}
           className={cn('cursor-zoom-in outline-offset-4 focus-visible:outline-2 focus-visible:outline-accent', className)}>
        {children}
      </div>
      {open && tapAnywhere ? (
        <dialog ref={dialog} aria-label={label} onClose={() => setOpen(false)} onClick={() => dialog.current?.close()}
                className="m-0 h-dvh max-h-none w-screen max-w-none cursor-pointer overflow-hidden border-0 bg-transparent p-4 text-ink-3 backdrop:bg-bg/90 open:flex open:flex-col open:items-center open:justify-center open:gap-4">
          <div className="rounded-lg border border-edge bg-sunk p-3.5">
            <Fit width={width} maxZoom={maxZoom} active={shown}>{enlarged ?? children}</Fit>
          </div>
          <span className="text-[12px]">Tap anywhere to close</span>
        </dialog>
      ) : null}
      {open && !tapAnywhere ? (
        <dialog ref={dialog} aria-label={label} onClose={() => setOpen(false)}
                onClick={e => { if (e.target === e.currentTarget) dialog.current?.close(); }}
                className="m-auto max-h-[96vh] max-w-[96vw] overflow-auto rounded-md border border-line bg-bg p-5 text-ink backdrop:bg-black/75">
          <div className="flex justify-center">
            <Fit width={width} maxZoom={maxZoom} active={shown}>{enlarged ?? children}</Fit>
          </div>
          <div className="mt-4 flex justify-center">
            <button type="button" onClick={() => dialog.current?.close()}
                    className="h-8 cursor-pointer rounded border border-edge bg-raise px-4 text-[13px] text-ink touch:h-10 enabled:hover:border-edge-2">
              Close
            </button>
          </div>
        </dialog>
      ) : null}
    </>
  );
}
