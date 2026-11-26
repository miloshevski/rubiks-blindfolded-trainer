import { useRef, type KeyboardEvent } from 'react';
import { cn } from '../../lib/cn';

interface Props {
  code: string;
  word: string;
  onSave: (code: string, text: string) => void;
  onCancel: () => void;
  className?: string;
}

/** The input that replaces a pair's word while it is edited. Enter or leaving it saves, Escape cancels. */
export function WordInput({ code, word, onSave, onCancel, className }: Props) {
  const finished = useRef(false);
  const finish = (save: boolean, text: string) => {
    if (finished.current) return;
    finished.current = true;
    if (save) onSave(code, text); else onCancel();
  };
  const keyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.nativeEvent.isComposing) { e.preventDefault(); finish(true, e.currentTarget.value); }
    else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); finish(false, ''); }
  };
  return (
    <input autoFocus defaultValue={word} maxLength={40} aria-label={`Word for ${code}`} autoComplete="off" spellCheck={false}
           onFocus={e => e.currentTarget.select()} onKeyDown={keyDown} onBlur={e => finish(true, e.currentTarget.value)}
           className={cn('h-6 min-w-0 rounded-[3px] border border-accent bg-sunk px-1 text-[11px] leading-[normal] text-ink outline-none', className)} />
  );
}
