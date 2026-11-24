# Preserving the look

The UI was ported from one hand-written HTML page to Tailwind with **no visible change**, verified to within 1px at every size. Keep it that way. The palette, type and spacing below are the contract.

## Theme (`web/src/index.css`, `@theme`)

Tailwind's default colours and breakpoints are **removed** (`--color-*: initial`, `--breakpoint-*: initial`). Only these exist:

- **Surfaces**: `bg` (page), `raise`, `raise-2`, `sunk` (inputs), `cube-body`, `row-hover`, `row-current`, `press`, `pressed` (selected segment).
- **Lines**: `rule`, `rule-soft`, `edge`, `edge-2`, `line`, `line-2`, `line-3`, `line-dim`, `disabled`.
- **Text**: `ink` (primary), `ink-2`, `ink-3` (secondary, tertiary), `played`, `played-hover`.
- **Signals**: `accent` (amber), `accent-bg`, `accent-bg-dim`, `ok`, `bad`, `bad-edge`, `tape-parity`.
- **Stickers**: `face-u/d/f/b/r/l` (also in `FACE_COLOR` in `lib/cube.ts`).
- Plus `white`, `black`. Fonts: `font-sans` (IBM Plex Sans), `font-mono` (IBM Plex Mono). Animation: `animate-blink` (the drill's blinking target).

Dark only (`color-scheme: dark`). Sticker letters are always black.

Do not name a token `current` or `transparent`: they collide with Tailwind's own `bg-current` (that is why the row colours are `row-current` and `row-hover`).

## Type

- Write sizes in pixels: `text-[12px]`, `text-[13px]`, `text-[11.5px]`. The named sizes (`text-xs`, `text-sm`, `text-xl`) also set `line-height`, which moved layouts by 1px.
- The old CSS often left line height to `normal` for monospace text and 1.45 for body text. If an element is 1px off, add `leading-[normal]` (or the explicit value) before anything else.
- Do not rely on class order. If two utilities set the same property, split into a base that omits it.

## Breakpoints and tiers

| Tier | Condition | Tailwind |
|---|---|---|
| Phone | width < 760px | `max-md:` |
| Medium (mouse) | 760-1279px | `md:` ... `max-xl:` |
| Wide desktop | width >= 1280px | `xl:` |
| Algorithm list single column | width < 900px | `max-lg:` |
| Tablet | touch (`pointer: coarse`) and 760-1279px | `tablet:` |
| Tablet portrait / landscape | tablet and orientation | `tablet-portrait:` / `tablet-landscape:` |
| Finger-sized controls | touch and width >= 760px (includes a 12.9" iPad in landscape) | `touch:` |

The tablet variants are keyed on the **pointer**, so a narrow desktop window keeps the desktop layout and phones keep theirs. A change asked for one tier must be scoped to that tier's variant, and you then confirm the others are unchanged. Cube size is the CSS variable `--c`: 72px by default, 42px on phones, 60px on tablet portrait, and in tablet landscape it is computed from the stage's size with a container query (see `Stage.tsx`).

## Layout

`#root` is a flex column. Its height is 100% of the screen, locked to 100vh on wide desktop and 100dvh on tablet landscape so panes scroll themselves. `<header>` is the command bar; `<main>` is a CSS grid whose areas change per page (`LAYOUT` in `App.tsx`):

- Areas in use: `rail`, `stage`, `sheet`, `tabs`, `panel` (tablet landscape), `drill`, `algs`, `pairs`.
- **Solve**: wide = `rail | stage | sheet`; medium = rail beside stage over sheet; phone and tablet portrait = stage, tabs, then one section; tablet landscape = stage on the left, tabs and the chosen section on the right.
- **Letter drill**: stage + drill panel (side by side from 760px; stacked on phone and tablet portrait).
- **Algorithms / Pairs**: one full-width pane.

Section tabs (`PhoneTabs`) show on phones and tablets; `tabVisibility()` hides inactive sections there.

## UI primitives (reuse these)

- `ui/Button.tsx`: `Button` (`default`/`primary`, `md`/`sm`), `Kbd`.
- `ui/IconButton.tsx`: square icon button; larger on phone and touch.
- `ui/Segmented.tsx`: single-choice control; also exports `SEG_GROUP`, `SEG_BUTTON_BASE` for custom ones (the face picker).
- `ui/text.tsx`: `Meta`, `SectionHead`, `Bar` (pane header), `FIELD`/`INPUT`, `Badge`, `Pill`, `tokenClass` (move token colours: setup, core, undo, plain; played, now), `ALG`.
- `ui/icons.tsx`: icons as hoisted constants (create once, not per render).
- `cube/Sticker.tsx`: the one sticker element used by the 3D cube, its floating faces and the 2D net.

## Traps that already bit

- Hovering/active states must be on `enabled:` for buttons that can be disabled, or disabled buttons light up.
- Segment buttons use `aria-pressed` for the selected look (`aria-pressed:bg-pressed`), so keep that attribute accurate.
- Text that wraps differently is a layout change: long words in the pairs grid rely on `line-clamp-2` and `break-words`.
- A scroller inside a grid cell needs `min-h-0` (and `min-w-0`) on every ancestor up to `main`, or the page itself starts scrolling.
