import { Circle } from './circle.js';
import { UIManager } from './uiManager.js';
import { ColorManager } from './colorManager.js';
import { ParticleManager } from './particle.js';
import { getDistance } from './utils.js';
import { CIRCLE_RADIUS } from './config.js';
import { maybeSaveHighScore } from './leaderboard.js';
import { GAME_MODES } from './gameModes.js';

export class Game {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.ui = new UIManager();
    this.colors = new ColorManager();
    this.particles = new ParticleManager();

    this.currentBackgroundColor = '#ffffff';
    this.targetBackgroundColor = '#ffffff';
    this.backgroundTransitionStart = null;
    this.prevBackgroundColor = '#ffffff';
    this.transitionDuration = 1000;

    this.selectedMode = 'classic';
    this.modeConfig = GAME_MODES[this.selectedMode];

    this.level = 1;
    this.score = 0;
    this.highScore = localStorage.getItem('pastelPopHighScore') || 0;
    this.currentTargetColor = null;
    this.gameOver = false;
    this.isPaused = false;
    this.startTime = Date.now();
    this.circles = [];

    // Event listeners
    this.ui.pauseBtn.addEventListener('click', () => this.togglePause());
    this.ui.continueBtn.addEventListener('click', () => this.resumeGame());
    this.ui.changeModeBtn.addEventListener('click', () => this.changeModeFromPause());
    this.ui.backToMainBtn.addEventListener('click', () => window.location.reload());

    this.canvas.addEventListener('click', this.handleClick.bind(this));
    this.canvas.addEventListener('touchstart', this.handleTouch.bind(this));
  }

  start() {
    this.ui.resetUI();
    this.particles.clear();
    this.level = 1;
    this.score = 0;
    this.gameOver = false;
    this.isPaused = false;
    this.startTime = Date.now();

    const modeDropdown = document.getElementById('modeSelect');
    if (modeDropdown) {
      this.selectedMode = modeDropdown.value;
      this.modeConfig = GAME_MODES[this.selectedMode];
      this.colors.colors = this.colors.getUsedColors(this.level, this.modeConfig.palette);
    }

    this.initLevel();
    this.update();
  }

  resetGame() {
    this.ui.resetUI();
    this.particles.clear();
    this.level = 1;
    this.score = 0;
    this.gameOver = false;
    this.isPaused = false;
    this.startTime = Date.now();

    this.initLevel();
    this.update();
  }

  initLevel() {
    this.circles = [];
    const usedColors = this.colors.getUsedColors(this.level, this.modeConfig.palette);
    if (!usedColors || usedColors.length === 0) {
      console.error('❌ No usable colors in current palette. Aborting level init.');
      return;
    }

    const numCircles = 5 + this.level * 2;
    const speed = this.modeConfig.baseSpeed + this.level * this.modeConfig.speedMultiplier;

    for (let i = 0; i < numCircles; i++) {
      const color = usedColors[Math.floor(Math.random() * usedColors.length)];
      const targetX = Math.random() * (this.canvas.width - CIRCLE_RADIUS * 2) + CIRCLE_RADIUS;
      const targetY = Math.random() * (this.canvas.height - CIRCLE_RADIUS * 2) + CIRCLE_RADIUS;

      this.circles.push(new Circle(
        targetX,
        targetY,
        color,
        (Math.random() - 0.5) * speed,
        (Math.random() - 0.5) * speed,
        this.canvas.width,
        this.canvas.height
      ));
    }

    this.selectNewTargetColor();
    this.startTime = Date.now();
  }

  selectNewTargetColor() {
    const remainingColors = [...new Set(this.circles.map(c => c?.color?.name).filter(Boolean))];
    if (remainingColors.length === 0) {
      const timeBonus = Math.max(0, 1000 - (Date.now() - this.startTime)) / 100;
      this.score += Math.floor(10 * this.level + timeBonus);
      this.level++;
      this.initLevel();
      return;
    }

    const selectedName = remainingColors[Math.floor(Math.random() * remainingColors.length)];
    this.currentTargetColor = selectedName;

    const usedColors = this.colors.getUsedColors(this.level, this.modeConfig.palette);
    const selectedColor = usedColors.find(c => c.name === selectedName);
    if (selectedColor) {
      this.ui.targetColorName.textContent = selectedColor.name;
      this.ui.targetColorName.style.color = selectedColor.hex;
      const pale = this.getPaleHex(selectedColor.hex);
      this.fadeToBackgroundColor(pale);
    }

    this.ui.update(this.level, this.score, this.highScore, this.currentTargetColor);
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
    if (this.gameOver || this.isPaused) return;

    for (let i = this.circles.length - 1; i >= 0; i--) {
      const circle = this.circles[i];
      if (getDistance(x, y, circle.x, circle.y) <= circle.radius) {
        if (circle.color.name === this.currentTargetColor) {
          this.particles.createRipple(circle.x, circle.y, circle.color.hex);
          this.circles.splice(i, 1);
          this.score += 5;
          this.selectNewTargetColor();
        } else {
          this.particles.createGlitch(circle.x, circle.y);
          this.gameOver = true;
          this.canvas.classList.add('shake');
          setTimeout(() => {
            this.canvas.classList.remove('shake');
            maybeSaveHighScore(this.score);
          }, 400);
          if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('pastelPopHighScore', this.highScore);
          }
          this.ui.showGameOver();
        }
        this.ui.update(this.level, this.score, this.highScore, this.currentTargetColor);
        return;
      }
    }
  }

  togglePause() {
    this.isPaused = !this.isPaused;
    this.ui.setPauseLabel(this.isPaused);
    if (this.isPaused) {
      this.ui.showPauseMenu();
    } else {
      this.ui.hidePauseMenu();
      this.update();
    }
  }

  resumeGame() {
    this.isPaused = false;
    this.ui.hidePauseMenu();
    this.ui.setPauseLabel(false);
    this.update();
  }

  changeModeFromPause() {
    const dropdown = document.getElementById('modeSelectPause');
    const newMode = dropdown.value;

    this.selectedMode = newMode;
    this.modeConfig = GAME_MODES[this.selectedMode];

    this.level = 1;
    this.score = 0;
    this.gameOver = false;
    this.isPaused = false;

    this.ui.resetUI();
    this.particles.clear();
    this.colors.colors = this.colors.getUsedColors(this.level, this.modeConfig.palette);

    this.initLevel();
    this.update();
  }


  update() {
    if (this.gameOver || this.isPaused) return;

    const now = performance.now();
    const transitionDuration = 1000;

    this.updateBackgroundTransition();
    let bgColor = this.currentBackgroundColor;

    if (this.backgroundTransitionStart) {
      const progress = Math.min((now - this.backgroundTransitionStart) / transitionDuration, 1);
      const eased = 0.5 - 0.5 * Math.cos(Math.PI * progress);
      const from = this.hexToRgb(this.currentBackgroundColor);
      const to = this.hexToRgb(this.targetBackgroundColor);
      const r = Math.round(from.r + (to.r - from.r) * eased);
      const g = Math.round(from.g + (to.g - from.g) * eased);
      const b = Math.round(from.b + (to.b - from.b) * eased);
      bgColor = `rgb(${r}, ${g}, ${b})`;
      if (progress >= 1) {
        this.currentBackgroundColor = this.targetBackgroundColor;
        this.backgroundTransitionStart = null;
      }
    }

    this.ctx.fillStyle = bgColor;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.particles.update();
    this.particles.draw(this.ctx);

    this.circles.forEach(circle => {
      circle.update(this.canvas, performance.now());
      circle.draw(this.ctx);
    });

    requestAnimationFrame(this.update.bind(this));
  }

  fadeToBackgroundColor(newHex) {
    if (newHex.toLowerCase() === this.currentBackgroundColor.toLowerCase()) return;
    this.prevBackgroundColor = this.currentBackgroundColor;
    this.targetBackgroundColor = newHex;
    this.backgroundTransitionStart = performance.now();
  }

  updateBackgroundTransition() {
    if (this.backgroundTransitionStart === null) return;
    const now = performance.now();
    const elapsed = now - this.backgroundTransitionStart;
    const t = Math.min(elapsed / this.transitionDuration, 1);
    this.currentBackgroundColor = this.lerpColor(this.prevBackgroundColor, this.targetBackgroundColor, t);
    if (t >= 1) {
      this.backgroundTransitionStart = null;
    }
  }

  lerpColor(a, b, t) {
    const ar = parseInt(a.slice(1, 3), 16);
    const ag = parseInt(a.slice(3, 5), 16);
    const ab = parseInt(a.slice(5, 7), 16);
    const br = parseInt(b.slice(1, 3), 16);
    const bg = parseInt(b.slice(3, 5), 16);
    const bb = parseInt(b.slice(5, 7), 16);
    return `#${[
      Math.round(ar + (br - ar) * t).toString(16).padStart(2, '0'),
      Math.round(ag + (bg - ag) * t).toString(16).padStart(2, '0'),
      Math.round(ab + (bb - ab) * t).toString(16).padStart(2, '0')
    ].join('')}`;
  }

  hexToRgb(hex) {
    const bigint = parseInt(hex.replace('#', ''), 16);
    return {
      r: (bigint >> 16) & 255,
      g: (bigint >> 8) & 255,
      b: bigint & 255
    };
  }

  getPaleHex(hex) {
    const { r, g, b } = this.hexToRgb(hex);
    const paleR = Math.round(r + (255 - r) * 0.7);
    const paleG = Math.round(g + (255 - g) * 0.7);
    const paleB = Math.round(b + (255 - b) * 0.7);
    return this.rgbToHex(paleR, paleG, paleB);
  }

  rgbToHex(r, g, b) {
    return (
      "#" + [r, g, b]
        .map(x => {
          const hex = x.toString(16);
          return hex.length === 1 ? "0" + hex : hex;
        })
        .join("")
    );
  }
}
