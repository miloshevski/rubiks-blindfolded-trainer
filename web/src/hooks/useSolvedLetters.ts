import { useEffect, useState } from 'react';
import { fetchCube } from '../lib/api';
import type { FaceStrings } from '../lib/types';

// The letters of the solved cube come with every scramble; fetch them once per page load.
let cached: Promise<FaceStrings | null> | null = null;
const fetchLetters = () => (cached ??= fetchCube('', '1').then(res => {
  if (!res.ok) cached = null;
  return res.ok ? res.data.absolute_letters : null;
}));

export function useSolvedLetters() {
  const [letters, setLetters] = useState<FaceStrings | null>(null);
  useEffect(() => {
    let live = true;
    fetchLetters().then(l => { if (live) setLetters(l); });
    return () => { live = false; };
  }, []);
  return letters;
}
