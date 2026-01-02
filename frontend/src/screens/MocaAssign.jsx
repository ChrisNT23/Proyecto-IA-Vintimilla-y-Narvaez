// src/screens/MOCAmodules/MocaAssign.jsx

import React, { useState, useEffect } from 'react';
import { Container, ListGroup, Row, Col, Form, Alert, Spinner } from 'react-bootstrap';
import { useGetPatientsQuery, useUpdatePatientMutation } from '../slices/patientApiSlice';
import '../assets/styles/MocaAssign.css'; 

const MocaAssign = () => {
  // Obtener la lista de pacientes
  const { data: patients = [], isLoading, isError, error, refetch } = useGetPatientsQuery();

  // Hook para actualizar el paciente
  const [
    updatePatient,
    { isLoading: isUpdating, isSuccess, isError: isUpdateError, error: updateError },
  ] = useUpdatePatientMutation();

  // Estado local para manejar los switches
  const [switchStates, setSwitchStates] = useState({});

  useEffect(() => {
    const initialSwitchStates = patients.reduce((acc, patient) => {
      acc[patient._id] = Boolean(patient.mocaAssigned);
      return acc;
    }, {});
    setSwitchStates(initialSwitchStates);
  }, [patients]);

  // Manejar el cambio del switch
  const handleToggle = async (patientId) => {
    const currentState = switchStates[patientId];
    setSwitchStates((prevStates) => ({
      ...prevStates,
      [patientId]: !currentState,
    }));

    try {
      await updatePatient({ id: patientId, mocaAssigned: !currentState }).unwrap();
      // Refetch para obtener los datos actualizados
      refetch();
    } catch (err) {
      console.error('Error al actualizar el estado de MoCA:', err);
      // Revertir el cambio en el switch en caso de error
      setSwitchStates((prevStates) => ({
        ...prevStates,
        [patientId]: currentState,
      }));
    }
  };

  // Manejar búsqueda de pacientes
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPatients = patients.filter((patient) =>
    patient.user?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Container className="moca-assign-container my-5">
      <h1 className="text-center mb-4">Asignar Prueba MoCA a Pacientes</h1>

      {/* Barra de búsqueda */}
      <Row className="mb-3">
        <Col md={6} className="mx-auto">
          <Form.Control
            type="text"
            placeholder="Buscar paciente por nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </Col>
      </Row>

      {/* Manejar estados de carga y errores */}
      {isLoading && (
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p>Cargando pacientes...</p>
        </div>
      )}

      {isError && (
        <Alert variant="danger" className="text-center">
          {error?.data?.message || 'Error al cargar la lista de pacientes.'}
        </Alert>
      )}

      {!isLoading && !isError && (
        <ListGroup>
          {filteredPatients.length === 0 ? (
            <ListGroup.Item className="text-center">No se encontraron pacientes.</ListGroup.Item>
          ) : (
            filteredPatients.map((patient) => (
              <ListGroup.Item key={patient._id} className="d-flex justify-content-between align-items-center">
                <div>
                  <strong>{patient.user?.name || 'Paciente sin nombre'}</strong>
                  <br />
                  <small>ID: {patient._id}</small>
                </div>
                <Form>
                  <Form.Check
                    type="switch"
                    id={`moca-switch-${patient._id}`}
                    label={switchStates[patient._id] ? 'Asignada' : 'No Asignada'}
                    checked={switchStates[patient._id] === true}
                    onChange={() => handleToggle(patient._id)}
                    disabled={isUpdating}
                  />
                </Form>
              </ListGroup.Item>
            ))
          )}
        </ListGroup>
      )}

      {/* Mensajes de éxito o error al actualizar */}
      {isSuccess && (
        <Alert variant="success" className="mt-3 text-center">
          Estado de MoCA actualizado exitosamente.
        </Alert>
      )}
      {isUpdateError && (
        <Alert variant="danger" className="mt-3 text-center">
          {updateError?.data?.message || 'Hubo un error al actualizar el estado de MoCA.'}
        </Alert>
      )}
    </Container>
  );
};

export default MocaAssign;
