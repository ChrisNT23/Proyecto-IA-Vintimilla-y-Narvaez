// src/screens/MOCAmodules/MocaFinalScreen.jsx 

import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  Button, 
  Container, 
  Row, 
  Col, 
  Table, 
  Alert, 
  Spinner, 
  Accordion, 
  Badge 
} from "react-bootstrap";
import { useSelector } from "react-redux";
import { useGetMocaSelfByIdQuery } from "../../slices/mocaSelfApiSlice"; // Asegúrate de que la ruta sea correcta
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

// Colores para los gráficos de pastel y badges
const COLORS = ['#FF4C4C', '#FFC107', '#28A745']; // Rojo, Amarillo, Verde

const MocaFinalScreen = () => {
  const { id } = useParams(); // ID del registro MoCA Self
  const navigate = useNavigate();

  // Hook para obtener los datos del registro MoCA Self por ID
  const { data: mocaRecord, isLoading, isError, error } = useGetMocaSelfByIdQuery(id);

  // Obtener información del usuario para determinar si es admin
  const userInfo = useSelector((state) => state.auth.userInfo);
  const isAdmin = userInfo?.isAdmin || false;

  // Función para regresar a la lista de pacientes o al dashboard
  const handleBack = () => {
    navigate("/moca"); // Ajusta la ruta según tu aplicación
  };

  // Función para ir al inicio del paciente
  const handleGoHome = () => {
    navigate("/"); // Ajusta la ruta según tu aplicación
  };

  // Manejo de estados nulos o indefinidos en mocaRecord
  if (isLoading) {
    return (
      <Container className="my-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Cargando...</span>
        </Spinner>
      </Container>
    );
  }

  if (isError) {
    return (
      <Container className="my-5">
        <Alert variant="danger">
          {error?.data?.error || "Hubo un error al obtener los resultados."}
        </Alert>
        <Button variant="secondary" onClick={handleBack}>
          Regresar
        </Button>
      </Container>
    );
  }

  if (!mocaRecord || !mocaRecord.modulesData) {
    return (
      <Container className="my-5">
        <Alert variant="warning">
          No se encontraron datos del registro MoCA.
        </Alert>
        <Button variant="secondary" onClick={handleBack}>
          Regresar
        </Button>
      </Container>
    );
  }

  // Mapeo de módulos y actividades con nombres descriptivos y puntajes máximos
  const moduleActivityMapping = {
    "Visuoespacial/Ejecutivo": {
      diagram: { displayName: "Diagrama", maxScore: 1 },
      cube: { displayName: "Cubo", maxScore: 1 },
      clock: { displayName: "Reloj", maxScore: 3 },
    },
    "Denominacion": {
      leon: { displayName: "León", maxScore: 1 },
      rinoceronte: { displayName: "Rinoceronte", maxScore: 1 },
      camello: { displayName: "Camello", maxScore: 1 },
    },
    "Memoria/Atencion": {
      memory: { displayName: "Memoria", maxScore: 1 },
      digitsForward: { displayName: "Dígitos Directo", maxScore: 1 },
      digitsBackward: { displayName: "Dígitos Inverso", maxScore: 1 },
      letterTap: { displayName: "Letra A", maxScore: 1 },
      serialSubtraction: { displayName: "Sustracción 7s", maxScore: 3 },
    },
    "Lenguaje": {
      sentence1: { displayName: "Frase 1", maxScore: 1 },
      sentence2: { displayName: "Frase 2", maxScore: 1 },
      wordsF: { displayName: "Palabras con F", maxScore: 1 },
    },
    "Abstraccion": {
      similarity1: { displayName: "Tren - Bicicleta", maxScore: 1 },
      similarity2: { displayName: "Reloj - Regla", maxScore: 1 },
    },
    "RecuerdoDiferido": {
      delayedRecall: { displayName: "Recuerdo Diferido", maxScore: 5 },
    },
    "Orientacion": {
      orientation: { displayName: "Orientación", maxScore: 6 },
    },
  };

  // Función para capitalizar la primera letra
  const capitalizeFirstLetter = (string) => {
    if (!string) return "";
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  // Función para determinar el color del puntaje
  const getScoreColor = (obtained, max) => {
    if (max >= 3) {
      if (obtained <= 1) return "danger";      // Rojo
      if (obtained === 2) return "warning";    // Amarillo
      return "success";                         // Verde
    } else if (max === 1) {
      return obtained === 1 ? "success" : "danger";
    } else if (max === 2) {
      if (obtained <= 0) return "danger";
      if (obtained === 1) return "warning";
      return "success";
    }
    return "secondary";
  };

  // Función para determinar el color del puntaje total por módulo
  const getTotalScoreColor = (obtained, max) => {
    if (max === 0) return "secondary";
    const percentage = (obtained / max) * 100;
    if (percentage >= 80) return "success";    // Verde
    if (percentage >= 50) return "warning";    // Amarillo
    return "danger";                            // Rojo
  };

  // Función para formatear la respuesta adecuadamente
  const formatResponse = (response) => {
    if (Array.isArray(response)) {
      // Si es un arreglo, renderizar una lista
      return (
        <ul>
          {response.map((item, index) => (
            <li key={index}>
              {typeof item === "object" && item !== null 
                ? Object.entries(item).map(([key, val], idx) => (
                    <span key={idx}>
                      {capitalizeFirstLetter(key)}: {val}
                      <br />
                    </span>
                  ))
                : item}
            </li>
          ))}
        </ul>
      );
    } else if (typeof response === "object" && response !== null) {
      // Si es un objeto, renderizar una tabla anidada o una lista de pares clave-valor
      return (
        <Table striped bordered hover size="sm">
          <tbody>
            {Object.entries(response).map(([key, value], index) => (
              <tr key={index}>
                <td><strong>{capitalizeFirstLetter(key)}</strong></td>
                <td>
                  {Array.isArray(value)
                    ? formatResponse(value)
                    : typeof value === "object" && value !== null
                    ? formatResponse(value)
                    : value !== null && value !== undefined
                    ? value.toString()
                    : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      );
    } else {
      // Si es un valor primitivo, renderizarlo directamente
      return response !== null && response !== undefined ? response.toString() : "-";
    }
  };

  // Función para renderizar detalles de cada módulo en el Accordion
  const renderModuleDetails = (moduleName, data) => {
    const activities = moduleActivityMapping[moduleName];

    if (!activities) {
      // Si no hay actividades para este módulo, mostrar tabla con puntajes de 0 y sin gráfico
      return (
        <Accordion.Item eventKey={moduleName} key={moduleName}>
          <Accordion.Header>{capitalizeFirstLetter(moduleName)}</Accordion.Header>
          <Accordion.Body>
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>Actividad</th>
                  <th>Puntaje</th>
                  <th>Respuesta</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>-</td>
                  <td>
                    <Badge bg="danger">
                      0 / 0
                    </Badge>
                  </td>
                  <td>-</td>
                </tr>
              </tbody>
            </Table>
            {/* No se muestra el gráfico de pastel */}
          </Accordion.Body>
        </Accordion.Item>
      );
    }

    // Preparar datos para el gráfico de pastel
    let obtainedTotal = 0;
    let maxTotal = 0;

    Object.entries(activities).forEach(([key, info]) => {
      const activityData = data[key];
      if (activityData !== undefined && activityData !== null) {
        if (typeof activityData === "number") {
          obtainedTotal += activityData;
        } else if (typeof activityData === "object") {
          obtainedTotal += activityData.activityScore || 0;
        }
      }
      maxTotal += info.maxScore;
    });

    const pieData = [
      { name: "Obtenido", value: obtainedTotal },
      { name: "Restante", value: maxTotal - obtainedTotal },
    ];

    // Verificar si hay actividades para mostrar el gráfico
    const showPieChart = maxTotal > 0;

    return (
      <Accordion.Item eventKey={moduleName} key={moduleName}>
        <Accordion.Header>{capitalizeFirstLetter(moduleName)}</Accordion.Header>
        <Accordion.Body>
          <Row>
            <Col md={8}>
              <Table striped bordered hover responsive>
                <thead>
                  <tr>
                    <th>Actividad</th>
                    <th>Puntaje</th>
                    <th>Respuesta</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(activities).map(([activityKey, info], index) => {
                    const { displayName, maxScore } = info;
                    const activityData = data[activityKey];

                    let obtainedScore = "-";
                    let response = "-";

                    if (activityData !== undefined && activityData !== null) {
                      if (typeof activityData === "number") {
                        obtainedScore = activityData;
                      } else if (typeof activityData === "object") {
                        if ("activityScore" in activityData) {
                          obtainedScore = activityData.activityScore !== null && activityData.activityScore !== undefined
                            ? activityData.activityScore
                            : "-";
                        } else if ("score" in activityData) {
                          obtainedScore = activityData.score !== null && activityData.score !== undefined
                            ? activityData.score
                            : "-";
                        }
                      }

                      // Extraer respuestas según estructura
                      if (activityData && typeof activityData === "object") {
                        if ("phraseAnswers" in activityData && Array.isArray(activityData.phraseAnswers)) {
                          response = (
                            <ul>
                              {activityData.phraseAnswers.map((ans, idx) => (
                                <li key={idx}>
                                  {ans.phraseIndex !== undefined ? `Frase ${ans.phraseIndex + 1}: ` : ""}
                                  {ans.response}
                                </li>
                              ))}
                            </ul>
                          );
                        } else if ("words" in activityData && Array.isArray(activityData.words)) {
                          response = activityData.words.length > 0 ? activityData.words.join(", ") : "-";
                        } else if ("pairAnswers" in activityData) {
                          if (Array.isArray(activityData.pairAnswers)) {
                            response = (
                              <ul>
                                {activityData.pairAnswers.map((ans, idx) => (
                                  <li key={idx}>
                                    {ans.pairIndex !== undefined ? `Pares ${ans.pairIndex + 1}: ` : ""}
                                    {ans.input} {ans.correct !== undefined ? (ans.correct ? "✓" : "✗") : ""}
                                  </li>
                                ))}
                              </ul>
                            );
                          } else if (typeof activityData.pairAnswers === "object" && activityData.pairAnswers !== null) {
                            response = formatResponse(activityData.pairAnswers);
                          }
                        } else if ("responses" in activityData && Array.isArray(activityData.responses)) {
                          response = (
                            <ul>
                              {activityData.responses.map((resp, idx) => (
                                <li key={idx}>{resp}</li>
                              ))}
                            </ul>
                          );
                        } else if ("multipleChoiceAnswers" in activityData && typeof activityData.multipleChoiceAnswers === "object") {
                          response = (
                            <ul>
                              {Object.entries(activityData.multipleChoiceAnswers).map(([key, val], idx) => (
                                <li key={idx}>{`${capitalizeFirstLetter(key)}: ${val}`}</li>
                              ))}
                            </ul>
                          );
                        } else if ("date" in activityData && typeof activityData.date === "object") {
                          const { day, month, year } = activityData.date;
                          response = `${day}/${month}/${year}`;
                        } else if ("spontaneousAnswers" in activityData && Array.isArray(activityData.spontaneousAnswers)) {
                          response = (
                            <ul>
                              {activityData.spontaneousAnswers.length > 0 
                                ? activityData.spontaneousAnswers.map((ans, idx) => (
                                    <li key={idx}>{ans}</li>
                                  )) 
                                : "-"}
                            </ul>
                          );
                        } else {
                          response = formatResponse(activityData);
                        }
                      }
                    }

                    // Determinar el color del puntaje
                    const scoreColor = obtainedScore !== "-" ? getScoreColor(obtainedScore, maxScore) : "secondary";

                    return (
                      <tr key={activityKey}>
                        <td>{displayName}</td>
                        <td>
                          <Badge bg={scoreColor}>
                            {obtainedScore} / {maxScore}
                          </Badge>
                        </td>
                        <td>{response}</td>
                      </tr>
                    );
                  })}
                  {/* Mostrar la fila de total dentro del Accordion */}
                  {("total" in data || "totalScore" in data || "spontaneousScore" in data) && (
                    <tr>
                      <td><strong>Total</strong></td>
                      <td>
                        <Badge bg="primary">
                          {data.total !== undefined
                            ? data.total
                            : data.totalScore !== undefined
                            ? data.totalScore
                            : data.spontaneousScore !== undefined
                            ? data.spontaneousScore
                            : "-"} / {activities ? Object.values(activities).reduce((acc, curr) => acc + curr.maxScore, 0) : 0}
                        </Badge>
                      </td>
                      <td></td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </Col>
            {/* Mostrar gráfico solo si hay actividades */}
            {showPieChart && (
              <Col md={4} className="text-center">
                <PieChart width={200} height={200}>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    fill="#8884d8"
                    label
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </Col>
            )}
          </Row>
        </Accordion.Body>
      </Accordion.Item>
    );
  };

  // Función para interpretar el puntaje total
  const interpretTotalScore = (score) => {
    if (score >= 26) {
      return { text: "Normal", variant: "success" };
    } else if (score >= 18 && score <= 25) {
      return { text: "Deterioro Cognitivo Leve", variant: "warning" };
    } else if (score >= 10 && score <= 17) {
      return { text: "Deterioro Cognitivo Moderado", variant: "danger" };
    } else if (score < 10) {
      return { text: "Deterioro Cognitivo Severo", variant: "dark" };
    } else {
      return { text: "Puntaje Indeterminado", variant: "secondary" };
    }
  };

  // Sección de Preguntas Frecuentes
  const FAQSection = () => (
    <Container className="my-5">
      <h3>Preguntas Frecuentes</h3>
      <Accordion defaultActiveKey="0">
        <Accordion.Item eventKey="0">
          <Accordion.Header>¿Cuál es un puntaje normal en el MoCA?</Accordion.Header>
          <Accordion.Body>
            El puntaje de corte para un MoCA normal es 26. Puntajes de 25 y por debajo pueden indicar deterioro cognitivo leve.
          </Accordion.Body>
        </Accordion.Item>
        <Accordion.Item eventKey="1">
          <Accordion.Header>¿Qué tan preciso es el MoCA?</Accordion.Header>
          <Accordion.Body>
            El MoCA puede detectar mejor el deterioro cognitivo leve en comparación con el antiguo test MMSE. Sin embargo, puede no ser tan efectivo para diagnosticar deterioro cognitivo severo.
          </Accordion.Body>
        </Accordion.Item>
        <Accordion.Item eventKey="2">
          <Accordion.Header>¿Cómo afecta el nivel educativo al puntaje del MoCA?</Accordion.Header>
          <Accordion.Body>
            El nivel educativo puede influir en el puntaje del MoCA. Por eso, se asigna un punto adicional si el paciente tiene 12 años de educación o menos.
          </Accordion.Body>
        </Accordion.Item>
        <Accordion.Item eventKey="3">
          <Accordion.Header>¿Con qué frecuencia se actualiza el MoCA?</Accordion.Header>
          <Accordion.Body>
            Los investigadores actualizan el MoCA regularmente para mejorar su precisión y relevancia en la evaluación cognitiva.
          </Accordion.Body>
        </Accordion.Item>
      </Accordion>
    </Container>
  );

  return (
    <Container className="my-5">
      {isAdmin ? (
        <>
          <h2 className="text-center mb-4">Resultados Finales del MoCA Self</h2>
          
          {/* Tabla Resumen de Puntajes Totales */}
          <Row className="mb-4">
            <Col>
              <h4>Puntajes Totales por Módulo</h4>
              <Table striped bordered hover responsive>
                <thead>
                  <tr>
                    <th>Módulo</th>
                    <th>Puntaje Total</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(mocaRecord.modulesData).map(([moduleName, data], index) => {
                    const activities = moduleActivityMapping[moduleName];
                    if (!activities) return null; // Ignorar módulos sin mapeo

                    // Calcular puntaje máximo por módulo
                    const maxTotal = Object.values(activities).reduce((acc, curr) => acc + curr.maxScore, 0);

                    // Obtener puntaje obtenido
                    const obtainedTotal = data.total !== undefined ? data.total : 
                                          data.totalScore !== undefined ? data.totalScore : 
                                          data.spontaneousScore !== undefined ? data.spontaneousScore : 0;

                    // Determinar el color del puntaje total
                    const scoreColor = getTotalScoreColor(obtainedTotal, maxTotal);

                    return (
                      <tr key={index}>
                        <td>{capitalizeFirstLetter(moduleName)}</td>
                        <td>
                          <Badge bg={scoreColor}>
                            {obtainedTotal} / {maxTotal}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                  {/* Fila de Puntaje Total General */}
                  <tr>
                    <td><strong>Puntaje Total</strong></td>
                    <td>
                      <Badge bg={getTotalScoreColor(mocaRecord.totalScore || 0, 30)}>
                        {mocaRecord.totalScore || 0} / 32
                      </Badge>
                    </td>
                  </tr>
                </tbody>
              </Table>
            </Col>
          </Row>

          {/* Interpretación del Puntaje Total */}
          <Row className="mb-4">
            <Col>
              <h4>Interpretación del Puntaje Total</h4>
              <Alert variant={interpretTotalScore(mocaRecord.totalScore).variant}>
                {interpretTotalScore(mocaRecord.totalScore).text}
              </Alert>
            </Col>
          </Row>

          {/* Detalles por Módulo usando Accordion */}
          <Row className="mb-4">
            <Col>
              <h4>Detalles por Módulo</h4>
              <Accordion defaultActiveKey="0">
                {Object.entries(mocaRecord.modulesData).map(([moduleName, data], index) => (
                  renderModuleDetails(moduleName, data)
                ))}
              </Accordion>
            </Col>
          </Row>

          {/* Sección de Preguntas Frecuentes */}
          <FAQSection />

          {/* Botón para regresar */}
          <Row className="mt-4">
            <Col className="d-flex justify-content-end">
              <Button variant="secondary" onClick={handleBack}>
                Regresar
              </Button>
            </Col>
          </Row>
        </>
      ) : (
        // Vista para el Paciente
        <Row className="justify-content-center">
          <Col md={8} className="text-center">
            <h2 className="mb-4">Prueba MoCA Completada</h2>
            <p>Has completado la evaluación MoCA. Puedes regresar al inicio.</p>
            <Button variant="primary" onClick={handleGoHome}>
              Ir al Inicio
            </Button>
          </Col>
        </Row>
      )}
    </Container>
  );
};

// Exportar el componente
export default MocaFinalScreen;
