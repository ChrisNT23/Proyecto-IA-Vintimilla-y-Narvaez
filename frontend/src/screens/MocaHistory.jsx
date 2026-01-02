// src/screens/MOCAmodules/MocaHistory.jsx

import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Container, Table, Alert, Spinner } from 'react-bootstrap';
import { useGetAllMocaSelfsQuery } from '../slices/mocaSelfApiSlice'; 

const MocaHistory = () => {
  const { id: patientId } = useParams(); // Obtener el ID del paciente desde la URL
  const navigate = useNavigate(); // Hook para navegación
  const { data: mocaRecords = [], isLoading, isError, error } = useGetAllMocaSelfsQuery(patientId);

  const handleViewDetails = (recordId) => {
    navigate(`/moca-final/${recordId}`);
  };

  const handleBack = () => {
    navigate('/moca'); // Ajusta la ruta según tu aplicación
  };

  return (
    <Container className="my-5">
      <h2 className="text-center mb-4">Histórico de Resultados MoCA</h2>

      {isLoading ? (
        <div className="text-center">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Cargando...</span>
          </Spinner>
        </div>
      ) : isError ? (
        <Alert variant="danger">
          {error?.data?.error || 'Hubo un error al cargar los resultados.'}
        </Alert>
      ) : mocaRecords.length === 0 ? (
        <Alert variant="info">
          No se encontraron resultados de MoCA para este paciente.
        </Alert>
      ) : (
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>#</th>
              <th>Fecha de la Prueba</th>
              <th>Puntaje Total</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {mocaRecords.map((record, index) => (
              <tr key={record._id}>
                <td>{index + 1}</td>
                <td>{new Date(record.testDate).toLocaleDateString()}</td>
                <td>{record.totalScore}</td>
                <td>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleViewDetails(record._id)}
                  >
                    Ver Detalles
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <div className="d-flex justify-content-center mt-4">
        <Button variant="secondary" onClick={handleBack}>
          Regresar
        </Button>
      </div>
    </Container>
  );
};

export default MocaHistory;
