import { BACKGROUND_COLOR } from './config.js';

export class ColorManager {
  constructor() {
    // Emotionally calibrated palette with psychological considerations
    this.colors = [
      // Focus colors - capture attention while maintaining calm
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

    // Purposeful emotional color combinations
    this.emotionalSchemes = [
      {
        name: 'focus',
        colors: ['#e07a70', '#7298c9'],
        psychology: 'Balances energy with calm concentration'
      },
      {
        name: 'creativity',
        colors: ['#9f86c9', '#e9aa56'],
        psychology: 'Stimulates creative thinking and expression'
      },
      {
        name: 'tranquility',
        colors: ['#7bb989', '#7298c9'],
        psychology: 'Creates mental space and peaceful clarity'
      },
      {
        name: 'confidence',
        colors: ['#e9aa56', '#7bb989'],
        psychology: 'Builds confidence and balanced energy'
      },
      {
        name: 'insight',
        colors: ['#9f86c9', '#7bb989'],
        psychology: 'Enhances intuition and balanced thinking'
      }
    ];

    // Color dynamics for animation effects
    this.dynamicEffects = {
      pulse: {
        baseOpacity: 0.8,
        peakOpacity: 1.0,
        duration: 1500, // ms
      },
      emphasis: {
        shadowBlur: 12,
        shadowOpacity: 0.3
      }
    };
  }

  getUsedColors(level) {
    // Progressive psychological journey through levels
    if (level < 2) {
      // Early levels: focus and clarity (blues and greens)
      return this.colors.filter(c =>
        c.name === 'mindful blue' || c.name === 'renewal green');
    } else if (level < 4) {
      // Mid levels: add energy and creativity
      return this.colors.filter(c =>
        c.name === 'mindful blue' || c.name === 'renewal green' ||
        c.name === 'serene coral');
    } else if (level < 6) {
      // Higher levels: full emotional spectrum except violet
      return this.colors.filter(c => c.name !== 'creative violet');
    } else {
      // Mastery levels: complete palette including violet for insight
      return this.colors;
    }
  }

  // Get emotionally targeted color scheme based on desired psychological effect
  getEmotionalScheme(emotionalState) {
    const scheme = this.emotionalSchemes.find(s => s.name === emotionalState);
    return scheme || this.emotionalSchemes[0]; // Default to focus if not found
  }

  drawBackground(ctx, level, canvas) {
    // Pure white base
    ctx.fillStyle = BACKGROUND_COLOR;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add subtle psychological cues based on level
    if (level > 3) {
      // Higher levels get subtle depth cues for increased focus
      const gradient = ctx.createRadialGradient(
        canvas.width/2, canvas.height/2, 0,
        canvas.width/2, canvas.height/2, canvas.width * 0.7
      );

      gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
      gradient.addColorStop(0.7, 'rgba(252, 252, 252, 0)');
      gradient.addColorStop(1, 'rgba(248, 248, 248, 0.4)');

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }

  // Get enhanced ripple effect settings based on color psychology
  getRippleEnhancement(colorHex) {
    // Find the color in our palette
    const color = this.colors.find(c => c.hex === colorHex);

    if (!color) return {
      shadowColor: this.adjustColorLuminance(colorHex, -0.2),
      shadowBlur: 8,
      glowFactor: 1.1,
      pulseRate: 0.03
    };

    // Color-specific enhancements based on psychology
    switch(color.name) {
      case 'serene coral':
        return {
          shadowColor: this.adjustColorLuminance(colorHex, -0.15),
          shadowBlur: 12,
          glowFactor: 1.25,
          pulseRate: 0.04  // Slightly faster pulse for energy
        };
      case 'mindful blue':
        return {
          shadowColor: this.adjustColorLuminance(colorHex, -0.1),
          shadowBlur: 9,
          glowFactor: 1.15,
          pulseRate: 0.025  // Slower pulse for calmness
        };
      case 'renewal green':
        return {
          shadowColor: this.adjustColorLuminance(colorHex, -0.12),
          shadowBlur: 10,
          glowFactor: 1.18,
          pulseRate: 0.028  // Balanced pulse rate
        };
      case 'optimistic amber':
        return {
          shadowColor: this.adjustColorLuminance(colorHex, -0.18),
          shadowBlur: 14,
          glowFactor: 1.3,
          pulseRate: 0.035  // Dynamic pulse for attention
        };
      case 'creative violet':
        return {
          shadowColor: this.adjustColorLuminance(colorHex, -0.15),
          shadowBlur: 15,
          glowFactor: 1.22,
          pulseRate: 0.03  // Meditation-like pulse
        };
      default:
        return {
          shadowColor: this.adjustColorLuminance(colorHex, -0.15),
          shadowBlur: 10,
          glowFactor: 1.2,
          pulseRate: 0.03
        };
    }
  }

  // Helper method to adjust color luminance
  adjustColorLuminance(hex, lum) {
    // Convert hex to RGB
    hex = String(hex).replace(/[^0-9a-f]/gi, '');
    if (hex.length < 6) {
      hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
    }
    lum = lum || 0;

    // Convert to decimal and adjust luminance
    let rgb = "#", c, i;
    for (i = 0; i < 3; i++) {
      c = parseInt(hex.substr(i*2,2), 16);
      c = Math.round(Math.min(Math.max(0, c + (c * lum)), 255)).toString(16);
      rgb += ("00"+c).substr(c.length);
    }

    return rgb;
  }

  // Get color with opacity and psychological enhancement
  getEnhancedColor(colorHex, opacity) {
    const rgb = this.hexToRgb(colorHex);
    const enhancement = this.getRippleEnhancement(colorHex);

    // Add slight color adjustment based on psychology
    return {
      color: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`,
      glow: enhancement.glowFactor,
      shadow: enhancement.shadowBlur,
      shadowColor: enhancement.shadowColor,
      pulseRate: enhancement.pulseRate
    };
  }

  // Convert hex to RGB
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : {r: 0, g: 0, b: 0};
  }
}
