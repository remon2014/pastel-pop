import { ALTERNATE_INTERNAL_WIDTH, INTERNAL_WIDTH_TARGET } from '../config.js';
// Shared by the dev scenes.
export const READOUT_MS = 250;

export function button(label, onClick) {
  const b = document.createElement('button');
  b.type = 'button';
  b.textContent = label;
  b.addEventListener('click', onClick);
  return b;
}

// Canvas that breaks out of the dev page padding to the full window width, drawn pixelated.
export function createViewCanvas() {
  const canvas = document.createElement('canvas');
  canvas.className = 'dev-canvas';
  Object.assign(canvas.style, {
    width: '0',
    height: '0',
    marginLeft: 'calc(50% - 50vw)',
    border: '0',
    borderRadius: '0',
    imageRendering: 'pixelated',
    touchAction: 'none',
  });
  return canvas;
}

// Gives the canvas the view's internal size and CSS size.
export function sizeCanvas(canvas, view) {
  canvas.width = view.internalWidth;
  canvas.height = view.internalHeight;
  canvas.style.width = `${view.playCssWidth}px`;
  canvas.style.height = `${view.playCssHeight}px`;
}

// Other internal-width target for the 180 / 240 comparison buttons.
export function otherTarget(target) {
  return target === INTERNAL_WIDTH_TARGET ? ALTERNATE_INTERNAL_WIDTH : INTERNAL_WIDTH_TARGET;
}
