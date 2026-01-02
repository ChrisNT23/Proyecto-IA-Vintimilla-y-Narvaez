// src/screens/MocaScreen.jsx

import React, { useState, useEffect } from 'react';
import { Container, ListGroup, Row, Col, Form } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useGetDoctorWithPatientsQuery } from '../slices/doctorApiSlice';
import '../assets/styles/MocaScreenPanel.css';
import Image2a from '../images/background/moca1.jpg';
import Image3a from '../images/background/moca3.jpg';
import Image4a from '../images/background/moca2.jpg';
import ImageAssign from '../images/background/moca4.jpg'; // Usa la imagen que desees para la opción "Asignar"

const MocaScreen = () => {
  const { userInfo } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  
  // Utilizar la consulta específica para obtener solo los pacientes asignados al doctor-admin loggeado
  const { data: patients = [], isLoading, error } = useGetDoctorWithPatientsQuery();
  
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Solo el admin/doctor puede acceder
  useEffect(() => {
    if (!userInfo?.isAdmin) {
      navigate('/');
    }
  }, [userInfo, navigate]);

  const handleSelectPatient = (patient) => {
    setSelectedPatient(patient);
  };

  // Manejador para las opciones
  const handleOptionChange = (option) => {
    if (option === 'asignar') {
      navigate('/moca/assign');
    } else if (option === 'historico') {
      navigate(`/moca/history/${selectedPatient?._id}`);
    } else if (option === 'iniciar') {
      navigate(`/moca/start/${selectedPatient?._id}`);
    } else if (option === 'iniciarPaciente') {
      navigate(`/moca/patient/${selectedPatient?._id}`);
    }
  };

  // Filtrar pacientes según el término de búsqueda
  const filteredPatients = patients.filter((patient) =>
    patient.user?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Container className="reports-screen-container">
      <h1 className="moca-title">Evaluación Cognitiva Montreal (MoCA)</h1>
      <Row className="moca-row">
        {/* Columna izquierda: Lista de Pacientes */}
        <Col md={4} className="moca-patient-list">
          <h4>Lista de Pacientes</h4>
          <Form className="search-bar">
            <Form.Control
              type="text"
              placeholder="Buscar paciente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Form>
          {isLoading ? (
            <p>Cargando pacientes...</p>
          ) : error ? (
            <p>Error al cargar pacientes</p>
          ) : (
            <ListGroup>
              {filteredPatients.map((patient) => (
                <ListGroup.Item
                  key={patient._id}
                  active={selectedPatient?._id === patient._id}
                  onClick={() => handleSelectPatient(patient)}
                  className="patient-item"
                >
                  {patient.user?.name || 'Paciente sin nombre'}
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
        </Col>

        {/* Columna derecha: Botones de Opciones */}
        <Col md={8} className="moca-options-container">
          {/* Opción para Asignar la Prueba MoCA */}
          <div
            className="report-card"
            onClick={() => handleOptionChange('asignar')}
          >
            <div className="report-card-image">
              <img src={ImageAssign} alt="Asignar" />
            </div>
            <div className="report-card-title">
              <p>Asignar Prueba MoCA</p>
            </div>
          </div>

          {/* Opción para Consultar Histórico */}
          <div
            className="report-card"
            onClick={() =>
              selectedPatient && handleOptionChange('historico')
            }
            style={{
              pointerEvents: selectedPatient ? 'auto' : 'none',
              opacity: selectedPatient ? 1 : 0.6,
            }}
          >
            <div className="report-card-image">
              <img src={Image2a} alt="Histórico" />
            </div>
            <div className="report-card-title">
              <p>Consultar Histórico</p>
            </div>
          </div>

          {/* Opción para Iniciar Prueba MoCA con Médico */}
          <div
            className="report-card"
            onClick={() =>
              selectedPatient && handleOptionChange('iniciar')
            }
            style={{
              pointerEvents: selectedPatient ? 'auto' : 'none',
              opacity: selectedPatient ? 1 : 0.6,
            }}
          >
            <div className="report-card-image">
              <img src={Image3a} alt="Iniciar" />
            </div>
            <div className="report-card-title">
              <p>Registrar resultados MOCA (Médico)</p>
            </div>
          </div>

          {/* Opción para Iniciar Prueba MoCA sin Médico */}
          <div
            className="report-card"
            onClick={() =>
              selectedPatient && handleOptionChange('iniciarPaciente')
            }
            style={{
              pointerEvents: selectedPatient ? 'auto' : 'none',
              opacity: selectedPatient ? 1 : 0.6,
            }}
          >
            <div className="report-card-image">
              <img src={Image4a} alt="Paciente" />
            </div>
            <div className="report-card-title">
              <p>Iniciar Prueba MoCA (Paciente)</p>
            </div>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default MocaScreen;
