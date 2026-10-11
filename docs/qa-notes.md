# QA notes

Short, lasting knowledge for future test sessions. Remove a note when it goes out of date.

## Where to look
- Dev level: `http://localhost:5174/?dev` lists scenes. `?dev=loop` (press Start first) and `?dev=circles`. Numbers are read-only on `window.__pastelPopDev.<scene>`.
- Dev scenes do not exist in production: `/?dev=...` on the preview (port 4173) shows the normal start screen, and `grep -r "__pastelPopDev" dist` must find nothing.
- The main game exposes nothing on `window`. To read circle positions, hook canvas `arc` and `fillRect` from an init script.

## Known quirks
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
