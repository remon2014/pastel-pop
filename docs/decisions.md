# Decisions log

Significant technical decisions for Pastel Pop, newest last. Owned by the tech lead. Check this log before proposing anything that might contradict it.

**Status values**
- **Proposed:** needs the owner's approval. Not in force.
- **Tech-lead decision, pending plan approval:** architecture within the tech lead's remit. Takes effect when the owner approves `docs/foundations-plan.md`.
- **Accepted:** in force.
- **Superseded by D-xxx.**

| ID | Date | Decision | Status |
|---|---|---|---|
| D-001 | 2026-10-11 | Delete retired prototype code first | Accepted |
| D-002 | 2026-10-11 | Remove the service worker | Accepted |
| D-003 | 2026-10-11 | Logic separate from rendering, in screen-relative units, on one clamped elapsed-time loop | Accepted |
| D-004 | 2026-10-11 | One low-resolution canvas, whole-number scale, resolution as one constant | Accepted |
| D-005 | 2026-10-11 | Central effects-safety layer is the only route for effects and sound | Accepted |
| D-006 | 2026-10-11 | Dev level behind `?dev=` and `import.meta.env.DEV` | Accepted |
| D-007 | 2026-10-11 | Test runner: Node's built-in runner, no package | Accepted |
| D-008 | 2026-10-11 | Lint and format: `@biomejs/biome` | Accepted |
| D-009 | 2026-10-11 | No browser-test framework yet | Accepted |
| D-010 | 2026-11-08 | Function before look: placeholder visuals, with rules and timing kept apart from drawing | Accepted |

---

## D-001: Delete retired prototype code first

- **Date:** 2026-10-11. **Status:** Accepted (owner approved 2026-10-11).
- **Decision:** Before building foundations, delete everything the backlog lists under "Retired with the prototype", leaving a plain scene of bouncing circles that clear on a correct tap (tasks F-01, F-02). Any remaining prototype module goes in F-18.
- **Reason:** Roughly 70% of `src/` is retired (`src/particle.js` 334 lines, `src/colorManager.js` 200, `src/gameModes.js` 84, `src/leaderboard.js` 53, `src/rainEffect.js` 30, plus most of `src/game.js`). Keeping it means making retired code time-based, moving `rain.css` into the build, and linting and formatting files we then delete. The retired effects are also the ones `docs/wellbeing.md` section 4 says must not remain as built. Nothing is lost: it all stays in git history.
- **Alternatives rejected:** Replace each piece as its new system lands. Keeps the prototype playable for longer, but every foundations task has to work around dead code, and unsafe effects stay in the build until late.

## D-002: Remove the service worker

- **Date:** 2026-10-11. **Status:** Accepted (owner approved 2026-10-11).
- **Decision:** Delete `sw.js` and do not register a service worker (task F-03). Offline play comes from the Capacitor app carrying its own files.
- **Reason:** It is never registered (no `serviceWorker` reference anywhere in `src/` or `index.html`). Its cache list (`sw.js:4-15`) names dev-only source paths that do not exist in a hashed production build, a retired file, and Google Fonts. It is not copied into `dist/` today. A stale cache is a common source of "the fix did not appear" bugs.
- **Alternatives rejected:** Move it to `public/` unregistered (ships a dead file). Rewrite and register it (only useful for a website or installable web-app release, which is not in v1.0 scope; a correct one would need the hashed file list at build time).
- **Revisit if:** a web release is added to scope.

## D-003: Logic separate from rendering, screen-relative units, one clamped elapsed-time loop

- **Date:** 2026-10-11. **Status:** Accepted (plan approved by the owner 2026-10-11).
- **Decision:**
  1. One module owns `requestAnimationFrame`. It cannot run twice, passes elapsed time in seconds, and caps any single frame at a maximum (placeholder 0.1 s). Time beyond the cap is dropped, not caught up.
  2. Game state and rules live in `src/logic/` as plain data and functions with no `document`, `window`, canvas or `import.meta`. Rendering reads that state.
  3. Logic measures in play-area widths: the play area is 1.0 wide and its height is the aspect ratio. Speeds are widths per second. Pixels exist only in the renderer.
- **Reason:** Movement is per frame today (`src/circle.js:61-62`), the loop passes no elapsed time (`src/game.js:231`, `:270`), and pause then resume can start a second loop (`src/game.js:199`, `:207`). The design states speed in screen widths (GD Level tuning). Width units also make the internal resolution cheap to change (D-004) and let tests run with no browser (D-007).
- **Alternatives rejected:** A fixed logic timestep with an accumulator. More deterministic, but on 90 Hz screens it needs interpolation to avoid judder, and nothing in this game's movement (straight lines, wall bounces, timers) needs it. Revisit if circle-to-circle collisions or other stiff physics are added. Logic in internal pixels: simpler drawing, but ties every tuning value to a resolution that is still provisional.

## D-004: One low-resolution canvas, whole-number scale, resolution as one constant

- **Date:** 2026-10-11. **Status:** Accepted (plan approved by the owner 2026-10-11).
- **Decision:** The game canvas's own size is the internal resolution. `INTERNAL_WIDTH_TARGET` in `src/config.js` (placeholder 180) is the only resolution setting. The scale is the whole number of device pixels per internal pixel nearest to filling the screen width, using `devicePixelRatio`; the actual internal width and height follow from that. The canvas is stretched with CSS `image-rendering: pixelated`. Menus and HUD stay as DOM elements over the canvas.
- **Reason:** The canvas ignores `devicePixelRatio` today (`src/main.js:22-23`). A small canvas scaled by the browser is the cheapest path on low-end phones, and whole-number scaling keeps every pixel the same size (GD Look).
- **Alternatives rejected:** A full device-resolution canvas with a low-resolution buffer copied onto it each frame. It allows sprites to be placed more finely than the pixel grid, but costs a full-screen copy every frame. Kept as the fallback if `pixelated` scaling misbehaves on a target phone, or if the owner chooses smooth slow movement (plan Decision 7).
- **Unverified:** behaviour on a low-end Android WebView. Checked in F-10 and F-19.
- **Refined 2026-11-08 (F-10):** the internal size is rounded down, so the canvas may fall short of the window by under one internal pixel; it sits at the top left and the strip shows the same Dusk page background (no centring or letterbox). Play-area sizes and taps are in CSS px through the view, never `canvas.width`. Circles are drawn as whole-pixel discs, not `arc()`, because `arc()` blends edge pixels even with smoothing off. Detail in `docs/foundations-plan.md`, "F-10 refined".

## D-005: Central effects-safety layer

- **Date:** 2026-10-11. **Status:** Accepted (plan approved by the owner 2026-10-11).
- **Decision:** `src/effects/` is the only code allowed to draw a brightness change, shake, dim, wobble or pulse, to play sound, or (later) to vibrate. Features request an effect; the layer decides what happens. It enforces, from `docs/wellbeing.md` sections 4 and 6:
  - at most 3 flashes in any one second, counted across the whole screen, with pulses and bursts sharing the same budget;
  - an over-budget request is given a quieter form, never dropped silently and never queued;
  - all pulses on one shared clock, with a top rate per mode;
  - one shake at a time, never restarted or extended; none in Calm;
  - Reduce motion swaps, from one table;
  - no saturated red in any effect colour;
  - sound: separate music and effects levels, fades on music start and stop, a cap on overlapping sounds, an overall limiter;
  - time-based only.
  The rules are plain logic with tests (F-14). A dev-only meter counts flashes from the pixels actually drawn, as an independent check (F-16).
- **Reason:** There is no effects layer and no audio code today. The retired effects were each written inline (`src/game.js:138`, `:175`; `src/particle.js`), which is how limits get broken by accident.
- **Alternatives rejected:** Each feature follows the rules by hand (cannot be tested or guaranteed). Measuring pixels at run time in production (too costly on low-end phones, and too late: the flash has already been shown).
- **Open:** what the quieter form looks like, and the sound numbers, are for the wellbeing advisor and game designer.

## D-006: Dev level behind `?dev=` and `import.meta.env.DEV`

- **Date:** 2026-10-11. **Status:** Accepted (plan approved by the owner 2026-10-11).
- **Decision:** `src/dev/` holds one scene per system, opened with `?dev=<scene>`; `?dev` alone lists them. `src/main.js` loads it with a dynamic import inside an `import.meta.env.DEV` check, so production builds leave it out. Scenes use the real input path, show an on-screen readout, and expose the same values read-only on `window.__pastelPopDev`.
- **Reason:** The QA tester works through a browser and cannot see inside a canvas. `import.meta.env.DEV` is Vite's built-in development flag, so no tool is added. It works under `npm run dev:phone`.
- **Alternatives rejected:** A separate HTML page (a second entry point to keep out of the build). A hidden gesture in the shipped game (ships test code to players).
- **Check:** every build task greps `dist/` for `__pastelPopDev`.

## D-007: Test runner: Node's built-in runner

- **Date:** 2026-10-11. **Status:** Accepted (owner approved 2026-10-11).
- **Decision:** `npm test` runs `node --test` over `tests/unit/**/*.test.js`, using `node:test` and `node:assert`. No package is added. `package.json` records Node 22 or newer (22.15.0 is installed).
- **Reason:** D-003 makes logic plain modules that import nothing from the browser, which is all the built-in runner needs. Tests pass time in directly, so no fake-timer library is needed. Zero added dependencies.
- **Alternatives rejected:** `vitest` (dev-only; 5.0.3 supports the installed Vite 6.4). Better reporting and watch mode, but a new package tree for features we do not yet need.
- **Revisit if:** tests need a browser-like environment or Vite-specific imports.

## D-008: Lint and format: `@biomejs/biome`

- **Date:** 2026-10-11. **Status:** Accepted (owner approved 2026-10-11).
- **Decision:** Add `@biomejs/biome` as a dev-only dependency, pinned to an exact version (2.5.15 is current), providing `npm run lint` and `npm run format`. Unused and undeclared variables are errors.
- **Reason:** One package does both jobs, against four for the usual pair. Pinned exactly because formatter output can change between versions.
- **Alternatives rejected:** `eslint` + `@eslint/js` + `globals` + `prettier` (all dev-only). The most widely used choice and it formats HTML, but four direct packages and two configurations. No tooling (mistakes found later, by hand).
- **Known limit:** Biome's formatter for `.html` files is experimental and off by default (biomejs.dev language support page, read 2026-10-11), so `index.html` is linted but not auto-formatted.
- **Note:** `docs/backlog.md` previously named ESLint and Prettier; the line now points here.

## D-009: No browser-test framework yet

- **Date:** 2026-10-11. **Status:** Accepted (owner approved 2026-10-11).
- **Decision:** Do not add `@playwright/test` during foundations. The QA tester uses the Playwright MCP server already configured in `.mcp.json`, which is not a project dependency. `tests/browser/` is reserved.
- **Reason:** Nothing is stable enough to automate until F-18, and the package brings browser downloads with it.
- **Alternatives rejected:** Add it now (cost with no stable behaviour to cover).
- **Revisit:** after F-18, when QA has high-priority cases that keep needing re-checks.

## D-010: Function before look: placeholder visuals, rules and timing apart from drawing

- **Date:** 2026-11-08. **Status:** Accepted (owner instruction 2026-11-08).
- **Decision:** From F-15 onwards, every system is built fully working with placeholder visuals and sounds, and its rules and timing are kept apart from how it looks or sounds, so the art can be swapped in later without changing game logic. Roadmap order: foundations F-11 to F-19, then Calm mode fully working with simple shapes and colours, then Story mode stage 1 fully working with placeholder mural sections, and only then art, pixel art, glow, murals, music and polish.
- **In practice:**
  - Effect rules, timing and limits (budget, pulse clock, shake, Reduce motion swaps, colour check, voice cap, fades) live in plain modules with no canvas, DOM or Web Audio, as D-003 requires of logic. They output plain effect state: kind, position, start time, progress and strength.
  - Drawing sits behind one small drawer per effect kind (burst, quiet form, dim, shake, wobble, pulse), chosen from one table. A drawer only reads effect state and draws it; it decides nothing about timing, budget or motion settings. Swapping art means replacing a drawer, not touching the rules.
  - Sound works the same way: the voice cap, fades and limiter are logic; the placeholder tone for each sound comes from one table that real sounds can replace.
  - Drawers stay inside `src/effects/`, so D-005 still holds: nothing outside the layer draws a brightness change, shake, dim, wobble or pulse, or plays sound.
  - Tests cover the rules and the effect state, not the look. Placeholder visuals must still meet every sensory-safety rule in `docs/wellbeing.md`; the F-16 meter checks the pixels whatever the drawer draws.
  - The same split applies to Calm and Story mode systems: circles, targets, progress and mural sections are real systems with stand-in shapes and colours.
- **Scope:** F-15 onwards, and all Calm mode and Story mode work until the art phase. F-11 to F-14 are unaffected.
- **Reason:** Look and feel are still being designed; working systems first lets play and safety be tested early, and keeps art changes from reaching into game logic.
- **Alternatives rejected:** Build final art alongside each system (art waits on design, and art changes would keep reopening tested logic). Placeholder art drawn inline in the effect logic (the art swap would then touch the rules and their tests).
