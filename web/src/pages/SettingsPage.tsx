import { useState } from 'react';
import { Page, FIELD, ROW } from '../components/local/Page';
import { Button } from '../components/ui/Button';
import {
  ABC,
  flushLocal,
  download,
  id,
  initialData,
  replaceLocal,
  updateLocal,
  useLocal,
  validateBackup,
  validateScheme,
  type LocalData,
} from '../lib/local';
export default function SettingsPage() {
  const { data } = useLocal();
  const [backup, setBackup] = useState<LocalData | null>(null),
    [error, setError] = useState(''),
    [name, setName] = useState(''),
    [edges, setEdges] = useState(ABC),
    [corners, setCorners] = useState(ABC);
  const [resetScope, setResetScope] = useState('practice');
  function activate(key: string) {
    updateLocal((d) => {
      d.activeScheme = key;
      const existing = d.dictionaries.find((x) => x.scheme === key);
      if (existing) d.activeDictionary = existing.id;
      else {
        const k = id();
        d.dictionaries.push({
          id: k,
          name: 'My dictionary',
          language: 'English',
          scheme: key,
          entries: {},
        });
        d.activeDictionary = k;
      }
    });
  }
  return (
    <Page title="Settings and local data">
      <p className="m-0 text-ink-2">
        Your dictionaries, progress, stories and sessions stay in this browser. Export a backup to
        transfer them or protect against browser data removal. No account or analytics is required.
      </p>
      <h2 className="m-0 text-[15px]">Appearance and controls</h2>
      <div className={ROW}>
        {[
          ['appearance.cues', 'Face-letter sticker cues'],
          ['appearance.colorblind', 'Colorblind-friendly stickers'],
          ['appearance.motion', 'Reduce motion'],
        ].map(([key, label]) => (
          <label key={key}>
            <input
              type="checkbox"
              checked={data.preferences[key] === 'true'}
              onChange={(e) =>
                updateLocal((d) => {
                  d.preferences[key] = String(e.target.checked);
                })
              }
            />{' '}
            {label}
          </label>
        ))}
      </div>
      <h2 className="m-0 text-[15px]">Lettering schemes</h2>
      <p className="m-0 text-ink-3">
        Enter the display labels corresponding to canonical A–X, separately for edges and corners.
        Each must be a complete A–X permutation. Dictionaries remain attached to their scheme.
      </p>
      <div className={ROW}>
        <select
          aria-label="Active lettering scheme"
          className={FIELD}
          value={data.activeScheme}
          onChange={(e) => activate(e.target.value)}
        >
          {data.schemes.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>
      <form
        className="flex flex-col items-start gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!validateScheme(edges) || !validateScheme(corners)) {
            setError('Both schemes must contain A–X exactly once.');
            return;
          }
          const key = id();
          updateLocal((d) => {
            d.schemes.push({ id: key, name: name.trim(), edges, corners });
          });
          activate(key);
          setName('');
          setError('');
        }}
      >
        <input
          aria-label="Scheme name"
          placeholder="Scheme name"
          required
          className={FIELD}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <label>
          Edges{' '}
          <input
            aria-label="Edge lettering permutation"
            className={`${FIELD} font-mono`}
            value={edges}
            onChange={(e) => setEdges(e.target.value.toUpperCase())}
          />
        </label>
        <label>
          Corners{' '}
          <input
            aria-label="Corner lettering permutation"
            className={`${FIELD} font-mono`}
            value={corners}
            onChange={(e) => setCorners(e.target.value.toUpperCase())}
          />
        </label>
        <Button type="submit">Save new scheme</Button>
      </form>
      <h2 className="m-0 text-[15px]">Backup and restore</h2>
      <div className={ROW}>
        <Button onClick={() => download('bld-backup.json', JSON.stringify(data, null, 2))}>
          Export all local data
        </Button>
        <label>
          Restore backup{' '}
          <input
            aria-label="Restore backup"
            type="file"
            accept=".json"
            onChange={async (e) => {
              try {
                const file = e.target.files?.[0];
                if (file) {
                  setBackup(validateBackup(JSON.parse(await file.text())));
                  setError('');
                }
              } catch (ex) {
                setError(String(ex));
              }
              e.target.value = '';
            }}
          />
        </label>
      </div>
      {backup && (
        <div className={ROW}>
          <span>
            Restore preview: {backup.dictionaries.length} dictionaries, {backup.solves.length}{' '}
            solves, {backup.attempts.length} practice answers. Replaces current local data.
          </span>
          <Button
            onClick={async () => {
              try {
                replaceLocal(backup);
                await flushLocal();
                setBackup(null);
                location.reload();
              } catch (e) {
                setError(String(e));
              }
            }}
          >
            Restore this backup
          </Button>
          <Button onClick={() => setBackup(null)}>Cancel</Button>
        </div>
      )}
      <div className={ROW}>
        <select
          aria-label="Data to reset"
          className={FIELD}
          value={resetScope}
          onChange={(e) => setResetScope(e.target.value)}
        >
          {['practice', 'lessons', 'dictionary', 'timer', 'all'].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <Button
          onClick={() => {
            if (
              !window.confirm(`Reset ${resetScope} data? This cannot be undone without a backup.`)
            )
              return;
            if (resetScope === 'all') replaceLocal(initialData(false));
            else
              updateLocal((d) => {
                if (resetScope === 'practice') {
                  d.attempts = [];
                  d.reviews = {};
                  d.sequence = null;
                }
                if (resetScope === 'lessons') d.lessons = [];
                if (resetScope === 'dictionary')
                  d.dictionaries.find((x) => x.id === d.activeDictionary)!.entries = {};
                if (resetScope === 'timer') {
                  d.solves = [];
                  d.pending = null;
                }
              });
          }}
        >
          Reset selected data
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-bad">
          {error}
        </p>
      )}
      <h2 className="m-0 text-[15px]">Feedback draft</h2>
      <textarea
        aria-label="Feedback draft"
        className={`${FIELD} min-h-24`}
        value={data.feedback}
        onChange={(e) =>
          updateLocal((d) => {
            d.feedback = e.target.value;
          })
        }
        placeholder="Describe an incorrect mnemonic, algorithm, or bug…"
      />
      <div className={ROW}>
        <Button
          onClick={() =>
            download(
              'bld-feedback.json',
              JSON.stringify(
                {
                  version: 1,
                  feedback: data.feedback,
                  at: new Date().toISOString(),
                  userAgent: navigator.userAgent,
                  online: navigator.onLine,
                  counts: { solves: data.solves.length, attempts: data.attempts.length },
                },
                null,
                2,
              ),
            )
          }
        >
          Download feedback report
        </Button>
        <span className="text-ink-3">Download only; nothing is submitted.</span>
      </div>
      <details>
        <summary>References and verification</summary>
        <p>
          Solutions are independently executed on a fresh scrambled cube by the Python engine.
          Custom labels affect display and input only. Offline examples and algorithms are generated
          from that same engine.
        </p>
        <a className="text-accent" href="https://www.speedsolving.com/wiki/index.php/M2/R2">
          M2 reference
        </a>{' '}
        ·{' '}
        <a
          className="text-accent"
          href="https://www.speedsolving.com/wiki/index.php/Classic_Pochmann"
        >
          Old Pochmann reference
        </a>
      </details>
      <details>
        <summary>Changelog</summary>
        <p>
          Local trainer: editable dictionaries, lessons, practice, timed sessions, statistics,
          shareable scrambles, backups and offline resources.
        </p>
      </details>
    </Page>
  );
}
