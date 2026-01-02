// src/screens/MocaStart.jsx

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Button,
  Container,
  Form,
  ListGroup,
  Row,
  Col,
  Alert,
  Spinner,
  Card,
} from "react-bootstrap";
import { useGetPatientsQuery, useUpdatePatientMutation } from "../slices/patientApiSlice";
import { useCreateMocaSelfMutation } from "../slices/mocaSelfApiSlice";

import "../assets/styles/MocaStart.css"; // Asegúrate de tener este archivo en tu proyecto

const MocaStart = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // == Obtener Paciente ==
  const {
    data: patients = [],
    isLoading: isPatientsLoading,
    error: patientsError,
  } = useGetPatientsQuery();
  const selectedPatient = patients.find((p) => p._id === id);

  // == Estados Principales ==
  const [testStarted, setTestStarted] = useState(false);
  const [extraPoint, setExtraPoint] = useState(0); // +1 si <=12 años de educación
  const [totalScore, setTotalScore] = useState(0);

  // == Visuoespacial/Ejecutivo ==
  const [diagramScore, setDiagramScore] = useState(null);
  const [cubeScore, setCubeScore] = useState(null);
  const [clockScore, setClockScore] = useState(null);

  // == Denominación ==
  const [lionScore, setLionScore] = useState(null);
  const [rhinoScore, setRhinoScore] = useState(null);
  const [camelScore, setCamelScore] = useState(null);

  // == Memoria y Atención ==
  const [memoryScore, setMemoryScore] = useState(null);
  const [digitsForwardScore, setDigitsForwardScore] = useState(null);
  const [digitsBackwardScore, setDigitsBackwardScore] = useState(null);
  const [letterTapScore, setLetterTapScore] = useState(null);
  const [serialSubtractionScore, setSerialSubtractionScore] = useState(null);

  // == Lenguaje ==
  const [sentence1Score, setSentence1Score] = useState(null);
  const [sentence2Score, setSentence2Score] = useState(null);
  const [wordsFScore, setWordsFScore] = useState(null);

  // == Abstracción ==
  const [abstraction1Score, setAbstraction1Score] = useState(null);
  const [abstraction2Score, setAbstraction2Score] = useState(null);

  // == Recuerdo Diferido ==
  const [delayedRecallScore, setDelayedRecallScore] = useState(null);

  // == Orientación ==
  const [orientationScore, setOrientationScore] = useState(null);

  // == Mutación para Crear un MocaSelf ==
  const [
    createMocaSelf,
    { isLoading: isSaving, isSuccess: isSaveSuccess, isError: isSaveError, error: saveError },
  ] = useCreateMocaSelfMutation();

  // == Mutación para Actualizar mocaAssigned ==
  const [
    updatePatient,
    {
      isLoading: isUpdatingPatient,
      isSuccess: isUpdateSuccess,
      isError: isUpdateError,
      error: updateError,
    },
  ] = useUpdatePatientMutation();

  // == Funciones de Cálculo por Módulo ==
  const getVisuoespacialScore = () =>
    (diagramScore || 0) + (cubeScore || 0) + (clockScore || 0);

  const getDenominacionScore = () =>
    (lionScore || 0) + (rhinoScore || 0) + (camelScore || 0);

  const getMemoriaAtencionScore = () =>
    (memoryScore || 0) +
    (digitsForwardScore || 0) +
    (digitsBackwardScore || 0) +
    (letterTapScore || 0) +
    (serialSubtractionScore || 0);

  const getLenguajeScore = () =>
    (sentence1Score || 0) + (sentence2Score || 0) + (wordsFScore || 0);

  const getAbstraccionScore = () =>
    (abstraction1Score || 0) + (abstraction2Score || 0);

  const getRecuerdoDiferidoScore = () => delayedRecallScore || 0;
  const getOrientacionScore = () => orientationScore || 0;

  // == Calcular Puntaje Total en cada render ==
  useEffect(() => {
    const currentScore =
      extraPoint +
      getVisuoespacialScore() +
      getDenominacionScore() +
      getMemoriaAtencionScore() +
      getLenguajeScore() +
      getAbstraccionScore() +
      getRecuerdoDiferidoScore() +
      getOrientacionScore();

    setTotalScore(currentScore);
  }, [
    extraPoint,
    diagramScore,
    cubeScore,
    clockScore,
    lionScore,
    rhinoScore,
    camelScore,
    memoryScore,
    digitsForwardScore,
    digitsBackwardScore,
    letterTapScore,
    serialSubtractionScore,
    sentence1Score,
    sentence2Score,
    wordsFScore,
    abstraction1Score,
    abstraction2Score,
    delayedRecallScore,
    orientationScore,
  ]);

  // == Manejo de Inicio de Test ==
  const handleStartTest = () => setTestStarted(true);

  // == Manejo de Educación ==
  const handleEducationChange = (years) => {
    setExtraPoint(years === "less" ? 1 : 0);
  };

  // == Manejo de Puntajes (seleccionar y deseleccionar) ==
  const handleScoreChange = (val, currentScore, setFunc) => {
    if (currentScore === val) {
      // Si se hace click en el mismo botón, deseleccionar
      setFunc(null);
    } else {
      setFunc(val);
    }
  };

  // == Guardar Resultados (Con Actualización de mocaAssigned) ==
  const handleSaveResults = async () => {
    if (!selectedPatient) {
      alert("Paciente no seleccionado.");
      return;
    }

    let finalScore = totalScore;
    if (extraPoint === 1 && totalScore < 30) {
      finalScore += 1;
    }

    // Módulos con su "total"
    const modulesData = {
      "Visuoespacial/Ejecutivo": {
        diagram: diagramScore,
        cube: cubeScore,
        clock: clockScore,
        total: getVisuoespacialScore(),
      },
      Denominacion: {
        leon: lionScore,
        rinoceronte: rhinoScore,
        camello: camelScore,
        total: getDenominacionScore(),
      },
      "Memoria/Atencion": {
        memory: memoryScore,
        digitsForward: digitsForwardScore,
        digitsBackward: digitsBackwardScore,
        letterTap: letterTapScore,
        serialSubtraction: serialSubtractionScore,
        total: getMemoriaAtencionScore(),
      },
      Lenguaje: {
        sentence1: sentence1Score,
        sentence2: sentence2Score,
        wordsF: wordsFScore,
        total: getLenguajeScore(),
      },
      Abstraccion: {
        similarity1: abstraction1Score,
        similarity2: abstraction2Score,
        total: getAbstraccionScore(),
      },
      RecuerdoDiferido: {
        delayedRecall: delayedRecallScore,
        total: getRecuerdoDiferidoScore(),
      },
      Orientacion: {
        orientation: orientationScore,
        total: getOrientacionScore(),
      },
    };

    const mocaData = {
      patientId: selectedPatient._id,
      patientName: selectedPatient.user?.name || "Paciente Desconocido",
      modulesData,
      totalScore: finalScore,
      hasLessThan12YearsOfEducation: extraPoint === 1,
    };

    try {
      const savedRecord = await createMocaSelf(mocaData).unwrap();
      alert("Resultados guardados exitosamente.");

      try {
        // Actualizar el campo mocaAssigned a false usando la mutación correcta
        await updatePatient({ id: selectedPatient._id, mocaAssigned: false }).unwrap();
        alert("Estado de MOCA actualizado correctamente.");
      } catch (err) {
        console.error(err);
        alert("Error al actualizar el estado de MOCA.");
      }

      navigate(`/moca-final/${savedRecord._id}`);
    } catch (err) {
      console.error("Error al guardar resultados:", err);
      alert("Hubo un error al guardar los resultados. Intenta nuevamente.");
    }
  };

  // == Simular y Guardar ==
  const handleSimulateAndSaveResults = async () => {
    if (!selectedPatient) {
      alert("Paciente no seleccionado.");
      return;
    }

    const simulatedScores = {
      "Visuoespacial/Ejecutivo": {
        diagram: 1,
        cube: 1,
        clock: 3,
      },
      Denominacion: {
        leon: 1,
        rinoceronte: 1,
        camello: 1,
      },
      "Memoria/Atencion": {
        memory: 1,
        digitsForward: 1,
        digitsBackward: 1,
        letterTap: 1,
        serialSubtraction: 3,
      },
      Lenguaje: {
        sentence1: 1,
        sentence2: 1,
        wordsF: 1,
      },
      Abstraccion: {
        similarity1: 1,
        similarity2: 1,
      },
      RecuerdoDiferido: {
        delayedRecall: 5,
      },
      Orientacion: {
        orientation: 6,
      },
    };

    // Calcular total de cada módulo y sumarlos
    let sum = 0;
    Object.keys(simulatedScores).forEach((mod) => {
      const partial = Object.values(simulatedScores[mod]).reduce(
        (acc, val) => acc + val,
        0
      );
      simulatedScores[mod].total = partial;
      sum += partial;
    });

    let finalScore = sum;
    if (extraPoint === 1 && sum < 30) {
      finalScore += 1;
    }

    const mocaData = {
      patientId: selectedPatient._id,
      patientName: selectedPatient.user?.name || "Paciente Desconocido",
      modulesData: simulatedScores,
      totalScore: finalScore,
      hasLessThan12YearsOfEducation: extraPoint === 1,
    };

    try {
      const savedRecord = await createMocaSelf(mocaData).unwrap();
      alert("Resultados simulados guardados exitosamente.");

      try {
        // Actualizar el campo mocaAssigned a false usando la mutación correcta
        await updatePatient({ id: selectedPatient._id, mocaAssigned: false }).unwrap();
        alert("Estado de MOCA actualizado correctamente.");
      } catch (err) {
        console.error(err);
        alert("Error al actualizar el estado de MOCA.");
      }

      navigate(`/moca-final/${savedRecord._id}`);
    } catch (err) {
      console.error("Error al guardar resultados simulados:", err);
      alert("Hubo un error al guardar los resultados simulados. Intenta nuevamente.");
    }
  };

  // == Verificar si todos los campos están respondidos (no null) ==
  const allScores = [
    diagramScore,
    cubeScore,
    clockScore,
    lionScore,
    rhinoScore,
    camelScore,
    memoryScore,
    digitsForwardScore,
    digitsBackwardScore,
    letterTapScore,
    serialSubtractionScore,
    sentence1Score,
    sentence2Score,
    wordsFScore,
    abstraction1Score,
    abstraction2Score,
    delayedRecallScore,
    orientationScore,
  ];
  const isAllAnswered = allScores.every((score) => score !== null);

  return (
    <Container className="moca-start-container">
      <h1 className="moca-title">Evaluación Cognitiva Montreal (MoCA)</h1>
      <p>Pantalla para que el doctor registre los resultados de la prueba MoCA para cada paciente.</p>

      {isPatientsLoading ? (
        <div className="text-center my-5">
          <Spinner animation="border" variant="primary" />
        </div>
      ) : patientsError ? (
        <Alert variant="danger">
          Error al cargar datos del paciente: {patientsError?.data?.message || patientsError.error}
        </Alert>
      ) : !selectedPatient ? (
        <Alert variant="warning">Paciente no encontrado. Revisa el ID.</Alert>
      ) : (
        <>
          <p>
            <strong>Paciente:</strong> {selectedPatient.user?.name || "Paciente sin nombre"}
          </p>

          <div className="instructions my-4">
            <h4>Instrucciones</h4>
            <p>
              El test MoCA está diseñado para evaluar disfunciones cognitivas leves.
              Selecciona el puntaje en cada ítem. 
              Los demás botones del ítem quedarán deshabilitados al elegir uno.
              Puedes deseleccionar un puntaje haciendo clic nuevamente sobre él.
            </p>
          </div>

          {!testStarted ? (
            <div className="text-center">
              <Button variant="primary" onClick={handleStartTest}>
                Iniciar Test MoCA
              </Button>
            </div>
          ) : (
            <>
              {/* EDUCACIÓN */}
              <ListGroup.Item className="education-block">
                <Row>
                  <Col md={8}>
                    <strong>¿El paciente tiene más de 12 años de educación?</strong>
                    <p className="text-muted">No incluyas los años de jardín</p>
                  </Col>
                  <Col md={4} className="d-flex align-items-center">
                    <Form.Check
                      inline
                      type="radio"
                      label="No +1"
                      name="education"
                      onChange={() => handleEducationChange("less")}
                      checked={extraPoint === 1}
                    />
                    <Form.Check
                      inline
                      type="radio"
                      label="Sí 0"
                      name="education"
                      onChange={() => handleEducationChange("more")}
                      checked={extraPoint === 0}
                    />
                  </Col>
                </Row>
              </ListGroup.Item>

              {/* Fila con 2 Columnas */}
              <Row className="mt-4">
                {/* Col 1: Visuoespacial/Ejecutivo */}
                <Col xs={12} sm={6} className="mb-4">
                  <Card className="module-card">
                    <Card.Body>
                      <Card.Title>Visuoespacial/Ejecutivo</Card.Title>
                      <div className="module-score">
                        {getVisuoespacialScore()}/5
                      </div>

                      <ListGroup className="mt-3">
                        {/* Diagrama */}
                        <ListGroup.Item>
                          <p>Diagrama (1 pto)</p>
                          <div className="score-buttons">
                            <Button
                              size="sm"
                              className={`toggle-button ${
                                diagramScore === 1 ? "active" : ""
                              }`}
                              variant={
                                diagramScore === 1
                                  ? "success"
                                  : "outline-success"
                              }
                              onClick={() => handleScoreChange(1, diagramScore, setDiagramScore)}
                            >
                              +1
                            </Button>
                            <Button
                              size="sm"
                              className={`toggle-button ${
                                diagramScore === 0 ? "active" : ""
                              }`}
                              variant={
                                diagramScore === 0
                                  ? "danger"
                                  : "outline-danger"
                              }
                              onClick={() => handleScoreChange(0, diagramScore, setDiagramScore)}
                            >
                              0
                            </Button>
                          </div>
                        </ListGroup.Item>

                        {/* Cubo */}
                        <ListGroup.Item>
                          <p>Cubo (1 pto)</p>
                          <div className="score-buttons">
                            <Button
                              size="sm"
                              className={`toggle-button ${
                                cubeScore === 1 ? "active" : ""
                              }`}
                              variant={
                                cubeScore === 1
                                  ? "success"
                                  : "outline-success"
                              }
                              onClick={() => handleScoreChange(1, cubeScore, setCubeScore)}
                            >
                              +1
                            </Button>
                            <Button
                              size="sm"
                              className={`toggle-button ${
                                cubeScore === 0 ? "active" : ""
                              }`}
                              variant={
                                cubeScore === 0
                                  ? "danger"
                                  : "outline-danger"
                              }
                              onClick={() => handleScoreChange(0, cubeScore, setCubeScore)}
                            >
                              0
                            </Button>
                          </div>
                        </ListGroup.Item>

                        {/* Reloj */}
                        <ListGroup.Item>
                          <p>Reloj (0-3 pts)</p>
                          <div className="score-buttons">
                            {[3, 2, 1, 0].map((val) => (
                              <Button
                                key={val}
                                size="sm"
                                className={`toggle-button ${
                                  clockScore === val ? "active" : ""
                                }`}
                                variant={
                                  clockScore === val
                                    ? "success"
                                    : "outline-success"
                                }
                                onClick={() => handleScoreChange(val, clockScore, setClockScore)}
                              >
                                {val}
                              </Button>
                            ))}
                          </div>
                        </ListGroup.Item>
                      </ListGroup>
                    </Card.Body>
                  </Card>
                </Col>

                {/* Col 2: Denominación */}
                <Col xs={12} sm={6} className="mb-4">
                  <Card className="module-card">
                    <Card.Body>
                      <Card.Title>Denominación</Card.Title>
                      <div className="module-score">
                        {getDenominacionScore()}/3
                      </div>

                      <ListGroup className="mt-3">
                        {/* León */}
                        <ListGroup.Item>
                          <p>León (1 pto)</p>
                          <div className="score-buttons">
                            <Button
                              size="sm"
                              className={`toggle-button ${
                                lionScore === 1 ? "active" : ""
                              }`}
                              variant={
                                lionScore === 1
                                  ? "success"
                                  : "outline-success"
                              }
                              onClick={() => handleScoreChange(1, lionScore, setLionScore)}
                            >
                              +1
                            </Button>
                            <Button
                              size="sm"
                              className={`toggle-button ${
                                lionScore === 0 ? "active" : ""
                              }`}
                              variant={
                                lionScore === 0
                                  ? "danger"
                                  : "outline-danger"
                              }
                              onClick={() => handleScoreChange(0, lionScore, setLionScore)}
                            >
                              0
                            </Button>
                          </div>
                        </ListGroup.Item>

                        {/* Rinoceronte */}
                        <ListGroup.Item>
                          <p>Rinoceronte (1 pto)</p>
                          <div className="score-buttons">
                            <Button
                              size="sm"
                              className={`toggle-button ${
                                rhinoScore === 1 ? "active" : ""
                              }`}
                              variant={
                                rhinoScore === 1
                                  ? "success"
                                  : "outline-success"
                              }
                              onClick={() => handleScoreChange(1, rhinoScore, setRhinoScore)}
                            >
                              +1
                            </Button>
                            <Button
                              size="sm"
                              className={`toggle-button ${
                                rhinoScore === 0 ? "active" : ""
                              }`}
                              variant={
                                rhinoScore === 0
                                  ? "danger"
                                  : "outline-danger"
                              }
                              onClick={() => handleScoreChange(0, rhinoScore, setRhinoScore)}
                            >
                              0
                            </Button>
                          </div>
                        </ListGroup.Item>

                        {/* Camello */}
                        <ListGroup.Item>
                          <p>Camello (1 pto)</p>
                          <div className="score-buttons">
                            <Button
                              size="sm"
                              className={`toggle-button ${
                                camelScore === 1 ? "active" : ""
                              }`}
                              variant={
                                camelScore === 1
                                  ? "success"
                                  : "outline-success"
                              }
                              onClick={() => handleScoreChange(1, camelScore, setCamelScore)}
                            >
                              +1
                            </Button>
                            <Button
                              size="sm"
                              className={`toggle-button ${
                                camelScore === 0 ? "active" : ""
                              }`}
                              variant={
                                camelScore === 0
                                  ? "danger"
                                  : "outline-danger"
                              }
                              onClick={() => handleScoreChange(0, camelScore, setCamelScore)}
                            >
                              0
                            </Button>
                          </div>
                        </ListGroup.Item>
                      </ListGroup>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              {/* Fila 2: Memoria y Atención */}
              <Row className="mt-4">
                {/* Memoria y Atención */}
                <Col xs={12} className="mb-4">
                  <Card className="module-card">
                    <Card.Body>
                      <Card.Title>Memoria y Atención</Card.Title>
                      <div className="module-score">
                        {getMemoriaAtencionScore()}/5
                      </div>

                      <ListGroup className="mt-3">
                        {/* Memoria */}
                        <ListGroup.Item>
                          <p>Memoria (1 pto)</p>
                          <div className="score-buttons">
                            <Button
                              size="sm"
                              className={`toggle-button ${
                                memoryScore === 1 ? "active" : ""
                              }`}
                              variant={
                                memoryScore === 1
                                  ? "success"
                                  : "outline-success"
                              }
                              onClick={() => handleScoreChange(1, memoryScore, setMemoryScore)}
                            >
                              +1
                            </Button>
                            <Button
                              size="sm"
                              className={`toggle-button ${
                                memoryScore === 0 ? "active" : ""
                              }`}
                              variant={
                                memoryScore === 0
                                  ? "danger"
                                  : "outline-danger"
                              }
                              onClick={() => handleScoreChange(0, memoryScore, setMemoryScore)}
                            >
                              0
                            </Button>
                          </div>
                        </ListGroup.Item>

                        {/* Dígitos Directo */}
                        <ListGroup.Item>
                          <p>Dígitos directo (1 pto)</p>
                          <div className="score-buttons">
                            <Button
                              size="sm"
                              className={`toggle-button ${
                                digitsForwardScore === 1 ? "active" : ""
                              }`}
                              variant={
                                digitsForwardScore === 1
                                  ? "success"
                                  : "outline-success"
                              }
                              onClick={() => handleScoreChange(1, digitsForwardScore, setDigitsForwardScore)}
                            >
                              +1
                            </Button>
                            <Button
                              size="sm"
                              className={`toggle-button ${
                                digitsForwardScore === 0 ? "active" : ""
                              }`}
                              variant={
                                digitsForwardScore === 0
                                  ? "danger"
                                  : "outline-danger"
                              }
                              onClick={() => handleScoreChange(0, digitsForwardScore, setDigitsForwardScore)}
                            >
                              0
                            </Button>
                          </div>
                        </ListGroup.Item>

                        {/* Dígitos Inverso */}
                        <ListGroup.Item>
                          <p>Dígitos inverso (1 pto)</p>
                          <div className="score-buttons">
                            <Button
                              size="sm"
                              className={`toggle-button ${
                                digitsBackwardScore === 1 ? "active" : ""
                              }`}
                              variant={
                                digitsBackwardScore === 1
                                  ? "success"
                                  : "outline-success"
                              }
                              onClick={() => handleScoreChange(1, digitsBackwardScore, setDigitsBackwardScore)}
                            >
                              +1
                            </Button>
                            <Button
                              size="sm"
                              className={`toggle-button ${
                                digitsBackwardScore === 0 ? "active" : ""
                              }`}
                              variant={
                                digitsBackwardScore === 0
                                  ? "danger"
                                  : "outline-danger"
                              }
                              onClick={() => handleScoreChange(0, digitsBackwardScore, setDigitsBackwardScore)}
                            >
                              0
                            </Button>
                          </div>
                        </ListGroup.Item>

                        {/* Letra A */}
                        <ListGroup.Item>
                          <p>Letra A (1 pto)</p>
                          <div className="score-buttons">
                            <Button
                              size="sm"
                              className={`toggle-button ${
                                letterTapScore === 1 ? "active" : ""
                              }`}
                              variant={
                                letterTapScore === 1
                                  ? "success"
                                  : "outline-success"
                              }
                              onClick={() => handleScoreChange(1, letterTapScore, setLetterTapScore)}
                            >
                              +1
                            </Button>
                            <Button
                              size="sm"
                              className={`toggle-button ${
                                letterTapScore === 0 ? "active" : ""
                              }`}
                              variant={
                                letterTapScore === 0
                                  ? "danger"
                                  : "outline-danger"
                              }
                              onClick={() => handleScoreChange(0, letterTapScore, setLetterTapScore)}
                            >
                              0
                            </Button>
                          </div>
                        </ListGroup.Item>

                        {/* Sustracción 7s */}
                        <ListGroup.Item>
                          <p>Sustracción 7s (0-3 pts)</p>
                          <div className="score-buttons">
                            {[3, 2, 1, 0].map((val) => (
                              <Button
                                key={val}
                                size="sm"
                                className={`toggle-button ${
                                  serialSubtractionScore === val ? "active" : ""
                                }`}
                                variant={
                                  serialSubtractionScore === val
                                    ? "success"
                                    : "outline-success"
                                }
                                onClick={() => handleScoreChange(val, serialSubtractionScore, setSerialSubtractionScore)}
                              >
                                {val}
                              </Button>
                            ))}
                          </div>
                        </ListGroup.Item>
                      </ListGroup>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              {/* Fila 3: Lenguaje, Abstracción, Recuerdo Diferido, Orientación */}
              <Row className="mt-4">
                {/* Lenguaje */}
                <Col xs={12} sm={6} className="mb-4">
                  <Card className="module-card">
                    <Card.Body>
                      <Card.Title>Lenguaje</Card.Title>
                      <div className="module-score">
                        {getLenguajeScore()}/3
                      </div>

                      <ListGroup className="mt-3">
                        {/* Frase 1 */}
                        <ListGroup.Item>
                          <p>Frase 1 (1 pto)</p>
                          <div className="score-buttons">
                            <Button
                              size="sm"
                              className={`toggle-button ${
                                sentence1Score === 1 ? "active" : ""
                              }`}
                              variant={
                                sentence1Score === 1
                                  ? "success"
                                  : "outline-success"
                              }
                              onClick={() => handleScoreChange(1, sentence1Score, setSentence1Score)}
                            >
                              +1
                            </Button>
                            <Button
                              size="sm"
                              className={`toggle-button ${
                                sentence1Score === 0 ? "active" : ""
                              }`}
                              variant={
                                sentence1Score === 0
                                  ? "danger"
                                  : "outline-danger"
                              }
                              onClick={() => handleScoreChange(0, sentence1Score, setSentence1Score)}
                            >
                              0
                            </Button>
                          </div>
                        </ListGroup.Item>

                        {/* Frase 2 */}
                        <ListGroup.Item>
                          <p>Frase 2 (1 pto)</p>
                          <div className="score-buttons">
                            <Button
                              size="sm"
                              className={`toggle-button ${
                                sentence2Score === 1 ? "active" : ""
                              }`}
                              variant={
                                sentence2Score === 1
                                  ? "success"
                                  : "outline-success"
                              }
                              onClick={() => handleScoreChange(1, sentence2Score, setSentence2Score)}
                            >
                              +1
                            </Button>
                            <Button
                              size="sm"
                              className={`toggle-button ${
                                sentence2Score === 0 ? "active" : ""
                              }`}
                              variant={
                                sentence2Score === 0
                                  ? "danger"
                                  : "outline-danger"
                              }
                              onClick={() => handleScoreChange(0, sentence2Score, setSentence2Score)}
                            >
                              0
                            </Button>
                          </div>
                        </ListGroup.Item>

                        {/* Palabras con F */}
                        <ListGroup.Item>
                          <p>Palabras con F (1 pto)</p>
                          <div className="score-buttons">
                            <Button
                              size="sm"
                              className={`toggle-button ${
                                wordsFScore === 1 ? "active" : ""
                              }`}
                              variant={
                                wordsFScore === 1
                                  ? "success"
                                  : "outline-success"
                              }
                              onClick={() => handleScoreChange(1, wordsFScore, setWordsFScore)}
                            >
                              +1
                            </Button>
                            <Button
                              size="sm"
                              className={`toggle-button ${
                                wordsFScore === 0 ? "active" : ""
                              }`}
                              variant={
                                wordsFScore === 0
                                  ? "danger"
                                  : "outline-danger"
                              }
                              onClick={() => handleScoreChange(0, wordsFScore, setWordsFScore)}
                            >
                              0
                            </Button>
                          </div>
                        </ListGroup.Item>
                      </ListGroup>
                    </Card.Body>
                  </Card>
                </Col>

                {/* Abstracción */}
                <Col xs={12} sm={6} className="mb-4">
                  <Card className="module-card">
                    <Card.Body>
                      <Card.Title>Abstracción</Card.Title>
                      <div className="module-score">
                        {getAbstraccionScore()}/2
                      </div>

                      <ListGroup className="mt-3">
                        {/* Similaridad 1 */}
                        <ListGroup.Item>
                          <p>Tren - Bicicleta (1 pto)</p>
                          <div className="score-buttons">
                            <Button
                              size="sm"
                              className={`toggle-button ${
                                abstraction1Score === 1 ? "active" : ""
                              }`}
                              variant={
                                abstraction1Score === 1
                                  ? "success"
                                  : "outline-success"
                              }
                              onClick={() => handleScoreChange(1, abstraction1Score, setAbstraction1Score)}
                            >
                              +1
                            </Button>
                            <Button
                              size="sm"
                              className={`toggle-button ${
                                abstraction1Score === 0 ? "active" : ""
                              }`}
                              variant={
                                abstraction1Score === 0
                                  ? "danger"
                                  : "outline-danger"
                              }
                              onClick={() => handleScoreChange(0, abstraction1Score, setAbstraction1Score)}
                            >
                              0
                            </Button>
                          </div>
                        </ListGroup.Item>

                        {/* Similaridad 2 */}
                        <ListGroup.Item>
                          <p>Reloj - Regla (1 pto)</p>
                          <div className="score-buttons">
                            <Button
                              size="sm"
                              className={`toggle-button ${
                                abstraction2Score === 1 ? "active" : ""
                              }`}
                              variant={
                                abstraction2Score === 1
                                  ? "success"
                                  : "outline-success"
                              }
                              onClick={() => handleScoreChange(1, abstraction2Score, setAbstraction2Score)}
                            >
                              +1
                            </Button>
                            <Button
                              size="sm"
                              className={`toggle-button ${
                                abstraction2Score === 0 ? "active" : ""
                              }`}
                              variant={
                                abstraction2Score === 0
                                  ? "danger"
                                  : "outline-danger"
                              }
                              onClick={() => handleScoreChange(0, abstraction2Score, setAbstraction2Score)}
                            >
                              0
                            </Button>
                          </div>
                        </ListGroup.Item>
                      </ListGroup>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              {/* Fila 3: Recuerdo Diferido y Orientación */}
              <Row className="mt-4">
                {/* Recuerdo Diferido */}
                <Col xs={12} sm={6} className="mb-4">
                  <Card className="module-card">
                    <Card.Body>
                      <Card.Title>Recuerdo Diferido</Card.Title>
                      <div className="module-score">
                        {getRecuerdoDiferidoScore()}/5
                      </div>

                      <ListGroup className="mt-3">
                        {/* Puntajes 0-5 */}
                        <ListGroup.Item>
                          <p>(0-5 pts)</p>
                          <div className="score-buttons">
                            {[5, 4, 3, 2, 1, 0].map((val) => (
                              <Button
                                key={val}
                                size="sm"
                                className={`toggle-button ${
                                  delayedRecallScore === val ? "active" : ""
                                }`}
                                variant={
                                  delayedRecallScore === val
                                    ? "success"
                                    : "outline-success"
                                }
                                onClick={() => handleScoreChange(val, delayedRecallScore, setDelayedRecallScore)}
                              >
                                {val}
                              </Button>
                            ))}
                          </div>
                        </ListGroup.Item>
                      </ListGroup>
                    </Card.Body>
                  </Card>
                </Col>

                {/* Orientación */}
                <Col xs={12} sm={6} className="mb-4">
                  <Card className="module-card">
                    <Card.Body>
                      <Card.Title>Orientación</Card.Title>
                      <div className="module-score">
                        {getOrientacionScore()}/6
                      </div>

                      <ListGroup className="mt-3">
                        {/* Puntajes 0-6 */}
                        <ListGroup.Item>
                          <p>(0-6 pts)</p>
                          <div className="score-buttons">
                            {[6, 5, 4, 3, 2, 1, 0].map((val) => (
                              <Button
                                key={val}
                                size="sm"
                                className={`toggle-button ${
                                  orientationScore === val ? "active" : ""
                                }`}
                                variant={
                                  orientationScore === val
                                    ? "success"
                                    : "outline-success"
                                }
                                onClick={() => handleScoreChange(val, orientationScore, setOrientationScore)}
                              >
                                {val}
                              </Button>
                            ))}
                          </div>
                        </ListGroup.Item>
                      </ListGroup>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              {/* Fila Final: Puntaje Total y Botones de Guardar */}
              <Row className="mt-4">
                <Col xs={12}>
                  <div className="final-results-container text-center">
                    <h4>
                      Puntaje Total (+{extraPoint} pto educación):{" "}
                      <strong>{totalScore}</strong>
                    </h4>

                    <div className="d-flex flex-column align-items-center mt-4 gap-3">
                      <Button
                        variant="success"
                        onClick={handleSaveResults}
                        size="lg"
                        disabled={isSaving || isUpdatingPatient || !isAllAnswered}
                      >
                        {isSaving || isUpdatingPatient ? (
                          <>
                            <Spinner
                              as="span"
                              animation="border"
                              size="sm"
                              role="status"
                              aria-hidden="true"
                              className="me-2"
                            />
                            Guardando...
                          </>
                        ) : (
                          "Guardar Resultados"
                        )}
                      </Button>

                      <Button
                        variant="secondary"
                        onClick={handleSimulateAndSaveResults}
                        size="lg"
                        disabled={isSaving || isUpdatingPatient}
                      >
                        {isSaving || isUpdatingPatient ? (
                          <>
                            <Spinner
                              as="span"
                              animation="border"
                              size="sm"
                              role="status"
                              aria-hidden="true"
                              className="me-2"
                            />
                            Simulando...
                          </>
                        ) : (
                          "Simular y Guardar Resultados"
                        )}
                      </Button>
                    </div>

                    {/* Mensajes de éxito/error al guardar */}
                    {isSaveSuccess && (
                      <Alert variant="success" className="mt-3 text-center">
                        Resultados guardados exitosamente.
                      </Alert>
                    )}
                    {isSaveError && (
                      <Alert variant="danger" className="mt-3 text-center">
                        {saveError?.data?.message || "Error al guardar resultados."}
                      </Alert>
                    )}

                    {/* Mensajes de éxito/error al actualizar mocaAssigned */}
                    {isUpdateSuccess && (
                      <Alert variant="success" className="mt-3 text-center">
                        Estado de MOCA actualizado correctamente.
                      </Alert>
                    )}
                    {isUpdateError && (
                      <Alert variant="danger" className="mt-3 text-center">
                        {updateError?.data?.message || "Error al actualizar el estado de MOCA."}
                      </Alert>
                    )}
                  </div>
                </Col>
              </Row>
            </>
          )}
        </>
      )}
    </Container>
  );
};

export default MocaStart;
