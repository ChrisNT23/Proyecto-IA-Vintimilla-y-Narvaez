// src/screens/MOCAmodules/Atencion.jsx

import React, { useState, useEffect, useRef } from "react";
import { Button, Row, Col, Form, Alert, Spinner } from "react-bootstrap";
import { FaPlay, FaStop, FaMicrophone } from "react-icons/fa";
import { useSelector } from "react-redux";
import '../../assets/styles/mocamodules.css';

/* ==============================================
   ACTIVIDAD 1: SECUENCIA NUMÉRICA
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
        "Módulo de Atención, Actividad 1. Escuche una serie de números y repítalos.";
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
      setMessage("Ha completado la Actividad 1 de Atención.");
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
    onComplete(score, { ...responses });
  };

  return (
    <div className="module-container">
      <div className="d-flex align-items-center mb-2">
        <h5 className="mb-0">Actividad 1: Secuencia Numérica</h5>
        <Button
          variant="link"
          onClick={speakInstructions}
          disabled={isSpeakingLocal}
          className="listen-button ms-3 text-decoration-none"
        >
          <FaPlay /> Escuchar<br />Instrucciones
        </Button>
      </div>

      {/* Mostrando lectura de secuencia */}
      {(stage === STAGE_FIRST_SEQUENCE_READ ||
        stage === STAGE_SECOND_SEQUENCE_READ) && (
        <div className="text-center mt-3">
          <Spinner animation="grow" variant="primary" />
          <p className="mt-3">
            {stage === STAGE_FIRST_SEQUENCE_READ
              ? "Le leeré una serie de números, repítalos en el mismo orden."
              : "Le leeré otra serie de números, repítalos en orden inverso."}
          </p>
        </div>
      )}

      {/* Usuario repite secuencia */}
      {(stage === STAGE_FIRST_SEQUENCE_RECALL ||
        stage === STAGE_SECOND_SEQUENCE_RECALL) && !message && (
        <div className="text-center mt-3">
          <p>
            {stage === STAGE_FIRST_SEQUENCE_RECALL
              ? "Repita los números en el mismo orden."
              : "Repita los números en orden inverso."}
          </p>
          {listening ? (
            <div>
              <Spinner animation="grow" variant="primary" />
              <p className="mt-2">Escuchando...</p>
              <Button
                className="activity-button"
                variant="danger"
                onClick={handleStopListening}
              >
                Detener
              </Button>
            </div>
          ) : (
            <Button
              className="activity-button d-flex align-items-center justify-content-center mx-auto mb-3"
              onClick={handleStartRecall}
              disabled={!recognitionSupported}
            >
              <FaMicrophone className="me-2" />
              Hablar
            </Button>
          )}

          {showButtons && (
            <div className="mt-3">
              <Alert variant="secondary">
                <p>¿Es correcta su respuesta?</p>
                <strong>{transcript}</strong>
              </Alert>
              <Row>
                <Col className="d-flex justify-content-start">
                  <Button
                    className="activity-button me-3"
                    variant="warning"
                    onClick={() => {
                      setTranscript("");
                      setShowButtons(false);
                      handleStartRecall();
                    }}
                  >
                    Reintentar
                  </Button>
                </Col>
                <Col className="d-flex justify-content-end">
                  <Button
                    className="activity-button"
                    variant="success"
                    onClick={handleConfirmResponse}
                  >
                    Sí
                  </Button>
                </Col>
              </Row>
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
            <p>Números recordados:</p>
            <ul>
              {(stage === STAGE_FIRST_SEQUENCE_RECALL
                ? responses.first
                : responses.second
              ).map((number, index) => (
                <li key={index}>{number}</li>
              ))}
            </ul>
          </div>

          <Button
            className="activity-button mt-3 mx-auto d-block"
            variant="secondary"
            onClick={handleNoMoreWords}
          >
            No recuerdo más
          </Button>
        </div>
      )}

      {/* Final */}
      {stage === STAGE_FINAL && (
        <div className="text-center mt-3">
          {message && <Alert variant="info">{message}</Alert>}
          <Button
            className="continue-button"
            variant="success"
            onClick={handleNext}
          >
            Continuar
          </Button>
        </div>
      )}

      {/* Botones de Regresar y Continuar siempre al final */}
      <div className="d-flex justify-content-between mt-4">
        {isAdmin && (
          <Button
            className="back-button"
            variant="secondary"
            onClick={onPrevious}
            disabled={isFirstModule}
          >
            Regresar
          </Button>
        )}
        <Button
          className="continue-button"
          variant="success"
          onClick={handleNext}
        >
          Continuar
        </Button>
      </div>
    </div>
  );
};


/* ==============================================
   ACTIVIDAD 2: CONCENTRACIÓN (LETRAS)
   ============================================== */
export const ConcentracionActivity = ({ onComplete, onPrevious, isFirstModule }) => {
  const isAdmin = useSelector((state) => state.auth.userInfo?.isAdmin) || false;

  const [isSpeakingLocal, setIsSpeakingLocal] = useState(false);
  const [ttsSupported, setTtsSupported] = useState(true);

  const [playing, setPlaying] = useState(false);     // Indica si se está reproduciendo la secuencia
  const [currentLetter, setCurrentLetter] = useState("--");
  const [currentIndex, setCurrentIndex] = useState(-1); // Índice de la letra actual
  const [errors, setErrors] = useState(0);
  const [hits, setHits] = useState([]);
  const [showContinue, setShowContinue] = useState(false);

  const lettersSequence = [
    "F", "B", "A", "C", "M", "N", "A", "A",
    "J", "K", "L", "B", "A", "F", "A", "K",
    "D", "E", "A", "A", "A", "J", "A", "M",
    "O", "F", "A", "A", "B"
  ];

  useEffect(() => {
    if (!window.speechSynthesis) {
      setTtsSupported(false);
    }
    return () => {
      stopSequence();
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speakInstructions = () => {
    if (!ttsSupported) return;
    if (isSpeakingLocal) {
      window.speechSynthesis.cancel();
      setIsSpeakingLocal(false);
    } else {
      const instructions =
        "Actividad de Concentración con Letras. Presione Golpe cuando escuche la letra A. Más de un error implica puntaje cero.";
      const utterance = new SpeechSynthesisUtterance(instructions);
      utterance.lang = "es-ES";
      utterance.onend = () => {
        setIsSpeakingLocal(false);
      };
      window.speechSynthesis.speak(utterance);
      setIsSpeakingLocal(true);
    }
  };

  const startSequence = () => {
    setPlaying(true);
    setErrors(0);
    setHits([]);
    setShowContinue(false);
    readAllLetters(0);
  };

  const readAllLetters = (index) => {
    if (!ttsSupported) return;
    if (index >= lettersSequence.length) {
      setPlaying(false);
      setCurrentLetter("--");
      setShowContinue(true);
      return;
    }
    const letter = lettersSequence[index];
    setCurrentLetter(letter);
    setCurrentIndex(index);

    const utterance = new SpeechSynthesisUtterance(letter);
    utterance.lang = "es-ES";
    utterance.onend = () => {
      setTimeout(() => {
        readAllLetters(index + 1);
      }, 1000);
    };
    window.speechSynthesis.speak(utterance);
  };

  const stopSequence = () => {
    setPlaying(false);
    setCurrentLetter("--");
    window.speechSynthesis.cancel();
  };

  const handleGolpe = () => {
    if (!playing) return;
    if (currentIndex < 0 || currentIndex >= lettersSequence.length) return;

    const expectedLetter = lettersSequence[currentIndex];
    if (expectedLetter === "A") {
      setHits((prev) => [...prev, currentIndex]);
    } else {
      setErrors((prev) => {
        const newErrors = prev + 1;
        if (newErrors > 1) {
          stopSequence();
          setShowContinue(true);
        }
        return newErrors;
      });
    }
  };

  const handleContinue = () => {
    const score = errors > 1 ? 0 : 1;
    onComplete(score, { hits, errors });
  };

  return (
    <div className="module-container">
      <div className="d-flex align-items-center mb-2">
        <h5 className="mb-0">Actividad 2: Concentración (Letras)</h5>
        <Button
          variant="link"
          onClick={speakInstructions}
          disabled={isSpeakingLocal || playing}
          className="listen-button ms-3 text-decoration-none"
        >
          <FaPlay /> Escuchar<br />Instrucciones
        </Button>
      </div>

      <p>
        Se leerá una serie de letras. Cuando la letra sea "A", presione "Golpe". Más de 1 error ⇒ 0 pts.
      </p>

      {/* Botón para iniciar */}
      {!playing && !showContinue && (
        <Button
          className="activity-button d-block mx-auto mb-3"
          variant="primary"
          onClick={startSequence}
          style={{ minWidth: "180px" }}
        >
          Iniciar Lectura
        </Button>
      )}

      {playing && (
        <div className="text-center mt-3">
          <Spinner animation="grow" variant="primary" />
          <p className="mt-2">
            Leyendo letra: <strong>{currentLetter}</strong>
          </p>
        </div>
      )}

      {/* Botón Golpe */}
      <Button
        className="activity-button d-block mx-auto mb-3"
        variant="success"
        onClick={handleGolpe}
        style={{ minWidth: "200px" }}
        disabled={!playing}
      >
        Golpe
      </Button>

      {/* Mostrar Errores y Aciertos */}
      <div className="mt-3 text-center">
        <p>Errores: {errors}</p>
        <p>Golpes acertados: {hits.length}</p>
      </div>

      {showContinue && (
        <div className="text-center mt-3">
          <Alert variant={errors > 1 ? "danger" : "success"}>
            {errors > 1
              ? "Has cometido más de un error. Puntaje: 0."
              : "Puntaje: 1."}
          </Alert>
          <Button
            className="continue-button mt-2"
            variant="success"
            onClick={handleContinue}
            style={{ minWidth: "150px" }}
          >
            Continuar
          </Button>
        </div>
      )}

      {/* Botón de Regresar y Continuar */}
      {!showContinue && (
        <div className="d-flex justify-content-between mt-4">
          {isAdmin && (
            <Button
              className="back-button"
              variant="secondary"
              onClick={onPrevious}
              disabled={isFirstModule}
            >
              Regresar
            </Button>
          )}
          <Button
            className="continue-button"
            variant="success"
            onClick={handleContinue}
          >
            Continuar
          </Button>
        </div>
      )}
    </div>
  );
};


/* ==============================================
   ACTIVIDAD 3: SUBSTRACCIÓN DE 7
   ============================================== */
export const Sub7Activity = ({ onComplete, onPrevious, isFirstModule }) => {
  const isAdmin = useSelector((state) => state.auth.userInfo?.isAdmin) || false;

  const [isSpeakingLocal, setIsSpeakingLocal] = useState(false);
  const [ttsSupported, setTtsSupported] = useState(true);
  const [steps, setSteps] = useState([]);
  const [manualInput, setManualInput] = useState("");
  const [currentNumber, setCurrentNumber] = useState(100);
  const [showFinalButtons, setShowFinalButtons] = useState(false);

  useEffect(() => {
    if (!window.speechSynthesis) {
      setTtsSupported(false);
    }
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speakInstructions = () => {
    if (!ttsSupported) return;
    if (isSpeakingLocal) {
      window.speechSynthesis.cancel();
      setIsSpeakingLocal(false);
    } else {
      const text =
        "Actividad de Substracción en Secuencia de 7. Comience en 100 y reste 7 sucesivamente. Ingrese cada resultado. Más aciertos = mayor puntaje.";
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "es-ES";
      utterance.onend = () => {
        setIsSpeakingLocal(false);
      };
      window.speechSynthesis.speak(utterance);
      setIsSpeakingLocal(true);
    }
  };

  const handleAddStep = () => {
    if (!manualInput.trim()) return;
    const val = parseInt(manualInput, 10);
    if (isNaN(val)) {
      alert("Por favor, ingrese un número válido.");
      return;
    }
    const expected = currentNumber - 7;
    const isCorrect = val === expected;
    setSteps((prev) => [...prev, { value: val, correct: isCorrect }]);
    setCurrentNumber(val);
    setManualInput("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddStep();
    }
  };

  const calculateScore = () => {
    let correctCount = 0;
    let previousValue = 100;

    for (let i = 0; i < steps.length && i < 5; i++) {
      const expected = previousValue - 7;
      if (steps[i].value === expected) {
        correctCount += 1;
      }
      previousValue = steps[i].value;
    }

    let score = 0;
    if (correctCount === 1) score = 1;
    else if (correctCount === 2 || correctCount === 3) score = 2;
    else if (correctCount === 4 || correctCount === 5) score = 3;

    onComplete(score, { steps });
  };

  const handleTerminate = () => {
    onComplete(0, { steps });
  };

  return (
    <div className="module-container">
      <div className="d-flex align-items-center mb-2">
        <h5 className="mb-0">Actividad 3: Substracción en Secuencia de 7</h5>
        <Button
          variant="link"
          onClick={speakInstructions}
          disabled={isSpeakingLocal}
          className="listen-button ms-3 text-decoration-none"
        >
          <FaPlay /> Escuchar<br />Instrucciones
        </Button>
      </div>

      <p>
        Comience con <strong>100</strong> y reste 7 sucesivamente. Ingrese cada resultado.
      </p>

      <div className="text-center my-4">
        <h2>{currentNumber}</h2>
      </div>

      {!showFinalButtons && (
        <Form
          onSubmit={(e) => e.preventDefault()}
          className="d-flex flex-column align-items-center"
        >
          <Form.Control
            type="number"
            placeholder="Ingrese el siguiente número"
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            onKeyPress={handleKeyPress}
            style={{ maxWidth: "300px" }}
          />
          <Button
            className="activity-button mt-2"
            variant="success"
            onClick={handleAddStep}
            style={{ minWidth: "150px" }}
          >
            Agregar
          </Button>
        </Form>
      )}

      <div className="mt-3">
        <p>Números ingresados:</p>
        <ul>
          {steps.map((step, index) => (
            <li key={index} style={{ color: step.correct ? "green" : "red" }}>
              {step.value} {step.correct ? "✔️" : "❌"}
            </li>
          ))}
        </ul>
      </div>

      {!showFinalButtons && steps.length > 0 && (
        <div className="d-flex justify-content-center mt-4">
          <Button
            className="activity-button me-2"
            variant="success"
            onClick={() => {
              setShowFinalButtons(true);
            }}
            style={{ minWidth: "150px" }}
          >
            Finalizar
          </Button>
          <Button
            className="activity-button"
            variant="danger"
            onClick={handleTerminate}
            style={{ minWidth: "150px" }}
          >
            Terminar
          </Button>
        </div>
      )}

      {showFinalButtons && (
        <div className="text-center mt-3">
          <Alert variant="info">
            Puede calcular su puntaje o terminar sin puntaje.
          </Alert>
          <Button
            className="activity-button me-2"
            variant="success"
            onClick={calculateScore}
            style={{ minWidth: "150px" }}
          >
            Calcular Puntaje
          </Button>
          <Button
            className="activity-button"
            variant="danger"
            onClick={handleTerminate}
            style={{ minWidth: "150px" }}
          >
            Terminar
          </Button>
        </div>
      )}

      {/* Botones de Regresar y Continuar */}
      <div className="d-flex justify-content-between mt-4">
        {isAdmin && (
          <Button
            className="back-button"
            variant="secondary"
            onClick={onPrevious}
            disabled={isFirstModule}
          >
            Regresar
          </Button>
        )}
        <Button
          className="continue-button"
          variant="success"
          onClick={calculateScore}
        >
          Continuar
        </Button>
      </div>
    </div>
  );
};


/* ==============================================
   MÓDULO PRINCIPAL DE ATENCIÓN
   ============================================== */
const Atencion = ({ onComplete, onPrevious, isFirstModule }) => {
  const isAdmin = useSelector((state) => state.auth.userInfo?.isAdmin) || false;

  const [currentActivityIndex, setCurrentActivityIndex] = useState(0);
  const [activity1Score, setActivity1Score] = useState(null);
  const [activity2Score, setActivity2Score] = useState(null);
  const [activity3Score, setActivity3Score] = useState(null);

  const handleActivity1Complete = (score, data) => {
    setActivity1Score(score);
    setCurrentActivityIndex(1);
  };

  const handleActivity2Complete = (score, data) => {
    setActivity2Score(score);
    setCurrentActivityIndex(2);
  };

  const handleActivity3Complete = (score, data) => {
    setActivity3Score(score);
    handleNext();
  };

  const handleNext = () => {
    const total = (activity1Score || 0) + (activity2Score || 0) + (activity3Score || 0);
    onComplete(total, {
      activity1: activity1Score,
      activity2: activity2Score,
      activity3: activity3Score,
    });
  };

  return (
    <div className="module-container">
      {currentActivityIndex === 0 && (
        <NumberSequenceActivity
          onComplete={handleActivity1Complete}
          onPrevious={onPrevious}
          isFirstModule={isFirstModule}
        />
      )}
      {currentActivityIndex === 1 && (
        <ConcentracionActivity
          onComplete={handleActivity2Complete}
          onPrevious={onPrevious}
          isFirstModule={isFirstModule}
        />
      )}
      {currentActivityIndex === 2 && (
        <Sub7Activity
          onComplete={handleActivity3Complete}
          onPrevious={onPrevious}
          isFirstModule={isFirstModule}
        />
      )}

      {/* Debug / Navegación rápida (solo visible si esAdmin) */}
      {isAdmin && (
        <div className="d-flex justify-content-center mt-4">
          <Button
            variant="info"
            onClick={() => setCurrentActivityIndex(0)}
            className="me-2"
          >
            Ir a Actividad 1
          </Button>
          <Button
            variant="info"
            onClick={() => setCurrentActivityIndex(1)}
            className="me-2"
          >
            Ir a Actividad 2
          </Button>
          <Button variant="info" onClick={() => setCurrentActivityIndex(2)}>
            Ir a Actividad 3
          </Button>
        </div>
      )}
    </div>
  );
};

export default Atencion;
