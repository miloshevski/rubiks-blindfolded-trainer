import { memo } from 'react';
import { cn } from '../../lib/cn';

export type StickerMark = 'target' | 'ok' | 'bad';

// The blinking letter-drill target (on the cube and on its floating copy), then its verdict.
const MARK_CLASS: Record<StickerMark, string> = {
  target: 'shadow-[inset_0_0_0_2px_#0c0d0e,inset_0_0_0_5px_var(--color-accent)] animate-blink motion-reduce:animate-none',
  ok: 'shadow-[inset_0_0_0_2px_#0c0d0e,inset_0_0_0_5px_var(--color-ok)]',
  bad: 'shadow-[inset_0_0_0_2px_#0c0d0e,inset_0_0_0_5px_var(--color-bad)]',
};

interface Props {
  className: string;
  color: string | undefined;
  letter: string;
  mark?: StickerMark;
}

/** One colored sticker with its (always black) letter. Shared by the 3D cube, its ghosts and the net. */
export const Sticker = memo(function Sticker({ className, color, letter, mark }: Props) {
  return (
    <i className={cn('flex items-center justify-center not-italic text-black', className, mark && MARK_CLASS[mark])}
       style={{ background: color }}>
      {letter}
    </i>
  );
});
