// circle.js
import { CIRCLE_OPACITY, CIRCLE_RADIUS } from './config.js';

export class Circle {
  constructor(x, y, color, dx, dy) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.radius = CIRCLE_RADIUS;
    this.dx = dx;
    this.dy = dy;
  }

  update(canvas) {
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
