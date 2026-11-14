import { createAudio } from '../../effects/audio.js';
import { attachPointer } from '../../input/pointer.js';
import { createSettings } from '../../settings.js';
import { createStorage, createSystemReducedMotion } from '../../storage.js';
import { createReadout } from '../readout.js';
import { button, READOUT_MS } from '../ui.js';

const START_RATE = 10;
const FINGERS = 3;
const FIRST_POINTER_ID = 300;
const METER_MS = 20;
const SLIDER_STEPS = 100;
const PAD_HEIGHT = 120;
const ROWS = [
  'Sound enabled (after first tap)',
  'Audio context',
  'Sounds playing / highest',
  'Music gain (fade)',
  'Music slider / bus gain (target)',
  'Effects slider / bus gain (target)',
  'Muted',
  'Reduce motion (no effect on sound)',
  'Master peak dBFS (held since reset)',
  'Pop peak dBFS (last single pop)',
  'Wrong-tap peak dBFS (last single)',
  'Pad taps / sounds played',
  'Auto-tapper',
];
const onOff = (b) => (b ? 'on' : 'off');
const toDb = (linear) => (linear > 0 ? 20 * Math.log10(linear) : Number.NEGATIVE_INFINITY);
const fmtDb = (db) => (Number.isFinite(db) ? db.toFixed(1) : '-inf');

// Mounts the scene and returns its read-only numbers for window.__pastelPopDev.
// A tap pad (real attachPointer) plays a pop per tap; buttons start music and play single sounds.
export default function mountAudioScene(root) {
  const settings = createSettings({
    storage: createStorage(),
    systemReducedMotion: createSystemReducedMotion(),
  });
  const audio = createAudio(settings);
  const readout = createReadout(root, ROWS);
  const pad = document.createElement('canvas');
  pad.className = 'dev-canvas';
  pad.style.height = `${PAD_HEIGHT}px`;
  pad.style.touchAction = 'none';
  const buttons = document.createElement('div');
  buttons.className = 'dev-buttons';
  const sliders = document.createElement('div');
  root.append(pad, buttons, sliders);

  let timer = null;
  let highestPlaying = 0;
  let padTaps = 0;
  let played = 0;
  let popPeak = 0;
  let wrongPeak = 0;

  // The first real tap anywhere on the page enables sound, from inside the pointerdown.
  window.addEventListener('pointerdown', () => audio.unlock(), { capture: true });

  const play = (kind, form) => {
    if (audio.playEffect(kind, form)) played++;
  };
  attachPointer(pad, () => {
    padTaps++;
    play('pop', 'full');
  });

  function autoTap() {
    const rect = pad.getBoundingClientRect();
    for (let i = 0; i < FINGERS; i++) {
      pad.dispatchEvent(
        new PointerEvent('pointerdown', {
          pointerId: FIRST_POINTER_ID + i,
          pointerType: 'touch',
          isPrimary: i === 0,
          button: 0,
          bubbles: true,
          clientX: rect.left + rect.width * ((i + 1) / (FINGERS + 1)),
          clientY: rect.top + rect.height / 2,
        }),
      );
    }
  }

  // Plays one sound alone and keeps its peak, so the stress peak can be compared with a single tap.
  function measureSingle(kind) {
    audio.resetPeak();
    play(kind, 'full');
    const stop = Date.now() + 500;
    const id = setInterval(() => {
      audio.measure();
      if (Date.now() > stop) {
        clearInterval(id);
        if (kind === 'pop') popPeak = audio.peak();
        else wrongPeak = audio.peak();
        refresh();
      }
    }, METER_MS);
  }

  const musicButton = button('Start music', () => {
    if (audio.numbers().musicGain > 0 || musicOn) {
      musicOn = false;
      audio.stopMusic();
    } else {
      musicOn = true;
      audio.startMusic();
    }
    refresh();
  });
  let musicOn = false;
  const muteButton = button('', () => settings.set('muted', !settings.get('muted')));
  const tapButton = button('', () => {
    if (timer === null) timer = setInterval(autoTap, 1000 / START_RATE);
    else {
      clearInterval(timer);
      timer = null;
    }
    refresh();
  });
  const reduceButton = button('', () => settings.set('reduceMotion', !settings.get('reduceMotion')));
  buttons.append(
    musicButton,
    muteButton,
    tapButton,
    reduceButton,
    button('Play pop', () => play('pop', 'full')),
    button('Play wrong tap', () => play('wobble', 'full')),
    button('Ignored tap (silent)', () => play('wobble', 'ignored')),
    button('Refused (silent)', () => play('pop', 'refused')),
    button('Measure single pop', () => measureSingle('pop')),
    button('Measure single wrong tap', () => measureSingle('wobble')),
    button('Reset peaks', () => {
      audio.resetPeak();
      highestPlaying = 0;
      popPeak = 0;
      wrongPeak = 0;
    }),
  );

  function slider(label, name) {
    const wrap = document.createElement('label');
    wrap.style.display = 'block';
    wrap.textContent = `${label} `;
    const input = document.createElement('input');
    input.type = 'range';
    input.min = '0';
    input.max = String(SLIDER_STEPS);
    input.value = String(Math.round(settings.get(name) * SLIDER_STEPS));
    input.style.cssText = 'width:100%;min-height:48px';
    input.setAttribute('aria-label', label);
    input.addEventListener('input', () => settings.set(name, Number(input.value) / SLIDER_STEPS));
    wrap.append(input);
    sliders.append(wrap);
  }
  slider('Music volume', 'musicVolume');
  slider('Effects volume', 'effectsVolume');

  function refresh() {
    const n = audio.numbers();
    muteButton.textContent = `Mute: ${onOff(settings.get('muted'))}`;
    tapButton.textContent = `Auto-tapper (${START_RATE}/s x ${FINGERS}): ${onOff(timer !== null)}`;
    reduceButton.textContent = `Reduce motion switch: ${onOff(settings.get('reduceMotion'))}`;
    musicButton.textContent = musicOn ? 'Stop music' : 'Start music';
    readout.set(ROWS[0], n.unlocked ? 'yes' : 'no: tap once');
    readout.set(ROWS[1], n.state);
    readout.set(ROWS[2], `${n.soundsPlaying} / ${highestPlaying}`);
    readout.set(ROWS[3], n.musicGain.toFixed(3));
    readout.set(ROWS[4], `${settings.get('musicVolume').toFixed(2)} / ${n.musicBusGain.toFixed(3)}`);
    readout.set(ROWS[5], `${settings.get('effectsVolume').toFixed(2)} / ${n.effectsBusGain.toFixed(3)}`);
    readout.set(ROWS[6], onOff(settings.get('muted')));
    readout.set(ROWS[7], onOff(settings.effectiveReduceMotion()));
    readout.set(ROWS[8], fmtDb(toDb(audio.peak())));
    readout.set(ROWS[9], fmtDb(toDb(popPeak)));
    readout.set(ROWS[10], fmtDb(toDb(wrongPeak)));
    readout.set(ROWS[11], `${padTaps} / ${played}`);
    readout.set(ROWS[12], timer === null ? 'off' : `${START_RATE}/s x ${FINGERS} fingers`);
  }
  settings.subscribe(refresh);
  setInterval(() => {
    audio.measure();
    highestPlaying = Math.max(highestPlaying, audio.numbers().soundsPlaying);
  }, METER_MS);
  setInterval(refresh, READOUT_MS);
  refresh();

  return {
    get unlocked() {
      return audio.numbers().unlocked;
    },
    get state() {
      return audio.numbers().state;
    },
    get soundsPlaying() {
      return audio.numbers().soundsPlaying;
    },
    get highestSoundsPlaying() {
      return highestPlaying;
    },
    get musicGain() {
      return audio.numbers().musicGain;
    },
    get musicBusGain() {
      return audio.numbers().musicBusGain;
    },
    get effectsBusGain() {
      return audio.numbers().effectsBusGain;
    },
    get muted() {
      return settings.get('muted');
    },
    get peak() {
      return audio.peak();
    },
    get peakDb() {
      return toDb(audio.peak());
    },
    get popPeak() {
      return popPeak;
    },
    get wrongPeak() {
      return wrongPeak;
    },
    get played() {
      return played;
    },
  };
}
