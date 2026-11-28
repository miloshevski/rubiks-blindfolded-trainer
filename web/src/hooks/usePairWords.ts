import { useCallback, useMemo, useState } from 'react';
import pairs from '../data/letter-pairs.json';
import { cleanWords, MAX_WORD } from '../lib/pairs';
import { readStored, writeStored } from '../lib/storage';

const DEFAULTS = pairs as Record<string, string>;
const KEY = 'bld.pairs';

function readEdits(): Record<string, string> {
  try {
    return cleanWords(JSON.parse(readStored(KEY) ?? '{}'), DEFAULTS);
  } catch {
    return {};
  }
}

/**
 * The letter-pair words: the defaults that ship with the app, with this browser's own edits on
 * top. Edits are saved in the browser only (they can be exported to a file and imported back).
 */
export function usePairWords() {
  const [edits, setEdits] = useState(readEdits);
  const [message, setMessage] = useState('');
  const words = useMemo(() => ({ ...DEFAULTS, ...edits }), [edits]);

  const store = useCallback((next: Record<string, string>) => {
    setEdits(next);
    writeStored(KEY, JSON.stringify(next));
  }, []);

  const save = useCallback((code: string, text: string) => {
    const word = text.trim().replace(/\s+/g, ' ');
    if (!word || !(code in DEFAULTS)) return;
    if (word.length > MAX_WORD) { setMessage(`${code}: the word is longer than ${MAX_WORD} characters`); return; }
    setMessage('');
    const next = { ...edits };
    if (word === DEFAULTS[code]) delete next[code]; else next[code] = word;
    store(next);
  }, [edits, store]);

  /** Puts all the words back to the defaults. */
  const reset = useCallback(() => { setMessage(''); store({}); }, [store]);

  /** All 576 words as a JSON file the person can keep. */
  const exportFile = useCallback(() => {
    const blob = new Blob([JSON.stringify(words, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'letter-pairs.json';
    a.click();
    URL.revokeObjectURL(a.href);
  }, [words]);

  /** Reads an exported file; its words replace the current edits. */
  const importFile = useCallback(async (file: File) => {
    try {
      const raw: unknown = JSON.parse(await file.text());
      const next = cleanWords(raw, DEFAULTS);
      const valid = raw && typeof raw === 'object' && !Array.isArray(raw) && Object.keys(raw).some(k => k in DEFAULTS);
      if (!valid) { setMessage('That file has no letter pairs in it.'); return; }
      setMessage('');
      store(next);
    } catch {
      setMessage('That file is not a pair-words JSON file.');
    }
  }, [store]);

  const clearMessage = useCallback(() => setMessage(''), []);
  return { words, edited: Object.keys(edits).length, message, save, reset, exportFile, importFile, clearMessage };
}
