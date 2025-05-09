// circle.js
import { CIRCLE_OPACITY, CIRCLE_RADIUS } from './config.js';

export class Circle {
  constructor(targetX, targetY, color, dx, dy, canvasWidth, canvasHeight) {
    // Final destination once animation completes
    this.targetX = targetX;
    this.targetY = targetY;
    this.color = color;
    this.radius = CIRCLE_RADIUS;
    this.dx = dx;
    this.dy = dy;

    // Assign off-screen start position
    const edge = Math.floor(Math.random() * 4); // 0 = top, 1 = right, 2 = bottom, 3 = left
    switch (edge) {
      case 0: // top
        this.x = targetX;
        this.y = -100;
        break;
      case 1: // right
        this.x = canvasWidth + 100;
        this.y = targetY;
        break;
      case 2: // bottom
        this.x = targetX;
        this.y = canvasHeight + 100;
        break;
      case 3: // left
        this.x = -100;
        this.y = targetY;
        break;
    }
    // ✨ Staggered entrance
    this.entering = true;
    this.enterDelay = Math.random() * 150; // was 300
    this.enterStart = null;
    this.enterSpeed = 0.08 + Math.random() * 0.04; // was 0.05–0.1
  }

  animateIn() {
    const lerp = (start, end, amt) => start + (end - start) * amt;

    this.x = lerp(this.x, this.targetX, 0.1);
    this.y = lerp(this.y, this.targetY, 0.1);

    const arrived = Math.abs(this.x - this.targetX) < 1 && Math.abs(this.y - this.targetY) < 1;
    if (arrived) {
      this.x = this.targetX;
      this.y = this.targetY;
      this.entering = false;
    }
  }

  update(canvas) {
    if (this.entering) {
      this.animateIn();
      return;
    }

    this.x += this.dx;
    this.y += this.dy;

    if (this.x - this.radius < 0 || this.x + this.radius > canvas.width) {
      this.dx = -this.dx;
    }
    if (this.y - this.radius < 0 || this.y + this.radius > canvas.height) {
      this.dy = -this.dy;
    }
  }

  draw(ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color.hex;
    ctx.globalAlpha = CIRCLE_OPACITY;
    ctx.fill();

    // Optional soft outline
    ctx.globalAlpha = 0.1;
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.closePath();
    ctx.globalAlpha = 1;
  }
}
