// src/screens/MOCAmodules/RecuerdoDiferido.jsx

import React, { useState, useEffect, useRef } from "react";
import { Button, Row, Col, Alert, Form, Spinner } from "react-bootstrap";
import { FaPlay, FaStop, FaMicrophone } from "react-icons/fa";
import { useSelector } from "react-redux";
import '../../assets/styles/mocamodules.css';

const RecuerdoDiferido = ({ onComplete, onPrevious, isFirstModule }) => {
  const isAdmin = useSelector((state) => state.auth.userInfo?.isAdmin) || false;

  const words = ["ROSTRO", "SEDA", "IGLESIA", "CLAVEL", "ROJO"];

  // Estado para el puntaje (única actividad)
  const [activityScore, setActivityScore] = useState(null);

  // Estado para manejar el flujo
  const [useVoice, setUseVoice] = useState(true);
  const [ttsSupported, setTtsSupported] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);

  // Fases:
  // 0: Intento espontáneo
  // 1: Pistas de categoría
  // 2: Opción múltiple
  // Final: Calcular puntaje
  const [phase, setPhase] = useState(0);

  // Palabras recordadas espontáneamente
  const [spontaneousAnswers, setSpontaneousAnswers] = useState([]);
  const [manualInput, setManualInput] = useState("");
  const [transcript, setTranscript] = useState("");

  const [confirmation, setConfirmation] = useState(false);
  const [isSpeakingLocal, setIsSpeakingLocal] = useState(false);

  // Palabras no recordadas espontáneamente
  const [missedWords, setMissedWords] = useState(words);

  // Pistas de categoría
  const categoryClues = {
    ROSTRO: "parte del cuerpo",
    SEDA: "tela",
    IGLESIA: "edificio",
    CLAVEL: "flor",
    ROJO: "color",
  };

  // Opción múltiple
  const multipleChoice = {
    ROSTRO: ["nariz", "rostro", "mano"],
    SEDA: ["lana", "algodón", "seda"],
    IGLESIA: ["iglesia", "escuela", "hospital"],
    CLAVEL: ["rosa", "clavel", "tulipán"],
    ROJO: ["rojo", "azul", "verde"],
  };

  const [categoryAnswers, setCategoryAnswers] = useState({});
  const [multipleChoiceAnswers, setMultipleChoiceAnswers] = useState({});

  // Inicializar TTS
  useEffect(() => {
    if (!window.speechSynthesis) {
      setTtsSupported(false);
    }
  }, []);

  // Inicializar SpeechRecognition
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setUseVoice(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "es-ES";
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const result = event.results[0][0].transcript.toLowerCase().trim();
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
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
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

  // Iniciar reconocimiento de voz
  const handleListen = () => {
    if (!recognitionRef.current) {
      alert("Reconocimiento de voz no disponible.");
      return;
    }
    setListening(true);
    setTranscript("");
    recognitionRef.current.start();
  };

  // Detener reconocimiento de voz
  const handleStop = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setListening(false);
  };

  // Normalizar texto para comparación
  const normalizeText = (text) =>
    text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z]/g, "")
      .trim();

  // Función para ir agregando las palabras recordadas
  const handleAddSpontaneous = (word) => {
    const nWord = normalizeText(word);
    if (words.map((w) => normalizeText(w)).includes(nWord)) {
      setSpontaneousAnswers((prev) => {
        if (!prev.includes(nWord)) {
          return [...prev, nWord];
        }
        return prev;
      });
    }
  };

  // Confirmar respuesta (fase espontánea)
  const handleConfirm = () => {
    if (manualInput.trim() !== "") {
      manualInput
        .split(",")
        .map((x) => x.trim())
        .forEach((w) => handleAddSpontaneous(w));
    } else if (transcript.trim() !== "") {
      transcript
        .split(" ")
        .map((x) => x.trim())
        .forEach((w) => handleAddSpontaneous(w));
    }
    setManualInput("");
    setTranscript("");
    setConfirmation(false);
  };

  // Reintentar en caso de error
  const handleRetry = () => {
    setTranscript("");
    setManualInput("");
    setConfirmation(false);
  };

  // Manejar Enter en el input manual
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (manualInput.trim() && !confirmation) {
        setConfirmation(true);
      }
    }
  };

  // Continuar con las pistas de categoría
  const handleContinueSpontaneous = () => {
    // Al terminar fase espontánea, calcular qué palabras faltan
    const missing = words.filter(
      (w) => !spontaneousAnswers.includes(normalizeText(w))
    );
    setMissedWords(missing);
    setPhase(1);
  };

  // Maneja la entrada en fase de Pistas de Categoría
  const handleCategoryInputChange = (word, val) => {
    const nVal = normalizeText(val);
    setCategoryAnswers((prev) => ({ ...prev, [normalizeText(word)]: nVal }));
  };

  // Pasa a la fase de Opción Múltiple
  const handleCategoryPhaseConfirm = () => {
    // Fase 1 no afecta el puntaje
    // Calcula qué palabras siguen faltando tras este intento
    const missingAfterCategory = missedWords.filter((w) => {
      const norm = normalizeText(w);
      return !spontaneousAnswers.includes(norm) && !(categoryAnswers[norm] === norm);
    });
    setMissedWords(missingAfterCategory);
    setPhase(2);
  };

  // Maneja la selección de la opción múltiple
  const handleMultipleChoiceChange = (word, val) => {
    setMultipleChoiceAnswers((prev) => ({
      ...prev,
      [normalizeText(word)]: val,
    }));
  };

  // Al presionar "registrar respuestas" en la fase 2
  const handleMultipleChoiceConfirm = () => {
    // Puntaje basado solo en lo recordado espontáneamente
    const spontScore = spontaneousAnswers.filter((ans) =>
      words.map((x) => normalizeText(x)).includes(ans)
    ).length;
    setActivityScore(spontScore);
  };

  // Al final, dar "Continuar" con la prueba
  const handleNext = () => {
    const totalScore = activityScore || 0;
    onComplete(totalScore, {
      totalScore,
      spontaneousScore: activityScore,
      pairAnswers: {
        spontaneousAnswers,
        categoryAnswers,
        multipleChoiceAnswers,
      },
    });
  };

  const allDone = activityScore !== null;

  return (
    <div className="module-container">
      {/* Título e instrucciones */}
      <div className="d-flex align-items-center mb-3">
        <h4 className="mb-0">Recuerdo Diferido</h4>
        <Button
          variant="link"
          onClick={() =>
            speakInstructions(
              "Antes le leí una serie de palabras. Dígame ahora todas las palabras de las que se acuerde."
            )
          }
          disabled={isSpeaking || isSpeakingLocal}
          className="listen-button ms-3 text-decoration-none"
          style={{ whiteSpace: "nowrap", minWidth: "220px" }}
        >
          {isSpeaking || isSpeakingLocal ? <FaStop /> : <FaPlay />} Escuchar Instrucciones
        </Button>
      </div>

      <p className="mb-4">
        Recuerde las palabras que escuchó anteriormente y añádalas a la lista.
      </p>

      {/* Fase 0: Espontáneo */}
      {phase === 0 && (
        <>
          <p>
            Intente recordar las palabras espontáneamente. Puede hablar o
            escribir las palabras separadas por comas.
          </p>
          <div className="text-center">
            {useVoice && !confirmation && (
              listening ? (
                <div className="d-flex flex-column align-items-center mb-3">
                  <Spinner animation="grow" variant="primary" className="mb-2" />
                  <p>Escuchando...</p>
                  <Button
                    variant="danger"
                    onClick={handleStop}
                    style={{ minWidth: "220px" }}
                  >
                    Detener
                  </Button>
                </div>
              ) : (
                <Button
                  variant="primary"
                  onClick={handleListen}
                  className="mb-3"
                  style={{ minWidth: "220px" }}
                >
                  <FaMicrophone className="me-2" />
                  Hablar
                </Button>
              )
            )}

            <Form
              onSubmit={(e) => e.preventDefault()}
              className="d-flex flex-column align-items-center"
            >
              <Form.Control
                type="text"
                placeholder="Escriba las palabras separadas por comas"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                onKeyPress={handleKeyPress}
                style={{ maxWidth: "500px", marginBottom: "10px" }}
              />
              <Button
                variant="success"
                onClick={() => setConfirmation(true)}
                disabled={!manualInput.trim()}
                style={{ minWidth: "220px" }}
              >
                Confirmar
              </Button>
            </Form>

            {confirmation && (
              <div className="mt-3">
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

            {/* Lista de palabras registradas espontáneamente */}
            {spontaneousAnswers.length > 0 && (
              <div className="mt-3">
                <h5>Palabras registradas:</h5>
                <ul>
                  {spontaneousAnswers.map((ans, index) => (
                    <li key={index}>{ans.toUpperCase()}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="d-flex justify-content-center mt-3">
              <Button
                variant="info"
                onClick={handleContinueSpontaneous}
                style={{ minWidth: "220px" }}
              >
                Continuar con pistas
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Fase 1: Pistas de Categoría */}
      {phase === 1 && (
        <>
          <p>
            A continuación se darán pistas de categoría para las palabras que no
            recordó espontáneamente. No se otorgan puntos por esta fase.
          </p>
          <Row className="justify-content-center">
            <Col md={8}>
              {missedWords.map((w) => (
                <div key={w} className="mt-3">
                  <Alert variant="secondary">
                    <p>
                      <strong>Pista de categoría:</strong> {categoryClues[w]}
                    </p>
                    <Form onSubmit={(e) => e.preventDefault()} className="d-flex justify-content-center">
                      <Form.Control
                        type="text"
                        placeholder="Respuesta"
                        value={categoryAnswers[normalizeText(w)] || ""}
                        onChange={(e) =>
                          handleCategoryInputChange(w, e.target.value)
                        }
                        style={{ maxWidth: "400px", marginRight: "10px" }}
                      />
                    </Form>
                  </Alert>
                </div>
              ))}
              <div className="d-flex justify-content-center mt-3">
                <Button
                  variant="info"
                  onClick={handleCategoryPhaseConfirm}
                  style={{ minWidth: "220px" }}
                >
                  Continuar con opción múltiple
                </Button>
              </div>
            </Col>
          </Row>
        </>
      )}

      {/* Fase 2: Opción múltiple */}
      {phase === 2 && (
        <>
          <p>
            Seleccione la respuesta correcta para las palabras que aún no
            recordó. Tampoco se otorga puntaje en esta fase.
          </p>
          <Row className="justify-content-center">
            <Col md={8}>
              {missedWords.map((w) => (
                <div key={w} className="mt-3">
                  <Alert variant="secondary">
                    <p>
                      <strong>{w}</strong> - Elija la opción correcta
                    </p>
                    <Form>
                      {multipleChoice[w].map((opt) => (
                        <div key={opt} className="d-flex align-items-center mb-2">
                          <Form.Check
                            type="radio"
                            name={normalizeText(w)}
                            id={normalizeText(w) + normalizeText(opt)}
                            label={opt}
                            onChange={() =>
                              handleMultipleChoiceChange(w, normalizeText(opt))
                            }
                          />
                        </div>
                      ))}
                    </Form>
                  </Alert>
                </div>
              ))}
              <div className="d-flex justify-content-center mt-3">
                <Button
                  variant="info"
                  onClick={handleMultipleChoiceConfirm}
                  style={{ minWidth: "220px" }}
                >
                  Registrar respuestas
                </Button>
              </div>
            </Col>
          </Row>
        </>
      )}

      {/* Mostrar puntaje final */}
      {activityScore !== null && (
        <div className="text-center mt-4">
          <Alert variant="success">
            ¡Ha finalizado la prueba de recuerdo diferido!
          </Alert>
          <p>Puntaje (solo por recuerdos espontáneos): {activityScore}</p>
        </div>
      )}

      {/* Botones de navegación */}
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
          onClick={() => {
            const finalScore = activityScore || 0;
            onComplete(finalScore, {
              totalScore: finalScore,
              spontaneousScore: finalScore,
              pairAnswers: {
                spontaneousAnswers,
                categoryAnswers,
                multipleChoiceAnswers,
              },
            });
          }}
          style={{ minWidth: "150px" }}
        >
          Continuar
        </Button>
      </div>
    </div>
  );
};

export default RecuerdoDiferido;
