// src/screens/Activity3L2Screen.jsx

import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import { useNavigate, useParams } from 'react-router-dom'; 
import 'react-toastify/dist/ReactToastify.css';
import { useRecordActivityMutation } from '../slices/treatmentSlice'; // Importa el hook de mutación
import { useSelector } from 'react-redux';
import styles from '../assets/styles/ActivityScreen3.module.css'; // Reutilizamos el mismo archivo de estilos

// Función para generar ecuaciones
const generateEquation = (type) => {
  const num1 = Math.floor(Math.random() * 450) + 50;  // Números más grandes para nivel 2
  const num2 = Math.floor(Math.random() * 450) + 50;

  if (type === 'sum') {
    return { equation: `${num1} + ${num2}`, correctAnswer: num1 + num2, num1, num2, operator: '+' };
  } else {
    return { equation: `${num1} - ${num2}`, correctAnswer: num1 - num2, num1, num2, operator: '-' };
  }
};

const Activity3L2Screen = () => {
  const { treatmentId, activityId } = useParams(); // Extrae treatmentId y activityId de la ruta
  const [equations, setEquations] = useState([]);
  const [currentEquationIndex, setCurrentEquationIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [timer, setTimer] = useState(0);
  const [gameFinished, setGameFinished] = useState(false);
  const [activitySaved, setActivitySaved] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  // Obtener información del usuario autenticado desde el estado de Redux
  const userInfo = useSelector((state) => state.auth.userInfo);
  const patientId = userInfo?._id;

  // Hook de la mutación para registrar actividad
  const [recordActivity, { isLoading: isRecording, error: recordError }] = useRecordActivityMutation();

  useEffect(() => {
    // Generar ecuaciones al inicio
    const generatedEquations = [
      generateEquation('sum'),
      generateEquation('sum'),
      generateEquation('sum'),
      generateEquation('sum'),
      generateEquation('sub'),
      generateEquation('sub'),
      generateEquation('sub'),
      generateEquation('sub'),
    ];
    setEquations(generatedEquations);
  }, []);

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
    if (gameFinished && !activitySaved) {
      saveActivity(score);
      setActivitySaved(true);

      setTimeout(() => {
        navigate('/api/treatments/activities');
      }, 6000);
    }
  }, [gameFinished, activitySaved, score, navigate]);

  const handleSubmitAnswer = () => {
    const currentEquation = equations[currentEquationIndex];
    const correctAnswer = currentEquation.correctAnswer;

    // Validar que el usuario haya ingresado una respuesta
    if (userAnswer.trim() === '') {
      setMessage('Por favor, ingresa una respuesta antes de continuar.');
      return;
    }

    if (parseInt(userAnswer, 10) === correctAnswer) {
      setScore((prevScore) => prevScore + 5);
      setMessage('¡Correcto! Ganaste 5 puntos.');
    } else {
      setScore((prevScore) => prevScore - 2);
      setMessage(`Incorrecto. La respuesta correcta es ${correctAnswer}. Perdiste 2 puntos.`);
    }

    setUserAnswer('');
    setTimeout(() => processNextStep(), 3000);
  };

  const processNextStep = () => {
    const nextEquationIndex = currentEquationIndex + 1;

    if (nextEquationIndex === equations.length) {
      setGameFinished(true);
    } else {
      setCurrentEquationIndex(nextEquationIndex);
      setMessage('');
    }
  };

  const saveActivity = async (finalScore) => {
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
      scoreObtained: finalScore,
      timeUsed: parseFloat(timer), 
      progress: 'mejorando',
      observations: 'El paciente completó la actividad de sumas y restas en nivel intermedio.',
      patientId, // ID del paciente desde el estado de Redux
      difficultyLevel: 2, // Nivel de dificultad
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
        <h1 className={styles.title}>Juego de Sumas y Restas - Nivel 2</h1>
        <div className={styles.infoContainer}>
          <div className={styles.infoBox}>
            Puntaje: <span className={styles.score}>{score}</span>
          </div>
          <div className={styles.infoBox}>
            Tiempo: <span className={styles.timer}>{timer} segundos</span>
          </div>
        </div>

        {/* Mostrar estado de guardado de la actividad */}
        {isRecording && <p className={styles.recording}>Guardando actividad...</p>}
        {recordError && <p className={styles.error}>Error: {recordError?.data?.message || recordError.message}</p>}

        {/* Mostrar contenido del juego o mensaje de finalización */}
        {gameFinished ? (
          <div className={styles.gameFinished}>
            <h2 className={styles.gameTitle}>¡Juego Terminado!</h2>
            <p>Tiempo total: {timer} segundos</p>
            <p>Puntaje final: {score}</p>
          </div>
        ) : (
          <>
            <div className={styles.equation}>
              <div className={styles.equationContent}>
                <div className={styles.number}>{equations[currentEquationIndex]?.num1}</div>
                <div className={styles.operator}>{equations[currentEquationIndex]?.operator} {equations[currentEquationIndex]?.num2}</div>
                <hr className={styles.line} />
                <input
                  type="number"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder="?"
                  className={styles.answerInput}
                  disabled={gameFinished}
                />
              </div>
              <button onClick={handleSubmitAnswer} disabled={gameFinished} className={styles.submitButton}>
                Responder
              </button>
            </div>

            {/* Mostrar mensaje de retroalimentación */}
            {message && (
              <div className={styles.messageBox}>
                <p>{message}</p>
              </div>
            )}
          </>
        )}
      </div>
      <ToastContainer />
    </div>
  );
};

export default Activity3L2Screen;
