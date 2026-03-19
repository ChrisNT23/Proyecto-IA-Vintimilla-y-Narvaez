// src/screens/MOCAmodules/Lenguaje.jsx

import React, { useState, useEffect, useRef } from "react";
import { Button, Form, Spinner, Alert, Row, Col } from "react-bootstrap";
import { FaPlay, FaStop, FaMicrophone } from "react-icons/fa";
import { useSelector } from "react-redux";
import { buildMocaResult } from './helpers/mocaResultBuilder';
import '../../assets/styles/mocamodules.css';

/* ==============================================
   ACTIVIDAD 1: REPETICIÓN DE FRASES
   ============================================== */
const RepeticionFrasesActivity = ({ onComplete }) => {
  const phrases = [
    "El gato se esconde bajo el sofá cuando los perros entran en la sala",
    "Espero que él le entregue el mensaje una vez que ella se lo pida",
  ];

  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [activityAnswers, setActivityAnswers] = useState([]);
  const [scoresMap, setScoresMap] = useState({});
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [manualInput, setManualInput] = useState("");
  const [useVoice, setUseVoice] = useState(true);
  const [ttsSupported, setTtsSupported] = useState(true);
  const [isSpeakingLocal, setIsSpeakingLocal] = useState(false);
  const recognitionRef = useRef(null);
  const [hasHeardPhrase, setHasHeardPhrase] = useState(false);
  const [confirmation, setConfirmation] = useState(false);

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

      recognition.onerror = () => {
        setListening(false);
        alert("Error al reconocer la voz. Intente de nuevo.");
      };

      recognition.onend = () => {
        setListening(false);
      };

      recognitionRef.current = recognition;
    }

    if (!window.speechSynthesis) {
      setTtsSupported(false);
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

  const handleListen = () => {
    if (!recognitionRef.current) {
      alert("Reconocimiento de voz no disponible.");
      return;
    }
    if (!hasHeardPhrase) {
      alert("Primero debe escuchar la frase antes de responder.");
      return;
    }
    setListening(true);
    setTranscript("");
    recognitionRef.current.start();
  };

  const handleStop = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setListening(false);
  };

  const speakPhrase = (text) => {
    if (!ttsSupported) return;
    if (isSpeakingLocal) {
      window.speechSynthesis.cancel();
      setIsSpeakingLocal(false);
    } else {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "es-ES";
      utterance.onend = () => {
        setIsSpeakingLocal(false);
        setHasHeardPhrase(true);
      };
      window.speechSynthesis.speak(utterance);
      setIsSpeakingLocal(true);
    }
  };

  const normalizeText = (text) =>
    text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9 ]/g, "")
      .trim()
      .replace(/\s+/g, " ");

  const handleConfirm = () => {
    const phraseOrig = phrases[currentPhraseIndex];
    const userResp = transcript || manualInput;

    setActivityAnswers((prev) => [
      ...prev,
      { phraseIndex: currentPhraseIndex, response: userResp },
    ]);

    const isCorrect =
      normalizeText(userResp) === normalizeText(phraseOrig) ? 1 : 0;

    setScoresMap((prev) => ({
      ...prev,
      [currentPhraseIndex]: isCorrect,
    }));

    setManualInput("");
    setTranscript("");
    setConfirmation(false);

    if (currentPhraseIndex < phrases.length - 1) {
      setCurrentPhraseIndex(currentPhraseIndex + 1);
      setHasHeardPhrase(false);
    } else {
      const partialScore = Object.values(scoresMap).reduce((a, b) => a + b, 0);
      const lastScore = isCorrect;
      const totalScore = partialScore + lastScore;

      console.log("Lenguaje - Repeticion de Frases Score calculated:", totalScore);

      const standardResults = [buildMocaResult("Repeticion", totalScore)];
      onComplete(totalScore, {
        activityScore: totalScore,
        phraseAnswers: [
          ...activityAnswers,
          { phraseIndex: currentPhraseIndex, response: userResp },
        ],
        standardResults
      });
    }
  };


  const handleRetry = () => {
    setTranscript("");
    setManualInput("");
    setConfirmation(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (manualInput.trim() && hasHeardPhrase && !confirmation) {
        setConfirmation(true);
      }
    }
  };

  return (
    <div className="module-container">
      <div className="d-flex align-items-center mb-2">
        <h4 className="mb-0">Repetición de Frases</h4>
        <Button
          variant="link"
          onClick={() =>
            speakPhrase(
              "Ahora le leeré una frase y me gustaría que la repitiera."
            )
          }
          disabled={isSpeakingLocal}
          className="listen-button ms-3 text-decoration-none"
        >
          <FaPlay /> Escuchar<br />Instrucciones
        </Button>
      </div>

      <p>Repita exactamente la frase que escuche.</p>

      {!confirmation && (
        <div className="text-center mt-3">
          <Button
            className="activity-button mb-3 d-block mx-auto"
            onClick={() => speakPhrase(phrases[currentPhraseIndex])}
            disabled={isSpeakingLocal || hasHeardPhrase}
            style={{ minWidth: "180px" }}
          >
            Escuchar la frase
          </Button>

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
              disabled={!hasHeardPhrase || listening}
              style={{ maxWidth: "400px" }}
            />
            <Button
              className="activity-button me-2 mt-2"
              variant="success"
              onClick={() => setConfirmation(true)}
              disabled={!manualInput.trim() || !hasHeardPhrase}
              style={{ minWidth: "150px" }}
            >
              Confirmar
            </Button>
          </Form>

          {useVoice && !confirmation && (
            listening ? (
              <div className="mt-3">
                <Spinner animation="grow" variant="primary" />
                <p className="mt-2">Escuchando...</p>
                <Button
                  className="activity-button"
                  variant="danger"
                  onClick={handleStop}
                  style={{ minWidth: "150px" }}
                >
                  Detener
                </Button>
              </div>
            ) : (
              <Button
                className="activity-button mt-3"
                variant="primary"
                onClick={handleListen}
                disabled={!hasHeardPhrase}
                style={{ minWidth: "150px" }}
              >
                <FaMicrophone className="me-2" />
                Hablar
              </Button>
            )
          )}
        </div>
      )}

      {confirmation && (
        <div className="text-center mt-3">
          <Alert variant="secondary">
            <p>¿Es correcta su respuesta?</p>
            <strong>"{transcript || manualInput}"</strong>
          </Alert>
          <div className="d-flex justify-content-center">
            <Button
              className="activity-button me-3"
              variant="warning"
              onClick={handleRetry}
              style={{ minWidth: "100px" }}
            >
              Reintentar
            </Button>
            <Button
              className="activity-button"
              variant="success"
              onClick={handleConfirm}
              style={{ minWidth: "100px" }}
            >
              Sí
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

/* ==============================================
   ACTIVIDAD 2: FLUIDEZ VERBAL
   ============================================== */
const FluidezVerbalActivity = ({ onComplete }) => {
  const [timer, setTimer] = useState(60);
  const [isRunning, setIsRunning] = useState(false);
  const [wordList, setWordList] = useState([]);
  const [inputWord, setInputWord] = useState("");
  const [useVoice, setUseVoice] = useState(true);
  const [listening, setListening] = useState(false);
  const [ttsSupported, setTtsSupported] = useState(true);
  const [isSpeakingLocal, setIsSpeakingLocal] = useState(false);

  const recognitionRef = useRef(null);

  // Usamos un ref para rastrear si el usuario quiere que el micrófono esté activo
  const wantListening = useRef(false);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setUseVoice(false);
    } else {
      const recognition = new SpeechRecognition();
      recognition.lang = "es-ES";
      recognition.interimResults = false;
      recognition.continuous = true;

      recognition.onresult = (event) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            const result = event.results[i][0].transcript
              .toLowerCase()
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
              .replace(/[^a-z0-9\s]/g, "")
              .trim();

            const words = result.split(/\s+/)
              .filter((w) => w.length > 1 && w.startsWith("p"));

            setWordList((prev) => {
              const combined = [...prev, ...words];
              return combined.filter(
                (word, idx, arr) => arr.indexOf(word) === idx
              );
            });
          }
        }
      };

      recognition.onerror = (event) => {
        const errorType = event.error;
        console.warn("Recognition error:", errorType);
        // Si es un error común como silencio o cancelado, no hacemos nada y dejamos que onend lo gestione
        if (errorType === 'no-speech' || errorType === 'aborted') {
          return;
        }
        wantListening.current = false;
        setListening(false);
        if (errorType !== 'audio-capture') {
          alert(`Error al reconocer la voz (${errorType}). Intente de nuevo.`);
        }
      };

      recognition.onend = () => {
        // Solo reiniciar si el usuario aún tiene activo el micrófono y hay tiempo
        if (wantListening.current && timer > 0) {
          try {
            recognition.start();
          } catch (e) {
            // Ya está iniciado
          }
        } else {
          setListening(false);
          wantListening.current = false;
        }
      };

      recognitionRef.current = recognition;
    }

    if (!window.speechSynthesis) {
      setTtsSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
    // Quitamos timer y listening de las dependencias para evitar recrear el objeto muchas veces
  }, [isRunning]);

  useEffect(() => {
    let interval = null;
    if (isRunning && timer > 0) {
      interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 1000);
    } else if (timer === 0) {
      setIsRunning(false);
      clearInterval(interval);
      if (listening) handleStopListening();
      calculateScore();
    }
    return () => clearInterval(interval);
  }, [isRunning, timer, listening]);

  const speakInstructions = () => {
    if (!ttsSupported) return;
    if (isSpeakingLocal) {
      window.speechSynthesis.cancel();
      setIsSpeakingLocal(false);
    } else {
      const text =
        "Tiene 60 segundos para decir o escribir tantas palabras como sea posible que comiencen con la letra P. Presione Iniciar cuando esté listo.";
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "es-ES";
      utterance.onend = () => {
        setIsSpeakingLocal(false);
      };
      window.speechSynthesis.speak(utterance);
      setIsSpeakingLocal(true);
    }
  };

  const handleStart = () => {
    setTimer(60);
    setWordList([]);
    setIsRunning(true);
  };

  const handleInputChange = (e) => {
    setInputWord(e.target.value);
  };

  const handleAddWord = () => {
    if (inputWord.trim()) {
      const cleaned = inputWord
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s]/g, "")
        .trim();

      if (cleaned.length > 1 && cleaned.startsWith("p")) {
        setWordList((prev) => {
          const combined = [...prev, cleaned];
          return combined.filter(
            (word, idx, arr) => arr.indexOf(word) === idx
          );
        });
      }
      setInputWord("");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddWord();
    }
  };

  const handleListen = () => {
    if (!recognitionRef.current) {
      alert("Reconocimiento de voz no disponible.");
      return;
    }
    if (!isRunning) {
      alert("Primero inicie el tiempo antes de hablar.");
      return;
    }
    wantListening.current = true;
    setListening(true);
    try {
      recognitionRef.current.start();
    } catch(e) {
      console.warn("Mic already active");
    }
  };

  const handleStopListening = () => {
    wantListening.current = false;
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setListening(false);
  };

  const calculateScore = () => {
    const validWords = wordList.filter(
      (w) => w.toLowerCase().trim().startsWith("p") && w.length > 1
    );
    const score = validWords.length >= 11 ? 1 : 0;
    
    console.log(`Lenguaje - Fluidez Verbal: ${validWords.length} palabras válidas. Puntaje: ${score}`);

    const standardResults = [buildMocaResult("Fluidez Verbal", score)];

    onComplete(score, {
      activityScore: score,
      words: wordList,
      validCount: validWords.length,
      standardResults
    });
  };


  return (
    <div className="module-container">
      <div className="d-flex align-items-center mb-2">
        <h4 className="mb-0">Fluidez Verbal</h4>
        <Button
          variant="link"
          onClick={speakInstructions}
          disabled={isSpeakingLocal}
          className="listen-button ms-3 text-decoration-none"
          style={{ whiteSpace: "nowrap", minWidth: "220px" }}
        >
          {isSpeakingLocal ? <FaStop /> : <FaPlay />} Escuchar Instrucciones
        </Button>
      </div>

      <p>
        Tiene 60 segundos para decir o escribir palabras que comiencen con "p" y tengan más de una letra.
      </p>

      {!isRunning ? (
        <div className="text-center">
          <Button
            className="activity-button"
            variant="primary"
            onClick={handleStart}
            style={{ minWidth: "180px" }}
          >
            Iniciar
          </Button>
        </div>
      ) : (
        <>
          <div className="text-center mb-3">
            <h5>Tiempo restante: {timer}s</h5>
          </div>

          <div className="d-flex justify-content-center align-items-center mb-4">
            {useVoice && !listening ? (
              <Button
                className="activity-button me-3"
                variant="primary"
                onClick={handleListen}
                style={{ minWidth: "120px" }}
              >
                <FaMicrophone className="me-1" />
                Hablar
              </Button>
            ) : listening ? (
              <div className="d-flex align-items-center me-3">
                <Spinner animation="grow" variant="primary" className="me-2" />
                <Button
                  className="activity-button"
                  variant="danger"
                  onClick={handleStopListening}
                  style={{ minWidth: "100px" }}
                >
                  Detener
                </Button>
              </div>
            ) : null}

            <Form onSubmit={(e) => e.preventDefault()} className="d-flex">
              <Form.Control
                type="text"
                placeholder="Escriba una palabra"
                value={inputWord}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                style={{ minWidth: "180px" }}
              />
              <Button
                className="activity-button ms-2"
                variant="success"
                onClick={handleAddWord}
                style={{ minWidth: "100px" }}
              >
                Agregar
              </Button>
            </Form>
          </div>

          <div className="mt-4">
            <h5 className="mb-3 d-flex align-items-center">
              Palabras válidas registradas
              <span className="badge bg-primary ms-2 rounded-pill px-3">{wordList.length}</span>
            </h5>
            <div className="d-flex flex-wrap gap-2 justify-content-center p-4" style={{ 
              backgroundColor: '#f1f5f9',
              borderRadius: '20px',
              minHeight: '140px',
              border: '2px solid #e2e8f0',
              overflowY: 'auto',
              maxHeight: '350px',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)'
            }}>
              {wordList.map((word, index) => (
                <span key={index} 
                  className="animate__animated animate__fadeInUp"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '10px 20px',
                    borderRadius: '12px',
                    backgroundColor: 'white',
                    color: '#0f172a',
                    fontWeight: '600',
                    fontSize: '1rem',
                    border: '1px solid #cbd5e1',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)',
                    transition: 'transform 0.2s',
                    cursor: 'default'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <span style={{ 
                    color: '#2563eb', 
                    marginRight: '6px',
                    fontSize: '1.1rem'
                  }}>
                    P
                  </span>
                  {word.substring(1)}
                </span>
              ))}
              {wordList.length === 0 && (
                <div className="d-flex flex-column align-items-center justify-content-center w-100 text-muted">
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    backgroundColor: '#e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '1rem'
                  }}>
                    <FaMicrophone size={24} className="opacity-50" />
                  </div>
                  <p className="mb-0 fw-medium">Diga o escriba palabras que comiencen con P</p>
                  <small className="opacity-75">Las palabras deben tener más de una letra</small>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

/* ==============================================
   MÓDULO PRINCIPAL DE LENGUAJE
   ============================================== */
const Lenguaje = ({ onComplete, onPrevious, isFirstModule }) => {
  // Llamada a useSelector al inicio del componente
  const isAdmin = useSelector((state) => state.auth.userInfo?.isAdmin) || false;

  const [currentActivityIndex, setCurrentActivityIndex] = useState(0);
  const [activity1Data, setActivity1Data] = useState(null);
  const [activity2Data, setActivity2Data] = useState(null);

  const handleActivity1Complete = (score, data) => {
    setActivity1Data({
      activityScore: score,
      phraseAnswers: data.phraseAnswers || [],
      standardResults: data.standardResults || []
    });
    setCurrentActivityIndex(1);
  };

  const handleActivity2Complete = (score, data) => {
    setActivity2Data({
      activityScore: score,
      words: data.words || [],
      standardResults: data.standardResults || []
    });
    // Una vez finalizada la segunda actividad, calcular el puntaje total
    handleNext(score, data.standardResults);
  };

  const handleNext = (lastScore, lastStandardResults) => {
    // Si estamos en la primera actividad y se activó por el botón de navegación (lastScore es Evento),
    // avanzamos a la segunda actividad interna en lugar de terminar el módulo.
    if (currentActivityIndex === 0 && (typeof lastScore !== 'number')) {
      setCurrentActivityIndex(1);
      return;
    }

    // Si se llama desde el botón (onClick) en la última actividad, lastScore será un objeto Event.
    // En ese caso, usamos los valores acumulados en el estado (activity2Data).
    const s2 = (typeof lastScore === 'number') ? lastScore : (activity2Data?.activityScore || 0);
    const r2 = Array.isArray(lastStandardResults) ? lastStandardResults : (activity2Data?.standardResults || []);

    const totalScore = (activity1Data?.activityScore || 0) + s2;

    const standardResults = [
      ...(activity1Data?.standardResults || []),
      ...r2
    ];

    console.log("Lenguaje Module - Final Score calculated:", totalScore);

    onComplete(
      totalScore,
      {
        totalScore,
        activity1: activity1Data,
        activity2: activity2Data,
        standardResults
      }
    );
  };

  const handlePrevious = () => {
    if (currentActivityIndex > 0) {
      setCurrentActivityIndex(currentActivityIndex - 1);
    } else {
      onPrevious();
    }
  };


  return (
    <div className="module-container">
      {currentActivityIndex === 0 && (
        <RepeticionFrasesActivity
          onComplete={handleActivity1Complete}
          isAdmin={isAdmin}
        />
      )}
      {currentActivityIndex === 1 && (
        <FluidezVerbalActivity
          onComplete={handleActivity2Complete}
          isAdmin={isAdmin}
        />
      )}

      {/* Unified Navigation Footer */}
      <div className="cubo-footer mt-5">
        <button
          className="cubo-undo-button"
          onClick={handlePrevious}
          disabled={isFirstModule}
          style={{ padding: '0.8rem 1.5rem', fontSize: '1rem' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          Regresar
        </button>

        <button
          className="cubo-continue-button"
          onClick={() => handleNext()}
        >
          {currentActivityIndex === 1 ? "Finalizar test" : "Siguiente Pregunta"}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
        </button>
      </div>

      {/* Navegación rápida para administradores */}
      {isAdmin && (
        <div className="d-flex justify-content-center mt-4">
          <Button
            variant="info"
            onClick={() => setCurrentActivityIndex(0)}
            className="me-2"
            style={{ minWidth: "120px" }}
          >
            Ir a Actividad 1
          </Button>
          <Button
            variant="info"
            onClick={() => setCurrentActivityIndex(1)}
            style={{ minWidth: "120px" }}
          >
            Ir a Actividad 2
          </Button>
        </div>
      )}
    </div>
  );
};

export default Lenguaje;
