import { useCallback, useEffect, useRef, useState } from 'react';
import { Page, FIELD, ROW } from '../components/local/Page';
import { Button } from '../components/ui/Button';
import { Net } from '../components/cube/Net';
import {
  adjusted,
  formatTime,
  IDLE,
  parseTime,
  statistics,
  transition,
  type TimerState,
} from '../lib/timing';
import { csv, download, id, updateLocal, useLocal, type Penalty } from '../lib/local';
import { randomStateScramble, simulate } from '../lib/simulation';
import { navigate } from '../lib/route';
import { ABSOLUTE_LETTERS } from '../lib/cube';
export default function TimerPage() {
  const { data } = useLocal();
  const [clock, setClock] = useState<TimerState>(
    data.pending
      ? { ...IDLE, phase: 'confirmation', elapsed: data.pending.ms, memo: data.pending.memo }
      : { ...IDLE },
  );
  const live = useRef(clock);
  const owner = useRef<string | null>(null);
  const [scramble, setScramble] = useState(data.pending?.scramble ?? '');
  const [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [name, setName] = useState(''),
    [manual, setManual] = useState('');
  const rawHold = Number(data.preferences['timer.hold'] ?? 300);
  const pending = data.pending,
    hold = Number.isFinite(rawHold) ? Math.max(0, Math.min(2000, rawHold)) : 300,
    split = data.preferences['timer.split'] === 'true';
  const scrambleRef = useRef(scramble);
  scrambleRef.current = scramble;
  const sessionRef = useRef(data.activeSession);
  sessionRef.current = data.activeSession;
  const [runSession] = useState(data.activeSession);
  const capturedSession = useRef(runSession);
  const locked = !['idle', 'confirmation'].includes(clock.phase);
  const generation = useRef(0);
  const fresh = useCallback(async () => {
    const request = ++generation.current;
    setBusy(true);
    setError('');
    try {
      const next = await randomStateScramble();
      if (request === generation.current) setScramble(next);
    } catch (e) {
      if (request === generation.current) setError(`Scramble generation failed: ${String(e)}`);
    } finally {
      if (request === generation.current) setBusy(false);
    }
  }, []);
  useEffect(() => {
    if (!scrambleRef.current) fresh();
    return () => {
      generation.current++;
    };
  }, [fresh]);
  const send = useCallback(
    (event: 'down' | 'up' | 'blur' | 'tick') => {
      if (!scrambleRef.current || busy) return;
      const before = live.current,
        next = transition(before, event, performance.now(), hold, split);
      if (before.phase === 'idle' && next.phase !== 'idle')
        capturedSession.current = sessionRef.current;
      live.current = next;
      setClock(next);
      if (next.phase === 'confirmation' && before.phase !== 'confirmation')
        updateLocal((d) => {
          d.pending = {
            scramble: scrambleRef.current,
            ms: next.elapsed,
            memo: next.memo,
            at: Date.now(),
            session: capturedSession.current,
          };
        });
    },
    [busy, hold, split],
  );
  useEffect(() => {
    const editable = (t: EventTarget | null) =>
      t instanceof Element && !!t.closest('input,textarea,select,button,[contenteditable="true"]');
    const down = (e: KeyboardEvent) => {
      if (
        e.code !== 'Space' ||
        e.repeat ||
        e.ctrlKey ||
        e.altKey ||
        e.metaKey ||
        e.shiftKey ||
        editable(e.target) ||
        owner.current !== null
      )
        return;
      e.preventDefault();
      owner.current = 'keyboard';
      send('down');
    };
    const up = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || owner.current !== 'keyboard') return;
      e.preventDefault();
      owner.current = null;
      send('up');
    };
    const blur = () => {
      owner.current = null;
      send('blur');
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', blur);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', blur);
    };
  }, [send]);
  useEffect(() => {
    if (!locked) return;
    let frame: number;
    const tick = () => {
      send('tick');
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [locked, send]);
  useEffect(() => {
    document.documentElement.dataset.activeTask = locked ? 'true' : 'false';
    return () => {
      delete document.documentElement.dataset.activeTask;
    };
  }, [locked]);
  const rows = data.solves
    .filter((s) => s.session === data.activeSession)
    .sort((a, b) => b.at - a.at);
  const stats = statistics(rows);
  const reset = () => {
    live.current = { ...IDLE };
    setClock({ ...IDLE });
  };
  function confirm(penalty: Penalty) {
    if (!pending) return;
    updateLocal((d) => {
      d.solves.push({ ...pending, id: id(), penalty, cause: '' });
      d.pending = null;
    });
    reset();
    fresh();
  }
  const safe = (fn: () => void) => {
    try {
      fn();
      setError('');
    } catch (e) {
      setError(String(e));
    }
  };
  return (
    <Page title="BLD timer">
      <div className={ROW}>
        <label>
          Session{' '}
          <select
            className={FIELD}
            disabled={locked || !!pending}
            value={data.activeSession}
            onChange={(e) =>
              updateLocal((d) => {
                d.activeSession = e.target.value;
              })
            }
          >
            {data.sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <input
          aria-label="Session name"
          className={FIELD}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Session name"
          disabled={locked || !!pending}
        />
        <Button
          disabled={!name.trim() || locked || !!pending}
          onClick={() => {
            updateLocal((d) => {
              const key = id();
              d.sessions.push({ id: key, name: name.trim() });
              d.activeSession = key;
            });
            setName('');
          }}
        >
          Create
        </Button>
        <Button
          disabled={!name.trim() || locked || !!pending}
          onClick={() => {
            updateLocal((d) => {
              d.sessions.find((s) => s.id === d.activeSession)!.name = name.trim();
            });
            setName('');
          }}
        >
          Rename
        </Button>
        <Button
          disabled={data.sessions.length < 2 || locked || !!pending}
          onClick={() => {
            if (confirmDelete())
              updateLocal((d) => {
                const key = d.activeSession;
                d.sessions = d.sessions.filter((s) => s.id !== key);
                d.solves = d.solves.filter((s) => s.session !== key);
                d.activeSession = d.sessions[0].id;
              });
          }}
        >
          Delete session
        </Button>
      </div>
      <div className={ROW}>
        <label>
          Hold ms{' '}
          <input
            aria-label="Hold duration"
            className={`${FIELD} w-24`}
            type="number"
            min={0}
            max={2000}
            value={hold}
            disabled={locked || !!pending}
            onChange={(e) =>
              updateLocal((d) => {
                d.preferences['timer.hold'] = String(
                  Math.max(0, Math.min(2000, Number(e.target.value))),
                );
              })
            }
          />
        </label>
        <label>
          <input
            type="checkbox"
            checked={split}
            disabled={locked || !!pending}
            onChange={(e) =>
              updateLocal((d) => {
                d.preferences['timer.split'] = String(e.target.checked);
              })
            }
          />{' '}
          Memo / execution split
        </label>
        <Button
          onClick={() => {
            if (document.fullscreenElement) document.exitFullscreen();
            else
              document.documentElement
                .requestFullscreen()
                .catch(() => setError('Fullscreen is unavailable.'));
          }}
        >
          Fullscreen
        </Button>
        <Button disabled={locked || !!pending || busy} onClick={fresh}>
          New scramble
        </Button>
      </div>
      <p className="m-0 min-h-10 font-mono text-[15px] text-ink-2">
        {busy
          ? 'Generating random-state scramble…'
          : locked
            ? 'Timed attempt in progress'
            : scramble}
      </p>
      <div className="grid items-center gap-4 md:grid-cols-[1fr_280px]">
        <div>
          <button
            type="button"
            aria-label="Press and hold to start; press to split or stop"
            className={`w-full touch-none cursor-pointer border-0 bg-transparent py-10 font-mono text-[72px] tabular-nums ${clock.phase === 'ready' ? 'text-ok' : clock.phase === 'holding' ? 'text-bad' : 'text-ink'}`}
            disabled={busy || !scramble || !!pending}
            style={{ touchAction: 'none', userSelect: 'none' }}
            onContextMenu={(e) => e.preventDefault()}
            onPointerDown={(e) => {
              if (owner.current !== null || e.button !== 0) return;
              e.preventDefault();
              e.currentTarget.setPointerCapture(e.pointerId);
              owner.current = String(e.pointerId);
              send('down');
            }}
            onPointerUp={(e) => {
              if (owner.current !== String(e.pointerId)) return;
              owner.current = null;
              send('up');
            }}
            onPointerCancel={() => {
              owner.current = null;
              send('blur');
            }}
          >
            {formatTime(clock.elapsed)}
          </button>
          <p className="m-0 text-center text-ink-3" role="status">
            {clock.phase} ·{' '}
            {split ? 'First press ends memo; second press stops.' : 'Press Space to stop.'} Hold
            Space, then release when ready.
          </p>
          {clock.memo !== null && (
            <p className="text-center">
              Memo {formatTime(clock.memo)} · Execution {formatTime(clock.elapsed - clock.memo)}
            </p>
          )}
        </div>
        {!locked && scramble && (
          <Net view={simulate(scramble)} letterMode="off" absoluteLetters={ABSOLUTE_LETTERS} />
        )}
      </div>
      {pending && (
        <div className={ROW}>
          <b>Confirm result {formatTime(pending.ms)}</b>
          {(['OK', '+2', 'DNF'] as Penalty[]).map((p) => (
            <Button key={p} onClick={() => confirm(p)}>
              {p}
            </Button>
          ))}
        </div>
      )}
      {!locked && !pending && (
        <form
          className={ROW}
          onSubmit={(e) => {
            e.preventDefault();
            safe(() => {
              const ms = parseTime(manual);
              updateLocal((d) => {
                d.pending = { scramble, ms, memo: null, at: Date.now(), session: d.activeSession };
              });
              live.current = { ...IDLE, phase: 'confirmation', elapsed: ms };
              setClock(live.current);
              setManual('');
            });
          }}
        >
          <input
            aria-label="Manual time"
            className={FIELD}
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            placeholder="Manual time, e.g. 1:25.30"
          />
          <Button type="submit" disabled={!scramble || busy}>
            Enter time
          </Button>
        </form>
      )}
      {error && (
        <p role="alert" className="text-bad">
          {error}
        </p>
      )}
      <p className="m-0">
        PB {stats.best === null ? '—' : formatTime(stats.best)} · Mean of 3{' '}
        {stats.mo3 === undefined ? '—' : formatTime(stats.mo3)} · Success{' '}
        {stats.rate === null ? '—' : `${Math.round(stats.rate * 100)}%`} · {stats.attempts} attempts
      </p>
      <div className={ROW}>
        <Button
          onClick={() =>
            download(
              'bld-solves.csv',
              csv([
                [
                  'id',
                  'session',
                  'scramble',
                  'timestamp',
                  'raw_ms',
                  'memo_ms',
                  'execution_ms',
                  'penalty',
                  'adjusted_ms',
                  'cause',
                ],
                ...rows.map((s) => [
                  s.id,
                  data.sessions.find((x) => x.id === s.session)!.name,
                  s.scramble,
                  new Date(s.at).toISOString(),
                  s.ms,
                  s.memo,
                  s.memo === null ? null : s.ms - s.memo,
                  s.penalty,
                  adjusted(s),
                  s.cause,
                ]),
              ]),
              'text/csv',
            )
          }
        >
          Export session CSV
        </Button>
        <span className="text-ink-3">
          +2 adds two seconds to total. DNF counts as an unsuccessful attempt.
        </span>
      </div>
      <div className="overflow-auto">
        <table className="w-full text-left">
          <thead>
            <tr>
              {['Time', 'Memo / exec', 'Result', 'Failure cause', 'Review'].map((h) => (
                <th className="border-b border-rule py-2 font-normal text-ink-3" key={h}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.id}>
                <td className="border-b border-rule-soft py-2 font-mono">
                  {formatTime(adjusted(s))}
                </td>
                <td>
                  {s.memo === null ? '—' : `${formatTime(s.memo)} / ${formatTime(s.ms - s.memo)}`}
                </td>
                <td>
                  <select
                    aria-label={`Penalty ${s.id}`}
                    className={FIELD}
                    disabled={locked}
                    value={s.penalty}
                    onChange={(e) =>
                      updateLocal((d) => {
                        d.solves.find((x) => x.id === s.id)!.penalty = e.target.value as Penalty;
                      })
                    }
                  >
                    {['OK', '+2', 'DNF'].map((p) => (
                      <option key={p}>{p}</option>
                    ))}
                  </select>
                </td>
                <td>
                  <select
                    aria-label={`Failure cause ${s.id}`}
                    className={FIELD}
                    disabled={locked}
                    value={s.cause}
                    onChange={(e) =>
                      updateLocal((d) => {
                        d.solves.find((x) => x.id === s.id)!.cause = e.target.value;
                      })
                    }
                  >
                    {['', 'memo', 'execution', 'parity', 'other'].map((c) => (
                      <option value={c} key={c}>
                        {c || 'Unclassified'}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <div className={ROW}>
                    <Button
                      disabled={locked || !!pending}
                      onClick={() => navigate('solve', { scramble: s.scramble })}
                    >
                      Analyze / Review memo
                    </Button>
                    <Button
                      disabled={locked || !!pending}
                      onClick={() => {
                        setScramble(s.scramble);
                        reset();
                      }}
                    >
                      Retry
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Page>
  );
}
function confirmDelete() {
  return window.confirm(
    'Delete this session and its solve history? Export a backup first if needed.',
  );
}
