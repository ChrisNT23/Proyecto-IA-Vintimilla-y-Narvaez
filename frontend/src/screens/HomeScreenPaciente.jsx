// src/screens/HomeScreenPaciente.jsx

import React, { useEffect, useState } from 'react';
import '../assets/styles/HomeScreenPaciente.css';
import { useNavigate } from 'react-router-dom';
import {
  useGetDueMedicationsQuery,
  useGetMyMedicationsQuery,
  useGetActivitiesByUserQuery,
  useGetActiveTreatmentQuery,
  useGetCompletedActivitiesQuery,
} from '../slices/treatmentSlice.js';
import { useGetPatientsQuery } from '../slices/patientApiSlice.js'; // Importar el hook para obtener pacientes
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { format, addDays, differenceInDays, startOfDay } from 'date-fns';
import { useSaveMoodMutation } from '../slices/usersApiSlice';
import Popup from '../components/Popup.jsx';
import MedicationReminder from '../components/FloatingMessage.jsx';
import MedicationPopup from '../components/MedicationPopup.jsx';
import { useSelector } from 'react-redux';
import io from 'socket.io-client';
/* IMPORTACIONES PARA CALENDARIO GRANDE */
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'moment/locale/es'; // Importa el idioma español
import backgroundImage from '../assets/cerebro.png';

// Importar el hook para obtener moods por fecha
import { useGetMoodsByDateQuery } from '../slices/moodApiSlice.js';
import { Carousel } from 'react-bootstrap'; // Importación del componente Carousel
import 'bootstrap/dist/css/bootstrap.min.css';


moment.locale('es');
const localizer = momentLocalizer(moment);

const messages = {
  allDay: 'Todo el día',
  previous: 'Anterior',
  next: 'Siguiente',
  today: 'Hoy',
  month: 'Mes',
  week: 'Semana',
  day: 'Día',
  agenda: 'Agenda',
  date: 'Fecha',
  time: 'Hora',
  event: 'Evento',
  noEventsInRange: 'No hay eventos en este rango.',
  showMore: (total) => `+ Ver más (${total})`,
};

const HomeScreenPaciente = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [isEventPopupOpen, setIsEventPopupOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const { userInfo } = useSelector((state) => state.auth);
  const userId = userInfo?._id || null;

  console.log('userInfo:', userInfo);
  console.log('userId:', userId);

  const [saveMood, { isLoading: isSavingMood, error: saveMoodError }] = useSaveMoodMutation();

  // ** Funcionalidad de Tratamiento Activo **
  // Obtener el tratamiento activo utilizando el userId
  const {
    data: activeTreatment,
    isLoading: isActiveTreatmentLoading,
    isError: isActiveTreatmentError,
    error: activeTreatmentError,
  } = useGetActiveTreatmentQuery(userId, {
    skip: !userId,
  });

  // Obtener actividades asignadas (solo del tratamiento activo)
  const {
    data: assignedActivities,
    isLoading: isAssignedActivitiesLoading,
    isError: isAssignedActivitiesError,
    error: assignedActivitiesError,
  } = useGetActivitiesByUserQuery(undefined, {
    skip: !userId || !activeTreatment,
  });

  // Obtener medicamentos (solo del tratamiento activo)
  const {
    data: allMedications,
    isLoading: isMedLoading,
    isError: isMedError,
    error: medError,
  } = useGetMyMedicationsQuery(undefined, {
    skip: !userId || !activeTreatment,
  });

  // Obtener medicamentos debido (solo del tratamiento activo)
  const {
    data: dueMedications,
    isSuccess: isMedDueSuccess,
    isLoading: isMedDueLoading,
    isError: isMedDueError,
    error: medDueError,
    refetch: refetchDueMedications, // Añade refetch para actualizar los datos
  } = useGetDueMedicationsQuery(activeTreatment?._id, { // Pasa treatmentId aquí
    skip: !userId || !activeTreatment,
  });

  // Medicamentos pendientes ya filtrados por la API
  const pendingMedications = dueMedications || [];

  // Obtener actividades completadas (solo del tratamiento activo)
  const {
    data: completedActivities,
    isLoading: isCompletedActivitiesLoading,
    isError: isCompletedActivitiesError,
    error: completedActivitiesError,
    refetch: refetchCompletedActivities,
  } = useGetCompletedActivitiesQuery(undefined, {
    skip: !userId || !activeTreatment,
  });

  // ** Funcionalidad de MoCA **
  // Obtener todos los pacientes (incluidos los no admin)
  const {
    data: patients,
    isLoading: isPatientsLoading,
    isError: isPatientsError,
    error: patientsError,
  } = useGetPatientsQuery();

  // Buscar el paciente que coincide con el usuario actual
  const [currentPatient, setCurrentPatient] = useState(null);

  useEffect(() => {
    if (patients && userId) {
      console.log('Buscando paciente que coincide con userId:', userId);
      const matchedPatient = patients.find(patient => patient.user && patient.user._id === userId);
      if (matchedPatient) {
        console.log('Paciente encontrado:', matchedPatient);
        setCurrentPatient(matchedPatient);
      } else {
        console.log('No se encontró un paciente que coincida con el userId.');
        setCurrentPatient(null);
      }
    }
  }, [patients, userId]);

  // ** Estados de Popup **
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [medicationsForPopup, setMedicationsForPopup] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState({});
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [medsForSelectedDate, setMedsForSelectedDate] = useState([]);
  const [activitiesForSelectedDate, setActivitiesForSelectedDate] = useState([]);
  const [completedActivitiesForSelectedDate, setCompletedActivitiesForSelectedDate] = useState([]);

  // Estados para el Popup de Estado de Ánimo
  const [isMoodPopupOpen, setIsMoodPopupOpen] = useState(false);
  const [selectedMood, setSelectedMood] = useState(null);
  const [hasMoodToday, setHasMoodToday] = useState(false); // Nuevo estado para rastrear si el mood ya fue registrado hoy

  // Definir los estados de ánimo disponibles
  const moods = [
    { emoji: '😠', color: '#FF4500' }, // Enojado
    { emoji: '🤢', color: '#FF69B4' }, // Enfermo
    { emoji: '😢', color: '#1E90FF' }, // Triste
    { emoji: '😴', color: '#8A2BE2' }, // Cansado
    { emoji: '🤔', color: '#FF8C00' }, // Pensativo
    { emoji: '😎', color: '#32CD32' }, // Relajado
    { emoji: '😊', color: '#FFD700' }, // Feliz
    { emoji: '🤩', color: '#FFD700' }, // Muy Feliz
  ];

  // ** Redirección a MoCA **
  // Redirigir al paciente a la prueba MoCA si mocaAssigned es true y no hay tratamiento activo
  useEffect(() => {
    if (currentPatient) {
      console.log('Valor actual de mocaAssigned:', currentPatient.mocaAssigned);
      if (currentPatient.mocaAssigned && !activeTreatment) {
        console.log('Redirigiendo a la prueba MoCA...');
        navigate(`/moca/patient/${currentPatient._id}`);
      }
    }
  }, [currentPatient, activeTreatment, navigate]);

  // ** MOOD: Mostrar Popup Solo si No ha Registrado Hoy **
  // Obtener la fecha de hoy en formato YYYY-MM-DD
  const todayString = moment().format('YYYY-MM-DD');

  // Llamar a la query para obtener moods de hoy
  const {
    data: moodsTodayData,
    isLoading: isLoadingMoodsToday,
    isError: isErrorMoodsToday,
    error: errorMoodsToday,
  } = useGetMoodsByDateQuery(todayString, {
    skip: !currentPatient, // Solo ejecutar si hay un paciente actual
  });

  // Verificar si ya ha registrado mood hoy
  useEffect(() => {
    if (!isLoadingMoodsToday && !isErrorMoodsToday && currentPatient && Array.isArray(moodsTodayData)) {
      const hasMood = moodsTodayData.some(
        (moodEntry) => moodEntry.patient && moodEntry.patient.toString() === currentPatient._id.toString()
      );
      setHasMoodToday(hasMood);
      if (!hasMood) {
        setIsMoodPopupOpen(true);
        console.log('Mood Popup abierto porque no hay registro hoy.');
      }
    }
  }, [moodsTodayData, isLoadingMoodsToday, isErrorMoodsToday, currentPatient]);

  // Cuando se selecciona un mood en el popup
  const handleSelectMood = (mood) => {
    console.log('Estado de ánimo seleccionado:', mood);
    setSelectedMood(mood);
    setIsMoodPopupOpen(false);
    setHasMoodToday(true); // Actualizar el estado para indicar que el mood ya fue registrado hoy

    // Enviar el estado de ánimo al servidor usando la mutación de Redux
    saveMood(mood.emoji)
      .unwrap()
      .then((response) => {
        console.log('Estado de ánimo guardado:', response);
        // Opcional: mostrar una notificación de éxito
      })
      .catch((error) => {
        console.error('Error al guardar el estado de ánimo:', error);
        // Opcional: mostrar una notificación de error
      });
  };

  // ** Cambiar la fecha seleccionada del calendario **
  useEffect(() => {
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    setMedsForSelectedDate(calendarEvents[dateKey]?.medications || []);
    setActivitiesForSelectedDate(calendarEvents[dateKey]?.activities || []);

    // Si la fecha seleccionada está dentro del período del tratamiento, mostrar todas las actividades completadas
    if (activeTreatment) {
      const startDate = new Date(activeTreatment.startDate);
      const endDate = new Date(activeTreatment.endDate);

      if (selectedDate >= startDate && selectedDate <= endDate) {
        setCompletedActivitiesForSelectedDate(completedActivities || []);
      } else {
        setCompletedActivitiesForSelectedDate([]);
      }
    } else {
      setCompletedActivitiesForSelectedDate([]);
    }
  }, [selectedDate, calendarEvents, completedActivities, activeTreatment]);

  // ** Cálculo de estados de carga **
  const isLoadingAll =
    isActiveTreatmentLoading ||
    isAssignedActivitiesLoading ||
    isMedLoading ||
    isCompletedActivitiesLoading ||
    isPatientsLoading ||
    isLoadingMoodsToday;

  // ** Procesar medicamentos y actividades para el calendario **
  useEffect(() => {
    if (
      !isLoadingAll &&
      activeTreatment &&
      (allMedications || !isMedLoading) &&
      (assignedActivities || !isAssignedActivitiesLoading) &&
      (completedActivities || !isCompletedActivitiesLoading)
    ) {
      const tempEvents = [];
      const completedIds = new Set(
        completedActivities?.map((c) => c.activity._id.toString())
      );

      const startDate = new Date(activeTreatment.startDate);
      const endDate = new Date(activeTreatment.endDate);
      const totalDays = differenceInDays(endDate, startDate) + 1;

      for (let i = 0; i < totalDays; i++) {
        const currentDate = addDays(startDate, i);
        // Medicamentos
        allMedications?.forEach((med) => {
          const medStart = new Date(med.startDate);
          const medEnd = med.endDate
            ? new Date(med.endDate)
            : addDays(new Date(), 365);
          if (!isNaN(medStart) && !isNaN(medEnd)) {
            if (currentDate >= medStart && currentDate <= medEnd) {
              let isDue = false;
              switch (med.frequency) {
                case 'Diaria':
                  isDue = true;
                  break;
                case 'Semanal':
                  if (currentDate.getDay() === medStart.getDay()) {
                    isDue = true;
                  }
                  break;
                case 'Mensual':
                  if (currentDate.getDate() === medStart.getDate()) {
                    isDue = true;
                  }
                  break;
                default:
                  break;
              }
              if (isDue) {
                tempEvents.push({
                  title: `Medicamento: ${med.name}`,
                  start: currentDate,
                  end: currentDate,
                  allDay: true,
                  type: 'medication',
                });
              }
            }
          }
        });
        // Actividades pendientes
        assignedActivities?.forEach((act) => {
          const actId = act._id.toString();
          if (!completedIds.has(actId)) {
            tempEvents.push({
              title: `Pendiente: ${act.name}`,
              start: startOfDay(currentDate),
              end: startOfDay(currentDate),
              allDay: true,
              type: 'pending',
            });
          }
        });
      }
      // Actividades completadas
      completedActivities?.forEach((item) => {
        if (item?.activity?.name && item.dateCompleted) {
          const doneDate = startOfDay(new Date(item.dateCompleted));
          tempEvents.push({
            title: `Completada: ${item.activity.name}`,
            start: doneDate,
            end: doneDate,
            allDay: true,
            type: 'completed',
          });
        }
      });

      setEvents(tempEvents);
      console.log('-> Eventos para BigCalendar:', tempEvents);
    }
  }, [
    isLoadingAll,
    activeTreatment,
    allMedications,
    assignedActivities,
    completedActivities,
    isMedLoading,
    isAssignedActivitiesLoading,
    isCompletedActivitiesLoading,
  ]);

  // ** Socket.io para actualizaciones en tiempo real **
  useEffect(() => {
    if (!activeTreatment || !activeTreatment._id) return;
    const socket = io('http://localhost:5000');
    socket.on('connect', () => {
      console.log('-> Socket conectado:', socket.id);
    });
    socket.on(`treatmentActivitiesUpdated:${activeTreatment._id}`, (data) => {
      console.log('-> Evento treatmentActivitiesUpdated:', data);
      refetchCompletedActivities();
      refetchDueMedications();
    });
    socket.on('disconnect', () => {
      console.log('-> Socket desconectado');
    });
    return () => {
      socket.disconnect();
    };
  }, [
    activeTreatment,
    refetchCompletedActivities,
    refetchDueMedications
  ]);

  const handleDateClick = (date) => {
    setSelectedDate(date);
  };

  const handleMedicationReminderClick = () => {
    console.log('Se hizo clic en el mensaje flotante de medicamentos.');
    if (pendingMedications.length > 0) {
      setMedicationsForPopup(pendingMedications);
      setIsPopupOpen(true);
      console.log('Popup de Medicamentos abierto con medicamentos pendientes:', pendingMedications);
    } else {
      console.log('No hay medicamentos pendientes para mostrar en el popup.');
    }
  };

  // ** Retornos condicionales después de los Hooks **

  // Manejar el caso cuando hay error al cargar pacientes
  if (isPatientsError) {
    console.log('-> Error al cargar pacientes:', patientsError);
    return (
      <div className="home-screen-container">
        <p>Error al cargar la lista de pacientes: {patientsError.data?.message || patientsError.error}</p>
      </div>
    );
  }

  // Manejar el caso cuando hay error al cargar el tratamiento activo
  if (isActiveTreatmentError) {
    console.log('-> Error al cargar tratamiento:', activeTreatmentError);
    return (
      <div className="home-screen-container">
        <p>Error al cargar el tratamiento activo: {activeTreatmentError.data?.message || activeTreatmentError.error}</p>
      </div>
    );
  }

  // Manejar el caso cuando el tratamiento activo está cargando
  if (isActiveTreatmentLoading) {
    return <p>Cargando tratamiento activo...</p>;
  }

  // Manejar el caso cuando no se encuentra un tratamiento activo
  if (!activeTreatment) {
    return (
      <div className="home-screen-container">
        <p>No tienes un tratamiento activo asignado actualmente.</p>
      </div>
    );
  }

  // ** Validar eventos en consola **
  events.forEach((event, index) => {
    if (!event.title) {
      console.error(`-> Evento sin título en índice ${index}:`, event);
    }
    if (!(event.start instanceof Date) || isNaN(event.start)) {
      console.error(`-> Propiedad 'start' inválida en evento ${index}:`, event.start);
    }
    if (!(event.end instanceof Date) || isNaN(event.end)) {
      console.error(`-> Propiedad 'end' inválida en evento ${index}:`, event.end);
    }
  });

  // ** Retorno principal del componente **
  return (
    <>
      <div className="home-screen">
        {/* Carrusel de videos e imágenes */}
        <Carousel className="carousel-container" interval={5000} pause="hover">
          <Carousel.Item>
            <img className="d-block w-100" src="/images/brain2.jpg" alt="Primera imagen" />
            <Carousel.Caption>
              <h3>Bienvenido</h3>
              <p>Gestión de tu tratamiento en un solo lugar</p>
            </Carousel.Caption>
          </Carousel.Item>
          <Carousel.Item>
            <img className="d-block w-100" src="/images/clinicahi.jpg" alt="Segunda imagen" />
            <Carousel.Caption>
              <h3>Monitoreo Continuo</h3>
              <p>Revisa tus actividades y avances.</p>
            </Carousel.Caption>
          </Carousel.Item>
          <Carousel.Item>
            <video className="d-block w-100" autoPlay muted loop>
              <source src="/images/cerebro2.mp4" type="video/mp4" />
              Tu navegador no soporta la reproducción de videos.
            </video>
            <Carousel.Caption>
              <h3>Facilidad de uso</h3>
              <p>Interfaz intuitiva para mejorar tu experiencia.</p>
            </Carousel.Caption>
          </Carousel.Item>
        </Carousel>
      </div>

      <div className="active-section">
        <div className="active-container">
          {/* Mostrar Tratamiento Activo */}
          {activeTreatment && (
            <div className="active-treatment-container">
              <h2 className="title-with-icon">
                <img
                  src="/images/tratamientogif.gif"
                  alt="Icono Tratamiento"
                  className="treatment-icon"
                />
                Tratamiento Actual
              </h2>
              <div>
                <strong>{activeTreatment.treatmentName}</strong>
              </div>
              <div>{activeTreatment.description}</div>
            </div>
          )}
        </div>

        {/* Contenedor del botón Registrar Estado de Ánimo */}
        <div className="mood-container">
          <h2 className="title-with-icon">
            <img
              src="/images/pencil.gif"
              alt="Icono Estado de Ánimo"
              className="treatment-icon"
            />
            Estado de Ánimo
          </h2>
          <div className="register-mood-container">
            <button
              className="register-mood-button animated"
              onClick={() => setIsMoodPopupOpen(true)}
              disabled={hasMoodToday || isLoadingMoodsToday}
              title={
                hasMoodToday
                  ? 'Ya has registrado tu estado de ánimo hoy.'
                  : 'Registrar tu estado de ánimo'
              }
            >
              Registrar
            </button>
          </div>
        </div>


        {/* Contenedor de Observaciones */}
        <div className="mood-container">
          <h2 className="title-with-icon">
            <img
              src="/images/eyegif.gif"
              alt="Icono Observaciones"
              className="treatment-icon"
            />
            Observaciones
          </h2>
          <div className="observations-container">
            {activeTreatment?.observations ? (
              <p>{activeTreatment.observations}</p>
            ) : (
              <p>No hay observaciones disponibles.</p>
            )}
          </div>
        </div>
      </div>



      {/* Pantalla principal */}
      <div className="home-screen-container">
        {/* Popup de Estado de Ánimo */}
        {isMoodPopupOpen && (
          <Popup moods={moods} setSelectedMood={handleSelectMood} />
        )}

        {/* Redirigir a MoCA si mocaAssigned es true y no hay tratamiento activo */}
        {currentPatient && currentPatient.mocaAssigned && !activeTreatment && (
          <div className="home-screen-container">
            <p>Redirigiendo a la prueba MoCA...</p>
          </div>
        )}

        <h2 className="calendar-title">Calendario de Actividades</h2>
        <BigCalendar
          localizer={localizer}
          events={events} // Garantizar que siempre sea un array
          startAccessor="start"
          endAccessor="end"
          style={{ height: 500 }}
          messages={messages}
          eventPropGetter={(event) => {
            const bg =
              event.type === 'medication'
                ? '#FFD700'
                : event.type === 'completed'
                  ? '#32CD32'
                  : '#FF6347';
            return {
              style: {
                backgroundColor: bg,
                color: '#ffffff',
                borderRadius: '5px',
                padding: '5px',
              },
            };
          }}
          onSelectEvent={(event) => {
            console.log('-> Evento seleccionado:', event);
            setSelectedEvent(event);
            setIsEventPopupOpen(true);
          }}
          popup
          showAllEvents={false}
        />

        {/* Mostrar el mensaje de recordatorio si el popup de estado de ánimo está cerrado y hay medicamentos pendientes */}
        {!isMoodPopupOpen &&
          isMedDueSuccess &&
          pendingMedications.length > 0 && (
            <MedicationReminder
              count={pendingMedications.length} // Usa pendingMedications.length
              onClick={handleMedicationReminderClick}
            />
          )}

        {/* Pop-up de Medicamentos */}
        <MedicationPopup
          isOpen={isPopupOpen}
          onRequestClose={() => setIsPopupOpen(false)}
          medications={medicationsForPopup}
          treatmentId={activeTreatment._id}
          onUpdate={refetchDueMedications} // Pasa la función de refetch
        />

        {/* Mostrar indicadores de carga y errores para guardar el estado de ánimo */}
        {isSavingMood && <p>Guardando tu estado de ánimo...</p>}
        {saveMoodError && (
          <p>
            Error al guardar tu estado de ánimo:{' '}
            {saveMoodError.data?.message || saveMoodError.error}
          </p>
        )}

        {/* Icono de mensajes */}
        <ul className="message-icon-container">
          <li
            style={{ '--i': '#56CCF2', '--j': '#2F80ED' }}
            onClick={() => navigate('/chat')}
            title="Chatea con un profesional" /* Agrega el tooltip */
          >
            <img
              src="/images/chatgif.gif"
              alt="Chat Icono"
              className="chat-icon"
            />

          </li>
        </ul>


        {/* Popup de Evento Seleccionado (opcional) */}
        {isEventPopupOpen && selectedEvent && (
          <div className="event-popup">
            <h3>{selectedEvent.title}</h3>
            <p>{format(selectedEvent.start, 'PPP')}</p>
            <button onClick={() => setIsEventPopupOpen(false)}>Cerrar</button>
          </div>
        )}
      </div>

      {/* Mostrar Videos */}
      {activeTreatment && (
        <div className="videos-section">
          <hr className="custom-separator" />
          <h2 className="calendar-title">Videos de apoyo</h2>

          {/* Mostrar Videos de Ejercicio */}
          {activeTreatment.exerciseVideos &&
            activeTreatment.exerciseVideos.length > 0 && (
              <div className="video-grid">
                {activeTreatment.exerciseVideos.map((video) => (
                  <div className="video-card" key={video.url}>
                    <h4>{video.title}</h4>
                    <p>{video.description}</p>
                    <iframe
                      width="100%"
                      height="250"
                      src={video.url.replace('watch?v=', 'embed/')}
                      title={video.title}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  </div>
                ))}
              </div>
            )}
        </div>
      )}
    </>

  );

};

export default HomeScreenPaciente;