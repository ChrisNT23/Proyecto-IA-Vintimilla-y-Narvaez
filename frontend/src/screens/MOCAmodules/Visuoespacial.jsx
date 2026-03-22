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
  const [cubeImageUrl, setCubeImageUrl] = useState(null);
  const [clockImageUrl, setClockImageUrl] = useState(null);

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

      console.log("Visuoespacial Module - Total Score calculated:", totalScore);

      const standardResults = [
        buildMocaResult("Alternancia Conceptual", alternanciaScore),
        buildMocaResult("Cubo", cubeScore),
        buildMocaResult("Reloj", clockScore)
      ];


      onComplete(totalScore, {
        alternancia: alternanciaScore,
        cube: cubeScore,
        clock: clockScore,
        cubeImageUrl,
        clockImageUrl,
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
          setCubeImageUrl={setCubeImageUrl}
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
          setClockImageUrl={setClockImageUrl}
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
      console.log("Visuoespacial - Alternancia Score calculated:", numericScore);
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
    <div className="w-100 h-100 d-flex flex-column" style={{ padding: '20px 40px' }}>
      {/* Breadcrumb Section */}
      <div className="cubo-section-breadcrumb">
        SECCIÓN 1: VISUOESPACIAL / EJECUTIVA
      </div>

      {/* Header */}
      <div className="cubo-header">
        <h2 className="cubo-title">Capacidades Visuoconstructivas <span style={{ color: '#3b82f6' }}>(Alternancia)</span></h2>
      </div>

      {/* Instruction Row */}
      <div className="cubo-instruction-row">
        <div className="cubo-instruction-box">
          <div className="cubo-instruction-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
          </div>
          <p className="cubo-instruction-text">
            Dibuje una línea que pase de un <strong>número a una letra</strong>, y luego de una letra a un número, siguiendo el orden correlativo (1-A-2-B-3-C...).
          </p>
        </div>
        <button
          className="cubo-tts-button"
          onClick={() => speakInstructions("Dibuje una línea que pase de un número a una letra, y luego de una letra a un número, siguiendo el orden correlativo: uno, A, dos, B, tres, C, cuatro, D, cinco, E.")}
          disabled={isSpeaking}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5L6 9H2v6h4l5 4V5z"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
          Escuchar Instrucciones
        </button>
      </div>

      <div
        className="alternancia-wrapper mt-4 mb-4 w-100"
        style={{
          background: 'white',
          borderRadius: '24px',
          padding: '2.5rem',
          boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
          border: '1px solid #eef2f6',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          maxWidth: '900px',
          margin: '0 auto'
        }}
      >


      {/* Canvas Container */}
      <div ref={containerRef} className="p-4 mb-4 position-relative d-flex flex-column align-items-center justify-content-center" style={{ backgroundColor: '#fff', borderRadius: '16px', boxShadow: '0 2px 15px rgba(0,0,0,0.03)', minHeight: '600px', width: '100%', maxWidth: '800px' }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          backgroundImage: 'radial-gradient(#E2E8F0 2px, transparent 2px)',
          backgroundSize: '50px 50px',
          opacity: 0.6,
          borderRadius: '16px',
          pointerEvents: 'none'
        }} />

        <div className="d-flex justify-content-end mb-2 w-100 position-relative" style={{ zIndex: 10 }}>
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
            style={{ backgroundColor: 'transparent', maxWidth: '750px', minHeight: '550px' }}
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

      </div>

      <div className="cubo-footer mt-auto">
        <div>{/* Spacing */}</div>
        <button
          className="cubo-continue-button"
          onClick={handleContinue}
          style={{ padding: '0.8rem 1.5rem', fontSize: '1rem' }}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
              Evaluando...
            </>
          ) : (
            <>
              Siguiente Pregunta
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

// ========================= Cubo Activity =========================

const CuboActivity = ({
  cubeScore,
  setCubeScore,
  setCubeImageUrl,
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
    context.lineWidth = 3;
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
      console.log("Visuoespacial - Cubo Score calculated:", numericScore);
      setCubeScore(numericScore);
      if (data.imageUrl) setCubeImageUrl(data.imageUrl);


      if (Number(data.score) === 1) {
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

  return (
    <div className="w-100 h-100 d-flex flex-column" style={{ padding: '20px 40px' }}>
      {/* Breadcrumb Section */}
      <div className="cubo-section-breadcrumb">
        SECCIÓN 1: VISUOESPACIAL / EJECUTIVA
      </div>

      {/* Header */}
      <div className="cubo-header">
        <h2 className="cubo-title">Capacidades Visuoconstructivas <span style={{ color: '#3b82f6' }}>(Cubo)</span></h2>
      </div>

      {/* Instruction Row */}
      <div className="cubo-instruction-row">
        <div className="cubo-instruction-box">
          <div className="cubo-instruction-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
          </div>
          <p className="cubo-instruction-text">
            Copie el <strong>cubo</strong> de la manera más precisa posible. Se califica la exactitud y completitud.
          </p>
        </div>
        <button
          className="cubo-tts-button"
          onClick={() => speakInstructions("Copie este dibujo de la manera más precisa posible. Se califica la exactitud y completitud del cubo.")}
          disabled={isSpeaking}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5L6 9H2v6h4l5 4V5z"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
          Escuchar Instrucciones
        </button>
      </div>

      {/* Alerts moved above the canvas */}
      {showAlert && (
        <Alert
          variant={alertVariant}
          onClose={() => setShowAlert(false)}
          dismissible
          className="mb-4 text-center shadow-sm"
          style={{ borderRadius: '12px', padding: '1.25rem', fontWeight: '500' }}
        >
          {alertVariant === 'success' ? (
            <div className="d-flex align-items-center justify-content-center gap-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              <span>¡Excelente! {alertMessage}</span>
            </div>
          ) : (
            <div className="d-flex align-items-center justify-content-center gap-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
              <span>{alertMessage}</span>
            </div>
          )}
        </Alert>
      )}

      {error && (
        <Alert variant="danger" className="mb-4 text-center shadow-sm" style={{ borderRadius: '12px', padding: '1.25rem' }}>
          <div className="d-flex align-items-center justify-content-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"></polygon><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
            <span>{error}</span>
          </div>
        </Alert>
      )}

      {/* Main Drawing Container */}
      <div className="cubo-canvas-main-container">
        <div className="cubo-draw-area-wrapper">
          <img
            src={cubo}
            alt="Modelo Cubo"
            className="cubo-model-img"
          />
          <div className="cubo-canvas-container">
            <div className="cubo-canvas-dots"></div>
            <canvas
              ref={canvasRef}
              width={450}
              height={450}
              className="cubo-drawing-canvas"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            />
          </div>
        </div>

        {/* Canvas Controls (Undo & Clear) - Repositioned by CSS */}
        <div className="cubo-controls-wrapper">
          <button className="cubo-undo-button" onClick={handleUndo} title="Deshacer último trazo">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 14L4 9l5-5"></path><path d="M20 20v-7a4 4 0 0 0-4-4H4"></path></svg>
            Atras
          </button>
          <button className="cubo-clear-button" onClick={handleClear} title="Borrar todo el dibujo">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
            Borrar dibujo
          </button>
        </div>
      </div>

      {/* Evaluate Section */}
      <div className="cubo-evaluate-wrapper">
        <button
          className="cubo-evaluate-button"
          onClick={handleEvaluate}
          disabled={isLoading || lines.length === 0}
        >
          {isLoading ? (
            <>
              <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
              Procesando trazo...
            </>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
              Evaluar Trazo con IA
            </>
          )}
        </button>
      </div>

      {/* Unified Footer */}
      <div className="cubo-footer mt-auto">
        <button
          className="cubo-undo-button"
          onClick={handlePrevious}
          style={{ padding: '0.8rem 1.5rem', fontSize: '1rem' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          Regresar
        </button>
        <button
          className="cubo-continue-button"
          onClick={() => handleNext()}
          style={{ padding: '0.8rem 1.5rem', fontSize: '1rem' }}
        >
          Siguiente Pregunta
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
        </button>
      </div>
    </div>
  );
};

// ========================= Reloj Activity =========================

const RelojActivity = ({
  clockScore,
  setClockScore,
  setClockImageUrl,
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
    context.lineWidth = 3;
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
        console.log("Visuoespacial - Reloj Score calculated:", data.score);
        setClockScore(data.score);
        if (data.imageUrl) setClockImageUrl(data.imageUrl);
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
    <>
      {/* Breadcrumb Section */}
      <div className="cubo-section-breadcrumb">
        SECCIÓN 1: VISUOESPACIAL / EJECUTIVA
      </div>

      {/* Header Section */}
      <div className="cubo-header">
        <h1 className="cubo-title">
          Capacidades Visuoconstructivas <span className="text-primary">(Reloj)</span>
        </h1>
        <p className="cubo-subtitle">Instrucciones de dibujo y evaluación con IA</p>
      </div>

      {/* Instruction Row */}
      <div className="cubo-instruction-row">
        <div className="cubo-instruction-box">
          <div className="cubo-instruction-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
          </div>
          <p className="cubo-instruction-text">
            Dibuje un <strong>reloj</strong> que incluya todos los números y marque las <strong>11 y 10</strong>.
          </p>
        </div>
        <button
          className="cubo-tts-button"
          onClick={() => speakInstructions("Dibuje un reloj que incluya todos los números y marque las 11 y 10. Luego presione Evaluar y por último Continuar.")}
          disabled={isSpeaking}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5L6 9H2v6h4l5 4V5z"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
          Escuchar Instrucciones
        </button>
      </div>

      {/* Alerts moved above the canvas */}
      {showAlert && (
        <Alert
          variant={alertVariant}
          onClose={() => setShowAlert(false)}
          dismissible
          className="mb-4 text-center shadow-sm"
          style={{ borderRadius: '12px', padding: '1.25rem', fontWeight: '500' }}
        >
          {alertVariant === 'success' ? (
            <div className="d-flex align-items-center justify-content-center gap-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              <span>{alertMessage}</span>
            </div>
          ) : (
            <div className="d-flex align-items-center justify-content-center gap-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
              <span style={{ whiteSpace: 'pre-line' }}>{alertMessage}</span>
            </div>
          )}
        </Alert>
      )}

      {error && (
        <Alert variant="danger" className="mb-4 text-center shadow-sm" style={{ borderRadius: '12px', padding: '1.25rem' }}>
          <div className="d-flex align-items-center justify-content-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"></polygon><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
            <span>{error}</span>
          </div>
        </Alert>
      )}

      {/* Main Drawing Container */}
      <div className="cubo-canvas-main-container">
        <div className="cubo-draw-area-wrapper">
          <div className="cubo-canvas-container">
            <div className="cubo-canvas-dots"></div>
            <canvas
              ref={canvasRef}
              width={450}
              height={450}
              className="cubo-drawing-canvas"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            />
          </div>
        </div>

        {/* Canvas Controls (Undo & Clear) */}
        <div className="cubo-controls-wrapper">
          <button className="cubo-undo-button" onClick={handleUndo} title="Deshacer último trazo">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 14L4 9l5-5"></path><path d="M20 20v-7a4 4 0 0 0-4-4H4"></path></svg>
            Atras
          </button>
          <button className="cubo-clear-button" onClick={handleClear} title="Borrar todo el dibujo">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
            Borrar dibujo
          </button>
        </div>
      </div>

      {/* Evaluate Section */}
      <div className="cubo-evaluate-wrapper">
        <button
          className="cubo-evaluate-button"
          onClick={handleEvaluate}
          disabled={isLoading || lines.length === 0}
        >
          {isLoading ? (
            <>
              <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
              Procesando trazo...
            </>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
              Evaluar Trazo con IA
            </>
          )}
        </button>
      </div>

      {/* Footer */}
      <div className="cubo-footer mt-auto">
        <button
          className="cubo-undo-button"
          onClick={handlePrevious}
          style={{ padding: '0.8rem 1.5rem', fontSize: '1rem' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          Regresar
        </button>
        <button
          className="cubo-continue-button"
          onClick={handleContinue}
          style={{ padding: '0.8rem 1.5rem', fontSize: '1rem' }}
        >
          Siguiente Pregunta
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
        </button>
      </div>
    </>
  );
};

export default Visuoespacial;
