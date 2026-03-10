// src/screens/MOCAmodules/Identificacion.jsx

import React, { useState, useEffect, useRef } from "react";
import { Button, Row, Col, Image, Alert, Form, Spinner } from "react-bootstrap";
import { FaPlay, FaStop, FaMicrophone, FaVolumeUp, FaCheckCircle, FaRedo } from "react-icons/fa";
import { useSelector } from "react-redux";
import '../../assets/styles/mocamodules.css';

const Identificacion = ({ onComplete, onPrevious, isFirstModule }) => {
  const isAdmin = useSelector((state) => state.auth.userInfo?.isAdmin) || false;

  const animals = [
    {
      id: 1,
      image: require("../../images/MOCA/camello.jpg"),
      correctAnswers: ["camello", "dromedario"],
    },
    {
      id: 2,
      image: require("../../images/MOCA/leon.jpg"),
      correctAnswers: ["león", "leon"],
    },
    {
      id: 3,
      image: require("../../images/MOCA/rinoceronte.jpg"),
      correctAnswers: ["rinoceronte"],
    },
  ];

  const [currentAnimalIndex, setCurrentAnimalIndex] = useState(0);
  const [scores, setScores] = useState({});
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [manualInput, setManualInput] = useState("");
  const [useVoice, setUseVoice] = useState(true);
  const [confirmation, setConfirmation] = useState(false);

  const [ttsSupported, setTtsSupported] = useState(true);
  const [isSpeakingLocal, setIsSpeakingLocal] = useState(false);

  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setUseVoice(false);
    } else {
      const recognition = new SpeechRecognition();
      recognition.lang = "es-ES";
      recognition.interimResults = false;

      recognition.onresult = (event) => {
        const result = event.results[0][0].transcript;
        setTranscript(result);
        setListening(false);
        setConfirmation(true);
      };

      recognition.onerror = (event) => {
        // Solo mostrar error si es un error real, no errores normales
        const errorType = event.error;
        // Errores que NO debemos mostrar: 'no-speech', 'aborted', 'audio-capture'
        // Estos son normales cuando el usuario no habla o detiene manualmente
        if (errorType === 'no-speech' || errorType === 'aborted' || errorType === 'audio-capture') {
          setListening(false);
          return;
        }
        // Solo mostrar error para errores reales como 'network', 'not-allowed', etc.
        if (errorType === 'network' || errorType === 'not-allowed' || errorType === 'service-not-allowed') {
          setListening(false);
          alert("Error al reconocer la voz. Intente de nuevo.");
        } else {
          // Para otros errores, solo detener sin mostrar mensaje
          setListening(false);
        }
      };

      recognition.onend = () => {
        setListening(false);
      };

      recognitionRef.current = recognition;
    }

    if (!window.speechSynthesis) {
      setTtsSupported(false);
    }
  }, []);

  const speakInstructions = (text) => {
    return new Promise((resolve) => {
      if (!ttsSupported) {
        resolve();
        return;
      }
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "es-ES";
      utterance.onend = () => resolve();
      window.speechSynthesis.speak(utterance);
    });
  };

  const handleSpeakInstructions = () => {
    if (!ttsSupported) return;
    if (isSpeakingLocal) {
      window.speechSynthesis.cancel();
      setIsSpeakingLocal(false);
    } else {
      const text =
        "Nombre el animal mostrado en la imagen.";
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "es-ES";
      utterance.onend = () => {
        setIsSpeakingLocal(false);
      };
      window.speechSynthesis.speak(utterance);
      setIsSpeakingLocal(true);
    }
  };

  const handleListen = () => {
    if (!recognitionRef.current) {
      alert("Reconocimiento de voz no disponible.");
      return;
    }
    if (!useVoice) {
      alert("El reconocimiento de voz no está habilitado.");
      return;
    }
    setListening(true);
    setTranscript("");
    recognitionRef.current.start();
  };

  const handleStop = () => {
    if (recognitionRef.current && listening) {
      recognitionRef.current.stop();
    }
    setListening(false);
  };

  const normalizeText = (text) => {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  };

  const handleConfirm = () => {
    const currentAnimal = animals[currentAnimalIndex];
    const inputText = normalizeText(transcript || manualInput);

    const isCorrect = currentAnimal.correctAnswers.some(
      (ans) => inputText === normalizeText(ans)
    );

    setScores((prevScores) => ({
      ...prevScores,
      [currentAnimal.id]: isCorrect ? 1 : 0,
    }));

    setManualInput("");
    setTranscript("");
    setConfirmation(false);

    if (currentAnimalIndex < animals.length - 1) {
      setCurrentAnimalIndex(currentAnimalIndex + 1);
    } else {
      handleNext();
    }
  };

  const handleRetry = () => {
    setTranscript("");
    setManualInput("");
    setConfirmation(false);
    handleListen();
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (manualInput.trim() && !confirmation) {
        setConfirmation(true);
      }
    }
  };

  const handleNext = () => {
    let totalScore = 0;
    animals.forEach((animal) => {
      if (scores[animal.id]) {
        totalScore += scores[animal.id];
      }
    });
    onComplete(totalScore, scores);
  };

  const handlePreviousAnimal = () => {
    if (currentAnimalIndex > 0) {
      setCurrentAnimalIndex(currentAnimalIndex - 1);
    }
  };

  useEffect(() => {
    return () => {
      if (recognitionRef.current && listening) {
        recognitionRef.current.abort();
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [listening]);

  return (
    <div className="identificacion-container">
      {/* Header */}
      <div className="mb-4 w-100">
        <h2 className="mb-1 fw-bold" style={{ color: '#004A7C', fontSize: '26px' }}>Identificación de Animales</h2>
        <span className="text-secondary" style={{ fontSize: '15px' }}>Nombre el animal mostrado en la imagen a continuación.</span>
      </div>

      {/* Imagen del animal */}
      <div className="identificacion-image-wrapper">
        <img
          src={animals[currentAnimalIndex].image}
          alt={`Animal ${currentAnimalIndex + 1}`}
          className="identificacion-animal-img"
        />
      </div>

      {/* Sección de respuesta */}
      <div className="identificacion-answer-section">

        {/* Estado: Escuchando */}
        {useVoice && listening && (
          <div className="identificacion-listening-state">
            <div className="identificacion-pulse-ring"></div>
            <Spinner animation="grow" size="sm" className="me-2" style={{ color: "#2563eb" }} />
            <span className="identificacion-listening-text">Escuchando...</span>
            <button
              className="identificacion-stop-btn"
              onClick={handleStop}
            >
              <FaStop className="me-2" />
              Detener
            </button>
          </div>
        )}

        {/* Botón principal Hablar Respuesta */}
        {useVoice && !listening && !confirmation && (
          <button
            className="identificacion-speak-btn"
            onClick={handleListen}
            disabled={!useVoice}
          >
            <FaMicrophone className="me-2" />
            Hablar Respuesta
          </button>
        )}

        {/* Separador */}
        {!listening && !confirmation && (
          <div className="identificacion-divider">
            <span className="identificacion-divider-line"></span>
            <span className="identificacion-divider-text">O ESCRIBE AQUÍ</span>
            <span className="identificacion-divider-line"></span>
          </div>
        )}

        {/* Input de texto */}
        {!listening && !confirmation && (
          <Form onSubmit={(e) => e.preventDefault()} className="w-100">
            <input
              type="text"
              className="identificacion-input"
              placeholder="Ej: Camello"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <button
              className="identificacion-confirm-btn"
              onClick={handleConfirm}
              disabled={!manualInput.trim()}
            >
              Confirmar Respuesta
              <FaCheckCircle className="ms-2" />
            </button>
          </Form>
        )}

        {/* Confirmación de voz */}
        {confirmation && (
          <div className="identificacion-confirmation">
            <div className="identificacion-confirmation-bubble">
              <p className="identificacion-confirmation-question">¿Es correcta su respuesta?</p>
              <p className="identificacion-confirmation-answer">"{transcript || manualInput}"</p>
            </div>
            <div className="identificacion-confirmation-actions">
              <button
                className="identificacion-retry-btn"
                onClick={handleRetry}
              >
                <FaRedo className="me-2" />
                Reintentar
              </button>
              <button
                className="identificacion-yes-btn"
                onClick={handleConfirm}
              >
                <FaCheckCircle className="me-2" />
                Confirmar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Botón Siguiente Pregunta - siempre visible para avanzar a la siguiente fase */}
      <div className="identificacion-nav">
        {isAdmin && (
          <button
            className="identificacion-back-btn"
            onClick={onPrevious}
            disabled={isFirstModule}
          >
            Regresar
          </button>
        )}
        <button
          className="identificacion-siguiente-btn"
          onClick={handleNext}
        >
          Siguiente Pregunta <span className="identificacion-siguiente-arrow">→</span>
        </button>
      </div>
    </div>
  );
};

export default Identificacion;
