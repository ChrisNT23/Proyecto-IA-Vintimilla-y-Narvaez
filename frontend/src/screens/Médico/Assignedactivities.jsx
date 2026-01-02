// frontend/src/screens/Médico/AssignedActivities.jsx

import React, { useState, useEffect } from 'react';
import { useGetDoctorWithPatientsQuery } from '../../slices/doctorApiSlice';
import {
  useGetAssignedActivities2Query,
  useGetActiveTreatment2Query,
  useGetCompletedActivitiesQuery,
} from '../../slices/treatmentSlice.js';
import '../../assets/styles/AssignedActivities.css';
import { FaUser } from 'react-icons/fa';
import Loader from "../../components/Loader";
import Message from "../../components/Message";
import { Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import Activity from "../../components/Activity";
import Activity2 from "../../components/Activity2";
import Activity3 from "../../components/Activity3";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import io from 'socket.io-client';

const AssignedActivities = () => {
  const { data: patients, isLoading, error } = useGetDoctorWithPatientsQuery();
  const [selectedPatient, setSelectedPatient] = useState(null);

  const handlePatientClick = (patient) => {
    console.log("Paciente seleccionado:", patient); // Verificar la estructura
    setSelectedPatient(patient);
  };

  // Obtener el tratamiento activo del paciente seleccionado
  const {
    data: activeTreatment,
    isLoading: isTreatmentLoading,
    error: treatmentError,
  } = useGetActiveTreatment2Query(
    selectedPatient ? selectedPatient._id : null, // Asegúrate de pasar el patientId correcto
    {
      skip: !selectedPatient, // Omitir la consulta si no hay paciente seleccionado
    }
  );

  const treatmentId = activeTreatment ? activeTreatment._id : null;

  // Obtener las actividades asignadas al tratamiento activo
  const {
    data: activities,
    isLoading: isActivitiesLoading,
    error: activitiesError,
  } = useGetAssignedActivities2Query(
    { treatmentId, patientId: selectedPatient ? selectedPatient._id : null }, // Pasar treatmentId y patientId
    {
      skip: !treatmentId || !selectedPatient, // Omitir si falta treatmentId o patientId
      refetchOnMountOrArgChange: true,
    }
  );

  // Obtener actividades completadas del tratamiento activo
  const {
    data: completedActivitiesData,
    isLoading: isCompletedActivitiesLoading,
    error: completedActivitiesError,
    refetch: refetchCompletedActivities,
  } = useGetCompletedActivitiesQuery(treatmentId, {
    skip: !treatmentId, // Omitir la consulta si no hay treatmentId
  });

  const [uniqueActivities, setUniqueActivities] = useState([]);
  const [completedActivityIds, setCompletedActivityIds] = useState(new Set());

  // Filtrar y eliminar duplicados al cargar las actividades
  useEffect(() => {
    if (activities) {
      const filteredActivities = activities.reduce((acc, current) => {
        const existingActivity = acc.find((item) => item._id === current._id);
        if (!existingActivity) {
          acc.push(current);
        }
        return acc;
      }, []);
      setUniqueActivities(filteredActivities);
    } else {
      setUniqueActivities([]);
    }
  }, [activities]);

  // Obtener IDs de actividades completadas
  useEffect(() => {
    if (completedActivitiesData) {
      const completedIds = new Set(
        completedActivitiesData.map((completed) => completed.activity._id)
      );
      setCompletedActivityIds(completedIds);
    } else {
      setCompletedActivityIds(new Set());
    }
  }, [completedActivitiesData]);

  // Manejar la conexión de Socket.io para actualizaciones en tiempo real
  useEffect(() => {
    if (!treatmentId) {
      console.warn('El treatmentId no está definido');
      return;
    }

    // Inicializar el socket
    const socket = io('http://localhost:5000'); // Asegúrate de que el puerto y la URL sean correctos

    socket.on('connect', () => {
      console.log('Conectado al servidor de Socket.io con ID:', socket.id);
    });

    // Escuchar eventos de actualización de actividades completadas
    socket.on(`treatmentActivitiesUpdated:${treatmentId}`, (data) => {
      console.log(
        `Evento treatmentActivitiesUpdated recibido para el tratamiento ${treatmentId}`,
        data
      );
      // Refrescar las actividades
      // Reemplaza con tus hooks o lógica de refetch si estás usando RTK Query
      // Ejemplo:
      // refetchAssignedActivities();
      // refetchCompletedActivities();
    });

    socket.on('disconnect', () => {
      console.log('Desconectado del servidor de Socket.io');
    });

    // Limpiar el socket al desmontar el componente o cuando treatmentId cambie
    return () => {
      socket.disconnect();
      console.log('Socket desconectado en cleanup');
    };
  }, [treatmentId]);

  // Verificar si los datos están cargando o hay errores
  const isLoadingActivities = isTreatmentLoading || isActivitiesLoading || isCompletedActivitiesLoading;
  const activitiesErrorMsg = treatmentError || activitiesError || completedActivitiesError;

  return (
    <div className="assigned-activities-screen">
      <header className="report-header">
        <h1>Actividades Asignadas a Pacientes</h1>
      </header>
      <div className="content">
        {/* Selección de Paciente */}
        <section className="selection-section card">
          <h3><FaUser /> Lista de Pacientes</h3>
          {isLoading ? (
            <Loader />
          ) : error ? (
            <Message variant="danger">
              Error al cargar pacientes: {error.data?.message || error.error}
            </Message>
          ) : (
            <ul className="patients-list">
              {patients.map((patient) => (
                <li
                  key={patient._id}
                  onClick={() => handlePatientClick(patient)}
                  className={`patient-item ${selectedPatient && selectedPatient._id === patient._id ? 'active' : ''}`}
                >
                  {patient.user.name} {patient.user.lastName}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Mostrar las actividades del paciente seleccionado */}
        {selectedPatient && (
          <div className="patient-activities">
            <h2>Actividades de {selectedPatient.user.name} {selectedPatient.user.lastName}</h2>
            {/* Manejar el estado de carga y errores para actividades */}
            {isLoadingActivities ? (
              <Loader />
            ) : activitiesErrorMsg ? (
              <Message variant="danger">
                {treatmentError?.message || activitiesError?.message || completedActivitiesError?.message || 'Error al cargar actividades.'}
              </Message>
            ) : uniqueActivities && uniqueActivities.length > 0 ? (
              <Row className="activity-levels">
                {uniqueActivities.map((activity) => {
                  const isCompleted = completedActivityIds.has(activity._id);

                  // Determinar el estilo según si la actividad está completada
                  const activityStyle = isCompleted
                    ? { pointerEvents: 'none', opacity: 0.5 }
                    : {};

                  return (
                    <Col
                      key={activity._id}
                      xs={12}
                      md={6}
                      lg={4}
                      className="mb-4"
                    >
                      {/* Verificar que treatmentId está definido antes de construir el Link */}
                      {treatmentId ? (
                        <div style={{ position: 'relative', ...activityStyle }}>
                          <Link
                            to={
                              isCompleted
                                ? '#'
                                : `/treatments/${treatmentId}/activities/play/${activity._id}`
                            }
                            style={{ textDecoration: 'none' }}
                          >
                            {activity.difficultyLevel === 1 && (
                              <Activity
                                activity={{
                                  name: activity.name,
                                  description: activity.description,
                                  image: activity.image,
                                  type: activity.type,
                                }}
                              />
                            )}
                            {activity.difficultyLevel === 2 && (
                              <Activity2
                                activity={{
                                  name: activity.name,
                                  description: activity.description,
                                  image: activity.image,
                                  type: activity.type,
                                }}
                              />
                            )}
                            {activity.difficultyLevel === 3 && (
                              <Activity3
                                activity={{
                                  name: activity.name,
                                  description: activity.description,
                                  image: activity.image,
                                  type: activity.type,
                                }}
                              />
                            )}
                          </Link>
                          {isCompleted && (
                            <div className="completed-overlay">
                              <span>Actividad Completada</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <Message variant="warning">
                          No se encontró un tratamiento activo para esta actividad.
                        </Message>
                      )}
                    </Col>
                  );
                })}
              </Row>
            ) : (
              <p>No tienes actividades asignadas.</p>
            )}
          </div>
        )}
      </div>
      <ToastContainer />
    </div>
  );
};

export default AssignedActivities;
