---
name: bld-trainer
description: How the Blindfold Trainer app in this repo works (Python cube server in bld/, React + Vite + Tailwind frontend in web/) and how to add features without changing existing behaviour or looks. Use this whenever you touch this repo, for any of its pages (Solve, Letter drill, Algorithms, Pairs), a new page or UI control, an /api endpoint, cube or method logic, phone/tablet/desktop layout, Tailwind classes, tests or deploying. Read it before editing, even for a small UI tweak, because the layout and spacing are measured to the pixel.
---

# Blindfold Trainer

## What the app is

A trainer for **blindfolded 3x3 solving** with the **M2 (edges) + Old Pochmann (corners)** method and **Speffz lettering**. You give it a scramble (or ask for a random one) and it shows the memo letters, the full solution as one algorithm per target letter, and plays the solution on a 3D cube. It also checks a solution you typed from memory, drills you on sticker letters, lists every algorithm, and shows a 24x24 letter-pair dictionary.

The user is a blindfold cuber building this for their own practice. **They care about two things above all: nothing that works may stop working, and the look must not drift.** Treat both as hard requirements, not preferences.

## Where the logic lives

**Python does all cube logic; React only presents it.** The browser never solves a cube. Do not copy method data or cube rules into the frontend; add them to Python and expose them through the API.

| Area | Files | Job |
|---|---|---|
| Method data | `bld/constants.py` | All hardcoded method data (setups, special algorithms, buffers, parity), transcribed from `RUBIKS_SKILL.md` |
| Cube | `bld/cube.py`, `bld/render.py` | State, moves, scrambles; facelet strings and sticker letters |
| Method | `bld/method.py`, `bld/solver.py` | Builds algorithm tables; solves; memo; `verify` |
| Practice | `bld/practice.py` | Runs the user's typed letters and says what is wrong |
| API | `bld/api.py`, `bld/server.py` | `api.py`: pure payload builders and the `API` table. `server.py`: HTTP, serves `web/dist`, `APP_ROUTES` |
| Frontend logic | `web/src/lib/*` | Pure functions, no React (cube geometry, rotation maths, solution parsing, drill picking, API calls, route) |
| Frontend state | `web/src/hooks/*` | Playback, drill, view rotation, recall check, algorithm list, stored settings |
| Frontend UI | `web/src/components/{ui,header,cube,solve,drill,algs,pairs}` | Rendering only |
| Theme | `web/src/index.css` | Tailwind tokens, breakpoints, tablet variants |
| Static data | `web/src/data/letter-pairs.json` | The 576 pair words |

Endpoints: `/api/cube?scramble=&seed=&parity=1|2` (scramble, facelets, letters, memo, solution text, `verified`, and one `frame` per move), `/api/check?...` (typed solution), `/api/algs`. Errors are `{"error": "..."}` with a 4xx status.

`RUBIKS_SKILL.md` is the written source of truth for the method (and the `m2-old-pochmann-understanding` skill explains it). `tests/test_method.py` checks the tables against it.

## Vocabulary you will meet

- **Speffz letters** A-X, four per face in the order **U L F R B D** (A-D on U, E-H on L, I-L on F, M-P on R, Q-T on B, U-X on D). **Absolute** lettering = the letter of a *position*; **relative** = the letter of the *physical sticker* now there.
- **Buffers**: edges K/U (the DF edge), corners A/E/R (the UBL corner). They have no algorithm.
- **Target**: one letter you swap into the buffer. Algorithm = **setup + core + undo** (core is `M2` for edges, the Y-perm for corners). C, I, Q, S, W, A are dedicated edge algorithms, not setup+M2+undo.
- **Memo**: target letters in pairs. **Parity**: an odd edge count adds a parity algorithm (alg 1 or 2).
- **Even-target substitution**: on even-numbered edge targets execute the opposite letter, C<->W and I<->S ("executed as").
- **Face strings**: each face is 9 characters, row*3+col; face order in code is `URFDLB`. `pos` in the player = moves applied so far (0 = scrambled).
- **Mode = page**: Solve, Letter drill, Algorithms, Pairs. In code `AppMode` is `'solve' | 'drill' | 'algs' | 'pairs'`; each has a URL slug (`MODE_PATH` in `web/src/lib/route.ts`, `APP_ROUTES` in `bld/server.py`).

## Commands

```bash
python3 -m bld.server            # API + built app on :8000 (restart after any bld/*.py change)
npm install --prefix web && npm run build --prefix web   # build web/dist (typecheck included)
npm run dev --prefix web         # Vite on :5173, forwards /api to :8000
python3 -m unittest discover -s tests -q                 # Python tests
cd web && npx tsc -b             # typecheck only
./deploy.sh                      # build, ship to the droplet; only when the user asks
```

`.claude/launch.json` has `bld-server` and `web-dev` entries for the preview tools. The server reads `web/dist` from disk on every request, so a rebuild is enough for frontend changes.

## The preservation contract

Follow these on every change. Each exists because breaking it has already happened or would be easy to do silently.

1. **Change only what was asked.** If asked about tablets, phones and desktop must come out identical; scope classes to the tier (see `references/preserving-looks.md`). Do not tidy unrelated code, rename things, or "improve" spacing.
2. **Reuse, don't reinvent.** Use the `components/ui` primitives (`Button`, `IconButton`, `Segmented`, `Bar`, `SectionHead`, `Meta`, `Badge`, `Pill`, `FIELD`/`INPUT`, `tokenClass`, icons) and the theme tokens. A new control that looks 1px different is a regression.
3. **Tokens only.** The theme resets Tailwind's default colours and breakpoints, so `text-red-500` or `sm:` do not exist. Use `text-ink-3`, `bg-raise`, `border-rule`, `text-accent`, and so on. Never invent a hex value; if a new shade is truly needed, add a token to `index.css`.
4. **Pixel font sizes.** Write `text-[12px]`, not `text-xs`/`text-sm`: Tailwind's size names also set a line height and shifted layouts by 1px. Where the old design inherited line height, add `leading-[normal]`.
5. **No conflicting utilities on one element.** Tailwind resolves a clash by stylesheet order, not class order. Build variants from a base that leaves the contested property out (`FIELD` has no right padding; `INPUT` adds it; `SEG_BUTTON_BASE` vs `SEG_BUTTON`).
6. **Logic out of components.** Pure functions go in `lib/`, state and side effects in `hooks/`, components render. High-frequency values (cube rotation, drill settings) live in refs written to the DOM, not in state.
7. **Performance rules already in force** (Vercel React best practices): lazy-load rare or heavy pages with `lazy()` (as `PairsPanel`), memoize list rows on primitive props, hoist static JSX, `useLatest` for global listeners, keep global listeners to one.
8. **Pages never scroll as a whole.** `#root` is a flex column and each pane scrolls inside itself; confirm `document.documentElement.scrollHeight === innerHeight` after a layout change.
9. **Don't add dependencies lightly.** There is deliberately no router library (`route.ts` is ~35 lines), no CSS files besides `index.css`, no inline styles except genuinely dynamic values (colours, transforms, flex-grow).
10. **Never touch the user's uncommitted files** and do not commit, push or deploy unless asked. `web/dist` and `node_modules` are gitignored. Commit subjects in this repo are short, lowercase and imperative ("add letter pairs").

## Recipes

**Add a page (mode).** This is how Pairs was added; touch all of these:
1. `AppMode` in `web/src/lib/types.ts`.
2. `MODE_PATH` in `web/src/lib/route.ts`, and `APP_ROUTES` in `bld/server.py` (a test in `tests/test_server.py` loops over `APP_ROUTES`).
3. `MODES` in `components/header/Header.tsx`. Keep the label to one short word: four buttons end at 285px on a 375px phone.
4. `LAYOUT` in `App.tsx`: one entry with `grid-cols` and `grid-template-areas`, plus the render branch inside `<main>`. Hide the cube stage for modes that have none, and add the mode's keys in the `onKey` handler.
5. A folder `components/<mode>/` whose root is `<section className="flex min-h-0 min-w-0 flex-col [grid-area:<mode>]">` with a `Bar`, and a scroller `flex-[1_1_auto] overflow-auto`.
6. Rare or large page: `lazy(() => import(...))` inside `Suspense`, mounted only while active (do not wrap it in `Activity`, which pre-renders and defeats the lazy load). Static data goes in `web/src/data/*.json`.

**Add data or behaviour from the cube.** Add the Python (in `constants.py` / `method.py` / `api.py`) with a test, register it in `API`, add the type to `lib/types.ts` and the fetch to `lib/api.ts`, then a hook or component. Algorithm lists must come from the same tables the solver uses so they cannot drift.

**Add a UI control.** Start from `ui/` primitives, add `touch:` sizes only if the control is tapped (buttons are 36-52px on touch screens), and persist a setting with `useStoredState('bld.<name>', fallback, codec)`. Existing keys: `bld.letters`, `bld.speed`, `bld.drillFaces`, `bld.drillSet`.

**Change the 3D cube.** Cubies are CSS-transformed `div`s sized by the `--c` variable; `Cube3D` exposes `turn()` and `settle()`; the view angle is a ref in `useViewRotation`. Do not recreate cubies or move rotation into state.

## Before you say it is done

Run the Python tests, `npx tsc -b`, the build, and check the affected pages at the phone, tablet and desktop sizes with the browser tools. For anything visual, **compare against the previous build instead of eyeballing**. The method, the size list and the test-harness traps are in `references/verifying-changes.md`. Report what you checked and what you could not (for example, no real tablet).

## References

- `references/preserving-looks.md`: tokens, breakpoints and tablet variants, per-page grid, UI primitives, Tailwind traps.
- `references/verifying-changes.md`: viewport list, old-vs-new comparison, touch emulation, browser-pane quirks, deploy checks.
