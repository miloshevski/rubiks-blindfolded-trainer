# BLD Trainer — Product Vision and Development Roadmap

## 1. Product vision

Build a production-quality interactive learning, practice and solving platform for the blindfold cubing community. Start with M2 edges and Old Pochmann corners. Serve complete beginners, developing blindfold solvers and experienced cubers.

The core differentiator is the integration of interactive cube visualization, verified solutions, structured tutorials, personal mnemonic dictionaries, targeted practice, timing and post-solve analysis.

## 2. Navigation and information architecture

- **Home:** introduction, feature overview, recommended next steps and learning progress.
- **Learn:** structured interactive tutorials.
- **Practice:** targeted drills and flashcards.
- **Solver:** existing interactive M2 + Old Pochmann solver.
- **Letter Pairs:** personal mnemonic dictionary.
- **Timer:** timed blindfold solves and sessions.
- **Statistics:** performance, progress and solve history.
- **Settings:** appearance, lettering, controls, timing and preferences.

## 3. Visual design and UX

Create a distinctive, human-designed technical tool rather than a generic AI dashboard. Use deliberate typography, compact controls, strong hierarchy, neutral colors, restrained accents and subtle borders. Avoid gradients, glassmorphism, excessive cards, decorative icons, glow and oversized rounded corners.

- Make the interactive 3D cube prominent and the 2D net readable.
- Use available desktop width effectively and reduce unnecessary scrolling.
- Keep algorithms aligned in monospace typography; preserve existing M2 and Altered Y permutation highlighting.
- Clearly distinguish edges, corners, memo, parity and verification status.
- Keep cube controls near the visualization.
- Support responsive layouts, touch controls, keyboard navigation, visible focus states, accessible contrast and colorblind-friendly sticker options.
- Preserve existing solver behavior and algorithms during frontend redesign.
- Review full-page mockups before committing to a major redesign.

## 4. Landing page and onboarding

Explain what blindfold cubing is, what the platform does and how to get started. Show an interactive demonstration rather than overwhelming visitors with algorithms.

Offer three entry paths:

1. Complete beginner: knows how to solve a cube but has never tried BLD.
2. Learning BLD: knows the basics but needs help with memo or execution.
3. Experienced cuber: wants practice, scramble analysis and timing.

Recommend the relevant learning path or open the desired tool immediately. Do not require registration to try the application. Allow users to skip onboarding and resume learning later.

## 5. Interactive learning academy

Each lesson should include a concise explanation, interactive cube demonstration, guided exercise, knowledge check and saved completion progress.

| Lesson | Content |
|---|---|
| Introduction to BLD | Memorization versus execution; prerequisites and method overview |
| Speffz lettering | Identify all edge and corner sticker positions |
| Buffers and targets | Understand buffers, target stickers and piece tracing |
| Old Pochmann corners | Setup moves, Altered Y permutation and inverse setups |
| M2 edges | Setup moves, M2 execution and inverse setups |
| M2 special cases | Even-position C/W and I/S substitutions |
| Cycle breaks | Trace disconnected cycles |
| Orientation cases | Flipped edges and twisted corners |
| Parity | Recognize and resolve method-specific parity |
| First complete solve | Guided memorization and execution from a real scramble |

Provide contextual hints, a glossary, replayable demonstrations and links to relevant practice drills. Validate method-specific tutorial examples against the solver and reliable method references before publication.

## 6. Practice modes

- **Letter recognition:** highlight a sticker and ask for its letter; optionally reverse the exercise.
- **Letter-pair recall:** show a pair and recall its mnemonic, or show the mnemonic and recall the pair.
- **Memo tracing:** follow the buffer and identify the next target without revealing the full memo.
- **Algorithm recall:** practice individual edge and corner targets, including setup and inverse setup moves.
- **Special cases:** isolate parity, cycle breaks, flipped edges, twisted corners and M2 substitutions.
- **Memo recall:** display a sequence, hide it and ask the user to reproduce it.
- **Guided full solve:** progressively reveal hints rather than the complete answer.

Support configurable difficulty, exercise length, accuracy tracking and spaced repetition weighted toward weak letters, pairs and algorithms.

## 7. Letter-pair dictionary

Create a 24 × 24 matrix covering all 576 ordered Speffz pairs (AA–XX), including repeated letters. Rows represent the first letter and columns the second.

Each pair maps to one or two intuitive mnemonic words. Prioritize familiar characters, animals, actions, physical objects, food and vehicles that combine naturally into vivid stories. Prefer recognizable single words with letters in the correct order; use two-word phrases where needed. Avoid obscure vocabulary, abstract concepts and overly similar images.

Examples: MO → Monkey; CL → Clown; HI → Hippo; EF → Elf; BO → Boxer; SA → Samurai; GN → Gnome; RJ → Red Jacket.

Suggested representation:

```json
{
  "MO": ["Monkey", "Monster"],
  "CL": ["Clown", "Claw"],
  "RJ": ["Red Jacket"]
}
```

Features:

- Search and filter the matrix; edit individual cells.
- Ship a complete default dictionary, with personal overrides and alternatives.
- Support multiple languages, favorites, weak-pair tracking and reset-to-default.
- Import and export JSON/CSV dictionaries.
- Integrate dictionary words into generated edge and corner memo sequences.
- Provide a story builder using the user's chosen words; allow manual story editing.
- Offer flashcards and spaced repetition.
- Keep mnemonic words separate from actual execution targets; M2 substitutions must not change the memo letters.

The previously brainstormed 576-word dictionary is a starting dataset, not a validated universal mnemonic system. Review weak associations, particularly Q, U and X pairs, with real users.

## 8. Solver improvements

Retain the existing scramble input, Apply and Random Scramble controls, parity selection, 2D net, interactive 3D cube, exploded sticker effect, letter overlays, absolute/relative lettering modes, solve simulation, memo checking and verified algorithm output.

Add or refine:

- Step-by-step playback, previous/next move, pause and adjustable speed.
- Highlight active buffer and target stickers.
- Hide/reveal memo and algorithms independently.
- Progressive hints and visual mistake analysis showing remaining unsolved pieces.
- Shareable scramble URLs and retry functionality.
- Custom lettering schemes, with consistent mapping throughout the application.
- Keyboard shortcuts and contextual help.
- Clear invalid-scramble and incorrect-memo feedback.

## 9. BLD timer

Build a dedicated, distraction-free timer inspired by csTimer, integrated with the existing solver.

### Interface

Display the current 3×3 scramble, its accurate 2D cube net, a large timer, session selector, solve history and compact statistics. Offer fullscreen mode and mobile touch controls.

### Timing state machine

| State/action | Behavior |
|---|---|
| Idle | Show current scramble and timer |
| Hold Space | Show red/not-ready state |
| Hold for configurable threshold (suggested 300 ms) | Show green/ready state |
| Release before ready | Return to idle without starting |
| Release when ready | Start timing |
| Optional memo split | Record memo duration while total timer continues |
| Stop keypress | Stop timer and capture result |
| Result confirmation | Save OK, +2 or DNF and generate next scramble |

Support standard start/stop mode and optional memo/execution split mode. In split mode, a deliberate input records memo completion and the next input stops the solve. Prevent key-repeat events from triggering multiple transitions; avoid accidental timer activation while typing in inputs. Use a monotonic high-resolution clock. Do not reveal solution information during timed attempts.

### Features

- Proper random-state 3×3 scramble generation and accurate matching 2D visualization.
- Separate memo, execution and total durations where split mode is enabled.
- Configurable hold duration, keyboard controls and mobile press/hold/release controls.
- OK, +2 and DNF results; allow result correction and manual time entry.
- Session creation, renaming, selection and solve history.
- Personal best, mean of 3, success rate and DNF statistics; document penalty handling.
- Automatic local persistence and CSV export.
- Optional Stackmat support in a later release.

### Post-solve analysis

Each recorded attempt retains its exact scramble. Provide Analyze Solve, Retry Scramble and Review Memo actions. Analyze Solve opens the existing solver with the recorded scramble and lets users inspect the memo, algorithms and possible errors. Let users classify failures as memo mistakes, execution mistakes, parity mistakes or other causes.

## 10. Statistics and progress

Track total attempts, successful solves, DNFs, success rate, personal bests, mean of 3, memo and execution times, learning progress, drill accuracy and weak mnemonic pairs. Show trends over time and per-session statistics. Avoid presenting missing memo splits as zero-duration measurements.

## 11. Production-quality experience

- **Persistence:** save preferences, dictionaries, learning progress and sessions locally; optional accounts and cross-device synchronization later.
- **Performance:** fast initial loading, smooth 3D rendering and lazy loading where appropriate.
- **Offline:** consider PWA support for tutorials, drills, dictionary and timer.
- **Accessibility:** keyboard-first interaction, touch-friendly controls, readable text and non-color-only status indicators.
- **Reliability:** test solver correctness, scramble visualization, timer transitions, data persistence and import/export validation.
- **Trust:** cite method references, explain verification, maintain a changelog and offer a way to report incorrect algorithms or mnemonics.
- **Feedback:** provide bug reporting and feature suggestions.
- **Privacy:** avoid mandatory accounts; explain what is stored locally and provide data export/reset controls.

## 12. Community and discovery

- Shareable scrambles and exercises.
- Community mnemonic dictionaries with import/export.
- Daily challenges and optional community features.
- Additional BLD methods only after the initial methods are polished.
- Publish useful crawlable tutorials targeting searches such as `Rubik's cube blindfold trainer`, `M2 method`, `Old Pochmann`, `3x3 blindfold solver` and `blindfold memo generator`.
- Add descriptive titles, metadata, canonical URLs, sitemap and Google Search Console.
- Share demonstrations and tutorials in relevant cubing communities without spam or paid backlink schemes.

Domain ideas: `bldtrainer.com`, `bldsolver.com`, `cubememo.com`, `bldlab.com`, `cubebld.com`, `blindcube.app`. Availability and renewal prices need checking. A keyword domain does not guarantee search ranking.

## 13. Implementation roadmap

### Phase 1 — Public launch

- [x] Polished responsive interface and navigation
- [x] Landing page and optional onboarding
- [x] Interactive beginner tutorials
- [x] Verified solver and improved playback
- [x] Customizable letter-pair dictionary
- [x] Local persistence and feedback reporting
- [x] Basic SEO, crawlable lesson summaries and configurable canonical URLs/sitemap
- [ ] Public deployment (deferred)

### Phase 2 — Daily practice

- [x] Letter recognition and memo tracing
- [x] Letter-pair flashcards and memo recall
- [x] Algorithm recall and special-case drills
- [x] Spaced repetition and learning progress

### Phase 3 — Timing and performance

- [x] BLD timer with random-state scrambles and 2D visualization
- [x] Hold/release keyboard and touch interaction
- [x] Optional memo split, penalties and session history
- [x] Statistics and CSV export
- [x] Post-solve analysis and retry integration

### Phase 4 — Community and expansion

- [x] Shareable exercises and daily challenges
- [x] Local dictionary exchange through JSON/CSV
- [ ] Hosted community dictionaries (deferred)
- [x] Offline/PWA support
- [ ] Optional accounts and synchronization
- [ ] Stackmat support and additional methods

## 14. Implementation guardrails

Reuse the existing frontend and solver architecture where practical. Do not rewrite verified algorithms merely to implement UX changes. Keep solver, mnemonic, tutorial and timer responsibilities separate while sharing the same cube model and scramble representation. Add regression tests before changing existing behavior.

This document consolidates the brainstorming into a proposed roadmap. Priorities, timing defaults and navigation are recommendations rather than finalized requirements. The current codebase, competitor features, algorithm correctness and domain availability have not been independently audited.

## 15. Local release implementation status

Implemented the agreed local-first release while retaining the existing visual tokens, cube renderer, algorithm highlighting and verified algorithm tables. The existing uncommitted `VT` dictionary edit is preserved. Added named personal dictionaries and backups, ten lessons, practice/review modes, custom lettering, solver hints/sharing, random-state timing, sessions/statistics, and offline resources. Feedback remains a downloadable local draft.

Validation: 57 Python tests, 19 frontend unit tests, 10 browser acceptance tests, and a production build pass. Browser checks cover 390/820/1440-pixel layouts, timer recovery, custom lettering, original memo versus execution targets, stale requests, backup restoration and offline use. Offline resources are generated by `python3 scripts/generate_resources.py` and checked against the authoritative engine. See `README.md` for local setup, data formats and API additions.

Full arbitrary solving/checking continues to require the Python server. Offline users can revisit the last ten loaded solutions by exact scramble and parity. Accounts, synchronization, hosted community, Stackmat, additional methods, domain acquisition and public deployment remain deferred. English lessons ship with support for named user dictionaries in any language.
