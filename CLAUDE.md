# CLAUDE.md

## Project
A mobile colour-matching tap game: the player taps circles matching a target colour. Target platforms are Android first, then iOS.

The look, feel and design are being significantly reworked. **`docs/game-design.md` is the source of truth** for how the game should look, feel and play; the current code is not. Read it before any gameplay, visual or UI change, and if the code and the doc disagree, follow the doc.

## How to work
- **Design first.** For anything the player sees or feels, start from the intended player experience in the design doc, then decide the code. Propose a short plan before large changes.
- **Think like the player.** Judge every change from the target player's point of view: is it clear, fair, satisfying and comfortable on a phone held in one hand? Say so when something works against that, even if it was requested.
- **Safety by default.** No secrets in the repo, no new third-party scripts, trackers or network calls without asking, and protect player data and privacy. Flag anything risky instead of working around it.
- **Be efficient.** Read only the files the task needs, make focused changes rather than rewrites, don't re-read files you just edited, and keep replies short: what changed and anything I need to decide.

## Stack
- Plain HTML5 Canvas 2D with vanilla ES modules. No game engine and no runtime dependencies. Do not add a framework or engine without asking.
- Vite is the only dev dependency (dev server on port 5174).
- Menus and HUD are DOM elements layered over the canvas.
- Planned: Capacitor to wrap the web build into Android/iOS apps.

## Commands
```
npm install
npm run dev       # http://localhost:5174
npm run dev:phone # LAN-accessible; use only when testing on a phone
npm run build     # outputs to dist/
npm run preview   # serve the production build
npm test          # unit tests in tests/unit/ (Node's built-in runner, needs Node 22+)
npm run lint      # Biome lint of src/ and index.html (check only, changes no file)
npm run format    # Biome formatter, rewrites src/ in place
```
Lint and format use Biome. Tests use Node's built-in runner, with no test package; game logic must be testable without a canvas or DOM.

## Structure
Current layout; update this table when files are added, moved or removed.

| Path | Purpose |
|---|---|
| `public/` | Static files copied as-is to the site root: `manifest.json`, `icon-192.png`, `icon-512.png`, `favicon.png` |
| `index.html` | Markup, inline CSS, main menu, pause overlay, HUD |
| `src/main.js` | Bootstrap, canvas resize, menu wiring |
| `src/game.js` | Game loop, levels, input, pause, fixed background |
| `src/circle.js` | Draws one world circle at a pixel scale |
| `src/symbols.js` | Placeholder canvas-path symbols (star, cloud, kite, leaf, moon) |
| `src/colorManager.js` | Colour palette (neutral ids and hex) |
| `src/uiManager.js` | DOM HUD updates |
| `src/logic/world.js` | Canvas-free rules in play-area widths: circle size, speed, spawn, movement, bounce, bounds pull-back. No `document`, `window`, canvas, `performance` or `import.meta` |
| `src/core/loop.js` | The one game loop: the only caller of `requestAnimationFrame`; elapsed seconds, capped, stops when hidden |
| `src/dev/` | Dev-only test sandbox, absent from `npm run build`. Open `http://localhost:5174/?dev` for the scene list, `?dev=loop` or `?dev=circles` for a scene. `index.js` scene registry, `readout.js` on-screen panel, `scenes/` one file per scene; `window.__pastelPopDev` holds the read-only numbers |
| `src/config.js`, `src/utils.js` | Constants and helpers |
| `tests/unit/` | Unit tests, one `*.test.js` per module, run by `npm test` (`loop.test.js` covers `src/core/loop.js`, `world.test.js` covers `src/logic/world.js`) |
| `biome.json` | Biome lint and format settings (`src/` formatted; `index.html` linted only) |
| `docs/game-design.md` | Source of truth for look, feel and play: Calm mode and Story mode |
| `docs/wellbeing.md` | Sensory-safety rules, wording limits and the evidence behind them |
| `docs/backlog.md` | Known issues and priorities |
| `docs/foundations-plan.md` | Engineering foundations plan: tasks F-01 to F-19 and their progress |
| `docs/decisions.md` | Log of significant technical decisions (D-001 onward) |
| `docs/qa-log.md`, `docs/qa-notes.md` | QA verdict per task, and lasting notes for future test sessions |
| `.claude/agents/` | Agent definitions: `game-designer`, `wellbeing-advisor`, `tech-lead`, `gameplay-engineer`, `qa-tester`, `code-reviewer` |

## Rules
- **Static assets go in `public/`.** Vite only copies files from `public/` into the build. Anything in the repo root (icons, `sw.js`, CSS loaded at runtime) is missing from production builds.
- **Movement must use delta time.** Never move things by a fixed amount per frame; the game must run at the same speed on 60 Hz and 120 Hz screens.
- **Respect `devicePixelRatio`** when sizing the canvas, and size gameplay elements relative to the screen rather than in fixed pixels.
- **Mobile first.** Touch targets at least 48 CSS px, and about 64 CSS px for moving circles (see `docs/game-design.md`, Accessibility); respect safe areas (notches), handle rotation and resize, and never use `prompt()`, `alert()` or `confirm()`.
- **Keep all text readable** against every background, and never rely on colour alone to convey meaning (colour-blind players).
- **Never commit or place keys, `.env` files or secrets in the repo.** Report any you find.
- Keep modules small and single-purpose. Put shared constants in `src/config.js` rather than inlining magic numbers.
- Remove dead code rather than leaving it commented out.

## Workflow
- Work on a feature branch; never commit directly to `main`.
- After a change, verify it by running the game, not just by reading code. Check both desktop and a mobile viewport.
- Run `npm run build` and `npm run preview` before declaring work done, since dev and production builds currently differ.
- Keep commits small, with clear messages.
- Known issues and priorities live in `docs/backlog.md`.
