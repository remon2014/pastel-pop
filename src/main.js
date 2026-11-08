import { Game } from './game.js';
import { computeView } from './render/view.js';
import { INTERNAL_WIDTH_TARGET } from './config.js';

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

  // Sizes the canvas through the view. Keeps the last view when the window has no usable size.
  function resizeCanvas() {
    const view = computeView(window.innerWidth, window.innerHeight, window.devicePixelRatio, INTERNAL_WIDTH_TARGET);
    if (!view) return;
    canvas.width = view.internalWidth;
    canvas.height = view.internalHeight;
    canvas.style.width = `${view.playCssWidth}px`;
    canvas.style.height = `${view.playCssHeight}px`;
    game.setView(view);
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
