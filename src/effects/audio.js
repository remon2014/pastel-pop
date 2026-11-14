// The only file that touches Web Audio (D-005). Plays what voices.js decides: placeholder tones from the
// TONES table, a placeholder music drone, two buses, one master gain, limiter and ceiling. No audio files.
import {
  BUS_RAMP_SECONDS,
  CEILING_DBFS,
  DUCK_RAMP_SECONDS,
  EFFECT_QUICK_RELEASE_SECONDS,
  LIMITER,
  MASTER_GAIN,
  MUSIC_FADE_IN_RETURN_SECONDS,
  MUSIC_FADE_IN_SECONDS,
  MUSIC_FADE_OUT_SECONDS,
  MUSIC_TONE,
  TONES,
  VOICE_BUDGET_TIMES_POP,
} from '../config.js';
import {
  busGain,
  createMerger,
  createRmsWindow,
  createVoices,
  duckFactor,
  envelopeGain,
  limiterTrim,
  pickNote,
  ramp,
  soundFor,
} from './voices.js';

const CEILING_CURVE_POINTS = 2049;
const STOP_MARGIN_SECONDS = 0.02;
const CEILING_HIT_FRACTION = 0.999;

function ceilingCurve() {
  const ceiling = 10 ** (CEILING_DBFS / 20);
  const curve = new Float32Array(CEILING_CURVE_POINTS);
  for (let i = 0; i < CEILING_CURVE_POINTS; i++) {
    const x = (i / (CEILING_CURVE_POINTS - 1)) * 2 - 1;
    curve[i] = Math.max(-ceiling, Math.min(ceiling, x));
  }
  return curve;
}

// Moves a gain parameter from where it is to `target` over `seconds`, with no jump.
function glide(param, target, now, seconds) {
  param.cancelScheduledValues(now);
  param.setValueAtTime(param.value, now);
  param.linearRampToValueAtTime(target, now + seconds);
}

// settings: the F-13 settings object. The context is made or resumed only inside unlock(), which the
// caller runs from a pointerdown. Nothing plays before that.
export function createAudio(settings, { doc = document, random = Math.random } = {}) {
  const voices = createVoices();
  const merger = createMerger();
  const rmsWindow = createRmsWindow();
  let rmsHold = 0;
  let lastMeasure = 0;
  const playing = new Map();
  const lastNote = {};
  let ctx = null;
  let nodes = null;
  let music = null;
  let musicWanted = false;
  let sequence = 0;
  let peakHold = 0;
  let ceilingReads = 0;
  let samples = null;
  // A gain node with nothing playing into it does not update its readable value, so the readout shows the target.
  const busTarget = { effects: 0, music: 0 };

  const usable = () => ctx !== null && ctx.state === 'running' && !doc.hidden;

  function build() {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    const master = ctx.createGain();
    master.gain.value = MASTER_GAIN;
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = LIMITER.thresholdDb;
    limiter.knee.value = LIMITER.knee;
    limiter.ratio.value = LIMITER.ratio;
    limiter.attack.value = LIMITER.attack;
    limiter.release.value = LIMITER.release;
    const trim = ctx.createGain();
    trim.gain.value = limiterTrim(LIMITER);
    const ceiling = ctx.createWaveShaper();
    ceiling.curve = ceilingCurve();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    samples = new Float32Array(analyser.fftSize);
    const effectsBus = ctx.createGain();
    const musicBus = ctx.createGain();
    effectsBus.connect(master);
    musicBus.connect(master);
    master.connect(limiter).connect(trim).connect(ceiling).connect(analyser).connect(ctx.destination);
    nodes = { effectsBus, musicBus, analyser };
    applyBuses(0);
  }

  function applyBuses(seconds = BUS_RAMP_SECONDS) {
    if (!nodes) return;
    const muted = settings.get('muted');
    busTarget.effects = busGain(settings.get('effectsVolume'), muted);
    busTarget.music = busGain(settings.get('musicVolume'), muted);
    glide(nodes.effectsBus.gain, busTarget.effects, ctx.currentTime, seconds);
    glide(nodes.musicBus.gain, busTarget.music, ctx.currentTime, seconds);
  }
  settings.subscribe(() => applyBuses());

  function stopVoice(id, seconds) {
    const voice = playing.get(id);
    if (!voice) return;
    playing.delete(id);
    const now = ctx.currentTime;
    const level = voice.level * envelopeGain(now - voice.start, voice.envelope);
    voice.gain.gain.cancelScheduledValues(now);
    voice.gain.gain.setValueAtTime(level, now);
    voice.gain.gain.linearRampToValueAtTime(0, now + seconds);
    voice.osc.stop(now + seconds + STOP_MARGIN_SECONDS);
  }

  // Level a sounding voice counts for, from its fade-in onward (a sound that just began counts in full), with its duck.
  const countedLevel = (now) => (v) => v.level * v.duck * ramp(v.envelope.total - (now - v.start), v.envelope.fadeOut);

  // Lowers the sounds already playing so they plus the new sound fit the budget. Glides, so it never clicks.
  function duckPlaying(newLevel, now) {
    const sounding = [...playing.values()];
    const factor = duckFactor({
      newLevel,
      budget: VOICE_BUDGET_TIMES_POP * TONES.pop.level,
      sounding: sounding.map(countedLevel(now)),
    });
    if (factor >= 1) return;
    for (const voice of sounding) {
      voice.duck *= factor;
      glide(voice.duckGain.gain, voice.duck, now, DUCK_RAMP_SECONDS);
    }
  }

  function dropAllVoices() {
    for (const id of [...playing.keys()]) {
      const voice = playing.get(id);
      playing.delete(id);
      voice.osc.stop();
    }
    voices.clear();
    merger.clear();
  }

  // Plays the sound for an effect request's kind and the layer's answer form. Silent forms, a hidden page or a
  // context that is not running drop the sound; nothing is queued.
  function playEffect(kind, form) {
    const name = soundFor(kind, form);
    if (name === null || !usable()) return false;
    const tone = TONES[name];
    const now = ctx.currentTime;
    if (!merger.accept(name, now)) return false;
    const id = `v${sequence++}`;
    const replaced = voices.start(id, now, tone.seconds);
    if (replaced !== null) stopVoice(replaced, EFFECT_QUICK_RELEASE_SECONDS);
    const level = tone.level;
    duckPlaying(level, now);
    const picked = pickNote(tone.notes, lastNote[name] ?? null, random);
    lastNote[name] = picked;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = tone.wave;
    osc.frequency.value = picked.note;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(level, now + tone.fadeIn);
    gain.gain.setValueAtTime(level, now + tone.seconds - tone.fadeOut);
    gain.gain.linearRampToValueAtTime(0, now + tone.seconds);
    const duckGain = ctx.createGain();
    osc.connect(gain).connect(duckGain).connect(nodes.effectsBus);
    osc.start(now);
    osc.stop(now + tone.seconds + STOP_MARGIN_SECONDS);
    osc.onended = () => {
      duckGain.disconnect();
      playing.delete(id);
    };
    playing.set(id, {
      osc,
      gain,
      duckGain,
      duck: 1,
      level,
      start: now,
      envelope: { fadeIn: tone.fadeIn, total: tone.seconds, fadeOut: tone.fadeOut },
    });
    return true;
  }

  function fadeMusicTo(target, seconds) {
    glide(music.fade.gain, target, ctx.currentTime, seconds);
  }

  function beginMusic(seconds) {
    if (!usable()) return;
    if (!music) {
      const fade = ctx.createGain();
      fade.gain.value = 0;
      fade.connect(nodes.musicBus);
      const oscs = MUSIC_TONE.notes.map((hz) => {
        const osc = ctx.createOscillator();
        const part = ctx.createGain();
        osc.type = MUSIC_TONE.wave;
        osc.frequency.value = hz;
        part.gain.value = MUSIC_TONE.level / MUSIC_TONE.notes.length;
        osc.connect(part).connect(fade);
        osc.start();
        return osc;
      });
      music = { fade, oscs };
    }
    fadeMusicTo(1, seconds);
  }

  function silenceMusicNow() {
    if (!music) return;
    music.fade.gain.cancelScheduledValues(ctx.currentTime);
    music.fade.gain.setValueAtTime(0, ctx.currentTime);
  }

  function onVisibility() {
    if (!ctx) return;
    if (doc.hidden) {
      dropAllVoices();
      silenceMusicNow();
      ctx.suspend();
    } else {
      ctx.resume().then(() => {
        if (musicWanted) beginMusic(MUSIC_FADE_IN_RETURN_SECONDS);
      });
    }
  }
  doc.addEventListener('visibilitychange', onVisibility);

  return {
    // Run inside the first pointerdown: creates or resumes the context, then starts music if it was asked for.
    unlock() {
      if (doc.hidden) return;
      if (!ctx) build();
      ctx.resume().then(() => {
        if (musicWanted && !music) beginMusic(MUSIC_FADE_IN_SECONDS);
      });
    },
    playEffect,
    startMusic() {
      musicWanted = true;
      if (music) fadeMusicTo(1, MUSIC_FADE_IN_SECONDS);
      else beginMusic(MUSIC_FADE_IN_SECONDS);
    },
    stopMusic() {
      musicWanted = false;
      if (music) fadeMusicTo(0, MUSIC_FADE_OUT_SECONDS);
    },
    // Reads the master output into the running peak. Call every 20 ms or so while watching.
    measure() {
      if (!nodes) return;
      nodes.analyser.getFloatTimeDomainData(samples);
      const now = ctx.currentTime;
      // Only the samples since the last read are new; the analyser windows overlap.
      const fresh = Math.min(samples.length, Math.max(1, Math.round((now - lastMeasure) * ctx.sampleRate)));
      lastMeasure = now;
      let top = 0;
      let sumSquares = 0;
      for (let i = samples.length - fresh; i < samples.length; i++) {
        top = Math.max(top, Math.abs(samples[i]));
        sumSquares += samples[i] * samples[i];
      }
      peakHold = Math.max(peakHold, top);
      rmsWindow.add(now, sumSquares, fresh);
      rmsHold = Math.max(rmsHold, rmsWindow.value(now));
      if (top >= 10 ** (CEILING_DBFS / 20) * CEILING_HIT_FRACTION) ceilingReads++;
    },
    resetPeak() {
      peakHold = 0;
      ceilingReads = 0;
      rmsHold = 0;
    },
    peak: () => peakHold,
    // Master level, RMS over the last 100 ms: now, and the highest since reset.
    rms: () => (ctx ? rmsWindow.value(ctx.currentTime) : 0),
    rmsPeak: () => rmsHold,
    // Meter reads (20 ms apart, windows overlap) in which the output touched the ceiling.
    ceilingReads: () => ceilingReads,
    numbers() {
      return {
        unlocked: ctx !== null,
        state: ctx ? ctx.state : 'none',
        soundsPlaying: ctx ? voices.count(ctx.currentTime) : 0,
        musicGain: music ? music.fade.gain.value : 0,
        musicBusGain: busTarget.music,
        effectsBusGain: busTarget.effects,
      };
    },
  };
}
