export class ColorManager {
  constructor() {
    // Base color enhancements that affect ripple behavior
    this.colorEnhancements = {
      // Default enhancement values
      default: {
        shadowBlur: 8,
        shadowColor: 'rgba(0, 0, 0, 0.3)',
        glowFactor: 1.0,
        pulseRate: 1.0
      },
      // Color-specific enhancements can be defined here
      // Examples for common colors
      red: {
        shadowBlur: 12,
        shadowColor: 'rgba(255, 50, 50, 0.4)',
        glowFactor: 1.2,
        pulseRate: 1.3 // Faster pulse for energetic colors
      },
      blue: { 
        shadowBlur: 10,
        shadowColor: 'rgba(50, 50, 255, 0.35)',
        glowFactor: 0.9,
        pulseRate: 0.8 // Slower pulse for calming colors
      },
      green: {
        shadowBlur: 9,
        shadowColor: 'rgba(50, 200, 50, 0.3)',
        glowFactor: 1.0,
        pulseRate: 0.9
      },
      purple: {
        shadowBlur: 11,
        shadowColor: 'rgba(180, 50, 230, 0.35)',
        glowFactor: 1.1,
        pulseRate: 1.0
      },
      yellow: {
        shadowBlur: 14,
        shadowColor: 'rgba(255, 230, 50, 0.4)',
        glowFactor: 1.3,
        pulseRate: 1.2
      }
    };
  }

  // Analyze hex color and return closest color enhancement
  getRippleEnhancement(hexColor) {
    if (!hexColor) return this.colorEnhancements.default;

    // Parse hex color
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    // Simple color categorization based on dominant channel
    let colorName = 'default';
    const max = Math.max(r, g, b);

    // Determine primary color by checking which channel is dominant
    if (max === r && r > g + b / 2) {
      colorName = 'red';
    } else if (max === g && g > r + b / 2) {
      colorName = 'green';
    } else if (max === b && b > r + g / 2) {
      colorName = 'blue';
    } else if (r > 200 && g > 200 && b < 100) {
      colorName = 'yellow';
    } else if (r > 150 && b > 150 && g < 100) {
      colorName = 'purple';
    }

    // Return color-specific enhancement or default
    return this.colorEnhancements[colorName] || this.colorEnhancements.default;
  }
}

export class ParticleManager {
  constructor() {
    this.particles = [];
    this.colorManager = new ColorManager();
  }

  createRipple(x, y, color) {
    // Get psychological enhancements for this color
    const enhancement = this.colorManager.getRippleEnhancement(color);
    const rings = 3;

    for (let i = 0; i < rings; i++) {
      // Calculate ring-specific psychology-based variations
      const ringFactor = 1 - (i / rings);

      this.particles.push({
        type: 'ripple',
        x,
        y,
        radius: 1.5,
        maxRadius: 200 + i * 30,
        color,
        // Apply psychology-based enhancements
        shadowBlur: enhancement.shadowBlur * ringFactor,
        shadowColor: enhancement.shadowColor,
        glowFactor: enhancement.glowFactor,
        ringIndex: i,
        opacity: 0.9 - i * 0.15,
        // Longer, more meditative animation
        life: 105 + i * 25,
        // Progressive delay for rhythmic emergence
        delay: i * (18 - (i * 2)),
        // Each ring has slightly different growth characteristics
        growthFactor: (0.26 - i * 0.03) * enhancement.glowFactor,
        // Subtle motion pattern inspired by psychology
        wobble: 0.12 + (i * 0.04) * enhancement.pulseRate * 2,
        phase: Math.random() * Math.PI * 2,
        pulseRate: enhancement.pulseRate,
        thinningFactor: 1.0,
        // Visual weight that decreases as ripple expands
        visualWeight: (1 - (0.2 * i)) * enhancement.glowFactor
      });
    }

    // Add subtle center highlight for more impact on white background
    this.particles.push({
      type: 'highlight',
      x,
      y,
      radius: 3,
      maxRadius: 12,
      color,
      opacity: 0.7,
      life: 25,
      visualWeight: enhancement.glowFactor
    });
  }

  createGlitch(x, y) {
    for (let i = 0; i < 12; i++) {
      this.particles.push({
        type: 'glitch',
        x,
        y,
        radius: Math.random() * 3 + 2,
        color: '#888',
        opacity: 0.6,
        life: 20,
        dx: (Math.random() - 0.5) * 10,
        dy: (Math.random() - 0.5) * 10
      });
    }
  }

  update() {
    this.particles = this.particles.filter(p => p.life > 0);

    this.particles.forEach(p => {
      if (p.delay && p.delay > 0) {
        p.delay--;
        return; // Wait before starting
      }

      if (p.type === 'ripple') {
        // Calculate progress for smooth transitions
        const totalLife = p.life;
        const initialLife = 105 + p.ringIndex * 25;
        const progress = 1 - (p.life / initialLife);

        // Eased growth: slow start, faster middle, slow end
        const easing = this.easeInOutQuad(progress);
        p.radius = 1.5 + (p.maxRadius - 1.5) * easing;

        // Progressive thinning as ripple expands
        p.thinningFactor = Math.max(0.4, 1 - progress * 0.6);

        // Subtle wobble for organic feel
        if (p.wobble) {
          // Wobble diminishes as ripple expands
          const wobbleAmount = p.wobble * (1 - progress) * 0.08;
          p.phase += 0.03 * p.pulseRate; // Adjust phase change by psychological pulse rate
          p.currentOpacity = p.opacity * (1 + Math.sin(p.phase) * wobbleAmount);
        } else {
          p.currentOpacity = p.opacity;
        }

        // Gentle opacity fade with aesthetic curve
        if (progress < 0.15) {
          // Slow initial fade (appear gracefully)
          p.opacity *= 0.998;
        } else if (progress > 0.75) {
          // Faster fade at end (disappear elegantly)
          p.opacity *= 0.976;
        } else {
          // Medium fade in the middle
          p.opacity *= 0.99;
        }

        // Ensure opacity stays in reasonable range
        p.opacity = Math.min(1, Math.max(0, p.opacity));
      }
      else if (p.type === 'highlight') {
        // Quick expansion followed by fade
        p.radius = p.maxRadius * (1 - (p.life / 25));
        p.opacity *= 0.9;
      }
      else if (p.type === 'glitch') {
        p.x += p.dx * (Math.random() > 0.5 ? 1 : -1);
        p.y += p.dy * (Math.random() > 0.5 ? 1 : -1);
        p.dx += (Math.random() - 0.5) * 2;
        p.dy += (Math.random() - 0.5) * 2;
        p.radius += 0.5;
        p.opacity -= 0.05;
      }

      p.life--;
    });
  }

  // Smooth easing function for elegant motion
  easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  draw(ctx) {
    this.particles.forEach(p => {
      if (p.delay && p.delay > 0) return;

      if (p.type === 'ripple') {
        // Parse color for gradient
        const hex = p.color.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);

        // Use currentOpacity which includes wobble effect
        const opacityToUse = p.currentOpacity || p.opacity;

        // Apply shadow based on psychology-enhanced values
        if (p.shadowBlur && p.shadowColor) {
          ctx.shadowColor = p.shadowColor;
          ctx.shadowBlur = p.shadowBlur * (1 - (p.ringIndex / 3));
        } else if (p.ringIndex === 0) {
          // Fallback to original logic if no psychological enhancement
          ctx.shadowColor = `rgba(${r*0.7}, ${g*0.7}, ${b*0.7}, ${opacityToUse * 0.25})`;
          ctx.shadowBlur = 6;
        } else {
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
        }

        // Enhanced gradient with psychology-based glow factor
        const glowFactor = p.glowFactor || 1.0;
        const gradient = ctx.createRadialGradient(
          p.x, p.y, p.radius * 0.618, // Golden ratio proportion
          p.x, p.y, p.radius
        );

        // Subtle color adjustments enhanced by psychological factors
        const boostFactor = 1 * glowFactor; // Adjusted boost based on color psychology
        const boostedR = Math.min(255, r * boostFactor);
        const boostedG = Math.min(255, g * boostFactor);
        const boostedB = Math.min(255, b * boostFactor);

        // More refined gradient for minimalist aesthetic with psychology adjustments
        gradient.addColorStop(0, `rgba(${boostedR}, ${boostedG}, ${boostedB}, 0)`);
        gradient.addColorStop(0.5, `rgba(${boostedR}, ${boostedG}, ${boostedB}, ${opacityToUse * 0.3 * glowFactor})`);
        gradient.addColorStop(0.8, `rgba(${boostedR}, ${boostedG}, ${boostedB}, ${opacityToUse * 0.5 * glowFactor})`);
        gradient.addColorStop(1, `rgba(${boostedR}, ${boostedG}, ${boostedB}, 0)`);

        // Draw ripple with progressively thinner stroke for elegant look
        ctx.strokeStyle = gradient;

        // Thinner lines that get even thinner as the ripple expands
        // Adjust base thickness using visual weight from color psychology
        const visualWeight = p.visualWeight || 1.0;
        const baseThickness = (3.2 + (2 - p.ringIndex) * 0.9) * visualWeight;
        ctx.lineWidth = baseThickness * p.thinningFactor;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.closePath();

        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
      }
      else if (p.type === 'highlight') {
        // Parse color for highlight
        const hex = p.color.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);

        // Create radial gradient for center highlight
        const gradient = ctx.createRadialGradient(
          p.x, p.y, 0,
          p.x, p.y, p.radius
        );

        // White center fading to color
        gradient.addColorStop(0, `rgba(255, 255, 255, ${p.opacity * p.visualWeight})`);
        gradient.addColorStop(0.5, `rgba(${r + 50}, ${g + 50}, ${b + 50}, ${p.opacity * 0.6})`);
        gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

        // Apply shadow for depth
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8 * p.visualWeight;

        // Draw highlight
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();

        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
      }
      else if (p.type === 'glitch') {
        ctx.globalAlpha = p.opacity;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
        ctx.closePath();
      }
    });

    ctx.globalAlpha = 1;
  }
}
