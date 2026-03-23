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
import { FaCheckCircle, FaHome } from "react-icons/fa";


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
    if (score >= 13) {
      return { text: "Leve", variant: "success" };
    } else if (score >= 7 && score <= 12) {
      return { text: "Moderado", variant: "warning" };
    } else if (score < 7) {
      return { text: "Grave", variant: "danger" };
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
                      <Badge bg={getTotalScoreColor(mocaRecord.totalScore || 0, mocaRecord.totalMaxScore || 30)}>
                        {mocaRecord.totalScore || 0} / {mocaRecord.totalMaxScore || 30}
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
              <button 
                className="cubo-undo-button" 
                onClick={handleBack}
                style={{ padding: '0.8rem 1.5rem', fontSize: '1rem' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                Regresar
              </button>
            </Col>
          </Row>
        </>
      ) : (
        // Vista para el Paciente
        <Row className="justify-content-center align-items-center" style={{ minHeight: '75vh' }}>
          <Col md={10} lg={8} xl={6} className="text-center">
            <div 
              className="p-5"
              style={{
                background: 'white',
                borderRadius: '24px',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.08)',
                border: '1px solid rgba(255,255,255,0.4)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Círculos decorativos de fondo */}
              <div 
                style={{
                  position: 'absolute',
                  top: '-50px',
                  right: '-50px',
                  width: '200px',
                  height: '200px',
                  background: 'linear-gradient(135deg, rgba(74, 222, 128, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%)',
                  borderRadius: '50%',
                  filter: 'blur(30px)',
                  zIndex: 0
                }}
              />
              <div 
                style={{
                  position: 'absolute',
                  bottom: '-50px',
                  left: '-50px',
                  width: '150px',
                  height: '150px',
                  background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)',
                  borderRadius: '50%',
                  filter: 'blur(30px)',
                  zIndex: 0
                }}
              />
              
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div className="mb-4 animate__animated animate__bounceIn">
                  <FaCheckCircle color="#10b981" size={90} style={{ filter: 'drop-shadow(0px 8px 16px rgba(16, 185, 129, 0.4))' }}/>
                </div>
                
                <h1 className="mb-3 fw-bold animate__animated animate__fadeInUp" style={{ color: '#0f172a', fontSize: '2.5rem', letterSpacing: '-0.5px' }}>
                  ¡Evaluación Completada!
                </h1>
                
                <p className="text-muted mb-5 animate__animated animate__fadeInUp" style={{ fontSize: '1.25rem', lineHeight: '1.6', animationDelay: '0.2s', padding: '0 20px' }}>
                  Has finalizado la prueba MoCA con éxito. Tus resultados han sido guardados de manera segura y serán revisados por tu especialista médico. <br/><br/><strong>¡Agradecemos mucho tu esfuerzo!</strong>
                </p>
                
                <button 
                  className="animate__animated animate__fadeInUp"
                  onClick={handleGoHome}
                  style={{
                    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '16px 48px',
                    borderRadius: '50px',
                    fontSize: '1.2rem',
                    fontWeight: '600',
                    boxShadow: '0 10px 20px -5px rgba(37, 99, 235, 0.5)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                    animationDelay: '0.4s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 15px 25px -5px rgba(37, 99, 235, 0.6)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 10px 20px -5px rgba(37, 99, 235, 0.5)';
                  }}
                >
                  <FaHome size={24} />
                  Regresar al Inicio
                </button>
              </div>
            </div>
          </Col>
        </Row>
      )}
    </Container>
  );
};

// Exportar el componente
export default MocaFinalScreen;
