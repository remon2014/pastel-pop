import { drawCircle } from '../../circle.js';
import { PALETTE } from '../../colorManager.js';
import { CREAM, DUSK, DUST, GLOW_2, INTERNAL_WIDTH_TARGET } from '../../config.js';
import { browserHost, createLoop } from '../../core/loop.js';
import { circleRadius, fitCircles, isInside, speedFor, stepCircles } from '../../logic/world.js';
import { circlePixels, computeView, cssToWorld } from '../../render/view.js';
import { getDistance } from '../../utils.js';
import { createFpsCounter } from '../fpsCounter.js';
import { createReadout } from '../readout.js';
import { button, createViewCanvas, otherTarget, READOUT_MS, sizeCanvas } from '../ui.js';

const BOUNDS_WIDTH = 1;
const NARROW_WIDTH = 0.5;
const SHORT_HEIGHT = 0.12;
// A small dot, so the centre travels almost the whole width between bounces. Chosen so the
// expected time is close to the 4.0 s of "one width in 4 s".
const DOT_RADIUS = 0.02;
const START_X = 0.5;
const START_Y = 0.2;
// Canvas height as a fraction of its width, and where the still game-sized circle sits (widths).
const CANVAS_HEIGHT_RATIO = 0.6;
const GAME_CIRCLE_Y = 0.45;
const CALM_DOT_SPEED = 0.05;
const GAME_CIRCLE_COLOR = PALETTE[0];
// Slow frames: logic steps once at least this many seconds have built up (about 30 steps a second).
const SLOW_STEP_SECONDS = 0.03;
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
  'Internal width target',
  'Internal size, scale, dpr',
  'CSS px per internal px',
  'Circle diameter (internal px)',
  'Circle diameter (CSS px)',
  'Circle centre (CSS px)',
  'Last tap',
];

// Mounts the scene and returns its read-only numbers for window.__pastelPopDev.
// A "crossing" is the time (on the clock of summed elapsed seconds) between two wall bounces.
// The circle's centre travels (width - 2 x radius) between bounces, so the expected time is
// exactly (width - 2 x radius) / speed: 3.84 s for the default bounds at 1.0x.
export default function mountCirclesScene(root) {
  const canvas = createViewCanvas();
  const ctx = canvas.getContext('2d');
  const buttons = document.createElement('div');
  buttons.className = 'dev-buttons';
  // Canvas first, so growing readout text never moves it under a finger.
  root.append(canvas, buttons);
  const readout = createReadout(root, ROWS);

  const bounds = { width: BOUNDS_WIDTH, height: 0.3 };
  const circle = { x: START_X, y: START_Y, vx: speedFor(1), vy: 0, radius: DOT_RADIUS };
  const circles = [circle];
  const stepCounter = createFpsCounter();
  let slowFrames = false;
  let pendingSeconds = 0;
  let clock = 0;
  let lastBounceAt = null;
  let lastCrossing = 0;
  let crossings = 0;
  let target = INTERNAL_WIDTH_TARGET;
  let view = null;
  const gameCircle = { x: 0.5, y: GAME_CIRCLE_Y, radius: 0, color: GAME_CIRCLE_COLOR };
  let lastTap = 'none';
  let lastTapResult = null;

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

  // Sizes the canvas through the view (like the game) and puts the still circle on a whole internal pixel.
  function layout() {
    const next = computeView(
      window.innerWidth,
      window.innerWidth * CANVAS_HEIGHT_RATIO,
      window.devicePixelRatio,
      target,
    );
    if (!next) return;
    view = next;
    sizeCanvas(canvas, view);
    ctx.imageSmoothingEnabled = false;
    gameCircle.radius = circleRadius(view.playCssWidth);
    gameCircle.x = Math.floor(view.internalWidth / 2) / view.internalWidth;
    gameCircle.y = Math.round(GAME_CIRCLE_Y * view.internalWidth) / view.internalWidth;
    bounds.height = view.internalHeight / view.internalWidth;
    fitCircles(circles, bounds);
    resetStopwatch();
  }

  function draw() {
    if (!view) return;
    const w = view.internalWidth;
    ctx.fillStyle = DUSK;
    ctx.fillRect(0, 0, w, view.internalHeight);
    ctx.fillStyle = GLOW_2;
    ctx.fillRect(0, 0, Math.round(bounds.width * w), Math.round(bounds.height * w));
    ctx.fillStyle = CREAM;
    ctx.beginPath();
    ctx.arc(circle.x * w, circle.y * w, circle.radius * w, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = DUST;
    ctx.fillRect(0, 0, w, 1);
    drawCircle(ctx, gameCircle, view);
  }

  function onTap(event) {
    if (!view) return;
    const rect = canvas.getBoundingClientRect();
    const cssX = event.clientX - rect.left;
    const cssY = event.clientY - rect.top;
    const world = cssToWorld(view, cssX, cssY);
    const hit = getDistance(world.x, world.y, gameCircle.x, gameCircle.y) <= gameCircle.radius;
    lastTapResult = { cssX, cssY, worldX: world.x, worldY: world.y, hit };
    lastTap = `${cssX.toFixed(1)}, ${cssY.toFixed(1)} -> ${world.x.toFixed(3)}, ${world.y.toFixed(3)} ${hit ? 'HIT' : 'miss'}`;
    refresh();
  }
  canvas.addEventListener('pointerdown', onTap);

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
    if (!view) return;
    const drawn = circlePixels(view, gameCircle);
    readout.set(ROWS[9], String(view.target));
    readout.set(ROWS[10], `${view.internalWidth} x ${view.internalHeight}, ${view.scale}, ${view.dpr}`);
    readout.set(ROWS[11], view.cssPerInternal.toFixed(4));
    readout.set(ROWS[12], String(drawn.size));
    readout.set(ROWS[13], (drawn.size * view.cssPerInternal).toFixed(2));
    readout.set(
      ROWS[14],
      `${(gameCircle.x * view.playCssWidth).toFixed(2)}, ${(gameCircle.y * view.playCssWidth).toFixed(2)}`,
    );
    readout.set(ROWS[15], lastTap);
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
    button('Internal width 180 / 240', () => {
      target = otherTarget(target);
      layout();
      draw();
      refresh();
    }),
    button('Calm speed', () => {
      circle.vx = Math.sign(circle.vx) * CALM_DOT_SPEED;
      resetStopwatch();
      refresh();
    }),
    button('Reset bounds', () => {
      layout();
      setBounds(BOUNDS_WIDTH, bounds.height);
    }),
  );
  window.addEventListener('resize', layout);
  layout();
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
    get diameterInternal() {
      return view ? circlePixels(view, gameCircle).size : 0;
    },
    get diameterCss() {
      return view ? circlePixels(view, gameCircle).size * view.cssPerInternal : 0;
    },
    get radiusCss() {
      return view ? gameCircle.radius * view.playCssWidth : 0;
    },
    get centreCss() {
      return view ? { x: gameCircle.x * view.playCssWidth, y: gameCircle.y * view.playCssWidth } : null;
    },
    get lastTap() {
      return lastTapResult;
    },
    get view() {
      return view;
    },
  };
}
