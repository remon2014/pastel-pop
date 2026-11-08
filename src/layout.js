// Fits the canvas and HUD to the screen: safe-area insets, portrait column, view. The browser side of render/view.js.
import { INTERNAL_WIDTH_TARGET } from './config.js';
import { circleRadius } from './logic/world.js';
import { columnRect, computeView, placeView, swatchPixels } from './render/view.js';

const SIDES = ['top', 'right', 'bottom', 'left'];

// Reads env(safe-area-inset-*) in CSS px through a hidden probe element.
export function createInsetReader() {
  const probe = document.createElement('div');
  probe.setAttribute('aria-hidden', 'true');
  probe.style.cssText =
    'position:fixed;visibility:hidden;pointer-events:none;top:0;left:0;width:0;height:0;' +
    SIDES.map((side) => `padding-${side}:env(safe-area-inset-${side},0px);`).join('');
  document.body.append(probe);
  return () => {
    const style = getComputedStyle(probe);
    const insets = {};
    for (const side of SIDES) insets[side] = Number.parseFloat(style.getPropertyValue(`padding-${side}`)) || 0;
    return insets;
  };
}

// Returns { resize, last }. resize() sizes and places the canvas in the column, sets the --play-* variables the HUD
// follows, and hands the new view to the game. Keeps the last layout when the window has no usable size.
// `getInsets` and `getTarget` can be swapped (the dev layout scene does).
export function createLayout(
  canvas,
  game,
  { getInsets = createInsetReader(), getTarget = () => INTERNAL_WIDTH_TARGET } = {},
) {
  let last = null;

  function resize() {
    const dpr = window.devicePixelRatio;
    const insets = getInsets();
    const column = columnRect(window.innerWidth, window.innerHeight, insets);
    if (!column) return last;
    const view = computeView(column.width, column.height, dpr, getTarget());
    if (!view) return last;
    const swatchCss = swatchPixels(view, circleRadius(view.playCssWidth)) * view.cssPerInternal;
    const { left, top, swatchLeft } = placeView(column, view, swatchCss);
    canvas.width = view.internalWidth;
    canvas.height = view.internalHeight;
    const set = (name, px) => document.documentElement.style.setProperty(name, `${px}px`);
    canvas.style.width = `${view.playCssWidth}px`;
    canvas.style.height = `${view.playCssHeight}px`;
    canvas.style.left = `${left}px`;
    canvas.style.top = `${top}px`;
    set('--play-left', left);
    set('--play-top', top);
    set('--swatch-left', swatchLeft);
    set('--play-width', view.playCssWidth);
    set('--play-height', view.playCssHeight);
    game.setView(view);
    last = { view, column, insets, left, top };
    return last;
  }

  return {
    resize,
    get last() {
      return last;
    },
  };
}
