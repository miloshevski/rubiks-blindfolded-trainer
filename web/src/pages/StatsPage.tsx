import { useState } from 'react';
import { Page, FIELD } from '../components/local/Page';
import { useLocal } from '../lib/local';
import { adjusted, formatTime, statistics } from '../lib/timing';
export default function StatsPage() {
  const { data } = useLocal();
  const [session, setSession] = useState('all');
  const rows = data.solves.filter((s) => session === 'all' || s.session === session);
  const s = statistics(rows);
  const weak = Object.entries(data.reviews)
    .sort((a, b) => a[1].correct / a[1].attempts - b[1].correct / b[1].attempts)
    .slice(0, 12);
  const trend = [...rows].sort((a, b) => a.at - b.at).slice(-30);
  const max = Math.max(1, ...trend.map((x) => adjusted(x) ?? 0));
  const labelFor = (key: string) => {
    const [schemeId, mode, context, ...item] = key.split(':');
    const schemeName = data.schemes.find((s) => s.id === schemeId)?.name ?? 'Lettering';
    const dictionaryName = data.dictionaries.find((d) => d.id === context)?.name;
    return `${mode.replaceAll('-', ' ')} · ${dictionaryName ?? context} · ${item.join(' ').replaceAll('-', ' ')} (${schemeName})`;
  };
  return (
    <Page title="Statistics">
      <label>
        Session{' '}
        <select className={FIELD} value={session} onChange={(e) => setSession(e.target.value)}>
          <option value="all">All sessions</option>
          {data.sessions.map((x) => (
            <option key={x.id} value={x.id}>
              {x.name}
            </option>
          ))}
        </select>
      </label>
      <dl className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {Object.entries({
          Attempts: s.attempts,
          Successful: s.successes,
          DNFs: s.dnfs,
          'Success rate': s.rate === null ? '—' : `${Math.round(s.rate * 100)}%`,
          'Personal best': s.best === null ? '—' : formatTime(s.best),
          'Successful mean': s.mean === null ? '—' : formatTime(s.mean),
          'Latest mean of 3': s.mo3 === undefined ? '—' : formatTime(s.mo3),
          'Best mean of 3': s.bestMo3 === undefined ? '—' : formatTime(s.bestMo3),
          'Mean memo': s.memo === null ? '—' : formatTime(s.memo),
          'Mean execution': s.execution === null ? '—' : formatTime(s.execution),
          'Lessons complete': `${data.lessons.length}/10`,
          'Practice accuracy': data.attempts.length
            ? `${Math.round((data.attempts.filter((a) => a.ok).length / data.attempts.length) * 100)}%`
            : '—',
        }).map(([label, value]) => (
          <div key={label}>
            <dt className="text-ink-3">{label}</dt>
            <dd className="m-0 font-mono text-[24px]">{value}</dd>
          </div>
        ))}
      </dl>
      <h2 className="m-0 text-[15px]">Recent solve trend</h2>
      <div
        className="flex h-40 items-end gap-1 border-b border-rule"
        role="img"
        aria-label="Last thirty solves, oldest first. Detailed values follow."
      >
        {trend.map((x) => (
          <div
            key={x.id}
            title={`${new Date(x.at).toLocaleString()} · ${formatTime(adjusted(x))}`}
            className={`min-w-1 flex-1 ${x.penalty === 'DNF' ? 'bg-bad' : 'bg-accent'}`}
            style={{
              height: `${adjusted(x) === null ? 10 : Math.max(2, (adjusted(x)! / max) * 100)}%`,
            }}
          />
        ))}
      </div>
      <details>
        <summary>Trend values</summary>
        <ul>
          {trend.map((x) => (
            <li key={x.id}>
              {new Date(x.at).toLocaleString()} · {formatTime(adjusted(x))}
            </li>
          ))}
        </ul>
      </details>
      <p className="m-0 text-ink-3">
        Successful summaries include +2 penalties. A mean of three containing a DNF is DNF. Missing
        memo splits are excluded from memo/execution summaries.
      </p>
      <h2 className="m-0 text-[15px]">Items to review</h2>
      <ul className="m-0">
        {weak.map(([key, r]) => (
          <li key={key} className="font-mono">
            {labelFor(key)} · {r.correct}/{r.attempts} correct · due{' '}
            {new Date(r.due).toLocaleDateString()}
          </li>
        ))}
      </ul>
    </Page>
  );
}
