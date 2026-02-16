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
        
        // Cargar modelos con manejo de errores individual
        try {
          console.log("Cargando TinyFaceDetector...");
          await Promise.race([
            faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 30000))
          ]);
          if (!mounted) return;
        } catch (err) {
          // Ignorar errores de extensiones
          if (err.message && err.message.includes('message channel')) {
            console.warn("Advertencia: Error de extensión detectado, continuando...");
            // Intentar cargar de nuevo después de un breve delay
            await new Promise(resolve => setTimeout(resolve, 100));
            try {
              await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
            } catch (retryErr) {
              throw new Error(`Error cargando TinyFaceDetector: ${retryErr.message}`);
            }
          } else {
            throw new Error(`Error cargando TinyFaceDetector: ${err.message}`);
          }
        }
        
        try {
          console.log("Cargando FaceLandmark68Net...");
          await Promise.race([
            faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 30000))
          ]);
          if (!mounted) return;
        } catch (err) {
          if (err.message && err.message.includes('message channel')) {
            await new Promise(resolve => setTimeout(resolve, 100));
            try {
              await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
            } catch (retryErr) {
              throw new Error(`Error cargando FaceLandmark68Net: ${retryErr.message}`);
            }
          } else {
            throw new Error(`Error cargando FaceLandmark68Net: ${err.message}`);
          }
        }
        
        try {
          console.log("Cargando FaceExpressionNet...");
          await Promise.race([
            faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 30000))
          ]);
          if (!mounted) return;
        } catch (err) {
          if (err.message && err.message.includes('message channel')) {
            await new Promise(resolve => setTimeout(resolve, 100));
            try {
              await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
            } catch (retryErr) {
              throw new Error(`Error cargando FaceExpressionNet: ${retryErr.message}`);
            }
          } else {
            throw new Error(`Error cargando FaceExpressionNet: ${err.message}`);
          }
        }
        
        console.log("✅ Todos los modelos cargados exitosamente");
        
        // Verificar que los modelos realmente están cargados
        const modelsStatus = {
          tinyFaceDetector: faceapi.nets.tinyFaceDetector.isLoaded,
          faceLandmark68Net: faceapi.nets.faceLandmark68Net.isLoaded,
          faceExpressionNet: faceapi.nets.faceExpressionNet.isLoaded
        };
        
        console.log("🔍 Verificando modelos cargados:", modelsStatus);
        
        // Verificar que todos los modelos estén cargados
        const allModelsLoaded = Object.values(modelsStatus).every(loaded => loaded === true);
        
        if (!allModelsLoaded) {
          throw new Error(`Algunos modelos no se cargaron: ${JSON.stringify(modelsStatus)}`);
        }
        
        if (mounted) {
          console.log("🔄 Actualizando estado: modelsLoaded = true");
          setModelsLoaded(true);
          setIsLoading(false);
          setDetectionStatus("Modelos cargados. Iniciando cámara...");
          console.log("📹 Iniciando video...");
          await startVideo();
        } else {
          console.warn("⚠️ Componente desmontado antes de actualizar estado");
        }
      } catch (error) {
        console.error("❌ Error al cargar modelos:", error);
        if (mounted) {
          setDetectionStatus(`Error al cargar los modelos: ${error.message}. Verifica que los modelos estén en /public/models`);
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
        console.log("📐 Dimensiones del video:", videoRef.current.videoWidth, "x", videoRef.current.videoHeight);
        console.log("🎬 Estado del video:", {
          readyState: videoRef.current.readyState,
          paused: videoRef.current.paused,
          ended: videoRef.current.ended
        });
        
        setDetectionStatus("Cámara activa. Detectando rostro...");
        setIsCapturing(true);
        
        // Reproducir el video
        if (videoRef.current) {
          console.log("▶️ Intentando reproducir video...");
          videoRef.current.play()
            .then(() => {
              console.log("✅ Video reproduciendo correctamente");
              console.log("🎥 Video estado después de play:", {
                paused: videoRef.current.paused,
                readyState: videoRef.current.readyState,
                videoWidth: videoRef.current.videoWidth,
                videoHeight: videoRef.current.videoHeight
              });
              
              // Esperar a que el video se estabilice y empezar detección
              setTimeout(() => {
                if (isMountedRef.current) {
                  console.log("🔍 Iniciando detección facial continua...");
                  
                  // Verificar directamente si los modelos están cargados (no confiar solo en el estado)
                  const modelsStatus = {
                    tinyFaceDetector: faceapi?.nets?.tinyFaceDetector?.isLoaded,
                    faceLandmark68Net: faceapi?.nets?.faceLandmark68Net?.isLoaded,
                    faceExpressionNet: faceapi?.nets?.faceExpressionNet?.isLoaded
                  };
                  
                  const allModelsLoaded = modelsStatus.tinyFaceDetector && 
                                         modelsStatus.faceLandmark68Net && 
                                         modelsStatus.faceExpressionNet;
                  
                  console.log("📋 Estado antes de iniciar detección:", {
                    modelsLoadedState: modelsLoaded, // Estado de React (puede estar desactualizado)
                    modelsStatus: modelsStatus, // Estado real de los modelos
                    allModelsLoaded: allModelsLoaded, // Verificación directa
                    videoReady: videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA,
                    videoDimensions: `${videoRef.current.videoWidth}x${videoRef.current.videoHeight}`
                  });
                  
                  // Si los modelos están cargados pero el estado no, actualizar el estado
                  if (allModelsLoaded && !modelsLoaded) {
                    console.log("🔄 Modelos cargados pero estado desactualizado, actualizando...");
                    setModelsLoaded(true);
                  }
                  
                  // Iniciar detección solo si los modelos están realmente cargados
                  if (allModelsLoaded) {
                    startContinuousDetection();
                  } else {
                    console.error("❌ No se puede iniciar detección: modelos no están cargados");
                    setDetectionStatus("Error: Modelos no cargados correctamente. Recarga la página.");
                  }
                }
              }, 1500);
            })
            .catch(e => {
              // Ignorar el error si es AbortError (componente desmontándose)
              if (e.name !== 'AbortError') {
                console.error("❌ Error al reproducir video:", e);
                if (isMountedRef.current) {
                  setDetectionStatus(`Error al reproducir video: ${e.message}`);
                }
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
    
    // Limpiar intervalo primero
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    
    // Detener stream de video
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach((track) => {
        track.stop();
      });
      videoRef.current.srcObject = null;
    }
    
    // Limpiar canvas
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
    
    setIsCapturing(false);
  };

  const startContinuousDetection = () => {
    if (!isMountedRef.current) {
      console.warn("⚠️ No se puede iniciar detección: componente no montado");
      return;
    }
    
    // Verificar directamente si los modelos están cargados (no confiar solo en el estado)
    const modelsStatus = {
      tinyFaceDetector: faceapi?.nets?.tinyFaceDetector?.isLoaded,
      faceLandmark68Net: faceapi?.nets?.faceLandmark68Net?.isLoaded,
      faceExpressionNet: faceapi?.nets?.faceExpressionNet?.isLoaded
    };
    
    const allModelsLoaded = modelsStatus.tinyFaceDetector && 
                           modelsStatus.faceLandmark68Net && 
                           modelsStatus.faceExpressionNet;
    
    if (!allModelsLoaded) {
      console.warn("⚠️ No se puede iniciar detección: modelos no cargados");
      console.log("Estado actual:", {
        modelsLoadedState: modelsLoaded, // Estado de React
        modelsStatus: modelsStatus, // Estado real
        allModelsLoaded: allModelsLoaded
      });
      // Esperar un poco y reintentar
      setTimeout(() => {
        if (isMountedRef.current) {
          startContinuousDetection();
        }
      }, 1000);
      return;
    }
    
    // Actualizar estado si los modelos están cargados pero el estado no
    if (allModelsLoaded && !modelsLoaded) {
      console.log("🔄 Actualizando estado: modelsLoaded = true");
      setModelsLoaded(true);
    }
    
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
    }
    
    console.log("✅ Iniciando detección continua (cada 500ms)");
    
    // Detectar cada 500ms (más estable, menos conflictos)
    let isDetecting = false;
    let lastDetectionTime = 0;
    
    detectionIntervalRef.current = setInterval(() => {
      // Verificar que el componente sigue montado
      if (!isMountedRef.current) {
        clearInterval(detectionIntervalRef.current);
        return;
      }
      
      // Verificar directamente si los modelos siguen cargados
      const modelsStillLoaded = faceapi?.nets?.tinyFaceDetector?.isLoaded && 
                                faceapi?.nets?.faceLandmark68Net?.isLoaded && 
                                faceapi?.nets?.faceExpressionNet?.isLoaded;
      
      if (!modelsStillLoaded) {
        console.warn("⚠️ Modelos se descargaron, deteniendo detección");
        clearInterval(detectionIntervalRef.current);
        return;
      }
      
      // Evitar múltiples llamadas simultáneas
      if (isDetecting) {
        return;
      }
      
      // Throttle: mínimo 400ms entre detecciones
      const now = Date.now();
      if (now - lastDetectionTime < 400) {
        return;
      }
      
      isDetecting = true;
      lastDetectionTime = now;
      
      // Usar setTimeout para evitar bloqueo
      setTimeout(() => {
        // Verificar directamente si los modelos están cargados
        const modelsReady = faceapi?.nets?.tinyFaceDetector?.isLoaded && 
                           faceapi?.nets?.faceLandmark68Net?.isLoaded && 
                           faceapi?.nets?.faceExpressionNet?.isLoaded;
        
        if (isMountedRef.current && modelsReady) {
          detectFaceAndEmotion()
            .catch((error) => {
              // Silenciar errores específicos de extensiones
              if (!error.message.includes('message channel') && 
                  !error.message.includes('listener')) {
                console.warn("Error en detección:", error.message);
              }
            })
            .finally(() => {
              isDetecting = false;
            });
        } else {
          isDetecting = false;
        }
      }, 0);
    }, 500);
  };

  const detectFaceAndEmotion = async () => {
    // Verificaciones más estrictas con logs
    if (!isMountedRef.current) {
      console.log("❌ Componente no montado");
      return;
    }
    
    if (!videoRef.current) {
      console.log("❌ videoRef no disponible");
      return;
    }
    
    if (!canvasRef.current) {
      console.log("❌ canvasRef no disponible");
      return;
    }
    
    // Verificar directamente si los modelos están cargados
    const modelsReady = faceapi?.nets?.tinyFaceDetector?.isLoaded && 
                       faceapi?.nets?.faceLandmark68Net?.isLoaded && 
                       faceapi?.nets?.faceExpressionNet?.isLoaded;
    
    if (!modelsReady) {
      console.log("❌ Modelos no cargados", {
        modelsLoadedState: modelsLoaded, // Estado de React
        modelsReady: modelsReady, // Verificación directa
        tinyFaceDetector: faceapi?.nets?.tinyFaceDetector?.isLoaded,
        faceLandmark68Net: faceapi?.nets?.faceLandmark68Net?.isLoaded,
        faceExpressionNet: faceapi?.nets?.faceExpressionNet?.isLoaded
      });
      return;
    }

    // Verificar que el video esté listo y reproduciéndose
    const readyState = videoRef.current.readyState;
    const videoWidth = videoRef.current.videoWidth;
    const videoHeight = videoRef.current.videoHeight;
    
    console.log(`📹 Video estado: readyState=${readyState}, dimensiones=${videoWidth}x${videoHeight}`);
    
    if (readyState !== videoRef.current.HAVE_ENOUGH_DATA) {
      console.log(`⏳ Video no listo: readyState=${readyState} (necesita ${videoRef.current.HAVE_ENOUGH_DATA})`);
      return;
    }
    
    if (videoWidth === 0 || videoHeight === 0) {
      console.log(`❌ Video sin dimensiones: ${videoWidth}x${videoHeight}`);
      return;
    }

    try {
      // Verificar que face-api está disponible
      if (!faceapi || !faceapi.nets || !faceapi.nets.tinyFaceDetector) {
        console.error("❌ face-api.js no está disponible");
        return;
      }
      
      // Verificar que el modelo está cargado
      if (!faceapi.nets.tinyFaceDetector.isLoaded) {
        console.warn("⚠️ TinyFaceDetector no está cargado");
        return;
      }
      
      console.log("🔍 Iniciando detección facial...");
      
      // Opciones optimizadas para mejor detección
      const options = new faceapi.TinyFaceDetectorOptions({ 
        inputSize: 320,  // Tamaño medio para balance velocidad/precisión
        scoreThreshold: 0.1  // Umbral más bajo para mejor detección
      });
      
      console.log("📋 Opciones de detección:", options);
      
      // Usar Promise.race con timeout más corto y mejor manejo de errores
      let detectionPromise;
      try {
        console.log("🎯 Llamando a detectSingleFace...");
        detectionPromise = faceapi
          .detectSingleFace(videoRef.current, options)
          .withFaceLandmarks()
          .withFaceExpressions();
        console.log("✅ Promesa de detección creada");
      } catch (error) {
        console.error("❌ Error al crear promesa de detección:", error);
        // Si hay error al crear la promesa, retornar silenciosamente
        if (error.message && error.message.includes('message channel')) {
          return; // Ignorar errores de extensiones
        }
        throw error;
      }
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout en detección')), 3000)
      );
      
      let result;
      try {
        console.log("⏳ Esperando resultado de detección...");
        result = await Promise.race([detectionPromise, timeoutPromise]);
        console.log("📊 Resultado recibido:", result ? "Rostro detectado" : "No se detectó rostro");
      } catch (error) {
        console.error("❌ Error en detección:", error.message);
        // Ignorar errores de extensiones de Chrome
        if (error.message && (
          error.message.includes('message channel') ||
          error.message.includes('listener') ||
          error.message.includes('channel closed')
        )) {
          return; // Retornar silenciosamente
        }
        // Re-lanzar otros errores
        throw error;
      }

      // Verificar nuevamente que el componente sigue montado
      if (!isMountedRef.current || !canvasRef.current) return;

      const ctx = canvasRef.current.getContext("2d");
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

      if (result) {
        console.log("✅ ¡ROSTRO DETECTADO!", result);
        console.log("📊 Expresiones:", result.expressions);
        
        const displaySize = {
          width: videoRef.current.videoWidth,
          height: videoRef.current.videoHeight,
        };
        
        console.log(`📐 Tamaño de display: ${displaySize.width}x${displaySize.height}`);
        
        // Configurar canvas solo una vez
        if (canvasRef.current.width !== displaySize.width || canvasRef.current.height !== displaySize.height) {
          console.log("🎨 Configurando canvas...");
          canvasRef.current.width = displaySize.width;
          canvasRef.current.height = displaySize.height;
          faceapi.matchDimensions(canvasRef.current, displaySize);
        }

        const resizedResult = faceapi.resizeResults(result, displaySize);
        
        // Dibujar detección con color verde
        const box = resizedResult.detection.box;
        console.log(`📦 Box de detección: x=${box.x}, y=${box.y}, w=${box.width}, h=${box.height}`);
        
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 4;
        ctx.strokeRect(box.x, box.y, box.width, box.height);
        
        // Dibujar puntos faciales
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
        console.log("😊 Todas las expresiones:", expressions);
        
        const sortedExpressions = Object.entries(expressions).sort((a, b) => b[1] - a[1]);
        console.log("📊 Expresiones ordenadas:", sortedExpressions);
        
        const dominantEmotion = sortedExpressions[0];
        console.log(`🏆 Emoción dominante: ${dominantEmotion[0]} (${(dominantEmotion[1] * 100).toFixed(2)}%)`);
        
        const emotionData = {
          emotion: dominantEmotion[0],
          confidence: (dominantEmotion[1] * 100).toFixed(2)
        };
        
        if (isMountedRef.current) {
          console.log("💾 Actualizando estado con emoción:", emotionData);
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
      // Ignorar errores específicos de extensiones y timeouts
      const errorMessage = error?.message || '';
      const shouldIgnore = 
        errorMessage.includes('message channel') ||
        errorMessage.includes('listener') ||
        errorMessage.includes('channel closed') ||
        errorMessage === 'Timeout en detección';
      
      if (!shouldIgnore) {
        console.warn("Advertencia en detección:", errorMessage);
      }
      // No actualizar estado en caso de error para evitar parpadeos
      return; // Retornar silenciosamente
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
      
      // Preparar datos para enviar
      const requestData = {
        patientId,
        image: imageData,
        emotion: currentEmotion.emotion,
        confidence: currentEmotion.confidence,
        timestamp: new Date().toISOString(),
        captureType: 'initial' // Puede ser 'initial' o 'during_test'
      };

      console.log("📤 Enviando captura al backend:", {
        patientId: requestData.patientId,
        emotion: requestData.emotion,
        confidence: requestData.confidence,
        imageSize: requestData.image.length,
        timestamp: requestData.timestamp
      });

      // Obtener token de autenticación
      const token = localStorage.getItem('token') || localStorage.getItem('userInfo') 
        ? JSON.parse(localStorage.getItem('userInfo'))?.token 
        : null;

      // Enviar foto con emoción al backend
      const headers = {
        'Content-Type': 'application/json',
      };

      // Agregar token si está disponible
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/emotions/capture', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(requestData)
      });

      console.log("📡 Respuesta del servidor:", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      let data;
      try {
        data = await response.json();
        console.log("📦 Datos recibidos del backend:", data);
      } catch (jsonError) {
        console.error("❌ Error al parsear JSON:", jsonError);
        const textResponse = await response.text();
        console.error("📄 Respuesta como texto:", textResponse);
        throw new Error("Error al procesar respuesta del servidor");
      }
      
      if (response.ok) {
        console.log("✅ Captura exitosa:", {
          emotionDataId: data.emotionDataId,
          captureId: data.captureId,
          detectionMethod: data.detectionMethod,
          emotion: data.emotion,
          confidence: data.confidence
        });
        
        setDetectionStatus("¡Captura inicial completada! Iniciando test...");
        stopVideo();
        
        // Llamar al callback para continuar con el test
        setTimeout(() => {
          onCaptureComplete({
            emotionDataId: data.emotionDataId,
            initialEmotion: currentEmotion,
            detectionMethod: data.detectionMethod || 'face-api.js'
          });
        }, 1500);
      } else {
        console.error("❌ Error en respuesta:", {
          status: response.status,
          data: data
        });
        setDetectionStatus(`Error al guardar la captura: ${data?.message || 'Error desconocido'}`);
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

