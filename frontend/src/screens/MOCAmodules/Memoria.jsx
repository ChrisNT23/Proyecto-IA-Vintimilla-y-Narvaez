// src/screens/MOCAmodules/Memoria.jsx

import React, { useState, useEffect, useRef } from "react";
import { Button, Row, Col, Form, Alert, Spinner } from "react-bootstrap";
import { FaPlay, FaStop, FaMicrophone } from "react-icons/fa";
import { useSelector } from "react-redux";
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

  useEffect(() => {
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

  const handleNoMoreWords = () => {
    if (stage === STAGE_FIRST_RECALL) {
      setStage(STAGE_SECOND_READ);
    } else if (stage === STAGE_SECOND_RECALL) {
      setStage(STAGE_FINAL);
      setMessage(
        "Recuerde estas palabras, ya que deberá repetirlas más tarde al final de la prueba."
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
    onComplete(score, { responses: uniqueResponses });
  };

  return (
    <div className="module-container">
      {/* Título e instrucciones */}
      <div className="d-flex align-items-center mb-2">
        <h4 className="mb-0">Memoria</h4>
        <Button
          variant="link"
          onClick={handleSpeakInstructions}
          disabled={isSpeakingLocal}
          className="listen-button ms-3 text-decoration-none"
        >
          <FaPlay /> Escuchar<br />Instrucciones
        </Button>
      </div>

      {stage === STAGE_FIRST_READ || stage === STAGE_SECOND_READ ? (
        <div className="text-center mt-3">
          <Spinner animation="grow" variant="primary" />
          <p className="mt-3">
            {stage === STAGE_FIRST_READ
              ? "Ésta es una prueba de memoria. Se leerá una lista de palabras..."
              : "Repetiré la lista. Intente recordarlas..."}
          </p>
        </div>
      ) : null}

      {(stage === STAGE_FIRST_RECALL || stage === STAGE_SECOND_RECALL) && !message && (
        <div className="text-center mt-3">
          <p>Dígame todas las palabras que recuerde.</p>
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
                <p>¿Es correcta su palabra?</p>
                <strong>{transcript}</strong>
              </Alert>
              <Row>
                <Col className="d-flex justify-content-start">
                  <Button
                    className="activity-button me-3"
                    variant="warning"
                    onClick={handleRetry}
                  >
                    Reintentar
                  </Button>
                </Col>
                <Col className="d-flex justify-content-end">
                  <Button
                    className="activity-button"
                    variant="success"
                    onClick={handleConfirmWord}
                  >
                    Sí
                  </Button>
                </Col>
              </Row>
            </div>
          )}

          <Form
            onSubmit={(e) => e.preventDefault()}
            className="mt-3 d-flex flex-column align-items-center"
          >
            <Form.Control
              type="text"
              placeholder="Escriba una o varias palabras separadas por comas"
              value={manualWords}
              onChange={(e) => setManualWords(e.target.value.toUpperCase())}
              onKeyPress={handleManualKeyPress}
              style={{ maxWidth: "350px" }}
            />
            <Button
              className="activity-button mt-2"
              variant="success"
              onClick={handleAddManualWords}
            >
              Agregar
            </Button>
          </Form>

          <div className="mt-3">
            <p>Palabras recordadas:</p>
            <ul>
              {responses.map((word, index) => (
                <li key={index}>{word}</li>
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

      {/* Botón de Regresar y Continuar */}
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

export default Memoria;
