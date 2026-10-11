import { Game } from './game.js';

window.addEventListener('DOMContentLoaded', () => {
  console.log('📋 DOM Ready');

  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  const startGameBtn = document.getElementById('startGameBtn');
  const pauseBtn = document.getElementById('pauseBtn');
  const menuHighScore = document.getElementById('menuHighScore');

  const game = new Game(canvas, ctx);
  const ui = game.ui;

  // Set canvas size
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  // Load high score
  const savedHighScore = localStorage.getItem('pastelPopHighScore') || 0;
  menuHighScore.textContent = `High Score: ${savedHighScore}`;

  // Start Game button
  startGameBtn.addEventListener('click', () => {
    document.getElementById('mainMenu').style.display = 'none';
    pauseBtn.style.display = 'inline-block';
    ui.setPauseLabel(false);
    game.start();
  });

  // ✅ Game Over: Restart Game
  ui.restartBtn.addEventListener('click', () => {
    game.resetGame();
  });

  // ✅ Game Over: Return to Main Menu
  ui.backToMenuBtn.addEventListener('click', () => {
    document.getElementById('mainMenu').style.display = 'flex';
    document.getElementById('pauseBtn').style.display = 'none';
  });


  // No need to bind pause/resume/mode change here — already handled in Game constructor
});
