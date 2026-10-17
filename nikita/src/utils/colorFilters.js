/**
 * Color Filter Engine
 * Applies canvas-based color grading, grain, bloom, and overlays.
 * Every filter writes real pixel data — downloaded image matches live preview.
 */

export const COLOR_FILTERS = [
  { id: 'none',         name: 'Original',      icon: '⬜', css: '' },
  { id: 'dream-glow',  name: 'Dream Glow',     icon: '✨', css: 'brightness(1.08) contrast(0.95) saturate(1.15)' },
  { id: 'golden-hour', name: 'Golden Hour',    icon: '🌅', css: 'sepia(0.35) saturate(1.3) brightness(1.05) contrast(1.05)' },
  { id: 'pastel-mood', name: 'Pastel Mood',    icon: '🌸', css: 'brightness(1.12) contrast(0.88) saturate(0.8)' },
  { id: 'vintage',     name: 'Vintage Film',   icon: '🎞️', css: 'sepia(0.25) contrast(0.92) brightness(1.02)' },
  { id: 'cinematic',   name: 'Cinematic',      icon: '🎬', css: 'contrast(1.2) saturate(1.15)' },
  { id: 'bw',          name: 'Classic B&W',    icon: '📷', css: 'grayscale(1) contrast(1.25)' },
  { id: 'soft-blush',  name: 'Soft Blush',     icon: '🎀', css: 'brightness(1.06) saturate(1.1)' },
  { id: 'sparkle',     name: 'Sparkle Dream',  icon: '⭐', css: 'brightness(1.08) contrast(0.96) saturate(1.12)' },
  { id: 'ice-blue',    name: 'Ice Blue',       icon: '❄️', css: 'contrast(1.08) brightness(1.04)' },
  { id: 'natural',     name: 'Natural Beauty', icon: '🌿', css: 'contrast(1.06) saturate(1.12) brightness(1.03)' },
];

/** Paint a 4-point starburst sparkle */
function drawStar(ctx, cx, cy, size, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#FFFFFF';
  ctx.shadowColor = 'rgba(255,255,255,0.9)';
  ctx.shadowBlur = size * 0.8;
  // horizontal ray
  ctx.beginPath();
  ctx.ellipse(cx, cy, size, size * 0.15, 0, 0, Math.PI * 2);
  ctx.fill();
  // vertical ray
  ctx.beginPath();
  ctx.ellipse(cx, cy, size * 0.15, size, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Film-grain overlay rendered directly onto ctx */
function grain(ctx, w, h, strength) {
  const scale = 0.5;
  const gw = Math.round(w * scale);
  const gh = Math.round(h * scale);
  const tmp = document.createElement('canvas');
  tmp.width = gw; tmp.height = gh;
  const g = tmp.getContext('2d');
  const d = g.createImageData(gw, gh);
  for (let i = 0; i < d.data.length; i += 4) {
    const v = (Math.random() - 0.5) * 255 * strength;
    d.data[i] = d.data[i+1] = d.data[i+2] = 128 + v;
    d.data[i+3] = 35;
  }
  g.putImageData(d, 0, 0);
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  ctx.globalAlpha = Math.min(strength * 1.2, 0.55);
  ctx.drawImage(tmp, 0, 0, w, h);
  ctx.restore();
}

/**
 * applyColorFilter(source, canvas, filterId)
 * Draws source (Image / HTMLVideoElement / OffscreenCanvas) into canvas
 * with the chosen color filter fully composited.
 */
export function applyColorFilter(source, canvas, filterId) {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  const filter = COLOR_FILTERS.find(f => f.id === filterId) || COLOR_FILTERS[0];
  ctx.save();
  ctx.filter = filter.css || 'none';
  ctx.drawImage(source, 0, 0, W, H);
  ctx.restore();

  const f = filterId;

  if (f === 'dream-glow') {
    ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = 0.22;
    ctx.filter = `blur(${Math.max(5, W * 0.013)}px)`;
    ctx.drawImage(source, 0, 0, W, H); ctx.restore();
    ctx.save(); ctx.globalCompositeOperation = 'soft-light'; ctx.globalAlpha = 0.15;
    ctx.fillStyle = '#FFEED9'; ctx.fillRect(0, 0, W, H); ctx.restore();
  }
  if (f === 'golden-hour') {
    ctx.save(); ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = 0.28;
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, 'rgba(255,180,50,0.9)'); g.addColorStop(1, 'rgba(200,70,30,0.4)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
  }
  if (f === 'pastel-mood') {
    ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = 0.18;
    ctx.fillStyle = '#FDF6F0'; ctx.fillRect(0, 0, W, H); ctx.restore();
  }
  if (f === 'vintage') {
    ctx.save(); ctx.globalCompositeOperation = 'color'; ctx.globalAlpha = 0.14;
    ctx.fillStyle = '#D4A373'; ctx.fillRect(0, 0, W, H); ctx.restore();
    grain(ctx, W, H, 0.42);
  }
  if (f === 'cinematic') {
    ctx.save(); ctx.globalCompositeOperation = 'color-burn'; ctx.globalAlpha = 0.18;
    ctx.fillStyle = '#0F3846'; ctx.fillRect(0, 0, W, H); ctx.restore();
    ctx.save(); ctx.globalCompositeOperation = 'soft-light'; ctx.globalAlpha = 0.30;
    ctx.fillStyle = '#FFAA33'; ctx.fillRect(0, 0, W, H); ctx.restore();
    ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = 0.28;
    const vg = ctx.createRadialGradient(W/2,H/2,W*0.35,W/2,H/2,W*0.72);
    vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(0,10,20,0.8)');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H); ctx.restore();
  }
  if (f === 'bw') {
    grain(ctx, W, H, 0.22);
  }
  if (f === 'soft-blush') {
    ctx.save(); ctx.globalCompositeOperation = 'soft-light'; ctx.globalAlpha = 0.32;
    ctx.fillStyle = '#FFC0CB'; ctx.fillRect(0, 0, W, H); ctx.restore();
  }
  if (f === 'sparkle') {
    ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = 0.20;
    ctx.filter = `blur(${Math.max(4, W*0.011)}px)`;
    ctx.drawImage(source, 0, 0, W, H); ctx.restore();
    const sz = Math.max(10, Math.min(28, W * 0.032));
    [
      [0.22,0.25,1.1],[0.78,0.20,1.25],[0.68,0.45,0.85],
      [0.32,0.68,0.90],[0.82,0.72,1.0],[0.16,0.52,0.75],[0.52,0.14,0.80]
    ].forEach(([rx,ry,rs]) => drawStar(ctx, W*rx, H*ry, sz*rs, 0.8));
  }
  if (f === 'ice-blue') {
    ctx.save(); ctx.globalCompositeOperation = 'soft-light'; ctx.globalAlpha = 0.35;
    ctx.fillStyle = '#4BA3E3'; ctx.fillRect(0, 0, W, H); ctx.restore();
    ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = 0.14;
    ctx.fillStyle = '#E0F2FE'; ctx.fillRect(0, 0, W, H); ctx.restore();
  }
  if (f === 'natural') {
    ctx.save(); ctx.globalCompositeOperation = 'soft-light'; ctx.globalAlpha = 0.16;
    ctx.fillStyle = '#FFF8F0'; ctx.fillRect(0, 0, W, H); ctx.restore();
  }
}
