// src/config.js
export const CIRCLE_RADIUS = 50;
export const BASE_SPEED = 2;
export const SPEED_PER_LEVEL = 0.5;

// Speeds are in play-area widths per second (D-003). 1.0x is one width in 4 seconds.
export const BASE_SPEED_WIDTHS = 0.25;
// Each level adds this much to the speed multiplier: level 1 is 1.0x, level 2 is 1.2x, and so on.
// Matches the prototype, whose per-frame speed grew by 0.5 on a base of 2.5 (0.2 of level 1) per level.
export const LEVEL_SPEED_STEP = 0.2;

// Circle size (PROVISIONAL, waits on the game designer for large screens): 64 dp across on a
// 360 dp wide phone, and never under 48 dp across (docs/game-design.md, Accessibility).
export const CIRCLE_DIAMETER_DP = 64;
export const CIRCLE_REFERENCE_WIDTH_DP = 360;
export const CIRCLE_MIN_DIAMETER_DP = 48;

// Calm supporting shades (docs/game-design.md, "Supporting shades").
export const DUSK = '#332C2E';
export const INK = '#2A2426';
export const CREAM = '#D9CEC2';
export const DUST = '#A3968F';
export const GLOW_1 = '#453B3C';
export const GLOW_2 = '#5C4F4C';

export const BACKGROUND_COLOR = DUSK;

// Symbol size as a fraction of the circle radius (symbol fills about half the circle).
export const SYMBOL_SIZE = 0.55;

// Target swatch is about 1.5 times a play circle (design); shrunk to fit beside the Pause button.
export const SWATCH_SIZE = 96;
export const SWATCH_FRAME_WIDTH = 3;

// Longest single frame the loop will deliver, in seconds. Longer gaps are dropped (D-003). Placeholder.
export const MAX_FRAME_SECONDS = 0.1;

// Dev level (src/dev/): window the measured frames per second is averaged over, in milliseconds.
export const DEV_FPS_WINDOW_MS = 1000;
