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

## Not yet tested on anything
- A real phone: touch feel, performance, the device font, colours at night and in daylight.
- A real 90 or 120 Hz screen (frame rates were simulated).
- Real app-switching or tab-hiding (page visibility was simulated).
- Rotation on a device, "Add to Home Screen", and offline use.
