// src/game.js
import { Circle } from './circle.js';
import { UIManager } from './uiManager.js';
import { ColorManager } from './colorManager.js';
import { ParticleManager } from './particle.js';
import { getDistance } from './utils.js';
import { CIRCLE_RADIUS } from './config.js';
import { BACKGROUND_COLOR } from './config.js';
import { maybeSaveHighScore } from './leaderboard.js';

export class Game {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.ui = new UIManager();
    this.ui.restartBtn.addEventListener('click', () => this.resetGame());
    this.colors = new ColorManager();
    this.particles = new ParticleManager();
    this.currentBackgroundColor = '#ffffff'; // start as white
    this.targetBackgroundColor = '#ffffff';
    this.backgroundTransitionStart = null;
    this.prevBackgroundColor = this.currentBackgroundColor;

    this.circles = [];
    this.level = 1;
    this.score = 0;
    this.highScore = localStorage.getItem('pastelPopHighScore') || 0;
    this.currentTargetColor = null;
    this.gameOver = false;
    this.startTime = Date.now();

    this.canvas.addEventListener('click', this.handleClick.bind(this));
    this.canvas.addEventListener('touchstart', this.handleTouch.bind(this));
  }

  start() {
    this.initLevel();
    this.update();
  }
  resetGame() {
    this.level = 1;
    this.score = 0;
    this.gameOver = false;
    this.startTime = Date.now();
    this.ui.gameOverText.style.display = 'none';
    this.ui.restartBtn.style.display = 'none';
    this.ui.backToMenuBtn.style.display = 'none'; // 👈 Hide Main Menu button
    this.particles.clear();
    this.initLevel();
    this.update(); // resume the loop
  }


  initLevel() {
    this.circles = [];
    const numCircles = 5 + this.level * 2;
    const usedColors = this.colors.getUsedColors(this.level);
    const speed = 2 + this.level * 0.5;

    for (let i = 0; i < numCircles; i++) {
      const color = usedColors[Math.floor(Math.random() * usedColors.length)];

      // Target position for where the circle will land
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
    const remainingColors = [...new Set(this.circles.map(c => c.color.name))];
    if (remainingColors.length === 0) {
      const timeBonus = Math.max(0, 1000 - (Date.now() - this.startTime)) / 100;
      this.score += Math.floor(10 * this.level + timeBonus);
      this.level++;
      this.initLevel();
    } else {
      const selectedName = remainingColors[Math.floor(Math.random() * remainingColors.length)];
      this.currentTargetColor = selectedName;

      // Find the hex value for that name
      const selectedColor = this.colors.colors.find(c => c.name === selectedName);

      // Update just the coloured word
      if (selectedColor) {
        this.ui.targetColorName.textContent = selectedColor.name;
        this.ui.targetColorName.style.color = selectedColor.hex;

        // ✅ Trigger pale background transition
        const pale = this.getPaleHex(selectedColor.hex);
        this.fadeToBackgroundColor(pale);
      }
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
     console.log('Input received'); // 🔍 Add this
    if (this.gameOver) return;

    for (let i = this.circles.length - 1; i >= 0; i--) {
      const circle = this.circles[i];

      if (getDistance(x, y, circle.x, circle.y) <= circle.radius) {
        console.log('Clicked:', circle.color.name);
        console.log('Target:', this.currentTargetColor);

        if (circle.color.name === this.currentTargetColor) {
          console.log('✅ Correct circle clicked');
          this.particles.createRipple(circle.x, circle.y, circle.color.hex); // ✅ use .hex
          console.log('Ripple triggered!');
          this.circles.splice(i, 1);
          this.score += 5;
          this.selectNewTargetColor();
        } else {
          console.log('❌ Wrong circle clicked — should trigger game over');
          this.particles.createGlitch(circle.x, circle.y);
          this.gameOver = true;

          maybeSaveHighScore(this.score);

          // 💥 Screen shake
            this.canvas.classList.add('shake');
            setTimeout(() => {
              this.canvas.classList.remove('shake');
            }, 400);

          this.ui.showGameOver();

          if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('pastelPopHighScore', this.highScore);
          }
          this.ui.showGameOver();
          this.ui.update(this.level, this.score, this.highScore, this.currentTargetColor);
        }

        this.ui.update(this.level, this.score, this.highScore, this.currentTargetColor);
        return;
      }
    }
  }

  fadeToBackgroundColor(newHex) {
    if (newHex.toLowerCase() === this.currentBackgroundColor.toLowerCase()) return;
    this.prevBackgroundColor = this.currentBackgroundColor;
    this.targetBackgroundColor = newHex;
    this.backgroundTransitionStart = performance.now();
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
    return this.rgbToHex(paleR, paleG, paleB); // return #hex instead of rgb(...)
  }

  rgbToHex(r, g, b) {
  return (
    "#" +
    [r, g, b]
      .map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? "0" + hex : hex;
      })
      .join("")
  );
}

  update() {
    if (this.gameOver) return;

    const now = performance.now();
    const transitionDuration = 1000; // 1 second
    let bgColor = this.currentBackgroundColor;

    // Only animate if a transition is in progress
    if (this.backgroundTransitionStart) {
      const progress = Math.min((now - this.backgroundTransitionStart) / transitionDuration, 1);
      const eased = 0.5 - 0.5 * Math.cos(Math.PI * progress); // cosine ease-in-out

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

}
