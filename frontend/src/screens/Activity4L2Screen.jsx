// src/screens/ActivityScreen4.jsx

import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import { useNavigate, useParams } from 'react-router-dom'; 
import 'react-toastify/dist/ReactToastify.css';
import { useRecordActivityMutation } from '../slices/treatmentSlice'; // Importa el hook de mutación
import { useSelector } from 'react-redux';
import styles from '../assets/styles/Activity4L2Screen.module.css'; // Importa los estilos específicos

// Importa las imágenes
import Image1 from '../images/imagen1.png'; 
import Image2 from '../images/imagen2.png'; 

// Define las diferencias que deben ser encontradas
const differences = [
  { id: 1, name: 'Ala gallo', x: 100, y: 136, width: 80, height: 80 },
  { id: 2, name: 'Gato', x: 67, y: 40, width: 50, height: 80 },
  { id: 3, name: 'Cola gallo', x: 50, y: 136, width: 70, height: 70 },
  { id: 4, name: 'Cerca', x: 70, y: 60, width: 50, height: 60 },
  { id: 5, name: 'Ramas de un árbol', x: 365, y: 34, width: 75, height: 75 },
  { id: 6, name: 'Cuello ganzo', x: 260, y: 120, width: 65, height: 65 },
  { id: 7, name: 'Cesped', x: 70, y: 230, width: 100, height: 100 },
  { id: 8, name: 'Flores de arbusto', x: 400, y: 110, width: 80, height: 180 },
  { id: 9, name: 'Patas del ganzo', x: 260, y: 210, width: 150, height: 60 },
  { id: 10, name: 'Flor', x: 220, y: 230, width: 100, height: 100 }
];

const ActivityScreen4 = () => {
  const { treatmentId, activityId } = useParams(); // Extrae treatmentId y activityId de la ruta
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [incorrectAnswers, setIncorrectAnswers] = useState(0);
  const [points, setPoints] = useState(0);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [gameFinished, setGameFinished] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [timer, setTimer] = useState(0);
  const [differencesFound, setDifferencesFound] = useState(0);
  const navigate = useNavigate();

  // Obtener información del usuario autenticado desde el estado de Redux
  const userInfo = useSelector((state) => state.auth.userInfo);
  const patientId = userInfo?._id;

  // Hook de la mutación para registrar actividad
  const [recordActivity, { isLoading: isRecording, error: recordError }] = useRecordActivityMutation();

  // Iniciar el temporizador al montar el componente
  useEffect(() => {
    let interval;
    if (!gameFinished) {
      interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameFinished]);

  // Navegar a la lista de actividades una vez que el juego haya terminado
  useEffect(() => {
    if (gameFinished) {
      const timeout = setTimeout(() => {
        navigate('/api/treatments/activities');
      }, 6000); // Esperar 6 segundos antes de navegar
      return () => clearTimeout(timeout);
    }
  }, [gameFinished, navigate]);

  // Manejar el clic en la imagen para encontrar diferencias
  const handleImageClick = (e) => {
    const rect = e.target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
  
    let clickedOnDifference = false;
  
    differences.forEach((difference) => {
      if (
        x >= difference.x &&
        x <= difference.x + difference.width &&
        y >= difference.y &&
        y <= difference.y + difference.height
      ) {
        clickedOnDifference = true;
        if (!selectedOptions.includes(difference.id)) {
          setSelectedOptions([...selectedOptions, difference.id]);
          setCorrectAnswers((prev) => prev + 1);
          setPoints((prev) => prev + 5);
          setDifferencesFound((prev) => prev + 1);
  
          // Imprime la diferencia encontrada en la consola
          console.log(`Diferencia encontrada: ${difference.name} (ID: ${difference.id})`);
  
          setFeedbackMessage(
            `¡Correcto! Has encontrado una diferencia. Diferencias encontradas: ${differencesFound + 1} de 10`
          );
        }
      }
    });
  
    if (!clickedOnDifference) {
      setIncorrectAnswers((prev) => prev + 1);
      setPoints((prev) => prev - 2);
      setFeedbackMessage('¡Incorrecto! Esa no es una diferencia.');
    }
  };
  

  // Manejar el envío de la respuesta del usuario
  const handleSubmit = () => {
    if (selectedOptions.length < 10) {
      setShowDialog(true); // Mostrar diálogo si no se han encontrado todas las diferencias
    } else {
      setGameFinished(true);
      saveActivity(correctAnswers, incorrectAnswers);
    }
  };

  // Continuar jugando después de decidir en el diálogo
  const handleContinuePlaying = () => {
    setShowDialog(false);
  };

  // Terminar el juego después de decidir en el diálogo
  const handleEndGame = () => {
    setShowDialog(false);
    setGameFinished(true);
    saveActivity(correctAnswers, incorrectAnswers);
  };

  // Función para guardar la actividad en el backend dentro del tratamiento correspondiente
  const saveActivity = async (correct, incorrect) => {
    // Validar que el usuario está autenticado
    if (!userInfo) {
      toast.error('Usuario no autenticado');
      return;
    }

    // Validar que treatmentId está definido
    if (!treatmentId) {
      toast.error('Tratamiento no identificado. No se puede guardar la actividad.');
      return;
    }

    // Construir el objeto de datos de la actividad
    const activityData = {
      activityId, // ID de la actividad principal desde los parámetros de la ruta
      correctAnswers: correct,
      incorrectAnswers: incorrect,
      timeUsed: timer,
      scoreObtained: points,
      progress: 'mejorando', // Puedes ajustar esto según la lógica de tu aplicación
      observations: 'El paciente completó la actividad de encontrar diferencias en nivel avanzado.',
      patientId, // ID del paciente desde el estado de Redux
      difficultyLevel: 3, // Nivel de dificultad
      image: '', // No hay imagen asociada en esta actividad
    };

    console.log('Guardando actividad con los siguientes datos:', activityData);

    try {
      // Registrar la actividad dentro del tratamiento usando la mutación
      await recordActivity({ treatmentId, activityData }).unwrap();

      console.log('Actividad guardada correctamente');
      toast.success('Actividad guardada correctamente');
    } catch (error) {
      console.error('Error al guardar la actividad:', error);
      const errorMessage = error?.data?.message || error.message || 'Error desconocido';
      toast.error(`Hubo un problema al guardar la actividad: ${errorMessage}`);
    }
  };

  return (
    <div className={styles.background}>
      <div className={styles.container}>
        <h1 className={styles.title}>Encuentra las 10 diferencias</h1>
        <div className={styles.infoContainer}>
          <div className={styles.infoBox}>
            <span>Puntaje: </span>
            <span className={styles.score}>{points}</span>
          </div>
          <div className={styles.infoBox}>
            <span>Tiempo: </span>
            <span className={styles.timer}>{timer} segundos</span>
          </div>
          <div className={styles.infoBox}>
            <span>Diferencias encontradas: </span>
            <span className={styles.differencesFound}>{differencesFound} de 10</span>
          </div>
        </div>

        {/* Mostrar estado de guardado de la actividad */}
        {isRecording && <p className={styles.recording}>Guardando actividad...</p>}
        {recordError && <p className={styles.error}>Error: {recordError?.data?.message || recordError.message}</p>}

        {/* Mostrar contenido del juego o mensaje de finalización */}
        {gameFinished ? (
          <div className={styles.gameFinished}>
            <h2 className={styles.gameTitle}>¡Juego terminado!</h2>
            <p>Tiempo total: {timer} segundos</p>
            <p>Puntaje final: {points}</p>
            <p>Correctas: {correctAnswers}</p>
            <p>Incorrectas: {incorrectAnswers}</p>
          </div>
        ) : (
          <>
            <div className={styles.imagesContainer} onClick={handleImageClick}>
              <img src={Image1} alt="Imagen de juego Parte 1" className={styles.image} />
              <img src={Image2} alt="Imagen de juego Parte 2" className={styles.image} />
            </div>

            <button onClick={handleSubmit} className={styles.submitButton}>Enviar Respuesta</button>

            {/* Mostrar mensaje de retroalimentación */}
            {feedbackMessage && (
              <div className={styles.feedbackBox}>
                <p>{feedbackMessage}</p>
              </div>
            )}
          </>
        )}

        {/* Diálogo de confirmación */}
        {showDialog && (
          <div className={styles.dialogOverlay}>
            <div className={styles.dialogBox}>
              <p>Has encontrado {differencesFound} de 10 diferencias.</p>
              <p>¿Quieres terminar el juego o continuar buscando?</p>
              <div className={styles.dialogButtons}>
                <button onClick={handleEndGame} className={styles.dialogButton}>Terminar</button>
                <button onClick={handleContinuePlaying} className={styles.dialogButton}>Continuar Jugando</button>
              </div>
            </div>
          </div>
        )}
      </div>
      <ToastContainer />
    </div>
  );
};

export default ActivityScreen4;
