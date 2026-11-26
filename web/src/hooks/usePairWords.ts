import { useCallback, useEffect, useRef, useState } from 'react';
import pairs from '../data/letter-pairs.json';
import { fetchPairs, savePairWord } from '../lib/api';

const BUNDLED = pairs as Record<string, string>;

/** The letter-pair words, editable: an edit shows at once and is saved to letter-pairs.json. */
export function usePairWords() {
  const [words, setWords] = useState(BUNDLED);
  const [message, setMessage] = useState('');

  // The file may hold edits newer than the bundled copy (the build is only redone on deploy).
  useEffect(() => {
    let alive = true;
    fetchPairs().then(res => { if (alive && res.ok) setWords(res.data); });
    return () => { alive = false; };
  }, []);

  const latest = useRef(words);
  latest.current = words;

  /** Saves a new word for `code`; the old one comes back if saving fails. */
  const save = useCallback(async (code: string, text: string) => {
    const word = text.trim().replace(/\s+/g, ' ');
    const old = latest.current[code];
    if (!word || word === old) return;
    setMessage('');
    setWords(w => ({ ...w, [code]: word }));
    const res = await savePairWord(code, word);
    if (!res.ok) {
      setWords(w => ({ ...w, [code]: old }));
      setMessage(`Could not save ${code}: ${res.error}`);
    }
  }, []);

  const clearMessage = useCallback(() => setMessage(''), []);
  return { words, message, save, clearMessage };
}
