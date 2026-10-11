// src/uiManager.js
import { CREAM, DUSK, SWATCH_SIZE, SWATCH_FRAME_WIDTH } from './config.js';
import { drawSymbol } from './symbols.js';

export class UIManager {
  constructor() {
    this.targetCanvas = document.getElementById('targetCanvas');
    this.targetLabel = document.getElementById('targetLabel');
    this.pauseBtn = document.getElementById('pauseBtn');
    this.pauseOverlay = document.getElementById('pauseOverlay');
    this.continueBtn = document.getElementById('continueBtn');
    this.backToMainBtn = document.getElementById('backToMainBtn');
    this.targetCanvas.width = SWATCH_SIZE;
    this.targetCanvas.height = SWATCH_SIZE;
  }

  resetUI() {
    this.hidePauseMenu();
    this.setPauseLabel(false);
    this.targetCanvas.getContext('2d').clearRect(0, 0, SWATCH_SIZE, SWATCH_SIZE);
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

  // Draws the target as colour plus symbol in a Cream frame, and updates the polite screen-reader label.
  setTargetSwatch(color) {
    const ctx = this.targetCanvas.getContext('2d');
    const c = SWATCH_SIZE / 2;
    const frame = SWATCH_FRAME_WIDTH;
    ctx.clearRect(0, 0, SWATCH_SIZE, SWATCH_SIZE);
    ctx.beginPath();
    ctx.arc(c, c, c, 0, Math.PI * 2);
    ctx.fillStyle = CREAM;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(c, c, c - frame, 0, Math.PI * 2);
    ctx.fillStyle = DUSK;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(c, c, c - frame * 2, 0, Math.PI * 2);
    ctx.fillStyle = color.hex;
    ctx.fill();
    drawSymbol(ctx, color.id, c, c, c - frame * 2);
    this.targetLabel.textContent = `Target: ${color.name}, ${color.colorWord}`;
  }
}
