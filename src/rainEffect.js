// src/rainEffect.js

export function triggerRainSplash(x, y) {
  const container = document.getElementById('rain-container');
  if (!container) return;

  const rain = document.createElement('div');
  rain.className = 'rain';
  rain.style.left = `${x}px`;
  rain.style.top = `${y}px`;
  rain.style.position = 'absolute';
  rain.style.transform = 'translate(-50%, -50%) scale(1)';
  rain.style.zIndex = '10';

  rain.innerHTML = `
    <div class="drop"></div>
    <div class="waves"><div></div><div></div></div>
    <div class="splash"></div>
    <div class="particles">
      <div></div><div></div><div></div><div></div>
    </div>
  `;

  container.appendChild(rain);

  // Clean up after animation
  setTimeout(() => {
    rain.remove();
  }, 3000);
}
