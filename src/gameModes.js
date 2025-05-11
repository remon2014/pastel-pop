export const GAME_MODES = {
  classic: {
    name: "Classic",
    palette: null, // Uses emotional progression
    baseSpeed: 2,
    speedMultiplier: 0.5,
    backgroundMusic: "calm.mp3",
    fxSet: "soft"
  },
  fast: {
    name: "Fast Mode",
    palette: "energy", // Bold, intense palette
    baseSpeed: 4,
    speedMultiplier: 1.0,
    backgroundMusic: "fastbeat.mp3",
    fxSet: "sharp"
  },
  chill: {
    name: "Chill Mode",
    palette: "natural", // Earthy tones
    baseSpeed: 1.5,
    speedMultiplier: 0.2,
    backgroundMusic: "lofi.mp3",
    fxSet: "smooth"
  },
  retro: {
    name: "Retro Pop",
    palette: "popshock", // Vibrant red-pink-blue
    baseSpeed: 2.5,
    speedMultiplier: 0.4,
    backgroundMusic: "retrobeat.mp3",
    fxSet: "glitch"
  },
  summer: {
    name: "Summer Vibes",
    palette: "summer",
    baseSpeed: 2.8,
    speedMultiplier: 0.6,
    backgroundMusic: "tropical.mp3",
    fxSet: "wave"
  },
  moody: {
    name: "Dystopian Drift",
    palette: "dystopian",
    baseSpeed: 3,
    speedMultiplier: 0.7,
    backgroundMusic: "darkwave.mp3",
    fxSet: "distort"
  },
  joyful: {
    name: "Joy Burst",
    palette: "joy",
    baseSpeed: 2.2,
    speedMultiplier: 0.5,
    backgroundMusic: "funbeat.mp3",
    fxSet: "pop"
  },
  vintage: {
    name: "Vintage Dust",
    palette: "vintage",
    baseSpeed: 2,
    speedMultiplier: 0.3,
    backgroundMusic: "vinyl.mp3",
    fxSet: "fade"
  },
  solar: {
    name: "Solar Radiance",
    palette: "sunshine",
    baseSpeed: 3.5,
    speedMultiplier: 0.8,
    backgroundMusic: "radiant.mp3",
    fxSet: "flash"
  }
};
