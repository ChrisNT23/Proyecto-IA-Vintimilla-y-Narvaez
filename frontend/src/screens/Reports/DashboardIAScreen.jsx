// src/screens/Reports/DashboardIAScreen.jsx

import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Spinner, Alert, Badge } from 'react-bootstrap';
import { 
    FaUser, FaDownload, FaShareAlt, FaBrain, FaExclamationTriangle, 
    FaChartBar, FaClock, FaHistory, FaCheckCircle, FaTimesCircle 
} from 'react-icons/fa';
import { 
    PieChart, Pie, Cell, ResponsiveContainer, 
    BarChart, Bar, XAxis, YAxis, Tooltip, 
    LineChart, Line, CartesianGrid 
} from 'recharts';
import { useGetMocaSelfByIdQuery, useGetAllMocaSelfsQuery } from '../../slices/mocaSelfApiSlice';
import { useGetPatientByIdQuery } from '../../slices/patientApiSlice';
import { generateIAInsights, calculateDeteriorationRisk } from '../../utils/iaInsights';
import '../../assets/styles/DashboardIAScreen.css';

const DashboardIAScreen = () => {
    const { patientId, id: evalId } = useParams();
    const navigate = useNavigate();

    // 1. Fetch Data
    const { data: mocaHistory } = useGetAllMocaSelfsQuery(patientId);
    
    // Si tenemos evalId (de una evaluación específica), lo usamos. 
    // Si no, buscamos la más reciente del historial.
    const selectedEvalId = evalId || (mocaHistory && mocaHistory.length > 0 
        ? [...mocaHistory].sort((a, b) => new Date(b.testDate) - new Date(a.testDate))[0]._id 
        : null);

    const { data: mocaRecord, isLoading: loadingEval } = useGetMocaSelfByIdQuery(selectedEvalId, {
        skip: !selectedEvalId
    });

    const targetPatientId = patientId || mocaRecord?.patient;
    const { data: patient, isLoading: loadingPatient } = useGetPatientByIdQuery(targetPatientId, {
        skip: !targetPatientId
    });

    // 2. Process Data for Charts
    const cognitiveData = useMemo(() => [
        { name: 'Obtenido', value: mocaRecord?.totalScore || 0 },
        { name: 'Restante', value: 30 - (mocaRecord?.totalScore || 0) }
    ], [mocaRecord]);

    const insights = useMemo(() => generateIAInsights(mocaRecord, mocaHistory), [mocaRecord, mocaHistory]);
    const riskPercentage = useMemo(() => calculateDeteriorationRisk(mocaRecord?.totalScore, mocaHistory), [mocaRecord, mocaHistory]);

    const emotionDistData = useMemo(() => {
        if (!mocaRecord?.emotionData?.derivedVariables?.averageEmotionProbabilities) return [];
        const probs = mocaRecord.emotionData.derivedVariables.averageEmotionProbabilities;
        return Object.entries(probs).map(([name, value]) => ({ 
            name: name.charAt(0).toUpperCase() + name.slice(1), 
            value: Math.round(value * 100) 
        })).sort((a, b) => b.value - a.value);
    }, [mocaRecord]);

    const evolutionData = useMemo(() => {
        if (!mocaHistory) return [];
        return [...mocaHistory]
            .sort((a, b) => new Date(a.testDate) - new Date(b.testDate))
            .map(h => ({
                date: new Date(h.testDate).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }),
                score: h.totalScore
            }));
    }, [mocaHistory]);

    const COLORS = ['#2563eb', '#f1f5f9'];
    const EMOTION_COLORS = {
        'Neutral': '#94a3b8',
        'Happy': '#10b981',
        'Surprise': '#f59e0b',
        'Sad': '#3b82f6',
        'Angry': '#ef4444',
        'Fear': '#8b5cf6',
        'Disgust': '#ec4899'
    };

    if (loadingEval || loadingPatient) return (
        <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh', background: '#f8fafc' }}>
            <Spinner animation="grow" variant="primary" />
        </div>
    );

    if (!mocaRecord) return (
        <Container className="mt-5">
            <Alert variant="info">No se encontró información para esta evaluación.</Alert>
        </Container>
    );

    const age = patient?.birthdate ? Math.floor((new Date() - new Date(patient.birthdate)) / (365.25 * 24 * 60 * 60 * 1000)) : 'N/A';

    return (
        <div className="dashboard-ia-container">
            <header className="dashboard-header">
                <div className="patient-info-summary">
                    <div className="profile-pic-container">
                        <FaUser />
                    </div>
                    <div className="patient-main-info">
                        <h2>Resumen de Evaluación</h2>
                        <div className="patient-meta">
                            <span><strong>ID:</strong> {patient?.user?.cardId || mocaRecord.patient?.cardId || 'No asignado'}</span>
                            <span><strong>Edad:</strong> {age} años</span>
                            <span><strong>Género:</strong> {patient?.gender || 'Masculino'}</span>
                        </div>
                    </div>
                </div>
                <div className="header-actions">
                    <button className="btn-action btn-export"><FaDownload /> Exportar PDF</button>
                    <button className="btn-action btn-share"><FaShareAlt /> Compartir</button>
                </div>
            </header>

            <div className="dashboard-grid">
                {/* Score Cognitivo */}
                <div className="dashboard-card col-score">
                    <h3 className="card-title">Score Cognitivo</h3>
                    <div className="score-content">
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie
                                    data={cognitiveData}
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                    startAngle={90}
                                    endAngle={450}
                                >
                                    <Cell fill="#2563eb" />
                                    <Cell fill="#f1f5f9" />
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -40%)' }}>
                            <div className="score-value">{mocaRecord.totalScore}</div>
                            <div className="score-max">/ 30</div>
                        </div>
                        <div className={`risk-label ${mocaRecord.totalScore >= 26 ? 'bajo' : 'moderado'}`}>
                            Riesgo: {mocaRecord.totalScore >= 26 ? 'Bajo' : 'Moderado'}
                        </div>
                    </div>
                </div>

                {/* Pruebas Visuoespaciales */}
                <div className="dashboard-card col-visuo">
                    <h3 className="card-title">Pruebas Visuoespaciales</h3>
                    <div className="visuo-grid">
                        <div className="visuo-item">
                            <div className="visuo-img-placeholder"><FaBrain /></div>
                            <div className="visuo-info">
                                <h4>Copia del Cubo</h4>
                                <p className="visuo-status">Ejecución correcta.</p>
                                <span className="status-tag correct">Correcto</span>
                            </div>
                        </div>
                        <div className="visuo-item">
                            <div className="visuo-img-placeholder"><FaClock /></div>
                            <div className="visuo-info">
                                <h4>Dibujo del Reloj</h4>
                                <p className="visuo-status">Error: Manecillas incorrectas.</p>
                                <span className="status-tag incorrect">Incorrecto</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Hallazgos IA */}
                <div className="dashboard-card col-findings">
                    <h3 className="card-title"><FaBrain /> Hallazgos IA</h3>
                    <div className="findings-list">
                        {insights.map((insight, idx) => (
                            <div key={idx} className={`finding-alert ${insight.type}`}>
                                <div className="finding-icon">
                                    {insight.type === 'danger' ? <FaExclamationTriangle /> : <FaBrain />}
                                </div>
                                <div className="finding-text">
                                    <h5>{insight.title}</h5>
                                    <p>{insight.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Riesgo de Deterioro */}
                <div className="dashboard-card col-risk">
                    <h3 className="card-title">Riesgo de Deterioro</h3>
                    <div className="risk-analysis-content">
                        <ResponsiveContainer width="100%" height={150}>
                            <PieChart>
                                <Pie
                                    data={[{ value: riskPercentage }, { value: 100 - riskPercentage }]}
                                    innerRadius={50}
                                    outerRadius={70}
                                    startAngle={180}
                                    endAngle={0}
                                    dataKey="value"
                                >
                                    <Cell fill="#3b82f6" />
                                    <Cell fill="#f1f5f9" />
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                        <span className="risk-percentage">{riskPercentage}%</span>
                        <Badge bg="warning" text="dark">MODERADO</Badge>
                        <p className="risk-trend-desc">
                            El nivel de riesgo ha aumentado un 5% en los últimos 3 meses debido a la variabilidad emocional detectada.
                        </p>
                    </div>
                </div>

                {/* Distribución de Emociones */}
                <div className="dashboard-card col-emotions">
                    <h3 className="card-title"><FaChartBar /> Distribución de Emociones</h3>
                    <div className="emotion-distribution">
                        {emotionDistData.length > 0 ? emotionDistData.slice(0, 4).map((item, idx) => (
                            <div key={idx} className="emotion-item">
                                <div className="emotion-label">
                                    <span>{item.name}</span>
                                    <span>{item.value}%</span>
                                </div>
                                <div className="emotion-bar-container">
                                    <div 
                                        className="emotion-bar" 
                                        style={{ 
                                            width: `${item.value}%`, 
                                            backgroundColor: EMOTION_COLORS[item.name] || '#3b82f6' 
                                        }}
                                    ></div>
                                </div>
                            </div>
                        )) : (
                            <div className="text-center text-muted py-4">No hay datos de emociones</div>
                        )}
                    </div>
                </div>

                {/* Timeline Emocional */}
                <div className="dashboard-card col-timeline">
                    <h3 className="card-title"><FaHistory /> Timeline Emocional</h3>
                    <div className="chart-wrapper">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={[
                                { name: 'I', val: 40 },
                                { name: 'M', val: 70 },
                                { name: 'F', val: 50 },
                                { name: 'E', val: 80 }
                            ]}>
                                <Bar dataKey="val" fill="#bfdbfe" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Evolución Puntaje MoCA */}
                <div className="dashboard-card col-evolution">
                    <h3 className="card-title"><FaHistory /> Evolución Puntaje MoCA</h3>
                    <div className="chart-wrapper">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={evolutionData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="date" fontSize={10} axisLine={false} tickLine={false} />
                                <Tooltip />
                                <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6' }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardIAScreen;
