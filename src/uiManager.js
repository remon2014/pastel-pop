// src/uiManager.js
export class UIManager {
  constructor() {
    this.targetSwatch = document.getElementById('targetSwatch');
    this.pauseBtn = document.getElementById('pauseBtn');
    this.pauseOverlay = document.getElementById('pauseOverlay');
    this.continueBtn = document.getElementById('continueBtn');
    this.backToMainBtn = document.getElementById('backToMainBtn');
  }

  resetUI() {
    this.hidePauseMenu();
    this.setPauseLabel(false);
    this.targetSwatch.style.backgroundColor = 'transparent';
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

  setTargetSwatch(hex) {
    this.targetSwatch.style.backgroundColor = hex;
  }
}
