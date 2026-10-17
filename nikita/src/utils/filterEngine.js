/**
 * Aesthetic Photo Studio Filter Engine
 * High-performance HTML5 Canvas image processing engine.
 * Renders real image-processing filters (color grading, bloom, grain, sparkles) directly to Canvas.
 * Ensures downloaded images contain the 100% real filtered pixels.
 */

export const FILTERS = [
  {
    id: 'dream-glow',
    name: 'Dream Glow',
    tagline: 'Soft luminous bloom & highlight diffusion',
    icon: '✨',
    defaultIntensity: 85,
    cssFilter: (intensity) => {
      const val = intensity / 100;
      return `brightness(${1 + 0.1 * val}) contrast(${1 - 0.05 * val}) saturate(${1 + 0.15 * val})`;
    }
  },
  {
    id: 'golden-hour',
    name: 'Golden Hour',
    tagline: 'Warm amber sunset glow & enriched warmth',
    icon: '🌅',
    defaultIntensity: 90,
    cssFilter: (intensity) => {
      const val = intensity / 100;
      return `sepia(${0.35 * val}) saturate(${1 + 0.3 * val}) brightness(${1 + 0.05 * val}) contrast(${1 + 0.05 * val})`;
    }
  },
  {
    id: 'pastel-mood',
    name: 'Pastel Mood',
    tagline: 'Delicate high-key tones & creamy lifted shadows',
    icon: '🌸',
    defaultIntensity: 80,
    cssFilter: (intensity) => {
      const val = intensity / 100;
      return `brightness(${1 + 0.12 * val}) contrast(${1 - 0.12 * val}) saturate(${1 - 0.2 * val})`;
    }
  },
  {
    id: 'vintage-film',
    name: 'Vintage Film',
    tagline: 'Analog texture, matte blacks & organic film grain',
    icon: '🎞️',
    defaultIntensity: 85,
    cssFilter: (intensity) => {
      const val = intensity / 100;
      return `sepia(${0.25 * val}) contrast(${1 - 0.08 * val}) brightness(${1 + 0.02 * val})`;
    }
  },
  {
    id: 'cinematic',
    name: 'Cinematic',
    tagline: 'Teal & orange color grade with moody contrast',
    icon: '🎬',
    defaultIntensity: 90,
    cssFilter: (intensity) => {
      const val = intensity / 100;
      return `contrast(${1 + 0.2 * val}) saturate(${1 + 0.15 * val})`;
    }
  },
  {
    id: 'classic-bw',
    name: 'Classic B&W',
    tagline: 'Timeless high-contrast silver monochrome',
    icon: '📷',
    defaultIntensity: 100,
    cssFilter: (intensity) => {
      const val = intensity / 100;
      return `grayscale(${val}) contrast(${1 + 0.25 * val}) brightness(${1 - 0.02 * val})`;
    }
  },
  {
    id: 'soft-blush',
    name: 'Soft Blush',
    tagline: 'Rosy warm undertones & smooth highlight veil',
    icon: '🎀',
    defaultIntensity: 85,
    cssFilter: (intensity) => {
      const val = intensity / 100;
      return `brightness(${1 + 0.06 * val}) saturate(${1 + 0.1 * val})`;
    }
  },
  {
    id: 'sparkle-dream',
    name: 'Sparkle Dream',
    tagline: 'Specular starburst sparkles & ethereal haze',
    icon: '⭐',
    defaultIntensity: 90,
    cssFilter: (intensity) => {
      const val = intensity / 100;
      return `brightness(${1 + 0.08 * val}) contrast(${1 - 0.04 * val}) saturate(${1 + 0.12 * val})`;
    }
  },
  {
    id: 'ice-blue',
    name: 'Ice Blue',
    tagline: 'Crisp Nordic cyan shadows & frosted sheen',
    icon: '❄️',
    defaultIntensity: 85,
    cssFilter: (intensity) => {
      const val = intensity / 100;
      return `contrast(${1 + 0.08 * val}) brightness(${1 + 0.04 * val})`;
    }
  },
  {
    id: 'natural-beauty',
    name: 'Natural Beauty',
    tagline: 'Balanced micro-contrast & authentic skin vibrance',
    icon: '🌿',
    defaultIntensity: 80,
    cssFilter: (intensity) => {
      const val = intensity / 100;
      return `contrast(${1 + 0.06 * val}) saturate(${1 + 0.12 * val}) brightness(${1 + 0.03 * val})`;
    }
  }
];

/**
 * Draws procedural 4-point sparkle starburst
 */
function drawSparkleStar(ctx, cx, cy, size, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#FFFFFF';
  ctx.shadowColor = 'rgba(255, 255, 255, 0.9)';
  ctx.shadowBlur = size * 0.7;

  // Central glow circle
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.2, 0, Math.PI * 2);
  ctx.fill();

  // 4 diamond rays
  ctx.beginPath();
  ctx.moveTo(cx, cy - size);
  ctx.quadraticCurveTo(cx, cy, cx + size * 0.25, cy);
  ctx.quadraticCurveTo(cx, cy, cx, cy + size);
  ctx.quadraticCurveTo(cx, cy, cx - size * 0.25, cy);
  ctx.quadraticCurveTo(cx, cy, cx, cy - size);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(cx - size, cy);
  ctx.quadraticCurveTo(cx, cy, cx, cy + size * 0.25);
  ctx.quadraticCurveTo(cx, cy, cx + size, cy);
  ctx.quadraticCurveTo(cx, cy, cx, cy - size * 0.25);
  ctx.quadraticCurveTo(cx, cy, cx - size, cy);
  ctx.fill();

  ctx.restore();
}

/**
 * Applies procedural film grain overlay to context
 */
function applyFilmGrain(ctx, width, height, amount) {
  if (amount <= 0) return;
  const grainCanvas = document.createElement('canvas');
  // Scale down grain grid for smooth high-res performance
  const gw = Math.min(width, 400);
  const gh = Math.min(height, 400);
  grainCanvas.width = gw;
  grainCanvas.height = gh;
  const gctx = grainCanvas.getContext('2d');
  const imgData = gctx.createImageData(gw, gh);
  const data = imgData.data;

  for (let i = 0; i < data.length; i += 4) {
    const val = (Math.random() - 0.5) * 255 * amount;
    data[i] = 128 + val;     // R
    data[i + 1] = 128 + val; // G
    data[i + 2] = 128 + val; // B
    data[i + 3] = 40;        // Alpha
  }

  gctx.putImageData(imgData, 0, 0);

  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  ctx.globalAlpha = Math.min(amount * 1.5, 0.6);
  ctx.drawImage(grainCanvas, 0, 0, width, height);
  ctx.restore();
}

/**
 * Main Canvas Render Function
 * Renders source (Image or Video) to destination Canvas with full filter pipeline
 */
export function renderFilteredCanvas(source, canvas, filterId, intensity = 100, isBefore = false) {
  if (!source || !canvas) return;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const width = canvas.width;
  const height = canvas.height;

  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  // If "Before" mode is active or intensity is 0, render pristine original
  if (isBefore || intensity === 0) {
    ctx.filter = 'none';
    ctx.globalAlpha = 1.0;
    ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(source, 0, 0, width, height);
    return;
  }

  const factor = Math.max(0, Math.min(100, intensity)) / 100;
  const currentFilter = FILTERS.find((f) => f.id === filterId) || FILTERS[0];

  // 1. Draw base image with CSS filter operations applied directly on Canvas context
  ctx.save();
  if (ctx.filter !== undefined) {
    ctx.filter = currentFilter.cssFilter(intensity);
  }
  ctx.drawImage(source, 0, 0, width, height);
  ctx.restore();

  // 2. Specialized Layer Compositing according to filter recipe
  switch (filterId) {
    case 'dream-glow': {
      // Bloom / diffuse glow: composite softened highlight layer
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = 0.28 * factor;
      if (ctx.filter !== undefined) {
        ctx.filter = `blur(${Math.max(6, width * 0.015)}px) brightness(1.2)`;
      }
      ctx.drawImage(source, 0, 0, width, height);
      ctx.restore();

      // Delicate warm tone overlay
      ctx.save();
      ctx.globalCompositeOperation = 'soft-light';
      ctx.globalAlpha = 0.18 * factor;
      ctx.fillStyle = '#FFEED9';
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
      break;
    }

    case 'golden-hour': {
      // Sunset radial amber gradient
      ctx.save();
      ctx.globalCompositeOperation = 'overlay';
      ctx.globalAlpha = 0.32 * factor;
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, 'rgba(255, 180, 50, 0.9)');
      grad.addColorStop(0.6, 'rgba(255, 120, 40, 0.6)');
      grad.addColorStop(1, 'rgba(200, 70, 30, 0.4)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();

      // Warm highlight veil
      ctx.save();
      ctx.globalCompositeOperation = 'color-dodge';
      ctx.globalAlpha = 0.15 * factor;
      ctx.fillStyle = '#FFD280';
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
      break;
    }

    case 'pastel-mood': {
      // Creamy matte lifted blacks and gentle pastel wash
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = 0.18 * factor;
      ctx.fillStyle = '#FDF6F0';
      ctx.fillRect(0, 0, width, height);
      ctx.restore();

      // Soft light lavender-cream tint
      ctx.save();
      ctx.globalCompositeOperation = 'soft-light';
      ctx.globalAlpha = 0.25 * factor;
      ctx.fillStyle = '#F2E8EB';
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
      break;
    }

    case 'vintage-film': {
      // Faded film curve: lift black floor
      ctx.save();
      ctx.globalCompositeOperation = 'lighten';
      ctx.globalAlpha = 0.12 * factor;
      ctx.fillStyle = '#1D1A17';
      ctx.fillRect(0, 0, width, height);
      ctx.restore();

      // Sepia amber tone wash
      ctx.save();
      ctx.globalCompositeOperation = 'color';
      ctx.globalAlpha = 0.15 * factor;
      ctx.fillStyle = '#D4A373';
      ctx.fillRect(0, 0, width, height);
      ctx.restore();

      // Real procedural film grain
      applyFilmGrain(ctx, width, height, 0.45 * factor);
      break;
    }

    case 'cinematic': {
      // Split toning: Teal in shadows, Amber/Orange in highlights
      // Shadows (Multiply/Darken with teal)
      ctx.save();
      ctx.globalCompositeOperation = 'color-burn';
      ctx.globalAlpha = 0.2 * factor;
      ctx.fillStyle = '#0F3846';
      ctx.fillRect(0, 0, width, height);
      ctx.restore();

      // Highlights (Soft-light with warm gold)
      ctx.save();
      ctx.globalCompositeOperation = 'soft-light';
      ctx.globalAlpha = 0.35 * factor;
      ctx.fillStyle = '#FFAA33';
      ctx.fillRect(0, 0, width, height);
      ctx.restore();

      // Subtle theatrical vignette
      ctx.save();
      ctx.globalCompositeOperation = 'multiply';
      ctx.globalAlpha = 0.3 * factor;
      const vignette = ctx.createRadialGradient(width / 2, height / 2, width * 0.35, width / 2, height / 2, width * 0.7);
      vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
      vignette.addColorStop(1, 'rgba(0, 10, 20, 0.8)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
      break;
    }

    case 'classic-bw': {
      // Rich monochrome tonal curve: deepen blacks, lift speculars
      ctx.save();
      ctx.globalCompositeOperation = 'overlay';
      ctx.globalAlpha = 0.22 * factor;
      const bwGrad = ctx.createLinearGradient(0, 0, 0, height);
      bwGrad.addColorStop(0, '#FFFFFF');
      bwGrad.addColorStop(0.5, '#7F7F7F');
      bwGrad.addColorStop(1, '#000000');
      ctx.fillStyle = bwGrad;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();

      // Subtle fine silver grain
      applyFilmGrain(ctx, width, height, 0.25 * factor);
      break;
    }

    case 'soft-blush': {
      // Delicate rose-petal wash
      ctx.save();
      ctx.globalCompositeOperation = 'soft-light';
      ctx.globalAlpha = 0.35 * factor;
      ctx.fillStyle = '#FFC0CB';
      ctx.fillRect(0, 0, width, height);
      ctx.restore();

      // Soft highlight glow
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = 0.14 * factor;
      ctx.fillStyle = '#FFF0F5';
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
      break;
    }

    case 'sparkle-dream': {
      // Soft dreamy glow
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = 0.22 * factor;
      if (ctx.filter !== undefined) {
        ctx.filter = `blur(${Math.max(4, width * 0.012)}px)`;
      }
      ctx.drawImage(source, 0, 0, width, height);
      ctx.restore();

      // Algorithmic starburst sparkles placed gracefully across highlights
      const sparkleAlpha = 0.85 * factor;
      const baseSize = Math.max(12, Math.min(32, width * 0.035));
      
      // Beautiful aesthetic sparkle coordinates relative to canvas
      const sparkles = [
        { x: width * 0.22, y: height * 0.26, s: baseSize * 1.1 },
        { x: width * 0.78, y: height * 0.22, s: baseSize * 1.25 },
        { x: width * 0.68, y: height * 0.45, s: baseSize * 0.85 },
        { x: width * 0.32, y: height * 0.68, s: baseSize * 0.9 },
        { x: width * 0.82, y: height * 0.72, s: baseSize * 1.0 },
        { x: width * 0.16, y: height * 0.52, s: baseSize * 0.75 },
        { x: width * 0.52, y: height * 0.15, s: baseSize * 0.8 }
      ];

      sparkles.forEach((sp) => {
        drawSparkleStar(ctx, sp.x, sp.y, sp.s, sparkleAlpha);
      });
      break;
    }

    case 'ice-blue': {
      // Nordic frost tint
      ctx.save();
      ctx.globalCompositeOperation = 'soft-light';
      ctx.globalAlpha = 0.38 * factor;
      ctx.fillStyle = '#4BA3E3';
      ctx.fillRect(0, 0, width, height);
      ctx.restore();

      // Cool highlight sheen
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = 0.15 * factor;
      ctx.fillStyle = '#E0F2FE';
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
      break;
    }

    case 'natural-beauty': {
      // Clean micro-contrast and radiant natural skin tone
      ctx.save();
      ctx.globalCompositeOperation = 'soft-light';
      ctx.globalAlpha = 0.18 * factor;
      ctx.fillStyle = '#FFF8F0';
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
      break;
    }

    default:
      break;
  }
}
