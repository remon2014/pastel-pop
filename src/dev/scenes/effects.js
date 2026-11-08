import { PALETTE } from '../../colorManager.js';
import { DUSK, INTERNAL_WIDTH_TARGET } from '../../config.js';
import { browserHost, createLoop } from '../../core/loop.js';
import { drawCircleWithEffects, drawFrame } from '../../effects/drawEffects.js';
import { createEffects } from '../../effects/effects.js';
import { attachPointer } from '../../input/pointer.js';
import { findHit, minTapRadius } from '../../logic/hit.js';
import { circleRadius } from '../../logic/world.js';
import { computeView, cssToWorld } from '../../render/view.js';
import { createSettings } from '../../settings.js';
import { createStorage, createSystemReducedMotion } from '../../storage.js';
import { createFpsCounter } from '../fpsCounter.js';
import { createReadout } from '../readout.js';
import { button, createViewCanvas, READOUT_MS, sizeCanvas } from '../ui.js';

const CANVAS_HEIGHT_RATIO = 0.8;
const START_RATE = 10;
const FINGERS = 3;
const FIRST_POINTER_ID = 200;
const RESPAWN_SECONDS = 0.4;
// Slow loop: logic steps once at least this many seconds have built up (about 30 steps a second).
const SLOW_STEP_SECONDS = 0.03;
const TARGET = PALETTE[0];
const SPOTS = [
  [0.2, 0.25],
  [0.5, 0.25],
  [0.8, 0.25],
  [0.2, 0.55],
  [0.5, 0.55],
  [0.8, 0.55],
];
const PULSE_ID = 'lowTime';
// Story pulse at its 2 a second limit; Calm at its limit of one every 2 seconds.
const PULSE_RATE = { story: 2, calm: 0.5 };
const ROWS = [
  'Mode',
  'Reduce motion (switch / system / effective)',
  'Auto-tapper',
  'Low-time pulse',
  'Flashes in the last second',
  'Highest flashes in a second',
  'Shakes running',
  'Highest shakes running',
  'Shakes begun in the last second',
  'Highest shakes begun',
  'Pulse beats in the last second',
  'Steps per second',
  'Looks on screen',
];
const onOff = (b) => (b ? 'on' : 'off');

// Mounts the scene and returns its read-only numbers for window.__pastelPopDev.
// Six still circles; tapping the target colour pops it (a new one arrives after a moment), tapping another
// is a wrong tap (Story: shake, Calm: wobble). Every tap goes through the real attachPointer, findHit and the layer.
export default function mountEffectsScene(root) {
  const canvas = createViewCanvas();
  const ctx = canvas.getContext('2d');
  const buttons = document.createElement('div');
  buttons.className = 'dev-buttons';
  root.append(canvas, buttons);
  const readout = createReadout(root, ROWS);

  const system = createSystemReducedMotion();
  const settings = createSettings({ storage: createStorage(), systemReducedMotion: system });
  const effects = createEffects();
  effects.bindSettings(settings);
  const stepCounter = createFpsCounter();

  let nextId = 0;
  const newCircle = (spot, color) => ({
    id: `c${nextId++}`,
    x: spot[0],
    y: spot[1],
    radius: 0,
    color,
    gone: false,
    waiting: false,
    respawnAt: 0,
  });
  const circles = SPOTS.map((spot, i) => newCircle(spot, PALETTE[i % PALETTE.length]));

  let mode = 'story';
  let view = null;
  let now = 0;
  let slowLoop = false;
  let pendingSeconds = 0;
  let pulseOn = false;
  const rate = START_RATE;
  let timer = null;

  const request = (kind, circle, extra = {}) =>
    effects.request({
      kind,
      mode,
      now,
      circleId: circle.id,
      x: circle.x,
      y: circle.y,
      radius: circle.radius,
      color: circle.color.hex,
      ...extra,
    });

  function pop(circle) {
    request('pop', circle);
    effects.forget(circle.id);
    circle.gone = true;
    circle.respawnAt = now + RESPAWN_SECONDS;
  }

  function wrongTap(circle) {
    request(mode === 'story' ? 'shake' : 'wobble', circle);
  }

  function respawn(circle) {
    circle.id = `c${nextId++}`;
    circle.color = PALETTE[Math.floor(Math.random() * PALETTE.length)];
    circle.waiting = request('arrival', circle).form === 'waitUntil';
    circle.gone = circle.waiting;
  }

  function onTap(cssX, cssY) {
    if (!view) return;
    const world = cssToWorld(view, cssX, cssY);
    const hit = findHit(
      circles.filter((c) => !c.gone),
      world.x,
      world.y,
      TARGET.id,
      { minRadius: minTapRadius(view.playCssWidth) },
    );
    if (!hit) return;
    if (hit.color.id === TARGET.id) pop(hit);
    else wrongTap(hit);
  }
  attachPointer(canvas, onTap);

  function startPulse() {
    effects.request({ kind: 'pulse', mode, now, circleId: PULSE_ID, rate: PULSE_RATE[mode] });
  }

  function step(seconds) {
    now += seconds;
    stepCounter.tick(performance.now());
    for (const circle of circles) {
      if (circle.waiting && !effects.isHeld(circle.id)) circle.gone = circle.waiting = false;
      else if (circle.gone && !circle.waiting && now >= circle.respawnAt) respawn(circle);
    }
    effects.update(now);
  }

  function advance(elapsed) {
    if (!slowLoop) {
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
    if (!view) return;
    ctx.fillStyle = DUSK;
    ctx.fillRect(0, 0, view.internalWidth, view.internalHeight);
    drawFrame(ctx, effects, view, () => {
      for (const circle of circles) if (!circle.gone) drawCircleWithEffects(ctx, effects, circle, view);
    });
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
  }

  const loop = createLoop((elapsed) => {
    advance(elapsed);
    draw();
  }, browserHost());

  // One tick sends one pointerdown per finger, each aimed at a random circle on screen.
  function autoTap() {
    if (!view) return;
    const rect = canvas.getBoundingClientRect();
    const aim = circles.filter((c) => !c.gone);
    for (let i = 0; i < FINGERS; i++) {
      const circle = aim[Math.floor(Math.random() * aim.length)];
      if (!circle) return;
      canvas.dispatchEvent(
        new PointerEvent('pointerdown', {
          pointerId: FIRST_POINTER_ID + i,
          pointerType: 'touch',
          isPrimary: i === 0,
          button: 0,
          bubbles: true,
          clientX: rect.left + circle.x * view.playCssWidth,
          clientY: rect.top + circle.y * view.playCssWidth,
        }),
      );
    }
  }

  const modeButton = button('', () => {
    mode = mode === 'story' ? 'calm' : 'story';
    if (pulseOn) {
      effects.stopPulse(PULSE_ID, now);
      startPulse();
    }
    refresh();
  });
  const pulseButton = button('', () => {
    pulseOn = !pulseOn;
    if (pulseOn) startPulse();
    else effects.stopPulse(PULSE_ID, now);
    refresh();
  });
  const tapButton = button('', () => {
    if (timer === null) timer = setInterval(autoTap, 1000 / rate);
    else {
      clearInterval(timer);
      timer = null;
    }
    refresh();
  });
  const slowButton = button('', () => {
    slowLoop = !slowLoop;
    pendingSeconds = 0;
    refresh();
  });
  const reduceButton = button('', () => settings.set('reduceMotion', !settings.get('reduceMotion')));
  buttons.append(
    tapButton,
    modeButton,
    reduceButton,
    pulseButton,
    slowButton,
    button('Reset highest', () => effects.resetPeaks()),
  );

  const looks = () => effects.active.map((e) => `${e.kind}.${e.form}`).join(' ') || 'none';

  function refresh() {
    modeButton.textContent = `Mode: ${mode === 'story' ? 'Story' : 'Calm'}`;
    pulseButton.textContent = `Low-time pulse: ${onOff(pulseOn)}`;
    tapButton.textContent = `Auto-tapper (${rate}/s x ${FINGERS}): ${onOff(timer !== null)}`;
    slowButton.textContent = `Slow loop (30 steps/s): ${onOff(slowLoop)}`;
    reduceButton.textContent = `Reduce motion switch: ${onOff(settings.get('reduceMotion'))}`;
    readout.set(ROWS[0], mode);
    readout.set(
      ROWS[1],
      `${onOff(settings.get('reduceMotion'))} / ${onOff(system.matches())} / ${onOff(settings.effectiveReduceMotion())}`,
    );
    readout.set(ROWS[2], timer === null ? 'off' : `${rate}/s x ${FINGERS} fingers`);
    readout.set(ROWS[3], pulseOn ? `${PULSE_RATE[mode]}/s` : 'off');
    readout.set(ROWS[4], String(effects.flashCount()));
    readout.set(ROWS[5], String(effects.peaks.flashes));
    readout.set(ROWS[6], String(effects.shakesRunning()));
    readout.set(ROWS[7], String(effects.peaks.shakesRunning));
    readout.set(ROWS[8], String(effects.shakesBegunCount()));
    readout.set(ROWS[9], String(effects.peaks.shakesBegun));
    readout.set(ROWS[10], String(effects.beatCount()));
    readout.set(ROWS[11], stepCounter.fps(performance.now()).toFixed(1));
    readout.set(ROWS[12], looks());
  }
  settings.subscribe(refresh);
  setInterval(refresh, READOUT_MS);
  window.addEventListener('resize', layout);
  layout();
  refresh();
  loop.start();

  return {
    get mode() {
      return mode;
    },
    get reduceMotion() {
      return settings.effectiveReduceMotion();
    },
    get flashes() {
      return effects.flashCount();
    },
    get highestFlashes() {
      return effects.peaks.flashes;
    },
    get shakesRunning() {
      return effects.shakesRunning();
    },
    get highestShakesRunning() {
      return effects.peaks.shakesRunning;
    },
    get shakesBegun() {
      return effects.shakesBegunCount();
    },
    get highestShakesBegun() {
      return effects.peaks.shakesBegun;
    },
    get pulseBeats() {
      return effects.beatCount();
    },
    get shakeOffset() {
      return effects.shakeOffset();
    },
    get looks() {
      return effects.active.map((e) => `${e.kind}.${e.form}`);
    },
    get stepsPerSecond() {
      return stepCounter.fps(performance.now());
    },
    get slowLoop() {
      return slowLoop;
    },
  };
}
