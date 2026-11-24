import { memo, useCallback, useImperativeHandle, useLayoutEffect, useRef, type Ref } from 'react';
import {
  CUBIE_BY_ID, CUBIE_SIDES, CUBIES, cubieTranslate, ghostSticker, ghostTransform, layerTurn, SIDE_TRANSFORM,
  stickerColor, stickerKey, stickerLetter, type Cubie,
} from '../../lib/cube';
import { FACES, type CubeView, type Face, type FaceStrings, type LetterMode } from '../../lib/types';
import { Sticker, type StickerMark } from './Sticker';

/** What the letter drill marks on the cube: the target sticker, and its letter once answered. */
export interface DrillMarks {
  key: string;
  mark: StickerMark;
  reveal: string | null;
}

export interface CubeHandle {
  /** Animates one layer turn. The cubies stay turned until the next view is drawn (or settle()). */
  turn(move: string, ms: number): Promise<void>;
  /** Puts finished turns back at rest without drawing a new view (playback was interrupted). */
  settle(): void;
}

interface Props {
  ref?: Ref<CubeHandle>;
  elementRef: Ref<HTMLDivElement>;
  view: CubeView | null;
  letterMode: LetterMode;
  absoluteLetters: FaceStrings | null;
  marks: DrillMarks | null;
}

const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

/** The 3D cube: 26 cubies (so single layers can turn) plus a floating copy of every face. */
export function Cube3D({ ref, elementRef, view, letterMode, absoluteLetters, marks }: Props) {
  const cubieEls = useRef(new Map<string, HTMLDivElement>());
  const turning = useRef(new Set<string>());    // cubies of turns still animating
  const turned = useRef(new Set<string>());     // cubies of finished turns, not yet at rest

  const rest = useCallback((ids: Iterable<string>) => {
    for (const id of ids) {
      const el = cubieEls.current.get(id);
      if (el) el.style.transform = cubieTranslate(CUBIE_BY_ID.get(id)!);
    }
  }, []);

  const register = useCallback((id: string, el: HTMLDivElement | null) => {
    if (el) cubieEls.current.set(id, el); else cubieEls.current.delete(id);
  }, []);

  const settle = useCallback(() => {
    rest(turned.current);
    turned.current.clear();
  }, [rest]);

  useImperativeHandle(ref, () => ({
    settle,
    turn(move, ms) {
      const { axis, angle, cubies } = layerTurn(move);
      for (const c of cubies) turning.current.add(c.id);
      // Rotating each cubie about the cube center (its own center at rest) turns the whole layer.
      const place = (deg: number) => {
        for (const c of cubies) {
          const el = cubieEls.current.get(c.id);
          if (el) el.style.transform = `rotate${axis}(${deg}deg) ${cubieTranslate(c)}`;
        }
      };
      return new Promise<void>(resolve => {
        const start = performance.now();
        let done = false;
        const finish = () => {
          if (done) return;
          done = true;
          place(angle);
          for (const c of cubies) { turning.current.delete(c.id); turned.current.add(c.id); }
          resolve();
        };
        const frame = (now: number) => {
          if (done) return;
          const t = Math.min(1, (now - start) / ms);
          place(angle * ease(t));
          if (t < 1) requestAnimationFrame(frame); else finish();
        };
        requestAnimationFrame(frame);
        setTimeout(finish, ms + 40);   // keeps playback going when the tab is hidden (no animation frames)
      });
    },
  }), [settle]);

  // A turned layer at its full angle looks exactly like the next state at rest, so putting the
  // cubies back in the same commit that paints the new colors never shows a jump.
  useLayoutEffect(settle, [view, settle]);

  const sticker = (face: Face, i: number) => {
    const key = stickerKey(face, i);
    const mark = marks?.key === key ? marks : null;
    return {
      color: stickerColor(view, face, i),
      letter: mark?.reveal ?? stickerLetter(view, letterMode, absoluteLetters, face, i),
      mark: mark?.mark,
    };
  };

  return (
    <div ref={elementRef} className="relative h-[calc(var(--c)*3)] w-[calc(var(--c)*3)] transform-3d">
      {CUBIES.map(c => (
        <CubieBox key={c.id} cubie={c} sticker={sticker} register={register} />
      ))}
      {FACES.map(face => (
        <div key={face}
             className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-70 backface-hidden"
             style={{ transform: ghostTransform(face) }}>
          {Array.from({ length: 9 }, (_, slot) => {
            const s = sticker(face, ghostSticker(slot));
            return (
              <Sticker key={slot} {...s}
                       className={`m-[calc(var(--c)*.055)] rounded font-sans text-[calc(var(--c)*.26)] leading-none font-semibold
                                   ${face === 'U' || face === 'D' ? 'rotate-180' /* seen from the opposite side */ : ''}`} />
            );
          })}
        </div>
      ))}
    </div>
  );
}

interface CubieProps {
  cubie: Cubie;
  sticker: (face: Face, i: number) => { color: string | undefined; letter: string; mark?: StickerMark };
  register: (id: string, el: HTMLDivElement | null) => void;
}

const CubieBox = memo(function CubieBox({ cubie, sticker, register }: CubieProps) {
  const elRef = useCallback((el: HTMLDivElement | null) => register(cubie.id, el), [cubie.id, register]);
  return (
    <div ref={elRef}
         className="absolute top-[var(--c)] left-[var(--c)] h-[var(--c)] w-[var(--c)] transform-3d"
         style={{ transform: cubieTranslate(cubie) }}>
      {CUBIE_SIDES.map(face => {
        const i = cubie.stickers[face];
        return (
          <b key={face} className="absolute inset-0 flex rounded bg-cube-body backface-hidden"
             style={{ transform: SIDE_TRANSFORM[face] }}>
            {i === undefined ? null : (
              <Sticker {...sticker(face, i)}
                       className="m-[3px] flex-1 rounded-[5px] font-sans text-[calc(var(--c)*.34)] leading-none font-semibold" />
            )}
          </b>
        );
      })}
    </div>
  );
});
