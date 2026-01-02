// components/TreatmentsListScreen.jsx

import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  useGetTreatmentsByPatientQuery,
  useUpdateTreatmentMutation,
} from '../../slices/treatmentSlice';
import Loader from '../../components/Loader';
import Message from '../../components/Message';
import { ListGroup, Card, Row, Col, Button, Form, Badge } from 'react-bootstrap';
import { FaEdit } from 'react-icons/fa';
import '../../assets/styles/TreatmentsListScreen.css';

const TreatmentsListScreen = () => {
  const { patientId } = useParams();

  const { data: treatments, isLoading, error, refetch } = useGetTreatmentsByPatientQuery(patientId);

  const [selectedTreatment, setSelectedTreatment] = useState(null);

  const [updateTreatment, { isLoading: isUpdating, error: updateError }] = useUpdateTreatmentMutation();

  const handleTreatmentSelect = (treatment) => {
    setSelectedTreatment(treatment);
  };

  const handleActiveChange = async (e) => {
    const newActiveStatus = e.target.checked;
    try {
      await updateTreatment({
        treatmentId: selectedTreatment._id,
        updatedData: { active: newActiveStatus },
      }).unwrap();

      setSelectedTreatment((prevTreatment) => ({
        ...prevTreatment,
        active: newActiveStatus,
      }));
      // Refetch the treatments list
      refetch();
    } catch (error) {
      console.error('Error al actualizar el estado activo del tratamiento', error);
    }
  };

  return (
    <div className="treatments-list-container p-4">
      <h1 className="mb-4 text-center">Tratamientos del Paciente</h1>
      {isLoading ? (
        <Loader />
      ) : error ? (
        <Message variant="danger">
          {error?.data?.message || error.error || 'Error al cargar los tratamientos.'}
        </Message>
      ) : treatments && treatments.length > 0 ? (
        <Row>
          <Col md={4}>
            <ListGroup>
              {treatments.map((treatment) => (
                <ListGroup.Item
                  key={treatment._id}
                  action
                  active={selectedTreatment && selectedTreatment._id === treatment._id}
                  onClick={() => handleTreatmentSelect(treatment)}
                >
                  {treatment.treatmentName}
                  {treatment.active && (
                    <Badge bg="success" className="ms-2">
                      Activo
                    </Badge>
                  )}
                </ListGroup.Item>
              ))}
            </ListGroup>
          </Col>

          <Col md={8}>
            {selectedTreatment ? (
              <Card className="shadow p-4">
                <Card.Body>
                  <Card.Title className="d-flex justify-content-between align-items-center">
                    {selectedTreatment.treatmentName}
                    <Button
                      as={Link}
                      to={`/admin/treatments/${selectedTreatment._id}/edit`}
                      variant="warning"
                      className="d-flex align-items-center"
                      state={{ patientId }}
                    >
                      <FaEdit className="me-2" />
                      Editar
                    </Button>
                  </Card.Title>
                  <Card.Text>
                    <Form.Check
                      type="switch"
                      id="active-switch"
                      label="Tratamiento Activo"
                      checked={selectedTreatment.active}
                      onChange={handleActiveChange}
                    />
                  </Card.Text>
                  <Card.Text>
                    <strong>Descripción:</strong> {selectedTreatment.description}
                  </Card.Text>
                  <Card.Text>
                    <strong>Paciente:</strong>{' '}
                    {selectedTreatment.patients
                      .map(
                        (patient) =>
                          `${patient.user.name || 'No disponible'} ${patient.user.lastName || ''}`
                      )
                      .join(', ')}
                  </Card.Text>
                  <Card.Text>
                    <strong>Actividades:</strong>{' '}
                    {selectedTreatment.assignedActivities
                      .map((activity) => activity.name)
                      .join(', ')}
                  </Card.Text>
                  <Card.Text>
                    <strong>Fecha de Inicio:</strong>{' '}
                    {selectedTreatment.startDate
                      ? new Date(selectedTreatment.startDate).toLocaleDateString()
                      : 'No definida'}
                  </Card.Text>
                  <Card.Text>
                    <strong>Fecha de Fin:</strong>{' '}
                    {selectedTreatment.endDate
                      ? new Date(selectedTreatment.endDate).toLocaleDateString()
                      : 'No definida'}
                  </Card.Text>
                  <Card.Text>
                    <strong>Observaciones:</strong> {selectedTreatment.observations || 'N/A'}
                  </Card.Text>
                  <Card.Text>
                    <strong>Próxima Revisión:</strong>{' '}
                    {selectedTreatment.nextReviewDate
                      ? new Date(selectedTreatment.nextReviewDate).toLocaleDateString()
                      : 'No definida'}
                  </Card.Text>
                  {/* Puedes agregar más detalles según tus necesidades */}
                </Card.Body>
              </Card>
            ) : (
              <div className="text-center">
                <p>Seleccione un tratamiento para ver los detalles.</p>
              </div>
            )}
          </Col>
        </Row>
      ) : (
        <p className="no-treatments-message">Este paciente no tiene tratamientos asignados.</p>
      )}
    </div>
  );
};

export default TreatmentsListScreen;
