/**
 * useFaceLandmarker — React hook for MediaPipe Face Landmarker
 *
 * Loads the WASM/model from CDN (jsdelivr → unpkg fallback).
 * Exposes { detect, status, error } where:
 *   detect(videoEl) → NormalizedLandmark[][] | null
 *   status: 'idle' | 'loading' | 'ready' | 'error' | 'unsupported'
 */

import { useEffect, useRef, useState, useCallback } from 'react';

const MODEL_CDN =
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm';
const MODEL_PATH =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';

export function useFaceLandmarker() {
  const [status, setStatus] = useState('idle'); // 'idle'|'loading'|'ready'|'error'|'unsupported'
  const [error, setError]   = useState('');
  const landmarkerRef = useRef(null);
  const lastVideoTimeRef = useRef(-1);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        setStatus('loading');

        // Dynamic import of @mediapipe/tasks-vision (installed package)
        const { FaceLandmarker, FilesetResolver } =
          await import('@mediapipe/tasks-vision');

        // Resolve WASM from CDN so we don't bundle 8 MB of WASM
        const vision = await FilesetResolver.forVisionTasks(MODEL_CDN);

        const lm = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: MODEL_PATH,
            delegate: 'GPU',
          },
          outputFaceBlendshapes: false,
          runningMode: 'VIDEO',
          numFaces: 1,
        });

        if (!cancelled) {
          landmarkerRef.current = lm;
          setStatus('ready');
        } else {
          lm.close();
        }
      } catch (err) {
        if (!cancelled) {
          console.warn('[FaceLandmarker] Init failed:', err.message || err);
          setStatus('error');
          setError(err.message || 'Model load failed');
        }
      }
    }

    init();
    return () => {
      cancelled = true;
      landmarkerRef.current?.close();
      landmarkerRef.current = null;
    };
  }, []);

  const lastResultRef = useRef(null);
  const consecutiveMissesRef = useRef(0);

  /** detect(videoEl) — call every rAF tick when video is playing */
  const detect = useCallback((videoEl) => {
    const lm = landmarkerRef.current;
    if (!lm || !videoEl || videoEl.readyState < 2 || videoEl.paused) {
      return lastResultRef.current;
    }

    if (videoEl.currentTime !== lastVideoTimeRef.current) {
      lastVideoTimeRef.current = videoEl.currentTime;
      try {
        const now = performance.now();
        const result = lm.detectForVideo(videoEl, now);
        if (result?.faceLandmarks && result.faceLandmarks.length > 0) {
          lastResultRef.current = result.faceLandmarks[0];
          consecutiveMissesRef.current = 0;
        } else {
          consecutiveMissesRef.current++;
          // If no face found for 3 consecutive frames, clear so it doesn't stay stuck!
          if (consecutiveMissesRef.current > 2) {
            lastResultRef.current = null;
          }
        }
      } catch (e) {
        // preserve or handle error
      }
    }
    return lastResultRef.current;
  }, []);

  return { detect, status, error };
}
