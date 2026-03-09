// src/components/EmotionCapture.jsx

import React, { useState, useEffect, useRef } from "react";
import { Button, Spinner, Alert } from "react-bootstrap";
import * as faceapi from "face-api.js";
import { FaPlay, FaStepForward, FaChartBar, FaCircle, FaDesktop } from 'react-icons/fa';
import "../assets/styles/EmotionCapture.css";

const EmotionCapture = ({ onCaptureComplete, patientId }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [detectionStatus, setDetectionStatus] = useState("Inicializando cámara...");
  const [faceDetected, setFaceDetected] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [backendError, setBackendError] = useState(false); 
  const [detectedBox, setDetectedBox] = useState(null);

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

        // Cambiamos a SSD MobileNet V1 para mucha mayor precisión con lentes/audífonos
        await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);

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

  // 1. Detección visual local (Solo para dibujar el recuadro en el frontend)
  const startContinuousDetection = () => {
    console.log("🔍 [LOCAL] Iniciando bucle de detección facial (SSD)...");
    detectionIntervalRef.current = setInterval(async () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (!video || !canvas || !modelsLoadedRef.current) return;

      try {
        // SSD MobileNet V1 es mucho más robusto que TinyFaceDetector
        const options = new faceapi.SsdMobilenetv1Options({ minConfidence: 0.4 });
        const detection = await faceapi.detectSingleFace(video, options);

        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const now = Date.now();
        if (detection) {
          if (!faceDetectedRef.current) {
            console.log("✅ [LOCAL] Rostro detectado!");
            faceDetectedRef.current = true;
            setFaceDetected(true);
          }

          const displaySize = { width: video.clientWidth, height: video.clientHeight };

          const resized = faceapi.resizeResults(detection, displaySize);
          const rawX = resized.box.x;
          const y = resized.box.y;
          const width = resized.box.width;
          const height = resized.box.height;

          // Invertir X por el transform: scaleX(-1) del video feed
          const x = displaySize.width - rawX - width;

          setDetectedBox({ x, y, width, height });

          if (!currentEmotionRef.current) {
            setDetectionStatus("✅ Rostro detectado. Comunicando con el servidor de IA...");
          }
        } else {
          // Log de diagnóstico cada 3 segundos
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
    }, 300); // 300ms es suficiente para SSD
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
          const emotionUpdate = {
            emotion: data.emotion,
            confidence: (data.confidence * 100).toFixed(1)
          };

          currentEmotionRef.current = emotionUpdate;
          setCurrentEmotion(emotionUpdate);
          setDetectionStatus(`✅ Análisis Activo: ${getEmotionLabel(data.emotion)} (${emotionUpdate.confidence}%)`);
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
      <div className="d-flex flex-column align-items-center mb-4">
        <h2 className="emotion-capture-title-light">Detección de Estado Emocional</h2>
        <p className="emotion-capture-subtitle-light">
          Posicione el rostro del paciente frente a la cámara para iniciar el análisis.
        </p>
      </div>

      <div className="emotion-card-light">
        {isLoading ? (
          <div className="loading-container p-4 text-center">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2 text-muted">Conectando con el servidor de inteligencia artificial...</p>
          </div>
        ) : (
          <>
            <div className="video-section">
              <div className="live-badge">
                <FaCircle color="#10b981" size={10} className="me-2 pulse-dot" /> Sistema en vivo
              </div>
              
              <div style={{ position: 'relative', display: 'inline-block', maxWidth: '100%', lineHeight: 0 }}>
                <video ref={videoRef} autoPlay muted playsInline className="video-feed" />
                <canvas ref={canvasRef} style={{ display: 'none' }} />

                {detectedBox && (
                  <div 
                    className="custom-bounding-box" 
                    style={{ 
                      left: `${detectedBox.x}px`, 
                      top: `${detectedBox.y}px`, 
                      width: `${detectedBox.width}px`, 
                      height: `${detectedBox.height}px` 
                    }}
                  >
                    <div className="detection-active-pill">
                      <FaDesktop size={12} className="me-1" /> DETECCIÓN ACTIVA
                    </div>
                    {/* El emotion pill se movió a la sección de abajo por recomendación */}
                  </div>
                )}
              </div>
            </div>

            <div className="info-section">
              {backendError && (
                <div className="alert alert-warning m-3 text-center" style={{fontSize: '14px', borderRadius: '8px'}}>
                  ⚠️ El servidor de análisis emocional no está disponible.
                </div>
              )}
              
              {!currentEmotion && !backendError ? (
                <div className="text-center text-muted m-4 d-flex align-items-center justify-content-center">
                  <Spinner animation="grow" variant="primary" size="sm" className="me-2" /> 
                  Esperando detección y análisis del rostro...
                </div>
              ) : (
                currentEmotion && (
                  <div className="analysis-banner-modern d-flex flex-column flex-md-row justify-content-between align-items-md-center px-4 py-3">
                    <div className="d-flex align-items-center mb-3 mb-md-0">
                      <div className="icon-container-blue">
                        <FaChartBar size={18} color="#fff" />
                      </div>
                      <div className="ms-3">
                        <div className="analysis-title d-flex align-items-center">
                          Análisis Activo: 
                          <span className="ms-2 me-2" style={{ fontSize: '1.3rem' }}>{getEmotionEmoji(currentEmotion.emotion)}</span>
                          <span className="text-primary">{getEmotionLabel(currentEmotion.emotion)} ({currentEmotion.confidence}%)</span>
                        </div>
                        <div className="analysis-subtitle">
                          Confianza del modelo basada en 48 puntos faciales.
                        </div>
                      </div>
                    </div>
                    
                    <div className="confidence-meter ms-md-4" style={{width: '200px'}}>
                      <div className="d-flex justify-content-between mb-1">
                        <span className="conf-label text-muted" style={{fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px'}}>NIVEL DE CONFIANZA</span>
                        <span className="conf-value text-primary fw-bold" style={{fontSize: '12px'}}>{currentEmotion.confidence}%</span>
                      </div>
                      <div className="progress" style={{ height: '6px', borderRadius: '4px', backgroundColor: '#e2e8f0' }}>
                        <div 
                          className="progress-bar bg-primary" 
                          role="progressbar" 
                          style={{ width: `${currentEmotion.confidence}%`, borderRadius: '4px' }}
                          aria-valuenow={currentEmotion.confidence} 
                          aria-valuemin="0" 
                          aria-valuemax="100"
                        ></div>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          </>
        )}
      </div>

      {!isLoading && (
        <div className="capture-actions mt-4 d-flex gap-3 justify-content-center">
          <Button
            variant="primary"
            size="lg"
            onClick={capturePhoto}
            disabled={!faceDetected}
            className="btn-capture-moca d-flex align-items-center"
          >
            <FaPlay className="me-2" size={14} /> Capturar y Comenzar Test
          </Button>
          <Button
            variant="light"
            size="lg"
            onClick={() => onCaptureComplete({ skipped: true })}
            className="btn-skip-moca d-flex align-items-center bg-white text-dark shadow-sm border"
          >
            <FaStepForward className="me-2" size={14} /> Saltar
          </Button>
        </div>
      )}

      <div className="tips-section mt-5 text-muted text-center" style={{fontSize: '13px'}}>
        © 2024 MoCA Cognitive Assessment Platform. Todos los derechos reservados.
      </div>
    </div>
  );
};

export default EmotionCapture;
