// src/screens/Reports/PatientSelectionScreen.jsx

import React, { useState, useMemo } from 'react';
import { Container, Row, Col, Spinner, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaUserPlus, FaSearch, FaFilter, FaChartLine, FaUsers, FaClipboardList } from 'react-icons/fa';
import { useGetDoctorWithPatientsQuery } from '../../slices/doctorApiSlice';
import { useGetAllMocaSelfsQuery } from '../../slices/mocaSelfApiSlice';
import '../../assets/styles/PatientSelectionScreen.css';

const PatientCard = ({ patient }) => {
    // Obtenemos las evaluaciones para este paciente específico para determinar el riesgo y la fecha de la última eval.
    const { data: mocaSelfs, isLoading } = useGetAllMocaSelfsQuery(patient._id);
    
    const latestEval = useMemo(() => {
        if (!mocaSelfs || mocaSelfs.length === 0) return null;
        return [...mocaSelfs].sort((a, b) => new Date(b.testDate) - new Date(a.testDate))[0];
    }, [mocaSelfs]);

    const getRiskInfo = (score) => {
        if (score === null || score === undefined) return { label: 'PENDIENTE', class: 'pendiente' };
        if (score >= 13) return { label: 'LEVE', class: 'bajo' };
        if (score >= 7) return { label: 'MODERADO', class: 'moderado' };
        return { label: 'GRAVE', class: 'alto' };
    };

    const risk = getRiskInfo(latestEval?.totalScore);
    const age = patient.birthdate ? Math.floor((new Date() - new Date(patient.birthdate)) / (365.25 * 24 * 60 * 60 * 1000)) : 'N/A';
    const lastEvalDate = latestEval ? new Date(latestEval.testDate).toLocaleDateString() : 'N/A';

    return (
        <div className={`patient-card risk-${risk.class}`}>
            <div className="patient-card-header">
                <div className="patient-avatar-container">
                    <img 
                        src={patient.user?.image || "https://www.w3schools.com/howto/img_avatar.png"} 
                        alt={patient.user?.name} 
                        className="patient-avatar"
                    />
                    <div className="patient-names">
                        <h3>{patient.user?.name} {patient.user?.lastName}</h3>
                        <span className="patient-id">ID: {patient.user?.cardId || 'No asignado'}</span>
                    </div>
                </div>
                <span className={`risk-badge ${risk.class}`}>
                    {risk.label}
                </span>
            </div>

            <div className="patient-details">
                <div className="detail-item">
                    <div className="detail-label">Edad</div>
                    <div className="detail-value">{age} años</div>
                </div>
                <div className="detail-item">
                    <div className="detail-label">Última Eval.</div>
                    <div className="detail-value">{lastEvalDate}</div>
                </div>
            </div>

            <Link to={`/reports/dashboard-ia/${patient._id}`} className="btn-view-dashboard">
                <FaChartLine /> Ver Dashboard IA
            </Link>
        </div>
    );
};

const PatientSelectionScreen = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('Todos');
    
    const { data: patients, isLoading, error } = useGetDoctorWithPatientsQuery();

    const filteredPatients = useMemo(() => {
        if (!patients) return [];
        return patients.filter(p => {
            const matchesSearch = 
                p.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                p.user?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.user?.cardId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p._id.includes(searchTerm);
            
            // Note: statusFilter logic could be more complex once status is fully defined per patient
            return matchesSearch;
        });
    }, [patients, searchTerm]);

    if (isLoading) return (
        <div className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
            <Spinner animation="border" variant="primary" />
        </div>
    );

    if (error) return (
        <Container className="mt-5">
            <Alert variant="danger">Error al cargar los pacientes. Por favor, intente de nuevo.</Alert>
        </Container>
    );

    return (
        <div className="patient-selection-container">
            <header className="selection-header">
                <h1 className="selection-title">Selección de Pacientes</h1>
                <p className="selection-subtitle">Gestione y supervise las evaluaciones cognitivas de su panel.</p>
            </header>

            <div className="stats-container">
                <div className="stat-card">
                    <div className="stat-icon total"><FaUsers /></div>
                    <div className="stat-info">
                        <div className="stat-label">Total</div>
                        <div className="stat-value">{patients?.length || 0}</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon pending"><FaClipboardList /></div>
                    <div className="stat-info">
                        <div className="stat-label">Pendientes</div>
                        <div className="stat-value">12</div> {/* Placeholder for logic */}
                    </div>
                </div>
            </div>

            <div className="filter-bar">
                <div className="filter-group">
                    <label className="filter-label">Nombre del Paciente</label>
                    <div className="position-relative">
                        <input 
                            type="text" 
                            className="filter-input" 
                            placeholder="Ej. Juan Pérez"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="filter-group">
                    <label className="filter-label">ID del Paciente</label>
                    <input type="text" className="filter-input" placeholder="#0000" />
                </div>
                <div className="filter-group">
                    <label className="filter-label">Estado</label>
                    <select 
                        className="filter-input"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option>Todos los estados</option>
                        <option>Activo</option>
                        <option>Inactivo</option>
                    </select>
                </div>
                <button className="btn-apply-filters">
                    <FaFilter /> Aplicar Filtros
                </button>
            </div>

            <div className="patient-grid">
                {filteredPatients.map(patient => (
                    <PatientCard key={patient._id} patient={patient} />
                ))}
            </div>

            {filteredPatients.length === 0 && (
                <div className="empty-state">
                    <h3>No se encontraron pacientes</h3>
                    <p>Asegúrese de que el nombre o ID sean correctos.</p>
                </div>
            )}
        </div>
    );
};

export default PatientSelectionScreen;
