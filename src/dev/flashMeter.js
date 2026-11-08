// Dev-only flash meter (F-16): counts flashes from the pixels actually drawn, so the effects layer is not
// marking its own homework. Pure: takes RGBA frames and times, touches no canvas or DOM (WB 4, WB 6 rules 3-5).
export const CELL = 4; // internal px per grid cell side
export const CHANGE_MIN = 0.1; // a change counts at this size or more from the cell's last extreme
export const DARKER_LIMIT = 0.8; // a flash needs its darker extreme under this relative luminance
export const RED_SHARE = 0.8; // saturated red: R / (R + G + B) at or above this
export const WINDOW_SECONDS = 1; // closed window [t - 1 s, t]
export const AREA_SHARE = 0.1; // a flash needs more than this share of the play area (WB 6 rule 7c)
const KEEP_SECONDS = 3; // pairs older than this cannot overlap a new one
export const SHAKE_AREA_MAX = 0.1; // during a shake, at most this share of the play area may change (WB 6 rule 3)
const EPS = 1e-9;

const LINEAR = new Float32Array(256);
for (let i = 0; i < 256; i++) {
  const c = i / 255;
  LINEAR[i] = c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

// One cell's tracker. Feed it a value per frame. It reports a pair (onPair(start, end)) when two opposite
// changes of CHANGE_MIN or more happen in a row with the darker extreme under DARKER_LIMIT: start is the
// frame the first change began in, end the frame the second was confirmed. A pair uses up both its changes,
// so up, down, up, down at one spot is two pairs (WB 6 rule 7c).
function newTracker(value) {
  return { ext: value, leaveT: null, dir: 0, pending: null };
}

function step(cell, v, t, onPair) {
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
    onPair(first.start, t);
    cell.pending = null;
  } else {
    cell.pending = change;
  }
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

const overlaps = (r, start, end) => r.start <= end + EPS && r.end >= start - EPS;

// A group of cell trackers and the rule that turns their pairs into flashes. Each flash is stamped with the
// frame its first change began in.
// 'area' (the meter, WB 6 rule 7c): a pair counts when the cells in all pairs overlapping it in time (onset to
//   completion) together cover more than AREA_SHARE of the play area; qualifying pairs that overlap a flash
//   already counted are part of it.
// 'spread' (raw count, red): no area test. Pairs overlapping in time in touching cells are one flash; pairs
//   elsewhere are their own, so unrelated events in the same frame are not merged.
function createGroup(cellCount, cols, mode) {
  const cells = new Array(cellCount).fill(null);
  const counter = createCounter();
  let pairs = [];
  let counted = [];
  const touching = (a, b) =>
    Math.abs((a % cols) - (b % cols)) <= 1 && Math.abs(Math.floor(a / cols) - Math.floor(b / cols)) <= 1;

  function count(pair) {
    pair.counted = true;
    counted.push(pair);
    counter.add(pair.start);
  }

  function addPair(cell, start, end) {
    const pair = { cell, start, end, cells: new Set([cell]), qualified: false };
    const near = pairs.filter((r) => overlaps(r, start, end));
    if (mode === 'spread') {
      if (!near.some((r) => touching(r.cell, cell))) counter.add(start);
    } else {
      for (const r of near) {
        r.cells.add(cell);
        pair.cells.add(r.cell);
      }
      const need = AREA_SHARE * cellCount;
      for (const r of [...near, pair].sort((x, y) => x.start - y.start)) {
        if (r.qualified || r.cells.size <= need) continue;
        r.qualified = true;
        if (!counted.some((c) => overlaps(c, r.start, r.end))) count(r);
      }
    }
    pairs.push(pair);
    pairs = pairs.filter((r) => r.end >= end - KEEP_SECONDS);
    counted = counted.filter((r) => r.end >= end - KEEP_SECONDS);
  }

  return {
    counter,
    feed(values, t) {
      for (let i = 0; i < cellCount; i++) {
        if (cells[i] === null) cells[i] = newTracker(values[i]);
        else step(cells[i], values[i], t, (start, end) => addPair(i, start, end));
      }
    },
  };
}

// width, height in internal px. addFrame(t, rgba, shift): t is the drawn time in seconds, rgba the frame's
// pixels, shift the change in shake offset since the last frame (px), shaking whether a shake is running.
// flashes: the meter's count (area rule); rawFlashes: no area test, for information. shakeArea: share of the play area whose raw luminance changed by CHANGE_MIN or more, in shaking frames. Returns nothing; read the counters.
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
  const redLevel = new Float64Array(cellCount);
  let prevLuma = new Float32Array(width * height);
  let luma = new Float32Array(width * height);
  let started = false;
  let changed = 0;
  const shakeArea = { last: 0, highest: 0 };
  const shaken = createGroup(cellCount, cols, 'area');
  const raw = createGroup(cellCount, cols, 'spread');
  const red = createGroup(cellCount, cols, 'spread');

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
      level[c] = started && (shaking || dx !== 0) ? level[c] + now - sumPred[c] / counts[c] : now;
      const total = sumR[c] + sumG[c] + sumB[c];
      redLevel[c] = total > 0 && sumR[c] / total >= RED_SHARE ? 1 : 0;
    }
    shakeArea.last = shaking ? changed / (width * height) : 0;
    shakeArea.highest = Math.max(shakeArea.highest, shakeArea.last);
    shaken.feed(level, t);
    raw.feed(level, t);
    red.feed(redLevel, t);
    [prevLuma, luma] = [luma, prevLuma];
    started = true;
  }

  return { addFrame, flashes: shaken.counter, rawFlashes: raw.counter, redFlashes: red.counter, shakeArea };
}
