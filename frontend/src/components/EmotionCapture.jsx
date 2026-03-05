// src/components/EmotionCapture.jsx

import React, { useState, useEffect, useRef } from "react";
import { Button, Spinner, Alert } from "react-bootstrap";
import * as faceapi from "face-api.js";
import "../assets/styles/EmotionCapture.css";

const EmotionCapture = ({ onCaptureComplete, patientId }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [detectionStatus, setDetectionStatus] = useState("Inicializando cámara...");
  const [faceDetected, setFaceDetected] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);

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

  // 1. Detección visual local (Solo para dibujar el recuadro en el frontend)
  const startContinuousDetection = () => {
    console.log("🔍 [LOCAL] Iniciando bucle de detección facial (SSD)...");
    detectionIntervalRef.current = setInterval(async () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (!video || !canvas || !modelsLoaded) return;

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

          const displaySize = { width: video.videoWidth, height: video.videoHeight };
          if (canvas.width !== displaySize.width) {
            canvas.width = displaySize.width;
            canvas.height = displaySize.height;
            faceapi.matchDimensions(canvas, displaySize);
          }

          const resized = faceapi.resizeResults(detection, displaySize);
          const { x, y, width, height } = resized.box;

          // Dibujamos un recuadro más estético
          ctx.strokeStyle = '#3b82f6'; // Azul primario
          ctx.lineWidth = 3;
          ctx.setLineDash([5, 5]); // Línea punteada para "escaneo"
          ctx.strokeRect(x, y, width, height);

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
        }
      } catch (error) {
        // Silencioso
      }
    };

    // PRIMERA LLAMADA INMEDIATA
    performAnalysis();

    // Luego intervalo rápido de 1 segundo
    pollingIntervalRef.current = setInterval(performAnalysis, 1000);
  };

  const capturePhoto = async () => {
    if (!faceDetected || !currentEmotion) return;

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
        emotion: currentEmotion.emotion,
        confidence: currentEmotion.confidence,
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
      <div className="emotion-capture-card">
        <h2 className="emotion-capture-title">Captura de Estado Emocional</h2>
        <p className="emotion-capture-subtitle">
          Detección inteligente con el nuevo modelo <strong>MobileNetV2</strong>
        </p>

        {isLoading ? (
          <div className="loading-container p-4 text-center">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2">Conectando con el servidor de inteligencia artificial...</p>
          </div>
        ) : (
          <>
            <div className="video-container shadow-lg rounded overflow-hidden">
              <video ref={videoRef} autoPlay muted playsInline className="video-feed" />
              <canvas ref={canvasRef} className="video-canvas" />

              {currentEmotion && (
                <div className="emotion-overlay-premium">
                  <div className="emotion-badge-modern">
                    <span className="emotion-emoji-large">{getEmotionEmoji(currentEmotion.emotion)}</span>
                    <div className="emotion-info-text">
                      <div className="emotion-name">{getEmotionLabel(currentEmotion.emotion)}</div>
                      <div className="emotion-conf">{currentEmotion.confidence}% de confianza</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Alert variant={faceDetected || currentEmotion ? "success" : "warning"} className="detection-status-banner mt-4">
              {faceDetected || currentEmotion ? (
                <span><strong>{detectionStatus}</strong></span>
              ) : (
                <span><Spinner animation="grow" size="sm" className="me-2" /> Esperando detección de rostro...</span>
              )}
            </Alert>

            <div className="capture-actions mt-4 d-flex gap-3 justify-content-center">
              <Button
                variant="primary"
                size="lg"
                onClick={capturePhoto}
                disabled={!faceDetected || !currentEmotion}
                className="btn-capture-moca"
              >
                Capturar y Comenzar Test
              </Button>
              <Button
                variant="outline-secondary"
                size="lg"
                onClick={() => onCaptureComplete({ skipped: true })}
                className="btn-skip-moca"
              >
                Saltar
              </Button>
            </div>

            <div className="tips-section mt-4 text-muted">
              <small>💡 Tu estado emocional ayuda a contextualizar mejor los resultados del test MoCA.</small>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default EmotionCapture;
