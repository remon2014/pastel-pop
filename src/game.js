import { Circle } from './circle.js';
import { UIManager } from './uiManager.js';
import { PALETTE } from './colorManager.js';
import { getDistance } from './utils.js';
import { CIRCLE_RADIUS, BACKGROUND_COLOR, BASE_SPEED, SPEED_PER_LEVEL } from './config.js';

export class Game {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.ui = new UIManager();

    this.level = 1;
    this.currentTargetColor = null;
    this.isPaused = false;
    this.frameId = null;
    this.circles = [];

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
    this.startLoop();
  }

  stop() {
    this.stopLoop();
    this.isPaused = false;
    this.circles = [];
    this.ui.hidePauseMenu();
  }

  startLoop() {
    this.stopLoop();
    this.frameId = requestAnimationFrame(this.update.bind(this));
  }

  stopLoop() {
    if (this.frameId !== null) {
      cancelAnimationFrame(this.frameId);
      this.frameId = null;
    }
  }

  initLevel() {
    this.circles = [];
    const numCircles = 5 + this.level * 2;
    const speed = BASE_SPEED + this.level * SPEED_PER_LEVEL;

    for (let i = 0; i < numCircles; i++) {
      const color = PALETTE[Math.floor(Math.random() * PALETTE.length)];
      const x = Math.random() * (this.canvas.width - CIRCLE_RADIUS * 2) + CIRCLE_RADIUS;
      const y = Math.random() * (this.canvas.height - CIRCLE_RADIUS * 2) + CIRCLE_RADIUS;

      this.circles.push(new Circle(
        x,
        y,
        color,
        (Math.random() - 0.5) * speed,
        (Math.random() - 0.5) * speed
      ));
    }

    this.selectNewTargetColor();
  }

  selectNewTargetColor() {
    const remainingColors = [...new Set(this.circles.map(c => c.color))];
    if (remainingColors.length === 0) {
      this.level++;
      this.initLevel();
      return;
    }

    const selected = remainingColors[Math.floor(Math.random() * remainingColors.length)];
    this.currentTargetColor = selected.id;
    this.ui.setTargetSwatch(selected.hex);
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

  handleInput(x, y) {
    if (this.isPaused) return;

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
    this.stopLoop();
    this.ui.setPauseLabel(true);
    this.ui.showPauseMenu();
  }

  resumeGame() {
    this.isPaused = false;
    this.ui.hidePauseMenu();
    this.ui.setPauseLabel(false);
    this.startLoop();
  }

  update() {
    this.ctx.fillStyle = BACKGROUND_COLOR;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.circles.forEach(circle => {
      circle.update(this.canvas);
      circle.draw(this.ctx);
    });

    this.frameId = requestAnimationFrame(this.update.bind(this));
  }
}
