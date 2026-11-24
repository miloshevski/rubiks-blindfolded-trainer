import { describe, expect, it } from 'vitest';
import { IDLE, parseTime, statistics, transition } from '../lib/timing';
import { schedule } from '../lib/review';
import type { SolveRecord } from '../lib/local';
describe('timer state machine', () => {
  it('does not start after early release and arms after threshold', () => {
    const s = transition(IDLE, 'down', 100);
    expect(s.phase).toBe('holding');
    expect(transition(s, 'up', 399).phase).toBe('idle');
    expect(transition(s, 'tick', 400).phase).toBe('ready');
    const running = transition(s, 'up', 400);
    expect(running.phase).toBe('running');
    expect(transition(running, 'down', 1600).elapsed).toBe(1200);
  });
  it('records memo while total timing continues', () => {
    let s = transition(transition(IDLE, 'down', 0), 'up', 300);
    s = transition(s, 'down', 1300, 300, true);
    expect(s.memo).toBe(1000);
    expect(s.phase).toBe('memo-complete');
    s = transition(s, 'up', 1400, 300, true);
    expect(s.phase).toBe('memo-complete');
    s = transition(s, 'down', 2300, 300, true);
    expect(s.phase).toBe('confirmation');
    expect(s.elapsed).toBe(2000);
    expect(s.memo).toBe(1000);
  });
  it('cancels arming on blur but keeps running attempts', () => {
    expect(transition(transition(IDLE, 'down', 0), 'blur', 100).phase).toBe('idle');
    const run = transition(transition(IDLE, 'down', 0), 'up', 300);
    expect(transition(run, 'blur', 400)).toEqual(run);
  });
  it('starts with zero threshold and rejects actions during confirmation', () => {
    const s = transition(IDLE, 'down', 0, 0);
    expect(s.phase).toBe('ready');
    const end = transition(transition(s, 'up', 0, 0), 'down', 20);
    expect(transition(end, 'down', 30)).toEqual(end);
  });
  it('parses positive times without accepting malformed seconds', () => {
    expect(parseTime('1:15.20')).toBe(75200);
    expect(parseTime('75.20')).toBe(75200);
    for (const x of ['0', '-1', '1:60', 'NaN', '12abc']) expect(() => parseTime(x)).toThrow();
  });
});
describe('statistics and scheduling', () => {
  const make = (
    id: string,
    ms: number,
    penalty: SolveRecord['penalty'] = 'OK',
    memo: number | null = null,
  ): SolveRecord => ({
    id,
    ms,
    penalty,
    memo,
    at: Number(id),
    session: 'default',
    scramble: 'R',
    cause: '',
  });
  it('applies penalties, includes DNFs in rate, and does not turn missing splits into zero', () => {
    const s = statistics([make('1', 10000), make('2', 10000, '+2', 4000), make('3', 10000, 'DNF')]);
    expect(s.best).toBe(10000);
    expect(s.mean).toBe(11000);
    expect(s.mo3).toBe(null);
    expect(s.rate).toBe(2 / 3);
    expect(s.memo).toBe(4000);
    expect(s.execution).toBe(6000);
    expect(statistics([]).memo).toBe(null);
    expect(statistics([]).mo3).toBe(undefined);
  });
  it('uses 1,3,7,14,30 day stages and resets again', () => {
    let r = schedule(undefined, 'Good', 0);
    expect(r.due).toBe(86400000);
    r = schedule(r, 'Good', 0);
    expect(r.stage).toBe(1);
    expect(r.due).toBe(3 * 86400000);
    r = schedule(r, 'Hard', 0);
    expect(r.stage).toBe(1);
    r = schedule(r, 'Easy', 0);
    expect(r.stage).toBe(3);
    r = schedule(r, 'Again', 0);
    expect(r.stage).toBe(0);
    expect(r.attempts).toBe(5);
  });
});
