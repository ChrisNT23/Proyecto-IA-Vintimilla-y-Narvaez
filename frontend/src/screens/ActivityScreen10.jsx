// src/screens/ActivityWordSearchLevel1.jsx

import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';

import Board from '../utils/Board.jsx';
import { createWordSearchBoardLevel1 } from '../utils/createWordSearchBoardLevel1';
import { useRecordActivityMutation, useGetActiveTreatmentQuery } from '../slices/treatmentSlice';

import 'react-toastify/dist/ReactToastify.css';
import styles from '../assets/styles/ActivityWordSearch.module.css'; // Define estilos específicos

const ActivityWordSearchLevel1 = () => {
  const navigate = useNavigate();
  const { activityId } = useParams();
  const userInfo = useSelector((state) => state.auth.userInfo);
  const userId = userInfo?._id;

  const {
    data: activeTreatment,
    isLoading: isTreatmentLoading,
    error: treatmentError,
  } = useGetActiveTreatmentQuery(userId, {
    skip: !userId,
  });

  const [recordActivity, { isLoading: isRecording }] = useRecordActivityMutation();
  const [boardData, setBoardData] = useState({ board: [], selectedWords: [] });
  const [foundWords, setFoundWords] = useState([]);
  const [highlightedPositions, setHighlightedPositions] = useState([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedCells, setSelectedCells] = useState([]);
  const [timer, setTimer] = useState(0);

  const miliseconds = (timer / 10).toFixed(2);

  useEffect(() => {
    const { board, selectedWords } = createWordSearchBoardLevel1(10); // Tablero 10x10
    setBoardData({ board, selectedWords });
  }, []);

  useEffect(() => {
    if (foundWords.length < 5) {
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
    if (foundWords.length === 5) {
      saveActivity();
    }
  }, [foundWords]);

  const saveActivity = async () => {
    try {
      if (!userInfo || isTreatmentLoading || !activeTreatment) {
        toast.error('Error al guardar la actividad.');
        return;
      }

      const scoreObtained = foundWords.length; // 1 punto por palabra

      const activityData = {
        activityId,
        scoreObtained,
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

  return (
    <div className={styles.background}>
      <div className={styles.container}>
        <h1 className={styles.title}>Nivel 1: Encuentra 5 palabras</h1>
        <div className={styles.infoContainer}>
          <div className={styles.infoBox}>
            <span>Tiempo:</span> <span className={styles.timer}>{miliseconds} seg</span>
          </div>
          <div className={styles.infoBox}>
            <span>Palabras encontradas:</span> <span>{foundWords.length} / 5</span>
          </div>
          <div className={styles.infoBox}>
            <span>Puntaje:</span> <span>{foundWords.length} / 5</span>
          </div>
        </div>
        <div className={styles.gameArea}>
          <Board
            board={board}
            highlightedPositions={highlightedPositions}
            onCellMouseDown={handleCellMouseDown}
            onCellMouseEnter={handleCellMouseEnter}
            onCellMouseUp={handleCellMouseUp}
          />
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
        <ToastContainer />
      </div>
    </div>
  );
};

export default ActivityWordSearchLevel1;
