import { useSyncExternalStore } from 'react';
import defaults from '../data/letter-pairs.json';

export const ABC = 'ABCDEFGHIJKLMNOPQRSTUVWX';
export const PAIRS = [...ABC].flatMap((a) => [...ABC].map((b) => a + b));
export interface Scheme {
  id: string;
  name: string;
  edges: string;
  corners: string;
}
export interface Entry {
  words: string[];
  favorite: boolean;
}
export interface Dictionary {
  id: string;
  name: string;
  language: string;
  scheme: string;
  entries: Record<string, Entry>;
}
export interface Review {
  stage: number;
  due: number;
  attempts: number;
  correct: number;
}
export interface Attempt {
  id: string;
  at: number;
  mode: string;
  item: string;
  ok: boolean;
  ms: number;
}
export type Penalty = 'OK' | '+2' | 'DNF';
export interface SolveRecord {
  id: string;
  session: string;
  scramble: string;
  at: number;
  ms: number;
  memo: number | null;
  penalty: Penalty;
  cause: string;
}
export interface Pending {
  scramble: string;
  ms: number;
  memo: number | null;
  at: number;
  session: string;
}
export interface LocalData {
  version: 1;
  dictionaries: Dictionary[];
  activeDictionary: string;
  schemes: Scheme[];
  activeScheme: string;
  lessons: string[];
  reviews: Record<string, Review>;
  attempts: Attempt[];
  sessions: { id: string; name: string }[];
  activeSession: string;
  solves: SolveRecord[];
  stories: Record<string, string>;
  preferences: Record<string, string>;
  pending: Pending | null;
  sequence: { text: string; hidden: boolean; answer: string } | null;
  onboarding: string;
  feedback: string;
}
export function initialData(migrate = true): LocalData {
  const preferences: Record<string, string> = {};
  try {
    if (migrate)
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i)!;
        if (k.startsWith('bld.')) preferences[k] = localStorage.getItem(k)!;
      }
  } catch {
    /* unavailable */
  }
  return {
    version: 1,
    dictionaries: [
      { id: 'default', name: 'My dictionary', language: 'English', scheme: 'speffz', entries: {} },
    ],
    activeDictionary: 'default',
    schemes: [{ id: 'speffz', name: 'Speffz', edges: ABC, corners: ABC }],
    activeScheme: 'speffz',
    lessons: [],
    reviews: {},
    attempts: [],
    sessions: [{ id: 'default', name: 'Session 1' }],
    activeSession: 'default',
    solves: [],
    stories: {},
    preferences,
    pending: null,
    sequence: null,
    onboarding: '',
    feedback: '',
  };
}
let data = initialData();
let ready = false;
let error = '';
let db: IDBDatabase | null = null;
const listeners = new Set<() => void>();
let snapshot = { data, ready, error };
function emit() {
  snapshot = { data, ready, error };
  listeners.forEach((l) => l());
}
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};
export const useLocal = () => useSyncExternalStore(subscribe, () => snapshot);
export const getLocal = () => data;
export const id = () => crypto.randomUUID();
export function validateScheme(s: unknown): s is string {
  return typeof s === 'string' && s.length === 24 && [...ABC].every((c) => s.includes(c));
}
const record = (x: unknown): x is Record<string, unknown> =>
  !!x && typeof x === 'object' && !Array.isArray(x);
export function parseDictionary(value: unknown): Record<string, Entry> {
  if (!record(value)) throw new Error('Dictionary must be an object keyed by AA–XX.');
  const out: Record<string, Entry> = {};
  for (const [pair, raw] of Object.entries(value)) {
    if (!PAIRS.includes(pair)) throw new Error(`Invalid pair: ${pair}`);
    const words =
      typeof raw === 'string' ? [raw] : Array.isArray(raw) ? raw : record(raw) ? raw.words : null;
    if (
      !Array.isArray(words) ||
      words.length < 1 ||
      words.length > 2 ||
      words.some((w) => typeof w !== 'string' || !w.trim() || w.length > 100)
    )
      throw new Error(`${pair}: enter one or two words, at most 100 characters each.`);
    if (record(raw) && typeof raw.favorite !== 'boolean')
      throw new Error(`${pair}: invalid favorite.`);
    out[pair] = {
      words: words.map((w) => w.trim()),
      favorite: record(raw) ? (raw.favorite as boolean) : false,
    };
  }
  return out;
}
export function validateBackup(raw: unknown): LocalData {
  if (!record(raw) || raw.version !== 1) throw new Error('Unsupported backup version.');
  const d = raw as unknown as LocalData;
  for (const key of Object.keys(initialData(false)))
    if (!(key in raw)) throw new Error(`Missing backup field: ${key}`);
  if (
    !Array.isArray(d.schemes) ||
    !d.schemes.length ||
    d.schemes.some(
      (s) =>
        !s ||
        typeof s.id !== 'string' ||
        typeof s.name !== 'string' ||
        !validateScheme(s.edges) ||
        !validateScheme(s.corners),
    )
  )
    throw new Error('Invalid lettering schemes.');
  if (
    !d.schemes.some((s) => s.id === d.activeScheme) ||
    !Array.isArray(d.dictionaries) ||
    !d.dictionaries.length
  )
    throw new Error('Missing dictionary or scheme.');
  for (const dict of d.dictionaries) {
    if (
      !dict ||
      typeof dict.id !== 'string' ||
      typeof dict.name !== 'string' ||
      typeof dict.language !== 'string' ||
      !d.schemes.some((s) => s.id === dict.scheme)
    )
      throw new Error('Invalid dictionary.');
    parseDictionary(dict.entries);
  }
  if (!d.dictionaries.some((x) => x.id === d.activeDictionary && x.scheme === d.activeScheme))
    throw new Error('Active dictionary does not match lettering.');
  if (
    !Array.isArray(d.sessions) ||
    !d.sessions.length ||
    d.sessions.some((s) => !s || typeof s.id !== 'string' || typeof s.name !== 'string') ||
    !d.sessions.some((s) => s.id === d.activeSession)
  )
    throw new Error('Invalid sessions.');
  const scramble = (s: unknown) =>
    typeof s === 'string' &&
    s.length > 0 &&
    s.length <= 2000 &&
    /^(?:[URFDLBM](?:2|')?(?:\s+|$))+$/.test(s);
  const finite = (n: unknown) => typeof n === 'number' && Number.isFinite(n) && n >= 0;
  if (
    !Array.isArray(d.solves) ||
    d.solves.some(
      (s) =>
        !s ||
        typeof s.id !== 'string' ||
        !d.sessions.some((x) => x.id === s.session) ||
        !scramble(s.scramble) ||
        !finite(s.at) ||
        !finite(s.ms) ||
        !(s.memo === null || (finite(s.memo) && s.memo <= s.ms)) ||
        !['OK', '+2', 'DNF'].includes(s.penalty) ||
        typeof s.cause !== 'string',
    )
  )
    throw new Error('Invalid solves.');
  if (
    !Array.isArray(d.attempts) ||
    d.attempts.some(
      (a) =>
        !a ||
        typeof a.id !== 'string' ||
        typeof a.item !== 'string' ||
        typeof a.mode !== 'string' ||
        typeof a.ok !== 'boolean' ||
        !finite(a.ms) ||
        !finite(a.at),
    )
  )
    throw new Error('Invalid practice history.');
  if (
    !Array.isArray(d.lessons) ||
    d.lessons.some((x) => typeof x !== 'string') ||
    !record(d.preferences) ||
    !record(d.stories) ||
    Object.values(d.preferences).some((v) => typeof v !== 'string') ||
    Object.values(d.stories).some((v) => typeof v !== 'string') ||
    !record(d.reviews)
  )
    throw new Error('Invalid progress or preferences.');
  for (const r of Object.values(d.reviews))
    if (
      !r ||
      !Number.isInteger(r.stage) ||
      r.stage < 0 ||
      r.stage > 4 ||
      !finite(r.due) ||
      !Number.isInteger(r.attempts) ||
      r.attempts < 1 ||
      !Number.isInteger(r.correct) ||
      r.correct < 0 ||
      r.correct > r.attempts
    )
      throw new Error('Invalid reviews.');
  if (
    d.pending !== null &&
    (!record(d.pending) ||
      !finite(d.pending.ms) ||
      !finite(d.pending.at) ||
      !scramble(d.pending.scramble) ||
      !d.sessions.some((s) => s.id === d.pending!.session) ||
      !(d.pending.memo === null || (finite(d.pending.memo) && d.pending.memo <= d.pending.ms)))
  )
    throw new Error('Invalid pending result.');
  if (
    d.sequence !== null &&
    (!record(d.sequence) ||
      typeof d.sequence.text !== 'string' ||
      typeof d.sequence.answer !== 'string' ||
      typeof d.sequence.hidden !== 'boolean')
  )
    throw new Error('Invalid sequence.');
  if (typeof d.onboarding !== 'string' || typeof d.feedback !== 'string')
    throw new Error('Invalid profile.');
  for (const items of [d.sessions, d.dictionaries, d.schemes, d.solves, d.attempts])
    if (new Set(items.map((x) => x.id)).size !== items.length)
      throw new Error('Duplicate record identifiers.');
  return structuredClone(d);
}
function persist() {
  if (!db) return;
  try {
    const tx = db.transaction('data', 'readwrite');
    tx.objectStore('data').put(data, 'root');
    tx.onabort = tx.onerror = () => {
      error = 'Could not save locally. Export a backup before closing this tab.';
      emit();
    };
  } catch {
    error = 'Local storage is unavailable. Changes remain in this tab; export a backup.';
    emit();
  }
}
export function updateLocal(fn: (d: LocalData) => void) {
  if (!ready) return;
  data = structuredClone(data);
  fn(data);
  emit();
  persist();
}
export function replaceLocal(raw: unknown) {
  const next = validateBackup(raw);
  if (!ready) throw new Error('Local data is still loading.');
  data = next;
  emit();
  persist();
}
export function initLocal(): Promise<void> {
  return new Promise((resolve) => {
    let settled = false;
    const fail = () => {
      if (settled) return;
      settled = true;
      db?.close();
      db = null;
      ready = true;
      error = 'Local storage is unavailable. Changes remain in this tab; export a backup.';
      emit();
      resolve();
    };
    try {
      const request = indexedDB.open('bld-trainer', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('data');
      request.onerror = fail;
      request.onblocked = fail;
      request.onsuccess = () => {
        if (settled) {
          request.result.close();
          return;
        }
        db = request.result;
        const read = db.transaction('data').objectStore('data').get('root');
        read.onerror = fail;
        read.onsuccess = () => {
          if (settled) return;
          try {
            if (read.result) data = validateBackup(read.result);
          } catch {
            settled = true;
            ready = true;
            error =
              'Saved data could not be read. Existing storage has been preserved; restore a valid backup to continue.';
            db?.close();
            db = null;
            emit();
            resolve();
            return;
          }
          settled = true;
          ready = true;
          emit();
          persist();
          resolve();
        };
      };
    } catch {
      fail();
    }
  });
}
export function dictionary(d = data) {
  return d.dictionaries.find((x) => x.id === d.activeDictionary)!;
}
export function entries(d = data): Record<string, Entry> {
  return Object.fromEntries(
    PAIRS.map((pair) => [
      pair,
      dictionary(d).entries[pair] ?? {
        words: [(defaults as Record<string, string>)[pair]],
        favorite: false,
      },
    ]),
  );
}
export function words(d = data) {
  return Object.fromEntries(Object.entries(entries(d)).map(([k, e]) => [k, e.words[0]]));
}
export function scheme(d = data) {
  return d.schemes.find((s) => s.id === d.activeScheme)!;
}
export function translate(text: string, kind: 'edges' | 'corners', inverse = false, s = scheme()) {
  return [...text.toUpperCase()]
    .map((c) =>
      ABC.includes(c) ? (inverse ? ABC[s[kind].indexOf(c)] : s[kind][ABC.indexOf(c)]) : c,
    )
    .join('');
}
export function download(name: string, content: string, type = 'application/json') {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function csv(rows: (string | number | null)[][]) {
  return rows
    .map((r) => r.map((v) => `"${String(v ?? '').replaceAll('"', '""')}"`).join(','))
    .join('\r\n');
}
export function readCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [],
    cell = '',
    quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (quoted && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (!quoted && cell) throw new Error('Invalid CSV quote.');
      else quoted = !quoted;
    } else if (c === ',' && !quoted) {
      row.push(cell);
      cell = '';
    } else if ((c === '\n' || c === '\r') && !quoted) {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cell);
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = '';
    } else cell += c;
  }
  if (quoted) throw new Error('Unclosed CSV quote.');
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}
export function importDictionary(text: string): Record<string, Entry> {
  text = text.replace(/^\uFEFF/, '');
  if (text.trimStart().startsWith('{')) return parseDictionary(JSON.parse(text));
  const [head, ...rows] = readCsv(text);
  if (head?.join(',') !== 'pair,primary,alternative,favorite')
    throw new Error('CSV columns: pair,primary,alternative,favorite');
  const obj: Record<string, Entry> = {};
  for (const [pair, primary, alternative, favorite, extra] of rows) {
    if (obj[pair] || extra !== undefined || !['true', 'false'].includes(favorite))
      throw new Error('Invalid or duplicate CSV row.');
    obj[pair] = {
      words: alternative ? [primary, alternative] : [primary],
      favorite: favorite === 'true',
    };
  }
  return parseDictionary(obj);
}

export function flushLocal(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Local storage is unavailable; keep an exported backup.'));
      return;
    }
    const tx = db.transaction('data', 'readwrite');
    tx.objectStore('data').put(data, 'root');
    tx.oncomplete = () => resolve();
    tx.onerror = tx.onabort = () => reject(new Error('Could not save local data.'));
  });
}
