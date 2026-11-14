// The DOM HUD: target swatch, Pause button and Pause menu.
import { fillDisc } from './render/circle.js';
import { CREAM, DUSK, SWATCH_FRAME_PX, SWATCH_GAP_PX } from './config.js';
import { swatchPixels } from './render/view.js';
import { drawSymbol } from './render/symbols.js';

export class Hud {
  constructor() {
    this.targetCanvas = document.getElementById('targetCanvas');
    this.targetLabel = document.getElementById('targetLabel');
    this.pauseBtn = document.getElementById('pauseBtn');
    this.pauseOverlay = document.getElementById('pauseOverlay');
    this.continueBtn = document.getElementById('continueBtn');
    this.backToMainBtn = document.getElementById('backToMainBtn');
    this.targetColor = null;
  }

  resetUI() {
    this.hidePauseMenu();
    this.setPauseLabel(false);
    this.targetColor = null;
    this.drawSwatch();
    this.targetLabel.textContent = '';
  }

  showPauseMenu() {
    this.pauseOverlay.style.display = 'flex';
  }

  hidePauseMenu() {
    this.pauseOverlay.style.display = 'none';
  }

  setPauseLabel(isPaused) {
    this.pauseBtn.textContent = isPaused ? 'Resume' : 'Pause';
  }

  // Sizes the swatch canvas in the play area's pixels (1.5 play circles across) and redraws it.
  layoutSwatch(view, circleRadius) {
    const size = swatchPixels(view, circleRadius);
    this.targetCanvas.width = size;
    this.targetCanvas.height = size;
    this.targetCanvas.style.width = `${size * view.cssPerInternal}px`;
    this.targetCanvas.style.height = `${size * view.cssPerInternal}px`;
    this.drawSwatch();
  }

  // Draws the target as colour plus symbol in a Cream frame, and updates the polite screen-reader label.
  setTargetSwatch(color) {
    this.targetColor = color;
    this.drawSwatch();
    this.targetLabel.textContent = color ? `Target: ${color.name}, ${color.colorWord}` : '';
  }

  drawSwatch() {
    const ctx = this.targetCanvas.getContext('2d');
    const size = this.targetCanvas.width;
    ctx.clearRect(0, 0, size, size);
    if (!this.targetColor || size < 1) return;
    const ring = SWATCH_FRAME_PX + SWATCH_GAP_PX;
    fillDisc(ctx, 0, 0, size, CREAM);
    fillDisc(ctx, SWATCH_FRAME_PX, SWATCH_FRAME_PX, size - 2 * SWATCH_FRAME_PX, DUSK);
    fillDisc(ctx, ring, ring, size - 2 * ring, this.targetColor.hex);
    drawSymbol(ctx, this.targetColor.id, size / 2, size / 2, size / 2 - ring);
  }
}
