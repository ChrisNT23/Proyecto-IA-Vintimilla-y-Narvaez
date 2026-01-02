// src/screens/ActivityScreen4.jsx

import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import { useNavigate, useParams } from 'react-router-dom';
import 'react-toastify/dist/ReactToastify.css';
import styles from '../assets/styles/Activity4L3Screen.module.css'; // Importa el archivo CSS Module
import { useRecordActivityMutation } from '../slices/treatmentSlice'; // Importa el hook de mutación
import { useSelector } from 'react-redux';

// Importa las imágenes
import Image1a from '../images/monalisa1.png';
import Image1b from '../images/monalisa2.png';
import Image2a from '../images/nocheEstrellada1.png';
import Image2b from '../images/nocheEstrellada2.png';
import Image3a from '../images/pareja1.png';
import Image3b from '../images/pareja2.png';
import Image4a from '../images/desiertoTiempo1.png';
import Image4b from '../images/desiertoTiempo2.png';
import Image5a from '../images/mujer1.png';
import Image5b from '../images/mujer2.png';

// Define las diferencias de cada par de imágenes
const imagePairs = [
  {
    id: 1,
    image1: Image1a,
    image2: Image1b,
    differences: [
      { id: 1, name: 'dedo', x: 215, y: 460, width: 50, height: 60 },
      { id: 2, name: 'arboles', x: 68, y: 150, width: 85, height: 85 },
    ],
  },
  {
    id: 2,
    image1: Image2a,
    image2: Image2b,
    differences: [
      { id: 3, name: 'nube', x: 410, y: 166, width: 60, height: 60 },
      { id: 4, name: 'puerta', x: 248, y: 425, width: 75, height: 75 },
    ],
  },
  {
    id: 3,
    image1: Image3a,
    image2: Image3b,
    differences: [
      { id: 5, name: 'ropa', x: 20, y: 300, width: 60, height: 60 },
      { id: 6, name: 'palo', x: 410, y: 107, width: 70, height: 70 },
    ],
  },
  {
    id: 4,
    image1: Image4a,
    image2: Image4b,
    differences: [
      { id: 7, name: 'piedra', x: 450, y: 140, width: 50, height: 50 },
      { id: 8, name: 'lampara', x: 70, y: 165, width: 50, height: 50 },
    ],
  },
  {
    id: 5,
    image1: Image5a,
    image2: Image5b,
    differences: [
      { id: 9, name: 'tela', x: 400, y: 310, width: 50, height: 80 },
      { id: 10, name: 'pelo', x: 210, y: 10, width: 80, height: 55 },
    ],
  },
];

const ActivityScreen4 = () => {
  const { treatmentId, activityId } = useParams(); // Extrae treatmentId y activityId de la ruta
  const [currentPairIndex, setCurrentPairIndex] = useState(0);
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

  useEffect(() => {
    let interval;
    if (!gameFinished) {
      interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameFinished]);

  useEffect(() => {
    if (gameFinished) {
      const timeout = setTimeout(() => {
        navigate('/api/treatments/activities');
      }, 7000); // Redirige después de 7 segundos
      return () => clearTimeout(timeout);
    }
  }, [gameFinished, navigate]);

  const currentPair = imagePairs[currentPairIndex];
  const isLastPair = currentPairIndex === imagePairs.length - 1;

  const handleImageClick = (e) => {
    const rect = e.target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    let clickedOnDifference = false;

    currentPair.differences.forEach((difference) => {
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
          setFeedbackMessage(`¡Correcto! Has encontrado una diferencia.`);

          if (selectedOptions.length + 1 === currentPair.differences.length && !isLastPair) {
            setTimeout(() => handleNextPair(), 500);
          } else if (isLastPair && selectedOptions.length + 1 === currentPair.differences.length) {
            setTimeout(() => handleSubmit(), 500);
          }
        }
      }
    });

    if (!clickedOnDifference) {
      setIncorrectAnswers((prev) => prev + 1);
      setPoints((prev) => prev - 2);
      setFeedbackMessage('¡Incorrecto! Esa no es una diferencia.');
    }
  };

  const handleNextPair = () => {
    setSelectedOptions([]);
    setFeedbackMessage('');
    if (!isLastPair) {
      setCurrentPairIndex(currentPairIndex + 1);
    }
  };

  const handleSubmit = () => {
    if (differencesFound < 10) {
      setShowDialog(true);
    } else {
      setGameFinished(true);
      saveActivity();
    }
  };

  const handleContinuePlaying = () => {
    setShowDialog(false);
  };

  const handleEndGame = () => {
    setShowDialog(false);
    setGameFinished(true);
    saveActivity();
  };

  const saveActivity = async () => {
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
      correctAnswers,
      incorrectAnswers,
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
            <span>Puntaje:</span>
            <span className={styles.score}>{points}</span>
          </div>
          <div className={styles.infoBox}>
            <span>Tiempo:</span>
            <span className={styles.timer}>{timer} segundos</span>
          </div>
          <div className={styles.infoBox}>
            <span>Diferencias encontradas:</span>
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
              <img src={currentPair.image1} alt={`Imagen ${currentPair.id} Parte 1`} className={styles.image} />
              <img src={currentPair.image2} alt={`Imagen ${currentPair.id} Parte 2`} className={styles.image} />
            </div>

            <div className={styles.buttonContainer}>
              {!isLastPair && (
                <button onClick={handleNextPair} className={styles.nextButton}>
                  Siguiente Par
                </button>
              )}
              <button onClick={handleSubmit} className={styles.submitButton}>
                Enviar Respuesta
              </button>
            </div>

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
                <button onClick={handleEndGame} className={`${styles.dialogButton} ${styles.terminate}`}>
                  Terminar
                </button>
                <button onClick={handleContinuePlaying} className={`${styles.dialogButton} ${styles.continue}`}>
                  Continuar Jugando
                </button>
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
