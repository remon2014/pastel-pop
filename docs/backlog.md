# Backlog

From the repository audit on 2026-10-11. One line per item; remove items when done.

## Now: security and broken build
- Move the SSH key pair `pastel_pop` / `pastel_pop.pub` out of the repo root to `~/.ssh/`; gitignored and never committed, but the dev server can serve files from the root.
- Dev server is LAN-exposed (`vite.config.js:4`); decide whether `host: true` is still needed once the key is moved.
- `rain.css` is missing from production builds, so the Rain splash is unstyled; it is loaded by a runtime path (`src/game.js:338`).
- `sw.js`, `icon-192.png` and `icon-512.png` are missing from production builds; the manifest ships but points at icons that are not there (`manifest.json`, `index.html:5`).
- Service worker is never registered, and its cache list names dev-only source paths (`sw.js:4`).

## Before redesign: tech foundations
- Movement is per frame with no delta time, so speed doubles on 120 Hz screens (`src/circle.js:61`, `src/circle.js:44`, `src/game.js:270`).
- Particle lifetimes and growth are counted in frames, not time (`src/particle.js:155`).
- Canvas ignores `devicePixelRatio`, so it is blurry on phone screens (`src/main.js:21`).
- Resize and rotation change the canvas size but do not reposition circles (`src/main.js:26`).
- Circle radius is a fixed 50 px rather than relative to the screen (`src/config.js:2`).
- Move static assets into `public/`: `rain.css`, `sw.js`, `manifest.json`, icons, `favicon.ico`.
- `favicon.ico` is a 1.1 MB 1024×1024 PNG with the wrong extension; replace with a real small icon. Compress `icon-512.png` (233 kB).
- No tests: add a test runner and a `test` script; cover scoring, level progression and palette selection first.
- No lint or formatting: add ESLint and Prettier with `lint` and `format` scripts.
- No CI: run build, lint and tests on pull requests.
- Vite is on 6.4.4 (advisories cleared); latest is 8.x, two majors ahead.
- Rapid pause/resume can start a second game loop, doubling speed (`src/game.js:192`, `src/game.js:231`).
- Two background-fade implementations run on top of each other (`src/game.js:237`, `src/game.js:280`).
- Duplicate `ColorManager` class in `src/particle.js:1`; the ripple code uses this one, not `src/colorManager.js`.
- Dead code in `src/colorManager.js`: `emotionalSchemes` (`:52`), `dynamicEffects` (`:60`), `getEmotionalScheme` (`:100`), truncated `switch` in `getRippleEnhancement` (`:161`), `getEnhancedColor` (`:180`).
- Unused scaffold files: `public/vite.svg`, `src/javascript.svg` (empty).
- Duplicate `id="rain-container"` (`index.html:272`, `index.html:342`).
- Debug `console.log` calls left in (`src/main.js:8`, `src/leaderboard.js:37`).
- "Return to Main Menu" reloads the whole page (`src/game.js:41`).
- Manual cache-busting query on the module script (`index.html:344`); Vite already hashes builds.
- Google Fonts is the only external network call and fails offline (`index.html:7`); self-host or drop before wrapping with Capacitor.
- README is minimal; expand once commands and structure settle.

## Redesign-dependent: visual, audio and UX
- No audio at all: every mode names a `backgroundMusic` file and an `fxSet`, but there is no audio code and no audio files (`src/gameModes.js:7`).
- Leaderboard name entry uses `prompt()` (`src/leaderboard.js:19`).
- A score of 0 qualifies for the leaderboard while it has fewer than 5 entries (`src/leaderboard.js:13`).
- Time bonus only pays out if a level is cleared in under 1 second (`src/game.js:122`).
- One wrong tap ends the game; no lives, timer or other tension mechanic (`src/game.js:174`).
- Target colour is conveyed by colour name and hue only, with no shape or pattern cue for colour-blind players (`src/game.js:135`).
- HUD text is dark grey and likely unreadable on Rain mode's near-black background (`index.html:55`).
- Target colour name is drawn in the target colour, which is low contrast for pale palettes (`src/game.js:136`).
- Switching to Rain mode from the pause menu never loads `rain.css` (`src/game.js:210`); Rain styles also stay loaded after leaving Rain mode.
- Rain splash is DOM/CSS while every other effect is canvas (`src/rainEffect.js:3`).
- Mode list is duplicated in two dropdowns and must be kept in sync with `src/gameModes.js` by hand (`index.html:296`, `index.html:323`).
- Pause button still opens the pause menu after game over (`src/game.js:192`).
- No safe-area handling for notches, and touch target sizes are unchecked (`index.html`).
- No onboarding or instructions on first play.
- High score and leaderboard are local to the device only (`src/leaderboard.js:1`).
