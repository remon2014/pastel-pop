// src/uiManager.js
export class UIManager {
  constructor() {
    this.targetColorText = document.getElementById('targetColor');
    this.levelText = document.getElementById('level');
    this.scoreText = document.getElementById('score');
    this.highScoreText = document.getElementById('highScore');
    this.gameOverText = document.getElementById('gameOver');
    this.restartBtn = document.getElementById('restartBtn');
    this.targetColorText = document.getElementById('targetColor');       // the full line
    this.targetColorName = document.getElementById('targetColorName');   // just the word


    this.restartBtn.addEventListener('click', () => window.location.reload());
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
  }
}
