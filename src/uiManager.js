// src/uiManager.js
export class UIManager {
  constructor() {
    this.levelText = document.getElementById('level');
    this.scoreText = document.getElementById('score');
    this.highScoreText = document.getElementById('highScore');
    this.gameOverText = document.getElementById('gameOver');
    this.backToMenuBtn = document.getElementById('backToMenuBtn');
    this.restartBtn = document.getElementById('restartBtn');
    this.targetColorText = document.getElementById('targetColor');
    this.targetColorName = document.getElementById('targetColorName');
    this.pauseBtn = document.getElementById('pauseBtn');
    this.pauseOverlay = document.getElementById('pauseOverlay');
    this.continueBtn = document.getElementById('continueBtn');
    this.changeModeBtn = document.getElementById('changeModeBtn');
    this.backToMainBtn = document.getElementById('backToMainBtn');
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

  setRestartHandler(handlerFn) {
    this.restartBtn.addEventListener('click', handlerFn);
  }

  update(level, score, highScore, targetColor) {
    this.levelText.textContent = `Level: ${level}`;
    this.scoreText.textContent = `Score: ${score}`;
    this.highScoreText.textContent = `High Score: ${highScore}`;
    if (targetColor) {
      this.targetColorName.textContent = targetColor;
    }
  }

  showGameOver() {
    this.gameOverText.style.display = 'block';
    this.restartBtn.style.display = 'inline-block';
    this.backToMenuBtn.style.display = 'inline-block';
  }

  hideGameOver() {
    this.gameOverText.style.display = 'none';
    this.restartBtn.style.display = 'none';
  }
}
