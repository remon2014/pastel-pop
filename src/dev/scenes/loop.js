import { CREAM, DUSK, DUST, GLOW_2 } from '../../config.js';
import { browserHost, createLoop } from '../../core/loop.js';
import { createFpsCounter } from '../fpsCounter.js';
import { countPending } from '../pendingCounter.js';
import { createReadout } from '../readout.js';

const MARKER_SPEED = 0.25; // play-area widths per second
const STALL_MS = 500;
const READOUT_MS = 250;
const ROWS = ['Frames per second', 'Last elapsed (s)', 'Clamped frames', 'Running loops', 'Marker (widths)'];

function button(label, onClick) {
  const b = document.createElement('button');
  b.type = 'button';
  b.textContent = label;
  b.addEventListener('click', onClick);
  return b;
}

function stall() {
  const end = performance.now() + STALL_MS;
  while (performance.now() < end) {
    // busy wait on purpose: blocks the main thread so the next frame is late
  }
}

// Mounts the scene and returns its read-only numbers for window.__pastelPopDev.
export default function mountLoopScene(root) {
  const canvas = document.createElement('canvas');
  canvas.className = 'dev-canvas';
  const ctx = canvas.getContext('2d');
  const readout = createReadout(root, ROWS);
  const buttons = document.createElement('div');
  buttons.className = 'dev-buttons';
  root.append(canvas, buttons);

  const counter = createFpsCounter();
  const pending = countPending(browserHost());
  let marker = 0;

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
    ctx.fillRect(0, h * 0.5 - 1, w, 2);
    const size = h * 0.4;
    ctx.fillStyle = CREAM;
    ctx.fillRect(marker * (w - size), h * 0.5 - size / 2, size, size);
    ctx.fillStyle = DUST;
    ctx.fillRect(0, 0, w, 2);
  }

  const loop = createLoop((elapsed) => {
    counter.tick(performance.now());
    marker = (marker + elapsed * MARKER_SPEED) % 1;
    draw();
  }, pending.host);

  const numbers = () => ({
    fps: Math.round(counter.fps(performance.now()) * 10) / 10,
    lastElapsed: loop.lastElapsed,
    clampedFrames: loop.clampedFrames,
    runningLoops: pending.count(),
    running: loop.running,
    marker,
  });

  function refresh() {
    const n = numbers();
    readout.set(ROWS[0], n.fps.toFixed(1));
    readout.set(ROWS[1], n.lastElapsed.toFixed(4));
    readout.set(ROWS[2], String(n.clampedFrames));
    readout.set(ROWS[3], String(n.runningLoops));
    readout.set(ROWS[4], n.marker.toFixed(3));
  }
  setInterval(refresh, READOUT_MS);
  refresh();

  buttons.append(
    button('Start', () => loop.start()),
    button('Stop', () => loop.stop()),
    button('Start twice', () => {
      loop.start();
      loop.start();
    }),
    button('Stall 500 ms', stall),
  );
  draw();

  return {
    get fps() {
      return numbers().fps;
    },
    get lastElapsed() {
      return loop.lastElapsed;
    },
    get clampedFrames() {
      return loop.clampedFrames;
    },
    get runningLoops() {
      return pending.count();
    },
    get running() {
      return loop.running;
    },
    get marker() {
      return marker;
    },
  };
}
