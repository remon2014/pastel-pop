# Engineering foundations plan

**Status:** approved by the owner 2026-10-11. The owner accepted the tech lead's recommendation on decisions 1 to 7 in section 6; decision 8 (automatic checks on GitHub) is deferred. Approval authorises local work and local commits only.
**Progress (2026-11-08):** F-01 to F-13 are built, verified and merged into `main`. A retrospective review of F-01 to F-09 added R-01 to R-05 (section 3a), which came before F-10. Next: F-14. Results are in `docs/qa-log.md`.
**Grounded in:** the code on branch `docs/foundations-plan` (commit `1aecd4d`), `docs/game-design.md` Draft v0.5 (GD), `docs/wellbeing.md` v0.4 (WB), `docs/backlog.md`.
**Decisions referenced:** `docs/decisions.md` D-001 to D-009.

## 1. Goal

Give the game a base on which the design's numbers mean something: the same speed on every phone, crisp pixels, sizes that follow the screen, and one safety layer that no effect can bypass. When this plan is done there is no Calm or Story mode yet, but every system they need exists, is tested, and can be opened on its own in a browser by the QA tester.

## 2. Approach

### Order and why

| Step | Tasks | Why here |
|---|---|---|
| 1. Clear out retired prototype code | F-01, F-02 | About 70% of `src/` is retired by the design. Fixing its timing or moving its files first would be work on code we then delete (see D-001) |
| 2. Fix the production build | F-03, F-04 | Small, independent, and every later task must pass `npm run build` and `npm run preview` |
| 3. Safety net: lint, format, tests | F-05, F-06 | Before new code is written, so it is checked from its first line. After step 1, so we do not reformat code we are deleting |
| 4. One game loop on elapsed time, then the dev level | F-07, F-08 | Everything else runs inside the loop. The dev level comes straight after, because it is how QA observes every later task |
| 5. Game logic without a canvas, in screen-relative units | F-09 | Logic is separated before rendering is rebuilt, so the time and sizing rules can be proved by tests, and the renderer can change without touching rules |
| 6. Sharp rendering, layout, input | F-10, F-11, F-12 | Rendering defines the pixel grid; layout and input depend on it |
| 7. Effects-safety layer | F-13 to F-17 | Needs the loop, the renderer and a settings store. Must exist before the first real game effect is built |
| 8. Clean up and prove it | F-18, F-19 | Remove the last prototype files, full regression, then a real phone |

This differs from the order the work was listed in on two points: retired code goes first, and the logic and rendering split (item 5 of the brief) comes before the rendering rebuild rather than after it.

### Technical shape

Proposed module layout. File names are a guide for the engineer, not a contract.

| Area | Module | Rule |
|---|---|---|
| Loop | `src/core/loop.js` | The only place `requestAnimationFrame` is called. Hands out elapsed seconds, clamped (D-003) |
| Logic | `src/logic/` | Plain data and functions. No `document`, `window`, canvas or `import.meta`. Positions and speeds in play-area widths, never pixels (D-003) |
| Rendering | `src/render/` | Reads logic state and draws it. One low-resolution canvas, whole-number scale, smoothing off (D-004) |
| Input | `src/input/pointer.js` | Pointer events, one tap per finger, converted to logic units |
| Effects | `src/effects/` | The only place that may draw a brightness change, shake, dim or pulse, or play a sound (D-005) |
| Settings | `src/settings.js`, `src/storage.js` | Reduce motion, volumes, vibration, mute; saved safely |
| Dev level | `src/dev/` | Opened with `?dev=<scene>`. Not present in production builds (D-006) |
| Tests | `tests/unit/` | Logic tests. `tests/browser/` is reserved for later QA automation |
| Constants | `src/config.js` | Every tuning value, including placeholders |

Key points:

- **Time (D-003).** One loop passes elapsed time to logic. A single frame can never count for more than a set maximum (placeholder 0.1 s), so a tab switch or pause never makes things jump. Starting the loop twice is impossible by construction, which removes the doubled-speed bug at `src/game.js:199` and `:207`.
- **Units (D-003).** Logic measures in play-area widths. GD's "1.0x speed is one screen width in about 4 seconds" becomes 0.25 widths per second. Circle size is a fraction of the width with a floor of 48 dp (GD Accessibility).
- **Pixels (D-004).** The internal resolution is one constant, `INTERNAL_WIDTH_TARGET`, placeholder **180**. Because logic never sees pixels, changing it when the art reference arrives changes how chunky things look and nothing else.
- **Effects safety (D-005).** Features ask the effects layer for an effect; the layer decides what is actually shown and heard. It keeps a running count of flashes over the last second for the whole screen, runs every pulse off one shared clock, allows one shake at a time, swaps effects under Reduce motion, and caps and fades sound.
- **Dev level (D-006).** `src/main.js` loads `src/dev/` only when `import.meta.env.DEV` is true, so Vite leaves it out of `npm run build`. It works with `npm run dev:phone`, so the same scenes run on a real phone.

### Placeholders this plan uses

All live in `src/config.js`, named and commented as provisional.

| Placeholder | Value | Waits on |
|---|---|---|
| Internal resolution | 180 pixels wide | Owner's art reference (GD Open questions 3) |
| Longest single frame counted | 0.1 s | Tech lead, after phone testing |
| Circle size | 64 dp on a 360 dp wide phone, never under 48 dp | Game designer: how it scales on large screens |
| Sounds | Tones generated in code, no audio files | Owner's music and sound uploads |
| Sound limits (most sounds at once, shortest fade-in) | Tech-lead guesses, flagged | Wellbeing advisor |
| Fonts | The phone's own font | Game designer (GD Look) |

## 3. Tasks

Every task also has these standing criteria, not repeated in the table: `npm run build` succeeds and the change works in `npm run preview`; the browser console shows no new error or warning; `npm run lint` and `npm test` pass once they exist (from F-05 and F-06); no sensory rule in WB 4 is broken; one task per commit on the feature branch; the engineer updates the structure table in `CLAUDE.md` when files are added or removed.

The QA tester verifies each task with the existing Playwright browser tool. Dev URLs assume `npm run dev` on `http://localhost:5174`; preview is `npm run preview` on Vite's default `http://localhost:4173`. Viewports: 360x800, 412x915 and desktop.

| ID | Task | Files likely touched | Acceptance criteria | How QA verifies | Depends on | Owner |
|---|---|---|---|---|---|---|
| F-01 | **Delete whole retired files and their call sites.** The 10 modes, Rain, leaderboard, ripple and glitch particles, unused scaffold images | Delete `src/gameModes.js`, `src/leaderboard.js`, `src/rainEffect.js`, `src/particle.js`, `rain.css`, `src/javascript.svg`, `public/vite.svg`. Edit `src/game.js`, `src/main.js`, `index.html` | Files gone. No mode dropdowns, leaderboard or `rain-container` in `index.html` (`:272`, `:295-313`, `:322-337`, `:342`). No `prompt()` anywhere. Game still starts and circles still clear on a correct tap | Open `/`, press Start, tap matching circles: they clear, with no rings, dots or rain. Menu shows no dropdown or leaderboard. Console clean. `git grep -n "rain\|leaderboard\|GAME_MODES\|prompt("` over `src` and `index.html` returns nothing | D-001 approved | gameplay-engineer |
| F-02 | **Delete retired parts inside kept files, and dead code.** Score, high score, time bonus, game over, per-tap background tint, canvas shake, swoop-in, colour-name target, "psychology" strings, page reload on menu | `src/game.js`, `src/circle.js`, `src/colorManager.js`, `src/uiManager.js`, `src/main.js`, `index.html` | A wrong tap does nothing (no fail state). Background is one fixed colour. No `.shake` (`index.html:203-214`), no "Game Over!" (`:285`). Target shown as a plain colour swatch, no word. No colour names or claims from `src/colorManager.js:10-53` remain. No `window.location.reload()` (`src/game.js:41`). No `console.log`. What remains is scaffolding, not Calm mode | Open `/`, Start. Tap a wrong circle 10 times: nothing shakes, tints or ends. Tap right ones: background never changes colour. HUD shows a swatch only, no score or level. `git grep -n "mindful\|serene\|psycholog\|shake\|highScore\|console.log" src index.html` returns nothing | F-01 | gameplay-engineer |
| F-03 | **Fix the production build.** Static files into `public/`; remove the service worker; small real favicon | Move `manifest.json`, `icon-192.png`, `icon-512.png` to `public/`. Delete `sw.js`, `favicon.ico`. Add `public/favicon.png`. Edit `index.html:4-5`, `:344` | After build, `dist/` holds `manifest.json`, both icons and the favicon at its top level with unhashed names. Manifest icon paths (`manifest.json:10`, `:15`) load. Favicon is a real PNG, 64 px or smaller and under 10 kB (today: 1,110,685 bytes, 1024x1024, `.ico` name on a PNG). No `sw.js`. No `?v=1.0.3` on the script tag. Total `dist/` under 400 kB. No new tool installed: use what the machine has (`sips` is present; no PNG optimiser is). If `icon-512.png` (232,860 bytes) cannot be shrunk that way, leave it and keep its backlog line | Run build, then preview. Open `http://localhost:4173/`: network list shows no failed request. Open `/manifest.json`, `/icon-192.png`, `/icon-512.png`, `/favicon.png`: each loads. List `dist/` with sizes and attach it to the report | F-02; D-002 approved | gameplay-engineer |
| F-04 | **Remove the only outside network call.** Drop Google Fonts; use the phone's own font until the designer picks fonts | `index.html:7`, `:18`, `:136` | No request leaves the page's own address, in dev or preview. Text still readable | Open `/` and preview with the network panel open: every request goes to the page's own address, and none to `fonts.googleapis.com` or any other host. Screenshot the menu at 360x800: text is readable | F-03 | gameplay-engineer |
| F-05 | **Linting and formatting.** Add the tool, `lint` and `format` scripts, and fix what it finds | `package.json`, `package-lock.json`, new `biome.json`, files it reformats | Version pinned exactly. Unused and undeclared variables are errors. `npm run lint` exits 0. `npm run format` changes nothing on a second run. Formatting lands as its own commit, separate from any hand fix. `dist/` and `node_modules/` ignored | Run `npm run lint`: exit 0. Run `npm run format`, then `git status`: clean. Pipe a line with an undeclared variable to the tool's standard-input check and see it fail, without editing any file | F-02; D-008 approved | gameplay-engineer |
| F-06 | **Test runner.** A `test` script and a first real test | `package.json`, new `tests/unit/` | `npm test` runs every `tests/unit/**/*.test.js` and exits 0. A failing assertion makes it exit non-zero. `package.json` states the Node version needed (22 or newer). No package added | Run `npm test`: see the test count and exit 0. Engineer's report shows the same run failing with one assertion flipped | D-007 approved | gameplay-engineer |
| F-07 | **One game loop on elapsed time.** Replace the self-calling `update()` (`src/game.js:231-271`) | New `src/core/loop.js`, `tests/unit/loop.test.js`, `src/game.js`, `src/config.js` | Starting twice still gives one update per frame. Elapsed time is in seconds and never above the maximum. A 5 s gap advances the game by no more than the maximum. Loop stops when the page is hidden and resumes without a jump. Pause and resume pressed quickly 20 times does not change speed. Tests cover each of these with a fake clock passed in | `npm test` shows the loop tests passing. By eye: Start, press Pause and Resume as fast as possible 20 times, then switch tab for 10 s and return: circles do not speed up or jump. The measured proof (loops running = 1, clamped frames counted) is F-08's check; F-07 is not signed off until that passes | F-06 | gameplay-engineer |
| F-08 | **Dev level shell.** `?dev=` opens a scene; `?dev` alone lists them. First scene: `loop` | New `src/dev/index.js`, `src/dev/readout.js`, `src/dev/scenes/loop.js`, `src/main.js` | `?dev` lists every scene as a link. `?dev=loop` shows a readout: frames per second, last elapsed time, number of clamped frames, number of running loops (always 1). A read-only `window.__pastelPopDev` exposes the same numbers. In a production build none of it exists | Dev: open `/?dev=loop`, press Start, read the numbers; hide the tab 5 s, return: loops still 1, clamped-frame count unchanged and no jump (the loop halts while hidden, as built in F-07); press Stall: clamped-frame count goes up by 1. Production: build, then `grep -r "__pastelPopDev" dist` finds nothing, and `http://localhost:4173/?dev=loop` shows the normal start screen | F-07 | gameplay-engineer |
| F-09 | **Game logic without a canvas, in screen-relative units.** Circle movement, bounce, and bounds as plain functions | New `src/logic/world.js`, `tests/unit/world.test.js`, `src/dev/scenes/circles.js`; retire the movement in `src/circle.js:55-70` | No `document`, `window` or canvas in `src/logic/`. Speeds in widths per second; 1.0x is 0.25. Tests: distance covered in 1 s is the same (within 0.1%) when stepped at 60, 90 and 120 steps a second; circles never leave the bounds; changing the bounds pulls every circle back inside; circle size never under the 48 dp floor | Open `/?dev=circles`: one circle at 1.0x with a stopwatch readout crosses the play area in 4.0 s (plus or minus 0.2 s). A "slow frames" toggle that runs the loop at 30 a second gives the same crossing time. `npm test` passes | F-08 | gameplay-engineer |
| F-10 | **Sharp rendering, and play-area sizes and taps in CSS px (review S1).** Low internal resolution, whole-number scale, `devicePixelRatio`, smoothing off. Refined 2026-11-08: see "F-10 refined" under section 3a, which replaces this row's detail | New `src/render/view.js`, `tests/unit/view.test.js`, `tests/unit/circle.test.js`, `src/dev/scenes/render.js`; `src/circle.js`, `src/game.js`, `src/main.js`, `src/config.js`, `src/dev/scenes/circles.js`, `src/dev/index.js`, `index.html` (canvas CSS) | See "F-10 refined" | See "F-10 refined" | F-09, R-01 to R-05 | gameplay-engineer |
| F-11 | **Layout: screen-relative play area, resize, rotation, safe areas.** | `index.html:8` (viewport), `:11-30` (page and canvas CSS), `:138` (Pause button), `src/render/view.js`, `src/main.js`, `src/uiManager.js`, `src/config.js`, new `src/dev/scenes/layout.js` | Viewport uses `viewport-fit=cover`. HUD and buttons sit inside `env(safe-area-inset-*)`. No fixed-pixel positions for gameplay or HUD (the Pause button's `top:20px; right:20px` goes). The play area is portrait: its column is the safe-area-trimmed visible screen, narrowed to at most 9:16 (width ÷ height, one PROVISIONAL constant in `src/config.js`) and centred, so phones keep full width and 1280x800 gets a centred column; `computeView` gets the column size, unchanged otherwise. On resize or rotation the canvas is re-sized, stays sharp, and every circle is back inside within one frame. No scrollbars; height follows the visible screen, not `100vh`. Target swatch (`src/uiManager.js`, moved here from F-10): sharp, drawn at the play area's pixel size, top centre below the safe area, about 1.5 times a play circle (GD Calm mode, HUD), not overlapping the Pause button at 360 wide; Pause button at least 48 CSS px in a top corner. Pause button hidden until Start. Out of scope: pause overlay behaviour (retired for Calm, GD Calm mode), circles passing under the HUD (designer question), `CIRCLE_MAX_DIAMETER_DP` value (readout only) | Open `/?dev=layout` at 360x800, 412x915 and 1280x800. Resize mid-play between them and to landscape: readout "circles outside play area" stays 0; readout shows column size and aspect; screenshot is sharp. Use the scene's "pretend notch" control (it overrides the inset values): HUD moves inside the outline. At 360x800 the swatch measures about 1.5 times a circle and its box does not touch the Pause button's box. Load `/`: no Pause button behind the main menu | F-10 | gameplay-engineer |
| F-12 | **Input: pointer events, one tap per finger.** Replaces `click` and `touchstart` (`src/game.js:36-37`, `:105-115`) and moves the hit loop (`:117-131`) into a pure function | New `src/input/pointer.js`, new `src/logic/hit.js`, `tests/unit/hit.test.js`, `src/dev/scenes/input.js`, `src/config.js`, `src/game.js` | Every finger going down (`pointerdown`, not release) is its own tap at its own position (today a second finger lands on the first: `src/game.js:113`). Taps are converted to logic units correctly at every scale and in the centred column (via the F-11 layout's canvas rect). Keep `touch-action: none` on the canvas (already at `index.html:29`): no scroll, zoom or text selection. Mouse and touch both work; one physical tap never counts twice. Taps on HUD controls (Pause, menus) never reach the play input; the target swatch is display-only and lets taps through to circles beneath it (owner, 2026-11-08). Hit test is a pure function with tests (GD Calm mode, Missed tap): a circle's tap area is its radius times a PROVISIONAL constant in `src/config.js` (1.1), never under half the minimum touch size; when a tap is within reach of more than one circle, the matching one is taken, otherwise the nearest; a tap within reach of nothing returns no circle. Tests cover overlap with the matching circle underneath, the edge of the widened area, and the minimum-size floor. The scene has an auto-tapper (taps per second, number of fingers) that feeds the real input path. Out of scope: wrong-tap and correct-tap feedback | Open `/?dev=input`. Click circles with the mouse, then with touch emulation: the readout names the circle hit and the tap position. Tap just outside a circle's edge: still a hit. Tap where a non-matching circle overlaps the matching one: the matching one is hit. Tap Pause: the tap log does not grow. Tap the swatch over a circle: that circle is hit. Run the auto-tapper at 10 a second with 3 fingers: the tap log shows 30 taps a second, each at its own position, none dropped | F-11 | gameplay-engineer |
| F-13 | **Settings and safe storage.** Reduce motion (in-game switch plus the system setting), music volume, effects volume, vibration, mute | New `src/storage.js`, `src/settings.js`, `tests/unit/settings.test.js`, `src/dev/scenes/settings.js` | All storage access survives blocked storage without an error. Values persist across a reload. Reduce motion is on when the in-game switch is on or when `prefers-reduced-motion: reduce` is set, and updates live when the system setting changes. Tests use a fake storage and a fake system setting. This is plumbing with plain test controls; the real settings screen is a later feature. **Added at readiness check (2026-11-08):** (a) `settings.js` touches no `window`, `localStorage` or `matchMedia`; storage and the system setting are passed in, and `storage.js` guards reaching `localStorage` itself, not only its calls. (b) Defaults in `src/config.js`, flagged as placeholders: Reduce motion switch off, vibration off (GD Calm; one setting for both modes), mute off, music and effects volume placeholder values. (c) Mute is its own on/off and leaves both volumes unchanged; unmuting restores them. (d) One versioned key holding JSON; unreadable JSON, an unknown version, wrong types or out-of-range volumes fall back to the default per field (volumes clamped to 0 to 1), with no error. (e) Only these five values are stored: nothing personal, no timestamps or use counts (WB 8), no network. (f) `subscribe(fn)` returns an unsubscribe; subscribers hear every change, including a system setting change, and receive effective Reduce motion. (g) Settings read once at start and kept in memory, so a later move to native storage changes only `storage.js`. Tests cover (c), (d) and (f) | Open `/?dev=settings`: change each control, reload, values kept. Emulate reduced motion in the browser: the "effective Reduce motion" readout turns on without a reload. Block storage and reload: no console error, defaults shown. Write broken JSON and out-of-range numbers into the key by hand, reload: defaults shown for those fields, no console error. Mute, then unmute: volumes as before. Controls at least 48 CSS px at 360x800 | F-08 | gameplay-engineer |
| F-14 | **Effects safety rules as tested logic.** Flash budget, shared pulse clock, one shake at a time, Reduce motion swaps | New `src/effects/limiter.js`, `src/effects/pulseClock.js`, `tests/unit/effects.test.js`, `src/config.js` | Tests, written from WB 4 and WB 6, not from the code: (1) 10 taps a second with 3 fingers for 10 s: no one-second window grants more than 3 flashes; (2) with a 2-a-second pulse running, pulse plus bursts together stay at 3 or under; (3) a pulse faster than 2 a second in Story, or faster than one every 2 s in Calm, is refused; (4) all pulses share one clock; (5) a second shake during a shake neither restarts nor extends it, and Calm never shakes; (6) under Reduce motion: Story shake becomes dim, Calm wobble becomes dim, Story burst becomes small fade, Calm pop becomes plain fade with no ring, travelling light is removed, low-time pulse and target glow are unchanged; (7) no effect colour is saturated red (R/(R+G+B) of 0.8 or more); (8) same results at 60, 90 and 120 steps a second. **Added at readiness check (2026-11-08):** (9) Calm: no more than 2 arrivals begin in any one second, extras wait (never dropped), and an arrival plus its pop counts as one flash (WB 4); (10) Calm: a circle already wobbling or dimming ignores further wrong taps, returning `ignored` so no sound plays either (WB 5); (11) the Reduce motion dim, computed from the palette hex values, changes the lightest colour's relative luminance by 0.07 or less (WB 4; Story dim uses the same cap, confirmed WB v0.8 section 6); (12) no more than 2 shakes begin in any 1 s, and a shake is position only, at most 2 internal px, at most 200 ms, decaying, at most 2 swings; a shake does not count as a flash (WB v0.8 section 6); (13) Story arrivals count in the flash budget; a `full` Story burst counts as a further flash, while a `quiet` or `fade` ending is free as the second half of the arrival flash (a full burst is a complete flash on its own, with no grace window; confirmed by the wellbeing advisor, WB section 6, 2026-11-08), with a PLACEHOLDER Story arrival limit in `src/config.js` until the game designer sets it (WB v0.8 section 6). The Story over-budget form (`quiet`) is a fade in the circle's own colour, no brighter than its fill, nothing added, at most 450 ms, opacity only under Reduce motion (WB v0.8 section 6). Added by the owner 2026-11-08. **Pulse grid (owner 2026-11-08, after review):** a pulse period must be a whole multiple of 0.5 s with beats on shared 0.5 s ticks, else `refused`; beats from several pulses on one tick are one flash; every tap flash and pulse beat is granted only if fewer than 3 are granted in (now − 1 s, now], and a pulse beat that does not fit is skipped; while a pulse runs or ran in the last 1 s, taps get at most 1 flash per window. (14) A fixed-seed property test of 5,000 mixed runs (pulse start, stop and rate change, multi-finger taps, 60/90/120 steps a second) asserts no window starting at any grant time holds more than 3 flashes. **Contract:** `request({ kind, mode, now, circleId })` always returns `{ form }`, never null and never queued: `full`, `quiet` (over budget), `dim`, `fade`, `plainFade`, `ignored`, `waitUntil` (arrivals, and a pulse that cannot yet fit the budget; owner 2026-11-08) or `refused` (bad pulse rate, Calm shake). Over budget in Calm, a pop becomes `plainFade` (WB 4, ring-pop cap); in Story, a burst becomes `quiet`, a PROVISIONAL placeholder that adds no brightness and does not count as a flash (Risks 3). A running pulse reserves its beats in the budget first; taps get what is left. A flash counts against the budget at its start time; the window is any 1 s. Pure: no `document`, `window`, `performance` or settings import; `now` is in seconds and passed in; Reduce motion is set with `setReduceMotion(bool)`, which F-15 wires to F-13's `effectiveReduceMotion()` and `subscribe`. Limits are constants in `src/config.js`. Out of scope, checked in F-15 and F-16: no full-screen flash, local bursts, measured brightness | `npm test` shows the eleven named tests passing. QA reads the test names against WB 4, 5 and 6 and the GD Reduce motion list, and reports any rule with no test. Mutation check on (1), (5) and (9). Visible proof comes in F-15 | F-13 | gameplay-engineer |
| F-15 | **Effects layer on screen.** Placeholder burst, dim, shake, wobble and pulse, all drawn through the layer | New `src/effects/effects.js`, `src/effects/drawEffects.js`, `src/dev/scenes/effects.js` | Only `src/effects/` draws a brightness change, shake, dim or pulse. Per D-010: `effects.js` holds rules and timing and outputs plain effect state, with no canvas or DOM; `drawEffects.js` has one small drawer per effect kind, chosen from one table, that only reads that state, so a drawer can be replaced without touching `effects.js` or its tests. Shake is a few internal pixels, 200 ms or less, decaying. Bursts are local to the circle; nothing covers the full screen. An over-budget tap still gets feedback, in a quiet form (see Risks 3). Scene has: auto-tapper, Calm or Story switch, Reduce motion switch, low-time pulse switch. Readouts: flashes granted in the last second and the highest seen, shakes running, pulse rate | Open `/?dev=effects`. Story, auto-tapper at 10 a second with 3 fingers, pulse on, for 30 s: "highest flashes in a second" never passes 3; "shakes running" never passes 1. Turn Reduce motion on: screenshots before and after show no shake and no expanding ring. Switch to Calm: no shake at all. Repeat with the loop slowed to 30 a second: same numbers | F-12, F-14 | gameplay-engineer |
| F-16 | **Dev flash meter.** An independent count taken from the pixels actually drawn, so the layer is not marking its own homework | New `src/dev/flashMeter.js`, `tests/unit/flashMeter.test.js`, `src/dev/scenes/effects.js` | Dev only. Splits the internal picture into a grid, tracks brightness per cell, and counts flashes by the WCAG definition in WB 4 (opposite changes of 10% or more, darker state under 0.80), plus a saturated-red check. Counting logic is tested on made-up frame data, including a 5-a-second case. **No on-screen test pattern may flash faster than 2 a second.** Readout shows the meter's count beside the layer's count | Open `/?dev=effects`, run the same 30 s stress as F-15: the meter's highest count is 3 or under and red count is 0. Turn on the 2-a-second pulse alone: meter reads 2. Absent from the production build (same check as F-08) | F-15 | gameplay-engineer |
| F-17 | **Sound through the same layer.** Separate music and effects volume, fades, a cap on overlapping sounds, an overall limiter, placeholder tones | New `src/effects/audio.js`, `src/effects/voices.js`, `tests/unit/voices.test.js`, `src/dev/scenes/audio.js` | Only `src/effects/` touches Web Audio. Sound starts only after the first tap. Music fades in over 1 to 2 s and fades out on stop; never starts at full volume. Every sound has a short fade-in, so no click. Overlapping effect sounds are capped; an extra sound is dropped or replaces the oldest, never added on top. Music and effects volumes are independent and come from F-13; mute is remembered. Sound stops when the page is hidden. Voice-cap logic tested without audio. Per D-010: cap, fades and limiter are logic apart from playback, and each placeholder tone comes from one table that real sounds can replace. No audio files added | Open `/?dev=audio`, tap once to enable sound. Press "start music": gain readout climbs over 1 to 2 s. Run the auto-tapper at 10 a second with 3 fingers: "sounds playing" never passes the cap, and the peak level readout stays within the stated margin of a single tap's peak. Move each slider: only its own readout changes. Mute, reload: still muted | F-13, F-12 | gameplay-engineer |
| F-18 | **Finish the clean-up and regression.** Remove any prototype module still left; bring docs in line | Whatever remains of `src/game.js`, `src/circle.js`, `src/colorManager.js`, `src/uiManager.js`, `src/utils.js`; `CLAUDE.md` structure table (engineer); `docs/backlog.md` (tech lead) | No file listed under "Retired with the prototype" in the backlog exists. The start screen opens a plain scene built only from the new systems. Backlog foundations items that are done are removed | QA writes test cases in `docs/test-cases/foundations.md`, then runs every dev scene at three viewports, in dev, and confirms all are absent in preview. Reports any acceptance criterion from F-01 to F-17 that no longer holds | F-01 to F-17 | gameplay-engineer, then qa-tester; tech-lead for the backlog |
| F-19 | **Real phone check.** What a browser tool cannot show | None (notes go to `docs/qa-notes.md`) | On at least one mid- or low-range Android phone, with `npm run dev:phone`: `?dev=circles` crossing time is 4 s; `?dev=render` is sharp; `?dev=input` registers three fingers at once; `?dev=loop` holds about 60 frames a second during the `?dev=effects` stress; turning on the phone's "Remove animations" setting flips the Reduce motion readout in `?dev=settings`; slow movement at the placeholder resolution looks acceptable (Risks 1) | Owner follows a short checklist the QA tester writes from this row, and reports each line as yes or no with the phone model. If a 120 Hz phone is available, repeat the crossing time on it | F-18 | owner, with qa-tester preparing the checklist |

### 3a. Pre-F-10 review fixes (R-01 to R-05)

From the retrospective code review of F-01 to F-09. All five come before F-10; they are independent of each other. Standing criteria above apply. "Mutation check" means QA breaks the behaviour on purpose, confirms the new test fails, then restores the code and confirms it passes; the change is never committed.

| ID | Size | Review item | Task | Files likely touched | Acceptance criteria | How QA verifies | Owner |
|---|---|---|---|---|---|---|---|
| R-01 | Small | M1 (must fix) | Make the "returning resumes without a jump" test check the first frame after return | `tests/unit/loop.test.js:72-89` | The test asserts on `calls[1]` (first frame after the page is visible again): elapsed is 0 (no gap), and `clampedFrames` is 0 | Mutation check: delete `lastTime = null;` in `halt()` (`src/core/loop.js:43`); the test fails. Restore; `npm test` passes | gameplay-engineer |
| R-02 | Small | S2 | Zero-size play area never corrupts circle positions | `src/game.js:63-71` (`syncBounds`), possibly `src/logic/world.js:17-22`, `tests/unit/world.test.js` | If the canvas width or height is 0, positions, velocities and radii stay finite and the last good bounds are kept (or the update is skipped); when a real size returns, circles are inside the bounds and tappable. A unit test covers it without a canvas | Mutation check: remove the guard; the new test fails. Browser: in `?dev=circles` and the game, shrink the window to 0 height (DevTools device toolbar) and back; circles reappear, stay tappable, and the level can be finished. `window.__pastelPopDev` shows no NaN | gameplay-engineer |
| R-03 | Small | S3 | Fill gaps in `tests/unit/world.test.js` | `tests/unit/world.test.js` | New tests: `isInside` returns false for a circle outside on each side; a circle bigger than the play area sits centred and stays put; pull-back when only the width shrinks; a zero-second step moves nothing | Mutation check per test: make `isInside` always return true; make `range()` ignore oversize; skip the x-axis pull-back; add a fixed nudge to `stepCircle`. Each breaks at least one new test. Restore; `npm test` passes | gameplay-engineer |
| R-04 | Small | S4 | Test that every palette id has a symbol drawer | `src/symbols.js` (export a lookup such as `hasSymbol(id)` or the drawer table), new `tests/unit/symbols.test.js` | For every entry in `PALETTE`, a drawer exists. Both modules already import in Node (checked 2026-11-08: they import only `config.js`). No game behaviour changes and no fallback (see note below) | Mutation check: add a sixth palette entry with an unknown id (or remove `moon` from the drawers); the test fails. Restore; `npm test` passes | gameplay-engineer |
| R-05 | Small | N2 | One shared `button()` and `READOUT_MS` for dev scenes | `src/dev/scenes/loop.js:9-12`, `src/dev/scenes/circles.js:17-30`, new shared module in `src/dev/` (e.g. `src/dev/ui.js`) | One definition of each, imported by both scenes; no copies left (a search of `src/dev/` finds one `function button` and one `READOUT_MS =`). Scenes look and behave as before | Browser: `?dev`, `?dev=loop`, `?dev=circles` open, buttons work, readouts update about 4 times a second. `npm run build`, then `grep -rl __pastelPopDev dist/` finds nothing and `dist/assets/` has no dev-scene chunk, and `?dev` in `npm run preview` opens the normal game | gameplay-engineer |

**R-04 fallback decision:** no fallback drawer. Symbol ids come only from the static `PALETTE`, so the unit test makes a missing drawer impossible to commit (the pre-commit hook runs `npm test`). A silent fallback would hide exactly the bug the test catches, and a circle without its symbol breaks the "never colour alone" rule. The wider point, that any exception inside the loop stops it for good, is noted under deferred items rather than patched here.

### F-10 refined (2026-11-08)

Replaces the detail of the F-10 row. Standing criteria and the "mutation check" meaning from section 3a apply. Size: medium, one branch (`feat/f10-sharp-rendering`), six commits.

**Scope trimmed.** No `src/render/draw.js`: drawing stays in `src/circle.js` until F-18 tidies files. The target swatch moves to F-11. Symbols stay as path-drawn placeholders: at internal resolution their edges are soft. That is accepted until the artist's art arrives; the hard-edge check applies to the `?dev=render` test card and to circle discs only. The tap area 10% wider than the circle (GD Calm mode) is not part of F-10.

**1. The view: one pure function in `src/render/view.js`**

`computeView(cssWidth, cssHeight, dpr, target)` returns a frozen plain object, or `null` when no usable view exists. `target` is `INTERNAL_WIDTH_TARGET` (new in `src/config.js`, 180, marked provisional).

| Step | Rule |
|---|---|
| Bad pixel ratio | `dpr` that is not a finite number above 0 counts as 1 |
| Bad size | `cssWidth` or `cssHeight` that is not a finite number above 0: return `null` |
| `scale` | Device pixels per internal pixel: `max(1, round(cssWidth × dpr / target))` (D-004: nearest whole number) |
| `internalWidth`, `internalHeight` | `floor(cssWidth × dpr / scale + 1e-6)`, same for height. The tiny allowance stops float error losing a pixel (360 CSS at 1.15 gives 413.99999… device px; the answer must be 207, not 206). If either comes out under 1, return `null` |
| `cssPerInternal` | `scale / dpr` |
| `playCssWidth`, `playCssHeight` | `internalWidth × cssPerInternal`, same for height: the canvas's CSS size, and the play area's size in CSS px |
| Also returned | `dpr` (after the fix-up) and `target`, for readouts |

**Leftover strip.** Because the grid is rounded down, the canvas can be a little smaller than the window: under one internal pixel on the right and bottom. The canvas sits at the top left; the strip shows the page background, which is the same Dusk as the play area, so nothing is visible. No centring and no letterbox in F-10. Example: 412x915 at 2.625 gives scale 6, 180x400 internal, canvas 411.43x914.29 CSS px.

**Using it.** `src/main.js` calls it on start and on every resize with `innerWidth`, `innerHeight`, `devicePixelRatio`. It sets `canvas.width/height` to the internal size and `canvas.style.width/height` to the play CSS size in px. When it returns `null`, keep the last view (as R-02 keeps the last bounds). `index.html` canvas CSS: drop `width: 100vw; height: 100vh`, add `image-rendering: pixelated`. The game reads the view, never `canvas.width` or `canvas.height`.

**How F-11 extends it.** No new parameters needed: F-11 passes the safe-area-trimmed portrait column size instead of the window size, and positions the canvas element. Taps are measured from the canvas's own `getBoundingClientRect()`, so moving the canvas needs no change to the mapping.

**2. Units: logic, internal pixels, CSS px**

- The play area is 1.0 wide and `internalHeight / internalWidth` tall, so the world maps exactly onto the drawn canvas.
- **Sizing (S1 fix):** `circleRadius(view.playCssWidth)`. `widthPixels` becomes the play CSS width; the `CIRCLE_REFERENCE_WIDTH_DP` fallback is only used before the first view exists.
- **Drawing:** world to internal pixels is "multiply by `internalWidth`". New `circlePixels(view, circle)` in `view.js` returns whole internal pixels: `size = max(1, round(2 × radius × internalWidth))`, `left = round(x × internalWidth − size / 2)`, same for `top`. `drawCircle` draws that disc as whole-pixel rows (new `discRows(size)` in `src/circle.js`, a list of row offset and width), not with `arc()`, because `arc()` blends edge pixels even with smoothing off. Symbol drawn on top, centred on the disc.
- **Taps:** `cssToWorld(view, cssX, cssY)` returns `{ x: cssX / playCssWidth, y: cssY / playCssWidth }`, with `cssX, cssY` measured from the canvas's top left. `handleInput` uses it; hit testing stays in widths against the logic radius.
- **Same size when the target changes from 180 to 240:** only approximately, because both the scale and the disc snap to whole pixels. Tolerance: the drawn diameter in CSS px is within one internal pixel (`cssPerInternal`) of the ideal, `2 × radius × cssWidth`, at both settings. At 360 CSS wide with 180, it is exactly 64 at device scale 1, 2 and 3. With 240 at device scale 3 it is 63.33 (38 internal px at 5/3 CSS px each), which passes. Crossing time does not depend on the target at all (logic is in widths).

**3. Tests**

`tests/unit/view.test.js`, values written from the rules above, not copied from the code's output:

| # | Case | Expect |
|---|---|---|
| V1 | 360x800, dpr 1, target 180 | scale 2, 180x400, cssPerInternal 2, play 360x800 |
| V2 | 360x800, dpr 2 | scale 4, 180x400, cssPerInternal 2, play 360x800 |
| V3 | 360x800, dpr 3 | scale 6, 180x400, cssPerInternal 2, play 360x800 |
| V4 | 412x915, dpr 2.625 | scale 6, 180x400, cssPerInternal 6/2.625, play about 411.43x914.29 |
| V5 | Grid: widths 320, 360, 412, 768, 1280; heights 640, 800, 915; dpr 1, 1.5, 2, 2.625, 3 | scale is a whole number of at least 1; `internal × scale` is at most the device size and adding one more internal pixel would pass it, for both axes; play size is at most the window |
| V6 | 306x600, dpr 1 (306/180 = 1.7) | scale 2, internal width 153 (rounding, not rounding down) |
| V7 | 80x100, dpr 1 | scale 1, 80x100 (scale never 0) |
| V8 | 360x800, dpr 1.15 | internal width 207 (float allowance) |
| V9 | Width or height 0, negative, `NaN`, `Infinity` | `null` |
| V10 | dpr 0, `NaN`, `undefined` | same result as dpr 1 |
| V11 | 360x1, dpr 1 | `null` (height under one internal pixel) |
| V12 | Target 240 at 360x800, dpr 2 and dpr 3 | dpr 2: scale 3, 240 wide; dpr 3: scale 5, 216 wide; play width 360 in both |
| V13 | `circlePixels` with `circleRadius(view.playCssWidth)`, 360x800, dpr 1, 2, 3, target 180 | size 32, whole-number left and top, `size × cssPerInternal` is 64 |
| V14 | Same at 412x915 and 1280x800, dpr 1, 2, 2.625, 3, targets 180 and 240 | `size × cssPerInternal` within `cssPerInternal` of `2 × radius × cssWidth` |
| V15 | `cssToWorld` at 360x800 dpr 1, and 412x915 dpr 2.625 | (0, 0) gives (0, 0); (playCssWidth, playCssHeight) gives (1, height in widths); (180, 400) at 360 gives (0.5, 400/360) |

`tests/unit/circle.test.js`: for sizes 1, 2, 7, 16 and 32, `discRows(size)` has `size` rows, the widest row is `size` wide, rows are symmetric top to bottom and left to right, and every row is inside the square.

**Mutation checks** (each must break at least one test; restore after):

| Break | Caught by |
|---|---|
| `round` to `floor` in `scale` | V6 |
| `round` to `ceil` in `scale` | V4 |
| Remove `max(1, …)` | V7 |
| `floor` to `round` or `ceil` for the internal size | V5 |
| Remove the `1e-6` allowance | V8 |
| `cssPerInternal = scale` (forget `/ dpr`) | V2, V3 |
| Remove the bad-size guard | V9, V11 |
| `cssToWorld` divides by `internalWidth` | V15 |
| `circlePixels` multiplies by `playCssWidth` | V13 |
| `discRows` row width off by one | circle test |

Browser mutation (not a unit test, because `src/game.js` needs the DOM): put `canvas.width` back into `handleInput`; edge taps in the game now miss. Static check: `git grep -n "canvas\.width\|canvas\.height" src/game.js` finds nothing.

**4. Dev scenes and how QA measures**

- **`?dev=render` (new):** a test card at internal resolution, drawn with `fillRect` at whole coordinates: a one-pixel checkerboard patch, one-pixel lines across and down, a 2x2 block grid, and a frame on the canvas edge. Readout: target, internal size, scale, dpr, CSS per internal pixel, play CSS size, leftover strip in device px. Button "Internal width 180 / 240" re-runs `computeView` with the other target, so QA can compare without editing code.
- **`?dev=circles` (extended):** its canvas becomes full window width (outside the page padding), sized through `computeView` like the game, `bounds.height` from the view. It adds a still, game-sized circle (`circleRadius(view.playCssWidth)` and `drawCircle`, the game's own calls) centred on a whole internal pixel, away from the moving dot's path. The existing dot and crossing readouts stay as they are. New readouts: view numbers as above, "Circle diameter (internal px)", "Circle diameter (CSS px)", circle centre in CSS px, last tap (CSS x, y; world x, y; hit or miss). Taps use `pointerdown` and `cssToWorld`. Buttons: "Internal width 180 / 240" and "Calm speed" (dot at 0.05 widths a second, Risks 1). `window.__pastelPopDev.circles` adds `diameterCss`, `diameterInternal`, `centreCss`, `radiusCss`, `lastTap`, and the view numbers.

**QA method.** Viewport 360x800 at device scale 1, 2 and 3 (and 412x915 at 2.625 for the leftover strip). Use a fresh Playwright browser context with `deviceScaleFactor` set, if the Playwright tool offers a way to run Playwright code; otherwise use the Chrome DevTools Protocol command `Emulation.setDeviceMetricsOverride` with `deviceScaleFactor`, then reload. If neither is possible with `@playwright/mcp@0.0.83`, say so in the QA log and ask the owner to run the three scales in Chrome DevTools' device toolbar. Do not change `.mcp.json`. At each scale, check:

1. `devicePixelRatio` in the readout matches the emulated scale.
2. Measured diameter, independent of the readout: in the page, read one row of the canvas through the circle's centre (`getImageData`) and count the pixels in the circle's colour, then multiply by `canvas.getBoundingClientRect().width / canvas.width`. It must be 64 CSS px within 1 px and match the readout. Also take a screenshot and zoom in on one edge: steps are whole blocks, 2 CSS px each.
3. Taps: at the circle's centre plus and minus 30 CSS px on each axis (2 CSS px inside the 32 px radius): 4 hits. At plus and minus 34 CSS px: 4 misses.
4. `?dev=render`: zoomed screenshot of the checkerboard and lines shows hard edges and only the card's own colours. Canvas CSS width times dpr is a whole number equal to `internalWidth × scale`.
5. Press "Internal width 180 / 240" in both scenes: chunkiness changes, the diameter readout stays within one internal pixel of 64 (63.33 at scale 3 is a pass), and the crossing time is unchanged.
6. Game at `/`: circles are blocky and sharp, and tapping the right ones still clears them at each scale. In preview, `?dev=render` opens the normal game.

**5. Commit steps**

| # | Commit | Proved by |
|---|---|---|
| 1 | `INTERNAL_WIDTH_TARGET` and `computeView`, `cssToWorld`, `circlePixels` in `src/render/view.js`, with `tests/unit/view.test.js` | `npm test` |
| 2 | `discRows` and the whole-pixel disc in `drawCircle`, with `tests/unit/circle.test.js` | `npm test` |
| 3 | Game on the view: `src/main.js` resize, canvas CSS in `index.html`, `src/game.js` bounds, radius, taps and drawing in view units (S1) | Grep check above; game plays at scale 1, 2, 3 |
| 4 | `?dev=render` scene and its entry in `src/dev/index.js` | QA steps 1 and 4 |
| 5 | `?dev=circles`: full-width view canvas, game-sized circle, readouts, taps, two buttons | QA steps 2, 3, 5 |
| 6 | `CLAUDE.md` structure table (`src/render/`, new tests, new scene) | Read-through |

### 3b. Deferred from the F-01 to F-09 retrospective review

Details for each are in that review's report; not repeated here.

- **S5:** manifest colours. Deferred; fold into the task that next touches `public/manifest.json`.
- **Nits N1 and N3 to N9.** Deferred; pick up opportunistically when the files are next touched.
- **Three real-phone questions** raised by the review. Deferred to F-19.
- **Loop resilience (tech lead, from S4):** an exception in `update` stops the loop permanently and freezes the screen. Decide in F-15 or F-18 whether the loop should catch, report and keep going in dev only or in production too.

## 4. Risks

| # | Risk | How we catch it early |
|---|---|---|
| 1 | **Slow movement may look steppy.** At 180 pixels wide, a slowly drifting Calm circle moves one pixel at a time, several times a second. That is normal for pixel art but may clash with GD's "slow, smooth drifting". The fix (placing sprites more finely than the pixel grid) changes the renderer and gives "mixed" pixel sizes | `?dev=circles` gets a Calm-speed setting in F-10. Owner and game designer look at it on a phone in F-19, before any art is drawn. See Decision 7 |
| 2 | **Whole-number scaling and `image-rendering: pixelated`** are standard, but I have not seen them on a low-end Android WebView for this game | F-10 checks three scales in the browser; F-19 checks a real phone. Fallback recorded in D-004 |
| 3 | **The flash budget needs a design answer.** At 10 taps a second, most taps are over the 3-a-second budget. Every tap must still give feedback (GD Feel), so over-budget taps need a quieter form whose brightness change is below the flash threshold. What that looks like is not written anywhere | Question raised below for the wellbeing advisor and game designer. F-14 and F-15 proceed with a placeholder quiet form |
| 4 | **The layer is only central if nothing goes round it.** A future feature could draw its own flash | Rule in D-005; code review; the F-16 meter counts real pixels and would show it |
| 5 | **The dev meter is not the release measurement.** WB 10 requires measuring on a real device at 60 and 120 Hz | Stated in F-16; the release checks stay in the backlog |
| 6 | **Reduce motion inside the Android app is unconfirmed.** In a browser `prefers-reduced-motion` follows Android's "Remove animations" (MDN). I have not confirmed the same inside the Capacitor WebView | F-19 checks Chrome on Android now. The WebView check stays open until Capacitor is approved and installed. The in-game switch works regardless |
| 7 | **Safe areas cannot be fully tested yet.** A phone browser usually reports no inset in portrait | F-11's "pretend notch" control now; real check once the Capacitor build exists |
| 8 | **The stripped-down shell looks worse than the prototype for a while** | Expected and temporary. The dev level index is the thing to look at during this plan, not the start screen |
| 9 | **Formatting commit makes history noisy** | One formatting-only commit in F-05, after the deletions |

## 5. Questions for other agents

Not blocking: each has a placeholder constant. Answers are needed before the first real game effect is built.

| For | Question |
|---|---|
| wellbeing-advisor | What may an over-budget tap show? Proposed: a quiet form of the burst with a brightness change under the flash threshold, or a shape-only fade |
| wellbeing-advisor | Does one "brighten once and fade" burst count as one flash for the budget? The limiter assumes yes |
| wellbeing-advisor | Numbers for sound: most effect sounds at once, shortest fade-in, how far a burst of taps may rise above a single tap |
| game-designer | Reduce motion: if the phone's setting is on, can the player switch it off in the game? The plan assumes no: on if either is on |
| game-designer | How should circle size scale on tablets and wide screens? The plan uses a centred portrait column |
| game-designer | Is one-pixel-at-a-time slow drift acceptable for Calm (Risks 1)? |

## 6. Decisions needed from the owner

**Outcome, 2026-10-11:** the owner accepted the recommendation on decisions 1 to 7. Decision 8 is deferred and will be raised again as its own proposal. Decision 7 stays open by design: build pixel-stepped, then choose at F-19 on a real phone.

Tools first. The game keeps zero runtime dependencies under every option: all packages below are dev-only, used on the development machine and never shipped to players.

| # | Decision | Options | Recommendation | Cost of deciding later |
|---|---|---|---|---|
| 1 | **Delete the retired prototype code now, or replace it bit by bit?** (D-001) | (a) Delete first, leaving a plain bouncing-circles scene. (b) Keep it and remove each piece as its replacement lands | **(a) Delete first.** It is about 70% of the code, includes effects the safety rules have already retired, and everything is still in the project history | Every later task has to work around it, and F-03 would have to move `rain.css` into the build only to delete it later |
| 2 | **The offline cache file (`sw.js`): switch it on, park it, or remove it?** (D-002) It has never been switched on, and its file list is wrong | (a) Remove. (b) Leave it in place unused. (c) Rewrite and switch on | **(a) Remove.** The Android app carries its own files and works offline without it. A wrong cache is a common cause of "my fix did not appear" | None. It can be written fresh if a website version of the game is ever wanted |
| 3 | **Test runner** (D-007) | (a) The one built into Node: **no package at all**. (b) `vitest`, dev-only: nicer reports and watch mode, but a new package with its own dependencies | **(a) Built-in.** Our logic is plain functions, which is all it needs. Fewest tools | Small: while tests are few, switching is a rename in each test file |
| 4 | **Lint and format tool** (D-008). Catches mistakes such as misspelt names, and keeps code laid out one way | (a) `@biomejs/biome`, dev-only: one package does both jobs. (b) `eslint` + `@eslint/js` + `globals` for checking and `prettier` for layout: four dev-only packages, the most widely used choice. (c) Nothing | **(a) `@biomejs/biome`.** One package in place of four. Known limit: its layout support for `.html` files is still experimental, so `index.html` would be checked but not auto-formatted | Grows with the code: the later it is added, the bigger the one-off reformat |
| 5 | **Automated browser tests** (D-009). A package (`@playwright/test`, dev-only) that replays QA checks on its own | (a) Not now: QA keeps using the browser tool already set up. (b) Add now | **(a) Not now.** There is nothing stable to replay yet. Revisit after F-18 | None now. Until then, regression checks are repeated by hand by the QA tester |
| 6 | **Placeholder pixel resolution of 180 wide** until your art reference arrives | (a) Proceed with 180. (b) Wait for the reference | **(a) Proceed.** It is one number, and F-10 proves changing it affects nothing else | None. Waiting would stall F-10 onward for no gain |
| 7 | **How slow movement should look** (Risks 1) | (a) Pixel-stepped, the classic look. (b) Smooth, with sprites placed more finely than the pixel grid | **Decide at F-19**, looking at it on your phone, with the game designer's view. Start with (a): it is simpler and cheapest on slow phones | Rises sharply once art is being drawn: changing after that means renderer rework and possibly redrawn art |
| 8 | **Automatic checks on GitHub** for every proposed change (build, lint, tests) | (a) Add after F-06. (b) Leave for later | **(b) for now**, then a separate small proposal. It is an outside service, so it needs your explicit yes | Low while one person and local agents do all the work |

Not asked here, noted for later: upgrading Vite from 6.4.4 to 8.x. It is an existing dev tool, not a new one, and is best done as its own small task after F-18.

## 7. What this plan is blocked on

- **Nothing outside the project blocks it.** The art reference, music, store rating, and the two Android tech checks do not hold up any task; each has a placeholder or sits outside foundations.
- **Decisions 1 to 7 are settled** (see section 6), so no task waits on the owner. F-05 adds `@biomejs/biome` as approved under D-008.
- **Still open, not blocking:** how Reduce motion reads the Android setting inside the app, how to open straight into Calm, vibration on Android, the cost of the pixel-art glow. All four need Capacitor or final art first.
