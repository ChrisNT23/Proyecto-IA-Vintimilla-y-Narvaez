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

  // Agrupar resultados por módulo (debe ir antes de los retornos tempranos)
  const groupedResults = React.useMemo(() => {
    if (!mocaRecord || !Array.isArray(mocaRecord.consolidatedResults)) return {};
    
    return mocaRecord.consolidatedResults.reduce((acc, result) => {
      const { module } = result;
      if (!acc[module]) {
        acc[module] = [];
      }
      acc[module].push(result);
      return acc;
    }, {});
  }, [mocaRecord]);

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

  // Mapeo omitido. Se usará consolidatedResults directamente en la medida de lo posible.
  // Sin embargo, para mantener el gráfico y la estructura de la UI lo más parecido posible,
  // agruparemos los resultados consolidados por módulo.

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

  // Función para renderizar detalles de cada módulo en el Accordion usando consolidatedResults
  const renderModuleDetails = (moduleName, results) => {
    if (!results || results.length === 0) return null;

    // Calcular totales del módulo
    const moduleTotalScore = results.reduce((sum, r) => sum + (r.score || 0), 0);
    const moduleMaxScore = results.reduce((sum, r) => sum + (r.maxScore || 1), 0);

    const pieData = [
      { name: "Obtenido", value: moduleTotalScore },
      { name: "Restante", value: moduleMaxScore - moduleTotalScore },
    ];

    const showPieChart = moduleMaxScore > 0;

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
                  </tr>
                </thead>
                <tbody>
                  {results.map((result, idx) => {
                    const scoreColor = getScoreColor(result.score, result.maxScore);
                    return (
                      <tr key={idx}>
                        <td>{result.subtest}</td>
                        <td>
                          <Badge bg={scoreColor}>
                            {result.score} / {result.maxScore}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                  <tr>
                    <td><strong>Total</strong></td>
                    <td>
                      <Badge bg="primary">
                        {moduleTotalScore} / {moduleMaxScore}
                      </Badge>
                    </td>
                  </tr>
                </tbody>
              </Table>
            </Col>
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
                  {Object.entries(groupedResults).map(([moduleName, results], index) => {
                    const moduleTotalScore = results.reduce((sum, r) => sum + (r.score || 0), 0);
                    const moduleMaxScore = results.reduce((sum, r) => sum + (r.maxScore || 1), 0);
                    const scoreColor = getTotalScoreColor(moduleTotalScore, moduleMaxScore);

                    return (
                      <tr key={index}>
                        <td>{capitalizeFirstLetter(moduleName)}</td>
                        <td>
                          <Badge bg={scoreColor}>
                            {moduleTotalScore} / {moduleMaxScore}
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
                        {mocaRecord.totalScore || 0} / 30
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
                {mocaRecord.consolidatedResults && Array.isArray(mocaRecord.consolidatedResults) ? (
                  Object.entries(groupedResults).map(([moduleName, results], index) => (
                    renderModuleDetails(moduleName, results)
                  ))
                ) : (
                  <Alert variant="warning">
                    No hay resultados detallados disponibles para esta evaluación.
                  </Alert>
                )}
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
