# Test cases: foundations regression (F-01 to F-17, F-16b) and the interim start screen (F-18)

Regression checklist. Priority H/M/L. Type: HP happy path, NEG negative, EDGE edge case.
Sizes: S = 360x640, M = 412x915, D = 1280x800. Dev = `npm run dev` (5174), Prev = `npm run build` then `npm run preview` (4173).
Always: console has no errors or warnings, and every request goes to the page's own address.

## Commands
| ID | Type | Pri | Steps | Expected |
|---|---|---|---|---|
| CMD-1 | HP | H | `npm test`, `npm run lint`, `npm run format:check`, `npm run build` | All exit 0; test count at least 221, none skipped |
| CMD-2 | HP | H | `grep -rl __pastelPopDev dist/` | Finds nothing |

## Start screen (F-18)
| ID | Type | Pri | Steps | Expected |
|---|---|---|---|---|
| SS-1 | HP | H | Dev S/M/D: open `/` | Main menu shows; Pause button hidden; no circles behind menu |
| SS-2 | HP | H | Press Start | Exactly 6 circles, 3 colours, 2 each, about 64 CSS px (S); swatch shows one of those colours |
| SS-3 | HP | H | Tap a target-colour circle | That circle disappears; new target is a colour still on screen |
| SS-4 | NEG | H | Tap a wrong-colour circle 10 times; tap empty space | Nothing changes: no shake, tint, sound, or loss; circle count stays 6 |
| SS-5 | HP | H | Tap targets for 12 s | Target colour is always on screen |
| SS-6 | HP | H | Clear one colour fully, then stop tapping; watch | Refill to 2 of each colour, one circle per 0.4 s, first at once |
| SS-7 | HP | H | Pause | Circles freeze; menu with Continue and Return shows; button reads Resume |
| SS-8 | HP | H | Continue | Movement resumes, no jump, label back to Pause |
| SS-9 | HP | H | Pause, Return to Main Menu, Start again | Menu back, Pause hidden; new Start gives 6 circles, no pause overlay |
| SS-10 | HP | M | Measure swatch against a circle; swatch box against Pause box | Swatch 1.5x circle; boxes do not overlap (portrait) |
| SS-11 | EDGE | M | `?dev=layout`, Pretend notch on, S/M/D, then rotate | Outside count 0; Pause and swatch inside outline; landscape: swatch and Pause overlap (known, see qa-log) |
| SS-12 | EDGE | M | Pause and Continue 20 times fast; hide tab 10 s and return | Speed unchanged, circles frozen while hidden, no jump |
| SS-13 | EDGE | M | Resize S to M to D to landscape mid-play | Circles stay inside the column; canvas sharp |
| SS-14 | HP | H | Prev S/M/D: play as SS-2 to SS-5 | Same behaviour; `/?dev=...` shows the menu |
| SS-15 | HP | H | Dev S/M/D: open `?dev`, then every scene (loop, circles, render, layout, input, settings, effects, audio), click each button | Each loads, readout updates, no console error |
| SS-16 | NEG | M | Mouse click and touch tap (touch emulation) on circles | Each works separately; one tap never removes two circles |

## By-eye case per task (one each, not a re-run of the criteria)
| ID | Task | Steps | Expected |
|---|---|---|---|
| BE-01 | F-01 | `/`, Start, tap matching circles | They clear with no rings, dots, rain; menu has no dropdown or leaderboard |
| BE-02 | F-02 | Tap wrong circle 10 times, then right ones | No shake, tint or end; HUD is swatch and Pause only, no score or level |
| BE-03 | F-03 | Prev: network list; open `/manifest.json`, `/icon-192.png`, `/icon-512.png`, `/favicon.png` | No failed request; all four load |
| BE-04 | F-04 | Dev and Prev, network list | Only the page's own host; menu text readable at 360x800 |
| BE-05 | F-05 | `npm run lint`; `npm run format:check` | Exit 0 each |
| BE-06 | F-06 | `npm test` | Count shown, exit 0 |
| BE-07 | F-07 | Start, Pause/Continue 20 times, hide tab 10 s, return | No speed-up or jump |
| BE-08 | F-08 | `?dev=loop`, Start, Stall 500 ms | Loops 1; clamped frames up by 1 on Stall; Prev `/?dev=loop` shows menu |
| BE-09 | F-09 | `?dev=circles`, wait 9 s; Slow frames on, wait 9 s | Crossing 3.84 s (+-0.2) both ways; 30 steps/s on slow |
| BE-10 | F-10 | `?dev=render` | Hard-edged pixels, whole-number scale, readout shows internal size and scale |
| BE-11 | F-11 | `?dev=layout` S/M/D, Pretend notch, rotate | Circles outside 0; HUD inside notch; swatch 1.5x circle; no Pause behind menu on `/` |
| BE-12 | F-12 | `?dev=input`, auto-tapper 3 s | About 30 taps a second, none dropped |
| BE-13 | F-13 | `?dev=settings`: Mute, Music +, reload | Values kept; no console error |
| BE-14 | F-14 | `npm test` | Effects limiter tests pass |
| BE-15 | F-15 | `?dev=effects`, Story, auto-tapper, pulse on, 15 s | Highest flashes 3 or under; shakes running 1 or under (turn Reduce motion off to see shakes) |
| BE-16 | F-16 | Same run | Meter highest 3 or under, red 0, above-layer 0 |
| BE-17 | F-16b | Pulse alone 10 s; Story stress with pulse | Meter 0 for pulse alone; full taps counted while pulse above 0 |
| BE-18 | F-17 | `?dev=audio`, tap, Start music, auto-tapper 6 s | Sounds playing within the cap; ceiling reads 0; Mute survives reload |
