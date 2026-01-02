// src/screens/MOCAmodules/Lenguaje.jsx

import React, { useState, useEffect, useRef } from "react";
import { Button, Form, Spinner, Alert, Row, Col } from "react-bootstrap";
import { FaPlay, FaStop, FaMicrophone } from "react-icons/fa";
import { useSelector } from "react-redux";
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

      onComplete(totalScore, {
        activityScore: totalScore,
        phraseAnswers: [
          ...activityAnswers,
          { phraseIndex: currentPhraseIndex, response: userResp },
        ],
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
    onComplete(score, {
      activityScore: score,
      words: wordList,
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

          <div>
            <h5>Palabras registradas:</h5>
            <ul>
              {wordList.map((word, index) => (
                <li key={index}>{word}</li>
              ))}
            </ul>
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
    });
    setCurrentActivityIndex(1);
  };

  const handleActivity2Complete = (score, data) => {
    setActivity2Data({
      activityScore: score,
      words: data.words || [],
    });
    // Una vez finalizada la segunda actividad, calcular el puntaje total
    handleNext();
  };

  const handleNext = () => {
    const totalScore =
      (activity1Data?.activityScore || 0) +
      (activity2Data?.activityScore || 0);

    onComplete(
      totalScore,
      {
        totalScore,
        activity1: activity1Data,
        activity2: activity2Data,
      }
    );
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

      {/* Botones de navegación solo en el módulo principal */}
      {currentActivityIndex === 1 && (
        <div className="d-flex justify-content-between mt-4">
          {isAdmin && (
            <Button
              className="back-button"
              variant="secondary"
              onClick={onPrevious}
              disabled={isFirstModule}
              style={{ minWidth: "150px" }}
            >
              Regresar
            </Button>
          )}
          <Button
            className="continue-button"
            variant="success"
            onClick={handleNext}
            
            style={{ minWidth: "150px" }}
          >
            Continuar
          </Button>
        </div>
      )}

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
