/**
 * Aesthetic & Snapchat-Style Photo Studio
 * 
 * Features:
 *  - 20 Total Filters (12 Aesthetic Color Grades + 8 Funny & Snap AR Overlays)
 *  - Real-time face tracking via MediaPipe Face Landmarker with proportional fallbacks
 *  - Snap Puppy Dog, Cute Kitty Cat, Angel Sparkle Crown, Floating Hearts, Thug Shades, Playful Bunny, Rainbow Wave, Retro 90s Camcorder
 *  - Category filter tabs: All, Aesthetic Vibes, Funny & Snap AR
 *  - 100% browser-local processing & privacy
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera, Download, RotateCcw, Eye, Sparkles,
  SwitchCamera, AlertCircle, Check, RefreshCw,
  ShieldCheck, X, Heart
} from 'lucide-react';
import {
  drawSparkleCrown, drawFloatingHearts,
  drawBunnyEars, drawPuppyDog, drawKittyCat,
  drawButterfliesAndFreckles, drawSakuraPetals,
  drawPeachBlush, initHeartState
} from '../utils/arEffects';
import { useFaceLandmarker } from '../utils/useFaceLandmarker';

// ─── Fast Cached Grain Pattern (Zero GC garbage per frame) ─────────────────────
let cachedNoiseCanvas = null;
function getCachedNoise() {
  if (!cachedNoiseCanvas) {
    cachedNoiseCanvas = document.createElement('canvas');
    cachedNoiseCanvas.width = 128;
    cachedNoiseCanvas.height = 128;
    const gc = cachedNoiseCanvas.getContext('2d');
    const id = gc.createImageData(128, 128);
    for (let i = 0; i < id.data.length; i += 4) {
      const v = (Math.random() - 0.5) * 50;
      id.data[i] = id.data[i + 1] = id.data[i + 2] = 128 + v;
      id.data[i + 3] = 24;
    }
    gc.putImageData(id, 0, 0);
  }
  return cachedNoiseCanvas;
}

// ─── 14 Lovely Girl Filters (Most Used on Snapchat, Instagram & TikTok) ────────
const FILTERS = [
  // ── CUTE AR FACE FILTERS (Loved on Snapchat & Instagram) ─────────────────────
  {
    id: 'peach-blush',
    name: 'Peach Blush & Glow',
    category: 'snap',
    icon: '🍑',
    tag: 'Dewy Freckles',
    css: 'brightness(1.06) saturate(1.15) contrast(1.02)',
    ar: (ctx, landmarks, W, H, tick) => {
      drawPeachBlush(ctx, landmarks, W, H, tick);
    },
  },
  {
    id: 'sparkle-crown',
    name: 'Angel Sparkle Crown',
    category: 'snap',
    icon: '👑',
    tag: 'Golden Halo',
    css: 'brightness(1.08) contrast(1.03) saturate(1.1)',
    ar: (ctx, landmarks, W, H, tick) => {
      drawSparkleCrown(ctx, landmarks, W, H, tick);
    },
  },
  {
    id: 'floating-hearts',
    name: 'Floating Pastel Hearts',
    category: 'snap',
    icon: '💖',
    tag: 'Pastel Love',
    css: 'brightness(1.06) saturate(1.12)',
    ar: (ctx, landmarks, W, H, tick, hearts, updateHearts) => {
      drawFloatingHearts(ctx, landmarks, W, H, hearts, updateHearts);
    },
  },
  {
    id: 'bunny-ears',
    name: 'Cute Bunny Girl',
    category: 'snap',
    icon: '🐰',
    tag: 'Fluffy Ears',
    css: 'brightness(1.08) saturate(1.08)',
    ar: (ctx, landmarks, W, H) => {
      drawBunnyEars(ctx, landmarks, W, H);
    },
  },
  {
    id: 'kitty-cat',
    name: 'Kawaii Kitty Cat',
    category: 'snap',
    icon: '🐱',
    tag: 'Whiskers & Ears',
    css: 'brightness(1.06) saturate(1.14)',
    ar: (ctx, landmarks, W, H, tick) => {
      drawKittyCat(ctx, landmarks, W, H, tick);
    },
  },
  {
    id: 'butterfly-glow',
    name: 'Golden Butterflies',
    category: 'snap',
    icon: '🦋',
    tag: 'Fluttering Glow',
    css: 'brightness(1.08) saturate(1.15) sepia(0.08)',
    ar: (ctx, landmarks, W, H, tick) => {
      drawButterfliesAndFreckles(ctx, landmarks, W, H, tick);
    },
  },
  {
    id: 'puppy-dog',
    name: 'Cute Puppy Dog',
    category: 'snap',
    icon: '🐶',
    tag: 'Classic Snap',
    css: 'brightness(1.06) contrast(1.02) saturate(1.1)',
    ar: (ctx, landmarks, W, H, tick) => {
      drawPuppyDog(ctx, landmarks, W, H, tick);
    },
  },
  {
    id: 'cherry-blossom',
    name: 'Cherry Blossom Breeze',
    category: 'snap',
    icon: '🌸',
    tag: 'Sakura Petals',
    css: 'brightness(1.07) saturate(1.14) contrast(1.02)',
    ar: (ctx, landmarks, W, H, tick) => {
      drawSakuraPetals(ctx, W, H, tick);
    },
  },

  // ── AESTHETIC GLOWS & COLOR TONES (Most Used by Girls) ─────────────────────
  {
    id: 'dream-glow',
    name: 'Dream Glow Bloom',
    category: 'aesthetic',
    icon: '✨',
    tag: 'Korean Glass Skin',
    css: 'brightness(1.08) contrast(0.96) saturate(1.14)',
    overlay: (ctx, W, H, src) => {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = 0.22;
      ctx.filter = `blur(${Math.max(5, W * 0.013)}px)`;
      ctx.drawImage(src, 0, 0, W, H);
      ctx.restore();
      ctx.save();
      ctx.globalCompositeOperation = 'soft-light';
      ctx.globalAlpha = 0.16;
      ctx.fillStyle = '#FFEED9';
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    },
  },
  {
    id: 'golden-hour',
    name: 'Golden Hour Goddess',
    category: 'aesthetic',
    icon: '🌅',
    tag: 'Sunset Honey',
    css: 'sepia(0.32) saturate(1.28) brightness(1.06) contrast(1.04)',
    overlay: (ctx, W, H) => {
      ctx.save();
      ctx.globalCompositeOperation = 'overlay';
      ctx.globalAlpha = 0.26;
      const g = ctx.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, 'rgba(255,180,50,0.85)');
      g.addColorStop(1, 'rgba(200,70,30,0.35)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    },
  },
  {
    id: 'pastel-mood',
    name: 'Pastel Strawberry',
    category: 'aesthetic',
    icon: '🍓',
    tag: 'Soft Milky Pink',
    css: 'brightness(1.12) contrast(0.90) saturate(0.88)',
    overlay: (ctx, W, H) => {
      ctx.save();
      ctx.globalCompositeOperation = 'soft-light';
      ctx.globalAlpha = 0.28;
      ctx.fillStyle = '#FFDDE4';
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    },
  },
  {
    id: 'clean-girl',
    name: 'Clean Girl Radiance',
    category: 'aesthetic',
    icon: '🤍',
    tag: 'Dewy Clarity',
    css: 'contrast(1.06) saturate(1.12) brightness(1.04)',
    overlay: (ctx, W, H) => {
      ctx.save();
      ctx.globalCompositeOperation = 'soft-light';
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = '#FFF8F2';
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    },
  },
  {
    id: 'paris-film',
    name: 'Paris 35mm Film',
    category: 'aesthetic',
    icon: '🎞️',
    tag: 'Vintage Chic',
    css: 'sepia(0.20) contrast(0.95) brightness(1.04) saturate(1.1)',
    overlay: (ctx, W, H) => {
      ctx.save();
      ctx.globalCompositeOperation = 'color';
      ctx.globalAlpha = 0.12;
      ctx.fillStyle = '#E8C5A8';
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
      // Fast cached noise
      ctx.save();
      ctx.globalCompositeOperation = 'overlay';
      ctx.globalAlpha = 0.35;
      ctx.drawImage(getCachedNoise(), 0, 0, W, H);
      ctx.restore();
    },
  },
  {
    id: 'chic-noir',
    name: 'Chic Noir Vogue',
    category: 'aesthetic',
    icon: '🖤',
    tag: 'Velvet Monochrome',
    css: 'grayscale(1) contrast(1.24) brightness(1.02)',
    overlay: (ctx, W, H) => {
      ctx.save();
      ctx.globalCompositeOperation = 'overlay';
      ctx.globalAlpha = 0.30;
      ctx.drawImage(getCachedNoise(), 0, 0, W, H);
      ctx.restore();
    },
  },
];

// ─── Canvas renderer ──────────────────────────────────────────────────────────
function renderToCanvas(canvas, source, filterId, showOriginal, landmarks, tick, hearts, setHearts) {
  if (!canvas || !source) return;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  if (showOriginal || !filterId || filterId === 'none') {
    ctx.drawImage(source, 0, 0, W, H);
    return;
  }

  const filter = FILTERS.find(f => f.id === filterId);
  if (!filter) { ctx.drawImage(source, 0, 0, W, H); return; }

  // 1. Draw base with CSS filter
  ctx.save();
  if (ctx.filter !== undefined && filter.css) ctx.filter = filter.css;
  ctx.drawImage(source, 0, 0, W, H);
  ctx.restore();

  // 2. Composite overlay layers
  ctx.filter = 'none';
  if (filter.overlay) {
    filter.overlay(ctx, W, H, source);
  }

  // 3. Render Snap AR overlays
  if (filter.ar) {
    filter.ar(ctx, landmarks, W, H, tick, hearts, setHearts);
  }
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function PhotoStudio() {
  const [phase, setPhase] = useState('idle');
  // 'idle' | 'loading' | 'live' | 'denied' | 'error' | 'captured'

  const [errorMsg, setErrorMsg]             = useState('');
  const [toast, setToast]                   = useState('');
  const [filterId, setFilterId]             = useState('peach-blush');
  const [filterCategory, setFilterCategory] = useState('all'); // 'all' | 'snap' | 'aesthetic'
  const [showOriginal, setShowOriginal]     = useState(false);
  const [dlFormat, setDlFormat]             = useState('png');
  const [facing, setFacing]                 = useState('user');
  const [canFlip, setCanFlip]               = useState(false);
  const [hasFace, setHasFace]               = useState(false);

  const videoRef        = useRef(null);
  const canvasRef       = useRef(null);
  const streamRef       = useRef(null);
  const rafRef          = useRef(null);
  const frozenRef       = useRef(null);
  const tickRef         = useRef(0);
  const heartsRef       = useRef(initHeartState());
  const filterIdRef     = useRef(filterId);
  const showOriginalRef = useRef(showOriginal);
  const hasFaceRef      = useRef(false);

  useEffect(() => { filterIdRef.current = filterId; }, [filterId]);
  useEffect(() => { showOriginalRef.current = showOriginal; }, [showOriginal]);

  const { detect: detectFace } = useFaceLandmarker();

  const updateHearts = useCallback((newHearts) => {
    heartsRef.current = newHearts;
  }, []);

  // ── Toast ────────────────────────────────────────────────────────────────
  const toast$ = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3200);
  }, []);

  // ── Cleanup ───────────────────────────────────────────────────────────────
  const releaseTracks = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    frozenRef.current = null;
    hasFaceRef.current = false;
    setHasFace(false);
  }, []);

  useEffect(() => () => releaseTracks(), [releaseTracks]);

  // ── Render loop (Buttery smooth 60 FPS, uninterrupted by filter switching) ─
  const startLoop = useCallback(() => {
    cancelAnimationFrame(rafRef.current);

    const tick = () => {
      const vid = videoRef.current;
      const cvs = canvasRef.current;
      if (!vid || !cvs || vid.readyState < 2 || vid.paused) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      const W = vid.videoWidth || 640;
      const H = vid.videoHeight || 480;
      if (cvs.width !== W || cvs.height !== H) {
        cvs.width = W; cvs.height = H;
      }

      tickRef.current++;
      const currentTick = tickRef.current;

      let landmarks = null;
      try {
        landmarks = detectFace(vid);
      } catch {
        landmarks = null;
      }

      // Only re-render React state if face detection transitions, preventing loop jank
      if (currentTick % 10 === 0) {
        const detected = !!(landmarks && Array.isArray(landmarks) && landmarks.length > 0);
        if (detected !== hasFaceRef.current) {
          hasFaceRef.current = detected;
          setHasFace(detected);
        }
      }

      renderToCanvas(
        cvs, vid, filterIdRef.current, showOriginalRef.current,
        landmarks, currentTick,
        heartsRef.current, updateHearts
      );
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
  }, [detectFace, updateHearts]);

  // Start loop once when camera goes live
  useEffect(() => {
    if (phase === 'live') startLoop();
  }, [phase, startLoop]);


  // ── Open camera ───────────────────────────────────────────────────────────
  const openCamera = useCallback(async (requestedFacing = facing) => {
    setErrorMsg('');
    setPhase('loading');
    frozenRef.current = null;

    if (!navigator.mediaDevices?.getUserMedia) {
      setErrorMsg('Camera API is not supported in this browser. Try Chrome or Firefox on a secure (HTTPS) connection.');
      setPhase('error');
      return;
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoCams = devices.filter(d => d.kind === 'videoinput');
      setCanFlip(videoCams.length > 1);
    } catch { /* ignore */ }

    releaseTracks();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: requestedFacing, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });

      streamRef.current = stream;
      let vid = videoRef.current;
      if (!vid) {
        vid = document.createElement('video');
        vid.playsInline = true;
        vid.muted = true;
        videoRef.current = vid;
      }
      vid.srcObject = stream;

      await new Promise((res, rej) => {
        vid.onloadedmetadata = res;
        vid.onerror = rej;
        setTimeout(() => rej(new Error('Video metadata timeout')), 8000);
      });

      await vid.play();
      setFacing(requestedFacing);
      setPhase('live');
      startLoop();
    } catch (err) {
      releaseTracks();
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPhase('denied');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setErrorMsg('No camera found on this device. Please connect a camera and try again.');
        setPhase('error');
      } else if (err.name === 'OverconstrainedError') {
        openCamera('user');
      } else {
        setErrorMsg(`Camera error: ${err.message || 'Unable to access the camera.'}`);
        setPhase('error');
      }
    }
  }, [facing, releaseTracks, startLoop]);

  // ── Stop camera ───────────────────────────────────────────────────────────
  const stopCamera = useCallback(() => {
    releaseTracks();
    setPhase('idle');
    setToast('');
  }, [releaseTracks]);

  // ── Switch camera ─────────────────────────────────────────────────────────
  const switchCamera = useCallback(() => {
    const next = facing === 'user' ? 'environment' : 'user';
    releaseTracks();
    cancelAnimationFrame(rafRef.current);
    setPhase('loading');
    setTimeout(() => openCamera(next), 120);
  }, [facing, releaseTracks, openCamera]);

  // ── Capture ───────────────────────────────────────────────────────────────
  const capturePhoto = useCallback(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;

    // Freeze snapshot
    const snap = document.createElement('canvas');
    snap.width = cvs.width; snap.height = cvs.height;
    snap.getContext('2d').drawImage(cvs, 0, 0);
    frozenRef.current = snap;

    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());

    const dc = cvs.getContext('2d');
    dc.clearRect(0, 0, cvs.width, cvs.height);
    dc.drawImage(snap, 0, 0);

    setPhase('captured');
    toast$('📸 Photo captured! Download it below.');
  }, [toast$]);

  // ── Retake ────────────────────────────────────────────────────────────────
  const retake = useCallback(() => {
    frozenRef.current = null;
    openCamera(facing);
  }, [facing, openCamera]);

  // ── Download ──────────────────────────────────────────────────────────────
  const downloadPhoto = useCallback(() => {
    const src = frozenRef.current;
    if (!src) { toast$('Capture a photo first!'); return; }

    const mimeType = dlFormat === 'jpeg' ? 'image/jpeg' : 'image/png';
    const ext      = dlFormat === 'jpeg' ? 'jpg' : 'png';

    try {
      const url = src.toDataURL(mimeType, 0.95);
      const a   = document.createElement('a');
      a.href     = url;
      a.download = `nikita-studio-${filterId}-${Date.now()}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast$(`✅ Downloaded as ${a.download}`);
    } catch {
      toast$('Download failed — canvas security restriction.');
    }
  }, [dlFormat, filterId, toast$]);

  const activeFilter = FILTERS.find(f => f.id === filterId) || FILTERS[0];
  const displayedFilters = filterCategory === 'all'
    ? FILTERS
    : FILTERS.filter(f => f.category === filterCategory);

  return (
    <section id="studio" className="studio-section" aria-label="Aesthetic Photo Studio">
      {/* Hidden camera video element */}
      <video ref={videoRef} playsInline muted style={{ display: 'none' }} />

      <div className="container">

        {/* Header */}
        <div className="section-header" style={{ textAlign: 'center' }}>
          <div className="section-eyebrow">
            <Sparkles size={14} aria-hidden="true" />
            <span>Lovely Girl Photo Studio</span>
          </div>
          <h2 className="section-title">Aesthetic Glow &amp; <em>Lovely Girl Filters</em></h2>
          <p className="section-description" style={{ margin: '0 auto' }}>
            Choose from 14 beloved girl filters — viral Snapchat &amp; Instagram cute face AR effects (peach blush, angel crown, floating hearts, bunny girl, kitty cat, golden butterflies), and dewy Korean glass-skin &amp; golden hour tones. 100% private.
          </p>
        </div>

        {/* Toast Notification */}
        {toast && (
          <div className="studio-alert-banner success" role="status" style={{ maxWidth: '720px', margin: '0 auto 1.5rem' }}>
            <Check size={18} /> <span>{toast}</span>
          </div>
        )}

        {/* IDLE STATE */}
        {phase === 'idle' && (
          <div className="studio-idle-card">
            <div className="studio-idle-icon">
              <Camera size={44} strokeWidth={1.3} />
            </div>
            <h3 className="studio-idle-title">Enable Camera &amp; Explore 14 Lovely Filters</h3>
            <p className="studio-idle-desc">
              Experience the most popular filters used by girls — dewy peach blush &amp; freckles, angel sparkle crown, floating pastel hearts, cute bunny girl, golden butterflies, and radiant aesthetic tones with real-time face tracking.
            </p>
            <div className="studio-idle-privacy">
              <ShieldCheck size={16} color="#16A34A" />
              <span>Camera permission is required. Photos stay 100% local on your device.</span>
            </div>
            <button
              type="button"
              className="btn-primary"
              onClick={() => openCamera()}
              style={{ padding: '0.9rem 2.25rem', fontSize: '1rem', marginTop: '0.5rem' }}
            >
              <Camera size={19} />
              <span>Enable Camera &amp; Explore Filters</span>
            </button>
          </div>
        )}

        {/* LOADING STATE */}
        {phase === 'loading' && (
          <div className="studio-idle-card">
            <div className="studio-idle-icon" style={{ animation: 'spin 1.2s linear infinite' }}>
              <Camera size={44} strokeWidth={1.2} />
            </div>
            <h3 className="studio-idle-title">Starting Live Studio…</h3>
            <p className="studio-idle-desc">
              Please allow camera access in the browser permission prompt.
            </p>
          </div>
        )}

        {/* DENIED STATE */}
        {phase === 'denied' && (
          <div className="studio-idle-card">
            <div className="studio-idle-icon" style={{ color: '#DC2626' }}>
              <AlertCircle size={52} strokeWidth={1.2} />
            </div>
            <h3 className="studio-idle-title" style={{ color: '#991B1B' }}>Camera Permission Denied</h3>
            <p className="studio-idle-desc">
              You declined camera access. To use live filters, please allow camera permission
              in your browser's address bar (the camera icon or lock icon), then click Retry.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '0.5rem' }}>
              <button type="button" className="btn-primary" onClick={() => openCamera()}>
                <RefreshCw size={17} /> Retry Permission
              </button>
              <button type="button" className="btn-secondary" onClick={() => setPhase('idle')}>
                Back
              </button>
            </div>
          </div>
        )}

        {/* ERROR STATE */}
        {phase === 'error' && (
          <div className="studio-idle-card">
            <div className="studio-idle-icon" style={{ color: '#D97706' }}>
              <AlertCircle size={52} strokeWidth={1.2} />
            </div>
            <h3 className="studio-idle-title" style={{ color: '#92400E' }}>Camera Unavailable</h3>
            <p className="studio-idle-desc">{errorMsg || 'An unexpected camera error occurred.'}</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '0.5rem' }}>
              <button type="button" className="btn-primary" onClick={() => openCamera()}>
                <RefreshCw size={17} /> Try Again
              </button>
              <button type="button" className="btn-secondary" onClick={() => setPhase('idle')}>
                Back
              </button>
            </div>
          </div>
        )}

        {/* LIVE + CAPTURED STATE */}
        {(phase === 'live' || phase === 'captured') && (
          <div className="studio-container">

            {/* Top controls bar */}
            <div className="studio-top-bar">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>

                {phase === 'live' && (
                  <>
                    <button type="button" className="btn-primary"
                      onClick={capturePhoto}
                      style={{ padding: '0.65rem 1.35rem', fontSize: '0.9rem' }}
                    >
                      <Camera size={17} /> Capture Photo
                    </button>

                    {canFlip && (
                      <button type="button" className="btn-secondary"
                        onClick={switchCamera}
                        style={{ padding: '0.65rem 1.1rem', fontSize: '0.875rem' }}
                        title="Switch front / rear camera"
                      >
                        <SwitchCamera size={16} /> Flip Camera
                      </button>
                    )}

                    <button type="button" className="btn-secondary"
                      onClick={stopCamera}
                      style={{ padding: '0.65rem 1.1rem', fontSize: '0.875rem', borderColor: '#FCA5A5', color: '#991B1B' }}
                    >
                      <X size={16} /> Stop Camera
                    </button>
                  </>
                )}

                {phase === 'captured' && (
                  <>
                    <button type="button" className="btn-secondary"
                      onClick={retake}
                      style={{ padding: '0.65rem 1.25rem', fontSize: '0.875rem' }}
                    >
                      <RotateCcw size={16} /> Retake Photo
                    </button>
                    <button type="button" className="btn-secondary"
                      onClick={stopCamera}
                      style={{ padding: '0.65rem 1.1rem', fontSize: '0.875rem', borderColor: '#FCA5A5', color: '#991B1B' }}
                    >
                      <X size={16} /> Close Studio
                    </button>
                  </>
                )}
              </div>

              <div className="studio-privacy-pill">
                <ShieldCheck size={14} color="#16A34A" />
                <span>100% Local · Never uploaded</span>
              </div>
            </div>

            {/* Workspace */}
            <div className="studio-workspace-grid">

              {/* Viewport Card */}
              <div className="studio-viewport-card">

                {/* Overlay info bar */}
                <div className="viewport-overlay-bar">
                  <div className="active-filter-badge">
                    <span>{activeFilter.icon} {activeFilter.name}</span>
                    <span className="filter-tag-pill" style={{ marginLeft: '4px' }}>{activeFilter.tag}</span>
                    {phase === 'live' && (
                      <>
                        <span className="filter-intensity-tag" style={{ color: '#DC2626', background: '#FEF2F2', borderColor: '#FECACA' }}>
                          ● LIVE
                        </span>
                        <span className={`face-accuracy-tag ${hasFace ? 'calibrated' : ''}`}>
                          <span className="face-indicator-dot"></span>
                          <span>{hasFace ? 'Face Calibrated · Dynamic Scale' : 'Align Face'}</span>
                        </span>
                      </>
                    )}
                    {phase === 'captured' && (
                      <span className="filter-intensity-tag" style={{ color: '#16A34A', background: '#F0FDF4', borderColor: '#BBF7D0' }}>
                        ✓ Captured
                      </span>
                    )}
                  </div>

                  {/* Before/After compare button */}
                  {phase === 'live' && (
                    <button
                      type="button"
                      className={`viewport-tool-btn ${showOriginal ? 'active' : ''}`}
                      onMouseDown={() => setShowOriginal(true)}
                      onMouseUp={() => setShowOriginal(false)}
                      onTouchStart={() => setShowOriginal(true)}
                      onTouchEnd={() => setShowOriginal(false)}
                      title="Hold to preview without filter"
                    >
                      <Eye size={15} /> {showOriginal ? 'Original' : 'Hold to Compare'}
                    </button>
                  )}
                </div>

                {/* Canvas stage */}
                <div className="canvas-stage">
                  <canvas
                    ref={canvasRef}
                    className="filtered-main-canvas"
                    aria-label="Camera preview with filter applied"
                  />
                </div>

                {/* Download bar (captured state only) */}
                {phase === 'captured' && (
                  <div className="viewport-footer-bar">
                    <div className="format-pills">
                      {['png', 'jpeg'].map(f => (
                        <button key={f} type="button"
                          className={`format-pill-btn ${dlFormat === f ? 'active' : ''}`}
                          onClick={() => setDlFormat(f)}
                        >
                          {f.toUpperCase()}
                        </button>
                      ))}
                    </div>
                    <button type="button" className="btn-primary"
                      onClick={downloadPhoto}
                      style={{ padding: '0.7rem 1.5rem' }}
                    >
                      <Download size={17} />
                      <span>Download Photo</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Filter Sidebar */}
              <div className="studio-controls-sidebar">
                <div className="control-card">
                  <div className="control-card-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Sparkles size={16} />
                      <span className="control-label">Lovely Filter Collection</span>
                    </div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {displayedFilters.length} of {FILTERS.length}
                    </span>
                  </div>

                  {/* Category switcher */}
                  <div className="filter-category-pills" role="tablist">
                    <button
                      type="button"
                      className={`cat-pill-btn ${filterCategory === 'all' ? 'active' : ''}`}
                      onClick={() => setFilterCategory('all')}
                    >
                      All ({FILTERS.length})
                    </button>
                    <button
                      type="button"
                      className={`cat-pill-btn ${filterCategory === 'snap' ? 'active' : ''}`}
                      onClick={() => setFilterCategory('snap')}
                    >
                      🎀 Cute AR Face (8)
                    </button>
                    <button
                      type="button"
                      className={`cat-pill-btn ${filterCategory === 'aesthetic' ? 'active' : ''}`}
                      onClick={() => setFilterCategory('aesthetic')}
                    >
                      ✨ Aesthetic Glow (6)
                    </button>
                  </div>


                  {/* Grid of filters */}
                  <div className="filters-grid" role="radiogroup" aria-label="Filters">
                    {displayedFilters.map(f => (
                      <button
                        key={f.id}
                        type="button"
                        role="radio"
                        aria-checked={filterId === f.id}
                        className={`filter-preset-card ${filterId === f.id ? 'selected' : ''}`}
                        onClick={() => setFilterId(f.id)}
                      >
                        <div className="filter-card-top">
                          <span className="filter-emoji">{f.icon}</span>
                          <span className="filter-name">{f.name}</span>
                        </div>
                        <span className="filter-tag-pill">{f.tag}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* How to use */}
                <div className="control-card" style={{ background: 'var(--bg-secondary)', padding: '1.25rem' }}>
                  <p style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: '0.65rem', color: 'var(--text-primary)' }}>
                    Studio Tips
                  </p>
                  {[
                    ['🍑', 'Cute Face AR: Peach Blush, Angel Crown, Floating Hearts, Bunny & Kitty'],
                    ['✨', 'Aesthetic Glows: Korean Glass Skin, Golden Hour Goddess & Pastel Strawberry'],
                    ['👁️', 'Hold "Hold to Compare" to see your live natural vs filtered look'],
                    ['💾', 'Download high-res PNG or JPEG directly to your device without watermark'],
                  ].map(([icon, text]) => (
                    <div key={text} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.815rem', color: 'var(--text-secondary)' }}>
                      <span style={{ flexShrink: 0 }}>{icon}</span>
                      <span>{text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
