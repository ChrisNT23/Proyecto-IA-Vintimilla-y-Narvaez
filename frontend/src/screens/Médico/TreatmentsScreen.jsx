// src/screens/CreateTreatmentScreen.jsx
import React, { useEffect, useState } from 'react';
import { Form, Button } from 'react-bootstrap';
import { useCreateTreatmentMutation } from '../../slices/treatmentSlice'; // Asegúrate de importar desde treatmentApiSlice
import { useGetDoctorWithPatientsQuery } from '../../slices/doctorApiSlice';
import { useSelector } from 'react-redux';
import Loader from '../../components/Loader';
import Message from '../../components/Message';
import ActivitySelector from '../../components/ActivitySelector';
import '../../assets/styles/CreateTreatmentScreen.css'; // Asegúrate de importar el CSS
import { toast } from 'react-toastify';
import ActivitySelector2 from '../../components/ActivitySelector2.jsx';


const CreateTreatmentScreen = () => {
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

  // Obtener datos de pacientes
  const [localPatients, setLocalPatients] = useState([]);
  const [isFetchingData, setIsFetchingData] = useState(true);
  const { data: patientsData, isLoading, error, refetch } = useGetDoctorWithPatientsQuery();
  const userInfo = useSelector((state) => state.auth.userInfo);

  useEffect(() => {
    setLocalPatients([]);
    setIsFetchingData(true);
    if (userInfo) {
      refetch();
    }
  }, [userInfo, refetch]);

  useEffect(() => {
    if (!isLoading && patientsData) {
      // Filtramos solo los pacientes activos
      const activePatients = patientsData.filter(
        (patient) => patient.user?.isActive
      );
      setLocalPatients(activePatients);
      setIsFetchingData(false);
    }
  }, [isLoading, patientsData]);

  // Obtener el hook de la mutación
  const [createTreatment, { isLoading: isCreating, error: createError }] = useCreateTreatmentMutation();

  // Manejar el envío del formulario
  const submitHandler = async (e) => {
    e.preventDefault();

    if (patientIds.length === 0) {
      toast.error('Debe seleccionar al menos un paciente');
      return;
    }

    // validaciones para fecha de inicio y fin

    // Validar si las fechas de inicio y fin están completas
    if (!startDate) {
      toast.error('Debe seleccionar una fecha de inicio para el tratamiento');
      return;
    }

    if (!endDate) {
      toast.error('Debe seleccionar una fecha de fin para el tratamiento');
      return;
    }

    // Validar que la fecha de inicio sea anterior a la de fin
    if (new Date(startDate) > new Date(endDate)) {
      toast.error('La fecha de inicio no puede ser posterior a la fecha de fin');
      return;
    }

    // Validar si se seleccionó la próxima fecha de revisión
    if (!nextReviewDate) {
      toast.error('Debe seleccionar una próxima fecha de revisión');
      return;
    }

    // Validar que la próxima fecha de revisión sea posterior a la fecha de fin
    if (new Date(nextReviewDate) <= new Date(endDate)) {
      toast.error('La próxima fecha de revisión debe ser posterior a la fecha de fin');
      return;
    }


    const treatmentData = {
      patientIds,
      treatmentName,
      description,
      assignedActivities: selectedActivities, // Cambiado a assignedActivities
      medications,
      exerciseVideos,
      startDate,
      endDate,
      observations,
      nextReviewDate,
    };

    console.log('Datos enviados al crear tratamiento:', treatmentData);

    try {
      const response = await createTreatment(treatmentData).unwrap();

      if (response) {
        toast.success('Tratamiento creado exitosamente');
        // Limpiar el formulario
        setPatientIds([]);
        setTreatmentName('');
        setDescription('');
        setSelectedActivities([]);
        setMedications([]);
        setExerciseVideos([]);
        setStartDate('');
        setEndDate('');
        setObservations('');
        setNextReviewDate('');
      }
    } catch (err) {
      console.error('Error al crear el tratamiento:', err);
      toast.error(`Error al crear el tratamiento: ${err.data?.message || err.message}`);
    }
  };

  // Funciones para manejar medicamentos
  const addMedication = () => {
    setMedications([
      ...medications,
      { name: '', dosage: '', frequency: '', startDate: '', endDate: '', imageUrl: '' },
    ]);
  };

  const handleMedicationChange = (index, field, value) => {
    const updatedMedications = [...medications];
    updatedMedications[index][field] = value;
    setMedications(updatedMedications);
  };

  // Funciones para manejar ejercicios en video
  const addExerciseVideo = () => {
    setExerciseVideos([
      ...exerciseVideos,
      { title: '', description: '', url: '', duration: '' },
    ]);
  };

  const handleExerciseVideoChange = (index, field, value) => {
    const updatedVideos = [...exerciseVideos];
    updatedVideos[index][field] = value;
    setExerciseVideos(updatedVideos);
  };

  return (
    <>
      <h1>Crear Tratamiento</h1>
      {(isCreating || isFetchingData) && <Loader />}
      {(createError || error) && (
        <Message variant="danger">
          {createError?.data?.message || createError?.error || error?.data?.message || error?.error}
        </Message>
      )}

      <Form onSubmit={submitHandler}>
        {/* Seleccionar pacientes */}
        <Form.Group controlId="patientIds" className="mb-3">
          <Form.Label><b>Seleccionar Pacientes</b></Form.Label>
          <span className="required-asterisk">*</span>
          {isFetchingData ? (
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
              {localPatients?.map((patient) => (
                <option key={patient._id} value={patient._id}>
                  {patient.user?.name || 'No disponible'} {patient.user?.lastName || ''}
                </option>
              ))}
            </Form.Control>
          )}
        </Form.Group>

        {/* Nombre y descripción del tratamiento */}
        <Form.Group controlId="treatmentName" className="mb-3">
          <Form.Label><b>Nombre del Tratamiento</b></Form.Label>
          <span className="required-asterisk">*</span>
          <Form.Control
            type="text"
            placeholder="Ingrese el nombre del tratamiento"
            value={treatmentName}
            onChange={(e) => setTreatmentName(e.target.value)}
            required
          />
        </Form.Group>

        <Form.Group controlId="description" className="mb-3">
          <Form.Label><b>Descripción</b></Form.Label>
          <span className="required-asterisk">*</span>
          <Form.Control
            as="textarea"
            rows={3}
            placeholder="Ingrese una descripción del tratamiento"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </Form.Group>

        {/* Seleccionar actividades asignadas */}
        <Form.Group controlId="activities" className="mb-3">
          <Form.Label><b>Asignar Actividades</b></Form.Label>
          <span className="required-asterisk">*</span>
          <ActivitySelector2
            selectedActivities={selectedActivities}
            setSelectedActivities={setSelectedActivities}
          />
        </Form.Group>
        <hr className="custom-separator" />

        {/* Agregar medicamentos */}
        <Form.Group controlId="medications" className="mb-3">
          <Form.Label><b>Medicamentos</b></Form.Label>
          <Button variant="secondary" onClick={addMedication} className="mb-2 custom-button">
          
            + Agregar Medicamento
          </Button>
          {medications.map((medication, index) => (
            <div key={index} className="mb-3">
              <Form.Control
                type="text"
                placeholder="Nombre del medicamento"
                value={medication.name}
                onChange={(e) => handleMedicationChange(index, 'name', e.target.value)}
                className="mb-2"
                required
              />
              <Form.Control
                type="text"
                placeholder="Dosis"
                value={medication.dosage}
                onChange={(e) => handleMedicationChange(index, 'dosage', e.target.value)}
                className="mb-2"
                required
              />

              {/* Frecuencia con radio buttons personalizados */}
              <Form.Group controlId={`frequency-${index}`} className="mb-2">
                <Form.Label>Frecuencia</Form.Label>
                <div className="custom-radio-container">
                  <div className="custom-radio">
                    <input
                      type="radio"
                      id={`radio-diaria-${index}`}
                      name={`frequency-${index}`}
                      value="Diaria"
                      checked={medication.frequency === 'Diaria'}
                      onChange={(e) => handleMedicationChange(index, 'frequency', e.target.value)}
                      required
                    />
                    <label className="radio-label" htmlFor={`radio-diaria-${index}`}>
                      <div className="radio-circle"></div>
                      <span className="radio-text">Diaria</span>
                    </label>

                    <input
                      type="radio"
                      id={`radio-semanal-${index}`}
                      name={`frequency-${index}`}
                      value="Semanal"
                      checked={medication.frequency === 'Semanal'}
                      onChange={(e) => handleMedicationChange(index, 'frequency', e.target.value)}
                    />
                    <label className="radio-label" htmlFor={`radio-semanal-${index}`}>
                      <div className="radio-circle"></div>
                      <span className="radio-text">Semanal</span>
                    </label>

                    <input
                      type="radio"
                      id={`radio-mensual-${index}`}
                      name={`frequency-${index}`}
                      value="Mensual"
                      checked={medication.frequency === 'Mensual'}
                      onChange={(e) => handleMedicationChange(index, 'frequency', e.target.value)}
                    />
                    <label className="radio-label" htmlFor={`radio-mensual-${index}`}>
                      <div className="radio-circle"></div>
                      <span className="radio-text">Mensual</span>
                    </label>
                  </div>
                </div>
              </Form.Group>

              <Form.Control
                type="date"
                placeholder="Fecha de inicio"
                value={medication.startDate}
                onChange={(e) => handleMedicationChange(index, 'startDate', e.target.value)}
                className="mb-2 small-date-input"
                required
              />
              <Form.Control
                type="date"
                placeholder="Fecha de fin"
                value={medication.endDate}
                onChange={(e) => handleMedicationChange(index, 'endDate', e.target.value)}
                className="mb-2 small-date-input"
              />
            </div>
          ))}
        </Form.Group>

        <hr className="custom-separator" />

        {/* Agregar ejercicios en video */}
        <Form.Group controlId="exerciseVideos" className="mb-3">
          <Form.Label><b>Ejercicios en Video</b></Form.Label>
          <Button variant="secondary" onClick={addExerciseVideo} className="mb-2 custom-button">
            + Agregar Video
          </Button>
          {exerciseVideos.map((video, index) => (
            <div key={index} className="mb-3">
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
            </div>
          ))}
        </Form.Group>
        <hr className="custom-separator" />

        {/* Fechas y observaciones */}
        <div className="date-row">
          <Form.Group controlId="startDate" className="mb-3">
            <Form.Label><b>Fecha de inicio del tratamiento</b></Form.Label>
            <span className="required-asterisk">*</span>
            <Form.Control
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="small-date-input"
            />
          </Form.Group>

          <Form.Group controlId="endDate" className="mb-3">
            <Form.Label><b>Fecha de fin del tratamiento</b></Form.Label>
            <span className="required-asterisk">*</span>
            <Form.Control
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="small-date-input"
            />
          </Form.Group>

        </div>
        <Form.Group controlId="nextReviewDate" className="mb-3">
          <Form.Label><b>Próxima fecha de revisión</b></Form.Label>
          <span className="required-asterisk">*</span>
          <Form.Control
            type="date"
            value={nextReviewDate}
            onChange={(e) => setNextReviewDate(e.target.value)}
            className="small-date-input"
          />
        </Form.Group>

        <Form.Group controlId="observations" className="mb-3">
          <Form.Label><b>Observaciones</b></Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            placeholder="Ingrese observaciones adicionales"
            value={observations}
            onChange={(e) => setObservations(e.target.value)}
          />
        </Form.Group>




        <div className='createbutton'>
          <Button type="submit" variant="primary" className="mb-2 custom-button">
            Crear Tratamiento
          </Button>
        </div>
      </Form>
    </>
  );
};

export default CreateTreatmentScreen;