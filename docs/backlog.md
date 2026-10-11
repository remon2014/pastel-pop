# Backlog

Refreshed 2026-10-11 against `docs/game-design.md` Draft v0.5 and `docs/wellbeing.md` v0.4. Code references were re-checked against the code that day. One line per item; remove items when done.

References: **GD** = `docs/game-design.md` section, **WB** = `docs/wellbeing.md` section. Design values quoted here are starting values; the design doc is the source of truth.

## Now: broken production build
Planned as F-03 and F-04 in `docs/foundations-plan.md` (approved by the owner 2026-10-11). The retired prototype code is deleted first (F-01, F-02; see "Retired with the prototype" below and D-001), so `rain.css` is deleted rather than moved.

- `sw.js`, `icon-192.png` and `icon-512.png` sit in the repo root and are missing from `dist/`; move static assets into `public/` (CLAUDE.md rule).
- The manifest ships, but hashed into `dist/assets/`, so its relative icon paths and `start_url` resolve to the wrong place (`manifest.json:4`, `manifest.json:10`, `index.html:5`).
- Service worker is never registered anywhere, and its cache list names dev-only source paths and Google Fonts (`sw.js:4`); decided: delete it (D-002, F-03).
- `favicon.ico` is a 1.1 MB 1024×1024 PNG with the wrong extension, and it does ship in the build; replace with a real small icon. Compress `icon-512.png` (233 kB).
- Unused scaffold file `public/vite.svg` is copied into every build; `src/javascript.svg` is also unused.
- Manual cache-busting query on the module script (`index.html:344`); Vite already hashes builds.

## Next: engineering foundations
The design's tuning values mean nothing until these are in place (GD Dependencies). Build order and task IDs are in `docs/foundations-plan.md`: lint and tests (F-05, F-06), loop and dev level (F-07, F-08), logic split and units (F-09), rendering (F-10), layout (F-11), input (F-12), settings (F-13), effects-safety layer (F-14 to F-17), clean-up and phone check (F-18, F-19). Items below with no task ID are not in that plan.

- Movement is per frame with no delta time, so speed doubles on 120 Hz screens (`src/circle.js:61`); the loop passes no elapsed time (`src/game.js:231`, `src/game.js:270`). (GD Sensory safety Tier 1; WB 4)
- Pause then quick resume can start a second game loop, doubling speed (`src/game.js:199`, `src/game.js:207`); the new loop must guarantee a single running loop.
- Canvas ignores `devicePixelRatio`, so it is blurry on phone screens (`src/main.js:22`).
- No pixel-art rendering path: draw at a low internal resolution and scale up with smoothing off (GD Look). The exact internal resolution waits on the art reference (see Blocked).
- Circle radius is a fixed 50 px (`src/config.js:2`); size circles relative to the screen, never under 48 dp, aiming for about 64 dp (GD Accessibility). Speeds are also fixed pixels per frame and must become screen-relative: 1.0x is one screen width in about 4 s (GD Story mode, Level tuning).
- Resize changes the canvas size but does not reposition circles (`src/main.js:26`).
- No safe-area handling for notches: no `viewport-fit=cover` and no `env(safe-area-inset-*)` (`index.html:9`).
- Touch input reads only the first active finger (`e.touches[0]`, `src/game.js:152`), so a second finger's tap lands at the first finger's position; the safety tests assume several fingers at once (GD Sensory safety Tier 1; WB 4).
- No central effects layer. Build one that every visual and sound effect goes through, enforcing: at most 3 flashes a second counted across the whole screen, no saturated red flashing, no full-screen flash or per-tap full-screen colour change, pulses on one shared clock, one shake at a time, Reduce motion substitutions, time-based effects only (GD Sensory safety; WB 4, including the Reduce motion table).
- Game rules are tangled with drawing and DOM updates in `src/game.js`; separate them so rules can be tested without a canvas (tech-lead principle; needed for the tests below).
- No tests: add a test runner and a `test` script (F-06; decided: Node's built-in runner, no package, D-007). First coverage: time bar and wrong-tap cost, star rules, story assist, target selection and target changes, save and load, the effects-layer limits.
- No lint or formatting: add `lint` and `format` scripts (F-05; decided: `@biomejs/biome`, D-008).
- No CI: run build, lint and tests on pull requests (no `.github/` directory exists). Not in the foundations plan; deferred by the owner 2026-10-11, to be raised as its own proposal.
- No dev-only test sandbox: build the dev level, one scene per system behind `?dev=`, absent from production builds (F-08, D-006).
- Vite is on 6.4.4; latest is 8.3.4, two majors ahead (`package.json` asks for `^6.3.5`).
- Google Fonts is the only external network call and fails offline (`index.html:7`, also listed in `sw.js:13`); self-host or drop it, since the game must work fully offline (GD Audience). The replacement fonts are a design choice (GD Look).
- "Return to Main Menu" reloads the whole page (`src/game.js:41`); screen changes must be instant, with no reload (GD Calm mode, Instant start).
- Prototype colour names and "psychology" strings must not reach players or the store (`src/colorManager.js:10`, `:14`, `:20`, `:53`; comments in `src/particle.js`). (GD Wording and claims; WB 2)
- Dead code in `src/colorManager.js`: `emotionalSchemes` (`:52`), `dynamicEffects` (`:60`), `getEmotionalScheme` (`:100`), `getRippleEnhancement` with its truncated `switch` (`:142`, `:161`), `getEnhancedColor` (`:180`).
- Other dead code: unused entrance fields (`src/circle.js:36`), `setRestartHandler` and `targetColorText` (`src/uiManager.js:58`, `:10`), `#menuBtn` style for an element that does not exist (`index.html:193`).
- Debug `console.log` calls left in (`src/main.js:8`, `sw.js:21`).
- README is minimal and describes the prototype; rewrite once commands and structure settle.

## Then: v1.0 game features
Not a plan and not in build order within a group. Each needs the foundations above.

### Shared
- Target shown as a large symbol and colour swatch, with no word to read; every circle carries its colour and symbol (GD Core loop; GD Accessibility).
- At most 5 circle colours, each with a bold distinct symbol silhouette, never clusters of dots or holes; the game must be playable in greyscale (GD Look; GD Accessibility; WB 4).
- Tap feedback at the circle itself: pixel burst, sound and optional vibration; small and quiet in Calm, bigger and brighter in Story, always local to the circle (GD Feel; WB 6).
- Pixel-art glow as stepped rings, never a smooth blur, used only on the target, the travelling light and restored mural sections (GD Look, Glow).
- Launch screen: clearly different Calm and Story buttons, quiet, no fast animation, no Story music, no mural or lantern imagery (GD Launch screen; WB 5).
- Settings screen: Reduce motion (also following the phone's system setting), separate music and effects sliders, vibration on or off; every choice remembered, including mute (GD Accessibility; WB 4, WB 9 decisions 1 and 2).
- Reduce motion behaviour per effect, in both modes (GD Sensory safety, Reduce motion on; WB 4 table).
- Portrait orientation only (GD Interruptions and saving).
- Auto-pause when the app goes to the background or a call arrives; nothing in the code listens for this today (GD Interruptions and saving).
- Audio, starting from nothing: there is no audio code and no audio file in the repo. Music per mode, effects, separate music and effects volume, fades in and out on entering and leaving a mode, a cap on overlapping sounds, no sudden loud sound (GD Feel; GD Sensory safety Tier 1; WB 4 Sound).
- Readable text against every background, with a clean font for story text if the pixel font is hard to read on a small phone (GD Look; GD Accessibility).
- No accounts, no analytics, no push notifications, no network calls (GD Audience; WB 8).

### Calm mode
- One endless level with no timer, score, stars, counters, lives or fail state (GD Calm mode, Structure and No pressure).
- One tap in from the launch screen and instant out, with no menu, countdown or confirmation (GD Calm mode, Instant start).
- Slow drifting motion with the shared 10-second swell-and-settle rhythm; the target glow pulses on the same rhythm (GD Calm mode, Motion and Swell; WB 5).
- 4 to 6 circles and 3 colours; circles never expire; replacements arrive over 1 second or more; a target-colour circle is always on screen (GD Calm mode, Density and Circle arrival).
- Target changes after a number of clears, never on a clock: a 2-second swatch crossfade, old and new target both accepted during it (GD Calm mode, Target changes).
- Wrong tap: one small slow wobble on that circle and a gentle sound quieter than the pop; no penalty (GD Calm mode, Wrong tap).
- Calm palette and dim warm background; no praise or evaluative text; no story imagery (GD Calm mode, Palette, No judging words, Kept apart from the story; WB 4 Tier 2).
- Calm audio: seamless ambient loop, 1 to 2 second fade-in, pops below the music bed (GD Calm mode, Audio; WB 5).
- Returning from a pause fades straight back in, with no overlay and no countdown (GD Calm mode, Coming back from a pause).
- Vibration off by default in Calm (GD Calm mode, Vibration).
- Optional way to open straight into Calm, set up by the player, labelled "Calm"; music still fades in from it (GD Launch screen; WB 2, WB 5). Mechanism undecided (see Blocked).

### Story mode
- 3 stages of 5 levels, driven by the level tuning table: colours, circle count, speed, clears needed, time bar, target changes (GD Story mode, Structure and Level tuning).
- Mid-level target changes with a clear cue (GD Core loop step 4; GD Level tuning).
- Time bar as the one visible resource; a wrong tap removes a chunk (3 s) that slides or fades away over 300 to 500 ms (GD Story mode, Time bar).
- Wrong tap: one small decaying shake of 200 ms or less, never stacked; a brief dim under Reduce motion; never a red flash (GD Story mode, Wrong tap; WB 6).
- Low time: the bar pulses at most twice a second, changing brightness, colour or opacity only, with a quickening tick on the effects slider (GD Story mode, Low time; WB 6).
- Failure: "Nearly! Try again", a 0.5 to 1 second fade, then an automatic restart of that level; earlier progress kept (GD Story mode, Failure).
- Story assist: after 3 fails on a level, quietly offer a longer time bar; using it caps that level at 1 star (GD Story mode, Story assist).
- Stars (1 to 3) and best time per level; no points score and no leaderboard (GD Story mode, Score). Thresholds are still a proposal (see Blocked).
- Wordless onboarding in the first level: one slow target circle with a pulsing hint, then a second colour (GD Story mode, Onboarding).
- Content note on first entry to Story mode (GD Story mode, Content note; WB 7).
- Reveal beat after each level: a gradual colour fade of 1 second or more with no bloom, the popped colours flowing in as one stream, one story line that waits for a tap, skippable by tap with no loss of progress; plain crossfade under Reduce motion (GD Core loop step 5; GD Story and reveal, Reveal beat; WB 6).
- Mural shown quiet and low in contrast behind the circles during play (GD Story and reveal, During play).
- Mural gallery: finished murals revisited in full colour with their story lines (GD Story and reveal, Gallery).
- Save progress after every level: levels cleared, stars, best times, mural sections, assist use, fail counts as needed (GD Interruptions and saving; GD Story mode, Failure).
- Story content in the game: Stage 1's five lines are written; Stages 2 and 3 are outlines only (GD The legend). See Blocked.

### Android
- Capacitor wrapper for the Android build. Capacitor is not installed or configured today, and adding it is a new dependency that needs the owner's approval (CLAUDE.md Stack; GD Version 1.0 scope).

## Before release: checks
- Measure on a real phone at 60 and 120 Hz: the 10-taps-a-second test with several fingers on every tap effect, the bar pulse at 2 a second, and bar pulse, other pulses and pop bursts together (WB 10).
- Walk the whole release checklist (WB 11).
- Record source, licence and required attribution for every music track and sound; each must allow commercial use (GD Dependencies).
- Wellbeing advisor reviews the tuned Calm values, the store copy and the shortcut label (GD Dependencies; WB 10).
- Play Console: complete the Health apps declaration form accurately (WB 10).
- Check the store for names clashing with "Pastel Pop" (GD Open questions 5).

## Blocked: waiting on others
- **All final art** (circles, symbols, murals, launch screen, UI): waits on the owner's art references, then on a game-artist agent that does not exist yet (GD Dependencies; GD Look, Art reference pending).
- **Internal resolution and glow treatment:** wait on the art reference (GD Open questions 3). The rendering path itself can be built first with a placeholder resolution.
- **Music and sounds:** wait on the owner's uploads, each with a commercial-use licence; Calm and Story need different music (GD Dependencies). The audio system can be built first with placeholder sounds.
- **Stage 2 and Stage 3 story lines and pictures:** wait on the game designer to write them, then on a wellbeing-advisor review (GD The legend; WB 7, WB 10).
- **Star thresholds:** still a proposal; waits on the owner's agreement (GD Open questions 4).
- **Store rating, target audience and Families policy:** deferred by the owner; must be settled before release and may constrain the Android build and listing (GD Open questions 1; WB 9 decision 8).
- **Final store copy check** (not a health app, no claims): cannot be done until the listing is written (WB 10).
- **Tech-lead check, not yet done:** how Reduce motion reads the Android system setting inside the app (GD Accessibility; WB 10).
- **Tech-lead check, not yet done:** which Android mechanism opens straight into Calm: home-screen widget, app shortcut or in-app setting (GD Open questions 2).
- **Tech-lead check, not yet done:** vibration behaviour on Android, and the cost of the pixel-art glow on low-end phones (GD Dependencies).
- **Calm tuning values:** wait on playtests, then on the wellbeing advisor (GD Calm mode, closing note).
- **Unverified evidence sources** (Shao, Fish, NICE, Mind): owned by the wellbeing advisor; does not block building (WB 10).

## Retired with the prototype
The design retires these (GD Core loop; GD Story mode, Score; GD Sensory safety Tier 1; WB 4 retired effects table). Their individual bugs are no longer tracked; the work left is deleting the code as the new modes replace it.

- **Retired:** the 10 experimental modes and their palettes; Rain mode; both mode dropdowns; the named top-5 leaderboard, its `prompt()` name entry and the high score; the points score and time bonus; game over on one wrong tap and the red "Game Over!"; the target shown as a colour name; the per-tap full-screen background tint; the canvas shake, glitch dots, large ripple rings and swoop-in entrance as built; all frame-counted effects.
- **Whole files to delete:** `src/gameModes.js`, `src/leaderboard.js`, `src/rainEffect.js`, `rain.css`, `src/particle.js` (ripple, glitch and a duplicate `ColorManager` class).
- **Parts to delete:** in `src/game.js`, the mode, Rain, tint (two overlapping fade implementations), score, time-bonus and game-over code; in `src/colorManager.js`, the mode palettes and Rain background; in `src/circle.js`, `animateIn`; in `src/uiManager.js`, the score, high-score and game-over methods; in `index.html`, the dropdowns, leaderboard, score HUD, "Game Over!" panel, `.shake` animation and both `rain-container` elements; in `src/main.js`, the leaderboard and high-score wiring.
- **Saved data:** the old `pastelPopHighScore` and `pastelPopLeaderboard` localStorage keys are no longer read once this code goes.
- Update the structure table in `CLAUDE.md` when these files are removed.
