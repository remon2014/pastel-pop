# QA log

One line per verification, newest last. Verdicts come from the qa-tester agent playing the game in a browser unless the "Checked by" column says otherwise. Written up on 2026-10-11 from that day's reports; from now on the tester adds its own line after each task.

| Date | Task | Commit checked | Verdict | Bugs | Checked by | Notes |
|---|---|---|---|---|---|---|
| 2026-10-11 | F-01 Delete retired files | `f6c7d60` | FAIL | 1 | qa-tester | `maybeSaveHighScore` still called after its import was removed; error on a wrong tap |
| 2026-10-11 | F-01 retest | `323e0bf` | PASS | 0 | qa-tester | One-line fix confirmed in dev and preview |
| 2026-10-11 | F-02 Delete retired parts | `d75cd0d` | PASS | 0 | qa-tester | Pause and resume hammered: speed never doubled |
| 2026-10-11 | Calm palette, symbols, Dusk menus | `a9e455f` | PASS | 5 minor | qa-tester | Moon off-centre (fixed in `1deed7c`, not re-run); swatch soft on sharp screens; symbols small; button shape faint; no pressed style |
| 2026-10-11 | F-03 Fix production build | `6db6952` | PASS | 0 | qa-tester | `dist/` 308 kB; manifest and icons load |
| 2026-10-11 | F-04 Remove Google Fonts | `1e2662c` | PASS | 0 | qa-tester | No request leaves the page's own address |
| 2026-10-11 | F-05 Lint and format | `1864d27` | PASS | 0 | Session lead, not the qa-tester | Lint, format, rule proof and build re-run; buttons clicked at desktop size only |
| 2026-10-11 | F-06 Test runner | `d191fbd` | PASS | 0 | Session lead, not the qa-tester | Flipped assertion fails the run; no game code changed |
| 2026-10-11 | F-07 One game loop | `2d56234` | PASS, one check blocked | 0 | qa-tester | Loop counters not readable from the page until F-08 |
| 2026-10-11 | F-08 Dev level, and F-07's open check | `746374c` | PASS (both) | 0 | qa-tester | Each 500 ms stall counted as one capped frame; one loop throughout |
| 2026-10-11 | F-09 Logic in screen widths | `dfcfc5f` | PASS | 2 minor | qa-tester | 0.2500 widths a second at 30, 60 and about 211 frames a second. Hollow floor test and oversized circles on wide screens fixed in `aa4d6a7` (unit tests and an eye check only, not re-run by the tester) |
| 2026-11-08 | R-01 Loop resume test checks first frame | `150763f` | PASS | 0 | qa-tester | Deleting `lastTime = null;` in `halt()` fails test 14; restored |
| 2026-11-08 | R-02 Zero-size play area | `0833bb6` | PASS | 0 | qa-tester | Unit tests fail without the guard (2 fail). Browser at 1280x800 and 375x812: canvas set to 0x0 and to height 0 for 24+ frames, no NaN, circles back inside bounds, level finished. Collapse done by setting canvas size, not a real 0-height window |
| 2026-11-08 | R-03 World test gaps | `01983f3` | PASS | 0 | qa-tester | All four mutations (`isInside` true, no oversize handling, no x pull-back, nudge in `stepCircle`) each fail at least one new test; restored |
| 2026-11-08 | R-04 Every palette id has a symbol | `6b40a2a` | PASS | 0 | qa-tester | Removing `moon` from the drawers fails the test; restored |
| 2026-11-08 | R-05 Shared dev button and READOUT_MS | `bf203e2` | PASS | 0 | qa-tester | One `button` and one `READOUT_MS` in `src/dev/ui.js`. `?dev`, `?dev=loop`, `?dev=circles`: buttons work, readouts change 4 times a second, no console errors. Build: no `__pastelPopDev` in `dist/`, one JS chunk, preview `?dev` opens the game. `npm test` 49 pass, lint and format:check clean |
| 2026-11-08 | R-01 to R-05 review follow-ups | `810ea44`, `17f9a67` | PASS | 0 | qa-tester | 50 tests pass; lint, format:check, build clean, no `__pastelPopDev` in `dist/`. Mutations fail as intended: no `circleRadius` guard (test 50), `playAreaHeight` always `lastHeight` (44, 45), plain `DRAWERS[id]` lookup (26). Browser at 1200x688 and 375x812: collapse and restore, 12 pops across a level change, no NaN, no console warnings |
| 2026-11-08 | F-10 Sharp rendering, taps in CSS px | `cdd68ce`..`b874367` | PASS | 0 | qa-tester | 70 tests, lint, format:check, build clean; no `__pastelPopDev` in `dist/`; no `canvas.width/height` in `src/game.js`. 13 mutations (all view.js rules, discRows width and row off-by-one) each fail a test; browser mutation (canvas.width in handleInput) drops hits 18/20 to 2/20 at 412x915 dpr 2.625. `?dev=render` 360x800 dpr 1/2/3: 5 colours only, every scale-block uniform. `?dev=circles` dpr 1/2/3: 32 internal px = 64 CSS (independent row scan agrees), taps +-30 hit, +-34 miss; 240 gives 64 / 64.5 / 63.33. Game at 1280x800, 412x915, 375x812: levels complete, resize mid-play, no console errors. R-02 collapse keeps last view. Preview: dev URLs show start screen. Commit 71dff5c alone breaks the game (fixed in 2a90af5), as the engineer said. Real-phone checks outstanding |

## Not yet tested on anything
- A real phone: touch feel, performance, the device font, colours at night and in daylight.
- A real 90 or 120 Hz screen (frame rates were simulated).
- Real app-switching or tab-hiding (page visibility was simulated).
- Rotation on a device, "Add to Home Screen", and offline use.
2026-11-08 | F-11 layout | FAIL | 2 bugs (swatch half device pixel at some widths/dpr; Pause overlaps swatch in landscape)
2026-11-08 | F-11 layout (rechecked at 963d5c7) | PASS | 0 open bugs; round 1 swatch half-pixel bug fixed; landscape Pause/swatch overlap deferred to backlog by owner
2026-11-08 | F-12 input (b171b33) | FAIL | 1 bug (tap on target swatch reaches play input: swatch has pointer-events none)
2026-11-08 | F-12 input (recheck vs revised swatch criterion, 072aaf7) | PASS | 0 open bugs; swatch tap hits circle beneath, does nothing when empty, Pause blocks (0 canvas events)
2026-11-08 | F-13 settings and safe storage (f89c375) | PASS | 0 bugs; all criteria observed at 360x800 and 1280x800, dev and preview; real-device checks none required
2026-11-08 | F-14 effects safety rules (8b9200e) | PASS with 1 minor gap | 0 bugs; npm test 125 pass; mutation check killed on tests 1, 2, 4, 5, 6, 9, 10, 11, 12, 13; gap: Story Reduce-motion dim has no one-at-a-time guard or test (WB 6 item 2); real-device checks none (pure logic)
2026-11-08 | F-14 recheck after fix rounds (ba90ee1) | PASS | 0 bugs; npm test 135 pass; mutations on tests 1, 5, 6b, 9, 12, 13, 14 all caught; earlier Story Reduce motion dim gap closed (6b, 6c)
2026-11-08 | F-15 effects layer on screen (95f2ce7) | PASS | 0 bugs; Story/RM-emulation 30 s stress at 360 and 1280 (10/s x3, 30 steps/s) peaks 3 flashes, 1 shake, 2 begun; independent frame-log peak 3 in any <1 s window (4 only at exactly 1.000 s closed edge); shake 2 px, ~180 ms, 2 swings; no white/red; dim drop 0.029; 1 minor dev-scene note
2026-11-08 | F-15 recheck after fix round 1 (be1685b) | PASS | 0 bugs; closed 1.05 s flash peak 3 (Story, RM emulation, 30 steps/s); Reduce motion mid-effect cuts shake and ring on next frame (switch and emulation), dim runs on; npm test 157 pass; pulse skips ~1 beat in 15 s with taps, no stutter
2026-11-08 | F-15 recheck after fix round 2, steady pulse (20e2db3) | PASS | 0 bugs; pulse on: 60 beats at 499-501 ms, no flash/halo from taps or arrivals; pulse off: full flashes return, scene peak 3 (one run my frame-sampled closed 1.05 s count read 4 at exactly 1.050 s edge, likely frame quantisation); npm test 159 pass
2026-11-08 | F-16 dev flash meter (b0cd999) | PASS | 0 bugs; 360 and 1280 stress 30 s pulse on/off: meter highest 0, red 0, above-layer 0, shake area 1.9-7.2%; pulse alone raw 20/20 beats (meter 0); calibration alone highest 3, 20 flashes in 10 s, off by default; calibration+stress meter reads 5-6 (not trivially 0); meter switch ok; dist has no meter; / plays
