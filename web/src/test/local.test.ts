import 'fake-indexeddb/auto';
import { beforeAll, describe, expect, it } from 'vitest';
import {
  ABC,
  csv,
  dictionary,
  entries,
  getLocal,
  importDictionary,
  initLocal,
  initialData,
  parseDictionary,
  replaceLocal,
  translate,
  updateLocal,
  validateBackup,
  validateScheme,
} from '../lib/local';
beforeAll(() => initLocal());
describe('local data', () => {
  it('merges edits into 576 defaults without changing shipped entries', () => {
    expect(Object.keys(entries()).length).toBe(576);
    const original = entries().AA.words[0];
    updateLocal((d) => {
      dictionary(d).entries.AA = { words: ['Apple', 'Ant'], favorite: true };
    });
    expect(entries().AA.words).toEqual(['Apple', 'Ant']);
    updateLocal((d) => {
      delete dictionary(d).entries.AA;
    });
    expect(entries().AA.words[0]).toBe(original);
  });
  it('round trips a full backup and preserves nullable splits', () => {
    const next = initialData();
    next.solves.push({
      id: 'x',
      session: 'default',
      scramble: 'R',
      at: 1,
      ms: 1234,
      memo: null,
      penalty: '+2',
      cause: '',
    });
    next.lessons = ['intro'];
    replaceLocal(JSON.parse(JSON.stringify(next)));
    expect(getLocal()).toEqual(next);
  });
  it('validates before replacing and leaves data untouched', () => {
    const before = getLocal();
    expect(() =>
      replaceLocal({ ...before, solves: [{ ...before.solves[0], memo: 9999 }] }),
    ).toThrow();
    expect(getLocal()).toBe(before);
  });
  it('rejects unknown versions, duplicate IDs and invalid references', () => {
    const d = initialData();
    expect(() => validateBackup({ ...d, version: 2 })).toThrow();
    expect(() => validateBackup({ ...d, sessions: [...d.sessions, ...d.sessions] })).toThrow();
    expect(() => validateBackup({ ...d, activeDictionary: 'missing' })).toThrow();
  });
  it('supports legacy dictionaries and validates every imported cell', () => {
    expect(parseDictionary({ AA: 'Apple', XX: ['Xylophone', 'X-ray'] })).toEqual({
      AA: { words: ['Apple'], favorite: false },
      XX: { words: ['Xylophone', 'X-ray'], favorite: false },
    });
    for (const bad of [{ YZ: 'no' }, { AA: [] }, { AA: [''] }, { AA: ['one', 'two', 'three'] }])
      expect(() => parseDictionary(bad)).toThrow();
  });
  it('round trips CSV including commas, quotes, and newlines', () => {
    const text = csv([
      ['pair', 'primary', 'alternative', 'favorite'],
      ['AA', 'A, "cat"', 'line\nbreak', 'true'],
    ]);
    expect(importDictionary(text).AA).toEqual({
      words: ['A, "cat"', 'line\nbreak'],
      favorite: true,
    });
    expect(() =>
      importDictionary('pair,primary,alternative,favorite\nAA,Apple,,false\nAA,Ant,,true'),
    ).toThrow();
  });
  it('maps custom letters reversibly and rejects duplicates', () => {
    const scheme = { id: 'x', name: 'Reverse', edges: [...ABC].reverse().join(''), corners: ABC };
    expect(validateScheme(scheme.edges)).toBe(true);
    expect(validateScheme('A'.repeat(24))).toBe(false);
    expect(translate('AB CX', 'edges', false, scheme)).toBe('XW VA');
    expect(translate('XW VA', 'edges', true, scheme)).toBe('AB CX');
    expect(translate("R U R'", 'corners', false, scheme)).toBe("R U R'");
  });
});
