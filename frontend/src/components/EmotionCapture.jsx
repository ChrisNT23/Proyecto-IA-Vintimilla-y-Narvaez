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
        setDetectionStatus("Cargando sistema de detección facial...");
        const MODEL_URL = "/models";

        // Cargamos solo el detector de rostros (TinyFaceDetector) para el feedback visual
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);

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
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  // 1. Detección visual local (Solo para dibujar el recuadro en el frontend)
  const startContinuousDetection = () => {
    detectionIntervalRef.current = setInterval(async () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (!video || !canvas || !modelsLoaded) return;

      try {
        const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.2 });
        const detection = await faceapi.detectSingleFace(video, options);

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (detection) {
          setFaceDetected(true);
          const displaySize = { width: video.videoWidth, height: video.videoHeight };

          if (canvas.width !== displaySize.width) {
            canvas.width = displaySize.width;
            canvas.height = displaySize.height;
            faceapi.matchDimensions(canvas, displaySize);
          }

          const resizedDetection = faceapi.resizeResults(detection, displaySize);
          const { x, y, width, height } = resizedDetection.box;

          ctx.strokeStyle = '#22c55e';
          ctx.lineWidth = 4;
          ctx.strokeRect(x, y, width, height);

          // Feedback inmediato mientras llega la emoción del backend
          if (!currentEmotion) {
            setDetectionStatus("✅ Rostro detectado. Analizando emociones...");
          }
        } else {
          setFaceDetected(false);
        }
      } catch (err) {
        console.warn("Error en detección facial local:", err);
      }
    }, 300);
  };

  // 2. Análisis Real con el Nuevo Modelo (MobileNetV2 en el Backend)
  const startBackendPolling = () => {
    // Consulta al backend cada 1.5 segundos para actualización en tiempo real
    pollingIntervalRef.current = setInterval(async () => {
      if (!faceDetected || !videoRef.current || !isMountedRef.current) return;

      try {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = 224;
        tempCanvas.height = 224;
        const ctx = tempCanvas.getContext('2d');
        ctx.drawImage(videoRef.current, 0, 0, 224, 224);
        const imageData = tempCanvas.toDataURL('image/jpeg', 0.8);

        // Llamamos al backend de Node.js que sirve de proxy al servidor Python
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
          // El backend de Node ya nos devuelve la confianza 0-1 (o ajustada)
          setCurrentEmotion({
            emotion: data.emotion,
            confidence: (data.confidence * 100).toFixed(1)
          });
          setDetectionStatus(`✅ Rostro detectado: ${getEmotionLabel(data.emotion)} (${(data.confidence * 100).toFixed(1)}%)`);
        }
      } catch (error) {
        console.warn("Error en polling de emociones:", error.message);
      }
    }, 1500);
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

            <Alert variant={faceDetected ? "success" : "warning"} className="detection-status-banner mt-4">
              {faceDetected ? (
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
