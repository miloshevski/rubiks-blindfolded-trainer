import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { cn } from '../../lib/cn';

interface FitProps {
  children: ReactNode;
  /** Natural width in px for content that wraps (text); omit for content with a fixed size. */
  width?: number;
  maxZoom: number;
}

/** Shows its content as large as the window allows, up to `maxZoom` times its natural size. */
function Fit({ children, width, maxZoom }: FitProps) {
  const box = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const fit = () => {
      el.style.zoom = '1';
      const { offsetWidth: w, offsetHeight: h } = el;
      // Leave room for the dialog's padding and its Close button.
      const z = Math.min(maxZoom, (innerWidth * 0.94 - 56) / w, (innerHeight * 0.94 - 110) / h);
      el.style.zoom = String(Math.max(z, 1));
      setZoom(Math.max(z, 1));
    };
    fit();
    addEventListener('resize', fit);
    return () => removeEventListener('resize', fit);
  }, [maxZoom, width]);
  return <div ref={box} data-zoom={zoom} style={width ? { width } : undefined}>{children}</div>;
}

interface Props {
  /** What is shown in place, and again enlarged. */
  children: ReactNode;
  label: string;
  /** Natural width of the enlarged content, for content that wraps (see `Fit`). */
  width?: number;
  maxZoom?: number;
  className?: string;
}

/** Click or tap (or Enter / Space) to see the content enlarged in a dialog; Esc, the Close button or a click outside closes it. */
export function Zoomable({ children, label, width, maxZoom = 3, className }: Props) {
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (open) dialog.current?.showModal();
  }, [open]);

  const keyDown = (e: KeyboardEvent) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(true); }
  };

  return (
    <>
      <div role="button" tabIndex={0} title="Click to enlarge" aria-label={`Enlarge ${label}`}
           onClick={() => setOpen(true)} onKeyDown={keyDown}
           className={cn('cursor-zoom-in rounded outline-offset-4 focus-visible:outline-2 focus-visible:outline-accent', className)}>
        {children}
      </div>
      {open ? (
        <dialog ref={dialog} aria-label={label} onClose={() => setOpen(false)}
                onClick={e => { if (e.target === e.currentTarget) dialog.current?.close(); }}
                className="m-auto max-h-[96vh] max-w-[96vw] overflow-auto rounded-md border border-line bg-bg p-5 text-ink backdrop:bg-black/75">
          <div className="flex justify-center">
            <Fit width={width} maxZoom={maxZoom}>{children}</Fit>
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
