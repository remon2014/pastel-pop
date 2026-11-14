# QA notes

Short, lasting knowledge for future test sessions. Remove a note when it goes out of date.

## Where to look
- Dev level: `http://localhost:5174/?dev` lists scenes. `?dev=loop` (press Start first) and `?dev=circles`. Numbers are read-only on `window.__pastelPopDev.<scene>`.
- Dev scenes do not exist in production: `/?dev=...` on the preview (port 4173) shows the normal start screen, and `grep -r "__pastelPopDev" dist` must find nothing.
- Forcing a zero-size play area: set `canvas.width/height` to 0 from `evaluate`, wait, then set them back and dispatch `resize` (main.js sets the canvas from `innerWidth/innerHeight`). Resizing the Playwright viewport to height 0 is not needed. Symbols such as the moon also call `arc`, so count circles by first arc per `fillStyle` change or tap by position.
- The main game exposes nothing on `window`. To read circle positions, hook canvas `arc` and `fillRect` from an init script.

## Known quirks
- Device pixel ratio: in Playwright `browser_run_code_unsafe`, `page.context().newCDPSession(page)` then `Emulation.setDeviceMetricsOverride` ({width, height, deviceScaleFactor, mobile:false}) works, then `page.goto`. Height or width 0 in the override does nothing; for R-02 define `window.innerWidth/innerHeight` as 0 and dispatch `resize`. `page.screenshot` ignores the emulated dpr (always 2x), so sample canvas pixels with `getImageData` for hard-edge checks. `filename` for run_code must be inside the repo (`.playwright-mcp/`).
- Playing the game headlessly: read the target word from `#targetLabel`, find that colour's hex pixels on `#gameCanvas` (flood fill), click the bbox centre. Prefer the largest blob (overlapped circles hide each other, so about 10% of taps are no-ops even when correct).
- Dev circle size follows width (64/360 of it): 33 internal px at 375 CSS wide is correct, not a bug.
- Use a fresh browser context with the cache disabled. A persistent profile once served a stale `game.js` and produced a false failure.
- Stop any server you start. A dev server left running on port 5174 serves whatever branch is checked out.
- The browser tool writes logs to `.playwright-mcp/` in the project folder. It is in `.gitignore`; do not commit it.
- Headless Chromium cannot truly hide a tab. Override `document.hidden` and dispatch `visibilitychange`, and say that this tests the game's response, not real backgrounding.
- CPU throttling does not lower the frame rate. To test other frame rates, wrap `requestAnimationFrame` in an init script (every second callback for about 30 Hz, a 2 ms timer for a fast display).
- The loop halts while the page is hidden, so returning counts no capped frame. A stall while visible is what gets capped (the Stall button in `?dev=loop`).
- `?dev=circles` uses a small dot, so its exact crossing time is 3.84 s, shown in the readout.

## Recurring bug patterns
- A call left behind after its import was deleted passes a text search for the file name but throws at run time. After any deletion, search for every removed function and variable name, then exercise every button and both tap outcomes.
- A test whose input range never reaches the rule it names (the 48 dp floor test did not include widths under 270). Check that each test would fail if the rule were removed.

## F-19 real phone check (2026-11-14)
- Phone: Pixel 10 Pro XL, Android 17, up to 120 Hz (owner's words: "up to 120Hz"). Owner reported all checks P-01 to P-36 passed, no notes.
- Limits: self-reported. No per-check readout values (crossing time, steps per second, meter numbers) were recorded, and there were no feel notes. P-34 to P-36 (earbuds, 120 Hz crossing, second phone in the dark) reported passed, method not stated.
- P-16 (loop speed): passed, value not recorded, refresh rate during the run unknown. "Steps per second" follows the refresh rate (about 60 at 60 Hz, about 120 at 120 Hz), not a fixed 60.
- Not covered: this phone is a flagship. The plan asks for a mid- or low-range Android phone, so mid- and low-range performance is still untested.
- Checklist: `docs/test-cases/phone-check.md`. Setup: `npm run dev:phone`, open the `Network:` address on the phone (same trusted home Wi-Fi), Ctrl+C when done.
- The loop stops while its tab is hidden, so read frame rate on the effects scene ("Steps per second", slow loop off), not on `?dev=loop` in another tab.
- Android "Remove animations" name and place vary by maker (Pixel: Accessibility > Color and motion). Ask the owner to write the values in the Results block next time.
