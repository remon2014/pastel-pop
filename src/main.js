import { Game } from './game.js';
import { renderLeaderboard, maybeSaveHighScore } from './leaderboard.js';
window.renderLeaderboard = renderLeaderboard;
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const mainMenu = document.getElementById('mainMenu');
const startGameBtn = document.getElementById('startGameBtn');
const menuBtn = document.getElementById('menuBtn');
const backToMenuBtn = document.getElementById('backToMenuBtn');
console.log("✅ main.js loaded");
// Instantiate game (once)
const game = new Game(canvas, ctx);

// Resize
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// ⬇️ DOM-ready section — run only after full page is loaded
window.addEventListener('DOMContentLoaded', () => {
  // ✅ Safe to access leaderboard DOM now
  console.log('📋 DOM Ready, rendering leaderboard');
  renderLeaderboard();

  // ✅ Update high score
  const savedHighScore = localStorage.getItem('pastelPopHighScore') || 0;
  document.getElementById('menuHighScore').textContent = `High Score: ${savedHighScore}`;
});

// ✅ Start game
startGameBtn.addEventListener('click', () => {
  mainMenu.style.display = 'none';
  menuBtn.style.display = 'inline-block';
  game.start();
});

// ✅ Return to menu
function returnToMainMenu() {
  document.getElementById('mainMenu').style.display = 'flex';
  document.getElementById('menuBtn').style.display = 'none';
  renderLeaderboard();
} 
menuBtn.addEventListener('click', returnToMainMenu);
backToMenuBtn.addEventListener('click', returnToMainMenu);

// ✅ Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('✅ Service Worker registered', reg))
      .catch(err => console.error('❌ Service Worker error', err));
  });
}
