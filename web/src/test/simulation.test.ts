import { describe, expect, it } from 'vitest';
import { frameSegments } from '../lib/solution';
import { simulate } from '../lib/simulation';
import lessons from '../data/fixtures.json';
import cases from '../data/practice-fixtures.json';
const fixtures = [...lessons, ...cases];
import algorithms from '../data/algorithms.json';
describe('browser simulation against Python-generated states', () => {
  it('matches every lesson scramble, move frame, and final solution', () => {
    for (const f of fixtures) {
      let moves = f.scramble;
      let state = simulate(moves);
      expect(state.facelets, f.id).toEqual(f.facelets);
      expect(state.letters, f.id).toEqual(f.letters);
      for (const frame of f.frames) {
        moves += ' ' + frame.move;
        state = simulate(moves);
        expect(state.facelets, `${f.id}: ${frame.move}`).toEqual(frame.facelets);
        expect(state.letters, `${f.id}: ${frame.move}`).toEqual(frame.letters);
      }
      expect(state.identity).toBe(simulate('').identity);
    }
  });
  it('recognizes equivalent algorithm effects including redundant turns', () => {
    for (const r of [...algorithms.edges, ...algorithms.corners].filter((r) => !r.buffer)) {
      expect(simulate(`R R R R ${r.alg}`).identity).toBe(simulate(r.alg).identity);
    }
    expect(() => simulate('bad')).toThrow();
  });
});

it('keeps repeated user targets separate in playback', () => {
  const view = simulate('');
  const frames = [
    { ...view, label: 'Edges A', move: 'M2', step: 0 },
    { ...view, label: 'Edges A', move: 'M2', step: 1 },
  ];
  expect(frameSegments(frames)).toHaveLength(2);
});
