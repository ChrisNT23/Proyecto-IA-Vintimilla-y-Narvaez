// src/screens/MOCAmodules/Memoria.jsx

import React, { useState, useEffect, useRef } from "react";
import { Button, Row, Col, Form, Alert, Spinner } from "react-bootstrap";
import { FaPlay, FaStop, FaMicrophone, FaArrowRight, FaPlus, FaTimes } from "react-icons/fa";
import { useSelector } from "react-redux";
import { buildMocaResult } from './helpers/mocaResultBuilder';
import '../../assets/styles/mocamodules.css';

const Memoria = ({ onComplete, onPrevious, isFirstModule }) => {
  const isAdmin = useSelector((state) => state.auth.userInfo?.isAdmin) || false;

  const wordList = ["ROSTRO", "SEDA", "IGLESIA", "CLAVEL", "ROJO"];

  // Definición de etapas
  const STAGE_FIRST_READ = 1;
  const STAGE_FIRST_RECALL = 2;
  const STAGE_SECOND_READ = 3;
  const STAGE_SECOND_RECALL = 4;
  const STAGE_FINAL = 5;

  const [stage, setStage] = useState(STAGE_FIRST_READ);
  const [started, setStarted] = useState(false); // ← controla si ya arrancó
  const [responses, setResponses] = useState([]);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [ttsSupported, setTtsSupported] = useState(true);
  const [recognitionSupported, setRecognitionSupported] = useState(true);
  const [showButtons, setShowButtons] = useState(false);
  const [isSpeakingLocal, setIsSpeakingLocal] = useState(false);
  const [manualWords, setManualWords] = useState("");
  const [message, setMessage] = useState("");

  const recognitionRef = useRef(null);

  useEffect(() => {
    if (!window.speechSynthesis) {
      setTtsSupported(false);
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setRecognitionSupported(false);
    } else {
      const recognition = new SpeechRecognition();
      recognition.lang = "es-ES";
      recognition.interimResults = false;

      recognition.onresult = (event) => {
        const result = event.results[0][0].transcript.toUpperCase().trim();
        setTranscript(result);
        setListening(false);
        setShowButtons(true);
      };

      recognition.onerror = () => {
        setListening(false);
        alert("Error al reconocer la voz. Intente de nuevo.");
      };

      recognition.onend = () => {
        setListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Solo ejecuta el TTS cuando el usuario ya hizo clic en "Empezar"
  useEffect(() => {
    if (!started) return;
    const executeStageActions = async () => {
      if (stage === STAGE_FIRST_READ || stage === STAGE_SECOND_READ) {
        let instructions;
        if (stage === STAGE_FIRST_READ) {
          instructions =
            "Ésta es una prueba de memoria. Le voy a leer una lista de palabras que debe recordar. Escuche con atención.";
        } else {
          instructions =
            "Ahora le voy a leer la misma lista de palabras una vez más. Intente acordarse del mayor número posible de palabras, incluyendo las que repitió en la primera ronda.";
        }
        await speakText(instructions);
        await readWords();
      }
    };
    executeStageActions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, started]);

  const speakText = (text) => {
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

  const readWords = () => {
    return new Promise((resolve) => {
      if (!ttsSupported) {
        setStage((prev) => prev + 1);
        resolve();
        return;
      }
      let index = 0;
      const readNext = () => {
        if (index < wordList.length) {
          const utterance = new SpeechSynthesisUtterance(wordList[index]);
          utterance.lang = "es-ES";
          utterance.onend = () => {
            index++;
            setTimeout(() => {
              readNext();
            }, 1000);
          };
          window.speechSynthesis.speak(utterance);
        } else {
          setStage((prev) => prev + 1);
          resolve();
        }
      };
      readNext();
    });
  };

  const handleSpeakInstructions = () => {
    if (!ttsSupported) return;
    if (isSpeakingLocal) {
      window.speechSynthesis.cancel();
      setIsSpeakingLocal(false);
    } else {
      const text =
        "Prueba de memoria. Le leeré una lista de palabras que deberá recordar. Escuche y luego repita todas las que pueda.";
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "es-ES";
      utterance.onend = () => {
        setIsSpeakingLocal(false);
      };
      window.speechSynthesis.speak(utterance);
      setIsSpeakingLocal(true);
    }
  };

  // Arrancar la evaluación
  const handleStart = () => {
    setStarted(true);
  };

  const handleStartRecall = () => {
    if (!recognitionSupported) {
      alert("El reconocimiento de voz no está disponible en su navegador.");
      return;
    }
    setListening(true);
    setTranscript("");
    setShowButtons(false);
    recognitionRef.current.start();
  };

  const handleStopListening = () => {
    if (recognitionRef.current && listening) {
      recognitionRef.current.stop();
    }
    setListening(false);
    setShowButtons(false);
  };

  const addResponse = (word) => {
    if (!word) return;
    setResponses((prev) => [...prev, word]);
  };

  const handleConfirmWord = () => {
    addResponse(transcript);
    setTranscript("");
    setShowButtons(false);
  };

  const handleRetry = () => {
    setTranscript("");
    setShowButtons(false);
    handleStartRecall();
  };

  const handleAddManualWords = () => {
    if (manualWords.trim() !== "") {
      const splitted = manualWords
        .toUpperCase()
        .split(/[\s,]+/)
        .filter((w) => w);
      splitted.forEach((w) => addResponse(w));
      setManualWords("");
    }
  };

  const handleManualKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddManualWords();
    }
  };

  const handleRemoveWord = (index) => {
    setResponses((prev) => prev.filter((_, i) => i !== index));
  };

  const handleNoMoreWords = () => {
    if (stage === STAGE_FIRST_RECALL) {
      setStage(STAGE_SECOND_READ);
    } else if (stage === STAGE_SECOND_RECALL) {
      setStage(STAGE_FINAL);
      setMessage(
        "Ha completado la prueba de memoria."
      );
    }
  };

  const handleNext = () => {
    const uniqueResponses = Array.from(new Set(responses));
    let score = 0;
    uniqueResponses.forEach((resp) => {
      if (wordList.map((w) => w.toUpperCase()).includes(resp)) {
        score++;
      }
    });

    const standardResults = [buildMocaResult("Memoria", score)];

    // En MoCA, el recuerdo inmediato (esta actividad) no suma puntos al total.
    // Pasamos 0 como primer argumento para no afectar el totalScore del test,
    // pero incluimos la cuenta de palabras en el objeto de datos.
    onComplete(0, { responses: uniqueResponses, standardResults, totalRecalled: score });
  };

  // ─── PANTALLA INTRO (antes de empezar) ───────────────────────────────────
  if (!started) {
    return (
      <div className="w-100 d-flex flex-column align-items-center">
        {/* Breadcrumb Section */}
        <div className="cubo-section-breadcrumb text-center">
          SECCIÓN 3: MEMORIA
        </div>

        {/* Header Section */}
        <div className="cubo-header text-center">
          <h1 className="cubo-title">
            Memoria <span className="text-primary">(Trabajo y Retención Digital)</span>
          </h1>
          <p className="cubo-subtitle">Memoria de Trabajo y Retención Digital</p>
        </div>

        {/* Card de instrucciones */}
        <div className="mem-intro-card">
          {/* Columna izquierda: icono */}
          <div className="mem-intro-icon-col">
            <div className="mem-intro-icon-person">
              <svg width="60" height="70" viewBox="0 0 60 70" fill="none">
                <circle cx="28" cy="18" r="14" fill="#2563eb" opacity="0.85" />
                <path d="M4 60 C4 42 52 42 52 60" stroke="#2563eb" strokeWidth="5" strokeLinecap="round" fill="none" opacity="0.85" />
                {/* Sound waves */}
                <path d="M40 22 Q46 28 40 34" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                <path d="M45 18 Q55 28 45 38" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.5" />
              </svg>
            </div>
            <div className="mem-intro-waveform">
              {[3, 7, 5, 9, 6, 4, 8, 5, 3, 7].map((h, i) => (
                <div key={i} className="mem-intro-wave-bar" style={{ height: `${h * 4}px` }} />
              ))}
            </div>
          </div>

          {/* Columna derecha: texto */}
          <div className="mem-intro-content-col">
            <div className="mem-intro-step-badge">
              <span className="mem-intro-step-num">1</span>
              <h2 className="mem-intro-step-title">Escuche con atención</h2>
            </div>
            <p className="mem-intro-desc">
              A continuación, se presentará una{" "}
              <span className="mem-intro-highlight">serie de palabras</span>. Su
              tarea es recordarlas y repetirlas cuando se le indique.
            </p>
            <div className="mem-intro-tip">
              <span className="mem-intro-tip-icon">ℹ️</span>
              <span className="mem-intro-tip-text">
                Asegúrese de estar en un lugar tranquilo, con el volumen adecuado y sin interrupciones externas.
              </span>
            </div>
            <button
              className="mem-intro-listen-btn"
              onClick={handleSpeakInstructions}
              disabled={isSpeakingLocal}
            >
              <span className="mem-intro-listen-icon">
                {isSpeakingLocal ? <FaStop size={14} /> : <FaPlay size={14} />}
              </span>
              {isSpeakingLocal ? "Reproduciendo..." : "Escuchar Instrucciones"}
            </button>
          </div>
        </div>

        {/* Botones de Navegación Footer */}
        <div className="cubo-footer mt-5">
          <button
            className="cubo-undo-button"
            onClick={onPrevious}
            disabled={isFirstModule}
            style={{ padding: '0.8rem 1.5rem', fontSize: '1rem' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            Regresar
          </button>

          <button className="cubo-continue-button" onClick={handleStart}>
            Empezar Evaluación
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
          </button>
        </div>
      </div>
    );
  }

  // ─── PANTALLA LEYENDO PALABRAS ────────────────────────────────────────────
  if (stage === STAGE_FIRST_READ || stage === STAGE_SECOND_READ) {
    return (
      <div className="w-100 d-flex flex-column align-items-center">
        {/* Breadcrumb Section */}
        <div className="cubo-section-breadcrumb text-center">
          SECCIÓN 3: MEMORIA
        </div>

        {/* Header Section */}
        <div className="cubo-header text-center">
          <h1 className="cubo-title">
            Memoria <span className="text-primary">(Lectura)</span>
          </h1>
          <p className="cubo-subtitle">Memoria de Trabajo y Retención Digital</p>
        </div>

        <div className="mem-reading-wrapper">
        <div className="mem-reading-card">
          <div className="mem-reading-spinner-wrap">
            <Spinner animation="border" style={{ color: "#2563eb", width: "3rem", height: "3rem" }} />
          </div>
          <h3 className="mem-reading-title">
            {stage === STAGE_FIRST_READ ? "Escuche con atención" : "Escuche nuevamente"}
          </h3>
          <p className="mem-reading-desc">
            {stage === STAGE_FIRST_READ
              ? "Se está leyendo la lista de palabras. Préstele atención para poder recordarlas."
              : "Repasando la lista de palabras..."}
          </p>
          <div className="mem-reading-waves">
            {[4, 8, 6, 10, 7, 5, 9, 6, 4, 8].map((h, i) => (
              <div key={i} className="mem-reading-wave-bar" style={{ animationDelay: `${i * 0.1}s`, height: `${h * 4}px` }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

  // ─── PANTALLA RECALL ──────────────────────────────────────────────────────
  if ((stage === STAGE_FIRST_RECALL || stage === STAGE_SECOND_RECALL) && !message) {
    return (
      <div className="w-100 d-flex flex-column align-items-center">
        {/* Breadcrumb Section */}
        <div className="cubo-section-breadcrumb text-center">
          SECCIÓN 3: MEMORIA
        </div>

        {/* Header Section */}
        <div className="cubo-header text-center">
          <h1 className="cubo-title">
            Memoria <span className="text-primary">(Recuerdo Inmediato)</span>
          </h1>
          <p className="cubo-subtitle">Memoria de Trabajo y Retención Digital</p>
        </div>

        <div className="mem-recall-wrapper">
        <div className="mem-recall-card">
          <h2 className="mem-recall-title">Dígame todas las palabras que recuerde</h2>
          <p className="mem-recall-subtitle">Puede usar el micrófono o escribir las palabras manualmente.</p>

          {/* Micrófono */}
          {!showButtons && (
            <div className="mem-recall-mic-section">
              {listening ? (
                <>
                  <button className="mem-recall-mic-btn mem-recall-mic-active" onClick={handleStopListening}>
                    <FaMicrophone size={28} color="#fff" />
                  </button>
                  <p className="mem-recall-mic-label">ESCUCHANDO...</p>
                </>
              ) : (
                <>
                  <button
                    className="mem-recall-mic-btn"
                    onClick={handleStartRecall}
                    disabled={!recognitionSupported}
                  >
                    <FaMicrophone size={28} color="#fff" />
                  </button>
                  <p className="mem-recall-mic-label">TOCAR PARA HABLAR</p>
                </>
              )}
            </div>
          )}

          {/* Confirmación voz */}
          {showButtons && (
            <div className="mem-recall-confirm">
              <div className="mem-recall-confirm-bubble">
                <p className="mem-recall-confirm-q">¿Es correcta la palabra escuchada?</p>
                <p className="mem-recall-confirm-word">"{transcript}"</p>
              </div>
              <div className="mem-recall-confirm-actions">
                <button className="mem-recall-retry-btn" onClick={handleRetry}>
                  Reintentar
                </button>
                <button className="mem-recall-yes-btn" onClick={handleConfirmWord}>
                  Sí, agregar
                </button>
              </div>
            </div>
          )}

          {/* Input manual */}
          <div className="mem-recall-input-row">
            <div className="mem-recall-input-wrap">
              <span className="mem-recall-input-icon">✏️</span>
              <input
                type="text"
                className="mem-recall-input"
                placeholder="Escribir palabra..."
                value={manualWords}
                onChange={(e) => setManualWords(e.target.value.toUpperCase())}
                onKeyPress={handleManualKeyPress}
              />
            </div>
            <button className="mem-recall-add-btn" onClick={handleAddManualWords}>
              <FaPlus className="me-1" size={13} /> Agregar
            </button>
          </div>

          {/* Palabras registradas */}
          <div className="mem-recall-words-section">
            <p className="mem-recall-words-label">PALABRAS REGISTRADAS</p>
            <div className="mem-recall-chips">
              {responses.map((word, i) => (
                <span key={i} className="mem-recall-chip">
                  {word}
                  <button className="mem-recall-chip-remove" onClick={() => handleRemoveWord(i)}>
                    <FaTimes size={11} />
                  </button>
                </span>
              ))}
              {responses.length < 5 && (
                <span className="mem-recall-chip-placeholder">Esperando más palabras...</span>
              )}
            </div>
          </div>
        </div>

        {/* Botones inferiores */}
        <div className="cubo-footer mt-4">
          <button
            className="cubo-undo-button"
            onClick={onPrevious}
            disabled={isFirstModule}
            style={{ padding: '0.8rem 1.5rem', fontSize: '1rem' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            Regresar
          </button>

          <button className="mem-recall-no-more-btn me-2" onClick={handleNoMoreWords}>
            ❓ No recuerdo más
          </button>

          <button className="cubo-continue-button" onClick={handleNext}>
            Siguiente Pregunta
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
          </button>
        </div>
      </div>
    </div>
  );
}

  // ─── PANTALLA FINAL ───────────────────────────────────────────────────────
  return (
    <div className="mem-final-wrapper">
      <div className="cubo-footer mt-4" style={{ width: '100%', maxWidth: '600px' }}>
        <button
          className="cubo-undo-button"
          onClick={onPrevious}
          disabled={isFirstModule}
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

export default Memoria;
