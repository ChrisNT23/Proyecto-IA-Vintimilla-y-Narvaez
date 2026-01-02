// src/screens/ActivityScreen5.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecordActivityMutation } from '../slices/treatmentSlice';
import { useSelector } from 'react-redux';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { proverbsLevel1 } from '../components/proverbsLevel1';

// Importaciones para react-dnd
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

// Importa el CSS Module
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
const DropZone = ({ onDrop, placedOption, setPlacedOption }) => {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ItemTypes.OPTION,
    drop: (item) => onDrop(item.option),
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
      {placedOption || '___'}
    </span>
  );
};

const ActivityScreen5 = ({ activity, treatmentId }) => {
  const navigate = useNavigate();
  const userInfo = useSelector((state) => state.auth.userInfo);
  const [recordActivity, { isLoading: isRecording, error: recordError }] = useRecordActivityMutation();

  const [selectedProverbs, setSelectedProverbs] = useState([]);
  const [currentProverbIndex, setCurrentProverbIndex] = useState(0);
  const [placedOption, setPlacedOption] = useState(null);
  const [shuffledOptions, setShuffledOptions] = useState([]);
  const [score, setScore] = useState(0);
  const [gameFinished, setGameFinished] = useState(false);
  const [timer, setTimer] = useState(0);
  const [message, setMessage] = useState('');
  const [showDialog, setShowDialog] = useState(false); // Definición del estado showDialog

  // Seleccionar 10 frases aleatorias al montar el componente
  useEffect(() => {
    const shuffledProverbs = shuffleArray(proverbsLevel1);
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
      setPlacedOption(null);
      setMessage('');
    }
  }, [currentProverbIndex, selectedProverbs]);

  // Función para manejar el soltar una opción
  const handleDrop = (option) => {
    // Si ya hay una opción colocada, permitir reemplazarla
    if (placedOption) {
      // Si la opción colocada es la misma que se está intentando soltar, no hacer nada
      if (placedOption === option) {
        return;
      }
      // Reemplazar la opción colocada con la nueva
      setPlacedOption(option);
    } else {
      setPlacedOption(option);
    }
  };

  // Función para manejar el envío de la respuesta
  const handleSubmitAnswer = () => {
    const currentProverb = selectedProverbs[currentProverbIndex];
    if (placedOption === currentProverb.correctOption) {
      setScore((prevScore) => prevScore + 0.5);
      setMessage("¡Correcto! Has ganado 0.5 puntos.");
    } else {
      setMessage(`Incorrecto. La respuesta correcta es: "${currentProverb.correctOption}".`);
    }

    setTimeout(() => {
      if (currentProverbIndex + 1 < selectedProverbs.length) {
        setCurrentProverbIndex((prevIndex) => prevIndex + 1);
      } else {
        setGameFinished(true);
        saveActivity(score + (placedOption === selectedProverbs[currentProverbIndex].correctOption ? 0.5 : 0));
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
      observations: `El paciente completó la actividad de completar refranes en Nivel 1.`,
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

  // Función para renderizar la frase con el espacio
  const renderPhrase = (phrase) => {
    return phrase.split('___').map((part, index) => (
      <span key={index}>
        {part}
        {index < phrase.split('___').length - 1 && (
          <DropZone onDrop={handleDrop} placedOption={placedOption} setPlacedOption={setPlacedOption} />
        )}
      </span>
    ));
  };

  // Definir las funciones faltantes
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
          <h1 className={styles.title}>Completa los Refranes - Nivel 1</h1>
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
                    isPlaced={placedOption === option}
                  />
                ))}
              </div>
              <button
                onClick={handleSubmitAnswer}
                className={styles.submitButton}
                disabled={!placedOption}
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

          {/* Diálogo de confirmación */}
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

export default ActivityScreen5;
