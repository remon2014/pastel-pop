// The one clock every pulse beats on: shared ticks every PULSE_TICK_SECONDS from time 0, so pulses
// started at different moments still beat together. Pure: time comes in as seconds.
import { PULSE_TICK_SECONDS } from '../config.js';

const EPS = 1e-9;

export function createPulseClock() {
  const tickOf = (t) => Math.floor(t / PULSE_TICK_SECONDS + EPS);
  return {
    // Ticks in the half-open span (from, to].
    beatsIn(from, to) {
      return tickOf(to) - tickOf(from);
    },
    nextBeatAfter(now) {
      return (tickOf(now) + 1) * PULSE_TICK_SECONDS;
    },
  };
}
