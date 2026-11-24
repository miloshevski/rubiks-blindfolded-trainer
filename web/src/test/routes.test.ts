import { expect, it } from 'vitest';
import { modeOf, MODE_PATH } from '../lib/route';
import { PARITY } from '../components/header/Header';
import algorithms from '../data/algorithms.json';
it('resolves all routes and old bookmarks including trailing slashes', () => {
  for (const [mode, path] of Object.entries(MODE_PATH)) {
    expect(modeOf(path)).toBe(mode);
    expect(modeOf(path + '/')).toBe(mode);
  }
  expect(modeOf('/unknown')).toBe('home');
});
it('parity selector labels match the authoritative algorithms', () => {
  for (const item of PARITY)
    expect(item.title).toBe(algorithms.parity.find((p) => String(p.number) === item.value)!.alg);
});
