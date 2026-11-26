import { useCallback, useEffect, useLayoutEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { Button, Kbd } from '../ui/Button';
import { shareUrl } from '../../lib/scrambleCode';
import { FIELD } from '../ui/text';

interface Props {
  value: string;
  onChange: (value: string) => void;
  moveCount: number | null;
  invalid: boolean;
  onApply: () => void;
  onRandom: () => void;
  /** The scramble that is loaded, which Share links to. */
  loaded: string | null;
}

/** Scramble box (wraps and grows on phones and touch screens, one scrolling line on desktop) + Random / Apply.
 *  On touch screens from tablet width up it takes its own full-width row. */
export function ScrambleForm({ value, onChange, moveCount, invalid, onApply, onRandom, loaded }: Props) {
  const box = useRef<HTMLTextAreaElement>(null);
  const [shareLabel, setShareLabel] = useState('Share');
  const link = loaded ? shareUrl(loaded) : null;

  const share = async () => {
    if (!link) return;
    try { await navigator.clipboard.writeText(link); setShareLabel('Copied'); }
    catch { setShareLabel('Copy failed'); }
    setTimeout(() => setShareLabel('Share'), 1200);
  };

  const fit = useCallback(() => {
    const s = box.current;
    if (!s) return;
    s.style.height = 'auto';
    s.style.height = `${s.scrollHeight + 2}px`;   // + top/bottom border
  }, []);

  useLayoutEffect(fit, [value, fit]);
  useEffect(() => {
    addEventListener('resize', fit);
    return () => removeEventListener('resize', fit);
  }, [fit]);

  const submit = (e: FormEvent) => { e.preventDefault(); onApply(); };
  // It is a textarea only so it can wrap: Enter applies, it never adds a line.
  const keyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); onApply(); }
  };

  return (
    <form className="m-0 flex min-w-0 flex-[1_1_520px] items-center gap-2 max-md:flex-wrap touch:order-last touch:basis-full" onSubmit={submit}>
      <label htmlFor="scramble" className="font-mono text-[11px] leading-[normal] text-ink-3 max-md:hidden">Scramble</label>
      <div className="relative min-w-0 flex-[1_1_auto] max-md:flex-[1_0_100%]">
        <textarea ref={box} id="scramble" rows={1} value={value} onChange={e => onChange(e.target.value)} onKeyDown={keyDown}
                  placeholder="Paste a scramble, or leave empty for a random one" autoComplete="off" spellCheck={false}
                  aria-describedby="msg" aria-invalid={invalid || undefined}
                  className={`${FIELD} block h-9 min-h-9 resize-none overflow-hidden py-[7px] pr-[84px] leading-5 touch:min-h-11 touch:py-[11px] whitespace-pre max-md:whitespace-pre-wrap touch:whitespace-pre-wrap`} />
        <span className="absolute top-0 right-3 font-mono text-[11px] leading-9 text-ink-3 touch:leading-11">{moveCount == null ? '' : `${moveCount} moves`}</span>
      </div>
      <Button title="New random scramble (R)" onClick={onRandom} className="max-md:h-11 max-md:flex-[1_1_0]">
        Random <Kbd>R</Kbd>
      </Button>
      <Button title={link ? 'Copy a link to this scramble' : 'Only plain face turns (U D L R F B) can be shared'}
              disabled={!link} onClick={share} className="max-md:h-11 max-md:flex-[1_1_0]">
        {shareLabel}
      </Button>
      <Button type="submit" variant="primary" className="max-md:h-11 max-md:flex-[1_1_0]">
        Apply <Kbd>↵</Kbd>
      </Button>
    </form>
  );
}
