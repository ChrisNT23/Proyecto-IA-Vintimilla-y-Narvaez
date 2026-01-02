// src/screens/ActivityScreenLevel2.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecordActivityMutation } from '../slices/treatmentSlice';
import { useSelector } from 'react-redux';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { proverbsLevel2 } from '../components/proverbsLevel2'; // Asegúrate de la ruta correcta

// Importaciones para react-dnd
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

// Importa el CSS Module correcto
import styles from '../assets/styles/ActivityScreen5.module.css';

// Tipo de ítem para react-dnd
const ItemTypes = {
  OPTION: 'option',
};

// Función para mezclar arrays (Fisher-Yates Shuffle)
const shuffleArray = (array) => {
  const shuffled = [...array];
  for(let i = shuffled.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Componente para las opciones arrastrables
const DraggableOption = ({ option, isPlaced }) => {
  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.OPTION,
    item: { option },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  });

  return (
    <button
      ref={drag}
      className={`${styles.optionButton} ${isPlaced ? styles.placed : ''}`}
      style={{
        opacity: isDragging ? 0.5 : 1,
        cursor: isPlaced ? 'not-allowed' : 'move',
        transform: isDragging ? 'scale(0.8)' : 'scale(1)',
        transition: 'transform 0.2s, opacity 0.2s',
      }}
      disabled={isPlaced}
    >
      {option}
    </button>
  );
};

// Componente para la zona de soltar
const DropZone = ({ onDrop, placedOptions, setPlacedOptions, correctOptionIndex }) => {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ItemTypes.OPTION,
    drop: (item) => onDrop(item.option, correctOptionIndex),
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
      canDrop: !!monitor.canDrop(),
    }),
  });

  return (
    <span
      ref={drop}
      className={`${styles.dropZone} ${isOver && canDrop ? styles.activeDropZone : ''}`}
    >
      {placedOptions[correctOptionIndex] || '___'}
    </span>
  );
};

const ActivityScreenLevel2 = ({ activity, treatmentId }) => {
  const navigate = useNavigate();
  const userInfo = useSelector((state) => state.auth.userInfo);
  const [recordActivity, { isLoading: isRecording, error: recordError }] = useRecordActivityMutation();

  const [selectedProverbs, setSelectedProverbs] = useState([]);
  const [currentProverbIndex, setCurrentProverbIndex] = useState(0);
  const [placedOptions, setPlacedOptions] = useState([]); // Array para múltiples opciones colocadas
  const [shuffledOptions, setShuffledOptions] = useState([]);
  const [score, setScore] = useState(0);
  const [gameFinished, setGameFinished] = useState(false);
  const [timer, setTimer] = useState(0);
  const [message, setMessage] = useState('');
  const [showDialog, setShowDialog] = useState(false); // Definición del estado showDialog

  // Seleccionar 10 frases aleatorias al montar el componente
  useEffect(() => {
    const shuffledProverbs = shuffleArray(proverbsLevel2);
    const selected = shuffledProverbs.slice(0, 10);
    setSelectedProverbs(selected);
  }, []);

  // Iniciar el temporizador al montar el componente
  useEffect(() => {
    let interval;
    if (!gameFinished && selectedProverbs.length > 0) {
      interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameFinished, selectedProverbs]);

  // Navegar a la lista de actividades una vez que el juego haya terminado
  useEffect(() => {
    if (gameFinished) {
      const timeout = setTimeout(() => {
        navigate('/api/treatments/activities');
      }, 6000); // Esperar 6 segundos antes de navegar
      return () => clearTimeout(timeout);
    }
  }, [gameFinished, navigate]);

  // Barajar las opciones al cambiar de refrán
  useEffect(() => {
    if (selectedProverbs.length > 0 && currentProverbIndex < selectedProverbs.length) {
      const currentProverb = selectedProverbs[currentProverbIndex];
      const shuffled = shuffleArray(currentProverb.options);
      setShuffledOptions(shuffled);
      // Inicializar el array de opciones colocadas según el número de faltantes
      const numberOfBlanks = currentProverb.correctOptions.length;
      setPlacedOptions(Array(numberOfBlanks).fill(null));
      setMessage('');
    }
  }, [currentProverbIndex, selectedProverbs]);

  // Función para manejar el soltar una opción
  const handleDrop = (option, index) => {
    // Verificar si la opción ya está colocada en otra zona
    if (placedOptions.includes(option)) {
      toast.error('Esta opción ya está colocada en otra ubicación.');
      return;
    }

    // Reemplazar la opción en el índice correspondiente
    const newPlacedOptions = [...placedOptions];
    newPlacedOptions[index] = option;
    setPlacedOptions(newPlacedOptions);
  };

  // Función para manejar el envío de la respuesta
  const handleSubmitAnswer = () => {
    const currentProverb = selectedProverbs[currentProverbIndex];
    const { correctOptions } = currentProverb;

    // Verificar si todas las opciones colocadas son correctas
    const allCorrect = correctOptions.every(
      (correctOption, idx) => placedOptions[idx] === correctOption
    );

    if (allCorrect) {
      setScore((prevScore) => prevScore + 0.5);
      setMessage("¡Correcto! Has ganado 0.5 puntos.");
    } else {
      setMessage("Incorrecto. No has ganado puntos por esta frase.");
    }

    setTimeout(() => {
      if (currentProverbIndex + 1 < selectedProverbs.length) {
        setCurrentProverbIndex((prevIndex) => prevIndex + 1);
      } else {
        setGameFinished(true);
        saveActivity(score + (allCorrect ? 0.5 : 0));
      }
    }, 2000);
  };

  // Función para guardar la actividad en el backend dentro del tratamiento correspondiente
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
      activityId: activity._id,
      scoreObtained: finalScore,
      timeUsed: timer,
      progress: 'mejorando',
      observations: `El paciente completó la actividad de completar refranes en Nivel 2.`,
    };

    console.log('Guardando actividad con los siguientes datos:', activityData);

    try {
      await recordActivity({ treatmentId, activityData }).unwrap();
      console.log('Actividad guardada correctamente');
      toast.success('Actividad guardada correctamente');
    } catch (error) {
      console.error('Error al guardar la actividad:', error);
      const errorMessage = error?.data?.message || error.message || 'Error desconocido';
      toast.error(`Hubo un problema al guardar la actividad: ${errorMessage}`);
    }
  };

  // Función para renderizar la frase con los espacios
  const renderPhrase = (phrase, correctOptions) => {
    const parts = phrase.split('___');
    return parts.map((part, index) => (
      <span key={index}>
        {part}
        {index < parts.length - 1 && (
          <DropZone
            onDrop={handleDrop}
            placedOptions={placedOptions}
            setPlacedOptions={setPlacedOptions}
            correctOptionIndex={index}
          />
        )}
      </span>
    ));
  };

  // Definir las funciones faltantes para el diálogo (opcional)
  const handleEndGame = () => {
    setShowDialog(false);
    setGameFinished(true);
    saveActivity(score); // Asegúrate de pasar el puntaje correcto
  };

  const handleContinuePlaying = () => {
    setShowDialog(false);
    // Puedes agregar lógica adicional aquí si es necesario
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className={styles.background}>
        <div className={styles.container}>
          <h1 className={styles.title}>Completa los Refranes - Nivel 2</h1>
          <div className={styles.infoContainer}>
            <div className={styles.infoBox}>
              <span>Puntaje:</span>
              <span className={styles.score}>{score}</span>
            </div>
            <div className={styles.infoBox}>
              <span>Tiempo:</span>
              <span className={styles.timer}>{timer} segundos</span>
            </div>
          </div>

          {/* Mostrar estado de guardado de la actividad */}
          {isRecording && <p className={styles.recording}>Guardando actividad...</p>}
          {recordError && <p className={styles.error}>Error: {recordError?.data?.message || recordError.message}</p>}

          {!gameFinished ? (
            <>
              <div className={styles.phraseBox}>
                {selectedProverbs.length > 0 && renderPhrase(selectedProverbs[currentProverbIndex].phrase, selectedProverbs[currentProverbIndex].correctOptions)}
              </div>
              <div className={styles.optionsContainer}>
                {shuffledOptions.map((option, index) => (
                  <DraggableOption
                    key={index}
                    option={option}
                    isPlaced={placedOptions.includes(option)}
                  />
                ))}
              </div>
              <button
                onClick={handleSubmitAnswer}
                className={styles.submitButton}
                disabled={placedOptions.includes(null)}
              >
                Enviar Respuesta
              </button>
              {message && <p className={styles.messageBox}>{message}</p>}
            </>
          ) : (
            <div className={styles.results}>
              <h2 className={styles.gameTitle}>¡Juego Terminado!</h2>
              <p>Puntaje total: {score} / 5</p> {/* 10 frases * 0.5 puntos = 5 puntos */}
              <p>Tiempo total: {timer} segundos</p>
            </div>
          )}

          {/* Diálogo de confirmación (opcional) */}
          {showDialog && (
            <div className={styles.dialogOverlay}>
              <div className={styles.dialogBox}>
                <p>Has encontrado {score} puntos.</p>
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
    </DndProvider>
  );
};

export default ActivityScreenLevel2;
