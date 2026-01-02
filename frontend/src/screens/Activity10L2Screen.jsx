// src/screens/ActivityWordSearch.jsx

import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import io from 'socket.io-client';

// Importa el Board (con celdas) desde utils 
import Board from '../utils/Board.jsx'; // Asegúrate de que la ruta sea correcta

// Importa la función para generar el tablero y las palabras
import { createWordSearchBoard } from '../utils/createWordSearchBoard.js';

// Importa tus hooks de RTK Query/MERN
import { useRecordActivityMutation, useGetActiveTreatmentQuery } from '../slices/treatmentSlice';

// Estilos
import 'react-toastify/dist/ReactToastify.css';
import styles from '../assets/styles/ActivityWordSearch.module.css'; 

const ActivityWordSearch = () => {
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

  // Timer
  const [timer, setTimer] = useState(0);
  const miliseconds = (timer / 10).toFixed(2);

  // Al montar, generamos un nuevo tablero
  useEffect(() => {
    const { board, selectedWords } = createWordSearchBoard(12);
    setBoardData({ board, selectedWords });
  }, []);

  // Cronómetro
  useEffect(() => {
    if (foundWords.length < 10) {
      const interval = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 100);
      return () => clearInterval(interval);
    }
  }, [foundWords]);

  // Manejadores de selección
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

  const handleCellMouseUp = (e, row, col) => {
    e.preventDefault();
    setIsSelecting(false);
    setSelectedCells((prev) => [...prev, { row, col }]);

    // Cuando termina la selección, verificamos si corresponde a alguna palabra
    setTimeout(() => checkSelectedCells(), 0);
  };

  /**
   * Verifica si las celdas seleccionadas forman alguna palabra en la lista de `boardData.selectedWords`.
   * Por simplicidad, checamos:
   *  - Si están todas en la misma fila.
   *  - O si están todas en la misma columna.
   *  - Y en orden normal (sin invertir).
   */
  const checkSelectedCells = () => {
    if (selectedCells.length < 2) {
      // Necesitamos al menos 2 letras para formar palabra
      setSelectedCells([]);
      return;
    }

    // 1. Normalizar la selección en orden (del menor row/col al mayor)
    //    Para detectar la dirección.
    let sortedCells = [...selectedCells].sort((a, b) => {
      if (a.row === b.row) {
        return a.col - b.col;
      }
      return a.row - b.row;
    });

    // Extraer las letras
    const letters = sortedCells.map(
      (pos) => boardData.board[pos.row][pos.col]
    );
    const formedString = letters.join('');

    // Checar si es horizontal o vertical sin saltos
    const allInSameRow = sortedCells.every((c) => c.row === sortedCells[0].row);
    const allInSameCol = sortedCells.every((c) => c.col === sortedCells[0].col);

    let isValidSequence = false;
    if (allInSameRow) {
      // Revisamos que las columnas sean consecutivas
      for (let i = 0; i < sortedCells.length - 1; i++) {
        if (sortedCells[i + 1].col - sortedCells[i].col !== 1) {
          // Salto
          isValidSequence = false;
          break;
        } else {
          isValidSequence = true;
        }
      }
    } else if (allInSameCol) {
      // Revisamos que las filas sean consecutivas
      for (let i = 0; i < sortedCells.length - 1; i++) {
        if (sortedCells[i + 1].row - sortedCells[i].row !== 1) {
          // Salto
          isValidSequence = false;
          break;
        } else {
          isValidSequence = true;
        }
      }
    }

    // 2. Si es una secuencia válida (horizontal o vertical) y la palabra formada existe en selectedWords
    //    y no está marcada como encontrada, la marcamos.
    if (isValidSequence && boardData.selectedWords.includes(formedString)) {
      if (!foundWords.includes(formedString)) {
        // Nueva palabra encontrada
        setFoundWords((prev) => [...prev, formedString]);
        setHighlightedPositions((prev) => [...prev, ...sortedCells]);
      }
    }

    // Finalmente, limpiamos la selección
    setSelectedCells([]);
  };

  // Si ya encontramos las 10 palabras, guardamos la actividad
  useEffect(() => {
    if (foundWords.length === 10) {
      saveActivity();
    }
    // eslint-disable-next-line
  }, [foundWords]);

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

      // 10 palabras x 0.5 = 5 puntos
      const activityData = {
        activityId: activityId,
        scoreObtained: 5,
        timeUsed: parseFloat(miliseconds),
        progress: 'mejorando',
        observations: 'Actividad completada satisfactoriamente.',
      };

      await recordActivity({
        treatmentId: activeTreatment._id,
        activityData,
      }).unwrap();

      toast.success('¡Felicidades! Has encontrado todas las palabras. Actividad guardada.');
      setTimeout(() => navigate('/api/treatments/activities'), 6000);
    } catch (error) {
      console.error('Error al guardar la actividad:', error);
      const errorMessage = error?.data?.message || error.message || 'Error desconocido';
      toast.error(`Hubo un problema al guardar la actividad: ${errorMessage}`);
    }
  };

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

  const { board, selectedWords } = boardData;

  return (
    <div className={styles.background}>
      <div className={styles.container}>
        <h1 className={styles.title}>Sopa de Letras en Español</h1>

        <div className={styles.infoContainer}>
          <div className={styles.infoBox}>
            <span>Tiempo:</span> <span className={styles.timer}>{miliseconds} seg</span>
          </div>
          <div className={styles.infoBox}>
            <span>Palabras encontradas:</span> <span>{foundWords.length} / 10</span>
          </div>
          <div className={styles.infoBox}>
            <span>Puntaje:</span> <span>{foundWords.length} / 10</span>
          </div>
        </div>

        {isRecording && <p className={styles.recording}>Guardando actividad...</p>}
        {isTreatmentLoading && <p className={styles.loading}>Cargando tratamiento activo...</p>}
        {treatmentError && <p className={styles.error}>Error: {treatmentError.message}</p>}

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
            <h2>Encuentra estas palabras:</h2>
            <ul>
              {selectedWords.map((w) => (
                <li 
                  key={w}
                  className={foundWords.includes(w) ? styles.found : ''}
                >
                  {w}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {foundWords.length === 10 && (
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

export default ActivityWordSearch;
