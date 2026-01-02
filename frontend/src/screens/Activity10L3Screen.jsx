// src/screens/ActivityWordSearchLevel3.jsx

import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import io from 'socket.io-client';

// Importa el Board (con celdas) desde utils 
import Board from '../utils/Board.jsx'; // Asegúrate de que la ruta sea correcta

// Importa la función para generar el tablero y las palabras
import { createWordSearchBoardLevel3 } from '../utils/createWordSearchBoard2.js';

// Importa tus hooks de RTK Query/MERN
import { useRecordActivityMutation, useGetActiveTreatmentQuery } from '../slices/treatmentSlice';

// Estilos
import 'react-toastify/dist/ReactToastify.css';
import styles from '../assets/styles/ActivityWordSearch.module.css';

const ActivityWordSearchLevel3 = () => {
  const navigate = useNavigate();
  const { activityId } = useParams();
  const userInfo = useSelector((state) => state.auth.userInfo);
  const userId = userInfo?._id;

  // RTK Query para tratamiento activo
  const {
    data: activeTreatment,
    isLoading: isTreatmentLoading,
    error: treatmentError,
  } = useGetActiveTreatmentQuery(userId, {
    skip: !userId,
  });

  // Mutación para guardar actividad
  const [recordActivity, { isLoading: isRecording }] = useRecordActivityMutation();
  const [boardData, setBoardData] = useState({ board: [], selectedWords: [] });
  const [foundWords, setFoundWords] = useState([]);
  const [highlightedPositions, setHighlightedPositions] = useState([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedCells, setSelectedCells] = useState([]);
  const [timer, setTimer] = useState(0);

  const miliseconds = (timer / 10).toFixed(2);

  useEffect(() => {
    const { board, selectedWords } = createWordSearchBoardLevel3(20); // Tablero 20x20
    setBoardData({ board, selectedWords });
  }, []);

  useEffect(() => {
    if (foundWords.length < 15) {
      const interval = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 100);
      return () => clearInterval(interval);
    }
  }, [foundWords]);

  const handleCellMouseDown = (e, row, col) => {
    e.preventDefault();
    setIsSelecting(true);
    setSelectedCells([{ row, col }]);
  };

  const handleCellMouseEnter = (e, row, col) => {
    e.preventDefault();
    if (isSelecting) {
      setSelectedCells((prev) => [...prev, { row, col }]);
    }
  };

  const handleCellMouseUp = (e) => {
    e.preventDefault();
    setIsSelecting(false);

    setTimeout(() => checkSelectedCells(), 0);
  };

  const checkSelectedCells = () => {
    if (selectedCells.length < 2) {
      setSelectedCells([]);
      return;
    }

    let sortedCells = [...selectedCells].sort((a, b) => {
      if (a.row === b.row) return a.col - b.col;
      return a.row - b.row;
    });

    const letters = sortedCells.map(
      (pos) => boardData.board[pos.row][pos.col]
    );
    const formedString = letters.join('');

    const allInSameRow = sortedCells.every((c) => c.row === sortedCells[0].row);
    const allInSameCol = sortedCells.every((c) => c.col === sortedCells[0].col);

    let isValidSequence = false;
    if (allInSameRow || allInSameCol) {
      isValidSequence = true;
    }

    if (isValidSequence && boardData.selectedWords.includes(formedString)) {
      if (!foundWords.includes(formedString)) {
        setFoundWords((prev) => [...prev, formedString]);
        setHighlightedPositions((prev) => [...prev, ...sortedCells]);
      }
    }

    setSelectedCells([]);
  };

  useEffect(() => {
    if (foundWords.length === 15) {
      saveActivity();
    }
  }, [foundWords]);

  const saveActivity = async () => {
    try {
      if (!userInfo || isTreatmentLoading || !activeTreatment) {
        toast.error('Error al guardar la actividad.');
        return;
      }

      // Cálculo del puntaje: 15 palabras x 0.3333 = 5 puntos
      const scoreObtained = foundWords.length * 0.3333;

      const activityData = {
        activityId,
        scoreObtained: parseFloat(scoreObtained.toFixed(2)), // Redondear a 2 decimales
        timeUsed: parseFloat(miliseconds),
        progress: 'mejorando',
        observations: 'Actividad completada satisfactoriamente.',
      };

      await recordActivity({
        treatmentId: activeTreatment._id,
        activityData,
      }).unwrap();

      toast.success('Actividad guardada correctamente.');
      setTimeout(() => navigate('/api/treatments/activities'), 6000);
    } catch (error) {
      console.error('Error:', error);
      toast.error('No se pudo guardar la actividad.');
    }
  };

  const { board, selectedWords } = boardData;

  // Manejo de Socket.io (opcional)
  useEffect(() => {
    if (!userInfo || !activeTreatment?._id) {
      console.warn('El usuario o el tratamiento activo no están definidos');
      return;
    }

    const socket = io('http://localhost:5000'); // Asegúrate de que la URL sea correcta
    socket.on('connect', () => {
      console.log('Conectado al servidor de Socket.io con ID:', socket.id);
    });

    socket.on(`treatmentActivitiesUpdated:${activeTreatment._id}`, (data) => {
      console.log(`Evento treatmentActivitiesUpdated recibido para el tratamiento ${activeTreatment._id}`, data);
      // Aquí podrías refrescar la lista de actividades, etc.
    });

    socket.on('disconnect', () => {
      console.log('Desconectado del servidor de Socket.io');
    });

    return () => {
      socket.disconnect();
      console.log('Socket desconectado en cleanup');
    };
  }, [userInfo, activeTreatment]);

  return (
    <div className={styles.background}>
      <div className={styles.container}>
        <h1 className={styles.title}>Nivel 3: Palabras Largas</h1>
        <div className={styles.infoContainer}>
          <div className={styles.infoBox}>
            <span>Tiempo:</span> <span className={styles.timer}>{miliseconds} seg</span>
          </div>
          <div className={styles.infoBox}>
            <span>Palabras encontradas:</span> <span>{foundWords.length} / 15</span>
          </div>
          <div className={styles.infoBox}>
            <span>Puntaje:</span> <span>{(foundWords.length * 0.3333).toFixed(2)} / 5</span>
          </div>
        </div>
        <div className={styles.gameArea}>
          {/* Tablero con eventos */}
          <Board
            board={board}
            highlightedPositions={highlightedPositions}
            onCellMouseDown={handleCellMouseDown}
            onCellMouseEnter={handleCellMouseEnter}
            onCellMouseUp={handleCellMouseUp}
          />
          {/* Lista de palabras por encontrar */}
          <div className={styles.wordList}>
            <h2>Palabras por encontrar:</h2>
            <ul>
              {selectedWords.map((word) => (
                <li key={word} className={foundWords.includes(word) ? styles.found : ''}>
                  {word}
                </li>
              ))}
            </ul>
          </div>
        </div>
        {foundWords.length === 15 && (
          <div className={styles.gameFinished}>
            <h2>¡Felicidades!</h2>
            <p>Tiempo: <strong>{miliseconds} seg</strong></p>
            <p>Puntaje final: <strong>5</strong></p>
            <button
              className={styles.finishButton}
              onClick={() => navigate('/api/treatments/activities')}
            >
              Volver a Actividades
            </button>
          </div>
        )}
        <ToastContainer />
      </div>
    </div>
  );
};

export default ActivityWordSearchLevel3;
