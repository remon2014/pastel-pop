// src/config.js
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
// PROVISIONAL cap so circles do not fill a wide window; with the portrait column (F-11) it rarely binds (see ?dev=layout).
export const CIRCLE_MAX_DIAMETER_DP = 112;

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

// Target swatch is about 1.5 times a play circle (design), with a 1-pixel Cream frame and a 1-pixel Dusk gap.
export const SWATCH_SCALE = 1.5;
export const SWATCH_FRAME_PX = 1;
export const SWATCH_GAP_PX = 1;

// Play column is at most this wide for its height (width / height). PROVISIONAL: 9:16, waits on the designer.
export const MAX_COLUMN_ASPECT = 9 / 16;

// Longest single frame the loop will deliver, in seconds. Longer gaps are dropped (D-003). Placeholder.
export const MAX_FRAME_SECONDS = 0.1;

// Dev level (src/dev/): window the measured frames per second is averaged over, in milliseconds.
export const DEV_FPS_WINDOW_MS = 1000;

// Internal canvas width in pixels the view aims for (D-004). PROVISIONAL: 180 or 240, to be chosen by eye.
export const INTERNAL_WIDTH_TARGET = 180;
// Dev level only: the other target the 180 / 240 comparison buttons switch to.
export const ALTERNATE_INTERNAL_WIDTH = 240;

// A circle's tap area is its radius times this (PROVISIONAL, docs/game-design.md "Missed tap": about 10% wider).
export const TAP_REACH = 1.1;
// Minimum touch size in dp. The tap area is never under half of it across the radius.
export const MIN_TOUCH_DP = 48;

// Settings (F-13). All defaults are PLACEHOLDERS awaiting the game designer.
// Reduce motion switch, vibration (one setting for both modes) and mute start off.
export const SETTINGS_KEY = 'pastelPop.settings';
export const SETTINGS_VERSION = 1;
export const DEFAULT_SETTINGS = Object.freeze({
  reduceMotion: false,
  vibration: false,
  muted: false,
  musicVolume: 0.5,
  effectsVolume: 0.35,
});
// Step the dev scene's volume buttons move by.
export const DEV_VOLUME_STEP = 0.1;

// Effects safety rules (F-14, docs/wellbeing.md sections 4 to 6). Times are in seconds.
// Flash limit: at most this many flashes in any one second, across the whole screen (WB 4).
export const FLASH_LIMIT = 3;
export const FLASH_WINDOW_SECONDS = 1;
// Flash budget window (WB 6 rule 5): a flash may begin at t only if fewer than FLASH_LIMIT began in the closed
// span [t - W, t], W = 1 s plus this margin. The margin covers MAX_BEAT_LATENESS (a frame of draw jitter).
export const FLASH_WINDOW_MARGIN_SECONDS = 0.05;
export const FLASH_BUDGET_WINDOW_SECONDS = FLASH_WINDOW_SECONDS + FLASH_WINDOW_MARGIN_SECONDS;
// Pulses: Story at most 2 a second, Calm at most one every 2 seconds (WB 4, 6).
export const STORY_PULSE_MAX_RATE = 2;
// Pulse beats sit on shared ticks this far apart; a pulse period is a whole number of ticks (owner, F-14).
export const PULSE_TICK_SECONDS = 0.5;
export const CALM_PULSE_MAX_RATE = 0.5;
// Calm: at most 2 circles begin arriving in any one second (WB 4).
export const CALM_ARRIVALS_PER_SECOND = 2;
// PLACEHOLDER: Story arrivals per second, until the game designer sets it (WB 6, F-14 test 13).
export const STORY_ARRIVALS_PER_SECOND = 3;
// Shake (WB 6): position only, 2 internal px, 200 ms, decaying, 2 swings, 2 starts a second, one at a time.
export const SHAKE_SECONDS = 0.2;
export const SHAKE_MAX_PIXELS = 2;
export const SHAKE_SWINGS = 2;
export const SHAKE_STARTS_PER_SECOND = 2;
// Calm wrong-tap wobble (a single cycle of 300 ms or more) and the Reduce motion dim (about 600 ms).
export const WOBBLE_SECONDS = 0.3;
export const DIM_SECONDS = 0.6;
// The dim changes the lightest colour's relative luminance by at most this (Calm and Story, WB 4 and 6).
export const DIM_LUMINANCE_CAP = 0.07;
// Story over-budget `quiet` form: opacity fade in the circle's own colour, at most 450 ms (WB 6).
// PLACEHOLDER: the exact length is the game designer's choice inside that bound.
export const QUIET_FADE_SECONDS = 0.45;
// Plain fade used for the Calm pop under Reduce motion and when over the ring cap.
export const PLAIN_FADE_SECONDS = 0.45;
// Saturated red is R / (R + G + B) at or above this (WB 4).
export const SATURATED_RED_RATIO = 0.8;
// Colours effects may draw, besides the palette. PLACEHOLDER pulse colour: warm amber, not red.
export const EFFECT_COLORS = Object.freeze({ lowTimePulse: '#E6C070', targetGlow: '#EDD894' });

// Effects layer (F-15). All PLACEHOLDER looks until the art phase (D-010); timings stay inside the WB bounds above.
// A pulse beat is drawn for this long (under the tick length); a beat older than this when seen is dropped unseen.
export const PULSE_BEAT_SECONDS = 0.25;
// A pulse beat seen later than this after its tick is dropped unseen (the limiter still counted it).
// Drawn late, a beat could sit closer to other flashes than the limiter's tick-time count allows.
// 0.04 s is one 30 Hz step (0.033 s, the dev slow loop) plus a margin, so 60 Hz frames (0.017 s) never drop a beat.
export const MAX_BEAT_LATENESS = 0.04;
export const ARRIVAL_SECONDS = 0.3;
export const POP_SECONDS = 0.3;
export const WOBBLE_PIXELS = 2;
// Calm pop ring: grows 1 internal px, then one thin ring; never more than a quarter radius beyond the circle.
export const POP_RING_MAX_RADIUS_FRACTION = 0.25;
export const POP_GROW_PIXELS = 1;
// Story burst: this many pixel dots travelling out, staying inside the circle's own area.
export const BURST_DOTS = 8;
// Quiet fade may shrink the circle down to this fraction of its size.
export const QUIET_MIN_SCALE = 0.7;
// Pulse bar (placeholder time bar at the top of the play area), in internal px and as a fraction of the width.
export const PULSE_BAR_WIDTH_FRACTION = 0.4;
export const PULSE_BAR_HEIGHT = 3;
export const PULSE_BAR_TOP = 2;
// PLACEHOLDER bar opacity (D-010, D-011): the bar stands at the base while the warning is on, and a beat lifts it to the
// peak and back. The amber over any colour it can cover must change relative luminance by 0.07 or less (pulseBar.test.js).
export const PULSE_BAR_BASE_ALPHA = 0.06;
export const PULSE_BAR_PEAK_ALPHA = 0.12;

// Sound (F-17). PROVISIONAL numbers: the wellbeing advisor and game designer confirm them (D-005 Open).
export const MAX_EFFECT_VOICES = 4; // a 5th sound replaces the oldest, never adds on top
export const EFFECT_QUICK_RELEASE_SECONDS = 0.03; // a replaced sound's fade-out; at least 30 ms
export const MUSIC_FADE_IN_SECONDS = 1.5;
export const MUSIC_FADE_IN_RETURN_SECONDS = 2; // after the page was hidden
export const MUSIC_FADE_OUT_SECONDS = 1;
export const BUS_RAMP_SECONDS = 0.05; // volume and mute changes glide over this, so sliders do not click
export const MASTER_GAIN = 0.5; // fixed and hidden: never on a slider
// Master limiter after both buses, then a hard ceiling (a clip at CEILING_DBFS).
export const LIMITER = Object.freeze({ thresholdDb: -12, knee: 0, ratio: 20, attack: 0.003, release: 0.25 });
export const CEILING_DBFS = -6;
// Effect sounds share a loudness budget: all sounds playing together aim for at most this many times one pop.
export const VOICE_BUDGET_TIMES_POP = 1.5;
// PROVISIONAL floor: a new sound is never quieter than this fraction of its own single-sound level (0.5 is -6 dB).
export const VOICE_FLOOR = 0.5;
// PLACEHOLDER tones (D-010): one table real sounds can replace. Sine preferred, triangle allowed; main pitch
// 250 to 800 Hz, nothing above 1000 Hz, no low-tone boost. `notes` is the set a sound picks from; the pop
// notes are a pentatonic set that sounds pleasant in any order. `level` is linear gain before the bus.
export const TONES = Object.freeze({
  pop: {
    wave: 'sine',
    notes: [392, 440, 523.25, 587.33, 659.25],
    seconds: 0.25,
    level: 0.3,
    fadeIn: 0.015,
    fadeOut: 0.12,
  },
  // At least 6 dB under the pop (0.15 / 0.3 is 6.02 dB); steady pitch, not a descending tone.
  wrong: { wave: 'sine', notes: [293.66], seconds: 0.3, level: 0.14, fadeIn: 0.03, fadeOut: 0.15 },
});
export const MIN_WRONG_TAP_QUIETER_DB = 6;
// Which tone each effect request plays, by kind. Forms that play: see SOUND_FORMS.
export const SOUND_BY_KIND = Object.freeze({ pop: 'pop', wobble: 'wrong', shake: 'wrong' });
// Same level on every one of these; `ignored`, `refused`, `waitUntil` and the rest are silent.
export const SOUND_FORMS = Object.freeze(['full', 'quiet', 'fade', 'plainFade', 'dim']);
// Placeholder music: a soft two-note drone on its own bus.
export const MUSIC_TONE = Object.freeze({ wave: 'sine', notes: [196, 293.66], level: 0.25 });
