import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import { useNavigate, useParams } from 'react-router-dom';
import 'react-toastify/dist/ReactToastify.css';
import { useRecordActivityMutation } from '../slices/treatmentSlice';
import { useSelector } from 'react-redux';
import styles from '../assets/styles/ActivityScreen3.module.css'; // Importa el archivo de estilos reutilizado

// Función para generar ecuaciones
const generateEquation = (type) => {
  const num1 = Math.floor(Math.random() * 500) + 500; // Números más grandes para nivel 3
  const num2 = Math.floor(Math.random() * 500) + 500;

  if (type === 'sum') {
    return { equation: `${num1} + ${num2}`, correctAnswer: num1 + num2, num1, num2, operator: '+' };
  } else {
    return { equation: `${num1} - ${num2}`, correctAnswer: num1 - num2, num1, num2, operator: '-' };
  }
};

const Activity3L3Screen = () => {
  const { treatmentId, activityId } = useParams();
  const [equations, setEquations] = useState([]);
  const [currentEquationIndex, setCurrentEquationIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [timer, setTimer] = useState(0);
  const [gameFinished, setGameFinished] = useState(false);
  const [activitySaved, setActivitySaved] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const userInfo = useSelector((state) => state.auth.userInfo);
  const patientId = userInfo?._id;

  const [recordActivity, { isLoading: isRecording, error: recordError }] = useRecordActivityMutation();

  useEffect(() => {
    const generatedEquations = Array(10)
      .fill()
      .map((_, i) => generateEquation(i < 5 ? 'sum' : 'sub'));
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
    if (!userInfo) {
      toast.error('Usuario no autenticado');
      return;
    }

    if (!treatmentId) {
      toast.error('Tratamiento no identificado. No se puede guardar la actividad.');
      return;
    }

    const activityData = {
      activityId,
      scoreObtained: finalScore,
      timeUsed: parseFloat(timer),
      progress: 'mejorando',
      observations: 'El paciente completó la actividad de sumas y restas en nivel avanzado.',
      patientId,
      difficultyLevel: 3,
      image: '',
    };

    try {
      await recordActivity({ treatmentId, activityData }).unwrap();
      toast.success('Actividad guardada correctamente');
    } catch (error) {
      const errorMessage = error?.data?.message || error.message || 'Error desconocido';
      toast.error(`Hubo un problema al guardar la actividad: ${errorMessage}`);
    }
  };

  return (
    <div className={styles.background}>
      <div className={styles.container}>
        <h1 className={styles.title}>Juego de Sumas y Restas - Nivel 3</h1>
        <div className={styles.infoContainer}>
          <div className={styles.infoBox}>
            Puntaje: <span className={styles.score}>{score}</span>
          </div>
          <div className={styles.infoBox}>
            Tiempo: <span className={styles.timer}>{timer} segundos</span>
          </div>
        </div>

        {isRecording && <p className={styles.recording}>Guardando actividad...</p>}
        {recordError && <p className={styles.error}>Error: {recordError?.data?.message || recordError.message}</p>}

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

export default Activity3L3Screen;
