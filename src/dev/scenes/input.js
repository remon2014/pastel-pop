import { drawCircle } from '../../circle.js';
import { PALETTE } from '../../colorManager.js';
import { DUSK, INTERNAL_WIDTH_TARGET } from '../../config.js';
import { attachPointer } from '../../input/pointer.js';
import { findHit, minTapRadius } from '../../logic/hit.js';
import { circleRadius } from '../../logic/world.js';
import { computeView, cssToWorld } from '../../render/view.js';
import { createFpsCounter } from '../fpsCounter.js';
import { createReadout } from '../readout.js';
import { button, createViewCanvas, READOUT_MS, sizeCanvas } from '../ui.js';

const CANVAS_HEIGHT_RATIO = 0.8;
const LOG_LINES = 8;
const MAX_RATE = 30;
const MAX_FINGERS = 5;
const START_RATE = 10;
const START_FINGERS = 3;
const FIRST_POINTER_ID = 100;
// Matching circle (target) sits under a non-matching one that overlaps it; a third stands apart.
const TARGET = PALETTE[0];
const LAYOUT = [
  { x: 0.4, y: 0.25, color: PALETTE[0] },
  { x: 0.55, y: 0.25, color: PALETTE[1] },
  { x: 0.5, y: 0.6, color: PALETTE[2] },
];
const ROWS = ['Target', 'Circle hit', 'Tap (CSS px)', 'Tap (widths)', 'Taps total', 'Taps per second', 'Auto-tapper'];

// Mounts the scene and returns its read-only numbers for window.__pastelPopDev.
// Circles are still, drawn in order (the last is on top). Taps go through the real attachPointer and findHit.
export default function mountInputScene(root) {
  const canvas = createViewCanvas();
  const ctx = canvas.getContext('2d');
  const buttons = document.createElement('div');
  buttons.className = 'dev-buttons';
  const log = document.createElement('pre');
  log.style.cssText = 'margin:0 0 12px;min-height:9em;font-size:13px';
  root.append(canvas, buttons);
  const readout = createReadout(root, ROWS);
  root.append(log);

  const circles = LAYOUT.map((c) => ({ ...c, radius: 0 }));
  const perSecond = createFpsCounter();
  const lines = [];
  let view = null;
  let total = 0;
  let lastHit = 'none';
  let lastCss = null;
  let lastWorld = null;
  let rate = START_RATE;
  let fingers = START_FINGERS;
  let timer = null;

  function draw() {
    if (!view) return;
    ctx.fillStyle = DUSK;
    ctx.fillRect(0, 0, view.internalWidth, view.internalHeight);
    for (const circle of circles) drawCircle(ctx, circle, view);
  }

  function layout() {
    const next = computeView(
      window.innerWidth,
      window.innerWidth * CANVAS_HEIGHT_RATIO,
      window.devicePixelRatio,
      INTERNAL_WIDTH_TARGET,
    );
    if (!next) return;
    view = next;
    sizeCanvas(canvas, view);
    ctx.imageSmoothingEnabled = false;
    for (const circle of circles) circle.radius = circleRadius(view.playCssWidth);
    draw();
  }

  function onTap(cssX, cssY) {
    if (!view) return;
    const world = cssToWorld(view, cssX, cssY);
    const hit = findHit(circles, world.x, world.y, TARGET.id, { minRadius: minTapRadius(view.playCssWidth) });
    total++;
    perSecond.tick(performance.now());
    lastHit = hit ? hit.color.name : 'none';
    lastCss = { x: cssX, y: cssY };
    lastWorld = world;
    lines.push(`#${total} ${cssX.toFixed(1)}, ${cssY.toFixed(1)} -> ${lastHit}`);
    if (lines.length > LOG_LINES) lines.shift();
    log.textContent = lines.join('\n');
  }
  attachPointer(canvas, onTap);

  // One tick sends one pointerdown per finger, each with its own pointerId and a random position on the canvas.
  function autoTap() {
    const rect = canvas.getBoundingClientRect();
    for (let i = 0; i < fingers; i++) {
      canvas.dispatchEvent(
        new PointerEvent('pointerdown', {
          pointerId: FIRST_POINTER_ID + i,
          pointerType: 'touch',
          isPrimary: i === 0,
          button: 0,
          bubbles: true,
          clientX: rect.left + Math.random() * rect.width,
          clientY: rect.top + Math.random() * rect.height,
        }),
      );
    }
  }

  function restartTimer() {
    if (timer === null) return;
    clearInterval(timer);
    timer = setInterval(autoTap, 1000 / rate);
  }

  function toggleAuto() {
    if (timer === null) {
      timer = setInterval(autoTap, 1000 / rate);
    } else {
      clearInterval(timer);
      timer = null;
    }
    refresh();
  }

  const change = (setter) => () => {
    setter();
    restartTimer();
    refresh();
  };
  buttons.append(
    button('Auto-tap on/off', toggleAuto),
    button(
      'Rate -',
      change(() => (rate = Math.max(1, rate - 1))),
    ),
    button(
      'Rate +',
      change(() => (rate = Math.min(MAX_RATE, rate + 1))),
    ),
    button(
      'Fingers -',
      change(() => (fingers = Math.max(1, fingers - 1))),
    ),
    button(
      'Fingers +',
      change(() => (fingers = Math.min(MAX_FINGERS, fingers + 1))),
    ),
    button('Clear log', () => {
      total = 0;
      lines.length = 0;
      log.textContent = '';
      refresh();
    }),
  );

  function refresh() {
    readout.set(ROWS[0], TARGET.name);
    readout.set(ROWS[1], lastHit);
    readout.set(ROWS[2], lastCss ? `${lastCss.x.toFixed(1)}, ${lastCss.y.toFixed(1)}` : 'none');
    readout.set(ROWS[3], lastWorld ? `${lastWorld.x.toFixed(3)}, ${lastWorld.y.toFixed(3)}` : 'none');
    readout.set(ROWS[4], String(total));
    readout.set(ROWS[5], perSecond.fps(performance.now()).toFixed(1));
    readout.set(ROWS[6], timer === null ? 'off' : `${rate}/s x ${fingers} fingers`);
  }
  setInterval(refresh, READOUT_MS);
  window.addEventListener('resize', layout);
  layout();
  refresh();

  return {
    get lastHit() {
      return lastHit;
    },
    get lastTapCss() {
      return lastCss;
    },
    get lastTapWorld() {
      return lastWorld;
    },
    get tapsTotal() {
      return total;
    },
    get tapsPerSecond() {
      return perSecond.fps(performance.now());
    },
    get rate() {
      return rate;
    },
    get fingers() {
      return fingers;
    },
    get autoTapping() {
      return timer !== null;
    },
    get circles() {
      return circles.map(({ x, y, radius, color }) => ({ x, y, radius, color: color.name }));
    },
    get view() {
      return view;
    },
  };
}
