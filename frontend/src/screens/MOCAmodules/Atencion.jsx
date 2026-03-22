// src/screens/MOCAmodules/Atencion.jsx

import React, { useState, useEffect, useRef } from "react";
import { Button, Row, Col, Form, Alert, Spinner } from "react-bootstrap";
import { FaPlay, FaStop, FaMicrophone, FaPlus, FaTimes, FaArrowRight } from "react-icons/fa";
import { useSelector } from "react-redux";
import { buildMocaResult } from './helpers/mocaResultBuilder';
import '../../assets/styles/mocamodules.css';

/* ==============================================
   ACTIVIDAD 1: SECUENCIA NUMERICA
   ============================================== */
const NumberSequenceActivity = ({ onComplete, onPrevious, isFirstModule }) => {
  const isAdmin = useSelector((state) => state.auth.userInfo?.isAdmin) || false;

  const STAGE_FIRST_SEQUENCE_READ = 1;
  const STAGE_FIRST_SEQUENCE_RECALL = 2;
  const STAGE_SECOND_SEQUENCE_READ = 3;
  const STAGE_SECOND_SEQUENCE_RECALL = 4;
  const STAGE_FINAL = 5;

  const firstSequence = ["5", "3", "8", "1", "6"];
  const secondSequence = ["2", "4", "7"];

  const [stage, setStage] = useState(STAGE_FIRST_SEQUENCE_READ);
  const [responses, setResponses] = useState({ first: [], second: [] });
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [ttsSupported, setTtsSupported] = useState(true);
  const [recognitionSupported, setRecognitionSupported] = useState(true);
  const [showButtons, setShowButtons] = useState(false);
  const [isSpeakingLocal, setIsSpeakingLocal] = useState(false);
  const [message, setMessage] = useState("");
  const [manualInputValue, setManualInputValue] = useState("");

  const recognitionRef = useRef(null);

  // Verificar TTS y SpeechRecognition
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
        const result = event.results[0][0].transcript;
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
      if (recognitionRef.current) recognitionRef.current.abort();
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    };
  }, []);

  // Manejo de etapas
  useEffect(() => {
    const handleStage = async () => {
      if (
        stage === STAGE_FIRST_SEQUENCE_READ ||
        stage === STAGE_SECOND_SEQUENCE_READ
      ) {
        let instructions;
        if (stage === STAGE_FIRST_SEQUENCE_READ) {
          instructions =
            "Le voy a leer una serie de números, y cuando termine, repítalos en el mismo orden.";
        } else {
          instructions =
            "Ahora le voy a leer otra serie de números. Repítalos en orden inverso.";
        }
        await speakText(instructions);
        await readSequence();
      }
    };
    handleStage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

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

  const readSequence = () => {
    return new Promise((resolve) => {
      if (!ttsSupported) {
        setStage((prev) => prev + 1);
        resolve();
        return;
      }
      const sequence =
        stage === STAGE_FIRST_SEQUENCE_READ ? firstSequence : secondSequence;
      let index = 0;
      const readNext = () => {
        if (index < sequence.length) {
          const utterance = new SpeechSynthesisUtterance(sequence[index]);
          utterance.lang = "es-ES";
          utterance.onend = () => {
            index++;
            setTimeout(() => {
              readNext();
            }, 700);
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

  const speakInstructions = () => {
    if (!ttsSupported) return;
    if (isSpeakingLocal) {
      window.speechSynthesis.cancel();
      setIsSpeakingLocal(false);
    } else {
      const text =
        "Módulo de atención, Actividad 1. Escuche una serie de nâ”œâ•‘meros y repâ”œÂ¡talos.";
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "es-ES";
      utterance.onend = () => setIsSpeakingLocal(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeakingLocal(true);
    }
  };

  const handleStartRecall = () => {
    if (!recognitionSupported) {
      alert("El reconocimiento de voz no está­ disponible en su navegador.");
      return;
    }
    setListening(true);
    setTranscript("");
    setShowButtons(false);
    recognitionRef.current.start();
  };

  const handleStopListening = () => {
    if (recognitionRef.current) recognitionRef.current.stop();
    setListening(false);
    setShowButtons(false);
  };

  const arraysEqual = (a, b) => {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i].toLowerCase() !== b[i].toLowerCase()) return false;
    }
    return true;
  };

  const handleConfirmResponse = () => {
    const number = transcript.trim();
    if (number) {
      setResponses((prev) => {
        const updated = { ...prev };
        if (stage === STAGE_FIRST_SEQUENCE_RECALL) {
          updated.first.push(number);
        } else if (stage === STAGE_SECOND_SEQUENCE_RECALL) {
          updated.second.push(number);
        }
        return updated;
      });
    }
    setTranscript("");
    setShowButtons(false);
  };

  const handleAddManualSequence = () => {
    if (!manualInputValue.trim()) return;
    const splitted = manualInputValue
      .split(/[\s,]+/)
      .map((x) => x.trim())
      .filter(Boolean);

    if (splitted.length > 0) {
      setResponses((prev) => {
        const updated = { ...prev };
        if (stage === STAGE_FIRST_SEQUENCE_RECALL) {
          updated.first.push(...splitted);
        } else if (stage === STAGE_SECOND_SEQUENCE_RECALL) {
          updated.second.push(...splitted);
        }
        return updated;
      });
    }
    setManualInputValue("");
  };

  const handleManualKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddManualSequence();
    }
  };

  const handleNoMoreWords = () => {
    if (stage === STAGE_FIRST_SEQUENCE_RECALL) {
      setStage(STAGE_SECOND_SEQUENCE_READ);
    } else if (stage === STAGE_SECOND_SEQUENCE_RECALL) {
      setStage(STAGE_FINAL);
      setMessage("Ha completado la Actividad 1 de Atenciâ”œâ”‚n.");
    }
  };

  const handleNext = () => {
    const { first, second } = responses;
    let score = 0;
    if (arraysEqual(first, firstSequence)) {
      score += 1;
    }
    const expectedSecond = [...secondSequence].reverse();
    if (arraysEqual(second, expectedSecond)) {
      score += 1;
    }
    const standardResults = [buildMocaResult("Digitos", score)];
    onComplete(score, { ...responses, standardResults });
  };

  return (
    <div className="w-100 d-flex flex-column align-items-center">
      {/* Breadcrumb Section */}
      <div className="cubo-section-breadcrumb text-center">
        SECCIÓN 4: ATENCIÓN
      </div>

      {/* Header Section */}
      <div className="cubo-header text-center">
        <h1 className="cubo-title">
          Atención <span className="text-primary">(Secuencia Numérica)</span>
        </h1>
        <p className="cubo-subtitle">Módulo de Atención - Actividad 1</p>
      </div>

      {/* Mostrando lectura de secuencia */}
      {(stage === STAGE_FIRST_SEQUENCE_READ ||
        stage === STAGE_SECOND_SEQUENCE_READ) && (
          <div className="mem-reading-wrapper">
            <div className="mem-reading-card">
              <div className="mem-reading-spinner-wrap">
                <Spinner animation="border" style={{ color: "#2563eb", width: "3rem", height: "3rem" }} />
              </div>
              <h3 className="mem-reading-title">
                {stage === STAGE_FIRST_SEQUENCE_READ ? "Escuche con atención" : "Escuche nuevamente"}
              </h3>
              <p className="mem-reading-desc">
                {stage === STAGE_FIRST_SEQUENCE_READ
                  ? "Le leeré una serie de números, repítalos en el mismo orden."
                  : "Le leerá otra serie de números, repítalos en orden inverso."}
              </p>
              <div className="mem-reading-waves">
                {[4, 8, 6, 10, 7, 5, 9, 6, 4, 8].map((h, i) => (
                  <div key={i} className="mem-reading-wave-bar" style={{ animationDelay: `${i * 0.1}s`, height: `${h * 4}px` }} />
                ))}
              </div>
            </div>
          </div>
        )}

      {/* Usuario repite secuencia */}
      {(stage === STAGE_FIRST_SEQUENCE_RECALL ||
        stage === STAGE_SECOND_SEQUENCE_RECALL) && !message && (
          <div className="mem-recall-wrapper">
            <div className="mem-recall-card">
              <h2 className="mem-recall-title">
                {stage === STAGE_FIRST_SEQUENCE_RECALL
                  ? "Repita los números en el mismo orden"
                  : "Repita los números en orden inverso"}
              </h2>
              <p className="mem-recall-subtitle">Puede usar el micrófono o escribir los números manualmente.</p>

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
                    <p className="mem-recall-confirm-q">¿Es correcta su respuesta?</p>
                    <p className="mem-recall-confirm-word">"{transcript}"</p>
                  </div>
                  <div className="mem-recall-confirm-actions">
                    <button className="mem-recall-retry-btn" onClick={() => { setTranscript(""); setShowButtons(false); handleStartRecall(); }}>
                      Reintentar
                    </button>
                    <button className="mem-recall-yes-btn" onClick={handleConfirmResponse}>
                      Sí, agregar
                    </button>
                  </div>
                </div>
              )}

              {/* Entrada manual */}
              <div className="mem-recall-input-row">
                <div className="mem-recall-input-wrap">
                  <span className="mem-recall-input-icon">✏️</span>
                  <input
                    type="text"
                    className="mem-recall-input"
                    placeholder="Escriba los números separados por espacios..."
                    value={manualInputValue}
                    onChange={(e) => setManualInputValue(e.target.value)}
                    onKeyPress={handleManualKeyPress}
                  />
                </div>
                <button className="mem-recall-add-btn" onClick={handleAddManualSequence}>
                  <FaPlus className="me-1" size={13} /> Agregar
                </button>
              </div>

              {/* Números recordados */}
              <div className="mem-recall-words-section">
                <p className="mem-recall-words-label">NÚMEROS REGISTRADOS</p>
                <div className="mem-recall-chips">
                  {(stage === STAGE_FIRST_SEQUENCE_RECALL
                    ? responses.first
                    : responses.second
                  ).map((number, index) => (
                    <span key={index} className="mem-recall-chip">
                      {number}
                    </span>
                  ))}
                  {(stage === STAGE_FIRST_SEQUENCE_RECALL ? responses.first.length : responses.second.length) === 0 && (
                    <span className="mem-recall-chip-placeholder">Esperando números...</span>
                  )}
                </div>
              </div>

              <button className="mem-recall-no-more-btn mt-3" onClick={handleNoMoreWords}>
                ❓ No recuerdo más
              </button>
            </div>
          </div>
        )}
      {/* Pantalla Final */}
      {stage === STAGE_FINAL && (
        <div className="mem-final-wrapper">
          <div className="mem-final-card">
            <div className="mem-final-icon">✅</div>
            <h2 className="mem-final-title">¡Actividad Completada!</h2>
            <p className="mem-final-message">{message}</p>
          </div>
        </div>
      )}

      {/* Unified Navigation Footer */}
      <div className="cubo-footer mt-5" style={{ width: '100%', maxWidth: '700px' }}>
        <button
          className="cubo-undo-button"
          onClick={onPrevious}
          disabled={isFirstModule}
          style={{ padding: '0.8rem 1.5rem', fontSize: '1rem' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          Regresar
        </button>

        <button
          className="cubo-continue-button"
          onClick={handleNext}
        >
          Siguiente Pregunta
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
        </button>
      </div>
    </div>
  );
};


/* ==============================================
   MÓDULO PRINCIPAL DE ATENCIÓN
   ============================================== */
const Atencion = ({ onComplete, onPrevious, isFirstModule }) => {
  const handleActivity1Complete = (score, data) => {
    onComplete(score, {
      activity1: score,
      standardResults: data.standardResults,
    });
  };

  return (
    <div className="module-container w-100">
      <NumberSequenceActivity
        onComplete={handleActivity1Complete}
        onPrevious={onPrevious}
        isFirstModule={isFirstModule}
      />
    </div>
  );
};

export default Atencion;

