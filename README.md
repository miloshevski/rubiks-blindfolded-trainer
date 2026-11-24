# Blindfold Trainer

A local-first 3×3 blindfold trainer using M2 edges and Old Pochmann corners. The Python engine owns the verified algorithms, Speffz mapping, deterministic tracing and solution checks. React provides lessons, practice, cube playback, personal mnemonic dictionaries and timing.

## Run locally

Requires Python 3 and a current Node.js release compatible with the pinned frontend dependencies.

```sh
npm ci --prefix web
npm run --prefix web dev
```

Vite starts the Python API automatically. Open the address Vite prints, normally `http://localhost:5173`.

For the production build and offline installation:

```sh
npm run --prefix web build
python3 -m bld.server 8000
```

Open `http://localhost:8000`. Service workers work on localhost or HTTPS. All application routes have direct URL support. Public canonical URLs and a sitemap are generated only when `VITE_PUBLIC_ORIGIN` is set to the intended public origin at build time. No hosting changes are made by the build.

## Features

- Home and optional onboarding; ten interactive lessons with verified examples and saved completion.
- Sticker recognition, reverse recognition, mnemonic flashcards, tracing, algorithm recall, special cases, sequence recall and guided solves.
- Per-item review scheduling and practice history. Review stages are 1, 3, 7, 14 and 30 days: Again resets; Hard retains; Good advances one; Easy advances two.
- Editable 576-pair dictionaries, alternatives, primary-word selection, favorites, weak-pair filtering, JSON/CSV exchange and memo stories. Named dictionaries remain attached to their lettering scheme.
- Independently hidden memo/algorithms, progressive hints, buffer/target and mistake marks, shareable scrambles, retry and keyboard playback.
- A random-state timer powered by a pinned `cubing` dependency, with keyboard and pointer hold/release, optional memo split, confirmation, penalties, manual entry, sessions, failure classification and CSV export.
- Session statistics, time trends, lesson progress and weak-item review. +2 adds 2000 ms to total; DNF is unsuccessful and makes a containing mean of three DNF. Missing splits remain absent.
- Versioned IndexedDB persistence, complete backup/restore, scoped resets, custom lettering, sticker cues, colorblind-friendly colors and reduced motion.
- Installable offline shell, bundled fonts, tutorials, fixtures, dictionaries, reference algorithms and timer generation. Full arbitrary solving/checking requires Python; the last ten loaded solutions are available offline by exact scramble and parity.

The interface retains the existing IBM Plex fonts, dark neutral palette, amber accents, compact controls, cube rendering and algorithm highlighting. The existing dictionary file is the shipped default; personal edits are stored separately.

## Data and privacy

There are no accounts, analytics, remote synchronization or hosted community services. Local data belongs to the browser profile and origin; changing either creates a separate dataset. Export backups from Settings before moving between origins. Feedback remains a local draft and can be downloaded; it is never submitted automatically.

On first launch, existing `bld.*` localStorage preferences are copied into IndexedDB without deleting the source. Backup restoration validates the entire snapshot before writing. Dictionary import validates all rows and previews changes before merging; replacement is explicit. Storage failures leave current work available in memory and display a backup prompt.

## Verification and resource generation

```sh
python3 -m unittest discover -s tests -q
npm run --prefix web test
npm run --prefix web build
npx --prefix web playwright install chromium
npm run --prefix web test:e2e
```

The browser suite starts a temporary Python server on port 8017. It covers onboarding, lesson progress, dictionary persistence, custom lettering, memo/execution separation, timer recovery, offline operation, stale requests, backups and responsive layouts at 390, 820 and 1440 pixels.

Regenerate bundled lesson examples, orientation/cycle exercises and algorithm tables after an intentional engine change:

```sh
python3 scripts/generate_resources.py
```

Generation rejects unverified examples. Tests compare generated states against Python and the independent browser simulator, including every playback frame and both parity choices. Algorithm tables themselves are unchanged by this roadmap implementation.

## API additions

Existing fields and endpoints are retained. `/api/cube` adds structured steps with phase, original memo target, execution target, setup, full algorithm, cycle-break flag, frame offset and stable face/index sticker IDs. Frames include a step index to distinguish repeated adjacent targets.

`/api/check` adds exact remaining `wrong_stickers`. `/api/state?scramble=...` returns facelets without solution information. `/api/algorithm-check?kind=edges&letter=B&algorithm=...` compares full cube effects, so equivalent move sequences are accepted. APIs always use canonical Speffz labels; custom lettering is translated at the UI boundary.

Accounts, hosted community, Stackmat, additional BLD methods and public deployment remain outside this local release.
