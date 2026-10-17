/**
 * AR Face Effects Renderer
 * Uses MediaPipe Face Landmarker for real-time 468-point face tracking.
 * Draws overlay effects (freckles, sparkle crown, floating hearts, sunglasses, bunny ears)
 * directly onto a Canvas context on top of the already-drawn video frame.
 *
 * IMPORTANT: Only effects drawing is done here. Video frame rendering happens outside.
 * Each exported drawXxx() function accepts ctx, landmarks[], canvasW, canvasH.
 */

// ─── Landmark index constants (MediaPipe 468-pt mesh) ────────────────────────
// Nose tip
const NOSE_TIP = 4;
// Left/right eye corners (inner)
const L_EYE_INNER = 133;
const R_EYE_INNER = 362;
// Left/right eye outer
const L_EYE_OUTER = 33;
const R_EYE_OUTER = 263;
// Eye top midpoints
const L_EYE_TOP = 159;
const R_EYE_TOP = 386;
// Forehead approx (between brows)
const L_BROW_INNER = 107;
const R_BROW_INNER = 336;
const FOREHEAD_MID = 10; // top of skull
// Ears / temple
const L_TEMPLE = 234;
const R_TEMPLE = 454;
// Mouth corners
const L_MOUTH = 61;
const R_MOUTH = 291;
// Cheeks
const L_CHEEK = 117;
const R_CHEEK = 346;

/**
 * Safe point accessor for MediaPipe landmarks.
 * Scales normalized [0, 1] coordinates to Canvas pixel coordinates (W, H).
 */
export function lm(landmarks, index, W, H) {
  if (!landmarks || !Array.isArray(landmarks)) return null;
  const pt = landmarks[index];
  if (!pt) return null;
  return {
    x: pt.x * W,
    y: pt.y * H,
    z: pt.z || 0,
  };
}

// ─── Face Geometry Extraction ────────────────────────────────────────────────
export function getFaceGeometry(landmarks, W, H) {
  if (!landmarks || !Array.isArray(landmarks) || landmarks.length === 0) {
    return {
      hasFace: false,
      cx: W * 0.5,
      cy: H * 0.45,
      width: W * 0.35,
      height: W * 0.45,
      roll: 0,
      eyeSpan: W * 0.22,
      scale: 1.0,
      nose: { x: W * 0.5, y: H * 0.48 },
      forehead: { x: W * 0.5, y: H * 0.26 },
      chin: { x: W * 0.5, y: H * 0.70 },
      lTemple: { x: W * 0.35, y: H * 0.42 },
      rTemple: { x: W * 0.65, y: H * 0.42 },
      lEye: { x: W * 0.38, y: H * 0.42 },
      rEye: { x: W * 0.62, y: H * 0.42 },
      lCheek: { x: W * 0.36, y: H * 0.52 },
      rCheek: { x: W * 0.64, y: H * 0.52 },
    };
  }

  const nose = lm(landmarks, NOSE_TIP, W, H) || { x: W * 0.5, y: H * 0.48 };
  const lTemple = lm(landmarks, L_TEMPLE, W, H) || { x: W * 0.35, y: H * 0.42 };
  const rTemple = lm(landmarks, R_TEMPLE, W, H) || { x: W * 0.65, y: H * 0.42 };
  const forehead = lm(landmarks, FOREHEAD_MID, W, H) || { x: W * 0.5, y: H * 0.26 };
  const chin = lm(landmarks, 152, W, H) || { x: W * 0.5, y: H * 0.70 };
  const lEye = lm(landmarks, L_EYE_OUTER, W, H) || lTemple;
  const rEye = lm(landmarks, R_EYE_OUTER, W, H) || rTemple;
  const lCheek = lm(landmarks, L_CHEEK, W, H) || { x: lTemple.x + (nose.x - lTemple.x)*0.3, y: nose.y + 10 };
  const rCheek = lm(landmarks, R_CHEEK, W, H) || { x: rTemple.x - (rTemple.x - nose.x)*0.3, y: nose.y + 10 };

  const width = Math.hypot(rTemple.x - lTemple.x, rTemple.y - lTemple.y);
  const height = Math.hypot(chin.x - forehead.x, chin.y - forehead.y);
  const roll = Math.atan2(rTemple.y - lTemple.y, rTemple.x - lTemple.x);
  const eyeSpan = Math.hypot(rEye.x - lEye.x, rEye.y - lEye.y);

  return {
    hasFace: true,
    cx: (lTemple.x + rTemple.x) / 2,
    cy: (forehead.y + chin.y) / 2,
    width: Math.max(40, width),
    height: Math.max(50, height),
    roll,
    eyeSpan: Math.max(20, eyeSpan),
    scale: width / (W * 0.35),
    nose,
    forehead,
    chin,
    lTemple,
    rTemple,
    lEye,
    rEye,
    lCheek,
    rCheek
  };
}

function faceWidth(landmarks, W, H) {
  if (!landmarks || !Array.isArray(landmarks)) return W * 0.35;
  const l = lm(landmarks, L_TEMPLE, W, H);
  const r = lm(landmarks, R_TEMPLE, W, H);
  if (!l || !r) return W * 0.35;
  return Math.hypot(r.x - l.x, r.y - l.y);
}

// ─── Effect: Freckles ─────────────────────────────────────────────────────────
// Draws natural-looking freckle dots across nose bridge and cheeks
export function drawFreckles(ctx, landmarks, W, H) {
  const fw = faceWidth(landmarks, W, H);
  const nose = lm(landmarks, NOSE_TIP, W, H) || { x: W * 0.5, y: H * 0.48 };
  const lc = lm(landmarks, L_CHEEK, W, H) || { x: W * 0.38, y: H * 0.52 };
  const rc = lm(landmarks, R_CHEEK, W, H) || { x: W * 0.62, y: H * 0.52 };
  const baseR = fw * 0.012;

  // Deterministic freckle positions relative to nose tip (seeded by position, not random per frame)
  const frecklePattern = [
    // nose bridge
    { dx: -0.04, dy: -0.02, r: 1.0, a: 0.55 },
    { dx:  0.04, dy: -0.01, r: 0.9, a: 0.50 },
    { dx:  0.00, dy:  0.01, r: 0.8, a: 0.48 },
    { dx: -0.02, dy:  0.03, r: 0.7, a: 0.42 },
    { dx:  0.03, dy:  0.02, r: 0.75, a: 0.45 },
    // left cheek
    { bx: lc ? lc.x : nose.x - fw*0.3, by: lc ? lc.y : nose.y,
      dx: -0.05, dy: -0.01, r: 0.85, a: 0.50 },
    { bx: lc ? lc.x : nose.x - fw*0.3, by: lc ? lc.y : nose.y,
      dx:  0.02, dy:  0.03, r: 0.75, a: 0.42 },
    { bx: lc ? lc.x : nose.x - fw*0.3, by: lc ? lc.y : nose.y,
      dx: -0.03, dy:  0.06, r: 0.70, a: 0.38 },
    // right cheek
    { bx: rc ? rc.x : nose.x + fw*0.3, by: rc ? rc.y : nose.y,
      dx:  0.05, dy: -0.01, r: 0.85, a: 0.50 },
    { bx: rc ? rc.x : nose.x + fw*0.3, by: rc ? rc.y : nose.y,
      dx: -0.02, dy:  0.03, r: 0.75, a: 0.42 },
    { bx: rc ? rc.x : nose.x + fw*0.3, by: rc ? rc.y : nose.y,
      dx:  0.03, dy:  0.06, r: 0.70, a: 0.38 },
  ];

  frecklePattern.forEach(fp => {
    const bx = fp.bx !== undefined ? fp.bx : nose.x;
    const by = fp.by !== undefined ? fp.by : nose.y;
    const cx = bx + fp.dx * fw;
    const cy = by + fp.dy * fw;
    const r  = baseR * fp.r;

    ctx.save();
    ctx.globalAlpha = fp.a;
    ctx.fillStyle = '#8B5E3C';
    ctx.beginPath();
    ctx.ellipse(cx, cy, r * 1.3, r, Math.PI * 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

// ─── Effect: Sparkle Crown ────────────────────────────────────────────────────
// Draws a crown of animated starbursts along the forehead
function drawStarburst(ctx, cx, cy, outerR, innerR, points, color, glowColor, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = outerR * 1.4;
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const angle = (i * Math.PI) / points - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : innerR;
    if (i === 0) ctx.moveTo(cx + r * Math.cos(angle), cy + r * Math.sin(angle));
    else ctx.lineTo(cx + r * Math.cos(angle), cy + r * Math.sin(angle));
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function drawSparkleCrown(ctx, landmarks, W, H, tick) {
  const fw = faceWidth(landmarks, W, H);
  const fh = lm(landmarks, FOREHEAD_MID, W, H) || { x: W * 0.5, y: H * 0.28 };
  const lb = lm(landmarks, L_BROW_INNER, W, H) || { x: W * 0.46, y: H * 0.36 };
  const rb = lm(landmarks, R_BROW_INNER, W, H) || { x: W * 0.54, y: H * 0.36 };

  const crownY = fh.y - fw * 0.18;
  const crownCX = (lb.x + rb.x) / 2;

  // Crown arc of 7 sparkle gems
  const n = 7;
  const spread = fw * 0.56;

  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const arcAngle = (t - 0.5) * Math.PI * 0.7;
    const r = fw * 0.30;
    const sx = crownCX + Math.sin(arcAngle) * r;
    const sy = crownY - Math.cos(arcAngle) * r * 0.3;

    // Pulsating scale
    const pulse = 0.85 + 0.15 * Math.sin(tick * 0.08 + i * 0.9);
    const isCenter = i === Math.floor(n / 2);

    const starR = (isCenter ? fw * 0.048 : fw * 0.032) * pulse;
    const innerR = starR * 0.42;

    // Alternate gem colors
    const colors = ['#FFFACD','#FFD700','#FFFFFF','#FFD700','#FFF9C4','#E8E8E8','#FFFACD'];
    const glows  = ['#FFD70090','#FFEC00A0','#FFFFFF90','#FFD700A0','#FFEA00A0','#FFFFFF80','#FFD70090'];

    drawStarburst(ctx, sx, sy, starR, innerR, 4, colors[i], glows[i], 0.88);

    // Tiny orbit sparkles on center gem
    if (isCenter) {
      for (let j = 0; j < 4; j++) {
        const oa = tick * 0.06 + j * Math.PI / 2;
        const or = starR * 1.55;
        const ox = sx + Math.cos(oa) * or;
        const oy = sy + Math.sin(oa) * or;
        ctx.save();
        ctx.globalAlpha = 0.7;
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowColor = '#FFFACD';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(ox, oy, starR * 0.18, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
  }

  // Subtle band connecting gems
  const lGem = { x: crownCX + Math.sin(-Math.PI*0.35)*fw*0.30, y: crownY - Math.cos(-Math.PI*0.35)*fw*0.09 };
  const rGem = { x: crownCX + Math.sin( Math.PI*0.35)*fw*0.30, y: crownY - Math.cos( Math.PI*0.35)*fw*0.09 };
  const bandGrad = ctx.createLinearGradient(lGem.x, lGem.y, rGem.x, rGem.y);
  bandGrad.addColorStop(0,   'rgba(255,215,0,0)');
  bandGrad.addColorStop(0.3, 'rgba(255,215,0,0.5)');
  bandGrad.addColorStop(0.5, 'rgba(255,250,220,0.7)');
  bandGrad.addColorStop(0.7, 'rgba(255,215,0,0.5)');
  bandGrad.addColorStop(1,   'rgba(255,215,0,0)');
  ctx.save();
  ctx.globalAlpha = 0.55;
  ctx.strokeStyle = bandGrad;
  ctx.lineWidth = fw * 0.014;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(lGem.x, lGem.y);
  ctx.quadraticCurveTo(crownCX, crownY - fw*0.08, rGem.x, rGem.y);
  ctx.stroke();
  ctx.restore();
}

// ─── Effect: Floating Hearts ──────────────────────────────────────────────────
// Draws hearts that drift upward around the face; state is held externally
export function initHeartState() {
  return Array.from({ length: 8 }, (_, i) => ({
    id: i,
    x: 0.2 + Math.random() * 0.6,
    y: 0.3 + Math.random() * 0.5,
    vy: -(0.003 + Math.random() * 0.004),
    vx: (Math.random() - 0.5) * 0.002,
    scale: 0.5 + Math.random() * 0.7,
    alpha: 0.7 + Math.random() * 0.3,
    hue: Math.random() < 0.5 ? '#FF6B9D' : '#FF4466',
  }));
}

function heartPath(ctx, cx, cy, size) {
  ctx.beginPath();
  ctx.moveTo(cx, cy + size * 0.3);
  ctx.bezierCurveTo(cx, cy - size * 0.1, cx - size, cy - size * 0.1, cx - size, cy - size * 0.55);
  ctx.bezierCurveTo(cx - size, cy - size * 1.1, cx, cy - size * 0.9, cx, cy - size * 0.5);
  ctx.bezierCurveTo(cx, cy - size * 0.9, cx + size, cy - size * 1.1, cx + size, cy - size * 0.55);
  ctx.bezierCurveTo(cx + size, cy - size * 0.1, cx, cy - size * 0.1, cx, cy + size * 0.3);
  ctx.closePath();
}

export function drawFloatingHearts(ctx, landmarks, W, H, hearts, updateHearts) {
  const nose = lm(landmarks, NOSE_TIP, W, H);
  const fw = faceWidth(landmarks, W, H);
  if (!nose) return;

  const faceCX = nose.x;
  const faceTop = (lm(landmarks, FOREHEAD_MID, W, H)?.y ?? nose.y - fw * 0.5);

  const updated = hearts.map(h => {
    // positions are relative to face bounding box
    const px = faceCX + (h.x - 0.5) * fw * 1.6;
    const py = faceTop + h.y * fw * 1.2;
    const sz = fw * 0.055 * h.scale;

    ctx.save();
    ctx.globalAlpha = h.alpha;
    ctx.fillStyle = h.hue;
    ctx.shadowColor = h.hue;
    ctx.shadowBlur = sz * 1.2;
    heartPath(ctx, px, py, sz);
    ctx.fill();
    // Highlight glint
    ctx.globalAlpha = h.alpha * 0.6;
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.ellipse(px - sz * 0.3, py - sz * 0.35, sz * 0.22, sz * 0.14, -Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Advance physics
    let ny = h.y + h.vy;
    let nx = h.x + h.vx;
    let na = h.alpha - 0.004;
    // Reset when faded out or off top
    if (na < 0.1 || ny < -0.3) {
      ny = 0.6 + Math.random() * 0.5;
      nx = 0.15 + Math.random() * 0.7;
      na = 0.75 + Math.random() * 0.25;
    }
    return { ...h, y: ny, x: nx, alpha: na };
  });
  updateHearts(updated);
}

// ─── Effect: Cool Sunglasses ──────────────────────────────────────────────────
export function drawSunglasses(ctx, landmarks, W, H) {
  const fw = faceWidth(landmarks, W, H);
  const le = lm(landmarks, L_EYE_OUTER, W, H) || { x: W * 0.38, y: H * 0.4 };
  const re = lm(landmarks, R_EYE_OUTER, W, H) || { x: W * 0.62, y: H * 0.4 };
  const lei = lm(landmarks, L_EYE_INNER, W, H) || { x: W * 0.46, y: H * 0.4 };
  const rei = lm(landmarks, R_EYE_INNER, W, H) || { x: W * 0.54, y: H * 0.4 };
  const lt  = lm(landmarks, L_EYE_TOP,   W, H) || { x: W * 0.42, y: H * 0.38 };
  const rt  = lm(landmarks, R_EYE_TOP,   W, H) || { x: W * 0.58, y: H * 0.38 };

  // Eye geometry
  const lCX = (le.x + lei.x) / 2;
  const rCX = (re.x + rei.x) / 2;
  const lCY = (lt?.y ?? le.y) - fw * 0.005;
  const rCY = (rt?.y ?? re.y) - fw * 0.005;

  const lensW = Math.hypot(lei.x - le.x, lei.y - le.y) * 0.72;
  const lensH = lensW * 0.58;
  const bridgeW = Math.abs(lei.x - rei.x);

  // Angle of glasses matching face tilt
  const angle = Math.atan2(re.y - le.y, re.x - le.x);

  ctx.save();
  ctx.translate(lCX + (rCX - lCX) / 2, lCY + (rCY - lCY) / 2);
  ctx.rotate(angle);

  const halfSpan = (rCX - lCX) / 2;

  // === Left lens ===
  ctx.save();
  ctx.translate(-halfSpan, 0);
  // Lens fill (dark tint)
  ctx.beginPath();
  ctx.ellipse(0, 0, lensW, lensH, 0, 0, Math.PI * 2);
  // Gradient tint – black to dark grey
  const lensGrad = ctx.createRadialGradient(-lensW*0.2, -lensH*0.2, lensH*0.05, 0, 0, lensW);
  lensGrad.addColorStop(0, 'rgba(30,30,30,0.85)');
  lensGrad.addColorStop(1, 'rgba(0,0,0,0.95)');
  ctx.fillStyle = lensGrad;
  ctx.fill();
  // Frame
  ctx.strokeStyle = '#1A1A1A';
  ctx.lineWidth = fw * 0.016;
  ctx.stroke();
  // Shine
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.ellipse(-lensW * 0.28, -lensH * 0.30, lensW * 0.22, lensH * 0.12, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // === Right lens ===
  ctx.save();
  ctx.translate(halfSpan, 0);
  ctx.beginPath();
  ctx.ellipse(0, 0, lensW, lensH, 0, 0, Math.PI * 2);
  const rGrad = ctx.createRadialGradient(-lensW*0.2, -lensH*0.2, lensH*0.05, 0, 0, lensW);
  rGrad.addColorStop(0, 'rgba(30,30,30,0.85)');
  rGrad.addColorStop(1, 'rgba(0,0,0,0.95)');
  ctx.fillStyle = rGrad;
  ctx.globalAlpha = 1;
  ctx.fill();
  ctx.strokeStyle = '#1A1A1A';
  ctx.lineWidth = fw * 0.016;
  ctx.stroke();
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.ellipse(-lensW * 0.28, -lensH * 0.30, lensW * 0.22, lensH * 0.12, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Bridge
  ctx.strokeStyle = '#1A1A1A';
  ctx.lineWidth = fw * 0.012;
  ctx.globalAlpha = 1;
  ctx.beginPath();
  ctx.moveTo(-halfSpan + lensW * 0.95, 0);
  ctx.quadraticCurveTo(0, -lensH * 0.35, halfSpan - lensW * 0.95, 0);
  ctx.stroke();

  ctx.restore();
}

// ─── Effect: Bunny Ears ───────────────────────────────────────────────────────
export function drawBunnyEars(ctx, landmarks, W, H) {
  const fw = faceWidth(landmarks, W, H);
  const fh  = lm(landmarks, FOREHEAD_MID, W, H) || { x: W * 0.5, y: H * 0.28 };
  const lt  = lm(landmarks, L_TEMPLE, W, H) || { x: W * 0.36, y: H * 0.36 };
  const rt  = lm(landmarks, R_TEMPLE, W, H) || { x: W * 0.64, y: H * 0.36 };

  const earH = fw * 0.82;
  const earW = fw * 0.20;
  const angle = Math.atan2(rt.y - lt.y, rt.x - lt.x);

  // Left ear position
  const lEarX = lt.x - fw * 0.02;
  const lEarY = lt.y - fw * 0.05;
  // Right ear
  const rEarX = rt.x + fw * 0.02;
  const rEarY = rt.y - fw * 0.05;

  function drawEar(cx, cy, side) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle + side * 0.18);

    // Outer ear
    const outerGrad = ctx.createLinearGradient(-earW, 0, earW, -earH);
    outerGrad.addColorStop(0, '#F5F0F5');
    outerGrad.addColorStop(1, '#EDE0ED');
    ctx.fillStyle = outerGrad;
    ctx.beginPath();
    ctx.ellipse(0, -earH / 2, earW, earH / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#D0B8D0';
    ctx.lineWidth = fw * 0.012;
    ctx.stroke();

    // Inner ear (pink)
    const innerGrad = ctx.createLinearGradient(-earW*0.5, 0, earW*0.5, -earH*0.8);
    innerGrad.addColorStop(0, '#FFB6C1');
    innerGrad.addColorStop(1, '#FF91A4');
    ctx.fillStyle = innerGrad;
    ctx.beginPath();
    ctx.ellipse(0, -earH / 2, earW * 0.46, earH * 0.41, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  drawEar(lEarX, lEarY, -1);
  drawEar(rEarX, rEarY,  1);
}

// ─── Effect: Puppy Dog (Classic Snap) ─────────────────────────────────────────
export function drawPuppyDog(ctx, landmarks, W, H, tick = 0) {
  const nose = landmarks ? lm(landmarks, NOSE_TIP, W, H) : { x: W * 0.5, y: H * 0.5 };
  const lt = landmarks ? lm(landmarks, L_TEMPLE, W, H) : { x: W * 0.35, y: H * 0.35 };
  const rt = landmarks ? lm(landmarks, R_TEMPLE, W, H) : { x: W * 0.65, y: H * 0.35 };
  const fh = landmarks ? lm(landmarks, FOREHEAD_MID, W, H) : { x: W * 0.5, y: H * 0.28 };
  const fw = landmarks ? faceWidth(landmarks, W, H) : W * 0.35;
  const angle = landmarks ? Math.atan2(rt.y - lt.y, rt.x - lt.x) : 0;

  // 1. Floppy Dog Ears (Anchored on top of head)
  const earW = fw * 0.34;
  const earH = fw * 0.68;
  const earWiggle = Math.sin(tick * 0.08) * 0.06;

  const headX = fh ? fh.x : (lt.x + rt.x) / 2;
  const headY = fh ? fh.y - fw * 0.12 : H * 0.26;

  function drawFloppyEar(cx, cy, side) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle + side * (0.32 + earWiggle));

    // Outer brown ear
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-earW * 0.8, earH * 0.3, -earW * 0.9, earH * 0.8, 0, earH);
    ctx.bezierCurveTo(earW * 0.9, earH * 0.8, earW * 0.8, earH * 0.3, 0, 0);
    ctx.fillStyle = '#8B5A2B';
    ctx.shadowColor = 'rgba(0,0,0,0.2)';
    ctx.shadowBlur = 8;
    ctx.fill();

    // Inner pink/tan patch
    ctx.beginPath();
    ctx.moveTo(0, earH * 0.15);
    ctx.bezierCurveTo(-earW * 0.45, earH * 0.4, -earW * 0.45, earH * 0.75, 0, earH * 0.88);
    ctx.bezierCurveTo(earW * 0.45, earH * 0.75, earW * 0.45, earH * 0.4, 0, earH * 0.15);
    ctx.fillStyle = '#D2A679';
    ctx.fill();
    ctx.restore();
  }

  drawFloppyEar(headX - fw * 0.34, headY, -1);
  drawFloppyEar(headX + fw * 0.34, headY, 1);

  // 2. Cute Dog Nose
  if (nose) {
    ctx.save();
    ctx.translate(nose.x, nose.y);
    ctx.rotate(angle);
    const nR = fw * 0.09;
    ctx.beginPath();
    ctx.ellipse(0, 0, nR * 1.35, nR * 0.92, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#1A1817';
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 6;
    ctx.fill();

    // Glint highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.beginPath();
    ctx.ellipse(-nR * 0.35, -nR * 0.28, nR * 0.38, nR * 0.2, -0.3, 0, Math.PI * 2);
    ctx.fill();

    // Cute pink tongue sticking out slightly
    const tongueW = fw * 0.095;
    const tongueH = fw * 0.13;
    ctx.beginPath();
    ctx.ellipse(0, nR * 1.35, tongueW, tongueH, 0, 0, Math.PI);
    ctx.fillStyle = '#FF7597';
    ctx.fill();
    ctx.strokeStyle = '#E05375';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, nR * 1.0);
    ctx.lineTo(0, nR * 1.7);
    ctx.stroke();

    ctx.restore();
  }
}

// ─── Effect: Cute Kitty Cat ───────────────────────────────────────────────────
export function drawKittyCat(ctx, landmarks, W, H, tick = 0) {
  const nose = landmarks ? lm(landmarks, NOSE_TIP, W, H) : { x: W * 0.5, y: H * 0.5 };
  const lt = landmarks ? lm(landmarks, L_TEMPLE, W, H) : { x: W * 0.35, y: H * 0.35 };
  const rt = landmarks ? lm(landmarks, R_TEMPLE, W, H) : { x: W * 0.65, y: H * 0.35 };
  const lc = landmarks ? lm(landmarks, L_CHEEK, W, H) : { x: W * 0.38, y: H * 0.52 };
  const rc = landmarks ? lm(landmarks, R_CHEEK, W, H) : { x: W * 0.62, y: H * 0.52 };
  const fw = landmarks ? faceWidth(landmarks, W, H) : W * 0.35;
  const angle = landmarks ? Math.atan2(rt.y - lt.y, rt.x - lt.x) : 0;

  // 1. Pointy Cat Ears
  const earSize = fw * 0.42;
  function drawCatEar(cx, cy, side) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle + side * 0.15);

    // Outer ear triangle
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(side * earSize * 0.9, -earSize * 1.1);
    ctx.lineTo(side * earSize * 1.1, -earSize * 0.2);
    ctx.closePath();
    ctx.fillStyle = '#262626';
    ctx.fill();

    // Inner pink triangle
    ctx.beginPath();
    ctx.moveTo(side * earSize * 0.15, -earSize * 0.1);
    ctx.lineTo(side * earSize * 0.85, -earSize * 0.95);
    ctx.lineTo(side * earSize * 0.95, -earSize * 0.25);
    ctx.closePath();
    ctx.fillStyle = '#FF94B2';
    ctx.fill();
    ctx.restore();
  }

  drawCatEar(lt.x - fw * 0.05, lt.y - fw * 0.18, -1);
  drawCatEar(rt.x + fw * 0.05, rt.y - fw * 0.18, 1);

  // 2. Rosy Cheek Blush
  const blushR = fw * 0.14;
  [lc, rc].forEach((c) => {
    if (!c) return;
    ctx.save();
    ctx.globalAlpha = 0.35;
    const bg = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, blushR);
    bg.addColorStop(0, '#FF4D6D');
    bg.addColorStop(1, 'rgba(255, 77, 109, 0)');
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.arc(c.x, c.y, blushR, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });

  // 3. Cute Pink Nose & Whiskers
  if (nose) {
    ctx.save();
    ctx.translate(nose.x, nose.y);
    ctx.rotate(angle);

    // Pink heart nose
    const nS = fw * 0.055;
    ctx.beginPath();
    ctx.moveTo(0, nS * 0.8);
    ctx.lineTo(-nS, -nS * 0.5);
    ctx.lineTo(nS, -nS * 0.5);
    ctx.closePath();
    ctx.fillStyle = '#FF6B8B';
    ctx.fill();

    // Whiskers (3 on each side)
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = Math.max(2, fw * 0.012);
    ctx.lineCap = 'round';
    ctx.globalAlpha = 0.85;

    // Left whiskers
    [-0.2, 0, 0.2].forEach((tilt) => {
      ctx.beginPath();
      ctx.moveTo(-nS * 1.5, 0);
      ctx.lineTo(-fw * 0.45, tilt * fw * 0.35);
      ctx.stroke();
    });

    // Right whiskers
    [-0.2, 0, 0.2].forEach((tilt) => {
      ctx.beginPath();
      ctx.moveTo(nS * 1.5, 0);
      ctx.lineTo(fw * 0.45, tilt * fw * 0.35);
      ctx.stroke();
    });

    ctx.restore();
  }
}

// ─── Effect: Golden Butterflies & Freckles (Iconic Girl Snap) ───────────────
export function drawButterfliesAndFreckles(ctx, landmarks, W, H, tick = 0) {
  drawFreckles(ctx, landmarks, W, H);

  const geo = getFaceGeometry(landmarks, W, H);
  const headX = geo.forehead.x;
  const headY = geo.forehead.y - geo.width * 0.12;
  const fw = geo.width;

  function drawButterfly(bx, by, scale, flapOffset) {
    const flap = Math.cos(tick * 0.18 + flapOffset);
    const bW = fw * 0.18 * scale;
    const bH = fw * 0.14 * scale;

    ctx.save();
    ctx.translate(bx, by);

    // Left wing
    ctx.save();
    ctx.scale(flap, 1);
    ctx.beginPath();
    ctx.ellipse(-bW * 0.5, -fw * 0.03, bW * 0.5, fw * 0.06, -Math.PI * 0.2, 0, Math.PI * 2);
    ctx.fillStyle = '#FFB800';
    ctx.shadowColor = '#FFE066';
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.restore();

    // Right wing
    ctx.save();
    ctx.scale(-flap, 1);
    ctx.beginPath();
    ctx.ellipse(-bW * 0.5, -fw * 0.03, bW * 0.5, fw * 0.06, -Math.PI * 0.2, 0, Math.PI * 2);
    ctx.fillStyle = '#FFB800';
    ctx.shadowColor = '#FFE066';
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.restore();

    // Body
    ctx.fillStyle = '#4A2800';
    ctx.beginPath();
    ctx.ellipse(0, 0, bW * 0.08, fw * 0.05, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // 3 Fluttering Golden Butterflies
  drawButterfly(headX, headY - fw * 0.08, 1.1, 0);
  drawButterfly(headX - fw * 0.32, headY + fw * 0.04, 0.85, 1.2);
  drawButterfly(headX + fw * 0.32, headY + fw * 0.04, 0.85, 2.4);
}

// ─── Effect: Cherry Blossom Breeze (Loved by Girls) ──────────────────────────
export function drawSakuraPetals(ctx, W, H, tick = 0) {
  const numPetals = 16;
  for (let i = 0; i < numPetals; i++) {
    const seed = i * 137.5;
    const speed = 0.7 + (i % 3) * 0.35;
    const x = ((Math.sin(seed + tick * 0.012) * 0.45 + 0.5) * W + (i * 47)) % W;
    const y = ((tick * speed + seed * 6) % (H + 80)) - 40;
    const rot = tick * 0.025 + seed;
    const size = Math.max(9, W * 0.024);

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.fillStyle = i % 2 === 0 ? 'rgba(255, 182, 193, 0.78)' : 'rgba(255, 214, 224, 0.88)';
    ctx.shadowColor = 'rgba(255, 182, 193, 0.65)';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-size * 0.5, -size * 0.8, -size * 0.8, -size * 1.5, 0, -size * 2);
    ctx.bezierCurveTo(size * 0.8, -size * 1.5, size * 0.5, -size * 0.8, 0, 0);
    ctx.fill();
    ctx.restore();
  }
}

// ─── Effect: Rosy Peach Blush & Dewy Sparkles (Most Popular Girl Filter) ─────
export function drawPeachBlush(ctx, landmarks, W, H, tick = 0) {
  drawFreckles(ctx, landmarks, W, H);
  const geo = getFaceGeometry(landmarks, W, H);
  const lc = geo.lCheek;
  const rc = geo.rCheek;
  const nose = geo.nose;
  const fw = geo.width;

  const blushR = fw * 0.22;
  [lc, rc].forEach(c => {
    if (!c) return;
    const grad = ctx.createRadialGradient(c.x, c.y, blushR * 0.1, c.x, c.y, blushR);
    grad.addColorStop(0, 'rgba(255, 115, 155, 0.52)');
    grad.addColorStop(0.55, 'rgba(255, 150, 180, 0.26)');
    grad.addColorStop(1, 'rgba(255, 150, 180, 0)');
    ctx.save();
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(c.x, c.y, blushR, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });

  // Dewy nose tip blush
  if (nose) {
    const nGrad = ctx.createRadialGradient(nose.x, nose.y, 2, nose.x, nose.y, fw * 0.1);
    nGrad.addColorStop(0, 'rgba(255, 110, 150, 0.42)');
    nGrad.addColorStop(1, 'rgba(255, 150, 180, 0)');
    ctx.save();
    ctx.fillStyle = nGrad;
    ctx.beginPath();
    ctx.arc(nose.x, nose.y, fw * 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Cute micro glints near temples & cheeks
  const glintT = (tick * 0.05) % (Math.PI * 2);
  const glintAlpha = 0.4 + 0.4 * Math.sin(glintT);
  const glints = [
    { x: lc.x - fw * 0.12, y: lc.y - fw * 0.08 },
    { x: rc.x + fw * 0.12, y: rc.y - fw * 0.08 }
  ];
  glints.forEach(pt => {
    ctx.save();
    ctx.globalAlpha = glintAlpha;
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = 'rgba(255, 255, 255, 0.9)';
    ctx.shadowBlur = 4;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, Math.max(2, fw * 0.018), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}




