// src/screens/Activity1L2Screen.jsx

import React, { useState, useEffect } from 'react';
import { createBoard } from '../utils/createBoard2.js';
import Cell from '../components/Activity 1/Cell';
import { useNavigate, useParams } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useRecordActivityMutation } from '../slices/treatmentSlice';
import { useSelector } from 'react-redux';
import styles from '../assets/styles/Activity1L2Screen.module.css';

const Activity1L2Screen = () => {
  const { treatmentId, activityId } = useParams();
  const [board, setBoard] = useState(() => createBoard(2));
  const [gamesToWin, setGamesToWin] = useState(5);
  const [timer, setTimer] = useState(0);
  const miliseconds = parseFloat((timer / 10).toFixed(2)); // Convertir a número
  const navigate = useNavigate();

  const userInfo = useSelector((state) => state.auth.userInfo);
  const [recordActivity, { isLoading: isRecording, error: recordError }] = useRecordActivityMutation();

  useEffect(() => {
    let interval;
    if (gamesToWin > 0) {
      interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer + 1);
      }, 100);
    }
    return () => clearInterval(interval);
  }, [gamesToWin]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleClick = (row, col) => {
    if (board[row][col].isHidden) {
      setGamesToWin(gamesToWin - 1);

      if (gamesToWin > 1) {
        setTimeout(() => setBoard(createBoard(2)), 500);
      } else if (gamesToWin === 1) {
        saveActivity(5, miliseconds); // Usar miliseconds en lugar de timer
      }
    }
  };

  const saveActivity = async (finalScore, timeUsed) => {
    if (!userInfo) {
      toast.error('Usuario no autenticado');
      return;
    }

    if (!treatmentId || !activityId) {
      toast.error('Tratamiento o Actividad no identificados. No se puede guardar la actividad.');
      return;
    }

    const activityData = {
      activityId: activityId,
      scoreObtained: finalScore,
      timeUsed: timeUsed, // Ya es un número
      progress: 'mejorando',
      observations: 'El paciente completó la actividad de búsqueda de letras nivel 2.',
    };

    console.log('Guardando actividad con los siguientes datos:', activityData);

    try {
      await recordActivity({ treatmentId, activityData }).unwrap();
      console.log('Actividad guardada correctamente');
      toast.success('Actividad guardada correctamente');
      setTimeout(() => navigate('/api/treatments/activities'), 6000);
    } catch (error) {
      console.error('Error al guardar la actividad:', error);
      const errorMessage = error?.data?.message || error.message || 'Error desconocido';
      toast.error(`Hubo un problema al guardar la actividad: ${errorMessage}`);
    }
  };

  return (
    <div className={styles.background}>
      <div className={styles.container}>
        <h1 className={styles.title}>Encuentra la letra (Nivel 2)</h1>
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
        {recordError && <p className={styles.error}>Error: {recordError?.data?.message || recordError.message}</p>}

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

export default Activity1L2Screen;
