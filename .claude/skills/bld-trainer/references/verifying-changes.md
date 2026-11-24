# Verifying a change

"It builds" is not enough here: the user judges the app by how it looks and behaves at every size. Measure, compare against the previous build, and say what you could not check.

## The basics

```bash
python3 -m unittest discover -s tests -q      # all green, no warnings
cd web && npx tsc -b                          # no type errors
npm run build --prefix web                    # builds web/dist
```

Then open the app (`bld-server` on :8000 serves `web/dist` from disk) and check the console, the network list (every request 200) and the affected pages. Judge errors by what this page load requested: the pane's console accumulates old errors across reloads.

## Sizes to check

| Device | Size | Touch emulation |
|---|---|---|
| Phone | 375x812 (`resize_window` preset `mobile`) | on (the preset emulates it) |
| Tablet portrait | 768x1024, 820x1180 | needs the snippet below |
| Tablet landscape | 1024x768, 1180x820 | needs the snippet below |
| Large tablet landscape | 1366x1024 | needs the snippet below |
| Narrow desktop window (mouse) | 1000x800, 768x1024 | none: must look like before |
| Desktop | 1400x900 | none |

Reload after each resize. Only widths under 768 get `pointer: coarse`, so for tablets copy the touch rules into plain media rules (run after load, skip the cross-origin Google Fonts sheet):

```js
const touch = () => { const walk = list => { for (let i = 0; i < list.cssRules.length; i++) { const r = list.cssRules[i];
  if (r instanceof CSSMediaRule && /pointer\s*:\s*coarse/.test(r.conditionText)) {
    list.insertRule('@media ' + r.conditionText.replace(/\(pointer\s*:\s*coarse\)\s*and\s*/, '') +
      ' {' + [...r.cssRules].map(x => x.cssText).join('\n') + '}', i + 1); i++; }
  else if (r.cssRules) walk(r); } };
  for (const sh of document.styleSheets) { try { sh.cssRules; } catch { continue; } walk(sh); }
  dispatchEvent(new Event('resize')); };
```

For each size and page, measure instead of eyeballing: no sideways page scroll (`documentElement.scrollWidth <= innerWidth`), page height equals the viewport where the page is meant to fit, the cube's extent lies inside its stage, tap targets are at least 36px on touch, and the last item of any scroller is reachable.

## Compare with the previous build (for any visual change)

Do this whenever the request says the look must not change, and whenever you edit shared UI.

1. Build the previous commit under `/prev/`:
   ```bash
   git worktree add --detach <scratch>/prev HEAD
   ln -s "$PWD/web/node_modules" <scratch>/prev/web/node_modules
   (cd <scratch>/prev/web && npx vite build --base /prev/ --outDir "$OLDPWD/web/dist/prev" --emptyOutDir)
   git worktree remove --force <scratch>/prev
   ```
   (Use your scratchpad dir; remove `web/dist/prev` afterwards.)
2. Rebuild the new app, load it, and add a hidden same-size iframe pointing at `/prev/index.html` (`position: fixed; left: -7000px`).
3. Load the same scramble in both, click the same mode button in both, and for every element that has its own text (plus every button, input and textarea) record `[x, y, width, height, fontSize, fontWeight, color]`, keyed by text and occurrence. Diff the two maps.
4. Expect **zero differences** in Solve, Letter drill, Algorithms and Pairs at every size above. A 1px difference is a real change (it has been a line-height clash every time): find it, do not wave it through.

Behaviour, not just geometry: step and scrub to several positions and compare sticker colours and letters of the net and the cube against the old page; run the recall check with a wrong, a buffer-letter and a correct answer and compare the result text; answer the drill right and wrong and check the stats; try the filters, `/`, Space, arrows, R and A-X.

## Traps in the test harness

- React inputs ignore plain `.value =`. Use the native setter (`Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(el, v)`) and dispatch a bubbling `input` event; submit with `form.requestSubmit()`.
- `onPointerLeave` is driven by `pointerout`: dispatch `pointerout` with a `relatedTarget` outside the element. A synthetic `pointerleave` does nothing.
- Synthetic pointer events make `setPointerCapture` throw "No active pointer"; that is the harness, not the app.
- If screenshots time out, the browser pane is hidden or another tab is in front: select the tab. While hidden, 120ms colour transitions never finish, so computed colours look stale.
- The Python server imports `bld/*.py` once: restart it after backend changes. Frontend changes need only a rebuild.
- The app remembers `bld.letters`, `bld.speed`, `bld.drillFaces`, `bld.drillSet` in localStorage; reset them after a test that changed them, and remove any helper keys you stored.

## Deploying (only when asked)

`./deploy.sh` needs: on `main`, clean tree, `HEAD == origin/main` (push first). It runs the tests, `npm ci` and the build, fast-forwards the clone on the droplet, rsyncs `web/dist`, restarts the `bld` service and health-checks `/` and `/api/algs`. Afterwards:

- Search the output for `warn|error|fail|deprecat` and report it plainly.
- On the droplet: `systemctl is-active bld` and `journalctl -u bld --since "-10 min"` show no errors or crashes.
- Load the live page: no console errors, every request 200, and the bundle names match the local build.
- If a deploy is interrupted, check the droplet (`git log -1` in `/opt/bld`, service state) before running it again.

## Done means

Tests, typecheck and build pass; affected pages checked at phone, tablet and desktop sizes; old-vs-new comparison clean for visual changes; nothing committed, pushed or deployed that was not asked for; and the summary states what was verified and what was not (no real device, for example).
