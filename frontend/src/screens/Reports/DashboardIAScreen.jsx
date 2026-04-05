// src/screens/Reports/DashboardIAScreen.jsx

import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Spinner, Alert, Badge } from 'react-bootstrap';
import { Box, Grid } from '@mui/material';
import {
    FaUser, FaDownload, FaShareAlt, FaBrain, FaExclamationTriangle,
    FaChartBar, FaClock, FaHistory, FaCheckCircle, FaTimesCircle,
    FaHeartbeat, FaListUl, FaEye, FaMicrophone, FaSave, FaCube
} from 'react-icons/fa';
import {
    PieChart, Pie, Cell, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, Tooltip,
    LineChart, Line, CartesianGrid,
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { useGetMocaSelfByIdQuery, useGetAllMocaSelfsQuery } from '../../slices/mocaSelfApiSlice';
import { useGetPatientByIdQuery } from '../../slices/patientApiSlice';
import { useGetMultimodalAnalysisMutation } from '../../slices/multimodalApiSlice';
import { generateIAInsights, calculateDeteriorationRisk } from '../../utils/iaInsights';
import MultimodalInsightsCard from '../../components/MultimodalInsightsCard';
import SynthesisTextPanel from '../../components/SynthesisTextPanel';
import '../../assets/styles/DashboardIAScreen.css';

const DashboardIAScreen = () => {
    const { patientId, id: evalId } = useParams();
    const navigate = useNavigate();
    const section1Ref = React.useRef(null);
    const section2Ref = React.useRef(null);
    const [findingPage, setFindingPage] = useState(0);
    const [isExporting, setIsExporting] = useState(false);
    const [multimodalData, setMultimodalData] = useState(null);
    const [isPredictiveMode, setIsPredictiveMode] = useState(false);
    const FINDINGS_PER_PAGE = 3;

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

    const [getMultimodalAnalysis, { isLoading: loadingMultimodal }] = useGetMultimodalAnalysisMutation();

    const targetPatientId = patientId || (mocaRecord?.patient?._id || mocaRecord?.patient);
    const { data: patient, isLoading: loadingPatient } = useGetPatientByIdQuery(targetPatientId, {
        skip: !targetPatientId
    });

    // 1.1 Fetch Multimodal Analysis when mocaRecord is ready
    React.useEffect(() => {
        if (mocaRecord) {
            const fetchMultimodal = async () => {
                const payload = {
                    moca: {
                        total_score: mocaRecord.totalScore,
                        domain_scores: mocaRecord.domainScores || {
                            visuoespacial: mocaRecord.modulesData?.Visuoespacial?.totalScore || 0,
                            atencion: mocaRecord.modulesData?.Atencion?.totalScore || 0
                        },
                        deterioro_label: mocaRecord.totalScore >= 13 ? 'Leve' : mocaRecord.totalScore >= 7 ? 'Moderado' : 'Grave'
                    },
                    emotions: {
                        distribution: mocaRecord.emotionData?.derivedVariables?.averageEmotionProbabilities || {},
                        volatility: mocaRecord.emotionData?.derivedVariables?.emotionalVolatility || 0,
                        dominant_emotion: (mocaRecord.emotionData?.derivedVariables?.dominantEmotion || 'neutral').toLowerCase(),
                        stress_index: mocaRecord.emotionData?.derivedVariables?.stressIndex || 0.5
                    },
                    clock: {
                        score: mocaRecord.modulesData?.Visuoespacial?.clock || 0,
                        detail: mocaRecord.modulesData?.Visuoespacial?.clockDetail || {}
                    },
                    cube: {
                        score: mocaRecord.modulesData?.Visuoespacial?.cube || 0
                    },
                    history: {
                        score_trend: mocaHistory && mocaHistory.length > 1 ? 'estable' : 'desconocido'
                    }
                };

                try {
                    const result = await getMultimodalAnalysis({ 
                        data: payload, 
                        mode: isPredictiveMode ? 'predictive' : 'rules' 
                    }).unwrap();
                    setMultimodalData(result);
                } catch (err) {
                    console.error("Error fetching multimodal analysis:", err);
                }
            };
            fetchMultimodal();
        }
    }, [mocaRecord, isPredictiveMode, getMultimodalAnalysis, mocaHistory]);

    // 2. Process Data for Charts
    const cognitiveData = useMemo(() => {
        const total = mocaRecord?.totalScore || 0;
        const max = mocaRecord?.totalMaxScore || 30;
        return [
            { name: 'Obtenido', value: total },
            { name: 'Restante', value: Math.max(0, max - total) }
        ];
    }, [mocaRecord]);

    const insights = useMemo(() => generateIAInsights(mocaRecord, mocaHistory), [mocaRecord, mocaHistory]);
    const riskPercentage = useMemo(() => calculateDeteriorationRisk(mocaRecord?.totalScore, mocaHistory), [mocaRecord, mocaHistory]);

    const emotionDistData = useMemo(() => {
        let probs = mocaRecord?.emotionData?.derivedVariables?.averageEmotionProbabilities;

        // Fallback: Si no hay variables calculadas, intentar calcular desde capturas
        if ((!probs || Object.keys(probs).length === 0) && mocaRecord?.emotionData?.captures?.length > 0) {
            const counts = {};
            const sums = {};
            mocaRecord.emotionData.captures.forEach(cap => {
                const emotion = (cap.emotion || '').toLowerCase();
                counts[emotion] = (counts[emotion] || 0) + 1;
                sums[emotion] = (sums[emotion] || 0) + (cap.confidence / 100);
            });
            probs = {};
            Object.keys(sums).forEach(emotion => {
                probs[emotion] = sums[emotion] / counts[emotion];
            });
        }

        if (!probs || Object.keys(probs).length === 0) return [];

        return Object.entries(probs).map(([name, value]) => ({
            name: name.charAt(0).toUpperCase() + name.slice(1),
            value: parseFloat((value * 100).toFixed(1))
        })).sort((a, b) => b.value - a.value);
    }, [mocaRecord]);

    // Calcular Biomarcadores con Fallback
    const clinicalIndices = useMemo(() => {
        const derived = mocaRecord?.emotionData?.derivedVariables || {};
        const captures = mocaRecord?.emotionData?.captures || [];

        const getIndex = (key, fallbackFn) => {
            if (derived[key] !== undefined && derived[key] !== null) return derived[key];
            if (captures.length === 0) return 0;
            return fallbackFn(captures);
        };

        return {
            stress: getIndex('stressIndex', (caps) => {
                const stressEmotions = ['angry', 'fear', 'sad'];
                const stressCount = caps.filter(c => stressEmotions.includes(c.emotion?.toLowerCase())).length;
                return stressCount / caps.length;
            }),
            anxiety: getIndex('anxietyIndex', (caps) => {
                const anxietyEmotions = ['fear', 'surprise'];
                const anxietyCount = caps.filter(c => anxietyEmotions.includes(c.emotion?.toLowerCase())).length;
                return anxietyCount / caps.length;
            }),
            consistency: getIndex('temporalConsistency', (caps) => {
                if (caps.length < 2) return 1;
                let transitions = 0;
                for (let i = 1; i < caps.length; i++) {
                    if (caps[i].emotion !== caps[i - 1].emotion) transitions++;
                }
                return 1 - (transitions / (caps.length - 1));
            })
        };
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

    const handleExportPDF = async () => {
        if (!section1Ref.current || !section2Ref.current) return;

        setIsExporting(true);
        try {
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();

            // Función auxiliar para capturar y añadir sección
            const captureSection = async (element, pageNum) => {
                const canvas = await html2canvas(element, {
                    scale: 2,
                    useCORS: true,
                    logging: false,
                    windowWidth: 1200
                });

                if (pageNum > 1) pdf.addPage();
                const imgData = canvas.toDataURL('image/png');
                const canvasWidthInPdf = pdfWidth;
                const canvasHeightInPdf = (canvas.height * canvasWidthInPdf) / canvas.width;

                // Si la sección es más alta que la página, se escala para entrar
                const finalHeight = Math.min(canvasHeightInPdf, pdfHeight - 10);
                pdf.addImage(imgData, 'PNG', 0, 0, canvasWidthInPdf, finalHeight);
            };

            // Capturar Parte 1 (General)
            await captureSection(section1Ref.current, 1);

            // Capturar Parte 2 (Los últimos 3 gráficos)
            await captureSection(section2Ref.current, 2);

            pdf.save(`Reporte_IA_${patient?.user?.name || 'Moca'}_${new Date().toLocaleDateString()}.pdf`);
        } catch (error) {
            console.error("Error exportando PDF:", error);
            alert("Hubo un error al generar el PDF. Por favor intenta de nuevo.");
        } finally {
            setIsExporting(false);
        }
    };

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
        <div className={`dashboard-ia-container ${isExporting ? 'exporting-mode' : ''}`}>
            <div ref={section1Ref} className="pdf-page-section">
                <header className="dashboard-header">
                    <div className="patient-info-summary">
                        <div className="profile-pic-container">
                            <FaUser />
                        </div>
                        <div className="patient-main-info">
                            <h2>Resumen de Evaluación</h2>
                            <div className="patient-meta">
                                <span><strong>ID Paciente:</strong> {targetPatientId}</span>
                                <span><strong>Cédula:</strong> {patient?.user?.cardId || mocaRecord.patient?.cardId || 'No asignada'}</span>
                                <span><strong>Edad:</strong> {age} años</span>
                                <span><strong>Género:</strong> {patient?.gender || 'Masculino'}</span>
                            </div>
                        </div>
                    </div>
                    <div className="header-actions">
                        <button
                            className="btn-action btn-export"
                            onClick={handleExportPDF}
                            disabled={isExporting}
                        >
                            {isExporting ? <Spinner size="sm" /> : <FaDownload />}
                            {isExporting ? ' Generando...' : ' Exportar PDF'}
                        </button>
                        <button className="btn-action btn-share"><FaShareAlt /> Compartir</button>
                    </div>
                </header>

                <div className="dashboard-grid">
                    {/* Score Cognitivo */}
                    <div className="dashboard-card col-score">
                        <h3 className="card-title">Score Cognitivo</h3>
                        <div className="score-content">
                            <ResponsiveContainer width="100%" height={220}>
                                <PieChart>
                                    <defs>
                                        <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                                            <stop offset="100%" stopColor="#2563eb" stopOpacity={1} />
                                        </linearGradient>
                                        <filter id="shadow" height="130%">
                                            <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
                                            <feOffset dx="0" dy="2" result="offsetblur" />
                                            <feComponentTransfer>
                                                <feFuncA type="linear" slope="0.3" />
                                            </feComponentTransfer>
                                            <feMerge>
                                                <feMergeNode />
                                                <feMergeNode in="SourceGraphic" />
                                            </feMerge>
                                        </filter>
                                    </defs>
                                    <Pie
                                        data={cognitiveData}
                                        innerRadius={70}
                                        outerRadius={90}
                                        paddingAngle={0}
                                        dataKey="value"
                                        startAngle={225}
                                        endAngle={-45}
                                        stroke="none"
                                        cornerRadius={10}
                                    >
                                        <Cell fill="url(#scoreGradient)" filter="url(#shadow)" />
                                        <Cell fill="#f1f5f9" />
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="score-center-info">
                                <span className="score-value">{mocaRecord.totalScore}</span>
                                <div className="score-separator"></div>
                                <span className="score-max">{mocaRecord.totalMaxScore || 30}</span>
                            </div>
                            <div className={`risk-label ${mocaRecord.totalScore >= 13 ? 'bajo' : mocaRecord.totalScore >= 7 ? 'moderado' : 'alto'}`}>
                                Riesgo: {mocaRecord.totalScore >= 13 ? 'Leve' : mocaRecord.totalScore >= 7 ? 'Moderado' : 'Grave'}
                            </div>
                        </div>
                    </div>

                    {/* Pruebas Visuoespaciales */}
                    <div className="dashboard-card col-visuo">
                        <h3 className="card-title">Pruebas Visuoespaciales</h3>
                        <div className="visuo-grid">
                            <div className="visuo-item">
                                <div className="visuo-img-container">
                                    {mocaRecord.modulesData?.Visuoespacial?.cubeImageData || mocaRecord.modulesData?.Visuoespacial?.cubeImageUrl ? (
                                        <img src={mocaRecord.modulesData.Visuoespacial.cubeImageData || mocaRecord.modulesData.Visuoespacial.cubeImageUrl} alt="Cubo del paciente" />
                                    ) : (
                                        <div className="visuo-img-placeholder"><FaBrain /></div>
                                    )}
                                </div>
                                <div className="visuo-info">
                                    <h4>Copia del Cubo</h4>
                                    <p className="visuo-status">
                                        {mocaRecord.modulesData?.Visuoespacial?.cube === 1
                                            ? "Criterios de perspectiva y dimensiones cumplidos."
                                            : "Fallos detectados en perspectiva o dimensiones."}
                                    </p>
                                    <span className={`status-tag ${mocaRecord.modulesData?.Visuoespacial?.cube === 1 ? 'correct' : 'incorrect'}`}>
                                        {mocaRecord.modulesData?.Visuoespacial?.cube === 1 ? 'Correcto' : 'Incorrecto'}
                                    </span>
                                </div>
                            </div>
                            <div className="visuo-item">
                                <div className="visuo-img-container">
                                    {mocaRecord.modulesData?.Visuoespacial?.clockImageData || mocaRecord.modulesData?.Visuoespacial?.clockImageUrl ? (
                                        <img src={mocaRecord.modulesData.Visuoespacial.clockImageData || mocaRecord.modulesData.Visuoespacial.clockImageUrl} alt="Reloj del paciente" />
                                    ) : (
                                        <div className="visuo-img-placeholder"><FaClock /></div>
                                    )}
                                </div>
                                <div className="visuo-info">
                                    <h4>Dibujo del Reloj</h4>
                                    <p className="visuo-status">
                                        {mocaRecord.modulesData?.Visuoespacial?.clock === 3
                                            ? "Contorno, números y manecillas correctos."
                                            : mocaRecord.modulesData?.Visuoespacial?.clock > 0
                                                ? `Cumple algunos criterios (${mocaRecord.modulesData.Visuoespacial.clock}/3 pts).`
                                                : "No cumple los criterios mínimos del dibujo."}
                                    </p>
                                    <span className={`status-tag ${mocaRecord.modulesData?.Visuoespacial?.clock >= 2 ? 'correct' : 'incorrect'}`}>
                                        {mocaRecord.modulesData?.Visuoespacial?.clock >= 2 ? 'Correcto' : 'Incorrecto'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Hallazgos IA */}
                    <div className="dashboard-card col-findings">
                        <div className="card-header-flex">
                            <h3 className="card-title"><FaBrain /> Hallazgos IA</h3>
                            {insights.length > FINDINGS_PER_PAGE && (
                                <div className="pagination-controls">
                                    <button
                                        className="btn-pager"
                                        disabled={findingPage === 0}
                                        onClick={() => setFindingPage(f => f - 1)}
                                    >
                                        &lsaquo;
                                    </button>
                                    <span className="page-indicator">{findingPage + 1} / {Math.ceil(insights.length / FINDINGS_PER_PAGE)}</span>
                                    <button
                                        className="btn-pager"
                                        disabled={(findingPage + 1) * FINDINGS_PER_PAGE >= insights.length}
                                        onClick={() => setFindingPage(f => f + 1)}
                                    >
                                        &rsaquo;
                                    </button>
                                </div>
                            )}
                        </div>
                        <div className="findings-list">
                            {insights.slice(findingPage * FINDINGS_PER_PAGE, (findingPage + 1) * FINDINGS_PER_PAGE).map((insight, idx) => (
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

                    <div className="dashboard-card col-risk">
                        {/* Riesgo de Deterioro actual se mantiene */}
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
                            <Badge 
                                bg={riskPercentage >= 70 ? 'danger' : riskPercentage >= 40 ? 'warning' : 'success'} 
                                text={riskPercentage >= 40 ? 'dark' : 'white'}
                            >
                                {riskPercentage >= 70 ? 'GRAVE' : riskPercentage >= 40 ? 'MODERADO' : 'LEVE'}
                            </Badge>
                        </div>
                    </div>

                    {/* SECCIÓN MIIM: INTEGRACIÓN Y SÍNTESIS */}
                    <div className="dashboard-card col-multimodal" style={{ background: 'transparent', boxShadow: 'none', padding: 0 }}>
                        <Grid container spacing={3}>
                            <Grid item xs={12} lg={5}>
                                <div className="dashboard-card h-100" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                        <h3 className="card-title" style={{ margin: 0 }}><FaBrain /> Índices MIIM</h3>
                                        <button 
                                            className={`btn-mode-toggle ${isPredictiveMode ? 'active' : ''}`}
                                            onClick={() => setIsPredictiveMode(!isPredictiveMode)}
                                            style={{ fontSize: '0.65rem' }}
                                        >
                                            {isPredictiveMode ? '⚙️ Investigación' : '✅ Producción'}
                                        </button>
                                    </Box>
                                    <MultimodalInsightsCard data={multimodalData} loading={loadingMultimodal} />
                                </div>
                            </Grid>
                            <Grid item xs={12} lg={7}>
                                <div className="dashboard-card h-100" style={{ padding: '1.5rem' }}>
                                    <SynthesisTextPanel data={multimodalData} loading={loadingMultimodal} />
                                </div>
                            </Grid>
                        </Grid>
                    </div>

                    {/* Distribución de Emociones y Galería */}
                    <div className="dashboard-card col-emotions">
                        <h3 className="card-title"><FaChartBar /> Distribución de Emociones</h3>
                        <div className="emotion-layout">
                            <div className="emotion-distribution radar-wrapper">
                                {emotionDistData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={250}>
                                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={emotionDistData}>
                                            <PolarGrid stroke="#e2e8f0" />
                                            <PolarAngleAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} />
                                            <PolarRadiusAxis angle={30} domain={[0, 100]} axisLine={false} tick={false} />
                                            <Radar
                                                name="Paciente"
                                                dataKey="value"
                                                stroke="#3b82f6"
                                                strokeWidth={2}
                                                fill="#3b82f6"
                                                fillOpacity={0.3}
                                                dot={{ r: 3, fill: '#3b82f6', fillOpacity: 1 }}
                                                activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2 }}
                                            />
                                            <Tooltip
                                                contentStyle={{
                                                    borderRadius: '12px',
                                                    border: 'none',
                                                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                                    padding: '10px'
                                                }}
                                                formatter={(value) => [`${value}%`, 'Probabilidad']}
                                            />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="text-center text-muted py-4">No hay datos de emociones</div>
                                )}
                            </div>

                            {mocaRecord?.emotionData?.captures?.length > 0 && (
                                <div className="emotion-gallery-mini">
                                    <h4>Evidencia de IA</h4>
                                    <div className="gallery-scroll">
                                        {mocaRecord.emotionData.captures.map((cap, idx) => (
                                            <div key={idx} className="gallery-item" title={`${cap.emotion} - ${cap.currentModule}`}>
                                                <img src={cap.imageData || cap.imageUrl} alt={cap.emotion} />
                                                <Badge className="gallery-badge" style={{ backgroundColor: EMOTION_COLORS[cap.name] || '#3b82f6' }}>
                                                    {cap.emotion}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Timeline Emocional */}
                    <div className="dashboard-card col-timeline">
                        <h3 className="card-title"><FaHistory /> Timeline Emocional</h3>
                        <div className="emotional-timeline-container-premium">
                            <div className="timeline-path-base"></div>
                            <div className="timeline-visual-staggered">
                                {[
                                    { name: 'Visuoespacial', icon: <FaCube /> },
                                    { name: 'Identificación', icon: <FaEye /> },
                                    { name: 'Memoria', icon: <FaSave /> },
                                    { name: 'Atención', icon: <FaBrain /> },
                                    { name: 'Lenguaje', icon: <FaMicrophone /> }
                                ].map((modObj, idx) => {
                                    const modName = modObj.name;
                                    const cap = mocaRecord?.emotionData?.captures?.find(c => c.currentModule === modName);
                                    const isUpper = idx % 2 === 0;

                                    return (
                                        <div key={idx} className={`timeline-step ${isUpper ? 'step-upper' : 'step-lower'}`}>
                                            {/* 1. Label Section (Alternating) */}
                                            <div className="step-label">
                                                <span className="step-icon">{modObj.icon}</span>
                                                <span className="step-text">{modName}</span>
                                            </div>

                                            {/* 2. Connection Line to Path */}
                                            <div className="step-connector"></div>

                                            {/* 3. The Node Marker on the central path */}
                                            <div className={`step-node ${cap ? 'has-data' : ''}`}>
                                                <div className="node-core"></div>
                                                {cap && (
                                                    <div className="node-pulse"></div>
                                                )}
                                            </div>

                                            {/* 4. Preview Image (Opposite to label) */}
                                            {cap && (
                                                <div className="step-preview-container">
                                                    <div className="step-preview">
                                                        <img src={cap.imageData || cap.imageUrl} alt={modName} />
                                                        <div className="preview-info">
                                                            <Badge bg="primary">
                                                                {(cap.emotionLabel || cap.emotion || '').toUpperCase()} | {(cap.confidence || (cap.probability * 100) || 0).toFixed(1)}%
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div ref={section2Ref} className="pdf-page-section dashboard-grid second-page-grid">
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

                {/* Card 1: Biomarcadores Clínicos */}
                <div className="dashboard-card col-biomarkers">
                    <h3 className="card-title"><FaHeartbeat /> Biomarcadores de Carga Cognitiva</h3>
                    <div className="biomarkers-grid">
                        <div className="biomarker-item">
                            <div className="biomarker-header">
                                <span>Índice de Estrés</span>
                                <span className={`biomarker-value ${(clinicalIndices.stress || 0) > 0.6 ? 'text-danger' : 'text-primary'}`}>
                                    {((clinicalIndices.stress || 0) * 100).toFixed(1)}%
                                </span>
                            </div>
                            <div className="vital-bar">
                                <div className="vital-fill" style={{ width: `${(clinicalIndices.stress || 0) * 100}%` }}></div>
                            </div>
                        </div>
                        <div className="biomarker-item">
                            <div className="biomarker-header">
                                <span>Ansiedad Detectada</span>
                                <span className="biomarker-value">
                                    {((clinicalIndices.anxiety || 0) * 100).toFixed(1)}%
                                </span>
                            </div>
                            <div className="vital-bar">
                                <div className="vital-fill anxiety" style={{ width: `${(clinicalIndices.anxiety || 0) * 100}%` }}></div>
                            </div>
                        </div>
                        <div className="biomarker-item">
                            <div className="biomarker-header">
                                <span>Consistencia Afectiva</span>
                                <span className="biomarker-value">
                                    {((clinicalIndices.consistency || 0) * 100).toFixed(1)}%
                                </span>
                            </div>
                            <div className="vital-bar">
                                <div className="vital-fill consistency" style={{ width: `${(clinicalIndices.consistency || 0) * 100}%` }}></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Card 2: Desglose por Módulo */}
                <div className="dashboard-card col-module-breakdown">
                    <h3 className="card-title"><FaListUl /> Desglose Emocional por Módulo</h3>
                    <div className="module-list">
                        {['Visuoespacial', 'Identificación', 'Memoria', 'Atención', 'Lenguaje'].map((mod, idx) => {
                            const summary = mocaRecord.emotionData?.moduleSummaries?.[mod];
                            return (
                                <div key={idx} className="module-row">
                                    <span className="mod-name">{mod}</span>
                                    <div className="mod-details">
                                        {summary ? (
                                            <>
                                                <Badge bg="light" text="dark" className="me-2">{summary.dominantEmotion}</Badge>
                                                <span className="mod-conf">Conf: {(summary.avgConfidence || 0).toFixed(1)}%</span>
                                            </>
                                        ) : <span className="text-muted small">Sin capturas</span>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardIAScreen;
