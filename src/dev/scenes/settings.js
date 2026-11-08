import { DEV_VOLUME_STEP } from '../../config.js';
import { createSettings } from '../../settings.js';
import { createStorage, createSystemReducedMotion } from '../../storage.js';
import { createReadout } from '../readout.js';
import { button } from '../ui.js';

const ROWS = [
  'Reduce motion switch',
  'System Reduce motion',
  'Effective Reduce motion',
  'Music volume',
  'Effects volume',
  'Vibration',
  'Mute',
];
const onOff = (b) => (b ? 'on' : 'off');

// Mounts the scene and returns its read-only numbers for window.__pastelPopDev.
export default function mountSettingsScene(root) {
  const system = createSystemReducedMotion();
  const settings = createSettings({ storage: createStorage(), systemReducedMotion: system });
  const readout = createReadout(root, ROWS);
  const buttons = document.createElement('div');
  buttons.className = 'dev-buttons';
  root.append(buttons);

  function refresh() {
    readout.set(ROWS[0], onOff(settings.get('reduceMotion')));
    readout.set(ROWS[1], onOff(system.matches()));
    readout.set(ROWS[2], onOff(settings.effectiveReduceMotion()));
    readout.set(ROWS[3], settings.get('musicVolume').toFixed(2));
    readout.set(ROWS[4], settings.get('effectsVolume').toFixed(2));
    readout.set(ROWS[5], onOff(settings.get('vibration')));
    readout.set(ROWS[6], onOff(settings.get('muted')));
  }
  settings.subscribe(refresh);
  refresh();

  const toggle = (label, name) => button(label, () => settings.set(name, !settings.get(name)));
  const nudge = (label, name, delta) =>
    button(label, () => settings.set(name, Math.round((settings.get(name) + delta) * 100) / 100));
  buttons.append(
    toggle('Reduce motion', 'reduceMotion'),
    toggle('Vibration', 'vibration'),
    toggle('Mute', 'muted'),
    nudge('Music -', 'musicVolume', -DEV_VOLUME_STEP),
    nudge('Music +', 'musicVolume', DEV_VOLUME_STEP),
    nudge('Effects -', 'effectsVolume', -DEV_VOLUME_STEP),
    nudge('Effects +', 'effectsVolume', DEV_VOLUME_STEP),
  );

  return {
    get reduceMotion() {
      return settings.get('reduceMotion');
    },
    get effectiveReduceMotion() {
      return settings.effectiveReduceMotion();
    },
    get musicVolume() {
      return settings.get('musicVolume');
    },
    get effectsVolume() {
      return settings.get('effectsVolume');
    },
    get vibration() {
      return settings.get('vibration');
    },
    get muted() {
      return settings.get('muted');
    },
  };
}
