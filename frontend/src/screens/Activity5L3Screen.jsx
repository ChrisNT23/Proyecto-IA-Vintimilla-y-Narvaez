// src/screens/ActivityScreenLevel3.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecordActivityMutation } from '../slices/treatmentSlice';
import { useSelector } from 'react-redux';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { proverbsLevel3 } from '../components/proverbsLevel3'; // Asegúrate de la ruta correcta

// Importaciones para react-dnd
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

// Importa el CSS Module correcto
import styles from '../assets/styles/Activity5L3Screen.module.css';

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
        transform: isDragging ? 'scale(0.9)' : 'scale(1)',
        transition: 'transform 0.2s, opacity 0.2s',
      }}
      disabled={isPlaced}
    >
      {option}
    </button>
  );
};

// Componente para la zona de soltar (blanco)
const DropZone = ({ placedOption, onDrop }) => {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ItemTypes.OPTION,
    drop: (item) => onDrop(item.option),
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
      canDrop: !!monitor.canDrop(),
    }),
  });

  const isActive = isOver && canDrop;

  return (
    <span
      ref={drop}
      className={`${styles.dropZone} ${isActive ? styles.activeDropZone : ''}`}
    >
      {placedOption || '___'}
    </span>
  );
};

const ActivityScreenLevel3 = ({ activity, treatmentId }) => {
  const navigate = useNavigate();
  const userInfo = useSelector((state) => state.auth.userInfo);
  const [recordActivity, { isLoading: isRecording, error: recordError }] = useRecordActivityMutation();

  const [selectedProverbs, setSelectedProverbs] = useState([]);
  const [currentProverbIndex, setCurrentProverbIndex] = useState(0);
  const [placedOptions, setPlacedOptions] = useState([]); // Array para opciones colocadas
  const [shuffledOptions, setShuffledOptions] = useState([]);
  const [score, setScore] = useState(0);
  const [gameFinished, setGameFinished] = useState(false);
  const [timer, setTimer] = useState(0);
  const [message, setMessage] = useState('');

  // Seleccionar 10 frases aleatorias al montar el componente
  useEffect(() => {
    const shuffledProverbs = shuffleArray(proverbsLevel3);
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

  // Función para manejar el soltar una opción en un espacio
  const handleDrop = (option, index) => {
    // Verificar si la opción ya está colocada en otro espacio
    const alreadyPlacedIndex = placedOptions.findIndex((placed) => placed === option);
    if (alreadyPlacedIndex !== -1) {
      toast.error('Esta opción ya está colocada en otra ubicación.');
      return;
    }

    const newPlacedOptions = [...placedOptions];
    newPlacedOptions[index] = option;
    setPlacedOptions(newPlacedOptions);
  };

  // Función para manejar el envío de la respuesta
  const handleSubmitAnswer = () => {
    const currentProverb = selectedProverbs[currentProverbIndex];
    const { correctOptions } = currentProverb;

    // Verificar si todas las opciones colocadas son correctas y en orden
    const allCorrect = correctOptions.every(
      (correctOption, idx) => placedOptions[idx] === correctOption
    );

    if (allCorrect) {
      setScore((prevScore) => prevScore + 0.5);
      setMessage(`¡Correcto! Has ganado 0.5 puntos.`);
    } else {
      setMessage(`Incorrecto. No has ganado puntos por esta frase.`);
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
      observations: `El paciente completó la actividad de armar refranes en Nivel 3.`,
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

  // Función para renderizar los espacios con DropZones
  const renderPhrase = (phrase, index) => {
    return (
      <span key={index}>
        {phrase.split('___').map((part, idx) => (
          <span key={idx}>
            {part}
            {idx < phrase.split('___').length - 1 && (
              <DropZone
                placedOption={placedOptions[idx]}
                onDrop={(option) => handleDrop(option, idx)}
              />
            )}
          </span>
        ))}
      </span>
    );
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className={styles.background}>
        <div className={styles.container}>
          <h1 className={styles.title}>Arma el Refrán - Nivel 3</h1>
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
                {selectedProverbs.length > 0 && renderPhrase(selectedProverbs[currentProverbIndex].phrase)}
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
            <div className={styles.gameFinished}>
            <h2>¡Juego terminado!</h2>
            <p>Tiempo total: <strong>{timer}</strong> segundos</p>
            <p>Puntaje final: <strong>{score}</strong></p>
            <button 
              className={styles.finishButton}
              onClick={() => navigate('/api/treatments/activities')}
            >
              Volver a Actividades
            </button>
          </div>
          )}
        </div>
        <ToastContainer />
      </div>
    </DndProvider>
  );
};

export default ActivityScreenLevel3;
