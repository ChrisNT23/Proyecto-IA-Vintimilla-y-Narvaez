// EditTreatmentScreen.jsx

import React, { useState, useEffect } from 'react';
import { Form, Button, Card, Row, Col } from 'react-bootstrap';
import {
  useGetTreatmentByIdQuery,
  useUpdateTreatmentMutation,
} from '../../slices/treatmentSlice';
import { useGetDoctorWithPatientsQuery } from '../../slices/doctorApiSlice';
import Loader from '../../components/Loader';
import Message from '../../components/Message';
import ActivitySelector from '../../components/ActivitySelector';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import '../../assets/styles/CreateTreatmentScreen.css';

const EditTreatmentScreen = () => {
  const { treatmentId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { patientId } = location.state || {}; // Obtener patientId del estado de navegación

  // Obtener detalles del tratamiento
  const { data: treatment, isLoading: loadingTreatment, error: errorTreatment } =
    useGetTreatmentByIdQuery(treatmentId);

  // Obtener pacientes asignados al médico
  const { data: patientsData, isLoading: loadingPatients, error: errorPatients } =
    useGetDoctorWithPatientsQuery();

  // Estados locales
  const [patientIds, setPatientIds] = useState([]);
  const [treatmentName, setTreatmentName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedActivities, setSelectedActivities] = useState([]);
  const [medications, setMedications] = useState([]);
  const [exerciseVideos, setExerciseVideos] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [observations, setObservations] = useState('');
  const [nextReviewDate, setNextReviewDate] = useState('');

  const [updateTreatment, { isLoading: loadingUpdate, error: errorUpdate }] =
    useUpdateTreatmentMutation();

  // Inicializar los datos del tratamiento
  useEffect(() => {
    if (treatment) {
      setPatientIds(treatment.patients?.map((p) => p._id) || []);
      setTreatmentName(treatment.treatmentName || '');
      setDescription(treatment.description || '');
      setSelectedActivities(treatment.assignedActivities?.map((a) => a._id) || []);
      setMedications(
        treatment.medications?.map((med) => ({
          ...med,
          startDate: med.startDate ? med.startDate.substring(0, 10) : '',
          endDate: med.endDate ? med.endDate.substring(0, 10) : '',
        })) || []
      );
      setExerciseVideos(treatment.exerciseVideos || []);
      setStartDate(treatment.startDate ? treatment.startDate.substring(0, 10) : '');
      setEndDate(treatment.endDate ? treatment.endDate.substring(0, 10) : '');
      setObservations(treatment.observations || '');
      setNextReviewDate(
        treatment.nextReviewDate ? treatment.nextReviewDate.substring(0, 10) : ''
      );
    }
  }, [treatment]);

  // Función para manejar el cambio de datos de medicamentos
  const handleMedicationChange = (index, field, value) => {
    const updatedMedications = [...medications];
    const updatedMedication = { ...updatedMedications[index] };
    updatedMedication[field] = value;
    updatedMedications[index] = updatedMedication;
    setMedications(updatedMedications);
  };

  // Funciones para agregar un nuevo medicamento y ejercicio en video
  const addMedication = () => {
    setMedications([
      ...medications,
      { name: '', dosage: '', frequency: '', startDate: '', endDate: '', imageUrl: '' },
    ]);
  };

  const handleExerciseVideoChange = (index, field, value) => {
    const updatedVideos = [...exerciseVideos];
    const updatedVideo = { ...updatedVideos[index] };
    updatedVideo[field] = value;
    updatedVideos[index] = updatedVideo;
    setExerciseVideos(updatedVideos);
  };

  const addExerciseVideo = () => {
    setExerciseVideos([
      ...exerciseVideos,
      { title: '', description: '', url: '', duration: '' },
    ]);
  };

  const submitHandler = async (e) => {
    e.preventDefault();

    const updatedData = {
      patientIds,
      treatmentName,
      description,
      assignedActivities: selectedActivities, // Campo correcto
      medications,
      exerciseVideos,
      startDate,
      endDate,
      observations,
      nextReviewDate,
    };

    try {
      await updateTreatment({ treatmentId, updatedData }).unwrap();
      alert('Tratamiento actualizado exitosamente');
      setTimeout(() => {
        if (patientId) {
          navigate(`/admin/${patientId}/UserActivity`); // Redirigir a la pantalla específica del paciente
        } else {
          navigate('/admin/treatments/list'); // Redirigir a la lista general si no se proporciona patientId
        }
      }, 2000);
    } catch (err) {
      console.error('Error al actualizar el tratamiento:', err);
    }
  };

  return (
    <>
      <h1 className="mb-4">Editar Tratamiento</h1>
      {(loadingTreatment || loadingPatients || loadingUpdate) && <Loader />}
      {(errorTreatment || errorPatients || errorUpdate) && (
        <Message variant="danger">
          {errorTreatment?.data?.message ||
            errorPatients?.data?.message ||
            errorUpdate?.data?.message ||
            'Error al cargar los datos.'}
        </Message>
      )}
      <Card className="p-4 shadow">
        <Form onSubmit={submitHandler}>
          {/* Seleccionar pacientes */}
          <Form.Group controlId="patientIds" className="mb-3">
            <Form.Label>Seleccionar Pacientes</Form.Label>
            {loadingPatients ? (
              <Loader />
            ) : (
              <Form.Control
                as="select"
                multiple
                value={patientIds}
                onChange={(e) =>
                  setPatientIds([...e.target.selectedOptions].map((option) => option.value))
                }
              >
                {patientsData?.map((patient) => (
                  <option key={patient._id} value={patient._id}>
                    {patient.user?.name} {patient.user?.lastName}
                  </option>
                ))}
              </Form.Control>
            )}
          </Form.Group>

          {/* Nombre del tratamiento */}
          <Form.Group controlId="treatmentName" className="mb-3">
            <Form.Label>Nombre del Tratamiento</Form.Label>
            <Form.Control
              type="text"
              value={treatmentName}
              onChange={(e) => setTreatmentName(e.target.value)}
              required
            />
          </Form.Group>

          {/* Descripción */}
          <Form.Group controlId="description" className="mb-3">
            <Form.Label>Descripción</Form.Label>
            <Form.Control
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </Form.Group>

          {/* Asignar actividades */}
          <Form.Group controlId="activities" className="mb-3">
            <Form.Label>Asignar Actividades</Form.Label>
            <ActivitySelector
              selectedActivities={selectedActivities}
              setSelectedActivities={setSelectedActivities}
            />
          </Form.Group>

          {/* Medicamentos */}
          <Form.Group controlId="medications" className="mb-3">
            <Form.Label>Medicamentos</Form.Label>
            <Button variant="secondary" onClick={addMedication} className="mb-2">
              Agregar Medicamento
            </Button>
            {medications.map((med, index) => (
              <Card key={index} className="mb-3 p-3">
                <Row>
                  <Col md={6}>
                    <Form.Control
                      type="text"
                      placeholder="Nombre del medicamento"
                      value={med.name}
                      onChange={(e) => handleMedicationChange(index, 'name', e.target.value)}
                    />
                  </Col>
                  <Col md={6}>
                    <Form.Control
                      type="text"
                      placeholder="Dosis"
                      value={med.dosage}
                      onChange={(e) => handleMedicationChange(index, 'dosage', e.target.value)}
                    />
                  </Col>
                  <Col md={12}>
                    <Form.Group controlId={`frequency-${index}`} className="mb-3">
                      <Form.Label>Frecuencia</Form.Label>
                      <div className="custom-radio-container">
                        <div className="custom-radio">
                          {/* Frecuencia Diaria */}
                          <input
                            type="radio"
                            id={`radio-diaria-${index}`}
                            name={`frequency-${index}`}
                            value="Diaria"
                            checked={med.frequency === 'Diaria'}
                            onChange={(e) =>
                              handleMedicationChange(index, 'frequency', e.target.value)
                            }
                            required
                          />
                          <label className="radio-label" htmlFor={`radio-diaria-${index}`}>
                            <div className="radio-circle"></div>
                            <span className="radio-text">Diaria</span>
                          </label>

                          {/* Frecuencia Semanal */}
                          <input
                            type="radio"
                            id={`radio-semanal-${index}`}
                            name={`frequency-${index}`}
                            value="Semanal"
                            checked={med.frequency === 'Semanal'}
                            onChange={(e) =>
                              handleMedicationChange(index, 'frequency', e.target.value)
                            }
                          />
                          <label className="radio-label" htmlFor={`radio-semanal-${index}`}>
                            <div className="radio-circle"></div>
                            <span className="radio-text">Semanal</span>
                          </label>

                          {/* Frecuencia Mensual */}
                          <input
                            type="radio"
                            id={`radio-mensual-${index}`}
                            name={`frequency-${index}`}
                            value="Mensual"
                            checked={med.frequency === 'Mensual'}
                            onChange={(e) =>
                              handleMedicationChange(index, 'frequency', e.target.value)
                            }
                          />
                          <label className="radio-label" htmlFor={`radio-mensual-${index}`}>
                            <div className="radio-circle"></div>
                            <span className="radio-text">Mensual</span>
                          </label>
                        </div>
                      </div>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Control
                      type="date"
                      value={med.startDate}
                      onChange={(e) => handleMedicationChange(index, 'startDate', e.target.value)}
                    />
                  </Col>
                  <Col md={6}>
                    <Form.Control
                      type="date"
                      value={med.endDate}
                      onChange={(e) => handleMedicationChange(index, 'endDate', e.target.value)}
                    />
                  </Col>
                </Row>
              </Card>
            ))}
          </Form.Group>

          {/* Agregar ejercicios en video */}
          <Form.Group controlId="exerciseVideos" className="mb-3">
            <Form.Label>Ejercicios en Video</Form.Label>
            <Button variant="secondary" onClick={addExerciseVideo} className="mb-2">
              Agregar Video
            </Button>
            {exerciseVideos.map((video, index) => (
              <Card key={index} className="mb-3 p-3">
                <Form.Control
                  type="text"
                  placeholder="Título del video"
                  value={video.title}
                  onChange={(e) => handleExerciseVideoChange(index, 'title', e.target.value)}
                  className="mb-2"
                  required
                />
                <Form.Control
                  type="text"
                  placeholder="Descripción"
                  value={video.description}
                  onChange={(e) => handleExerciseVideoChange(index, 'description', e.target.value)}
                  className="mb-2"
                />
                <Form.Control
                  type="text"
                  placeholder="URL del video"
                  value={video.url}
                  onChange={(e) => handleExerciseVideoChange(index, 'url', e.target.value)}
                  className="mb-2"
                  required
                />
                <Form.Control
                  type="number"
                  placeholder="Duración en segundos"
                  value={video.duration}
                  onChange={(e) => handleExerciseVideoChange(index, 'duration', e.target.value)}
                  className="mb-2"
                />
              </Card>
            ))}
          </Form.Group>

          {/* Fechas y observaciones */}
          <Row>
            <Col md={6}>
              <Form.Group controlId="startDate" className="mb-3">
                <Form.Label>Fecha de Inicio</Form.Label>
                <Form.Control
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group controlId="endDate" className="mb-3">
                <Form.Label>Fecha de Fin</Form.Label>
                <Form.Control
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </Form.Group>
            </Col>
          </Row>

          <Form.Group controlId="observations" className="mb-3">
            <Form.Label>Observaciones</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="Ingrese observaciones adicionales"
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
            />
          </Form.Group>

          <Form.Group controlId="nextReviewDate" className="mb-3">
            <Form.Label>Próxima Fecha de Revisión</Form.Label>
            <Form.Control
              type="date"
              value={nextReviewDate}
              onChange={(e) => setNextReviewDate(e.target.value)}
            />
          </Form.Group>

          <Button type="submit" variant="primary" className="mt-3">
            Actualizar Tratamiento
          </Button>
        </Form>
      </Card>
    </>
  );
};

export default EditTreatmentScreen;
