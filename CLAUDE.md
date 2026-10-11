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
```
No test or lint scripts exist yet; they are being added.

## Structure
Current layout; update this table when files are added, moved or removed.

| Path | Purpose |
|---|---|
| `index.html` | Markup, inline CSS, main menu, pause overlay, HUD |
| `src/main.js` | Bootstrap, canvas resize, menu wiring |
| `src/game.js` | Game loop, levels, input, scoring, pause, background fades |
| `src/circle.js` | Circle entity (fly-in, bounce, draw) |
| `src/particle.js` | Ripple and glitch effects |
| `src/colorManager.js` | Palettes and rain background |
| `src/gameModes.js` | Config for the 10 modes |
| `src/uiManager.js` | DOM HUD updates |
| `src/leaderboard.js` | Top-5 leaderboard in localStorage |
| `src/rainEffect.js`, `rain.css` | Rain mode splash |
| `src/config.js`, `src/utils.js` | Constants and helpers |

## Rules
- **Static assets go in `public/`.** Vite only copies files from `public/` into the build. Anything in the repo root (icons, `sw.js`, CSS loaded at runtime) is missing from production builds.
- **Movement must use delta time.** Never move things by a fixed amount per frame; the game must run at the same speed on 60 Hz and 120 Hz screens.
- **Respect `devicePixelRatio`** when sizing the canvas, and size gameplay elements relative to the screen rather than in fixed pixels.
- **Mobile first.** Touch targets at least 44px, respect safe areas (notches), handle rotation and resize, and never use `prompt()`, `alert()` or `confirm()`.
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
