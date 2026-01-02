// src/screens/ActivityScreen1.jsx

import React, { useState, useEffect } from 'react'; 
import { createBoard } from '../utils/createBoard';
import Cell from '../components/Activity 1/Cell';
import { useNavigate, useParams } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import { useRecordActivityMutation, useGetActiveTreatmentQuery } from '../slices/treatmentSlice'; // Importar desde treatmentApiSlice
import { useSelector } from 'react-redux';
import 'react-toastify/dist/ReactToastify.css'; // Importar estilos de react-toastify
import io from 'socket.io-client';
import styles from '../assets/styles/ActivityScreen1.module.css'; // Importa los estilos específicos

const ActivityScreen1 = () => {
  const [board, setBoard] = useState(() => createBoard(1)); // Nivel 1
  const [gamesToWin, setGamesToWin] = useState(5); // 5 tableros por nivel
  const [timer, setTimer] = useState(0);
  const miliseconds = (timer / 10).toFixed(2);
  const navigate = useNavigate();
  const { activityId } = useParams(); // Obtener activityId de la ruta
  console.log('activityId from route:', activityId); // Añade este log
  const userInfo = useSelector((state) => state.auth.userInfo);

  // Obtener el userId
  const userId = userInfo?._id;

  // Usar la query para obtener el tratamiento activo
  const { data: activeTreatment, isLoading: isTreatmentLoading, error: treatmentError } = useGetActiveTreatmentQuery(userId, {
    skip: !userId, // Omitir la consulta si no hay userId
  });

  // Hook de la mutación para registrar actividad
  const [recordActivity, { isLoading: isRecording, error: recordError }] = useRecordActivityMutation();

  useEffect(() => {
    if (gamesToWin > 0) {
      const interval = setInterval(() => {
        setTimer(prevTimer => prevTimer + 1);
      }, 100);
      return () => clearInterval(interval);
    }
  }, [gamesToWin]);

  const saveActivity = async () => {
    try {
      if (!userInfo) {
        toast.error('Usuario no autenticado');
        return;
      }

      if (isTreatmentLoading) {
        toast.error('Cargando tratamiento activo...');
        return;
      }

      if (treatmentError) {
        toast.error(`Error al obtener tratamiento activo: ${treatmentError.message}`);
        return;
      }

      if (!activeTreatment) {
        toast.error('No hay tratamiento activo asociado');
        return;
      }

      if (!activityId) {
        toast.error('No se encontró una actividad seleccionada');
        return;
      }

      const activityData = {
        activityId: activityId,
        scoreObtained: 5, // Ajusta según cómo calcules el score
        timeUsed: parseFloat(miliseconds),
        progress: 'mejorando',
        observations: 'El paciente completó la actividad satisfactoriamente.',
      };

      console.log('Actividad a registrar:', activityData); // Agrega este log

      // Registrar la actividad dentro del tratamiento
      const response = await recordActivity({ treatmentId: activeTreatment._id, activityData }).unwrap();

      toast.success('Actividad guardada correctamente');
      setTimeout(() => navigate('/api/treatments/activities'), 6000);
    } catch (error) {
      console.error('Error al guardar la actividad:', error);
      // Verificar si error.data existe antes de acceder a error.data.message
      const errorMessage = error?.data?.message || error.message || 'Error desconocido';
      toast.error(`Hubo un problema al guardar la actividad: ${errorMessage}`);
    }
  };

  const handleClick = (row, col) => {
    if (board[row][col].isHidden) {
      setGamesToWin(gamesToWin - 1);

      if (gamesToWin > 1) {
        setTimeout(() => setBoard(createBoard(1)), 500);
      } else if (gamesToWin === 1) {
        saveActivity(); // Guardar al completar el último tablero
      }
    }
  };

  // Manejar la conexión de Socket.io (opcional)
  useEffect(() => {
    if (!userInfo || !activeTreatment?._id) {
      console.warn('El usuario o el tratamiento activo no están definidos');
      return;
    }

    // Inicializar el socket
    const socket = io('http://localhost:5000'); // Asegúrate de que el puerto es correcto

    socket.on('connect', () => {
      console.log('Conectado al servidor de Socket.io con ID:', socket.id);
    });

    // Ajusta el evento según cómo esté emitido en el backend
    socket.on(`treatmentActivitiesUpdated:${activeTreatment._id}`, (data) => {
      console.log(`Evento treatmentActivitiesUpdated recibido para el tratamiento ${activeTreatment._id}`, data);
      // Puedes implementar lógica adicional aquí, como actualizar el estado o refetch
    });

    socket.on('disconnect', () => {
      console.log('Desconectado del servidor de Socket.io');
    });

    // Limpiar el socket al desmontar el componente o cuando activeTreatment cambie
    return () => {
      socket.disconnect();
      console.log('Socket desconectado en cleanup');
    };
  }, [userInfo, activeTreatment]);

  return (
    <div className={styles.background}>
      <div className={styles.container}>
        <h1 className={styles.title}>Encuentra la letra (Nivel 1)</h1>
        <div className={styles.infoContainer}>
          <div className={styles.infoBox}>
            <span>Tiempo: </span>
            <span className={styles.timer}>{miliseconds} segundos</span>
          </div>
          <div className={styles.infoBox}>
            <span>Juegos restantes: </span>
            <span className={styles.gamesToWin}>{gamesToWin}</span>
          </div>
        </div>

        {isRecording && <p className={styles.recording}>Guardando actividad...</p>}
        {isTreatmentLoading && <p className={styles.loading}>Cargando tratamiento activo...</p>}
        {treatmentError && <p className={styles.error}>Error: {treatmentError.message}</p>}

        {gamesToWin === 0 ? (
          <div className={styles.gameFinished}>
            <h2>¡Felicidades!</h2>
            <p>Tu tiempo fue: <strong>{miliseconds} segundos</strong></p>
            <p>Puntaje final: <strong>5</strong></p>
            <button 
              className={styles.finishButton}
              onClick={() => navigate('/api/treatments/activities')}
            >
              Volver a Actividades
            </button>
          </div>
        ) : (
          <div className={styles.board}>
            {board.map((row, rowIdx) => (
              <div key={rowIdx} className={styles.row}>
                {row.map((letter, letterIdx) => (
                  <Cell key={letterIdx} handleClick={handleClick} {...letter} />
                ))}
              </div>
            ))}
          </div>
        )}
        <ToastContainer />
      </div>
    </div>
  );
};

export default ActivityScreen1;
