import { Game } from './game.js';

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  const mainMenu = document.getElementById('mainMenu');
  const startGameBtn = document.getElementById('startGameBtn');
  const pauseBtn = document.getElementById('pauseBtn');

  const game = new Game(canvas, ctx);
  const ui = game.ui;

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  startGameBtn.addEventListener('click', () => {
    mainMenu.style.display = 'none';
    pauseBtn.style.display = 'inline-block';
    game.start();
  });

  ui.backToMainBtn.addEventListener('click', () => {
    game.stop();
    mainMenu.style.display = 'flex';
    pauseBtn.style.display = 'none';
  });
});
