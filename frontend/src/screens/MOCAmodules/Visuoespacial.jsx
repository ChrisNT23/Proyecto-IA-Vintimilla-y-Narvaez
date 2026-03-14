// src/screens/MOCAmodules/Visuoespacial.jsx

import React, { useState, useEffect, useRef } from 'react';
import { Button, Alert, Spinner, Form, Row, Col } from 'react-bootstrap';
import { FaPlay, FaStop, FaUndo, FaTrash, FaArrowRight, FaExpand } from 'react-icons/fa';
import { useSelector } from 'react-redux';
import { buildMocaResult } from './helpers/mocaResultBuilder';
import '../../assets/styles/mocamodules.css';
import cubo from '../../images/cubo_image.jpg';

const Visuoespacial = ({ onComplete, onPrevious, isFirstModule, patientId }) => {
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

      const standardResults = [
        buildMocaResult("Alternancia Conceptual", alternanciaScore),
        buildMocaResult("Cubo", cubeScore),
        buildMocaResult("Reloj", clockScore)
      ];

      onComplete(totalScore, {
        alternancia: alternanciaScore,
        cube: cubeScore,
        clock: clockScore,
        standardResults
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
    <div className="w-100">
      {currentActivity === 0 && (
        <AlternanciaConceptualActivity
          setAlternanciaScore={setAlternanciaScore}
          handleNext={handleNext}
          handlePrevious={handlePrevious}
          isSpeaking={isSpeaking}
          speakInstructions={speakInstructions}
          isFirstModule={isFirstModule}
          isAdmin={isAdmin}
          patientId={patientId}
          userInfo={userInfo}
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
  patientId,
  userInfo,
}) => {
  const containerRef = useRef(null);
  const labels = ['1', 'A', '2', 'B', '3', 'C', '4', 'D', '5', 'E'];
  const svgSize = 450;

  const fixedMarkers = [
    { label: '1', x: 50, y: 225 },
    { label: 'A', x: 150, y: 50 },
    { label: '2', x: 300, y: 225 },
    { label: 'B', x: 400, y: 50 },
    { label: '3', x: 400, y: 400 },
    { label: 'C', x: 300, y: 350 },
    { label: '4', x: 150, y: 400 },
    { label: 'D', x: 50, y: 350 },
    { label: '5', x: 200, y: 275 },
    { label: 'E', x: 250, y: 125 },
  ];

  const initialConnections = [
    { from: 0, to: 1, dashed: true },
    { from: 1, to: 2, dashed: true },
  ];

  const [markers] = useState(fixedMarkers);
  const [connections, setConnections] = useState(initialConnections);
  const [selectedMarker, setSelectedMarker] = useState(2); // Iniciar en el punto '2' ya conectado
  const [mousePosition, setMousePosition] = useState(null);
  const [score, setScore] = useState(null);
  const [answers, setAnswers] = useState([]);

  // Estados para la integración con el servicio
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertVariant, setAlertVariant] = useState('success');

  const handleMarkerClick = (index) => {
    if (selectedMarker !== null && selectedMarker !== index) {
      // Evitar agregar conexiones duplicadas
      const exists = connections.some(c => 
        (c.from === selectedMarker && c.to === index) || 
        (c.from === index && c.to === selectedMarker)
      );
      
      if (!exists) {
        setConnections((prev) => [...prev, { from: selectedMarker, to: index, dashed: false }]);
        setAnswers((prev) => [...prev, `${markers[selectedMarker].label}-${markers[index].label}`]);
      }
      setSelectedMarker(index);
    } else {
      setSelectedMarker(index);
    }
  };

  const handleReset = () => {
    setConnections(initialConnections);
    setSelectedMarker(2); // Resetear a la posición inicial '2'
    setMousePosition(null);
    setScore(null);
    setAnswers([]);
    setAlternanciaScore(null);
    setShowAlert(false);
    setError(null);
    setIsLoading(false);
  };

  const handleUndo = () => {
    if (connections.length > initialConnections.length) {
      const newConnections = connections.slice(0, -1);
      setConnections(newConnections);
      setAnswers(prev => prev.slice(0, -1));

      if (newConnections.length === initialConnections.length) {
        setSelectedMarker(null);
      } else {
        setSelectedMarker(newConnections[newConnections.length - 1].to);
      }
    } else {
      handleReset();
    }
  };

  const handleMouseMove = (e) => {
    const svg = e.currentTarget;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());
    setMousePosition({
      x: svgP.x,
      y: svgP.y,
    });
  };

  const toggleFullScreen = () => {
    const elem = containerRef.current;
    if (!elem) return;
    if (!document.fullscreenElement) {
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
      } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const evaluateSequence = async () => {
    setIsLoading(true);
    setError(null);

    const userSequence = connections.map((conn) => markers[conn.from]?.label);
    const lastPoint = markers[connections[connections.length - 1]?.to]?.label;
    if (lastPoint) userSequence.push(lastPoint);

    try {
      const response = await fetch('/api/evaluate-alternancia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sequence: userSequence,
          userId: patientId || userInfo?._id,
          module: 'Visuoespacial',
          subtest: 'Alternancia Conceptual'
        })
      });

      if (!response.ok) {
        throw new Error(`Error en la petición: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Secuencia enviada:", userSequence);
      console.log("Respuesta completa del servidor:", data);

      const numericScore = Number(data.score);
      setScore(numericScore);
      setAlternanciaScore(numericScore);

      if (numericScore === 1) {
        setAlertMessage('¡Excelente! La secuencia es correcta.');
        setAlertVariant('success');
      } else {
        setAlertMessage('La secuencia no es correcta.');
        setAlertVariant('danger');
      }
      setShowAlert(true);
    } catch (err) {
      console.error("Error al evaluar secuencia:", err);
      setError("Hubo un problema al conectar con el servicio de evaluación.");
      setAlertMessage("Error al evaluar la secuencia. Intenta nuevamente.");
      setAlertVariant('danger');
      setShowAlert(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = async () => {
    if (score === null && !error) {
      await evaluateSequence();
    }
    handleNext();
  };

  return (
    <div className="bg-white shadow-sm w-100 h-100" style={{ padding: '40px', fontFamily: 'system-ui, -apple-system, sans-serif', border: '1px solid #e0e0e0', minHeight: '600px', display: 'flex', flexDirection: 'column', borderRadius: '16px' }}>
      {/* Header and subtitle */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1 fw-bold" style={{ color: '#004A7C', fontSize: '28px' }}>Alternancia Conceptual</h2>
          <span className="text-secondary" style={{ fontSize: '15px' }}>Evaluación de funciones ejecutivas</span>
        </div>
        <Button
          variant="outline-primary"
          onClick={() => speakInstructions(
            "Instrucciones: Dibuje una línea alternando cifras y letras, empezando en 1, luego A, 2, B, etc., hasta E. Presione Reiniciar para comenzar de nuevo y Continuar para avanzar."
          )}
          disabled={isSpeaking}
          className="d-flex align-items-center rounded-pill px-3 py-2"
          style={{ borderColor: '#2DAAE1', color: '#2DAAE1', backgroundColor: '#fff', fontWeight: '600', fontSize: '14px' }}
        >
          <div className="rounded-circle d-flex align-items-center justify-content-center me-2" style={{ backgroundColor: '#2DAAE1', width: '22px', height: '22px' }}>
            <FaPlay size={10} color="#fff" style={{ marginLeft: '2px' }} />
          </div>
          Escuchar Instrucciones
        </Button>
      </div>

      {/* Instruction Card */}
      <div className="p-4 mb-4" style={{ backgroundColor: '#fff', borderLeft: '4px solid #00A0E3', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
        <p className="mb-0 text-dark" style={{ fontSize: '16px', lineHeight: '1.5' }}>
          Dibuje una línea alternando entre cifras y letras, respetando el orden numérico y alfabético.<br />
          Inicie en <strong>1</strong> y termine en <strong>E</strong>.
        </p>
      </div>

      {/* Canvas Container */}
      <div ref={containerRef} className="p-4 mb-4 position-relative d-flex flex-column flex-grow-1" style={{ backgroundColor: '#fff', borderRadius: '16px', boxShadow: '0 2px 15px rgba(0,0,0,0.03)', minHeight: '400px' }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          backgroundImage: 'radial-gradient(#E2E8F0 2px, transparent 2px)',
          backgroundSize: '30px 30px',
          opacity: 0.6,
          borderRadius: '16px',
          pointerEvents: 'none'
        }} />

        <div className="d-flex justify-content-end mb-2 position-relative" style={{ zIndex: 10 }}>
          <Button
            variant="light"
            size="sm"
            className="d-flex align-items-center bg-white rounded shadow-sm border"
            style={{ fontSize: '11px', fontWeight: '600', color: '#666', letterSpacing: '0.5px' }}
            onClick={toggleFullScreen}
          >
            <FaExpand className="me-2" /> PANTALLA COMPLETA
          </Button>
        </div>

        <div className="d-flex justify-content-center flex-grow-1 align-items-center my-4 w-100" style={{ position: 'relative', zIndex: 1 }}>
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 500 500"
            preserveAspectRatio="xMidYMid meet"
            style={{ backgroundColor: 'transparent', maxWidth: '600px', maxHeight: '600px' }}
            onMouseMove={handleMouseMove}
          >
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
                  stroke="#00A0E3"
                  strokeWidth="2"
                  strokeDasharray="6,4"
                />
              );
            })}

            {selectedMarker !== null && mousePosition && (
              <line
                x1={markers[selectedMarker].x}
                y1={markers[selectedMarker].y}
                x2={mousePosition.x}
                y2={mousePosition.y}
                stroke="#00A0E3"
                strokeWidth="2"
                strokeDasharray="6,4"
              />
            )}

            {markers.map((marker, idx) => {
              const isConnected = connections.some(c => c.from === idx || c.to === idx) || selectedMarker === idx;

              return (
                <g
                  key={idx}
                  onClick={() => handleMarkerClick(idx)}
                  style={{ cursor: 'pointer' }}
                >
                  <circle
                    cx={marker.x}
                    cy={marker.y}
                    r="22"
                    fill={isConnected ? '#2DAAE1' : 'white'}
                    stroke="#2DAAE1"
                    strokeWidth="1.5"
                  />
                  <text
                    x={marker.x}
                    y={marker.y + 5}
                    textAnchor="middle"
                    fontSize="14"
                    fontWeight="bold"
                    fill={isConnected ? 'white' : '#2DAAE1'}
                  >
                    {marker.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Canvas controls */}
        <div className="d-flex justify-content-center gap-4 mt-4 pt-3" style={{ position: 'relative', zIndex: 50, borderTop: '1px solid #F0F0F0' }}>
          <Button
            variant="light"
            className="rounded-circle shadow-sm bg-white border d-flex justify-content-center align-items-center p-0"
            style={{ width: '50px', height: '50px' }}
            onClick={handleUndo}
            title="Deshacer (Atrás)"
          >
            <FaUndo style={{ display: 'block', width: '20px', height: '20px', color: '#6c757d' }} />
          </Button>
          <Button
            variant="light"
            className="rounded-circle shadow-sm bg-white border d-flex justify-content-center align-items-center p-0"
            style={{ width: '50px', height: '50px' }}
            onClick={handleReset}
            title="Borrar (Reiniciar)"
          >
            <FaTrash style={{ display: 'block', width: '20px', height: '20px', color: '#dc3545' }} />
          </Button>
        </div>

        {showAlert && (
          <Alert
            variant={alertVariant}
            onClose={() => setShowAlert(false)}
            dismissible
            className="mt-3 text-center position-relative"
            style={{ zIndex: 10 }}
          >
            {alertMessage}
          </Alert>
        )}

        {error && (
          <Alert variant="danger" className="mt-3 text-center position-relative" style={{ zIndex: 10 }}>
            {error}
          </Alert>
        )}
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

      <div className="d-flex justify-content-end mt-4">
        <Button
          onClick={handleContinue}
          disabled={isLoading}
          className="d-flex align-items-center px-4 py-2 rounded-3 shadow-sm"
          style={{ backgroundColor: '#217FE5', border: 'none', fontWeight: '500', fontSize: '15px' }}
        >
          {isLoading ? (
            <>
              <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
              Evaluando...
            </>
          ) : (
            <>Continuar <FaArrowRight className="ms-2" /></>
          )}
        </Button>
      </div>
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
      const numericScore = Number(data.score);
      setCubeScore(numericScore);

      if (Number(data.score) === 1) {
        setAlertMessage('¡Buen trabajo! El dibujo del cubo cumple los criterios establecidos.');
        setAlertVariant('success');
        console.log("Score recibido:", data.score, typeof data.score);
      } else {
        setAlertMessage('No se cumplieron todos los criterios del cubo (0 puntos).');
        setAlertVariant('danger');
        console.log("Score recibido:", data.score, typeof data.score);
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
