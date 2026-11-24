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
  onSticker?: (face: Face, i: number) => void;
  marks?: Record<string, 'target' | 'bad' | 'ok'>;
}

export function Net({ view, letterMode, absoluteLetters, onSticker, marks }: Props) {
  return (
    <div className="grid grid-cols-[repeat(4,64px)] grid-rows-[repeat(3,64px)] gap-[5px]" role={onSticker ? "group" : "img"} aria-label="Unfolded cube">
      <div className="self-end font-mono text-[10.5px] leading-[1.6] text-ink-3 [grid-area:1/1]">U · top<br />F · front</div>
      {NET_FACES.map(face => (
        <div key={face} className="grid grid-cols-[repeat(3,20px)] grid-rows-[repeat(3,20px)] gap-0.5"
             style={{ gridArea: NET_AREA[face] }}>
          {Array.from({ length: 9 }, (_, i) => { const sticker = (
            <Sticker mark={marks?.[`${face}${i}`]} key={i} className="rounded-[3px] font-mono text-[10px] leading-[normal] font-semibold"
                     color={stickerColor(view, face, i)}
                     letter={stickerLetter(view, letterMode, absoluteLetters, face, i)} />
          ); return onSticker && i !== 4 ? <button type="button" key={i} aria-label={`${face} sticker ${i + 1}`} className="cursor-pointer border-0 bg-transparent p-0 [&>i]:h-full" onClick={() => onSticker(face, i)}>{sticker}</button> : sticker; })}
        </div>
      ))}
    </div>
  );
}
