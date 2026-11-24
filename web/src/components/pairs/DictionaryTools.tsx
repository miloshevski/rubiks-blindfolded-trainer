import { useState } from 'react';
import {
  csv,
  dictionary,
  download,
  entries,
  id,
  importDictionary,
  PAIRS,
  updateLocal,
  useLocal,
  type Entry,
} from '../../lib/local';
import { Button } from '../ui/Button';
import { FIELD, ROW } from '../local/Page';

export function DictionaryTools({
  selected,
  onClose,
}: {
  selected: string | null;
  onClose: () => void;
}) {
  const { data } = useLocal();
  const current = dictionary(data);
  const all = entries(data);
  const [draft, setDraft] = useState<Record<string, Entry> | null>(null);
  const [error, setError] = useState('');
  const [replace, setReplace] = useState(false);
  const [name, setName] = useState('');
  const [language, setLanguage] = useState('English');
  const [edit, setEdit] = useState<{
    key: string;
    primary: string;
    alternative: string;
    favorite: boolean;
  } | null>(null);
  const e =
    selected && edit?.key === selected
      ? edit
      : selected
        ? {
            key: selected,
            primary: all[selected].words[0],
            alternative: all[selected].words[1] ?? '',
            favorite: all[selected].favorite,
          }
        : null;
  const set = (v: typeof e) => setEdit(v);
  return (
    <div className="flex flex-col gap-2 border-b border-rule px-5 py-3">
      <div className={ROW}>
        <label>
          Dictionary{' '}
          <select
            className={FIELD}
            value={current.id}
            onChange={(ev) => {
              setEdit(null);
              updateLocal((d) => {
                d.activeDictionary = ev.target.value;
              });
            }}
          >
            {data.dictionaries
              .filter((x) => x.scheme === data.activeScheme)
              .map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name} · {x.language}
                </option>
              ))}
          </select>
        </label>
        <input
          className={FIELD}
          aria-label="Dictionary name"
          placeholder="New dictionary name"
          value={name}
          onChange={(ev) => setName(ev.target.value)}
        />
        <input
          className={`${FIELD} w-28`}
          aria-label="Dictionary language"
          value={language}
          onChange={(ev) => setLanguage(ev.target.value)}
        />
        <Button
          disabled={!name.trim() || !language.trim()}
          onClick={() => {
            updateLocal((d) => {
              const key = id();
              d.dictionaries.push({
                id: key,
                name: name.trim(),
                language: language.trim(),
                scheme: d.activeScheme,
                entries: {},
              });
              d.activeDictionary = key;
            });
            setName('');
          }}
        >
          Create
        </Button>
        <Button
          disabled={!name.trim()}
          onClick={() => {
            updateLocal((d) => {
              const x = dictionary(d);
              x.name = name.trim();
              x.language = language.trim() || x.language;
            });
            setName('');
          }}
        >
          Rename current
        </Button>
        <Button onClick={() => download('bld-dictionary.json', JSON.stringify(all, null, 2))}>
          Export JSON
        </Button>
        <Button
          onClick={() =>
            download(
              'bld-dictionary.csv',
              csv([
                ['pair', 'primary', 'alternative', 'favorite'],
                ...PAIRS.map((p) => [
                  p,
                  all[p].words[0],
                  all[p].words[1] ?? '',
                  String(all[p].favorite),
                ]),
              ]),
              'text/csv',
            )
          }
        >
          Export CSV
        </Button>
        <label className="text-[12px]">
          Import JSON/CSV{' '}
          <input
            className="max-w-48"
            type="file"
            accept=".json,.csv"
            onChange={async (ev) => {
              try {
                const file = ev.target.files?.[0];
                if (file) {
                  setDraft(importDictionary(await file.text()));
                  setError('');
                }
              } catch (ex) {
                setError(String(ex));
              }
              ev.target.value = '';
            }}
          />
        </label>
      </div>
      {draft && (
        <div className={ROW}>
          <span>
            Preview: {Object.keys(draft).length} pairs,{' '}
            {
              Object.keys(draft).filter((k) => JSON.stringify(draft[k]) !== JSON.stringify(all[k]))
                .length
            }{' '}
            changed.
          </span>
          <label>
            <input
              type="checkbox"
              checked={replace}
              onChange={(ev) => setReplace(ev.target.checked)}
            />{' '}
            Replace all overrides
          </label>
          <Button
            onClick={() => {
              updateLocal((d) => {
                const x = dictionary(d);
                x.entries = replace ? draft : { ...x.entries, ...draft };
              });
              setDraft(null);
            }}
          >
            Apply import
          </Button>
          <Button onClick={() => setDraft(null)}>Cancel</Button>
        </div>
      )}
      {e && (
        <form
          className={ROW}
          onSubmit={(ev) => {
            ev.preventDefault();
            if (!e.primary.trim()) return;
            updateLocal((d) => {
              dictionary(d).entries[e.key] = {
                words: [e.primary.trim(), e.alternative.trim()].filter(Boolean),
                favorite: e.favorite,
              };
            });
            onClose();
            setEdit(null);
          }}
        >
          <b className="font-mono text-accent">{e.key}</b>
          <input
            autoFocus
            className={FIELD}
            maxLength={100}
            required
            aria-label="Primary word"
            value={e.primary}
            onChange={(ev) => set({ ...e, primary: ev.target.value })}
          />
          <input
            className={FIELD}
            maxLength={100}
            aria-label="Alternative word"
            placeholder="Alternative"
            value={e.alternative}
            onChange={(ev) => set({ ...e, alternative: ev.target.value })}
          />
          <label>
            <input
              type="checkbox"
              checked={e.favorite}
              onChange={(ev) => set({ ...e, favorite: ev.target.checked })}
            />{' '}
            Favorite
          </label>
          <Button
            disabled={!e.alternative.trim()}
            onClick={() => set({ ...e, primary: e.alternative, alternative: e.primary })}
          >
            Use alternative first
          </Button>
          <Button type="submit">Save</Button>
          <Button
            onClick={() => {
              updateLocal((d) => {
                delete dictionary(d).entries[e.key];
              });
              setEdit(null);
              onClose();
            }}
          >
            Reset pair
          </Button>
          <Button
            onClick={() => {
              setEdit(null);
              onClose();
            }}
          >
            Cancel
          </Button>
        </form>
      )}
      {error && (
        <p role="alert" className="m-0 text-bad">
          {error}
        </p>
      )}
    </div>
  );
}
