import { drawCircle } from './circle.js';
import { UIManager } from './uiManager.js';
import { PALETTE } from './colorManager.js';
import { browserHost, createLoop } from './core/loop.js';
import { BACKGROUND_COLOR } from './config.js';
import { getDistance } from './utils.js';
import { circleRadius, fitCircles, levelMultiplier, spawnCircle, speedFor, stepCircles } from './logic/world.js';

export class Game {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.ui = new UIManager();

    this.level = 1;
    this.currentTargetColor = null;
    this.isPaused = false;
    this.loop = createLoop(this.update.bind(this), browserHost());
    this.circles = [];
    this.bounds = { width: 1, height: 1 };
    this.widthPixels = 0;

    this.ui.pauseBtn.addEventListener('click', () => this.togglePause());
    this.ui.continueBtn.addEventListener('click', () => this.resumeGame());

    this.canvas.addEventListener('click', this.handleClick.bind(this));
    this.canvas.addEventListener('touchstart', this.handleTouch.bind(this));
  }

  start() {
    this.ui.resetUI();
    this.level = 1;
    this.isPaused = false;

    this.initLevel();
    this.loop.start();
  }

  stop() {
    this.loop.stop();
    this.isPaused = false;
    this.circles = [];
    this.ui.hidePauseMenu();
  }

  initLevel() {
    this.circles = [];
    this.syncBounds();
    const numCircles = 5 + this.level * 2;
    const speed = speedFor(levelMultiplier(this.level));
    const radius = circleRadius(this.canvas.width);

    for (let i = 0; i < numCircles; i++) {
      const circle = spawnCircle(this.bounds, radius, speed, Math.random);
      circle.color = PALETTE[Math.floor(Math.random() * PALETTE.length)];
      this.circles.push(circle);
    }

    this.selectNewTargetColor();
  }

  // The play area is 1 wide and as tall as the canvas aspect. Resizing pulls circles back inside.
  syncBounds() {
    const height = this.canvas.height / this.canvas.width;
    if (height === this.bounds.height && this.canvas.width === this.widthPixels) return;
    this.widthPixels = this.canvas.width;
    this.bounds.height = height;
    const radius = circleRadius(this.canvas.width);
    for (const circle of this.circles) circle.radius = radius;
    fitCircles(this.circles, this.bounds);
  }

  selectNewTargetColor() {
    const remainingColors = [...new Set(this.circles.map((c) => c.color))];
    if (remainingColors.length === 0) {
      this.level++;
      this.initLevel();
      return;
    }

    const selected = remainingColors[Math.floor(Math.random() * remainingColors.length)];
    this.currentTargetColor = selected.id;
    this.ui.setTargetSwatch(selected);
  }

  handleClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    this.handleInput(e.clientX - rect.left, e.clientY - rect.top);
  }

  handleTouch(e) {
    e.preventDefault();
    const rect = this.canvas.getBoundingClientRect();
    const touch = e.touches[0];
    this.handleInput(touch.clientX - rect.left, touch.clientY - rect.top);
  }

  handleInput(pixelX, pixelY) {
    if (this.isPaused) return;
    const x = pixelX / this.canvas.width;
    const y = pixelY / this.canvas.width;

    for (let i = this.circles.length - 1; i >= 0; i--) {
      const circle = this.circles[i];
      if (getDistance(x, y, circle.x, circle.y) <= circle.radius) {
        if (circle.color.id === this.currentTargetColor) {
          this.circles.splice(i, 1);
          this.selectNewTargetColor();
        }
        return;
      }
    }
  }

  togglePause() {
    if (this.isPaused) {
      this.resumeGame();
      return;
    }
    this.isPaused = true;
    this.loop.stop();
    this.ui.setPauseLabel(true);
    this.ui.showPauseMenu();
  }

  resumeGame() {
    this.isPaused = false;
    this.ui.hidePauseMenu();
    this.ui.setPauseLabel(false);
    this.loop.start();
  }

  update(elapsedSeconds) {
    this.syncBounds();
    stepCircles(this.circles, this.bounds, elapsedSeconds);

    this.ctx.fillStyle = BACKGROUND_COLOR;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    for (const circle of this.circles) drawCircle(this.ctx, circle, this.canvas.width);
  }
}
