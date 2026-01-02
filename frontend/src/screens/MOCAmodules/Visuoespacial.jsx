// src/screens/MOCAmodules/Visuoespacial.jsx

import React, { useState, useEffect, useRef } from 'react';
import { Button, Alert, Spinner, Form, Row, Col } from 'react-bootstrap';
import { FaPlay, FaStop } from 'react-icons/fa';
import { useSelector } from 'react-redux';
import '../../assets/styles/mocamodules.css';
import cubo from '../../images/cubo_image.jpg';

const Visuoespacial = ({ onComplete, onPrevious, isFirstModule }) => {
  const userInfo = useSelector((state) => state.auth.userInfo);
  const isAdmin = userInfo?.isAdmin || false;

  const [currentActivity, setCurrentActivity] = useState(0);
  const [alternanciaScore, setAlternanciaScore] = useState(null);
  const [cubeScore, setCubeScore] = useState(null);
  const [clockScore, setClockScore] = useState(null);

  // TTS
  const [ttsSupported, setTtsSupported] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    if (!window.speechSynthesis) {
      setTtsSupported(false);
    }
  }, []);

  const speakInstructions = (text) => {
    if (!ttsSupported) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-ES';
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  const handleNext = () => {
    if (currentActivity < 2) {
      setCurrentActivity(currentActivity + 1);
    } else {
      const totalScore =
        (alternanciaScore || 0) + (cubeScore || 0) + (clockScore || 0);

      onComplete(totalScore, {
        alternancia: alternanciaScore,
        cube: cubeScore,
        clock: clockScore,
      });
    }
  };

  const handlePrevious = () => {
    if (currentActivity > 0) {
      setCurrentActivity(currentActivity - 1);
    } else {
      onPrevious();
    }
  };

  // Para seleccionar actividad (solo Admin)
  const handleSelectActivity = (activityIndex) => {
    if (!isAdmin) return;
    setCurrentActivity(activityIndex);
  };

  return (
    <div className="module-container">
      {currentActivity === 0 && (
        <AlternanciaConceptualActivity
          setAlternanciaScore={setAlternanciaScore}
          handleNext={handleNext}
          handlePrevious={handlePrevious}
          isSpeaking={isSpeaking}
          speakInstructions={speakInstructions}
          isFirstModule={isFirstModule}
          isAdmin={isAdmin}
        />
      )}
      {currentActivity === 1 && (
        <CuboActivity
          cubeScore={cubeScore}
          setCubeScore={setCubeScore}
          handleNext={handleNext}
          handlePrevious={handlePrevious}
          isSpeaking={isSpeaking}
          speakInstructions={speakInstructions}
          isFirstModule={isFirstModule}
          isAdmin={isAdmin}
        />
      )}
      {currentActivity === 2 && (
        <RelojActivity
          clockScore={clockScore}
          setClockScore={setClockScore}
          handleNext={handleNext}
          handlePrevious={handlePrevious}
          isSpeaking={isSpeaking}
          speakInstructions={speakInstructions}
          isFirstModule={isFirstModule}
          isAdmin={isAdmin}
        />
      )}

      {/* Botones para seleccionar actividad (solo admin) */}
      {isAdmin && (
        <div className="d-flex justify-content-center mt-4">
          <Button variant="secondary" onClick={() => handleSelectActivity(0)} className="me-2">
            Actividad 1
          </Button>
          <Button variant="secondary" onClick={() => handleSelectActivity(1)} className="me-2">
            Actividad 2
          </Button>
          <Button variant="secondary" onClick={() => handleSelectActivity(2)}>
            Actividad 3
          </Button>
        </div>
      )}
    </div>
  );
};

// ========================= Alternancia Conceptual =========================

const AlternanciaConceptualActivity = ({
  setAlternanciaScore,
  handleNext,
  handlePrevious,
  isSpeaking,
  speakInstructions,
  isFirstModule,
  isAdmin,
}) => {
  const labels = ['1', 'A', '2', 'B', '3', 'C', '4', 'D', '5', 'E'];
  const svgSize = 450;

  const fixedMarkers = [
    { label: '1', x: 50,  y: 225 },
    { label: 'A', x: 150, y: 50 },
    { label: '2', x: 300, y: 225 },
    { label: 'B', x: 400, y: 50 },
    { label: '3', x: 400, y: 400 },
    { label: 'C', x: 300, y: 350 },
    { label: '4', x: 150, y: 400 },
    { label: 'D', x: 50,  y: 350 },
    { label: '5', x: 200, y: 275 },
    { label: 'E', x: 250, y: 125 },
  ];

  const initialConnections = [
    { from: 0, to: 1, dashed: true },
    { from: 1, to: 2, dashed: true },
  ];

  const [markers] = useState(fixedMarkers);
  const [connections, setConnections] = useState(initialConnections);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [mousePosition, setMousePosition] = useState(null);
  const [score, setScore] = useState(null);
  const [answers, setAnswers] = useState([]);

  const handleMarkerClick = (index) => {
    if (selectedMarker !== null && selectedMarker !== index) {
      setConnections((prev) => [...prev, { from: selectedMarker, to: index, dashed: false }]);
      setSelectedMarker(index);
      setAnswers((prev) => [...prev, `${markers[selectedMarker].label}-${markers[index].label}`]);
    } else {
      setSelectedMarker(index);
    }
  };

  const handleReset = () => {
    setConnections(initialConnections);
    setSelectedMarker(null);
    setMousePosition(null);
    setScore(null);
    setAnswers([]);
    setAlternanciaScore(null);
  };

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const evaluateSequence = () => {
    const correctSequence = ['1', 'A', '2', 'B', '3', 'C', '4', 'D', '5', 'E'];
    const userSequence = connections.map((conn) => markers[conn.from]?.label);
    userSequence.push(markers[connections[connections.length - 1]?.to]?.label);

    const isCorrect =
      correctSequence.length === userSequence.length &&
      correctSequence.every((label, index) => label === userSequence[index]);

    const calculatedScore = isCorrect ? 1 : 0;
    setScore(calculatedScore);
    setAlternanciaScore(calculatedScore);
  };

  const handleContinue = () => {
    if (score === null) {
      evaluateSequence();
    }
    handleNext();
  };

  return (
    <div className="module-container">
      {/* Título e instrucciones */}
      <div className="d-flex align-items-center mb-2">
        <h4 className="mb-0">Alternancia Conceptual</h4>
        <Button
          variant="link"
          onClick={() => speakInstructions(
            "Instrucciones: Dibuje una línea alternando cifras y letras, empezando en 1, luego A, 2, B, etc., hasta E. Presione Reiniciar para comenzar de nuevo y Continuar para avanzar."
          )}
          disabled={isSpeaking}
          className="listen-button ms-3 text-decoration-none"
        >
          <FaPlay /> Escuchar<br />Instrucciones
        </Button>
      </div>

      <p>
        “Dibuje una línea alternando entre cifras y letras, respetando el orden 
        numérico y alfabético. Inicie en 1 y termine en E.”
      </p>

      <div className="d-flex justify-content-center">
        <svg
          width={svgSize}
          height={svgSize}
          style={{ border: '2px solid black', backgroundColor: '#f9f9f9' }}
          onMouseMove={handleMouseMove}
        >
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="10"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="blue" />
            </marker>
          </defs>

          {connections.map((conn, idx) => {
            const fromMarker = markers[conn.from];
            const toMarker = markers[conn.to];
            if (!fromMarker || !toMarker) return null;
            return (
              <line
                key={idx}
                x1={fromMarker.x}
                y1={fromMarker.y}
                x2={toMarker.x}
                y2={toMarker.y}
                stroke="blue"
                strokeWidth="2"
                strokeDasharray={conn.dashed ? '5,5' : '0'}
                markerEnd="url(#arrowhead)"
              />
            );
          })}

          {selectedMarker !== null && mousePosition && (
            <line
              x1={markers[selectedMarker].x}
              y1={markers[selectedMarker].y}
              x2={mousePosition.x}
              y2={mousePosition.y}
              stroke="gray"
              strokeWidth="1"
              strokeDasharray="5,5"
            />
          )}

          {markers.map((marker, idx) => (
            <g
              key={idx}
              onClick={() => handleMarkerClick(idx)}
              style={{ cursor: 'pointer' }}
            >
              <circle
                cx={marker.x}
                cy={marker.y}
                r="30"
                fill="white"
                stroke="black"
                strokeWidth="2"
              />
              <text
                x={marker.x}
                y={marker.y + 8}
                textAnchor="middle"
                fontSize="24"
                fill="black"
              >
                {marker.label}
              </text>
            </g>
          ))}
        </svg>
      </div>

      {isAdmin && (
        <div className="mt-3 text-center">
          <Form.Group className="mb-3">
            <Form.Label><strong>Respuestas seleccionadas (Admin):</strong></Form.Label>
            {answers.map((item, i) => (
              <div key={i}>{item}</div>
            ))}
          </Form.Group>
        </div>
      )}

      <Row className="mt-4">
        {isAdmin && (
          <Col xs="auto">
            <Button
              variant="warning"
              onClick={handleReset}
              className="me-2"
            >
              Reiniciar
            </Button>
          </Col>
        )}
        <Col className="d-flex justify-content-end">
          <Button
            variant="success"
            onClick={handleContinue}
          >
            Continuar
          </Button>
        </Col>
      </Row>
    </div>
  );
};

// ========================= Cubo Activity =========================

const CuboActivity = ({
  cubeScore,
  setCubeScore,
  handleNext,
  handlePrevious,
  isSpeaking,
  speakInstructions,
  isFirstModule,
  isAdmin
}) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [lines, setLines] = useState([]);
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const canvasRef = useRef(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertVariant, setAlertVariant] = useState('success');

  const [evaluated, setEvaluated] = useState(false);

  const handleMouseDown = (e) => {
    setIsDrawing(true);
    const rect = e.target.getBoundingClientRect();
    const point = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    setLines((prev) => [...prev, [point]]);
    setRedoStack([]);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing) return;
    const rect = e.target.getBoundingClientRect();
    const point = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    setLines((prev) => {
      const updated = [...prev];
      updated[updated.length - 1] = [...updated[updated.length - 1], point];
      return updated;
    });
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  const handleClear = () => {
    setLines([]);
    setUndoStack([]);
    setRedoStack([]);
    setCubeScore(null);
    setShowAlert(false);
    setError(null);
    setEvaluated(false);
  };

  const handleUndo = () => {
    if (lines.length === 0) return;
    const lastLine = lines[lines.length - 1];
    setRedoStack((prev) => [...prev, lastLine]);
    setLines((prev) => prev.slice(0, prev.length - 1));
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const lineToRestore = redoStack[redoStack.length - 1];
    setLines((prev) => [...prev, lineToRestore]);
    setRedoStack((prev) => prev.slice(0, prev.length - 1));
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#fff';
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.strokeStyle = '#000';
    context.lineWidth = 2;
    lines.forEach((line) => {
      context.beginPath();
      line.forEach((point, index) => {
        if (index === 0) {
          context.moveTo(point.x, point.y);
        } else {
          context.lineTo(point.x, point.y);
        }
      });
      context.stroke();
    });
  }, [lines]);

  const handleEvaluate = async () => {
    setIsLoading(true);
    setError(null);

    const canvas = canvasRef.current;
    if (!canvas) {
      setAlertMessage("No se encontró el canvas.");
      setAlertVariant('danger');
      setShowAlert(true);
      setIsLoading(false);
      return;
    }

    try {
      const imageData = canvas.toDataURL("image/png");
      const response = await fetch('/api/evaluate-cube', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageData })
      });

      if (!response.ok) {
        throw new Error(`Error en la petición: ${response.statusText}`);
      }

      const data = await response.json();
      setCubeScore(data.score);

      if (data.score === 1) {
        setAlertMessage('¡Buen trabajo! El dibujo del cubo cumple los criterios establecidos.');
        setAlertVariant('success');
      } else {
        setAlertMessage('No se cumplieron todos los criterios del cubo (0 puntos).');
        setAlertVariant('danger');
      }
      setShowAlert(true);
      setEvaluated(true);
    } catch (err) {
      setError("Hubo un problema al evaluar el cubo.");
      setAlertMessage("Hubo un problema al evaluar el cubo. Intenta nuevamente.");
      setAlertVariant('danger');
      setShowAlert(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = () => {
    // Ya no se deshabilita el botón, el usuario puede avanzar sin evaluar
    handleNext();
  };

  return (
    <div className="module-container">
      <div className="d-flex align-items-center mb-2">
        <h4 className="mb-0">Capacidades Visuoconstructivas (Cubo)</h4>
        <Button
          variant="link"
          onClick={() =>
            speakInstructions(
              "Instrucciones: Copie el cubo de la manera más precisa posible. Puede usar las herramientas de deshacer, rehacer o borrar. Luego presione Evaluar y finalmente Continuar."
            )
          }
          disabled={isSpeaking}
          className="listen-button ms-3 text-decoration-none"
        >
          <FaPlay /> Escuchar<br />Instrucciones
        </Button>
      </div>
      <p>“Copie este dibujo de la manera más precisa posible”. Se califica la exactitud y completitud del cubo.</p>

      <div className="d-flex justify-content-center">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <img
            src={cubo}
            alt="Cubo"
            style={{ width: '300px', marginRight: '20px' }}
          />
          <canvas
            ref={canvasRef}
            width={300}
            height={300}
            style={{ border: '1px solid black', backgroundColor: '#fff' }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />
        </div>
      </div>

      <Row className="mt-3 justify-content-center">
        <Col xs="auto" className="d-flex">
          {isAdmin && (
            <>
              <Button variant="outline-secondary" onClick={handleUndo} className="me-2">
                Deshacer
              </Button>
              <Button variant="outline-secondary" onClick={handleRedo} className="me-2">
                Rehacer
              </Button>
            </>
          )}
          <Button variant="warning" onClick={handleClear}>
            Borrar dibujo
          </Button>
        </Col>
      </Row>

      <Row className="mt-3 justify-content-center">
        <Col xs={12} md={6}>
          <Button
            variant="primary"
            onClick={handleEvaluate}
            disabled={isLoading || lines.length === 0}
            className="w-100"
          >
            {isLoading ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                Evaluando...
              </>
            ) : (
              "Evaluar"
            )}
          </Button>
        </Col>
      </Row>

      {showAlert && (
        <Alert
          variant={alertVariant}
          onClose={() => setShowAlert(false)}
          dismissible
          className="mt-3 text-center"
        >
          {alertMessage}
        </Alert>
      )}

      {error && (
        <Alert variant="danger" className="mt-3 text-center">
          {error}
        </Alert>
      )}

      <div className="d-flex flex-column align-items-center mt-3">
        {cubeScore !== null && (
          <Button
            variant={cubeScore === 1 ? 'success' : 'danger'}
            className="w-100"
            disabled
          >
            {cubeScore === 1
              ? 'Criterios cumplidos (+1)'
              : 'Criterios no cumplidos (0)'}
          </Button>
        )}
      </div>

      <Row className="mt-4">
        {isAdmin && (
          <Col xs="auto">
            <Button variant="secondary" onClick={handlePrevious} className="me-2">
              Regresar
            </Button>
          </Col>
        )}
        <Col className="d-flex justify-content-end">
          <Button
            variant="success"
            onClick={handleContinue}
          >
            Continuar
          </Button>
        </Col>
      </Row>
    </div>
  );
};

// ========================= Reloj Activity =========================

const RelojActivity = ({
  clockScore,
  setClockScore,
  handleNext,
  handlePrevious,
  isSpeaking,
  speakInstructions,
  isFirstModule,
  isAdmin
}) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [lines, setLines] = useState([]);
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const canvasRef = useRef(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertVariant, setAlertVariant] = useState('success');

  const [evaluated, setEvaluated] = useState(false);

  const handleMouseDown = (e) => {
    setIsDrawing(true);
    const rect = e.target.getBoundingClientRect();
    const point = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    setLines((prev) => [...prev, [point]]);
    setRedoStack([]);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing) return;
    const rect = e.target.getBoundingClientRect();
    const point = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    setLines((prev) => {
      const updated = [...prev];
      updated[updated.length - 1] = [...updated[updated.length - 1], point];
      return updated;
    });
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  const handleClear = () => {
    setLines([]);
    setUndoStack([]);
    setRedoStack([]);
    setClockScore(null);
    setShowAlert(false);
    setError(null);
    setEvaluated(false);
  };

  const handleUndo = () => {
    if (lines.length === 0) return;
    const lastLine = lines[lines.length - 1];
    setRedoStack((prev) => [...prev, lastLine]);
    setLines((prev) => prev.slice(0, prev.length - 1));
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const lineToRestore = redoStack[redoStack.length - 1];
    setLines((prev) => [...prev, lineToRestore]);
    setRedoStack((prev) => prev.slice(0, prev.length - 1));
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#fff';
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.strokeStyle = '#000';
    context.lineWidth = 2;
    lines.forEach((line) => {
      context.beginPath();
      line.forEach((point, index) => {
        if (index === 0) {
          context.moveTo(point.x, point.y);
        } else {
          context.lineTo(point.x, point.y);
        }
      });
      context.stroke();
    });
  }, [lines]);

  const handleEvaluate = async () => {
    setIsLoading(true);
    setError(null);

    const canvas = canvasRef.current;
    if (!canvas) {
      setAlertMessage("No se encontró el canvas.");
      setAlertVariant('danger');
      setShowAlert(true);
      setIsLoading(false);
      return;
    }

    try {
      const imageData = canvas.toDataURL("image/png");
      const response = await fetch('http://localhost:5001/api/evaluate-clock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageData })
      });

      if (!response.ok) {
        throw new Error(`Error en la petición: ${response.statusText}`);
      }

      const data = await response.json();

      if (typeof data.score === 'number') {
        setClockScore(data.score);
        setEvaluated(true);

        if (data.score === 3) {
          setAlertMessage('¡Perfecto! Contorno, números y agujas correctos (3 pts).');
          setAlertVariant('success');
        } else {
          const { contorno, numeros, agujas } = data.detail || {};
          setAlertMessage(`Puntaje: ${data.score}/3
Contorno: ${contorno || 'No cumple'}
Números: ${numeros || 'No cumple'}
Agujas: ${agujas || 'No cumple'}`);
          setAlertVariant('warning');
        }
        setShowAlert(true);
      }
    } catch (err) {
      setError("Hubo un problema al evaluar el reloj.");
      setAlertMessage("Hubo un problema al evaluar el reloj. Intenta nuevamente.");
      setAlertVariant('danger');
      setShowAlert(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = () => {
    // Siempre habilitado
    handleNext();
  };

  return (
    <div className="module-container">
      <div className="d-flex align-items-center mb-2">
        <h4 className="mb-0">Capacidades Visuoconstructivas (Reloj)</h4>
        <Button
          variant="link"
          onClick={() =>
            speakInstructions(
              "Instrucciones: Dibuje un reloj, incluyendo todos los números, y marque las 11 y 10. Luego presione Evaluar y por último Continuar."
            )
          }
          disabled={isSpeaking}
          className="listen-button ms-3 text-decoration-none"
        >
          <FaPlay /> Escuchar<br />Instrucciones
        </Button>
      </div>

      <p>“Dibuje un reloj que incluya todos los números y marque las 11 y 10.”</p>

      <div className="d-flex justify-content-center">
        <canvas
          ref={canvasRef}
          width={300}
          height={300}
          style={{ border: '1px solid black', backgroundColor: '#fff' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
      </div>

      <Row className="mt-3 justify-content-center">
        <Col xs="auto" className="d-flex">
          {isAdmin && (
            <>
              <Button variant="outline-secondary" onClick={handleUndo} className="me-2">
                Deshacer
              </Button>
              <Button variant="outline-secondary" onClick={handleRedo} className="me-2">
                Rehacer
              </Button>
            </>
          )}
          <Button variant="warning" onClick={handleClear}>
            Borrar dibujo
          </Button>
        </Col>
      </Row>

      <Row className="mt-3 justify-content-center">
        <Col xs={12} md={6}>
          <Button
            variant="primary"
            onClick={handleEvaluate}
            disabled={isLoading || lines.length === 0}
            className="w-100"
          >
            {isLoading ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                Evaluando...
              </>
            ) : (
              "Evaluar"
            )}
          </Button>
        </Col>
      </Row>

      {showAlert && (
        <Alert
          variant={alertVariant}
          onClose={() => setShowAlert(false)}
          dismissible
          className="mt-3 text-center"
        >
          {alertMessage}
        </Alert>
      )}

      {error && (
        <Alert variant="danger" className="mt-3 text-center">
          {error}
        </Alert>
      )}

      <div className="d-flex flex-column align-items-center mt-3">
        {clockScore !== null && (
          <Button
            variant={clockScore > 0 ? 'success' : 'danger'}
            className="w-100"
            disabled
          >
            {clockScore > 0
              ? `Criterios cumplidos (+${clockScore})`
              : 'Criterios no cumplidos (0)'}
          </Button>
        )}
      </div>

      <Row className="mt-4">
        {isAdmin && (
          <Col xs="auto">
            <Button
              variant="secondary"
              onClick={handlePrevious}
              className="me-2"
            >
              Regresar
            </Button>
          </Col>
        )}
        <Col className="d-flex justify-content-end">
          <Button
            variant="success"
            onClick={handleContinue}
          >
            Continuar
          </Button>
        </Col>
      </Row>
    </div>
  );
};

export default Visuoespacial;
