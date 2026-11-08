// Dev-only flash meter (F-16): counts flashes from the pixels actually drawn, so the effects layer is not
// marking its own homework. Pure: takes RGBA frames and times, touches no canvas or DOM (WB 4, WB 6 rules 3-5).
export const CELL = 4; // internal px per grid cell side
export const CHANGE_MIN = 0.1; // a change counts at this size or more from the cell's last extreme
export const DARKER_LIMIT = 0.8; // a flash needs its darker extreme under this relative luminance
export const RED_SHARE = 0.8; // saturated red: R / (R + G + B) at or above this
export const WINDOW_SECONDS = 1; // closed window [t - 1 s, t]
export const SHAKE_AREA_MAX = 0.1; // during a shake, at most this share of the play area may change (WB 6 rule 3)
const EPS = 1e-9;

const LINEAR = new Float32Array(256);
for (let i = 0; i < 256; i++) {
  const c = i / 255;
  LINEAR[i] = c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

// One cell's tracker. Feed it a value per frame; it reports a flash (its onset time) when two opposite
// changes of CHANGE_MIN or more happen in a row with the darker extreme under DARKER_LIMIT. It reports every
// such pair (onFlash(firstStart, secondStart)), overlapping ones too; the group below sorts out which count.
function newTracker(value) {
  return { ext: value, leaveT: null, dir: 0, pending: null };
}

function step(cell, v, t, onFlash) {
  const diff = v - cell.ext;
  if (cell.dir !== 0 && diff * cell.dir > 0) {
    cell.ext = v; // leg goes on
    cell.leaveT = null;
    return;
  }
  if (Math.abs(diff) < EPS) {
    cell.leaveT = null;
    return;
  }
  if (cell.leaveT === null) cell.leaveT = t;
  if (Math.abs(diff) < CHANGE_MIN - EPS) return;
  const dir = diff > 0 ? 1 : -1;
  const change = { dir, start: cell.leaveT, low: Math.min(cell.ext, v) };
  const first = cell.pending;
  if (first && first.dir === -dir && Math.min(first.low, change.low) < DARKER_LIMIT) {
    onFlash(first.start, change.start);
  }
  cell.pending = change;
  cell.dir = dir;
  cell.ext = v;
  cell.leaveT = null;
}

// Flash times, with the most flashes seen in any closed window and the run total.
function createCounter() {
  const times = [];
  let highest = 0;
  let total = 0;
  const within = (end) => times.filter((x) => x <= end + EPS && x >= end - WINDOW_SECONDS - EPS).length;
  return {
    add(at) {
      let i = times.length;
      while (i > 0 && times[i - 1] > at) i--;
      times.splice(i, 0, at);
      total++;
      for (const end of times) if (end >= at) highest = Math.max(highest, within(end));
      while (times.length && times[0] < times[times.length - 1] - 2 * WINDOW_SECONDS) times.shift();
    },
    inWindow: within,
    get highest() {
      return highest;
    },
    get total() {
      return total;
    },
    resetHighest(now) {
      highest = within(now);
    },
  };
}

// A group of trackers sharing one counter. A flash is stamped with the frame its first change began in, and a
// change belongs to one flash only: a pair that reuses an already counted change is the same flash seen from
// another cell (or the other way of pairing the same swings), so screen-wide each flash counts once.
function createGroup(cellCount) {
  const cells = new Array(cellCount).fill(null);
  const counter = createCounter();
  const used = new Set();
  const onFlash = (first, second) => {
    if (used.has(first) || used.has(second)) return;
    used.add(first);
    used.add(second);
    if (used.size > 1200) used.delete(used.values().next().value);
    counter.add(first);
  };
  return {
    counter,
    feed(values, t) {
      for (let i = 0; i < cellCount; i++) {
        if (cells[i] === null) cells[i] = newTracker(values[i]);
        else step(cells[i], values[i], t, onFlash);
      }
    },
  };
}

// width, height in internal px. addFrame(t, rgba, shift): t is the drawn time in seconds, rgba the frame's
// pixels, shift the change in shake offset since the last frame (px), shaking whether a shake is running.
// shakeArea: share of the play area whose raw luminance changed by CHANGE_MIN or more, in shaking frames. Returns nothing; read the counters.
export function createFlashMeter(width, height) {
  const cols = Math.ceil(width / CELL);
  const rows = Math.ceil(height / CELL);
  const cellCount = cols * rows;
  const counts = new Float64Array(cellCount);
  const sumNow = new Float64Array(cellCount);
  const sumPred = new Float64Array(cellCount);
  const sumR = new Float64Array(cellCount);
  const sumG = new Float64Array(cellCount);
  const sumB = new Float64Array(cellCount);
  const level = new Float64Array(cellCount);
  const rawLevel = new Float64Array(cellCount);
  const redLevel = new Float64Array(cellCount);
  let prevLuma = new Float32Array(width * height);
  let luma = new Float32Array(width * height);
  let started = false;
  let changed = 0;
  const shakeArea = { last: 0, highest: 0 };
  const shaken = createGroup(cellCount);
  const raw = createGroup(cellCount);
  const red = createGroup(cellCount);

  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) counts[Math.floor(y / CELL) * cols + Math.floor(x / CELL)]++;

  function addFrame(t, rgba, shift = 0, shaking = false) {
    const dx = Math.round(shift);
    sumNow.fill(0);
    sumPred.fill(0);
    sumR.fill(0);
    sumG.fill(0);
    sumB.fill(0);
    changed = 0;
    for (let y = 0; y < height; y++) {
      const cellRow = Math.floor(y / CELL) * cols;
      for (let x = 0; x < width; x++) {
        const p = y * width + x;
        const o = p * 4;
        const r = rgba[o];
        const g = rgba[o + 1];
        const b = rgba[o + 2];
        const l = 0.2126 * LINEAR[r] + 0.7152 * LINEAR[g] + 0.0722 * LINEAR[b];
        luma[p] = l;
        if (started && Math.abs(l - prevLuma[p]) >= CHANGE_MIN - EPS && Math.min(l, prevLuma[p]) < DARKER_LIMIT)
          changed++;
        const c = cellRow + Math.floor(x / CELL);
        sumNow[c] += l;
        sumR[c] += r;
        sumG[c] += g;
        sumB[c] += b;
        const from = x - dx;
        sumPred[c] += started && from >= 0 && from < width ? prevLuma[y * width + from] : l;
      }
    }
    for (let c = 0; c < cellCount; c++) {
      const now = sumNow[c] / counts[c];
      rawLevel[c] = now;
      level[c] = started && dx !== 0 ? level[c] + now - sumPred[c] / counts[c] : now;
      const total = sumR[c] + sumG[c] + sumB[c];
      redLevel[c] = total > 0 && sumR[c] / total >= RED_SHARE ? 1 : 0;
    }
    shakeArea.last = shaking ? changed / (width * height) : 0;
    shakeArea.highest = Math.max(shakeArea.highest, shakeArea.last);
    shaken.feed(level, t);
    raw.feed(rawLevel, t);
    red.feed(redLevel, t);
    [prevLuma, luma] = [luma, prevLuma];
    started = true;
  }

  return { addFrame, flashes: shaken.counter, rawFlashes: raw.counter, redFlashes: red.counter, shakeArea };
}
