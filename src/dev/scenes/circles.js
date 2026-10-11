import { CREAM, DUSK, DUST, GLOW_2 } from '../../config.js';
import { browserHost, createLoop } from '../../core/loop.js';
import { fitCircles, isInside, speedFor, stepCircles } from '../../logic/world.js';
import { createFpsCounter } from '../fpsCounter.js';
import { createReadout } from '../readout.js';

const DEFAULT_BOUNDS = { width: 1, height: 0.3 };
const NARROW_WIDTH = 0.5;
const SHORT_HEIGHT = 0.12;
// A small dot, so the centre travels almost the whole width between bounces. Chosen so the
// expected time is close to the 4.0 s of "one width in 4 s".
const DOT_RADIUS = 0.02;
const START_X = 0.5;
const START_Y = 0.2;
// Slow frames: logic steps once at least this many seconds have built up (about 30 steps a second).
const SLOW_STEP_SECONDS = 0.03;
const READOUT_MS = 250;
const ROWS = [
  'Slow frames',
  'Steps per second',
  'Bounds (widths)',
  'Expected crossing (s)',
  'Last crossing (s)',
  'Crossings',
  'Circle x, y (widths)',
  'Radius (widths)',
  'Outside bounds',
];

function button(label, onClick) {
  const b = document.createElement('button');
  b.type = 'button';
  b.textContent = label;
  b.addEventListener('click', onClick);
  return b;
}

// Mounts the scene and returns its read-only numbers for window.__pastelPopDev.
// A "crossing" is the time (on the clock of summed elapsed seconds) between two wall bounces.
// The circle's centre travels (width - 2 x radius) between bounces, so the expected time is
// exactly (width - 2 x radius) / speed: 3.92 s for the default bounds at 1.0x.
export default function mountCirclesScene(root) {
  const canvas = document.createElement('canvas');
  canvas.className = 'dev-canvas';
  canvas.style.height = 'auto';
  canvas.style.aspectRatio = `1 / ${DEFAULT_BOUNDS.height}`;
  const ctx = canvas.getContext('2d');
  const readout = createReadout(root, ROWS);
  const buttons = document.createElement('div');
  buttons.className = 'dev-buttons';
  root.append(canvas, buttons);

  const bounds = { ...DEFAULT_BOUNDS };
  const circle = { x: START_X, y: START_Y, vx: speedFor(1), vy: 0, radius: DOT_RADIUS };
  const circles = [circle];
  const stepCounter = createFpsCounter();
  let slowFrames = false;
  let pendingSeconds = 0;
  let clock = 0;
  let lastBounceAt = null;
  let lastCrossing = 0;
  let crossings = 0;

  function resetStopwatch() {
    lastBounceAt = null;
  }

  function step(seconds) {
    const direction = Math.sign(circle.vx);
    clock += seconds;
    stepCircles(circles, bounds, seconds);
    stepCounter.tick(performance.now());
    if (Math.sign(circle.vx) !== direction) {
      if (lastBounceAt !== null) {
        lastCrossing = clock - lastBounceAt;
        crossings++;
      }
      lastBounceAt = clock;
    }
  }

  function advance(elapsed) {
    if (!slowFrames) {
      step(elapsed);
      return;
    }
    pendingSeconds += elapsed;
    if (pendingSeconds >= SLOW_STEP_SECONDS) {
      step(pendingSeconds);
      pendingSeconds = 0;
    }
  }

  function draw() {
    const dpr = window.devicePixelRatio || 1;
    const w = Math.round(canvas.clientWidth * dpr);
    const h = Math.round(canvas.clientHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    ctx.fillStyle = DUSK;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = GLOW_2;
    ctx.fillRect(0, 0, bounds.width * w, bounds.height * w);
    ctx.fillStyle = CREAM;
    ctx.beginPath();
    ctx.arc(circle.x * w, circle.y * w, circle.radius * w, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = DUST;
    ctx.fillRect(0, 0, w, 2);
  }

  const loop = createLoop((elapsed) => {
    advance(elapsed);
    draw();
  }, browserHost());

  const expected = () => (bounds.width - 2 * circle.radius) / Math.abs(circle.vx);
  const outside = () => !isInside(circle, bounds);

  function refresh() {
    readout.set(ROWS[0], slowFrames ? 'on' : 'off');
    readout.set(ROWS[1], stepCounter.fps(performance.now()).toFixed(1));
    readout.set(ROWS[2], `${bounds.width} x ${bounds.height}`);
    readout.set(ROWS[3], expected().toFixed(3));
    readout.set(ROWS[4], lastCrossing.toFixed(3));
    readout.set(ROWS[5], String(crossings));
    readout.set(ROWS[6], `${circle.x.toFixed(3)}, ${circle.y.toFixed(3)}`);
    readout.set(ROWS[7], circle.radius.toFixed(3));
    readout.set(ROWS[8], outside() ? 'YES' : 'no');
  }
  setInterval(refresh, READOUT_MS);

  function setBounds(width, height) {
    bounds.width = width;
    bounds.height = height;
    fitCircles(circles, bounds);
    resetStopwatch();
    draw();
    refresh();
  }

  buttons.append(
    button('Slow frames on/off', () => {
      slowFrames = !slowFrames;
      pendingSeconds = 0;
      refresh();
    }),
    button('Narrower', () => setBounds(NARROW_WIDTH, bounds.height)),
    button('Shorter', () => setBounds(bounds.width, SHORT_HEIGHT)),
    button('Reset bounds', () => setBounds(DEFAULT_BOUNDS.width, DEFAULT_BOUNDS.height)),
  );
  draw();
  refresh();
  loop.start();

  return {
    get lastCrossing() {
      return lastCrossing;
    },
    get crossings() {
      return crossings;
    },
    get expectedCrossing() {
      return expected();
    },
    get stepsPerSecond() {
      return stepCounter.fps(performance.now());
    },
    get slowFrames() {
      return slowFrames;
    },
    get x() {
      return circle.x;
    },
    get y() {
      return circle.y;
    },
    get radius() {
      return circle.radius;
    },
    get outside() {
      return outside();
    },
  };
}
