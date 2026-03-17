// src/screens/MOCAmodules/Identificacion.jsx

import React, { useState, useEffect, useRef } from "react";
import { Button, Row, Col, Image, Alert, Form, Spinner } from "react-bootstrap";
import { FaPlay, FaStop, FaMicrophone, FaVolumeUp, FaCheckCircle, FaRedo } from "react-icons/fa";
import { useSelector } from "react-redux";
import { buildMocaResult } from './helpers/mocaResultBuilder';
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

    const standardResults = [
      buildMocaResult("Identificacion", totalScore)
    ];

    onComplete(totalScore, {
      ...scores,
      totalScore,
      standardResults
    });
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
    <div className="w-100 h-100 d-flex flex-column" style={{ padding: "20px 40px" }}>
      {/* Breadcrumb Section */}
      <div className="cubo-section-breadcrumb">
        SECCIÓN 2: IDENTIFICACIÓN
      </div>

      {/* Header Section */}
      <div className="cubo-header">
        <h1 className="cubo-title">
          Identificación <span className="text-primary">(Animales)</span>
        </h1>
        <p className="cubo-subtitle">Prueba de denominación de animales</p>
      </div>

      {/* Instruction Row */}
      <div className="cubo-instruction-row">
        <div className="cubo-instruction-box">
          <div className="cubo-instruction-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
          </div>
          <p className="cubo-instruction-text">
            Nombre el <strong>animal</strong> mostrado en la imagen a continuación.
          </p>
        </div>
        <button
          className="cubo-tts-button"
          onClick={handleSpeakInstructions}
          disabled={isSpeakingLocal}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5L6 9H2v6h4l5 4V5z"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
          Escuchar Instrucciones
        </button>
      </div>

      {/* Image Section */}
      <div className="cubo-canvas-main-container mb-4">
        <div className="d-flex justify-content-center py-4">
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '1.5rem',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
            border: '2px solid #f1f5f9'
          }}>
            <img
              src={animals[currentAnimalIndex].image}
              alt={`Animal ${currentAnimalIndex + 1}`}
              style={{
                maxWidth: '400px',
                height: 'auto',
                borderRadius: '12px'
              }}
            />
          </div>
        </div>
      </div>

      {/* Answer Section */}
      <div className="d-flex flex-column align-items-center mb-5">
        <div style={{ maxWidth: '500px', width: '100%' }}>
          {/* Status: Listening */}
          {useVoice && listening && (
            <div className="identificacion-listening-state mb-4">
              <div className="identificacion-pulse-ring"></div>
              <Spinner animation="grow" size="sm" className="me-2" style={{ color: "#2563eb" }} />
              <span className="identificacion-listening-text">Escuchando...</span>
              <button className="identificacion-stop-btn" onClick={handleStop}>
                <FaStop className="me-2" />
                Detener
              </button>
            </div>
          )}

          {/* Voice Button */}
          {useVoice && !listening && !confirmation && (
            <button
              className="identificacion-speak-btn mb-4 w-100"
              onClick={handleListen}
              disabled={!useVoice}
            >
              <FaMicrophone className="me-2" />
              Hablar Respuesta
            </button>
          )}

          {/* Divider */}
          {!listening && !confirmation && (
            <div className="identificacion-divider mb-4">
              <span className="identificacion-divider-line"></span>
              <span className="identificacion-divider-text uppercase">O ESCRIBE AQUÍ</span>
              <span className="identificacion-divider-line"></span>
            </div>
          )}

          {/* Text Input */}
          {!listening && !confirmation && (
            <Form onSubmit={(e) => e.preventDefault()} className="w-100">
              <input
                type="text"
                className="identificacion-input mb-4"
                placeholder="Ej: Camello"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                onKeyPress={handleKeyPress}
                style={{
                  height: '60px',
                  fontSize: '1.1rem',
                  borderRadius: '16px',
                  border: '2px solid #e2e8f0',
                  padding: '0 1.5rem',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                }}
              />
              <button
                className="cubo-continue-button w-100 justify-content-center"
                style={{ height: '60px', fontSize: '1.1rem' }}
                onClick={handleConfirm}
                disabled={!manualInput.trim()}
              >
                Confirmar Respuesta
                <FaCheckCircle className="ms-2" />
              </button>
            </Form>
          )}

          {/* Voice Confirmation */}
          {confirmation && (
            <div className="identificacion-confirmation">
              <div className="identificacion-confirmation-bubble">
                <p className="identificacion-confirmation-question">¿Es correcta su respuesta?</p>
                <p className="identificacion-confirmation-answer">"{transcript || manualInput}"</p>
              </div>
              <div className="identificacion-confirmation-actions">
                <button className="identificacion-retry-btn" onClick={handleRetry}>
                  <FaRedo className="me-2" />
                  Reintentar
                </button>
                <button className="identificacion-yes-btn" onClick={handleConfirm}>
                  <FaCheckCircle className="me-2" />
                  Confirmar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Unified Footer */}
      <div className="cubo-footer mt-auto">
        <button
          className="cubo-undo-button"
          onClick={onPrevious}
          style={{ padding: '0.8rem 1.5rem', fontSize: '1rem' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          Regresar
        </button>

        <button className="cubo-continue-button" onClick={handleNext}>
          Siguiente Pregunta
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
        </button>
      </div>
    </div>
  );
};

export default Identificacion;
