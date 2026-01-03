// src/components/EmotionCapture.jsx

import React, { useState, useEffect, useRef } from "react";
import { Button, Spinner, Alert } from "react-bootstrap";
import * as faceapi from "face-api.js";
import "../assets/styles/EmotionCapture.css";

const EmotionCapture = ({ onCaptureComplete, patientId }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isCapturing, setIsCapturing] = useState(false);
  const [detectionStatus, setDetectionStatus] = useState("Inicializando cámara...");
  const [faceDetected, setFaceDetected] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const detectionIntervalRef = useRef(null);
  const isMountedRef = useRef(true);

  // Cargar modelos de face-api.js
  useEffect(() => {
    let mounted = true;
    isMountedRef.current = true;

    const loadModels = async () => {
      if (!mounted) return;
      
      try {
        setDetectionStatus("Cargando modelos de IA...");
        const MODEL_URL = "/models";
        
        console.log("Cargando TinyFaceDetector...");
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        if (!mounted) return;
        
        console.log("Cargando FaceLandmark68Net...");
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        if (!mounted) return;
        
        console.log("Cargando FaceExpressionNet...");
        await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
        if (!mounted) return;
        
        console.log("✅ Todos los modelos cargados exitosamente");
        setModelsLoaded(true);
        setIsLoading(false);
        setDetectionStatus("Modelos cargados. Iniciando cámara...");
        
        if (mounted) {
          await startVideo();
        }
      } catch (error) {
        console.error("❌ Error al cargar modelos:", error);
        if (mounted) {
          setDetectionStatus("Error al cargar los modelos: " + error.message);
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
      console.log("Solicitando acceso a la cámara...");
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        } 
      });
      
      if (!isMountedRef.current || !videoRef.current) {
        // Si el componente se desmontó, detener el stream
        stream.getTracks().forEach(track => track.stop());
        return;
      }
      
      videoRef.current.srcObject = stream;
      console.log("Stream asignado al video");
      
      videoRef.current.onloadedmetadata = () => {
        if (!isMountedRef.current) return;
        
        console.log("✅ Video metadata cargada");
        console.log("Dimensiones del video:", videoRef.current.videoWidth, "x", videoRef.current.videoHeight);
        
        setDetectionStatus("Cámara activa. Detectando rostro...");
        setIsCapturing(true);
        
        // Reproducir el video
        if (videoRef.current) {
          videoRef.current.play()
            .then(() => {
              console.log("✅ Video reproduciendo correctamente");
              // Esperar a que el video se estabilice y empezar detección
              setTimeout(() => {
                if (isMountedRef.current) {
                  console.log("🔍 Iniciando detección facial continua...");
                  startContinuousDetection();
                }
              }, 1000);
            })
            .catch(e => {
              // Ignorar el error si es AbortError (componente desmontándose)
              if (e.name !== 'AbortError') {
                console.error("Error al reproducir video:", e);
              }
            });
        }
      };
      
    } catch (err) {
      console.error("❌ Error al acceder a la cámara:", err);
      if (isMountedRef.current) {
        setDetectionStatus("Error al acceder a la cámara. Verifica los permisos.");
      }
    }
  };

  const stopVideo = () => {
    console.log("Deteniendo video y detección...");
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    setIsCapturing(false);
  };

  const startContinuousDetection = () => {
    if (!isMountedRef.current) return;
    
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
    }
    
    // Detectar cada 100ms (10 veces por segundo)
    detectionIntervalRef.current = setInterval(() => {
      if (isMountedRef.current) {
        detectFaceAndEmotion();
      }
    }, 100);
  };

  const detectFaceAndEmotion = async () => {
    if (!isMountedRef.current || !videoRef.current || !canvasRef.current || !modelsLoaded) {
      return;
    }

    // Verificar que el video esté listo
    if (videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) {
      return;
    }

    try {
      // Opciones MUY permisivas para mejor detección
      const options = new faceapi.TinyFaceDetectorOptions({ 
        inputSize: 224,  // Más pequeño = más rápido y a veces mejor
        scoreThreshold: 0.1  // MUY bajo = detecta casi cualquier cosa parecida a un rostro
      });
      
      console.log("🔍 Intentando detectar rostro...");
      
      const result = await faceapi
        .detectSingleFace(videoRef.current, options)
        .withFaceLandmarks()
        .withFaceExpressions();

      if (!isMountedRef.current || !canvasRef.current) return;

      const ctx = canvasRef.current.getContext("2d");
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

      if (result) {
        console.log("✅ ¡ROSTRO DETECTADO!", result);
        console.log("Expresiones:", result.expressions);
        
        const displaySize = {
          width: videoRef.current.videoWidth,
          height: videoRef.current.videoHeight,
        };
        
        // Configurar canvas solo una vez
        if (canvasRef.current.width !== displaySize.width) {
          canvasRef.current.width = displaySize.width;
          canvasRef.current.height = displaySize.height;
          faceapi.matchDimensions(canvasRef.current, displaySize);
        }

        const resizedResult = faceapi.resizeResults(result, displaySize);
        
        // Dibujar detección con color verde BRILLANTE
        const box = resizedResult.detection.box;
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 4;
        ctx.strokeRect(box.x, box.y, box.width, box.height);
        
        // Dibujar puntos faciales en rojo
        const landmarks = resizedResult.landmarks;
        const points = landmarks.positions;
        ctx.fillStyle = '#ff0000';
        points.forEach(point => {
          ctx.beginPath();
          ctx.arc(point.x, point.y, 2, 0, 2 * Math.PI);
          ctx.fill();
        });

        // Obtener la emoción dominante
        const expressions = result.expressions;
        const sortedExpressions = Object.entries(expressions).sort((a, b) => b[1] - a[1]);
        console.log("Emociones ordenadas:", sortedExpressions);
        
        const dominantEmotion = sortedExpressions[0];
        
        const emotionData = {
          emotion: dominantEmotion[0],
          confidence: (dominantEmotion[1] * 100).toFixed(2)
        };
        
        if (isMountedRef.current) {
          setCurrentEmotion(emotionData);
          setFaceDetected(true);
          setDetectionStatus(`✅ Rostro detectado - ${getEmotionLabel(emotionData.emotion)} (${emotionData.confidence}%)`);
        }
        
      } else {
        console.log("❌ No se detectó rostro en este frame");
        if (isMountedRef.current) {
          setFaceDetected(false);
          setCurrentEmotion(null);
          setDetectionStatus("🔍 Buscando rostro... Asegúrate de estar bien iluminado y centrado");
        }
      }
    } catch (error) {
      console.error("❌ Error en detectFaceAndEmotion:", error);
    }
  };

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      stopVideo();
    };
  }, []);

  const capturePhoto = async () => {
    if (!faceDetected || !currentEmotion) {
      setDetectionStatus("Esperando detección de rostro...");
      return;
    }

    try {
      // Capturar foto del canvas
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0);
      
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      
      // Enviar foto con emoción al backend
      const response = await fetch('/api/emotions/capture', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patientId,
          image: imageData,
          emotion: currentEmotion.emotion,
          confidence: currentEmotion.confidence,
          timestamp: new Date().toISOString(),
          captureType: 'initial' // Puede ser 'initial' o 'during_test'
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setDetectionStatus("¡Captura inicial completada! Iniciando test...");
        stopVideo();
        
        // Llamar al callback para continuar con el test
        setTimeout(() => {
          onCaptureComplete({
            emotionDataId: data.emotionDataId,
            initialEmotion: currentEmotion
          });
        }, 1500);
      } else {
        setDetectionStatus("Error al guardar la captura. Intenta nuevamente.");
      }
    } catch (error) {
      console.error("Error al capturar foto:", error);
      setDetectionStatus("Error al capturar la foto. Intenta nuevamente.");
    }
  };

  const getEmotionLabel = (emotion) => {
    const emotions = {
      neutral: "Neutral",
      happy: "Feliz",
      sad: "Triste",
      angry: "Enojado",
      fearful: "Temeroso",
      disgusted: "Disgustado",
      surprised: "Sorprendido"
    };
    return emotions[emotion] || emotion;
  };

  return (
    <div className="emotion-capture-container">
      <div className="emotion-capture-card">
        <h2 className="emotion-capture-title">Captura de Estado Emocional</h2>
        <p className="emotion-capture-subtitle">
          Antes de iniciar el test, necesitamos capturar tu estado emocional inicial
        </p>

        {isLoading ? (
          <div className="loading-container">
            <Spinner animation="border" variant="primary" />
            <p>Cargando modelos de detección facial...</p>
          </div>
        ) : (
          <>
            <div className="video-container">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="video-feed"
              />
              <canvas ref={canvasRef} className="video-canvas" />
              
              {currentEmotion && (
                <div className="emotion-overlay">
                  <div className="emotion-badge">
                    <span className="emotion-label">
                      {getEmotionLabel(currentEmotion.emotion)}
                    </span>
                    <span className="emotion-confidence">
                      {currentEmotion.confidence}%
                    </span>
                  </div>
                </div>
              )}
            </div>

            <Alert 
              variant={faceDetected ? "success" : "info"} 
              className="detection-status"
            >
              {detectionStatus}
            </Alert>

            <div className="capture-actions">
              <Button
                variant="primary"
                size="lg"
                onClick={capturePhoto}
                disabled={!faceDetected}
                className="capture-button me-2"
              >
                {faceDetected ? "Capturar y Continuar" : "Esperando detección..."}
              </Button>
              
              <Button
                variant="secondary"
                size="lg"
                onClick={() => {
                  stopVideo();
                  onCaptureComplete({
                    emotionDataId: null,
                    initialEmotion: { emotion: "neutral", confidence: "0" },
                    skipped: true
                  });
                }}
                className="capture-button"
              >
                Saltar (Continuar sin captura)
              </Button>
            </div>

            <div className="instructions">
              <h5>💡 Consejos para mejor detección:</h5>
              <ul>
                <li>✅ Colócate a 30-50 cm de la cámara</li>
                <li>✅ Asegúrate de tener buena iluminación frontal</li>
                <li>✅ Mira directamente a la cámara</li>
                <li>✅ Evita sombras fuertes en tu rostro</li>
                <li>✅ Mantén una expresión natural</li>
              </ul>
              {!faceDetected && (
                <Alert variant="warning" className="mt-2">
                  <strong>⚠️ Si no detecta tu rostro:</strong><br/>
                  • Acércate más a la cámara<br/>
                  • Aumenta la iluminación<br/>
                  • Asegúrate de que tu rostro esté centrado
                </Alert>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default EmotionCapture;

