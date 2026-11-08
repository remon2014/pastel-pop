import { DEFAULT_SETTINGS, SETTINGS_KEY, SETTINGS_VERSION } from './config.js';

const clamp01 = (n) => Math.min(1, Math.max(0, n));

function pickBoolean(value, fallback) {
  return typeof value === 'boolean' ? value : fallback;
}

function pickVolume(value, fallback) {
  return typeof value === 'number' && Number.isFinite(value) ? clamp01(value) : fallback;
}

// Turns stored text into settings; any unreadable part falls back to its default.
export function parseSettings(text) {
  let data = null;
  try {
    data = JSON.parse(text);
  } catch {
    data = null;
  }
  const d = DEFAULT_SETTINGS;
  if (!data || typeof data !== 'object' || data.version !== SETTINGS_VERSION) return { ...d };
  return {
    reduceMotion: pickBoolean(data.reduceMotion, d.reduceMotion),
    vibration: pickBoolean(data.vibration, d.vibration),
    muted: pickBoolean(data.muted, d.muted),
    musicVolume: pickVolume(data.musicVolume, d.musicVolume),
    effectsVolume: pickVolume(data.effectsVolume, d.effectsVolume),
  };
}

// storage: { get(key), set(key, text) }. systemReducedMotion: { matches(), subscribe(fn) -> unsubscribe }.
// Read once at start and kept in memory; only the five settings are written.
export function createSettings({ storage, systemReducedMotion }) {
  const values = parseSettings(storage.get(SETTINGS_KEY));
  const subscribers = new Set();

  const effectiveReduceMotion = () => values.reduceMotion || systemReducedMotion.matches();

  function notify() {
    const reduceMotion = effectiveReduceMotion();
    for (const fn of [...subscribers]) fn(reduceMotion);
  }

  function set(name, value) {
    if (!(name in DEFAULT_SETTINGS)) return;
    const next =
      typeof DEFAULT_SETTINGS[name] === 'boolean' ? pickBoolean(value, values[name]) : pickVolume(value, values[name]);
    values[name] = next;
    storage.set(SETTINGS_KEY, JSON.stringify({ version: SETTINGS_VERSION, ...values }));
    notify();
  }

  systemReducedMotion.subscribe(notify);

  return {
    get: (name) => values[name],
    set,
    effectiveReduceMotion,
    subscribe(fn) {
      subscribers.add(fn);
      return () => subscribers.delete(fn);
    },
  };
}
