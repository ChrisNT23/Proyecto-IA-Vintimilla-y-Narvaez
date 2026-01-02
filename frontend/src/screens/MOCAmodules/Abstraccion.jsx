// src/screens/MOCAmodules/Abstraccion.jsx

import React, { useState, useEffect, useRef } from "react";
import { Button, Row, Col, Alert, Form, Spinner } from "react-bootstrap";
import { FaPlay, FaStop, FaMicrophone } from "react-icons/fa";
import { useSelector } from "react-redux";
import '../../assets/styles/mocamodules.css';

const Abstraccion = ({ onComplete, onPrevious, isFirstModule }) => {
  const isAdmin = useSelector((state) => state.auth.userInfo?.isAdmin) || false;

  // Definición de los pares de objetos y sus respuestas aceptadas
  const pairs = [
    {
      objects: "un tren y una bicicleta",
      acceptedAnswers: ["transporte", "para transportar", "medios de transporte", "son medios de transporte"],
    },
    {
      objects: "una regla y un reloj",
      acceptedAnswers: ["miden", "medir", "para medir", "sirven para medir"],
    },
  ];

  // Índice del par actual (0 o 1)
  const [currentPairIndex, setCurrentPairIndex] = useState(0);

  // Puntajes de cada actividad (un par es una actividad)
  const [activityScores, setActivityScores] = useState([null, null]);

  // Guardar las respuestas del usuario { pairIndex, input, correct }
  const [pairAnswers, setPairAnswers] = useState([]);

  // Control de TTS
  const [ttsSupported, setTtsSupported] = useState(true);
  const [isSpeakingLocal, setIsSpeakingLocal] = useState(false);

  // Control de reconocimiento de voz
  const [useVoice, setUseVoice] = useState(true);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);

  // Botones e inputs
  const [transcript, setTranscript] = useState("");
  const [manualInput, setManualInput] = useState("");
  const [confirmation, setConfirmation] = useState(false);
  const [hasHeardPair, setHasHeardPair] = useState(false);

  // Revisar si se está reproduciendo alguna instrucción general
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Inicializa TTS
  useEffect(() => {
    if (!window.speechSynthesis) {
      setTtsSupported(false);
    }
  }, []);

  // Inicializa SpeechRecognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setUseVoice(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "es-ES";
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const result = event.results[0][0].transcript;
      setTranscript(result);
      setListening(false);
      setConfirmation(true);
    };

    recognition.onerror = () => {
      setListening(false);
      alert("Error al reconocer la voz. Intente de nuevo.");
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  // TTS para leer instrucciones generales
  const speakInstructions = (text) => {
    if (!ttsSupported) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "es-ES";
      utterance.onend = () => {
        setIsSpeaking(false);
      };
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  // TTS para cada par de objetos
  const speakPair = (text) => {
    if (!ttsSupported) return;
    if (isSpeakingLocal) {
      window.speechSynthesis.cancel();
      setIsSpeakingLocal(false);
    } else {
      const utterance = new SpeechSynthesisUtterance("Dígame en qué se parecen " + text);
      utterance.lang = "es-ES";
      utterance.onend = () => {
        setIsSpeakingLocal(false);
        setHasHeardPair(true);
      };
      window.speechSynthesis.speak(utterance);
      setIsSpeakingLocal(true);
    }
  };

  // Iniciar reconocimiento de voz
  const handleListen = () => {
    if (!recognitionRef.current) {
      alert("Reconocimiento de voz no disponible.");
      return;
    }
    if (!hasHeardPair) {
      alert("Primero debe escuchar las instrucciones para este par de objetos antes de responder.");
      return;
    }
    setListening(true);
    setTranscript("");
    recognitionRef.current.start();
  };

  // Detener reconocimiento de voz
  const handleStop = () => {
    if (recognitionRef.current && listening) {
      recognitionRef.current.stop();
    }
    setListening(false);
  };

  // Normalizar texto para comparación
  const normalizeText = (text) => {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9 ]/g, "")
      .trim()
      .replace(/\s+/g, " ");
  };

  // Confirmar la respuesta del usuario
  const handleConfirm = () => {
    const pair = pairs[currentPairIndex];
    const inputText = normalizeText(transcript || manualInput);

    const isCorrect = pair.acceptedAnswers.some((ans) => inputText.includes(ans));

    // Guardar la respuesta en pairAnswers
    setPairAnswers((prev) => [
      ...prev,
      {
        pairIndex: currentPairIndex,
        input: (transcript || manualInput).trim(),
        correct: isCorrect,
      },
    ]);

    // Setear el score en la posición [currentPairIndex]
    const newScores = [...activityScores];
    newScores[currentPairIndex] = isCorrect ? 1 : 0;
    setActivityScores(newScores);

    // Limpiar
    setManualInput("");
    setTranscript("");
    setConfirmation(false);

    if (currentPairIndex < pairs.length - 1) {
      // Pasar al siguiente par
      setCurrentPairIndex(currentPairIndex + 1);
      setHasHeardPair(false);
    } else {
      // Si era el último par
      handleFinish(newScores);
    }
  };

  // Permite reintentar la misma respuesta
  const handleRetry = () => {
    setTranscript("");
    setManualInput("");
    setConfirmation(false);
  };

  // Manejar enter en el input manual
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (manualInput.trim() && hasHeardPair && !confirmation) {
        setConfirmation(true);
      }
    }
  };

  // Finaliza el modulo y llama onComplete
  const handleFinish = (scores) => {
    // Calcular total
    const totalScore = scores.reduce((a, b) => a + (b || 0), 0);
    onComplete(totalScore, {
      totalScore,
      activity1: scores[0],
      activity2: scores[1],
      pairAnswers,
    });
  };

  const allActivitiesDone = activityScores[0] !== null && activityScores[1] !== null;

  return (
    <div className="module-container">
      {/* Título e instrucciones */}
      <div className="d-flex align-items-center mb-2">
        <h4 className="mb-0">Abstracción</h4>
        <Button
          variant="link"
          onClick={() =>
            speakInstructions("Le diré dos objetos y me dirá en qué se parecen.")
          }
          disabled={isSpeaking}
          className="listen-button ms-3 text-decoration-none"
        >
          <FaPlay /> Escuchar<br />Instrucciones
        </Button>
      </div>

      {/* Texto indicando lo que se está comparando */}
      <p className="mb-4">Comparación de pares de objetos para identificar similitudes.</p>

      {/* Contenido de la actividad */}
      {currentPairIndex < pairs.length && !confirmation && (
        <div className="text-center mt-3">
          <p>
            Escuche los objetos y luego dígame en qué se parecen. Puede hablar o escribir su respuesta.
          </p>
          <Button
            variant="primary"
            onClick={() => speakPair(pairs[currentPairIndex].objects)}
            className="activity-button mb-3 d-block mx-auto"
            disabled={isSpeakingLocal || hasHeardPair}
            style={{ minWidth: "220px" }}
          >
            <FaPlay /> Escuchar objetos
          </Button>
        </div>
      )}

      {currentPairIndex < pairs.length && !confirmation && (
        <div className="text-center">
          <Form
            onSubmit={(e) => e.preventDefault()}
            className="mt-3 d-flex flex-column align-items-center"
          >
            <Form.Control
              type="text"
              placeholder="Escriba aquí su respuesta"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={!hasHeardPair || listening}
              style={{ maxWidth: "500px" }}
            />
            <Button
              variant="success"
              onClick={() => setConfirmation(true)}
              className="me-2 mt-2"
              disabled={!manualInput.trim() || !hasHeardPair}
              style={{ minWidth: "220px" }}
            >
              Confirmar
            </Button>
          </Form>
        </div>
      )}

      {currentPairIndex < pairs.length && useVoice && !confirmation && (
        listening ? (
          <div className="text-center mt-3 d-flex justify-content-center align-items-center">
            <Spinner animation="grow" variant="primary" className="me-2" />
            <Button
              variant="danger"
              onClick={handleStop}
              style={{ minWidth: "220px" }}
            >
              Detener
            </Button>
          </div>
        ) : (
          <div className="text-center mt-3 d-flex justify-content-center">
            <Button
              variant="primary"
              onClick={handleListen}
              disabled={!hasHeardPair}
              style={{ minWidth: "220px" }}
            >
              <FaMicrophone className="me-2" />
              Hablar
            </Button>
          </div>
        )
      )}

      {/* Confirmación de la respuesta actual */}
      {currentPairIndex < pairs.length && confirmation && (
        <div className="text-center mt-3">
          <Alert variant="secondary">
            <p>¿Es correcta su respuesta?</p>
            <strong>"{transcript || manualInput}"</strong>
          </Alert>
          <div className="d-flex justify-content-center">
            <Button
              variant="warning"
              onClick={handleRetry}
              className="me-3"
              style={{ minWidth: "120px" }}
            >
              Reintentar
            </Button>
            <Button
              variant="success"
              onClick={handleConfirm}
              style={{ minWidth: "120px" }}
            >
              Sí
            </Button>
          </div>
        </div>
      )}

      {/* Si se completaron las dos actividades */}
      {currentPairIndex >= pairs.length && (
        <div className="text-center mt-3">
          <Alert variant="info">¡Actividades de Abstracción completadas!</Alert>
        </div>
      )}

      {/* Botón de Regresar y Continuar */}
      <div className="d-flex justify-content-between mt-4">
        {isAdmin && (
          <Button
            variant="secondary"
            onClick={onPrevious}
            disabled={isFirstModule}
            className="back-button"
            style={{ minWidth: "150px" }}
          >
            Regresar
          </Button>
        )}
        <Button
          variant="success"
          onClick={() => handleFinish(activityScores)}
          
          className="continue-button"
          style={{ minWidth: "150px" }}
        >
          Continuar
        </Button>
      </div>
    </div>
  );
};

export default Abstraccion;
