// src/screens/Reports/HistorialMocaScreen.jsx

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Spinner, Alert } from 'react-bootstrap';
import {
  FaArrowLeft, FaSearch, FaChartLine, FaCalendarAlt,
  FaHistory, FaBrain, FaListAlt, FaTimes, FaCheckCircle, FaTimesCircle
} from 'react-icons/fa';
import {
  ResponsiveContainer, LineChart, Line, XAxis, Tooltip, CartesianGrid
} from 'recharts';
import { useGetDoctorWithPatientsQuery } from '../../slices/doctorApiSlice';
import { useGetAllMocaSelfsQuery } from '../../slices/mocaSelfApiSlice';
import '../../assets/styles/HistorialMocaScreen.css';

// ─── Helper functions ─────────────────────────────────────────────────────────
const getRiskInfo = (score) => {
  if (score === null || score === undefined) return { label: 'PENDIENTE', cls: 'pendiente' };
  if (score >= 13) return { label: 'LEVE', cls: 'bajo' };
  if (score >= 7) return { label: 'MODERADO', cls: 'moderado' };
  return { label: 'GRAVE', cls: 'alto' };
};

const calcAge = (birthdate) =>
  birthdate
    ? Math.floor((new Date() - new Date(birthdate)) / (365.25 * 24 * 60 * 60 * 1000))
    : 'N/A';

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';

// ─── Results Modal ────────────────────────────────────────────────────────────
// Map de puntajes máximos por módulo (estándar MoCA)
// Se incluyen variantes con y sin tildes para mayor robustez
const MODULE_MAX_SCORES = {
  "Visuoespacial": 5,
  "Identificación": 3,
  "Identificacion": 3,
  "Memoria": 5,
  "Atención": 1,
  "Atencion": 1,
  "Lenguaje": 2,
  "Abstracción": 2,
  "Abstraccion": 2,
  "Recuerdo Diferido": 5,
  "Orientación": 6,
  "Orientacion": 6
};

/**
 * Muestra resultados agrupados por módulo con dropdowns (acordeón).
 */
const ResultsModal = ({ evalRecord, attemptNum, onClose }) => {
  const [expandedModule, setExpandedModule] = useState(null);

  const score = evalRecord?.totalScore ?? 0;
  // Usar el totalMaxScore del registro si existe, sino 30
  const maxScore = evalRecord?.totalMaxScore ?? 16;
  const risk = getRiskInfo(score);
  const pct = Math.round((score / maxScore) * 100);

  // Agrupa resultados por módulo
  const resultsByModule = useMemo(() => {
    if (!evalRecord) return {};
    const grouped = {};
    const md = evalRecord.modulesData || {};
    
    Object.entries(md).forEach(([modName, data]) => {
      // Normalización básica para el lookup
      const lookupKey = modName.charAt(0).toUpperCase() + modName.slice(1);
      grouped[modName] = {
        total: data?.total ?? data?.totalScore ?? 0,
        max: MODULE_MAX_SCORES[lookupKey] || MODULE_MAX_SCORES[modName] || 1,
        activities: data?.standardResults || []
      };
    });
    return grouped;
  }, [evalRecord]);

  if (!evalRecord) return null;

  return (
    <div className="hm-modal-backdrop" onClick={onClose}>
      <div className="hm-modal" onClick={e => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="hm-modal-header">
          <div>
            <span className="hm-eval-number">MoCA #{attemptNum}</span>
            <h3 className="hm-modal-title">Resultados por Módulo</h3>
            <p className="hm-modal-subtitle">
              <FaCalendarAlt size={11} style={{ marginRight: 4 }} />
              {fmtDate(evalRecord.testDate)}
            </p>
          </div>
          <button className="hm-modal-close" onClick={onClose}><FaTimes /></button>
        </div>

        {/* Total Score Summary */}
        <div className="hm-modal-score-banner">
          <div className="hm-modal-score-main">
            <span className="hm-eval-score-big">{score}</span>
            <span className="hm-eval-score-max">/ {maxScore}</span>
          </div>
          <div>
            <span className={`hm-risk-badge ${risk.cls}`}>{risk.label}</span>
            <div className="hm-score-bar" style={{ width: 140, marginTop: 8 }}>
              <div className={`hm-score-fill ${risk.cls}`} style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>

        {/* Accordion / Dropdowns */}
        <div className="hm-modal-section">
          <p className="hm-modal-section-title">Detalle de Evaluación</p>
          <div className="hm-accordion">
            {Object.entries(resultsByModule).length === 0 && (
               <p style={{ textAlign: 'center', color: '#94a3b8', padding: '1rem' }}>No hay módulos registrados.</p>
            )}
            
            {Object.entries(resultsByModule).map(([modName, mod]) => {
              const isExpanded = expandedModule === modName;
              const modPct = Math.round((mod.total / mod.max) * 100);

              return (
                <div key={modName} className={`hm-acc-item ${isExpanded ? 'active' : ''}`}>
                  <div 
                    className="hm-acc-header" 
                    onClick={() => setExpandedModule(isExpanded ? null : modName)}
                  >
                    <div className="hm-acc-header-left">
                      <span className="hm-acc-mod-name">{modName}</span>
                      <small className="hm-acc-mod-score">{mod.total}/{mod.max} pts</small>
                    </div>
                    <div className="hm-acc-header-right">
                      <div className="hm-acc-mini-bar">
                         <div className="hm-acc-mini-fill" style={{ width: `${modPct}%` }} />
                      </div>
                      <FaArrowLeft className={`hm-acc-chevron ${isExpanded ? 'down' : ''}`} size={12} />
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="hm-acc-body">
                      {mod.activities.length > 0 ? (
                        mod.activities.map((act, i) => {
                          const passed = (act.score ?? 0) >= (act.maxScore ?? 1);
                          return (
                            <div key={i} className="hm-activity-row">
                              <div className={`hm-activity-icon ${passed ? 'pass' : 'fail'}`}>
                                {passed ? <FaCheckCircle size={14} /> : <FaTimesCircle size={14} />}
                              </div>
                              <span className="hm-activity-name">{act.subtest}</span>
                              <span className="hm-activity-score">{act.score}/{act.maxScore}</span>
                            </div>
                          );
                        })
                      ) : (
                        <p style={{ padding: '0.5rem', color: '#94a3b8', fontSize: '0.8rem' }}>Sin detalle de actividades.</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Patient Card (Vista A) ───────────────────────────────────────────────────
const PatientCard = ({ patient, onSelect }) => {
  const { data: evals = [], isLoading } = useGetAllMocaSelfsQuery(patient._id);

  const sorted = useMemo(
    () => [...evals].sort((a, b) => new Date(b.testDate) - new Date(a.testDate)),
    [evals]
  );
  const latest = sorted[0] || null;
  const risk = getRiskInfo(latest?.totalScore);
  const age = calcAge(patient.birthdate);

  if (isLoading) return null;
  if (evals.length === 0) return null;

  return (
    <div className="hm-patient-card" onClick={() => onSelect(patient, sorted)}>
      <div className="hm-patient-card-top">
        <img
          className="hm-patient-avatar"
          src={patient.user?.image || 'https://www.w3schools.com/howto/img_avatar.png'}
          alt={patient.user?.name}
        />
        <div className="hm-patient-info">
          <p className="hm-patient-name">{patient.user?.name} {patient.user?.lastName}</p>
          <span className="hm-patient-id">ID: {patient.user?.cardId || patient._id.slice(-6)}</span>
        </div>
        <span className={`hm-risk-badge ${risk.cls}`}>{risk.label}</span>
      </div>

      <div className="hm-patient-stats">
        <div className="hm-stat">
          <div className="hm-stat-label">Edad</div>
          <div className="hm-stat-value">{age}</div>
        </div>
        <div className="hm-stat">
          <div className="hm-stat-label">Intentos</div>
          <div className="hm-stat-value">{sorted.length}</div>
        </div>
        <div className="hm-stat">
          <div className="hm-stat-label">Último</div>
          <div className="hm-stat-value" style={{ fontSize: '0.85rem' }}>{fmtDate(latest?.testDate)}</div>
        </div>
      </div>

      <button className="hm-view-btn">
        <FaHistory /> Ver Historial ({sorted.length} intentos)
      </button>
    </div>
  );
};

// ─── Eval Card (Vista B) ──────────────────────────────────────────────────────
const EvalCard = ({ evalRecord, index, total, onShowResults }) => {
  const navigate = useNavigate();
  const score = evalRecord.totalScore ?? 0;
  const maxScore = evalRecord.totalMaxScore ?? 16;
  const risk = getRiskInfo(score);
  const pct = Math.round((score / maxScore) * 100);
  const attemptNum = total - index;

  return (
    <div className="hm-eval-card">
      <div className="hm-eval-card-header">
        <span className="hm-eval-number">MoCA #{attemptNum}</span>
        <span className="hm-eval-date">
          <FaCalendarAlt size={11} /> {fmtDate(evalRecord.testDate)}
        </span>
      </div>

      <div>
        <div className="hm-eval-score-row">
          <span className="hm-eval-score-big">{score}</span>
          <span className="hm-eval-score-max">/ {maxScore}</span>
        </div>
        <div className="hm-eval-score-label">Puntaje total</div>
      </div>

      <div className="hm-score-bar">
        <div className={`hm-score-fill ${risk.cls}`} style={{ width: `${pct}%` }} />
      </div>

      <div className="hm-eval-footer">
        <span className={`hm-risk-badge ${risk.cls}`}>{risk.label}</span>
        {/* ──── Botón Resultados ──── */}
        <button
          className="hm-results-btn"
          onClick={() => onShowResults(evalRecord, attemptNum)}
        >
          <FaListAlt size={12} /> Resultados
        </button>
        {/* ──── Fix: usar /eval/:id para pasar el evalId, no el patientId ──── */}
        <button
          className="hm-eval-view-btn"
          onClick={() => navigate(`/reports/dashboard-ia/eval/${evalRecord._id}`)}
        >
          <FaChartLine size={12} /> Dashboard IA
        </button>
      </div>
    </div>
  );
};

// ─── Vista B: Intentos de un paciente ─────────────────────────────────────────
const PatientEvalView = ({ patient, evals }) => {
  const age = calcAge(patient.birthdate);
  const [modalEval, setModalEval] = useState(null);
  const [modalAttempt, setModalAttempt] = useState(null);

  const evolutionData = useMemo(
    () =>
      [...evals]
        .sort((a, b) => new Date(a.testDate) - new Date(b.testDate))
        .map((e, i) => ({
          intento: `#${i + 1}`,
          puntaje: e.totalScore ?? 0,
        })),
    [evals]
  );

  return (
    <>
      {/* Patient summary */}
      <div className="hm-patient-header">
        <img
          className="hm-patient-header-avatar"
          src={patient.user?.image || 'https://www.w3schools.com/howto/img_avatar.png'}
          alt={patient.user?.name}
        />
        <div>
          <p className="hm-patient-header-name">
            {patient.user?.name} {patient.user?.lastName}
          </p>
          <p className="hm-patient-header-meta">
            {age} años · ID: {patient.user?.cardId || patient._id.slice(-6)}
          </p>
        </div>
      </div>

      {/* Evolution mini chart */}
      {evolutionData.length > 1 && (
        <div className="hm-evolution-section">
          <p className="hm-evolution-title"><FaChartLine /> Evolución del Puntaje MoCA</p>
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={evolutionData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="intento" fontSize={11} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                formatter={(v) => [`${v} pts`, 'Puntaje']}
              />
              <Line
                type="monotone"
                dataKey="puntaje"
                stroke="#2563eb"
                strokeWidth={3}
                dot={{ r: 5, fill: '#2563eb' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Eval cards */}
      <p className="hm-section-label">Evaluaciones ({evals.length})</p>
      <div className="hm-eval-grid">
        {evals.map((ev, i) => (
          <EvalCard
            key={ev._id}
            evalRecord={ev}
            index={i}
            total={evals.length}
            onShowResults={(rec, num) => { setModalEval(rec); setModalAttempt(num); }}
          />
        ))}
      </div>

      {/* Results Modal */}
      {modalEval && (
        <ResultsModal
          evalRecord={modalEval}
          attemptNum={modalAttempt}
          onClose={() => { setModalEval(null); setModalAttempt(null); }}
        />
      )}
    </>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
const HistorialMocaScreen = () => {
  const [search, setSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedEvals, setSelectedEvals] = useState([]);

  const { data: patients = [], isLoading, error } = useGetDoctorWithPatientsQuery();

  const filteredPatients = useMemo(() => {
    if (!patients) return [];
    const q = search.toLowerCase();
    return patients.filter(p =>
      p.user?.name?.toLowerCase().includes(q) ||
      p.user?.lastName?.toLowerCase().includes(q) ||
      p.user?.cardId?.toLowerCase().includes(q) ||
      p._id.includes(q)
    );
  }, [patients, search]);

  const handleSelectPatient = (patient, evals) => {
    setSelectedPatient(patient);
    setSelectedEvals(evals);
  };

  const handleBack = () => {
    setSelectedPatient(null);
    setSelectedEvals([]);
  };

  return (
    <div className="historial-container">
      {/* Header */}
      <div className="historial-header">
        <div className="historial-header-inner">
          {selectedPatient && (
            <button className="historial-back-btn" onClick={handleBack}>
              <FaArrowLeft /> Volver
            </button>
          )}
          <div>
            <h1 className="historial-title">
              {selectedPatient
                ? `Historial de ${selectedPatient.user?.name}`
                : 'Historial MoCA'}
            </h1>
            <p className="historial-subtitle">
              {selectedPatient
                ? 'Evaluaciones cognitivas realizadas por este paciente'
                : 'Todos los pacientes con evaluaciones MoCA registradas'}
            </p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="historial-body">
        {isLoading && (
          <div className="hm-spinner-wrap">
            <Spinner animation="border" variant="primary" />
          </div>
        )}

        {error && (
          <Alert variant="danger">Error al cargar los pacientes. Por favor, intente de nuevo.</Alert>
        )}

        {!isLoading && !error && !selectedPatient && (
          <>
            <div className="historial-search-bar">
              <FaSearch className="historial-search-icon" />
              <input
                type="text"
                placeholder="Buscar por nombre, apellido o cédula..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="historial-patient-grid">
              {filteredPatients.map(p => (
                <PatientCard
                  key={p._id}
                  patient={p}
                  onSelect={handleSelectPatient}
                />
              ))}
            </div>

            {filteredPatients.length === 0 && (
              <div className="hm-empty">
                <FaBrain size={40} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                <h3>No se encontraron pacientes</h3>
                <p>Ajusta el término de búsqueda.</p>
              </div>
            )}
          </>
        )}

        {!isLoading && !error && selectedPatient && (
          <PatientEvalView
            patient={selectedPatient}
            evals={selectedEvals}
          />
        )}
      </div>
    </div>
  );
};

export default HistorialMocaScreen;
