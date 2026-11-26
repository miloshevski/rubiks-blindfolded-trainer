import { cn } from '../../lib/cn';
import { stickerColor, stickerLetter } from '../../lib/cube';
import type { CubeView, Face, FaceStrings, LetterMode } from '../../lib/types';
import { Sticker } from './Sticker';

// Unfolded cube: U above F, then L F R B across, D below F.
const NET_AREA: Record<Face, string> = { U: '1 / 2', L: '2 / 1', F: '2 / 2', R: '2 / 3', B: '2 / 4', D: '3 / 2' };
const NET_FACES: readonly Face[] = ['U', 'L', 'F', 'R', 'B', 'D'];

interface Props {
  view: CubeView | null;
  letterMode: LetterMode;
  absoluteLetters: FaceStrings | null;
  /** A small, letterless version (the Timer's summary). */
  compact?: boolean;
}

export function Net({ view, letterMode, absoluteLetters, compact }: Props) {
  return (
    <div className={cn('grid', compact ? 'grid-cols-[repeat(4,30px)] grid-rows-[repeat(3,30px)] gap-0.5 max-md:grid-cols-[repeat(4,20px)] max-md:grid-rows-[repeat(3,20px)]' : 'grid-cols-[repeat(4,64px)] grid-rows-[repeat(3,64px)] gap-[5px]')}
         role="img" aria-label="Unfolded cube">
      {compact ? null : <div className="self-end font-mono text-[10.5px] leading-[1.6] text-ink-3 [grid-area:1/1]">U · top<br />F · front</div>}
      {NET_FACES.map(face => (
        <div key={face} className={cn('grid', compact ? 'grid-cols-[repeat(3,1fr)] grid-rows-[repeat(3,1fr)] gap-px' : 'grid-cols-[repeat(3,20px)] grid-rows-[repeat(3,20px)] gap-0.5')}
             style={{ gridArea: NET_AREA[face] }}>
          {Array.from({ length: 9 }, (_, i) => (
            <Sticker key={i} className={cn('font-mono leading-[normal] font-semibold', compact ? 'rounded-[1px] text-[0px]' : 'rounded-[3px] text-[10px]')}
                     color={stickerColor(view, face, i)}
                     letter={stickerLetter(view, letterMode, absoluteLetters, face, i)} />
          ))}
        </div>
      ))}
    </div>
  );
}
