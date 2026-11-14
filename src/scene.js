// The interim start scene (F-18): Dusk, moving circles from world.js, the target swatch, Pause. No levels, no score.
import {
  BACKGROUND_COLOR,
  CIRCLE_REFERENCE_WIDTH_DP,
  INTERIM_COLOURS,
  INTERIM_PER_COLOUR,
  INTERIM_SPEED_MULTIPLIER,
} from './config.js';
import { browserHost, createLoop } from './core/loop.js';
import { Hud } from './hud.js';
import { attachPointer } from './input/pointer.js';
import { findHit, minTapRadius } from './logic/hit.js';
import { colourCleared, pickColours, pickTarget, startRefill, stepRefill } from './logic/scene.js';
import { circleRadius, fitCircles, playAreaHeight, spawnCircle, speedFor, stepCircles } from './logic/world.js';
import { PALETTE } from './palette.js';
import { drawCircle } from './render/circle.js';
import { cssToWorld } from './render/view.js';

export class Scene {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.hud = new Hud();
    this.isPaused = false;
    this.loop = createLoop(this.update.bind(this), browserHost());
    this.circles = [];
    this.colours = [];
    this.target = null;
    this.refill = { refilling: false, wait: 0 };
    this.bounds = { width: 1, height: 1 };
    this.view = null;
    this.widthPixels = 0;

    this.hud.pauseBtn.addEventListener('click', () => this.togglePause());
    this.hud.continueBtn.addEventListener('click', () => this.resume());

    attachPointer(this.canvas, this.handleTap.bind(this));
  }

  // The colours are drawn once per Start and kept until Back.
  start() {
    this.hud.resetUI();
    this.isPaused = false;
    this.colours = pickColours(PALETTE, INTERIM_COLOURS, Math.random);
    this.circles = [];
    this.refill = { refilling: false, wait: 0 };
    this.syncBounds();
    for (const color of this.colours) for (let i = 0; i < INTERIM_PER_COLOUR; i++) this.addCircle(color);
    this.setTarget(pickTarget(this.circles, Math.random));
    this.loop.start();
  }

  stop() {
    this.loop.stop();
    this.isPaused = false;
    this.circles = [];
    this.hud.hidePauseMenu();
  }

  addCircle(color) {
    const radius = circleRadius(this.widthPixels || CIRCLE_REFERENCE_WIDTH_DP);
    const circle = spawnCircle(this.bounds, radius, speedFor(INTERIM_SPEED_MULTIPLIER), Math.random);
    circle.color = color;
    this.circles.push(circle);
    // The first circle to arrive in an empty scene decides the target.
    if (!this.target) this.setTarget(color);
  }

  setTarget(color) {
    this.target = color;
    this.hud.setTargetSwatch(color);
  }

  setView(view) {
    this.view = view;
    this.syncBounds();
    this.hud.layoutSwatch(view, circleRadius(view.playCssWidth));
    this.draw();
  }

  // The play area is 1 wide and as tall as the view. Resizing pulls circles back inside.
  syncBounds() {
    if (!this.view) return;
    const { playCssWidth, playCssHeight } = this.view;
    const height = playAreaHeight(playCssWidth, playCssHeight, this.bounds.height);
    if (height === this.bounds.height && playCssWidth === this.widthPixels) return;
    this.widthPixels = playCssWidth;
    this.bounds.height = height;
    const radius = circleRadius(playCssWidth);
    for (const circle of this.circles) circle.radius = radius;
    fitCircles(this.circles, this.bounds);
  }

  handleTap(cssX, cssY) {
    if (this.isPaused || !this.view || !this.target) return;
    const { x, y } = cssToWorld(this.view, cssX, cssY);
    const hit = findHit(this.circles, x, y, this.target.id, { minRadius: minTapRadius(this.view.playCssWidth) });
    if (hit?.color !== this.target) return;
    this.circles.splice(this.circles.indexOf(hit), 1);
    this.setTarget(pickTarget(this.circles, Math.random));
    if (colourCleared(this.circles, this.colours)) startRefill(this.refill);
  }

  togglePause() {
    if (this.isPaused) {
      this.resume();
      return;
    }
    this.isPaused = true;
    this.loop.stop();
    this.hud.setPauseLabel(true);
    this.hud.showPauseMenu();
  }

  resume() {
    this.isPaused = false;
    this.hud.hidePauseMenu();
    this.hud.setPauseLabel(false);
    this.loop.start();
  }

  update(elapsedSeconds) {
    if (!this.view) return;
    for (const color of stepRefill(this.refill, this.circles, this.colours, elapsedSeconds)) this.addCircle(color);
    stepCircles(this.circles, this.bounds, elapsedSeconds);
    this.draw();
  }

  // Resizing a canvas clears it, so this also runs on resize while paused.
  draw() {
    this.ctx.fillStyle = BACKGROUND_COLOR;
    this.ctx.fillRect(0, 0, this.view.internalWidth, this.view.internalHeight);
    for (const circle of this.circles) drawCircle(this.ctx, circle, this.view);
  }
}
