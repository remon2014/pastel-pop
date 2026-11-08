import { Game } from './game.js';
import { createLayout } from './layout.js';

window.addEventListener('DOMContentLoaded', async () => {
  if (import.meta.env.DEV && new URLSearchParams(location.search).has('dev')) {
    const { startDev } = await import('./dev/index.js');
    if (startDev(location.search)) return;
  }

  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  const mainMenu = document.getElementById('mainMenu');
  const startGameBtn = document.getElementById('startGameBtn');
  const pauseBtn = document.getElementById('pauseBtn');

  const game = new Game(canvas, ctx);
  const ui = game.ui;

  const layout = createLayout(canvas, game);
  layout.resize();
  window.addEventListener('resize', layout.resize);

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
