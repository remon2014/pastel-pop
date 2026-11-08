// Every pointerdown on the canvas is its own tap, so each finger counts at its own position.
// Taps on HUD controls never arrive: they are separate elements, not children of the canvas.
// Calls onTap(cssX, cssY) with the position relative to the canvas's top-left. Returns a detach function.
export function attachPointer(canvas, onTap) {
  function onPointerDown(event) {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    const rect = canvas.getBoundingClientRect();
    onTap(event.clientX - rect.left, event.clientY - rect.top);
  }
  canvas.addEventListener('pointerdown', onPointerDown);
  return () => canvas.removeEventListener('pointerdown', onPointerDown);
}
