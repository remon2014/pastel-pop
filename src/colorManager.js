export class ColorManager {
  constructor() {
    // 🧠 Store the original psychological base palette
    this.baseColors = [
      {
        name: 'serene coral',
        hex: '#e07a70',
        psychology: 'warmth, creativity, gentle energy',
        complementary: '#70d6e1'
      },
      {
        name: 'mindful blue',
        hex: '#7298c9',
        psychology: 'trust, clarity, concentration',
        complementary: '#c99a72'
      },
      {
        name: 'renewal green',
        hex: '#7bb989',
        psychology: 'growth, balance, restoration',
        complementary: '#b979b9'
      },
      {
        name: 'optimistic amber',
        hex: '#e9aa56',
        psychology: 'confidence, positivity, focus',
        complementary: '#56a5e9'
      },
      {
        name: 'creative violet',
        hex: '#9f86c9',
        psychology: 'inspiration, intuition, mindfulness',
        complementary: '#b0c986'
      }
    ];

    this.palettes = {
      dystopian: [ { name: "Coal Teal", hex: "#174950" }, { name: "Industrial Green", hex: "#008080" }, { name: "Warning Red", hex: "#E60234" }, { name: "Rust Blood", hex: "#8B0F32" } ],
      vintage: [ { name: "Olive Black", hex: "#16463F" }, { name: "Dust Rose", hex: "#EAC1C6" }, { name: "Old Canvas", hex: "#E7E1D5" }, { name: "Storm Grey", hex: "#6D7179" } ],
      natural: [ { name: "Clay", hex: "#C26C49" }, { name: "Stone Beige", hex: "#BD8869" }, { name: "Soft Sand", hex: "#E8C3A8" }, { name: "Leaf Mist", hex: "#D8E3DD" } ],
      energy: [ { name: "Midnight Core", hex: "#051341" }, { name: "Pulse Blue", hex: "#1501A1" }, { name: "Ignition Orange", hex: "#FF4801" } ],
      sunshine: [ { name: "Sunbeam", hex: "#FFB81D" }, { name: "Ash Grey", hex: "#404348" }, { name: "Tanned Wood", hex: "#C89C76" }, { name: "Porcelain", hex: "#EFECEC" } ],
      popshock: [ { name: "Blush Pink", hex: "#F5B0C2" }, { name: "Hot Magenta", hex: "#FC1577" }, { name: "Fire Red", hex: "#EB3402" }, { name: "Electric Blue", hex: "#00249E" } ],
      joy: [ { name: "Punch Pink", hex: "#D02C8F" }, { name: "Cherry Blaze", hex: "#EE3F46" }, { name: "Lemon Zest", hex: "#EDC100" }, { name: "Spring Green", hex: "#A6C871" } ],
      summer: [ { name: "Beach Yellow", hex: "#FEDE24" }, { name: "Tangerine", hex: "#FD6326" }, { name: "Cotton Candy", hex: "#FBC1C9" }, { name: "Cactus Bloom", hex: "#D8C508" } ],
    };

    this.emotionalSchemes = [
      { name: 'focus', colors: ['#e07a70', '#7298c9'], psychology: 'Balances energy with calm concentration' },
      { name: 'creativity', colors: ['#9f86c9', '#e9aa56'], psychology: 'Stimulates creative thinking and expression' },
      { name: 'tranquility', colors: ['#7bb989', '#7298c9'], psychology: 'Creates mental space and peaceful clarity' },
      { name: 'confidence', colors: ['#e9aa56', '#7bb989'], psychology: 'Builds confidence and balanced energy' },
      { name: 'insight', colors: ['#9f86c9', '#7bb989'], psychology: 'Enhances intuition and balanced thinking' }
    ];

    this.dynamicEffects = {
      pulse: { baseOpacity: 0.8, peakOpacity: 1.0, duration: 1500 },
      emphasis: { shadowBlur: 12, shadowOpacity: 0.3 }
    };
  }

  getUsedColors(level, paletteName = null) {
    // 🎨 Use named palette if defined
    if (paletteName && this.palettes[paletteName]) {
      const palette = this.palettes[paletteName];
      if (!palette || palette.length === 0) {
        console.warn(`⚠️ Palette "${paletteName}" is empty or undefined.`);
        return [];
      }
      return palette.map(c => ({ name: c.name, hex: c.hex }));
    }

    // 🧠 Fallback: Use psychologically guided palette
    const fallback = (() => {
      if (level < 2) {
        return this.baseColors.filter(c =>
          c.name === 'mindful blue' || c.name === 'renewal green');
      } else if (level < 4) {
        return this.baseColors.filter(c =>
          c.name === 'mindful blue' || c.name === 'renewal green' || c.name === 'serene coral');
      } else if (level < 6) {
        return this.baseColors.filter(c => c.name !== 'creative violet');
      } else {
        return this.baseColors;
      }
    })();

    if (!fallback || fallback.length === 0) {
      console.error('❌ Fallback psychological palette is empty!');
      return [];
    }

    return fallback.map(c => ({ name: c.name, hex: c.hex }));
  }

  getEmotionalScheme(emotionalState) {
    const scheme = this.emotionalSchemes.find(s => s.name === emotionalState);
    return scheme || this.emotionalSchemes[0];
  }
}
