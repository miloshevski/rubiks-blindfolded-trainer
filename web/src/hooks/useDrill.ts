import { useCallback, useRef, useState } from 'react';
import type { DrillMarks } from '../components/cube/Cube3D';
import { stickerKey } from '../lib/cube';
import { pickTarget, type DrillTarget, type StickerSet } from '../lib/drill';
import type { Face, FaceStrings } from '../lib/types';
import { FACES } from '../lib/types';
import { oneOf, useStoredState, type Codec } from './useStoredState';
import { useLatest } from './useLatest';

export interface DrillStats { n: number; ok: number; streak: number; best: number; ms: number }
export interface DrillGuess { letter: string; typed: string; ok: boolean }

const NO_STATS: DrillStats = { n: 0, ok: 0, streak: 0, best: 0, ms: 0 };
const SET_CODEC = oneOf<StickerSet>('edges', 'corners', 'both');
// Faces to drill, stored as e.g. "URF"; at least one face always stays on.
const FACES_CODEC: Codec<Face[]> = {
  parse: raw => {
    const faces = FACES.filter(f => raw.includes(f));
    return faces.length ? faces : null;
  },
  serialize: faces => faces.join(''),
};

interface Round { target: DrillTarget; typed: string | null }

/** Letter drill: a random sticker of the solved cube blinks, the user types its letter. */
export function useDrill(letters: FaceStrings | null, showFace: (face: Face) => void) {
  const [faces, storeFaces] = useStoredState<Face[]>('bld.drillFaces', [...FACES], FACES_CODEC);
  const [set, storeSet] = useStoredState<StickerSet>('bld.drillSet', 'both', SET_CODEC);
  const [round, setRoundState] = useState<Round | null>(null);
  const [stats, setStats] = useState(NO_STATS);
  const [history, setHistory] = useState<DrillGuess[]>([]);

  const latest = useLatest({ letters, showFace });
  // Settings and the current round also live in refs, updated in the same event, so several
  // quick clicks or keys before React re-renders still each see the previous one's result.
  const facesRef = useRef(faces);
  const setRef = useRef(set);
  const roundRef = useRef<Round | null>(null);
  const setRound = useCallback((r: Round | null) => { roundRef.current = r; setRoundState(r); }, []);
  const prevKey = useRef<string | null>(null);
  const shownAt = useRef(0);
  const timer = useRef(0);

  /** Next random target from the current faces and sticker set. */
  const next = useCallback(() => {
    clearTimeout(timer.current);
    const l = latest.current;
    if (!l.letters) return;
    const target = pickTarget(facesRef.current, setRef.current, l.letters, prevKey.current);
    prevKey.current = stickerKey(target.face, target.i);
    shownAt.current = performance.now();
    setRound({ target, typed: null });
    l.showFace(target.face);
  }, [latest, setRound]);

  const stop = useCallback(() => {
    clearTimeout(timer.current);
    setRound(null);
  }, [setRound]);

  const answer = useCallback((typed: string) => {
    const r = roundRef.current;
    if (!r) return;
    if (r.typed !== null) { next(); return; }    // a key during the pause after a miss moves on
    const ok = typed === r.target.letter;
    const ms = performance.now() - shownAt.current;
    setRound({ ...r, typed });
    setStats(s => {
      const streak = ok ? s.streak + 1 : 0;
      return { n: s.n + 1, ok: s.ok + (ok ? 1 : 0), streak, best: Math.max(s.best, streak), ms: s.ms + ms };
    });
    setHistory(h => [{ letter: r.target.letter, typed, ok }, ...h].slice(0, 24));
    timer.current = window.setTimeout(next, ok ? 600 : 2000);
  }, [next, setRound]);

  const toggleFace = useCallback((face: Face) => {
    const cur = facesRef.current;
    const on = cur.includes(face);
    if (on && cur.length === 1) return;
    facesRef.current = FACES.filter(f => (f === face ? !on : cur.includes(f)));
    storeFaces(facesRef.current);
    prevKey.current = null;
    next();
  }, [next, storeFaces]);

  const chooseSet = useCallback((s: StickerSet) => {
    setRef.current = s;
    storeSet(s);
    prevKey.current = null;
    next();
  }, [next, storeSet]);

  const resetStats = useCallback(() => {
    setStats(NO_STATS);
    setHistory([]);
    next();
  }, [next]);

  const marks: DrillMarks | null = round && {
    key: stickerKey(round.target.face, round.target.i),
    mark: round.typed === null ? 'target' : round.typed === round.target.letter ? 'ok' : 'bad',
    reveal: round.typed === null ? null : round.target.letter,
  };

  return { faces, set, round, stats, history, marks, next, stop, answer, toggleFace, chooseSet, resetStats };
}

export type Drill = ReturnType<typeof useDrill>;
