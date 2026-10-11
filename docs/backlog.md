# Backlog

Refreshed 2026-10-11 against `docs/game-design.md` Draft v0.5 and `docs/wellbeing.md` v0.4. Code references were re-checked against the code that day. One line per item; remove items when done.

References: **GD** = `docs/game-design.md` section, **WB** = `docs/wellbeing.md` section. Design values quoted here are starting values; the design doc is the source of truth.

## Done: production build (F-01 to F-04, merged 2026-10-11)
Static files are in `public/`, the service worker and the fake 1.1 MB favicon are gone, the manual cache-busting query is removed, and Google Fonts is dropped, so the game makes no outside network call. The build is about 308 kB. Left over:

- `public/icon-512.png` is still 233 kB; it could not be shrunk with the tools on the machine and no new tool was installed.
- The build uses root-absolute paths (`/favicon.png`, `/manifest.json`, `/assets/...`). Fine from a site root; a sub-folder or `file://` origin would break them. Settle Vite's `base` setting when Capacitor is wired up.
- The favicon and icons still show the old "POP" on mint green and do not match the Dusk look; replace with the final art.

## Next: engineering foundations
Build order and task IDs are in `docs/foundations-plan.md`. **Done and merged (2026-10-11): F-01 to F-09** — retired code deleted, production build fixed, lint and format (Biome), unit tests (Node's runner), one elapsed-time loop, the dev level (`/?dev`), and circle logic in screen widths per second. **Left: F-10 to F-19** — rendering (F-10), layout (F-11), input (F-12), settings (F-13), effects-safety layer (F-14 to F-17), clean-up and phone check (F-18, F-19). QA results are in `docs/qa-log.md`. Items below with no task ID are not in that plan.

- Canvas ignores `devicePixelRatio`, so it is blurry on phone screens; the target swatch canvas has the same problem (F-10).
- No pixel-art rendering path: draw at a low internal resolution and scale up with smoothing off (GD Look). The exact internal resolution waits on the art reference (see Blocked). (F-10)
- Circle size is now screen-relative (64 dp at 360 wide, 48 dp floor) with a PROVISIONAL 112 dp maximum for wide windows (`CIRCLE_MAX_DIAMETER_DP`); revisit the maximum when F-11 makes the play area a portrait column, and ask the game designer how size should scale on tablets.
- No safe-area handling for notches: no `viewport-fit=cover` and no `env(safe-area-inset-*)` in `index.html` (F-11).
- Touch input reads only the first active finger, so a second finger's tap lands at the first finger's position; the safety tests assume several fingers at once (F-12; GD Sensory safety Tier 1; WB 4).
- No central effects layer. Build one that every visual and sound effect goes through, enforcing: at most 3 flashes a second counted across the whole screen, no saturated red flashing, no full-screen flash or per-tap full-screen colour change, pulses on one shared clock, one shake at a time, Reduce motion substitutions, time-based effects only (GD Sensory safety; WB 4, including the Reduce motion table).
- Circle movement, bounce and bounds are now in `src/logic/world.js` with tests; target selection, level refill and hit-testing are still inside `src/game.js` with drawing and DOM updates. Move them into `src/logic/` as the real modes are built.
- No CI: run build, lint and tests on pull requests (no `.github/` directory exists). Not in the foundations plan; deferred by the owner 2026-10-11, to be raised as its own proposal.
- Vite is on 6.4.4; latest is 8.3.4, two majors ahead (`package.json` asks for `^6.3.5`).
- README is minimal and describes the prototype; rewrite once commands and structure settle.
- Hit-testing checks only the topmost circle, so a correct tap is swallowed when a non-matching circle overlaps the matching one (found by QA in F-02 and F-07). Calm's design says circles do not overlap and the matching circle wins a tie (GD Calm mode, Missed tap); fix with F-12 or when Calm is built.
- The pause overlay covers the Pause button, so only "Continue Playing" resumes; and the Pause button shows faintly behind the main menu on first load because its markup is not hidden until Start (found by QA in F-01 and F-02; F-11).
- The target swatch is about 1 times a play circle, not the 1.5 times the design asks for, because a larger one overlaps the Pause button at 360 wide; game circles can also pass under it (F-11).
- Placeholder UI: button shapes are only 1.26:1 against Dusk (labels are fine), and there is no pressed style, so the hover colour sticks briefly after a touch (found by QA on the palette task).
- Placeholder symbols are small (8% to 16% of circle area; the leaf is smallest). Judge on a real phone; final symbols come with the pixel art.
- A first-time player may not realise the swatch is the thing to match: there are no words and the swatch glow is not built (QA note for playtests; GD Open questions 12).
- `vite.config.js` is not covered by lint or format (only `src/`, `tests/` and `index.html` are).
- No scene-level tests for the dev level's wiring, readout or read-only object; covered by QA in the browser only.

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
**Done (F-01 and F-02, merged 2026-10-11).** The 10 experimental modes, Rain, both mode dropdowns, the named leaderboard and its `prompt()`, the score, high score and time bonus, game over, the per-tap tint, the shake, the swoop-in, the ripple and glitch effects, and the colour names and "psychology" strings are deleted (GD Core loop; GD Sensory safety Tier 1; WB 4 retired effects table). What remains in `src/game.js` is plain scaffolding, to be replaced as Calm and Story are built (F-18 removes whatever is left).

- **Saved data:** the old `pastelPopHighScore` and `pastelPopLeaderboard` localStorage keys are no longer read or written. A returning prototype player may still have them stored; nothing clears them.
