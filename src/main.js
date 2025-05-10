import { Game } from './game.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const mainMenu = document.getElementById('mainMenu');
const menuHighScore = document.getElementById('menuHighScore');
const startGameBtn = document.getElementById('startGameBtn');
const menuBtn = document.getElementById('menuBtn');
const backToMenuBtn = document.getElementById('backToMenuBtn');

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Instantiate game, but don’t start it yet
const game = new Game(canvas, ctx);

// Update high score on menu
const savedHighScore = localStorage.getItem('pastelPopHighScore') || 0;
menuHighScore.textContent = `High Score: ${savedHighScore}`;

// Start game from menu
startGameBtn.addEventListener('click', () => {
  mainMenu.style.display = 'none';
  menuBtn.style.display = 'inline-block'; // show top-right menu during game
  game.start();
});

// Return to menu from in-game or game over
function returnToMainMenu() {
  window.location.reload(); // easiest way to reset everything
}

menuBtn.addEventListener('click', returnToMainMenu);
backToMenuBtn.addEventListener('click', returnToMainMenu);
