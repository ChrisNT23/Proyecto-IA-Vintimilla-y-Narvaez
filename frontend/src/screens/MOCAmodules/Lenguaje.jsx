// src/screens/MOCAmodules/Lenguaje.jsx

import React, { useState, useEffect, useRef } from "react";
import { Button, Form, Spinner, Alert, Row, Col } from "react-bootstrap";
import { FaPlay, FaStop, FaMicrophone, FaPlus, FaTimes, FaArrowRight, FaCheckCircle } from "react-icons/fa";
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
    <div className="w-100 d-flex flex-column align-items-center">
      {/* Breadcrumb Section */}
      <div className="cubo-section-breadcrumb text-center">
        SECCIÓN 5: LENGUAJE
      </div>

      {/* Header Section */}
      <div className="cubo-header text-center">
        <h1 className="cubo-title">
          Lenguaje <span className="text-primary">(Repetición de Frases)</span>
        </h1>
        <p className="cubo-subtitle">Módulo de Lenguaje - Actividad 1</p>
      </div>

      {/* Intro / Instructions Card */}
      {!hasHeardPhrase && !isSpeakingLocal && !confirmation && (
        <div className="mem-intro-card">
          <div className="mem-intro-icon-col">
            <div className="mem-intro-icon-person">
              <svg width="60" height="70" viewBox="0 0 60 70" fill="none">
                <circle cx="28" cy="18" r="14" fill="#2563eb" opacity="0.85" />
                <path d="M4 60 C4 42 52 42 52 60" stroke="#2563eb" strokeWidth="5" strokeLinecap="round" fill="none" opacity="0.85" />
                <path d="M40 22 Q46 28 40 34" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              </svg>
            </div>
          </div>
          <div className="mem-intro-content-col">
            <div className="mem-intro-step-badge">
              <span className="mem-intro-step-num">{currentPhraseIndex + 1}</span>
              <h2 className="mem-intro-step-title">Repita la frase</h2>
            </div>
            <p className="mem-intro-desc">
              Presione el botón para escuchar una frase y luego repítala exactamente como la oyó.
            </p>
            <button
              className="mem-intro-listen-btn mt-2"
              onClick={() => speakPhrase(phrases[currentPhraseIndex])}
            >
              <span className="mem-intro-listen-icon"><FaPlay size={12} /></span>
              Escuchar la frase
            </button>
          </div>
        </div>
      )}

      {/* Reading state animation */}
      {isSpeakingLocal && (
        <div className="mem-reading-wrapper">
          <div className="mem-reading-card">
            <div className="mem-reading-spinner-wrap">
              <Spinner animation="border" style={{ color: "#2563eb", width: "3rem", height: "3rem" }} />
            </div>
            <h3 className="mem-reading-title">Escuche con atención</h3>
            <p className="mem-reading-desc">Se está leyendo la frase. Prepárese para repetirla.</p>
            <div className="mem-reading-waves">
              {[6, 10, 8, 12, 9, 7, 11, 8, 6, 9].map((h, i) => (
                <div key={i} className="mem-reading-wave-bar" style={{ animationDelay: `${i * 0.1}s`, height: `${h * 4}px` }} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recall state */}
      {hasHeardPhrase && !isSpeakingLocal && !confirmation && (
        <div className="mem-recall-wrapper">
          <div className="mem-recall-card">
            <h2 className="mem-recall-title">Repita la frase ahora</h2>
            <p className="mem-recall-subtitle">Puede hablar usando el micrófono o escribirla.</p>

            {/* Micrófono */}
            <div className="mem-recall-mic-section">
              {listening ? (
                <>
                  <button className="mem-recall-mic-btn mem-recall-mic-active" onClick={handleStop}>
                    <FaMicrophone size={28} color="#fff" />
                  </button>
                  <p className="mem-recall-mic-label">ESCUCHANDO...</p>
                </>
              ) : (
                <>
                  <button className="mem-recall-mic-btn" onClick={handleListen}>
                    <FaMicrophone size={28} color="#fff" />
                  </button>
                  <p className="mem-recall-mic-label">TOCAR PARA HABLAR</p>
                </>
              )}
            </div>

            {/* Input manual */}
            <div className="mem-recall-input-row mt-4">
              <div className="mem-recall-input-wrap">
                <span className="mem-recall-input-icon">✏️</span>
                <input
                  type="text"
                  className="mem-recall-input"
                  placeholder="Escriba aquí su respuesta..."
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
              </div>
              <button
                className="mem-recall-add-btn"
                onClick={() => setConfirmation(true)}
                disabled={!manualInput.trim()}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Bubble */}
      {confirmation && (
        <div className="mem-recall-wrapper">
          <div className="mem-recall-card">
            <div className="mem-recall-confirm">
              <div className="mem-recall-confirm-bubble">
                <p className="mem-recall-confirm-q">¿Es correcta su respuesta?</p>
                <p className="mem-recall-confirm-word">"{transcript || manualInput}"</p>
              </div>
              <div className="mem-recall-confirm-actions">
                <button className="mem-recall-retry-btn" onClick={handleRetry}>
                  Reintentar
                </button>
                <button className="mem-recall-yes-btn" onClick={handleConfirm}>
                  Sí, continuar
                </button>
              </div>
            </div>
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

            const words = result.split(/\s+/).filter((w) => w.length > 0);

            setWordList((prev) => {
              const combined = [...prev, ...words];
              return combined.filter(
                (word, idx, arr) => arr.indexOf(word) === idx
              );
            });
          }
        }
      };

      recognition.onerror = () => {
        setListening(false);
        alert("Error al reconocer la voz. Intente de nuevo.");
      };

      recognition.onend = () => {
        if (listening && isRunning && timer > 0) {
          recognition.start();
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
  }, [listening, isRunning, timer]);

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

      if (cleaned.length > 0) {
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
    setListening(true);
    recognitionRef.current.start();
  };

  const handleStopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setListening(false);
  };

  const calculateScore = () => {
    const validWords = wordList.filter(
      (w) => w[0] === "p" && w.length > 1
    );
    const score = validWords.length >= 11 ? 1 : 0;
    
    const standardResults = [buildMocaResult("Fluidez Verbal", score)];

    onComplete(score, {
      activityScore: score,
      words: wordList,
      standardResults
    });
  };

  return (
    <div className="w-100 d-flex flex-column align-items-center">
      {/* Breadcrumb Section */}
      <div className="cubo-section-breadcrumb text-center">
        SECCIÓN 5: LENGUAJE
      </div>

      {/* Header Section */}
      <div className="cubo-header text-center">
        <h1 className="cubo-title">
          Lenguaje <span className="text-primary">(Fluidez Verbal)</span>
        </h1>
        <p className="cubo-subtitle">Módulo de Lenguaje - Actividad 2</p>
      </div>

      {!isRunning ? (
        <div className="mem-intro-card">
          <div className="mem-intro-icon-col">
            <div className="mem-intro-icon-person" style={{ background: '#eff6ff', borderRadius: '50%', padding: '1rem' }}>
              <FaCheckCircle size={40} color="#2563eb" />
            </div>
          </div>
          <div className="mem-intro-content-col">
            <div className="mem-intro-step-badge">
              <span className="mem-intro-step-num">2</span>
              <h2 className="mem-intro-step-title">Instrucciones</h2>
            </div>
            <p className="mem-intro-desc">
              Tiene 60 segundos para decir o escribir todas las palabras que pueda que empiecen con la letra <span className="text-primary font-weight-bold">"P"</span>.
            </p>
            <div className="d-flex gap-2 mt-2">
              <button className="mem-intro-listen-btn" onClick={speakInstructions} disabled={isSpeakingLocal}>
                <FaPlay size={12} className="me-1" /> Oír Instrucciones
              </button>
              <button className="cubo-continue-button" style={{ padding: '0.65rem 1.5rem' }} onClick={handleStart}>
                Empezar (60s)
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="mem-recall-wrapper">
          <div className="mem-recall-card">
            <div className="moca-timer-container">
              <div className={`moca-timer-circle ${timer <= 10 ? 'warning' : ''}`}>
                {timer}
              </div>
              <p className="moca-timer-label">Palabras con la letra "P"</p>
            </div>

            <div className="d-flex flex-column align-items-center gap-3 w-100">
              {useVoice && (
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
                      <button className="mem-recall-mic-btn" onClick={handleListen}>
                        <FaMicrophone size={28} color="#fff" />
                      </button>
                      <p className="mem-recall-mic-label">MODO VOZ</p>
                    </>
                  )}
                </div>
              )}

              <div className="mem-recall-input-row w-100">
                <div className="mem-recall-input-wrap">
                  <span className="mem-recall-input-icon">✏️</span>
                  <input
                    type="text"
                    className="mem-recall-input"
                    placeholder="Escriba una palabra..."
                    value={inputWord}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                  />
                </div>
                <button className="mem-recall-add-btn" onClick={handleAddWord}>
                  <FaPlus className="me-1" size={13} /> Agregar
                </button>
              </div>
            </div>

            <div className="mem-recall-words-section mt-4">
              <p className="mem-recall-words-label">PALABRAS REGISTRADAS: {wordList.length}</p>
              <div className="mem-recall-chips">
                {wordList.map((word, index) => (
                  <span key={index} className="mem-recall-chip">
                    {word}
                  </span>
                ))}
                {wordList.length === 0 && (
                  <span className="mem-recall-chip-placeholder">Diga o escriba palabras...</span>
                )}
              </div>
            </div>
          </div>
        </div>
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
    const totalScore =
      (activity1Data?.activityScore || 0) +
      (lastScore || 0);

    // Las actividades individuales ya reportaron sus standardResults hacia arriba.
    // Aquí concatenamos los standardResults de ambas actividades.
    const standardResults = [
      ...(activity1Data?.standardResults || []),
      ...(lastStandardResults || [])
    ];

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

  return (
    <div className="w-100">
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
      <div className="cubo-footer mt-5 mx-auto" style={{ maxWidth: '700px' }}>
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
          {currentActivityIndex === 1 ? "Finalizar test" : "Siguiente Pregunta"}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
        </button>
      </div>

      {/* Navegación rápida para administradores */}
      {isAdmin && (
        <div className="d-flex justify-content-center mt-4">
          <Button
            variant="outline-info"
            onClick={() => setCurrentActivityIndex(0)}
            className="me-2"
            style={{ borderRadius: '10px' }}
          >
            Ir a Actividad 1
          </Button>
          <Button
            variant="outline-info"
            onClick={() => setCurrentActivityIndex(1)}
            style={{ borderRadius: '10px' }}
          >
            Ir a Actividad 2
          </Button>
        </div>
      )}
    </div>
  );
};

export default Lenguaje;
