import { CIRCLE_DIAMETER_DP, CIRCLE_MAX_DIAMETER_DP, CIRCLE_REFERENCE_WIDTH_DP } from '../../config.js';
import { Game } from '../../game.js';
import { createInsetReader, createLayout } from '../../layout.js';
import { isInside } from '../../logic/world.js';
import { circlePixels } from '../../render/view.js';
import { createReadout } from '../readout.js';
import { button, READOUT_MS } from '../ui.js';

// What the "pretend notch" control uses instead of the real insets (CSS px).
const PRETEND_INSETS = { top: 47, right: 12, bottom: 34, left: 20 };
const ROWS = [
  'Circles outside play area',
  'Window (CSS px), pixel ratio',
  'Insets top, right, bottom, left',
  'Column size (CSS px)',
  'Column aspect (width / height)',
  'Circle diameter (CSS px)',
  'CIRCLE_MAX_DIAMETER_DP effect',
  'Swatch / circle diameter',
  'Swatch box vs Pause box',
];
// The same elements as index.html, because Game and UIManager find them by id.
const GAME_MARKUP = `
  <canvas id="gameCanvas"></canvas>
  <div id="gameUI">
    <button type="button" id="pauseBtn" class="button-17">Pause</button>
    <div id="infoPanel"><div>
      <canvas id="targetCanvas" aria-hidden="true"></canvas>
      <span id="targetLabel" class="visually-hidden" aria-live="polite"></span>
    </div></div>
  </div>
  <div id="pauseOverlay" class="overlay">
    <button type="button" id="continueBtn" class="button-17">Continue Playing</button>
    <button type="button" id="backToMainBtn" class="button-17">Return to Main Menu</button>
  </div>`;

const box = (el) => el.getBoundingClientRect();
const touching = (a, b) => a.left <= b.right && b.left <= a.right && a.top <= b.bottom && b.top <= a.bottom;

// Mounts the real game with its real layout and resize handling, then reads it back.
export default function mountLayoutScene(root) {
  const stage = document.createElement('div');
  stage.innerHTML = GAME_MARKUP;
  document.body.prepend(...stage.children);
  Object.assign(document.body.style, { overflow: 'hidden', height: '100%', minHeight: '0' });
  // Readouts sit over the bottom of the screen and let taps through to the game.
  Object.assign(root.style, {
    position: 'fixed',
    left: '0',
    right: '0',
    bottom: '0',
    zIndex: '40',
    maxWidth: 'none',
    padding: '4px 8px',
    fontSize: '12px',
    lineHeight: '1.2',
    pointerEvents: 'none',
    background: 'rgba(51,44,46,0.85)',
  });
  const outline = document.createElement('div');
  Object.assign(outline.style, {
    position: 'fixed',
    zIndex: '50',
    pointerEvents: 'none',
    boxSizing: 'border-box',
    border: '1px dashed #D9CEC2',
    display: 'none',
  });
  document.body.append(outline);

  const canvas = document.getElementById('gameCanvas');
  const game = new Game(canvas, canvas.getContext('2d'));
  const realInsets = createInsetReader();
  let pretend = false;
  const layout = createLayout(canvas, game, { getInsets: () => (pretend ? PRETEND_INSETS : realInsets()) });

  const readout = createReadout(root, ROWS);
  const buttons = document.createElement('div');
  buttons.className = 'dev-buttons';
  buttons.style.pointerEvents = 'auto';
  buttons.append(
    button('Pretend notch on/off', () => {
      pretend = !pretend;
      relayout();
    }),
  );
  root.append(buttons);

  function relayout() {
    layout.resize();
    const insets = layout.last?.insets;
    outline.style.display = pretend && insets ? 'block' : 'none';
    if (insets) {
      Object.assign(outline.style, {
        left: `${insets.left}px`,
        top: `${insets.top}px`,
        right: `${insets.right}px`,
        bottom: `${insets.bottom}px`,
      });
    }
    refresh();
  }

  const outside = () => game.circles.filter((c) => !isInside(c, game.bounds)).length;
  const swatchBox = () => box(game.ui.targetCanvas);
  const pauseBox = () => box(game.ui.pauseBtn);
  const circleCss = () => {
    const view = layout.last?.view;
    if (!view || game.circles.length === 0) return 0;
    return circlePixels(view, game.circles[0]).size * view.cssPerInternal;
  };
  // The cap only matters when the uncapped 64 dp-on-360 diameter would pass it.
  const uncappedCss = () => {
    const view = layout.last?.view;
    return view ? (CIRCLE_DIAMETER_DP * view.playCssWidth) / CIRCLE_REFERENCE_WIDTH_DP : 0;
  };

  function refresh() {
    const state = layout.last;
    if (!state) return;
    const { insets, view } = state;
    readout.set(ROWS[0], String(outside()));
    readout.set(ROWS[1], `${window.innerWidth} x ${window.innerHeight}, ${window.devicePixelRatio}`);
    readout.set(ROWS[2], `${insets.top}, ${insets.right}, ${insets.bottom}, ${insets.left}`);
    readout.set(ROWS[3], `${view.playCssWidth.toFixed(1)} x ${view.playCssHeight.toFixed(1)}`);
    readout.set(ROWS[4], (view.playCssWidth / view.playCssHeight).toFixed(4));
    readout.set(ROWS[5], circleCss().toFixed(2));
    const capped = uncappedCss() > CIRCLE_MAX_DIAMETER_DP;
    readout.set(
      ROWS[6],
      `${capped ? 'cap binds' : 'cap not reached'} (cap ${CIRCLE_MAX_DIAMETER_DP}, uncapped ${uncappedCss().toFixed(1)})`,
    );
    const swatch = swatchBox();
    readout.set(
      ROWS[7],
      `${swatch.width.toFixed(2)} / ${circleCss().toFixed(2)} = ${(swatch.width / circleCss()).toFixed(3)}`,
    );
    readout.set(
      ROWS[8],
      touching(swatch, pauseBox()) ? 'TOUCHING' : `clear by ${(pauseBox().left - swatch.right).toFixed(1)} px`,
    );
  }

  window.addEventListener('resize', relayout);
  setInterval(refresh, READOUT_MS);
  game.ui.pauseBtn.style.display = 'inline-block';
  game.start();
  relayout();

  return {
    get outside() {
      return outside();
    },
    get column() {
      return layout.last?.column;
    },
    get aspect() {
      const view = layout.last?.view;
      return view ? view.playCssWidth / view.playCssHeight : 0;
    },
    get insets() {
      return layout.last?.insets;
    },
    get pretend() {
      return pretend;
    },
    get circleCss() {
      return circleCss();
    },
    get uncappedCss() {
      return uncappedCss();
    },
    get capBinds() {
      return uncappedCss() > CIRCLE_MAX_DIAMETER_DP;
    },
    get swatchBox() {
      return swatchBox();
    },
    get pauseBox() {
      return pauseBox();
    },
    get canvasBox() {
      return box(canvas);
    },
  };
}
