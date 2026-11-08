// The one clock every pulse beats on. Beats fall at whole multiples of 1/rate from time 0,
// so pulses started at different moments still beat together. Pure: time comes in as seconds.
const EPS = 1e-9;

export function createPulseClock() {
  let rate = 0;
  return {
    get rate() {
      return rate;
    },
    setRate(next) {
      rate = next;
    },
    // Beats in the half-open span (from, to].
    beatsIn(from, to) {
      if (rate <= 0) return 0;
      return Math.floor(to * rate + EPS) - Math.floor(from * rate + EPS);
    },
    nextBeatAfter(now) {
      if (rate <= 0) return Number.POSITIVE_INFINITY;
      return (Math.floor(now * rate + EPS) + 1) / rate;
    },
  };
}
