// Sound rules as plain logic (D-010): which request makes a sound, the voice cap, note choice, fade and
// gain maths. No AudioContext, DOM or timers; times are seconds passed in. Playback is in audio.js.
import { MAX_EFFECT_VOICES, SOUND_BY_KIND, SOUND_FORMS, VOICE_FALLOFF } from '../config.js';

const clamp01 = (n) => Math.min(1, Math.max(0, n));

// The tone name for an effect request's kind and the limiter's answer, or null for silence.
export function soundFor(kind, form) {
  if (!SOUND_FORMS.includes(form)) return null;
  return SOUND_BY_KIND[kind] ?? null;
}

// Gain of a bus from its slider (0..1) and the mute switch. Squared so the slider feels even to the ear.
export function busGain(volume, muted) {
  return muted ? 0 : clamp01(volume) ** 2;
}

// Linear ramp 0 to 1 over `seconds`; a zero or negative length is already complete.
export function ramp(elapsed, seconds) {
  return seconds <= 0 ? 1 : clamp01(elapsed / seconds);
}

// Envelope of one sound at `elapsed` seconds: fade in, hold, fade out ending at `total`.
export function envelopeGain(elapsed, { fadeIn, total, fadeOut }) {
  if (elapsed <= 0 || elapsed >= total) return 0;
  return Math.min(ramp(elapsed, fadeIn), ramp(total - elapsed, fadeOut));
}

// Level a new sound starts at when `playing` sounds are already on: base * falloff^playing.
export function voiceLevel(base, playing) {
  return base * VOICE_FALLOFF ** playing;
}

// Next note from `notes` that never repeats the last and never rises twice in a row, so no run of
// taps climbs. `last` is { note, rose } or null; `rand` returns 0..1. Returns { note, rose }.
export function pickNote(notes, last, rand) {
  let pool = notes.filter((n) => !last || n !== last.note);
  if (last?.rose) pool = pool.filter((n) => n < last.note);
  if (pool.length === 0) pool = notes.filter((n) => !last || n !== last.note);
  if (pool.length === 0) pool = notes;
  const note = pool[Math.min(pool.length - 1, Math.floor(rand() * pool.length))];
  return { note, rose: Boolean(last) && note > last.note };
}

// Keeps track of the effect sounds playing. start() returns the id it replaced, or null.
export function createVoices(max = MAX_EFFECT_VOICES) {
  let voices = [];

  function prune(now) {
    voices = voices.filter((v) => v.end > now);
  }

  return {
    start(id, now, seconds) {
      prune(now);
      let replaced = null;
      if (voices.length >= max) replaced = voices.shift().id;
      voices.push({ id, start: now, end: now + seconds });
      return replaced;
    },
    count(now) {
      prune(now);
      return voices.length;
    },
    startOf: (id) => voices.find((v) => v.id === id)?.start,
    clear() {
      voices = [];
    },
  };
}
