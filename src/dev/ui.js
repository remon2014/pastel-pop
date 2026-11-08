// Shared by the dev scenes.
export const READOUT_MS = 250;

export function button(label, onClick) {
  const b = document.createElement('button');
  b.type = 'button';
  b.textContent = label;
  b.addEventListener('click', onClick);
  return b;
}
