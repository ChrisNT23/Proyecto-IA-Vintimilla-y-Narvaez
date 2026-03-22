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

  const spanishNumbersMap = {
    "cero": "0", "uno": "1", "dos": "2", "tres": "3", "cuatro": "4",
    "cinco": "5", "seis": "6", "siete": "7", "ocho": "8", "nueve": "9"
  };

  const processInput = (text) => {
    return text
      .toLowerCase()
      .replace(/[.,]/g, " ")
      .split(/[\s,]+/)
      .map(word => {
        const cleaned = word.trim();
        return spanishNumbersMap[cleaned] || cleaned;
      })
      .filter(x => /^\d+$/.test(x)); // Only keep digits
  };

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

      recognition.onerror = (event) => {
        const errorType = event.error;
        if (errorType === 'no-speech' || errorType === 'aborted' || errorType === 'audio-capture') {
          setListening(false);
          return;
        }
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
        "Módulo de atención, Actividad 1. Escuche una serie de números y repítalos.";
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "es-ES";
      utterance.onend = () => setIsSpeakingLocal(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeakingLocal(true);
    }
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
    if (transcript) {
      const digits = processInput(transcript);
      if (digits.length > 0) {
        setResponses((prev) => {
          if (stage === STAGE_FIRST_SEQUENCE_RECALL) {
            return { ...prev, first: [...prev.first, ...digits] };
          } else if (stage === STAGE_SECOND_SEQUENCE_RECALL) {
            return { ...prev, second: [...prev.second, ...digits] };
          }
          return prev;
        });
      }
    }
    setTranscript("");
    setShowButtons(false);
  };

  const handleAddManualSequence = () => {
    if (!manualInputValue.trim()) return;
    const digits = processInput(manualInputValue);

    if (digits.length > 0) {
      setResponses((prev) => {
        if (stage === STAGE_FIRST_SEQUENCE_RECALL) {
          return { ...prev, first: [...prev.first, ...digits] };
        } else if (stage === STAGE_SECOND_SEQUENCE_RECALL) {
          return { ...prev, second: [...prev.second, ...digits] };
        }
        return prev;
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
      setMessage("Ha completado la Actividad 1 de Atención.");
    }
  };

  const handleNext = () => {
    if (stage === STAGE_FIRST_SEQUENCE_RECALL) {
      setStage(STAGE_SECOND_SEQUENCE_READ);
      return;
    }

    const { first, second } = responses;
    let score = 0;
    const expectedSecond = [...secondSequence].reverse();
    
    // Si cualquiera de las dos secuencias es correcta, suma 1 punto (según config sobre 16)
    if (arraysEqual(first, firstSequence) || arraysEqual(second, expectedSecond)) {
      score = 1;
    }

    console.log("Atencion - Actividad 1 (Digitos) Score calculated:", score);
    console.log(" - First Sequence Expected:", firstSequence, " - Got:", first, " - Match:", arraysEqual(first, firstSequence));
    console.log(" - Second Sequence Expected:", expectedSecond, " - Got:", second, " - Match:", arraysEqual(second, expectedSecond));
    
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
              <Form
                onSubmit={(e) => e.preventDefault()}
                className="mt-3 d-flex flex-column align-items-center"
              >
                <Form.Control
                  type="text"
                  placeholder="Escriba los números separados por espacios o comas"
                  value={manualInputValue}
                  onChange={(e) => setManualInputValue(e.target.value)}
                  onKeyPress={handleManualKeyPress}
                  style={{ maxWidth: "350px" }}
                />
                <Button
                  className="activity-button mt-2"
                  variant="success"
                  onClick={handleAddManualSequence}
                >
                  Agregar
                </Button>
              </Form>

              <div className="mt-3">
                <p className="fw-bold mb-2">Números recordados:</p>
                <div className="d-flex flex-wrap justify-content-center gap-2">
                  {(stage === STAGE_FIRST_SEQUENCE_RECALL
                    ? responses.first
                    : responses.second
                  ).map((number, index) => (
                    <span key={index} className="identificacion-badge" style={{
                      display: 'inline-block',
                      padding: '8px 16px',
                      borderRadius: '50%',
                      backgroundColor: '#eff6ff',
                      color: '#2563eb',
                      fontWeight: 'bold',
                      fontSize: '1.2rem',
                      border: '1px solid #dbeafe',
                      minWidth: '45px',
                      height: '45px',
                      lineHeight: '28px'
                    }}>
                      {number}
                    </span>
                  ))}
                </div>
              </div>

              <Button
                className="activity-button mt-3 mx-auto d-block"
                variant="secondary"
                onClick={handleNoMoreWords}
              >
                No recuerdo más
              </Button>
            </div>
          </div>
        )}

      {/* Unified Navigation Footer */}
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

          <button className="cubo-continue-button" onClick={handleNext}>
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
    console.log("Atencion Module - Activity 1 Complete. Score:", score);
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
