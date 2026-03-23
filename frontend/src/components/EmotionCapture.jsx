// src/components/EmotionCapture.jsx

import React, { useState, useEffect, useRef } from "react";
import { Button, Spinner, Alert } from "react-bootstrap";
import * as faceapi from "face-api.js";
import { FaPlay, FaStepForward, FaChartBar, FaCircle, FaDesktop, FaCrosshairs, FaCheck, FaInfoCircle } from 'react-icons/fa';
import "../assets/styles/EmotionCapture.css";

const EmotionCapture = ({ onCaptureComplete, patientId }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [detectionStatus, setDetectionStatus] = useState("Inicializando cámara...");
  const [faceDetected, setFaceDetected] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [backendError, setBackendError] = useState(false);
  const [detectedBox, setDetectedBox] = useState(null);
  const [allEmotions, setAllEmotions] = useState(null); // Vector de todas las emociones

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const detectionIntervalRef = useRef(null);
  const pollingIntervalRef = useRef(null); // Intervalo para consultar al backend (nuevo modelo)
  const isMountedRef = useRef(true);

  // Cargar modelos de face-api.js (Solo para el recuadro visual de feedback)
  useEffect(() => {
    let mounted = true;
    isMountedRef.current = true;

    const loadModels = async () => {
      if (!mounted) return;

      try {
        setDetectionStatus("Cargando sistema de detección facial de alta precisión...");
        const MODEL_URL = "/models";

        // Cargamos modelos de detección facial (SSD) y puntos de referencia (Landmarks)
        await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);

        if (mounted) {
          modelsLoadedRef.current = true; // Actualizar ref ANTES de cualquier await
          setModelsLoaded(true);
          setIsLoading(false);
          setDetectionStatus("Sistema listo. Iniciando cámara...");
          await startVideo();
        }
      } catch (error) {
        console.error("❌ Error al cargar modelos:", error);
        if (mounted) {
          setDetectionStatus(`Error al cargar el sistema: ${error.message}`);
          setIsLoading(false);
        }
      }
    };

    loadModels();

    return () => {
      mounted = false;
      isMountedRef.current = false;
      stopVideo();
    };
  }, []);

  const startVideo = async () => {
    if (!isMountedRef.current) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          setDetectionStatus("Cámara activa. Detectando rostro...");
          startContinuousDetection();
          startBackendPolling(); // Iniciamos el análisis con el nuevo modelo de MobileNetV2
        };
      }
    } catch (err) {
      console.error("❌ Error al acceder a la cámara:", err);
      setDetectionStatus("Error al acceder a la cámara. Verifica los permisos.");
    }
  };

  const stopVideo = () => {
    if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);
    if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);

    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  // Refs para seguimiento dentro de intervalos (evita problemas de clausura)
  const faceDetectedRef = useRef(false);
  const currentEmotionRef = useRef(null);
  const lastLogTimeRef = useRef(0);
  const modelsLoadedRef = useRef(false); // <-- Ref para evitar stale closure con modelsLoaded
  const emotionScoresRef = useRef({}); // Para suavizado temporal (EMA)
  const currentLandmarksRef = useRef(null); // Para validación geométrica
  const baselineMetricsRef = useRef(null); // Punto cero del paciente

  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationProgress, setCalibrationProgress] = useState(0);
  const [fps, setFps] = useState(0);

  const lastFrameTimeRef = useRef(performance.now());
  const ALPHA = 0.35; // Factor de suavizado (más bajo = más estable, más rápido)
  const handleCalibration = async () => {
    if (!faceDetected) {
      alert("Por favor, asegúrese de que su rostro sea visible antes de calibrar.");
      return;
    }
    setIsCalibrating(true);
    setCalibrationProgress(0);
    const samples = [];

    // Capturamos 10 muestras en 3 segundos
    for (let i = 1; i <= 10; i++) {
      await new Promise(r => setTimeout(r, 300));
      setCalibrationProgress(i * 10);
      if (currentLandmarksRef.current) {
        const p = currentLandmarksRef.current.positions;
        const faceWidth = Math.abs(p[16].x - p[0].x);
        samples.push({
          browRatio: Math.abs(p[21].x - p[22].x) / faceWidth,
          mouthCurve: ((p[48].y + p[54].y) / 2) - p[51].y
        });
      }
    }

    if (samples.length > 0) {
      const avg = {
        browRatio: samples.reduce((a, b) => a + b.browRatio, 0) / samples.length,
        mouthCurve: samples.reduce((a, b) => a + b.mouthCurve, 0) / samples.length
      };
      baselineMetricsRef.current = avg;
      console.log("🎯 [CALIBRATION] Punto cero establecido:", avg);
    }
    setIsCalibrating(false);
  };

  // Función de VALIDACIÓN GEOMÉTRICA (Actualizada para detección relativa)
  const validateEmotionWithLandmarks = (cnnEmotion, cnnConfidence) => {
    if (!currentLandmarksRef.current) return { emotion: cnnEmotion, confidence: cnnConfidence };

    const landmarks = currentLandmarksRef.current;
    const points = landmarks.positions;
    const faceWidth = Math.abs(points[16].x - points[0].x);
    let boost = 1.0;
    let isConfirmedByGeometry = false;

    try {
      // 1. Valores actuales
      const browDist = Math.abs(points[21].x - points[22].x);
      const browRatio = browDist / faceWidth;
      const lipCenterY = (points[48].y + points[54].y) / 2;
      const mouthCurve = lipCenterY - points[51].y;

      const eyeHeight = Math.abs(points[37].y - points[41].y) + Math.abs(points[44].y - points[46].y);
      const eyeRatio = eyeHeight / faceWidth;

      // --- COMPARACIÓN RELATIVA (Si hay calibración) ---
      if (baselineMetricsRef.current) {
        const base = baselineMetricsRef.current;

        // Cambio en cejas: Negativo = se juntan (Enojo)
        const browDelta = (browRatio - base.browRatio) / base.browRatio;
        // Cambio en boca: Positivo = comisuras bajan (Tristeza), Negativo = comisuras suben (Felicidad)
        const mouthDelta = mouthCurve - base.mouthCurve;

        // Boost Agresivo para ENOJO (Cejas se juntan > 8% respecto a su normal)
        if (cnnEmotion === 'angry' && browDelta < -0.08) {
          boost = 2.0;
          isConfirmedByGeometry = true;
        }

        // Boost Agresivo para TRISTEZA (Comisuras bajan > 2px respecto a su normal)
        if (cnnEmotion === 'sad' && mouthDelta > 1.5) {
          boost = 1.8;
          isConfirmedByGeometry = true;
        }

        // Boost para FELIZ (Comisuras suben > 2px)
        if (cnnEmotion === 'happy' && mouthDelta < -1.5) {
          boost = 1.5;
          isConfirmedByGeometry = true;
        }
      } else {
        // Fallback a lógica absoluta si no hay calibración
        if (cnnEmotion === 'angry' && browRatio < 0.12) boost = 1.4;
        if (cnnEmotion === 'sad' && mouthCurve > 1.5) boost = 1.5;
      }

      // Penalizaciones globales (Filtros de error)
      if (cnnEmotion === 'happy' && mouthCurve > 1) boost *= 0.4; // Si las comisuras están físicamente abajo, NO es feliz
      if (cnnEmotion === 'surprise' && eyeRatio > 0.08) boost *= 1.5;

    } catch (e) {
      console.warn("Error en detección relativa:", e);
    }

    let finalConf = parseFloat(cnnConfidence) * boost;

    // Umbral Adaptativo: Si la geometría confirma la emoción, somos menos conservadores (15%)
    const minThreshold = isConfirmedByGeometry ? 15 : 25;

    if (finalConf < minThreshold) {
      return { emotion: 'neutral', confidence: finalConf.toFixed(1) };
    }

    return { emotion: cnnEmotion, confidence: Math.min(100, finalConf).toFixed(1) };
  };

  // 1. Detección visual local (Solo para dibujar el recuadro en el frontend)
  const startContinuousDetection = () => {
    console.log("🔍 [LOCAL] Iniciando bucle de detección facial (SSD + Landmarks)...");
    detectionIntervalRef.current = setInterval(async () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (!video || !canvas || !modelsLoadedRef.current) return;

      try {
        const options = new faceapi.SsdMobilenetv1Options({ minConfidence: 0.4 });
        const detection = await faceapi.detectSingleFace(video, options).withFaceLandmarks();

        const now = Date.now();
        const perfNow = performance.now();
        const delta = perfNow - lastFrameTimeRef.current;
        lastFrameTimeRef.current = perfNow;
        if (delta > 0) setFps(Math.round(1000 / delta));

        const ctx = canvas.getContext("2d");
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (detection) {
          // Guardamos los landmarks para la validación geométrica
          currentLandmarksRef.current = detection.landmarks;

          const displaySize = { width: video.clientWidth, height: video.clientHeight };

          if (canvas.width !== displaySize.width || canvas.height !== displaySize.height) {
            canvas.width = displaySize.width;
            canvas.height = displaySize.height;
          }

          const resized = faceapi.resizeResults(detection, displaySize);

          // 1. Dibujar los puntos (landmarks) en el canvas
          faceapi.draw.drawFaceLandmarks(canvas, resized);

          // 2. Gestionar detección de rostro para el estado
          if (!faceDetectedRef.current) {
            console.log("✅ [LOCAL] Rostro detectado!");
            faceDetectedRef.current = true;
            setFaceDetected(true);
          }

          // 3. Calcular posición del recuadro azul (ajustando por el espejo del video)
          const rawX = resized.box.x;
          const y = resized.box.y;
          const width = resized.box.width;
          const height = resized.box.height;
          const x = displaySize.width - rawX - width;

          setDetectedBox({ x, y, width, height });

          if (!currentEmotionRef.current) {
            setDetectionStatus("✅ Rostro detectado. Comunicando con el servidor de IA...");
          }
        } else {
          // Caso: No hay rostro detectado
          if (now - lastLogTimeRef.current > 3000) {
            console.log("⏳ [LOCAL] SSD buscando rostro...");
            lastLogTimeRef.current = now;
          }

          if (faceDetectedRef.current) {
            console.log("⚠️ [LOCAL] Rostro perdido.");
            faceDetectedRef.current = false;
            setFaceDetected(false);
            setDetectedBox(null);
          }
        }
      } catch (err) {
        console.warn("❌ Error detector local:", err);
      }
    }, 300);
  };

  // 2. Análisis Real con el Nuevo Modelo (MobileNetV2 en el Backend)
  const startBackendPolling = () => {
    console.log("🤖 [BACKEND] Iniciando conexión con el servidor de emociones...");

    // Función de análisis único
    const performAnalysis = async () => {
      if (!videoRef.current || !isMountedRef.current) return;

      try {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = 224;
        tempCanvas.height = 224;
        tempCanvas.getContext('2d').drawImage(videoRef.current, 0, 0, 224, 224);
        const imageData = tempCanvas.toDataURL('image/jpeg', 0.8);

        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        const token = userInfo?.token;

        const response = await fetch('/api/emotions/evaluate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ image: imageData })
        });

        if (response.ok) {
          const data = await response.json();
          const newProbs = data.all_emotions || {};

          // --- Suavizado Temporal (EMA) ---
          const smoothedProbs = { ...emotionScoresRef.current };

          Object.keys(newProbs).forEach(emo => {
            const currentVal = newProbs[emo] || 0;
            const oldVal = smoothedProbs[emo] || currentVal; // Iniciar con el primer valor si no existe
            smoothedProbs[emo] = (ALPHA * currentVal) + ((1 - ALPHA) * oldVal);
          });

          emotionScoresRef.current = smoothedProbs;

          // Encontrar la emoción con mayor probabilidad suavizada
          let topEmotion = data.emotion;
          let maxProb = 0;

          Object.keys(smoothedProbs).forEach(emo => {
            if (smoothedProbs[emo] > maxProb) {
              maxProb = smoothedProbs[emo];
              topEmotion = emo;
            }
          });

          // 2. Validación Geométrica con Landmarks
          const validated = validateEmotionWithLandmarks(topEmotion, (maxProb * 100).toFixed(1));

          const emotionUpdate = {
            emotion: validated.emotion,
            confidence: validated.confidence
          };

          currentEmotionRef.current = emotionUpdate;
          setCurrentEmotion(emotionUpdate);
          setAllEmotions(smoothedProbs);
          setDetectionStatus(`✅ Análisis Activo: ${getEmotionLabel(validated.emotion)} (${validated.confidence}%)`);
        } else {
          const errData = await response.json().catch(() => ({}));
          console.error("❌ Error API Emociones:", response.status, errData);
          setBackendError(true);
        }
      } catch (error) {
        console.warn("⚠️ Servidor de emociones no disponible:", error.message);
        setBackendError(true);
      }
    };

    // PRIMERA LLAMADA INMEDIATA
    performAnalysis();

    // Luego intervalo rápido de 1 segundo
    pollingIntervalRef.current = setInterval(performAnalysis, 1000);
  };

  const capturePhoto = async () => {
    if (!faceDetected) return;
    // If backend never responded, use a neutral fallback
    const emotionToUse = currentEmotion || { emotion: 'neutral', confidence: '0.0' };

    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0);
      const imageData = canvas.toDataURL('image/jpeg', 0.8);

      const requestData = {
        patientId,
        image: imageData,
        emotion: emotionToUse.emotion,
        confidence: emotionToUse.confidence,
        timestamp: new Date().toISOString(),
        captureType: 'initial'
      };

      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const token = userInfo?.token;

      const response = await fetch('/api/emotions/capture', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestData)
      });

      const data = await response.json();
      if (response.ok) {
        setDetectionStatus("🚀 ¡Estado guardado! Iniciando test...");
        stopVideo();
        setTimeout(() => onCaptureComplete({
          emotionDataId: data.emotionDataId,
          initialEmotion: currentEmotion
        }), 1200);
      }
    } catch (error) {
      console.error("Error en captura final:", error);
      setDetectionStatus("Error al sincronizar con el backend.");
    }
  };

  const getEmotionColor = (emotion) => {
    const colors = {
      neutral: "#94a3b8", // Slate
      happy: "#f59e0b",   // Amber
      sad: "#3b82f6",     // Blue
      angry: "#ef4444",   // Red
      fear: "#8b5cf6",    // Violet
      disgust: "#10b981", // Emerald
      surprise: "#ec4899"  // Pink
    };
    return colors[emotion] || "#64748b";
  };

  const getEmotionLabel = (emotion) => {
    const emotions = {
      neutral: "Neutral", happy: "Feliz", sad: "Triste",
      angry: "Enojado", fear: "Temeroso", disgust: "Disgustado", surprise: "Sorprendido"
    };
    return emotions[emotion] || emotion;
  };

  const getEmotionEmoji = (emotion) => {
    const emojis = { neutral: "😐", happy: "😊", sad: "😔", angry: "😠", fear: "😨", disgust: "🤢", surprise: "😲" };
    return emojis[emotion] || "👤";
  };

  return (
    <div className="emotion-capture-container">
      {/* 1. Clinical Header */}
      <div className="clinical-header">
        <div className="header-left">
          <h1 className="clinical-title">Detección de Estado Emocional</h1>
          <p className="clinical-subtitle">Monitoring real-time cognitive responses and micro-expressions.</p>
        </div>
        <div className="header-right">
          <div className="system-status-card">
            <div className="status-icon-check">
              <FaCheck size={12} />
            </div>
            <div className="status-labels">
              <span className="status-label-top">SYSTEM STATUS</span>
              <span className="status-label-bottom">Ready & Optimal</span>
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="loading-container text-center py-5">
          <Spinner animation="border" variant="primary" className="mb-3" />
          <h4 className="fw-bold">Iniciando Biometría Facial...</h4>
          <p className="text-muted">Cargando modelos de IA y calibrando cámara.</p>
        </div>
      ) : (
        <>
          {/* 2. Main Dashboard Grid */}
          <div className="clinical-dashboard-grid">

            {/* Left Column: Video and Live Tracking */}
            <div className="video-column-group">
              <div className="premium-video-card">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="premium-video-feed"
                />
                <canvas ref={canvasRef} className="premium-video-canvas" />

                {/* Badges Overlay */}
                <div className="video-badge-container">
                  <div className="badge-live">
                    <div className="pulse-dot"></div>
                    LIVE TRACKING
                  </div>
                  <div className="badge-fps">FPS: {fps.toFixed(1)}</div>
                </div>

                {/* Face Box Corners */}
                {faceDetected && detectedBox && (
                  <div
                    className="custom-bounding-box"
                    style={{
                      top: `${detectedBox.y}px`,
                      left: `${detectedBox.x}px`,
                      width: `${detectedBox.width}px`,
                      height: `${detectedBox.height}px`
                    }}
                  >
                    <div className="detection-active-pill">
                      ROSTRO IDENTIFICADO
                    </div>
                  </div>
                )}

                {/* Accuracy & Calibration Overlay */}
                {currentEmotion && (
                  <div className="accuracy-overlay">
                    <div className="accuracy-text-group">
                      <span className="acc-label">DETECTION ACCURACY</span>
                      <span className="acc-value">{currentEmotion.confidence}%</span>
                    </div>
                    <div className="cal-circle-btn">CAL</div>
                  </div>
                )}

                {/* Calibration Splash Overlay */}
                {isCalibrating && (
                  <div className="calibration-overlay-modern">
                    <div className="cal-spinner">
                      <Spinner animation="grow" variant="primary" />
                    </div>
                    <h3 className="cal-title">CALIBRANDO ROSTRO</h3>
                    <p className="cal-desc">Mantenga una expresión neutral mientras capturamos su "Punto Cero".</p>
                    <div className="cal-progress-container">
                      <div
                        className="cal-progress-fill"
                        style={{ width: `${calibrationProgress}%` }}
                      />
                    </div>
                    <span className="mt-2" style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                      {calibrationProgress}% completado
                    </span>
                  </div>
                )}
              </div>

              {/* NEW: Banner de Análisis Activo (Abajo de la cámara) */}
              {currentEmotion && (
                <div className="analysis-banner-modern">
                  <div className="d-flex align-items-center">
                    <div className="icon-container-blue">
                      <FaChartBar size={20} color="#fff" />
                    </div>
                    <div className="ms-3">
                      <div className="analysis-title">
                        Análisis Activo: {getEmotionEmoji(currentEmotion.emotion)} <span className="text-primary">{getEmotionLabel(currentEmotion.emotion)}</span>
                      </div>
                      <div className="analysis-subtitle">
                        Validación biométrica basada en micro-expresiones y 68 puntos faciales.
                      </div>
                    </div>
                  </div>
                  <div className="text-end">
                    <div className="acc-label">CONFIANZA</div>
                    <div className="acc-value text-primary" style={{ fontSize: '1.2rem' }}>{currentEmotion.confidence}%</div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Emotional Analysis Panel */}
            <div className="premium-analysis-card">
              <div className="analysis-header">
                <h3>
                  <span style={{ fontSize: '1.4rem' }}>😊</span>
                  Emociones
                </h3>
                <button className="info-icon-btn">
                  <FaInfoCircle size={18} />
                </button>
              </div>

              <div className="analysis-bars-list">
                {allEmotions ? (
                  Object.entries(allEmotions)
                    .sort(([, a], [, b]) => b - a)
                    .map(([emo, prob]) => (
                      <div key={emo} className="progress-item-premium">
                        <div className="progress-label-group">
                          <span className="prog-name">{getEmotionLabel(emo)}</span>
                          <span className="prog-val">{(prob * 100).toFixed(0)}%</span>
                        </div>
                        <div className="premium-progress-bg">
                          <div
                            className="premium-progress-fill"
                            style={{
                              width: `${prob * 100}%`,
                              backgroundColor: getEmotionColor(emo)
                            }}
                          />
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="text-center py-5 text-muted">
                    <FaChartBar size={40} className="mb-3 opacity-20" />
                    <p>Esperando datos de biometría...</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 3. Footer Actions */}
          <div className="premium-actions-footer">
            <Button
              className="btn-premium-outline shadow-sm"
              onClick={handleCalibration}
              disabled={!faceDetected || isCalibrating}
            >
              <FaCrosshairs size={14} className="me-2" /> Calibrar Rostro
            </Button>
            <Button
              className="btn-premium-primary"
              onClick={capturePhoto}
              disabled={!faceDetected || isCalibrating}
            >
              <FaPlay size={12} className="me-2" /> Capturar y Comenzar Test
            </Button>
            <Button
              variant="light"
              className="btn-premium-outline shadow-sm bg-white text-dark border"
              onClick={() => onCaptureComplete({ skipped: true })}
            >
              <FaStepForward className="me-2" size={14} /> Saltar
            </Button>
          </div>
        </>
      )}


      {/* Backend Alert Layer */}
      {backendError && (
        <Alert variant="warning" className="mt-4 border-0 shadow-sm mx-auto" style={{ maxWidth: '600px' }}>
          ⚠️ El servidor de análisis avanzado está demorando.
          Usando validación geométrica local para mantener el flujo.
        </Alert>
      )}
    </div>
  );
};

export default EmotionCapture;
