// src/screens/MOCAmodules/Orientacion.jsx

import React, { useState, useEffect, useRef } from "react";
import { Button, Row, Col, Form } from "react-bootstrap";
import { FaPlay, FaStop } from "react-icons/fa";
import { useSelector } from "react-redux";
import "../../assets/styles/mocamodules.css";

const Orientacion = ({ onComplete, onPrevious, isFirstModule }) => {
  const userInfo = useSelector((state) => state.auth.userInfo);
  const isAdmin = userInfo?.isAdmin || false;

  // Etapas de la prueba
  const STAGE_DATE = 1;
  const STAGE_WEEKDAY = 2;
  const STAGE_LOCATION = 3;

  const [stage, setStage] = useState(STAGE_DATE);

  const [selectedDate, setSelectedDate] = useState({
    day: "",
    month: "",
    year: "",
  });
  const [selectedWeekday, setSelectedWeekday] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");

  const [scores, setScores] = useState({
    date: 0,
    weekday: 0,
    location: 0,
  });

  // Para mostrar las respuestas elegidas
  const [recordedAnswers, setRecordedAnswers] = useState({
    date: "",
    weekday: "",
    location: "",
  });

  // Ubicación correcta para puntaje
  const correctLocation = "Clínica";

  // Datos actuales para validación
  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = today.toLocaleString("es-ES", { month: "long" });
  const currentYear = today.getFullYear();
  const currentWeekday = today.toLocaleString("es-ES", { weekday: "long" });

  // Para TTS
  const [ttsSupported, setTtsSupported] = useState(!!window.speechSynthesis);
  const [isSpeakingLocal, setIsSpeakingLocal] = useState(false);

  // Speech Recognition
  const recognitionRef = useRef(null);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [confirmation, setConfirmation] = useState(false);
  const [manualInput, setManualInput] = useState("");

  // Verificar si ya se reprodujeron instrucciones para la etapa actual
  const hasSpokenInstructionsRef = useRef(false);

  useEffect(() => {
    if (!window.speechSynthesis) {
      setTtsSupported(false);
    }
  }, []);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) return;

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
    };
  }, []);

  // Reproducir instrucciones al cambiar de etapa (solo la primera vez en cada etapa)
  useEffect(() => {
    if (ttsSupported && stage !== 0 && !hasSpokenInstructionsRef.current) {
      speakInstructions(getInstructionsText(stage));
      hasSpokenInstructionsRef.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  // Obtener el texto de instrucciones según la etapa
  const getInstructionsText = (currentStage) => {
    switch (currentStage) {
      case STAGE_DATE:
        return "Dígame en qué día, mes y año estamos hoy.";
      case STAGE_WEEKDAY:
        return "Dígame el día de la semana.";
      case STAGE_LOCATION:
        return "Dígame cómo se llama el lugar donde estamos ahora.";
      default:
        return "";
    }
  };

  // Hablar instrucciones
  const speakInstructions = (text) => {
    if (!ttsSupported) return;
    if (isSpeakingLocal) {
      window.speechSynthesis.cancel();
      setIsSpeakingLocal(false);
    } else {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "es-ES";
      utterance.onend = () => {
        setIsSpeakingLocal(false);
      };
      window.speechSynthesis.speak(utterance);
      setIsSpeakingLocal(true);
    }
  };

  // Validar fecha
  const validateDate = () => {
    const { day, month, year } = selectedDate;
    if (!day || !month || !year) return false;
    const monthLower = month.toLowerCase();
    return (
      parseInt(day, 10) === currentDay &&
      monthLower === currentMonth.toLowerCase() &&
      parseInt(year, 10) === currentYear
    );
  };

  // Validar día de la semana
  const validateWeekday = (day) => {
    return day.toLowerCase() === currentWeekday.toLowerCase();
  };

  // Validar ubicación
  const validateLocation = (location) => {
    return location.toLowerCase() === correctLocation.toLowerCase();
  };

  // Manejar cambio en la fecha
  const handleDateChange = (field, value) => {
    setSelectedDate((prev) => ({ ...prev, [field]: value }));
  };

  // Botón "Continuar" para la fecha (etapa 1)
  const handleNextDate = () => {
    // Si la fecha es correcta, +1
    let tempScore = scores;
    if (validateDate()) {
      tempScore = { ...tempScore, date: 1 };
      setScores(tempScore);
      setRecordedAnswers((prev) => ({
        ...prev,
        date: `${selectedDate.day}/${selectedDate.month}/${selectedDate.year}`,
      }));
    }
    setStage(STAGE_WEEKDAY);
    hasSpokenInstructionsRef.current = false;
  };

  // Botón "Continuar" para la semana (etapa 2)
  const handleNextWeekday = (day) => {
    let tempScore = scores;
    setSelectedWeekday(day);
    if (validateWeekday(day)) {
      tempScore = { ...tempScore, weekday: 1 };
      setScores(tempScore);
      setRecordedAnswers((prev) => ({
        ...prev,
        weekday: day.charAt(0).toUpperCase() + day.slice(1),
      }));
    }
    setStage(STAGE_LOCATION);
    hasSpokenInstructionsRef.current = false;
  };

  // Botón "Terminar Prueba" (etapa 3)
  const handleFinish = (location) => {
    let tempScore = scores;
    setSelectedLocation(location);

    if (validateLocation(location)) {
      tempScore = { ...tempScore, location: 1 };
      setScores(tempScore);
      setRecordedAnswers((prev) => ({
        ...prev,
        location,
      }));
    }

    const total = tempScore.date + tempScore.weekday + tempScore.location;

    // Llamamos a onComplete con un flag especial que indique el fin de la prueba
    onComplete(total, {
      date: selectedDate,
      weekday: selectedWeekday,
      location,
      total,
      forceFinish: true, // Indicamos que se forzó el fin aquí
    });
  };

  // Botón "Regresar" (solo admin)
  const handleGoBack = () => {
    onPrevious();
  };

  return (
    <div className="module-container">
      {/* Título + Escuchar Instrucciones */}
      <div className="d-flex align-items-center mb-2">
        <h4 className="mb-0">Orientación</h4>
        <Button
          variant="link"
          onClick={() => speakInstructions(getInstructionsText(stage))}
          disabled={isSpeakingLocal}
          className="listen-button ms-3 text-decoration-none"
        >
          <FaPlay /> Escuchar<br />Instrucciones
        </Button>
      </div>

      {/* Respuestas Seleccionadas */}
      {(recordedAnswers.date || recordedAnswers.weekday || recordedAnswers.location) && (
        <div className="mb-4">
          <h5>Respuestas seleccionadas:</h5>
          <ul>
            {recordedAnswers.date && (
              <li>
                <strong>Fecha:</strong> {recordedAnswers.date}
              </li>
            )}
            {recordedAnswers.weekday && (
              <li>
                <strong>Día de la semana:</strong> {recordedAnswers.weekday}
              </li>
            )}
            {recordedAnswers.location && (
              <li>
                <strong>Ubicación:</strong> {recordedAnswers.location}
              </li>
            )}
          </ul>
        </div>
      )}

      {/* Etapa 1: Fecha */}
      {stage === STAGE_DATE && (
        <>
          <p>Seleccione el día, mes y año de hoy.</p>
          <Form className="text-center">
            <Row className="justify-content-center">
              <Col xs={6} md={3} className="mb-3">
                <Form.Select
                  value={selectedDate.day}
                  onChange={(e) => handleDateChange("day", e.target.value)}
                >
                  <option value="">Día</option>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </Form.Select>
              </Col>
              <Col xs={6} md={3} className="mb-3">
                <Form.Select
                  value={selectedDate.month}
                  onChange={(e) => handleDateChange("month", e.target.value)}
                >
                  <option value="">Mes</option>
                  {[
                    "enero",
                    "febrero",
                    "marzo",
                    "abril",
                    "mayo",
                    "junio",
                    "julio",
                    "agosto",
                    "septiembre",
                    "octubre",
                    "noviembre",
                    "diciembre",
                  ].map((month) => (
                    <option key={month} value={month}>
                      {month.charAt(0).toUpperCase() + month.slice(1)}
                    </option>
                  ))}
                </Form.Select>
              </Col>
              <Col xs={6} md={3} className="mb-3">
                <Form.Select
                  value={selectedDate.year}
                  onChange={(e) => handleDateChange("year", e.target.value)}
                >
                  <option value="">Año</option>
                  {Array.from({ length: 5 }, (_, i) => currentYear - i).map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </Form.Select>
              </Col>
            </Row>
          </Form>

          {/* Botones de Regresar y Continuar */}
          <div className="d-flex justify-content-between mt-4">
            {isAdmin && (
              <Button
                className="back-button"
                variant="secondary"
                onClick={handleGoBack}
                disabled={isFirstModule}
              >
                Regresar
              </Button>
            )}
            <Button
              className="continue-button"
              variant="success"
              onClick={handleNextDate}
            >
              Continuar
            </Button>
          </div>
        </>
      )}

      {/* Etapa 2: Día de la semana */}
      {stage === STAGE_WEEKDAY && (
        <>
          <div className="text-center">
            <p>Seleccione el día de la semana.</p>
            <Row className="justify-content-center">
              {["lunes","martes","miércoles","jueves","viernes","sábado","domingo"].map((day) => (
                <Col xs={6} md={3} className="mb-2" key={day}>
                  <Button
                    className="activity-button w-100"
                    onClick={() => handleNextWeekday(day)}
                  >
                    {day.charAt(0).toUpperCase() + day.slice(1)}
                  </Button>
                </Col>
              ))}
            </Row>
          </div>

          {/* Botones de Regresar y Continuar (aunque la selección es inmediata, mantenemos el estilo) */}
          <div className="d-flex justify-content-between mt-4">
            {isAdmin && (
              <Button
                className="back-button"
                variant="secondary"
                onClick={() => setStage(STAGE_DATE)}
              >
                Regresar
              </Button>
            )}
            <Button
              className="continue-button"
              variant="success"
              onClick={() => setStage(STAGE_LOCATION)}
            >
              Continuar
            </Button>
          </div>
        </>
      )}

      {/* Etapa 3: Ubicación */}
      {stage === STAGE_LOCATION && (
        <>
          <div className="text-center">
            <p>Seleccione el lugar donde nos encontramos.</p>
            <Row className="justify-content-center">
              {["Hospital", "Clínica", "Oficina", "Escuela"].map((location) => (
                <Col xs={6} md={3} className="mb-2" key={location}>
                  <Button
                    className="activity-button w-100"
                    onClick={() => handleFinish(location)}
                  >
                    {location}
                  </Button>
                </Col>
              ))}
            </Row>
          </div>

          {/* Botones de Regresar y Terminar Prueba */}
          <div className="d-flex justify-content-between mt-4">
            {isAdmin && (
              <Button
                className="back-button"
                variant="secondary"
                onClick={() => setStage(STAGE_WEEKDAY)}
              >
                Regresar
              </Button>
            )}
            <Button
              className="continue-button"
              variant="success"
              onClick={() => handleFinish(selectedLocation || "")}
            >
              Terminar Prueba
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default Orientacion;
