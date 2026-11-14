# Backlog

Refreshed 2026-10-11 against `docs/game-design.md` Draft v0.5 and `docs/wellbeing.md` v0.4. Code references were re-checked against the code that day. One line per item; remove items when done.

References: **GD** = `docs/game-design.md` section, **WB** = `docs/wellbeing.md` section. Design values quoted here are starting values; the design doc is the source of truth.

## Done: production build (F-01 to F-04, merged 2026-10-11)
Static files are in `public/`, the service worker and the fake 1.1 MB favicon are gone, the manual cache-busting query is removed, and Google Fonts is dropped, so the game makes no outside network call. The build is about 308 kB. Left over:

- `public/icon-512.png` is still 233 kB; it could not be shrunk with the tools on the machine and no new tool was installed.
- The build uses root-absolute paths (`/favicon.png`, `/manifest.json`, `/assets/...`). Fine from a site root; a sub-folder or `file://` origin would break them. Settle Vite's `base` setting when Capacitor is wired up.
- Settings use `localStorage`, which works in Capacitor's WebView, but iOS may not always keep it; decide when Capacitor is wired up whether to move to native Preferences (a new plugin, owner decision). Only `src/storage.js` would change (F-13).
- The favicon and icons still show the old "POP" on mint green and do not match the Dusk look; replace with the final art.

## Next: engineering foundations
Build order and task IDs are in `docs/foundations-plan.md`. **Done and merged: F-01 to F-09 (2026-10-11), F-10 to F-16 (2026-11-08), F-16b and F-17 (2026-11-14)** — retired code deleted, production build fixed, lint and format (Biome), unit tests (Node's runner), one elapsed-time loop, the dev level (`/?dev`), circle logic in screen widths per second, sharp rendering, the portrait layout with safe areas, pointer input with a pure hit test, settings with safe storage, the effects safety rules as tested logic, the effects layer on screen, and the dev flash meter. **Left: F-18 and F-19** — settings (F-13), effects-safety layer (F-14 to F-17), clean-up and phone check (F-18, F-19). QA results are in `docs/qa-log.md`. Items below with no task ID are not in that plan.
**Before F-10:** R-01 to R-05, five fixes from the F-01 to F-09 retrospective review; deferred review items (S5, N1, N3 to N9, three real-phone questions) are listed in `docs/foundations-plan.md` section 3b.

- No pixel-art rendering path: draw at a low internal resolution and scale up with smoothing off (GD Look). The exact internal resolution waits on the art reference (see Blocked). (F-10)
- Circle size is now screen-relative (64 dp at 360 wide, 48 dp floor) with a PROVISIONAL 112 dp maximum for wide windows (`CIRCLE_MAX_DIAMETER_DP`); since F-11's 9:16 column the maximum never applies (about 80 dp at 1280x800), so it matters only on portrait tablets; ask the game designer how size should scale there (F-11).
- No central effects layer. Build one that every visual and sound effect goes through, enforcing: at most 3 flashes a second counted across the whole screen, no saturated red flashing, no full-screen flash or per-tap full-screen colour change, pulses on one shared clock, one shake at a time, Reduce motion substitutions, time-based effects only (GD Sensory safety; WB 4, including the Reduce motion table).
- Circle movement, bounce and bounds are now in `src/logic/world.js` with tests; hit-testing is in `src/logic/hit.js` (F-12); target selection and level refill are still inside `src/game.js` with drawing and DOM updates. Move them into `src/logic/` as the real modes are built.
- No CI: run build, lint and tests on pull requests (no `.github/` directory exists). Not in the foundations plan; deferred by the owner 2026-10-11, to be raised as its own proposal.
- Vite is on 6.4.4; latest is 8.3.4, two majors ahead (`package.json` asks for `^6.3.5`).
- README is minimal and describes the prototype; rewrite once commands and structure settle.
- The pause overlay covers the Pause button, so only "Continue Playing" resumes (found by QA in F-01 and F-02). Left out of F-11: Calm has no pause overlay by design (GD Calm mode).
- Game circles can pass under the HUD (target swatch and Pause button); ask the game designer whether they should (F-11).
- In landscape the Pause button overlaps the target swatch: at 800x360 the column is 202 px wide, too narrow for both side by side. Deferred by the owner 2026-11-08; likely solved by a portrait lock in the Capacitor build, otherwise a game-designer choice (Pause on its own row, or a smaller Pause and swatch) (F-11).
- Real-phone checks for F-11: a real notch and gesture bar, rotating a device, swatch sharpness at dpr 3, and how the swatch and Pause feel on a small screen (F-11; with F-19).
- Dev layout scene (`/?dev=layout`): the readout panel covers part of the play area. Dev only (F-11). (Its 44 px button was fixed in F-13, which raised all dev buttons to 48 px.)
- Minimum tap size: the hit floor is a 48 dp diameter (`MIN_TOUCH_DP`), but CLAUDE.md asks about 64 CSS px for moving circles and Calm circles drift; ask the game designer which applies. `TAP_REACH` (1.1) is also provisional (F-12).
- Dev input scene (`/?dev=input`) sizes a full-width canvas instead of the F-11 column, so it cannot show taps mapping in the centred column; lay it out with the real column (review should-fix, F-12).
- `tests/unit/hit.test.js` "nearest" case tests only one circle order; add the reversed order so a topmost-wins rule would fail (review should-fix, F-12).
- Nits: the detach returned by `attachPointer` is never used and dev scenes never clean up listeners; `src/game.js` hit check reads more clearly as `if (!hit || …)` (F-12).
- Real-phone checks for F-12: feel of multi-finger taps, pinch and double-tap zoom blocked on the canvas, the 1.1 tap reach, tapping the swatch while circles pass under it (F-12; with F-19).
- Settings: a subscriber that throws stops later subscribers and makes `set()` throw (`src/settings.js:41`); wrap each call in try/catch (review should-fix, F-13).
- Settings: `name in DEFAULT_SETTINGS` accepts inherited names, so `set('toString', …)` is stored; use `Object.hasOwn` (`src/settings.js:45`) (review should-fix, F-13).
- Settings tests: add Infinity (`1e999`), a `null` field, extra stored fields dropped, a throwing `storage.set` keeping the value in memory, and unsubscribe during notification (review should-fix, F-13).
- Nits: settings save and notify even when a value is unchanged (say so in the `subscribe` comment); the system-setting subscription and the dev scene's subscription are never removed (F-13).
- Vibration is one setting for both modes, default off; the design only settles off for Calm. Ask the game designer about Story. Volume defaults (music 0.5, effects 0.7) are placeholders (F-13).
- Effects: `isSaturatedRed` in `src/effects/colors.js` is unused and `relativeLuminance` is only used inside the file; remove or stop exporting (review should-fix, F-14).
- Effects: `prune` in the limiter assumes time only moves forward; clamp or document it and add a test (it errs safe by over-counting) (review should-fix, F-14).
- Effects nits: the `waitUntil` time can be later than needed; tests copy the Dusk hex instead of importing it; `PLAIN_FADE_SECONDS` lacks a PLACEHOLDER flag; a missing `mode` is silently treated as Story (F-14).
- Effects test gap: shortening the Reduce motion dim's tracked duration fails no test; test the 0.6 s duration (QA, F-14).
- Game designer questions from F-14: the real Story arrival limit (`STORY_ARRIVALS_PER_SECOND` is a PLACEHOLDER 3); whether a 2 internal px, 2-swing shake still feels like a shake; more full Story bursts would need a burst whose brightness change is 0.07 or less, not looser counting (WB section 6) (F-14).
- PLACEHOLDER effect values: `QUIET_FADE_SECONDS` 0.45 and the low-time pulse colour `#E6C070` (F-14).
- Commit hook gap: `.claude/hooks/check-commit.mjs` runs tests and lint on the working tree, not the staged snapshot, so a commit with failing tests can pass while a fix sits unstaged (happened once in F-14, eff7a81). Consider testing the staged tree (for example via `git stash --keep-index`) (F-14; tech lead).
- Effects test: shake bounds in `tests/unit/effectState.test.js` read the limits from config, so a bad config still passes; use 2 px and 0.2 s from WB as literals, assert the decay (second swing no bigger than the first) and offset 0 from 0.2 s (review should-fix, F-15).
- Effects: `forget` does not clear held arrivals, so an arrival held for a circle that has gone is still released later (`src/effects/effects.js:166`) (review should-fix, F-15).
- Effects nits: wobble swing count `2` inline at `effects.js:46` belongs in config; `[...held]` builds a new array every frame (`effects.js:129`); comment that the sorted insert at `effects.js:85-87` is now only a safeguard (F-15).
- Dev effects scene (`/?dev=effects`): at 1280x800 the canvas is taller than the viewport; no readout for dim luminance or shake offset (QA, F-15).
- Game designer questions from F-15: taps get no full bursts while the low-time pulse runs (steady pulse, `TAP_FLASHES_WITH_PULSE` = 0; retired by F-16b, so the slower-pulse question falls away); placeholder looks (arrival halo, burst dots, amber bar); "2 swings" built as one back-and-forth (stricter reading) (F-15).
- Real-phone checks for F-15: how pop, shake, dim and pulse look on a small screen, whether the dim reads as soft, multi-finger tap feel, smoothness on a mid-range Android (F-15; with F-19).
- Flash meter: the "more than 10%" boundary (`src/dev/flashMeter.js:117`) is untested; changing `<=` to `<` survives; add a 10-of-100 versus 11-of-100 cells test. The red 0.8 boundary is also untested (review should-fix, F-16).
- Flash meter nits: `pair.counted` set but never read (`flashMeter.js:100`); toggling the meter in `/?dev=effects` does not reset `lastShake` or `lastMeterHighest`; the `- 4` margin in `drawCalibration` is a magic number; raw count can read slightly high (22 vs 20) when a shape's cells join late; meter cost spikes to 18–27 ms on the frame a calibration event completes (meter on only) (F-16).
- Game designer notes from F-16: the low-time warning should feel urgent but warm (ticking sound carries the urgency, bar soft amber, never red); a bigger-not-brighter pop during the pulse if wellbeing agrees; record when the warning starts (starting value last 5 s or 15% of the bar) (F-16).
- Wellbeing rules 3, 5 and 7 (shake, pulse, area-based counting) are reasoned from WCAG, not measured; F-19's phone check must confirm them (F-16).
- Real-phone checks for F-16: frame rate on a mid or low Android with the meter off; how the calibration block and fades look at arm's length (F-16; with F-19).
- Effects test: the form check at `tests/unit/effects.test.js:95` still allows `quiet` for arrivals, so it cannot catch quiet arrivals coming back; check arrival forms on their own (`full` or `waitUntil` only) (review should-fix, F-16b).
- Effects test: "pulse bar drawn last" has no test (`src/effects/drawEffects.js:130`); add a fake-ctx test that the bar's `fillRect` is the last call (review should-fix, F-16b).
- Pulse bar test: `tests/unit/pulseBar.test.js` composites over Dusk and the palette only; also composite over every effect colour that can be drawn under the bar (halos, bursts) (review should-fix, F-16b).
- Nits: stale comments about beats being counted at `src/config.js:107` and above `MAX_BEAT_LATENESS` in the `effects.js` update loop; `taps` in `limiter.js:53` now also holds Story arrivals (rename to `flashes`); a high `calmArrivalsPerSecond` option would weaken the 2-a-second Calm cap, since Calm arrivals pay no budget (tests only); the dev scene's effect look list overcounts onsets by about 10–15% against real grants (QA) (F-16b).
- Story arrival limit is dead as configured: `STORY_ARRIVALS_PER_SECOND` (3) equals `FLASH_LIMIT`, so the flash budget always limits arrivals first; decide whether the limit should be lower or removed (tech lead, F-16b).
- Game designer, F-16b: the soft pulse bar is safe but barely visible (a 3 px tan strip on Dusk, about 1.3:1 contrast, measured change 0.013); at the 0.07 cap urgency must come from the F-17 ticking sound or a non-brightness cue; choose the final base and peak amber within 0.07; when Calm's target glow drawer is built it joins the 0.07 bar test and pays no budget (F-16b).
- Real-phone checks for F-16b: whether the bar is noticeable outdoors and hand-held, whether the beat feels calm, performance during stress (F-16b; with F-19).
- Audio dev scene: the single-pop baseline (`measureSingle` in `src/dev/scenes/audio.js`) does not turn music off first, so with music on the ratio reads low (review should-fix, F-17).
- Audio tests: the duck test's `gap` loop (`tests/unit/voices.test.js:101`) never uses `gap`; the "merged level" test is circular (review should-fix, F-17).
- Audio: "sounds playing" drops a replaced sound at once while its 30 ms fade still sounds, so the readout under-reports (`src/effects/audio.js:119`) (review should-fix, F-17).
- Audio: `MUSIC_TONE` 196 Hz is below the WB 250 Hz floor and no test checks music tones (`src/config.js`) (review should-fix, F-17).
- Audio: no teardown; the settings `subscribe` unsubscribe is discarded and the visibility listener never removed; return a `destroy()` (review should-fix, F-17).
- Audio: hiding the page stops sounds and music with no fade (may click); if `resume` fails on return, the next tap's unlock skips music, so music stays silent (review should-fix, unverified, F-17).
- Audio nits: a config comment says 0.15 but the level is 0.14; `startOf` in `voices.js` is unused; each 10 ms RMS chunk can include up to 10 ms before the window; the compressor's makeup gain is trimmed by formula, so re-check if the limiter values change (F-17).
- Sound numbers (fades, limiter, defaults, tones, 100 ms RMS burst rule, 15 ms merge, 30 ms duck) are PROVISIONAL design judgement from the wellbeing advisor; confirm by ear on a phone speaker and earbuds (F-17; wellbeing).
- Game designer, F-17: real sounds to replace the placeholder table; the low-time tick for Story; the game itself is not wired to sound yet (F-17).
- Owner listening checks for F-17 (phone speaker and earbuds): pop and wrong tap soft and pleasant, gentle music fade, fast bursts not harsh at full volume, limiter squeeze or clicks audible, Android first-tap unlock, tab switching (F-17; with F-19).
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
- **Evidence questions:** none open. The Shao ratio question was closed on 2026-11-08: the study supports about 6 breaths a minute but no specific inhale-to-exhale ratio, so the 4/6 split is design judgement. The four sources themselves (Shao, Fish, NICE, Mind) were verified by the owner on 2026-10-11; owned by the wellbeing advisor; does not block building (WB 10).

## Retired with the prototype
**Done (F-01 and F-02, merged 2026-10-11).** The 10 experimental modes, Rain, both mode dropdowns, the named leaderboard and its `prompt()`, the score, high score and time bonus, game over, the per-tap tint, the shake, the swoop-in, the ripple and glitch effects, and the colour names and "psychology" strings are deleted (GD Core loop; GD Sensory safety Tier 1; WB 4 retired effects table). What remains in `src/game.js` is plain scaffolding, to be replaced as Calm and Story are built (F-18 removes whatever is left).

- **Saved data:** the old `pastelPopHighScore` and `pastelPopLeaderboard` localStorage keys are no longer read or written. A returning prototype player may still have them stored; nothing clears them.
