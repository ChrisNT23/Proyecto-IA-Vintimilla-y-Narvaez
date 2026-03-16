// src/screens/MOCAmodules/MocaStartSelf.jsx

import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Button,
  Container,
  ProgressBar,
  Row,
  Col,
  Alert,
  Spinner,
  Form,
  Card,
} from "react-bootstrap";
import { useSelector } from "react-redux";
import { useGetPatientsQuery, useUpdatePatientMutation } from "../slices/patientApiSlice";
import { useCreateMocaSelfMutation } from "../slices/mocaSelfApiSlice";
import { buildMocaSummary } from "./MOCAmodules/helpers/mocaSummaryBuilder";
import EmotionCapture from "../components/EmotionCapture";
import Visuoespacial from "./MOCAmodules/Visuoespacial";
import Identificacion from "./MOCAmodules/Identificacion";
import Memoria from "./MOCAmodules/Memoria";
import Atencion from "./MOCAmodules/Atencion";
import Lenguaje from "./MOCAmodules/Lenguaje";


import {
  FaPlay,
  FaStop,
  FaMicrophone,
  FaExpand,
  FaCompress,
  FaSpinner,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";
import * as faceapi from "face-api.js";
import "../assets/styles/MocaTest.css";

const MODULES = [
  { id: 0, name: "Visuoespacial", icon: "🧩", component: Visuoespacial },
  { id: 1, name: "Identificación", icon: "🦁", component: Identificacion },
  { id: 2, name: "Memoria", icon: "🧠", component: Memoria },
  { id: 3, name: "Atención", icon: "🔍", component: Atencion },
  { id: 4, name: "Lenguaje", icon: "🗣️", component: Lenguaje },

];

const MocaStartSelf = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: patients = [] } = useGetPatientsQuery();
  const selectedPatient = patients.find((patient) => patient._id === id);

  const userInfo = useSelector((state) => state.auth.userInfo);
  const isAdmin = userInfo?.isAdmin || false;

  const [showEmotionCapture, setShowEmotionCapture] = useState(false);
  const [emotionDataId, setEmotionDataId] = useState(null);
  const [testStarted, setTestStarted] = useState(false);
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [currentScore, setCurrentScore] = useState(0);
  const [individualScores, setIndividualScores] = useState({});
  const [moduleScores, setModuleScores] = useState({});
  const [selectedModuleIndex, setSelectedModuleIndex] = useState(null);
  const [testCompleted, setTestCompleted] = useState(false);
  const [hasLessThan12YearsOfEducation, setHasLessThan12YearsOfEducation] =
    useState(false);
  const [audioVerified, setAudioVerified] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState("");
  const [showAdminDetails, setShowAdminDetails] = useState(true);

  const moduleRef = useRef(null);
  const emotionCaptureInterval = useRef(null);
  // Ref que siempre apunta al módulo actual (soluciona bug de closure en setInterval)
  const currentModuleIndexRef = useRef(0);
  const emotionDataIdRef = useRef(null);

  const [
    updatePatient,
    {
      isLoading: isUpdatingPatient,
      isSuccess: isUpdateSuccess,
      isError: isUpdateError,
      error: updateError,
    },
  ] = useUpdatePatientMutation();

  const [
    createMocaSelf,
    { isLoading: isSaving, isSuccess, isError: isSaveError, error: saveError },
  ] = useCreateMocaSelfMutation();

  // Control del temporizador
  useEffect(() => {
    let interval;
    if (testStarted) {
      interval = setInterval(() => setTimeElapsed((prev) => prev + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [testStarted]);

  // Sincronizar refs con los estados (para usarlos dentro de setInterval sin closure)
  useEffect(() => {
    currentModuleIndexRef.current = currentModuleIndex;
  }, [currentModuleIndex]);

  useEffect(() => {
    emotionDataIdRef.current = emotionDataId;
  }, [emotionDataId]);

  // Formatear tiempo
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // Iniciar prueba
  const handleStartTest = () => {
    if (!audioVerified) {
      setVerificationMessage(
        "Por favor, verifica que tu audio y micrófono funcionen correctamente antes de iniciar la prueba."
      );
      return;
    }
    // Mostrar pantalla de captura de emoción
    setShowEmotionCapture(true);
  };

  // Callback cuando se completa la captura inicial de emoción
  const handleEmotionCaptureComplete = (data) => {
    setEmotionDataId(data.emotionDataId);
    setShowEmotionCapture(false);
    setTestStarted(true);
    setStartTime(new Date().toLocaleString());

    // Iniciar captura periódica de emociones durante el test
    startPeriodicEmotionCapture();
  };

  // Captura periódica de emociones durante el test
  const startPeriodicEmotionCapture = () => {
    console.log("📸 Iniciando captura periódica de emociones cada 20 segundos");
    emotionCaptureInterval.current = setInterval(async () => {
      try {
        // Usa el ref (no el estado) para evitar el bug de closure
        await captureEmotionDuringTest('during_test', currentModuleIndexRef.current);
      } catch (error) {
        console.error("Error en captura periódica:", error);
      }
    }, 20000);
  };

  /**
   * Captura una foto del paciente y la envía al backend con CNN.
   * @param {string} captureType  - 'during_test' | 'module_transition'
   * @param {number} moduleIndex  - Índice del módulo actual (0-7)
   */
  const captureEmotionDuringTest = async (captureType = 'during_test', moduleIndex = null) => {
    // Usar ref para obtener el emotionDataId actualizado (evita cierre obsoleto)
    const currentEmotionDataId = emotionDataIdRef.current;
    const resolvedModuleIndex = moduleIndex !== null ? moduleIndex : currentModuleIndexRef.current;
    const moduleName = MODULES[resolvedModuleIndex]?.name || 'unknown';

    if (!currentEmotionDataId) {
      console.warn("⚠️ No hay emotionDataId, saltando captura");
      return;
    }

    try {
      console.log(`📸 Capturando emoción [${captureType}] - Módulo ${resolvedModuleIndex}: ${moduleName}`);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' }
      });
      const video = document.createElement('video');
      video.srcObject = stream;
      video.autoplay = true;
      video.muted = true;

      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          stream.getTracks().forEach(track => track.stop());
          reject(new Error('Timeout esperando video'));
        }, 5000);
        video.onloadedmetadata = () => {
          clearTimeout(timeout);
          video.play();
          setTimeout(resolve, 200);
        };
        video.onerror = (err) => {
          clearTimeout(timeout);
          stream.getTracks().forEach(track => track.stop());
          reject(err);
        };
      });

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d').drawImage(video, 0, 0);
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      stream.getTracks().forEach(track => track.stop());

      // 1. Evaluar emoción con CNN antes de guardar
      let detectedEmotion = 'neutral';
      let detectedConfidence = '0';
      try {
        const userInfo = localStorage.getItem('userInfo');
        const token = localStorage.getItem('token') ||
          (userInfo ? JSON.parse(userInfo)?.token : null);
        const evalHeaders = { 'Content-Type': 'application/json' };
        if (token) evalHeaders['Authorization'] = `Bearer ${token}`;

        const evalRes = await fetch('/api/emotions/evaluate', {
          method: 'POST',
          headers: evalHeaders,
          body: JSON.stringify({ image: imageData }),
        });
        if (evalRes.ok) {
          const evalData = await evalRes.json();
          detectedEmotion = evalData.emotion || 'neutral';
          detectedConfidence = String(evalData.confidence || '0');
        }
      } catch (evalErr) {
        console.warn('⚠️ CNN no disponible, guardando con emoción neutral:', evalErr.message);
      }

      // 2. Guardar captura en BD con ID de módulo correcto
      const userInfo = localStorage.getItem('userInfo');
      const token = localStorage.getItem('token') ||
        (userInfo ? JSON.parse(userInfo)?.token : null);
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch('/api/emotions/capture', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          patientId: id,
          emotionDataId: currentEmotionDataId,
          image: imageData,
          emotion: detectedEmotion,
          confidence: detectedConfidence,
          timestamp: new Date().toISOString(),
          captureType,
          currentModule: moduleName,
          moduleIndex: resolvedModuleIndex,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Emoción guardada [${captureType}]: ${data.emotion} (${data.confidence}%) - Módulo ${resolvedModuleIndex}: ${moduleName}`);
      } else {
        const errData = await response.json().catch(() => ({ message: 'Error desconocido' }));
        console.error(`❌ Error al guardar emoción: ${errData.message}`);
      }
    } catch (error) {
      console.error('❌ Error al capturar emoción durante el test:', error.message);
      // No lanzar error — el test debe continuar aunque falle la captura
    }
  };

  // Limpiar intervalo al completar el test o desmontar componente
  useEffect(() => {
    if (testCompleted && emotionCaptureInterval.current) {
      clearInterval(emotionCaptureInterval.current);
    }

    return () => {
      if (emotionCaptureInterval.current) {
        clearInterval(emotionCaptureInterval.current);
      }
    };
  }, [testCompleted]);

  /**
   * Maneja la finalización de cada módulo.
   * - moduleId: índice del módulo actual
   * - moduleScore: puntaje calculado del módulo
   * - activityScores: datos adicionales del módulo (respuestas, puntajes parciales, etc.)
   *    Se puede incluir forceFinish: true para forzar guardado inmediato.
   */
  const handleCompleteModule = async (moduleId, moduleScore, activityScores) => {
    // 📸 Snapshot emocional al completar el módulo (fire-and-forget, no bloquea)
    captureEmotionDuringTest('module_transition', moduleId).catch((err) =>
      console.warn('⚠️ No se pudo capturar emoción en transición de módulo:', err.message)
    );

    // Guardar el puntaje de este módulo en moduleScores
    setModuleScores((prevModuleScores) => ({
      ...prevModuleScores,
      [MODULES[moduleId].name]: moduleScore,
    }));

    // Recalcular puntaje total
    const newCurrentScore = Object.values({
      ...moduleScores,
      [MODULES[moduleId].name]: moduleScore,
    }).reduce((sum, score) => sum + score, 0);
    setCurrentScore(newCurrentScore);

    // Guardar los detalles del módulo en individualScores
    setIndividualScores((prevScores) => ({
      ...prevScores,
      [MODULES[moduleId].name]: { ...activityScores, total: moduleScore },
    }));

    // Si el módulo manda forceFinish => Guardar de inmediato
    if (activityScores?.forceFinish) {
      setTestCompleted(true);
      handleSaveResults(newCurrentScore, {
        ...individualScores,
        [MODULES[moduleId].name]: { ...activityScores, total: moduleScore },
      });
      return;
    }

    // Flujo normal: Avanzar al siguiente módulo, o set testCompleted si es el último
    if (selectedModuleIndex !== null) {
      setSelectedModuleIndex(null);
    }
    if (currentModuleIndex < MODULES.length - 1) {
      setCurrentModuleIndex(currentModuleIndex + 1);
    } else {
      setTestCompleted(true);
    }
  };

  // Regresar al módulo anterior
  const handlePreviousModule = () => {
    if (selectedModuleIndex !== null) {
      setSelectedModuleIndex(null);
      setCurrentModuleIndex(
        currentModuleIndex - 1 >= 0 ? currentModuleIndex - 1 : 0
      );
    } else if (currentModuleIndex > 0) {
      setCurrentModuleIndex(currentModuleIndex - 1);
    }
  };

  // Seleccionar manualmente un módulo (solo Admin)
  const handleSelectModule = (index) => {
    setSelectedModuleIndex(index);
    setCurrentModuleIndex(index);
  };

  // Guardar resultados en la base de datos
  const handleSaveResults = async (scoreParam, updatedIndividualScores) => {
    // Si no se pasa scoreParam, usar currentScore
    const finalScore = scoreParam ?? currentScore;
    const finalIndividualScores = updatedIndividualScores ?? individualScores;

    if (!selectedPatient) {
      alert("Paciente no seleccionado.");
      return;
    }

    let adjustedScore = finalScore;
    if (hasLessThan12YearsOfEducation && adjustedScore < 30) {
      adjustedScore += 1;
    }

    // Consolidar resultados estandarizados
    const allStandardResults = [];
    Object.values(finalIndividualScores).forEach(moduleData => {
      if (moduleData && Array.isArray(moduleData.standardResults)) {
        allStandardResults.push(...moduleData.standardResults);
      }
    });

    // Construir el JSON de resultados homogeneizados
    const summaryData = buildMocaSummary(selectedPatient._id, allStandardResults);

    const mocaData = {
      patientId: selectedPatient._id,
      patientName: selectedPatient.user?.name || "Paciente Desconocido",
      modulesData: finalIndividualScores,
      totalScore: adjustedScore,
      hasLessThan12YearsOfEducation,
      emotionDataId: emotionDataIdRef.current || null,
      consolidatedResults: summaryData // <-- Nuevo campo consolidado
    };

    try {
      const savedRecord = await createMocaSelf(mocaData).unwrap();
      alert("Resultados guardados exitosamente.");

      try {
        await updatePatient({ id: selectedPatient._id, mocaAssigned: false }).unwrap();
        alert("Estado de MOCA actualizado correctamente.");
      } catch (err) {
        console.error(err);
        alert("Error al actualizar el estado de MOCA.");
      }

      navigate(`/moca-final/${savedRecord._id}`);
    } catch (err) {
      console.error("Error al guardar resultados:", err);
      alert(
        "Hubo un error al guardar los resultados. Por favor, intenta nuevamente."
      );
    }
  };

  // Simular y Guardar (solo para pruebas de admin)
  const handleSimulateAndSaveResults = async () => {
    if (!selectedPatient) {
      alert("Paciente no seleccionado.");
      return;
    }

    const simulatedScores = {
      Visuoespacial: { alternancia: 0, cube: 2, clock: 1, total: 1 },
      Identificación: {
        "1": "Un camello.",
        "2": "León.",
        "3": "Reina serán.",
        total: 0,
      },
      Memoria: { responses: ["ROSA", "CLAVEL"], total: 1 },
      Atencion: { activity1: 0, activity2: 0, activity3: null, total: 0 },
      Lenguaje: {
        totalScore: 0,
        activity1: {
          activityScore: 0,
          phraseAnswers: [
            { phraseIndex: 0, response: "El gato se esconde." },
            {
              phraseIndex: 1,
              response:
                "Espero que él entregue el mensaje una vez que ella se lo pida.",
            },
          ],
        },
        activity2: { activityScore: 0, words: [] },
        total: 0,
      },

    };

    const totalScore = Object.values(simulatedScores).reduce(
      (sum, module) => sum + (module.total || 0),
      0
    );

    let finalScore = totalScore;
    if (hasLessThan12YearsOfEducation && totalScore < 30) {
      finalScore += 1;
    }

    try {
      const savedRecord = await createMocaSelf({
        patientId: selectedPatient._id,
        patientName: selectedPatient.user?.name || "Paciente Desconocido",
        modulesData: simulatedScores,
        totalScore: finalScore,
        hasLessThan12YearsOfEducation,
      }).unwrap();

      alert("Resultados simulados guardados exitosamente.");

      try {
        await updatePatient({
          id: selectedPatient._id,
          mocaAssigned: false,
        }).unwrap();
        alert("Estado de MOCA actualizado correctamente.");
      } catch (err) {
        console.error(err);
        alert("Error al actualizar el estado de MOCA.");
      }

      navigate(`/moca-final/${savedRecord._id}`);
    } catch (err) {
      console.error("Error al guardar resultados simulados:", err);
      alert(
        "Hubo un error al guardar los resultados simulados. Por favor, intenta nuevamente."
      );
    }
  };

  // Síntesis de voz
  const speakInstructions = (text) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "es-ES";
      utterance.onstart = () => setIsSpeakingInstructions(true);
      utterance.onend = () => setIsSpeakingInstructions(false);
      window.speechSynthesis.speak(utterance);
    } else {
      alert("Tu navegador no soporta la síntesis de voz.");
    }
  };

  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [showButtons, setShowButtons] = useState(false);
  const [isSpeakingInstructions, setIsSpeakingInstructions] = useState(false);

  // Limpiar SpeechSynthesis al desmontar
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Limpieza de resultado de voz
  const cleanSpeechResult = (text) => {
    return text.trim().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "");
  };

  const [expectedColor, setExpectedColor] = useState("");

  // Manejo de reconocimiento de voz para verificación
  const handleStartListening = () => {
    if (
      !("webkitSpeechRecognition" in window || "SpeechRecognition" in window)
    ) {
      alert("Tu navegador no soporta reconocimiento de voz.");
      return;
    }

    if (!expectedColor) {
      alert("Por favor, verifica el audio primero.");
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "es-ES";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.start();
    setListening(true);

    recognition.onresult = (event) => {
      let speechResult = event.results[0][0].transcript.toLowerCase();
      speechResult = cleanSpeechResult(speechResult);
      setTranscript(speechResult);
      setShowButtons(true);
      if (speechResult === expectedColor.toLowerCase()) {
        setAudioVerified(true);
        setVerificationMessage("Audio y micrófono verificados correctamente.");
      } else {
        setAudioVerified(false);
        setVerificationMessage(
          "No se pudo verificar correctamente. Por favor, inténtalo de nuevo."
        );
      }
    };

    recognition.onerror = (event) => {
      console.error("Error en reconocimiento de voz:", event.error);
      setListening(false);
      setVerificationMessage(
        "Error en reconocimiento de voz. Por favor, inténtalo de nuevo."
      );
    };

    recognition.onend = () => {
      setListening(false);
    };
  };

  const handleStopListening = () => {
    window.speechSynthesis.cancel();
    setListening(false);
  };

  const handleConfirmWord = () => {
    setShowButtons(false);
  };

  const handleRetry = () => {
    setTranscript("");
    setShowButtons(false);
    handleStartListening();
  };

  // Hablar instrucciones del módulo actual
  const handleSpeakModuleInstructions = (moduleName) => {
    const instructions = `Instrucciones para ${moduleName}: Por favor, sigue las indicaciones para completar esta actividad.`;
    speakInstructions(instructions);
  };

  // Descripción general de la prueba
  const handleTestDescription = () => {
    const description =
      "La prueba MoCA es una evaluación breve diseñada para detectar deterioro cognitivo leve. Está dividida en varios módulos, cada uno con actividades específicas que evalúan diferentes aspectos de la función cognitiva, como la memoria, la atención y el lenguaje.";
    speakInstructions(description);
  };

  // Verificar audio
  const handleVerifyAudio = () => {
    const colors = ["Rojo", "Verde", "Azul", "Amarillo"];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    setExpectedColor(randomColor);
    speakInstructions(`Por favor, escucha el color: ${randomColor}`);
  };

  // Pantalla completa
  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      if (moduleRef.current.requestFullscreen) {
        moduleRef.current.requestFullscreen();
      } else if (moduleRef.current.mozRequestFullScreen) {
        moduleRef.current.mozRequestFullScreen();
      } else if (moduleRef.current.webkitRequestFullscreen) {
        moduleRef.current.webkitRequestFullscreen();
      } else if (moduleRef.current.msRequestFullscreen) {
        moduleRef.current.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  // Mostrar/ocultar detalles admin
  const toggleAdminDetails = () => {
    setShowAdminDetails(!showAdminDetails);
  };

  const CurrentModuleComponent = MODULES[currentModuleIndex].component;

  // Mostrar pantalla de captura de emoción
  if (showEmotionCapture) {
    return (
      <EmotionCapture
        onCaptureComplete={handleEmotionCaptureComplete}
        patientId={id}
      />
    );
  }

  return (
    <Container className="moca-container my-5">
      {/* Inicio de la prueba */}
      {!testStarted ? (
        <div className="instructions-container">
          <Row>
            <Col md={6} className="instructions-text">
              <h2>Instrucciones para la Prueba MoCA</h2>
              <Button
                variant="link"
                onClick={handleTestDescription}
                disabled={isSpeakingInstructions}
                className="mb-3 text-decoration-none listen-button"
              >
                {isSpeakingInstructions ? <FaStop /> : <FaPlay />} Escuchar Instrucciones
              </Button>
              <p>
                Bienvenido a la Evaluación Cognitiva Montreal (MoCA). Esta prueba
                está dividida en varios módulos, y cada módulo consta de diferentes
                actividades. Por favor, sigue las instrucciones de cada actividad
                cuidadosamente. En ciertas actividades, tendrás que dar respuestas
                habladas o escritas. Asegúrate de tener tu micrófono funcionando
                correctamente antes de iniciar la prueba.
              </p>
              <Form.Group controlId="educationCheckbox" className="mb-3">
                <Form.Check
                  type="checkbox"
                  label="¿Tiene 12 años o menos de estudios? (Por ejemplo, educación primaria, secundaria, etc.)"
                  checked={hasLessThan12YearsOfEducation}
                  onChange={(e) =>
                    setHasLessThan12YearsOfEducation(e.target.checked)
                  }
                />
              </Form.Group>
              {selectedPatient && (
                <>
                  <p>
                    <strong>Paciente:</strong> {selectedPatient.user?.name}
                  </p>
                  <p>
                    <strong>ID del Paciente:</strong> {selectedPatient._id}
                  </p>
                </>
              )}
              <div className="verification-section">
                <h4>Verificación de Audio y Micrófono</h4>
                <p>
                  Por favor, verifica que tu audio y micrófono funcionan
                  correctamente.
                </p>
                <Button
                  variant="info"
                  onClick={handleVerifyAudio}
                  disabled={isSpeakingInstructions || listening}
                  className="verify-audio-button"
                >
                  {isSpeakingInstructions ? (
                    <FaSpinner className="spin" />
                  ) : (
                    "Verificar Audio"
                  )}
                </Button>
                {verificationMessage && (
                  <Alert
                    variant={audioVerified ? "success" : "danger"}
                    className="mt-3"
                  >
                    {verificationMessage}
                  </Alert>
                )}
              </div>
            </Col>

            <Col md={6} className="microphone-test">
              <h4>Prueba de Audio y Micrófono</h4>
              <p>
                Utiliza estos botones para asegurarte de que tu audio y micrófono
                funcionan correctamente.
              </p>
              <div className="button-group">
                <Button
                  variant="link"
                  onClick={() =>
                    speakInstructions("Esta es una prueba de audio.")
                  }
                  disabled={isSpeakingInstructions}
                  className="instruction-button listen-audio-button"
                >
                  {isSpeakingInstructions ? <FaStop /> : <FaPlay />} Escuchar
                </Button>
                <Button
                  variant="primary"
                  onClick={handleStartListening}
                  className="instruction-button speak-button"
                >
                  <FaMicrophone className="me-2" />
                  Hablar
                </Button>
              </div>
              {listening && (
                <div className="listening-indicator">
                  <Spinner animation="grow" variant="primary" className="mb-2" />
                  <p>Escuchando...</p>
                </div>
              )}
              {showButtons && (
                <div className="confirmation-buttons">
                  <Alert variant="secondary">
                    <p>¿Es correcta su palabra?</p>
                    <strong>{transcript}</strong>
                  </Alert>
                  <Row>
                    <Col className="d-flex justify-content-center">
                      <Button variant="warning" onClick={handleRetry} className="me-2">
                        Reintentar
                      </Button>
                      <Button variant="success" onClick={handleConfirmWord}>
                        Sí
                      </Button>
                    </Col>
                  </Row>
                </div>
              )}

              {isSpeakingInstructions && (
                <div className="audio-playing">
                  <Spinner animation="border" variant="info" className="me-2" />
                  <span>Reproduciendo audio...</span>
                </div>
              )}
              {verificationMessage && !audioVerified && (
                <div className="additional-help">
                  <Alert variant="warning" className="mt-3">
                    <p>No has verificado tu audio correctamente.</p>
                    <Button variant="link" onClick={() => navigate("/chat")}>
                      Necesito ayuda adicional
                    </Button>
                    <p>O visita la sección de <strong>chat</strong> para conversar con el doctor.</p>
                  </Alert>
                </div>
              )}
            </Col>
          </Row>

          <div className="text-center mt-4">
            <Button
              variant="success"
              size="lg"
              onClick={handleStartTest}
              disabled={!selectedPatient || !audioVerified}
              className="start-button"
            >
              Iniciar Prueba
            </Button>
            {verificationMessage && !audioVerified && (
              <Alert variant="warning" className="mt-3">
                Por favor, verifica que tu audio y micrófono funcionen
                correctamente antes de iniciar la prueba.
              </Alert>
            )}
          </div>
        </div>
      ) : (
        // Contenido de la prueba
        <>
          <div ref={moduleRef} className="module-view">


            {isAdmin && (
              <Button
                variant="outline-secondary"
                onClick={toggleAdminDetails}
                className="toggle-admin-button"
              >
                {showAdminDetails ? <FaEyeSlash /> : <FaEye />}{" "}
                {showAdminDetails ? "Ocultar" : "Mostrar"} Detalles Admin
              </Button>
            )}

            <div className={`${currentModuleIndex !== 0 ? 'module-container p-4' : 'pt-2'} mb-4`}>
              <Row>
                <Col>
                  <CurrentModuleComponent
                    onComplete={(score, activityScores) =>
                      handleCompleteModule(currentModuleIndex, score, activityScores)
                    }
                    onPrevious={handlePreviousModule}
                    isFirstModule={currentModuleIndex === 0}
                    patientId={id}
                  />
                </Col>
              </Row>
            </div>
          </div>

          <hr className="my-4" />

          {/* Sección de detalles solo visible para Admin */}
          {isAdmin && showAdminDetails && (
            <div className="progress-container mb-4">
              <Row className="align-items-center">
                <Col md={6}>
                  <div className="progress-bar-container">
                    <ProgressBar
                      now={((currentModuleIndex + 1) / MODULES.length) * 100}
                      label={`${currentModuleIndex + 1} / ${MODULES.length}`}
                    />
                  </div>
                </Col>
                <Col md={3}>
                  <div className="score-container">
                    <span>Puntaje Actual:</span>
                    <span className="score">{currentScore}</span>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="time-container">
                    <span>Tiempo Transcurrido:</span>
                    <span className="time">{formatTime(timeElapsed)}</span>
                  </div>
                </Col>
              </Row>
            </div>
          )}

          {/* Dots de avance */}
          {isAdmin && showAdminDetails && (
            <div className="module-status">
              {MODULES.map((module, index) => (
                <span
                  key={module.id}
                  className={`module-dot ${index < currentModuleIndex || index === selectedModuleIndex
                    ? "completed"
                    : "pending"
                    }`}
                ></span>
              ))}
            </div>
          )}

          {/* Mostrar puntajes por módulo si Admin */}
          {isAdmin && showAdminDetails && (
            <pre className="mt-4">
              <strong>Puntajes por Módulo y Respuestas:</strong>
              {Object.entries(individualScores).map(([moduleName, scores]) => (
                <div key={moduleName}>
                  <strong>{moduleName}:</strong> {JSON.stringify(scores)}
                </div>
              ))}
            </pre>
          )}

          {/* Selección de módulo si Admin */}
          {isAdmin && showAdminDetails && (
            <div className="mt-5">
              <h4 className="text-center">Selecciona un Módulo para Probar:</h4>
              <Row className="flex-wrap justify-content-center">
                {MODULES.map((module, index) => (
                  <Col
                    key={module.id}
                    xs={12}
                    sm={6}
                    md={4}
                    lg={3}
                    className="mb-3"
                  >
                    <Card
                      className={`module-card ${index === currentModuleIndex || index === selectedModuleIndex
                        ? "active"
                        : ""
                        }`}
                      onClick={() => handleSelectModule(index)}
                      style={{ cursor: "pointer" }}
                    >
                      <Card.Body className="text-center">
                        <Card.Title>
                          {module.icon} {module.name}
                        </Card.Title>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            </div>
          )}

          {/* Botón para simular y guardar resultados (solo Admin) */}
          {isAdmin && showAdminDetails && !testCompleted && (
            <div className="d-flex justify-content-center mt-4">
              <Button
                variant="secondary"
                onClick={handleSimulateAndSaveResults}
                disabled={isSaving || isUpdatingPatient}
                size="lg"
                className="simulate-button"
              >
                {isSaving || isUpdatingPatient ? (
                  <>
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      role="status"
                      aria-hidden="true"
                      className="me-2"
                    />
                    Simulando...
                  </>
                ) : (
                  "Simular y Guardar Resultados"
                )}
              </Button>
            </div>
          )}

          {/* Si la prueba se ha completado y es Admin => mostrar botón de Guardar */}
          {testCompleted && isAdmin && showAdminDetails && (
            <Row className="mt-4">
              <Col className="d-flex justify-content-end">
                <Button
                  variant="success"
                  onClick={() => handleSaveResults()}
                  disabled={isSaving || isUpdatingPatient}
                  size="lg"
                >
                  {isSaving || isUpdatingPatient ? (
                    <>
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                        className="me-2"
                      />
                      Guardando...
                    </>
                  ) : (
                    "Guardar Resultados"
                  )}
                </Button>
              </Col>
            </Row>
          )}

          {/* Mensajes de éxito/error al guardar o actualizar */}
          {isSuccess && isAdmin && showAdminDetails && (
            <Alert variant="success" className="mt-3 text-center">
              Resultados guardados exitosamente.
            </Alert>
          )}
          {isSaveError && isAdmin && showAdminDetails && (
            <Alert variant="danger" className="mt-3 text-center">
              {saveError?.data?.error || "Hubo un error al guardar los resultados."}
            </Alert>
          )}
          {isUpdateSuccess && isAdmin && showAdminDetails && (
            <Alert variant="success" className="mt-3 text-center">
              Estado de MOCA actualizado correctamente.
            </Alert>
          )}
          {isUpdateError && isAdmin && showAdminDetails && (
            <Alert variant="danger" className="mt-3 text-center">
              {updateError?.data?.error || "Hubo un error al actualizar el estado de MOCA."}
            </Alert>
          )}
        </>
      )}
    </Container>
  );
};

export default MocaStartSelf;
