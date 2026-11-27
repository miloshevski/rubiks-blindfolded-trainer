import { useEffect, useRef } from 'react';
import { scrambleLabel } from '../../lib/paint';
import { Button } from '../ui/Button';
import { Meta } from '../ui/text';

interface Props {
  favorites: readonly string[];
  /** Opens a saved scramble (the dialog closes). */
  onLoad: (scramble: string) => void;
  onRemove: (scramble: string) => void;
  onClose: () => void;
}

/** The saved scrambles, newest first. Esc, Close or a click outside closes it. */
export function FavoritesDialog({ favorites, onLoad, onRemove, onClose }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { dialog.current?.showModal(); }, []);
  const close = () => dialog.current?.close();

  return (
    <dialog ref={dialog} aria-label="Favorite scrambles" onClose={onClose}
            onClick={e => { if (e.target === e.currentTarget) close(); }}
            className="m-auto flex max-h-[85vh] w-[min(520px,94vw)] flex-col overflow-hidden rounded-md border border-line bg-bg p-0 text-ink backdrop:bg-black/75">
      <div className="flex flex-none items-center justify-between border-b border-rule px-4 py-3">
        <h2 className="m-0 text-[13px] font-semibold">Favorite scrambles</h2>
        <Meta>{favorites.length} saved</Meta>
      </div>
      {favorites.length ? (
        <ul className="m-0 min-h-0 flex-[1_1_auto] list-none overflow-auto p-0">
          {favorites.map(f => (
            <li key={f} className="flex items-center gap-3 border-b border-rule-soft px-4 py-2.5">
              <p className="m-0 min-w-0 flex-[1_1_auto] font-mono text-[12.5px] leading-[1.55] break-words">{scrambleLabel(f)}</p>
              <Button size="sm" onClick={() => { onLoad(f); close(); }}>Load</Button>
              <Button size="sm" aria-label={`Remove ${scrambleLabel(f)}`} onClick={() => onRemove(f)}>Remove</Button>
            </li>
          ))}
        </ul>
      ) : <p className="m-0 px-4 py-6 text-center text-[12.5px] text-ink-3">No saved scrambles yet. Press the star to save one.</p>}
      <div className="flex flex-none justify-center border-t border-rule px-4 py-3">
        <Button onClick={close}>Close</Button>
      </div>
    </dialog>
  );
}
