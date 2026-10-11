import { CREAM, DUSK, GLOW_1, GLOW_2 } from '../config.js';
import { parseDevQuery } from './sceneName.js';
import mountLoopScene from './scenes/loop.js';

// One line per scene: name, what it shows, and its mount function.
const SCENES = [
  { name: 'loop', title: 'Game loop: fps, elapsed, clamped frames, running loops', mount: mountLoopScene },
];

const STYLE = `
body{display:block;overflow:auto;height:auto;min-height:100vh;background:${DUSK};color:${CREAM}}
.dev-page{box-sizing:border-box;max-width:40rem;margin:0 auto;padding:16px;font-size:16px;line-height:1.4}
.dev-page a{color:${CREAM};display:block;padding:12px 0;min-height:44px;box-sizing:border-box}
.dev-readout{margin:0 0 12px;padding:8px 12px;background:${GLOW_1};border-radius:8px}
.dev-readout div{display:flex;justify-content:space-between;gap:12px;padding:2px 0}
.dev-readout dt,.dev-readout dd{margin:0}
.dev-readout dd{font-variant-numeric:tabular-nums}
.dev-canvas{display:block;width:100%;height:120px;border:1px solid ${GLOW_2};border-radius:8px;margin-bottom:12px}
.dev-buttons{display:flex;flex-wrap:wrap;gap:8px}
.dev-buttons button{min-width:44px;min-height:44px;padding:8px 16px;font:inherit;color:${CREAM};background:${GLOW_2};border:1px solid ${CREAM};border-radius:8px}
`;

function page() {
  const style = document.createElement('style');
  style.textContent = STYLE;
  document.head.append(style);
  const root = document.createElement('main');
  root.className = 'dev-page';
  document.body.replaceChildren(root);
  return root;
}

function heading(root, text) {
  const h = document.createElement('h1');
  h.textContent = text;
  h.style.fontSize = '1.25rem';
  root.append(h);
}

function showList(root, message) {
  heading(root, 'Dev scenes');
  if (message) {
    const p = document.createElement('p');
    p.textContent = message;
    root.append(p);
  }
  for (const scene of SCENES) {
    const a = document.createElement('a');
    a.href = `?dev=${scene.name}`;
    a.textContent = `${scene.name}: ${scene.title}`;
    root.append(a);
  }
}

// Called from main.js (development only). Returns true when the page was taken over.
export function startDev(search) {
  const query = parseDevQuery(
    search,
    SCENES.map((s) => s.name),
  );
  if (query.kind === 'off') return false;
  const root = page();
  if (query.kind === 'scene') {
    const scene = SCENES.find((s) => s.name === query.name);
    heading(root, scene.title);
    const numbers = scene.mount(root);
    Object.defineProperty(window, '__pastelPopDev', {
      value: Object.freeze({ [scene.name]: numbers }),
    });
    const back = document.createElement('a');
    back.href = '?dev';
    back.textContent = 'All dev scenes';
    root.append(back);
  } else {
    showList(root, query.kind === 'unknown' ? `No such scene: ${query.name}` : '');
  }
  return true;
}
