import { CREAM, DUSK, DUST, GLOW_2, INK, INTERNAL_WIDTH_TARGET } from '../../config.js';
import { computeView } from '../../render/view.js';
import { createReadout } from '../readout.js';
import { button, createViewCanvas, otherTarget, READOUT_MS, sizeCanvas } from '../ui.js';

const CARD_HEIGHT_CSS = 240;
const ROWS = [
  'Target (internal width)',
  'Internal size',
  'Scale (device px per internal px)',
  'Device pixel ratio',
  'CSS px per internal px',
  'Play size (CSS px)',
  'Leftover strip (device px)',
];

// Test card at internal resolution, drawn with whole-number fillRect only.
function drawCard(ctx, w, h) {
  ctx.fillStyle = DUSK;
  ctx.fillRect(0, 0, w, h);
  // One-pixel checkerboard patch.
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      ctx.fillStyle = (x + y) % 2 === 0 ? CREAM : INK;
      ctx.fillRect(4 + x, 4 + y, 1, 1);
    }
  }
  // One-pixel lines across and down.
  ctx.fillStyle = CREAM;
  ctx.fillRect(24, 12, w - 48, 1);
  ctx.fillRect(24, 4, 1, Math.max(1, h - 8));
  // 2x2 block grid.
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      ctx.fillStyle = (x + y) % 2 === 0 ? DUST : GLOW_2;
      ctx.fillRect(32 + x * 2, 20 + y * 2, 2, 2);
    }
  }
  // Frame on the canvas edge.
  ctx.fillStyle = DUST;
  ctx.fillRect(0, 0, w, 1);
  ctx.fillRect(0, h - 1, w, 1);
  ctx.fillRect(0, 0, 1, h);
  ctx.fillRect(w - 1, 0, 1, h);
}

// Mounts the scene and returns its read-only numbers for window.__pastelPopDev.
export default function mountRenderScene(root) {
  const canvas = createViewCanvas();
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  const readout = createReadout(root, ROWS);
  const buttons = document.createElement('div');
  buttons.className = 'dev-buttons';
  root.append(canvas, buttons);

  let target = INTERNAL_WIDTH_TARGET;
  let view = null;

  function layout() {
    const next = computeView(window.innerWidth, CARD_HEIGHT_CSS, window.devicePixelRatio, target);
    if (!next) return;
    view = next;
    sizeCanvas(canvas, view);
    ctx.imageSmoothingEnabled = false;
    drawCard(ctx, view.internalWidth, view.internalHeight);
    refresh();
  }

  const leftover = () => (view ? window.innerWidth * view.dpr - view.internalWidth * view.scale : 0);

  function refresh() {
    if (!view) return;
    readout.set(ROWS[0], String(view.target));
    readout.set(ROWS[1], `${view.internalWidth} x ${view.internalHeight}`);
    readout.set(ROWS[2], String(view.scale));
    readout.set(ROWS[3], String(view.dpr));
    readout.set(ROWS[4], view.cssPerInternal.toFixed(4));
    readout.set(ROWS[5], `${view.playCssWidth.toFixed(2)} x ${view.playCssHeight.toFixed(2)}`);
    readout.set(ROWS[6], leftover().toFixed(2));
  }

  buttons.append(
    button('Internal width 180 / 240', () => {
      target = otherTarget(target);
      layout();
    }),
  );
  window.addEventListener('resize', layout);
  setInterval(refresh, READOUT_MS);
  layout();

  return {
    get target() {
      return view?.target;
    },
    get internalWidth() {
      return view?.internalWidth;
    },
    get internalHeight() {
      return view?.internalHeight;
    },
    get scale() {
      return view?.scale;
    },
    get dpr() {
      return view?.dpr;
    },
    get cssPerInternal() {
      return view?.cssPerInternal;
    },
    get leftoverDevicePx() {
      return leftover();
    },
  };
}
