import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useRecordActivityMutation } from '../slices/treatmentSlice';
import { useSelector } from 'react-redux';

// Importa las imágenes
import fresa from '../images/fresa.jpg';
import arandanos from '../images/arandanos.jpg';
import kywi from '../images/Kywi.jpg';
import limon from '../images/limon.jpg';
import mango from '../images/mango.jpg';

// Importa el CSS Module
import styles from '../assets/styles/ActivityScreen7.module.css';

const images = [
  { id: 1, src: fresa },
  { id: 2, src: arandanos },
  { id: 3, src: kywi },
  { id: 4, src: limon },
  { id: 5, src: mango },
];

const shuffle = (array) => {
  return array.sort(() => Math.random() - 0.5);
};

const ActivityScreen7 = ({ activity, treatmentId }) => {
  const [cards, setCards] = useState(shuffle([...images, ...images])); // Duplicar y mezclar las imágenes
  const [flippedCards, setFlippedCards] = useState([]);
  const [matchedCards, setMatchedCards] = useState([]);
  const [score, setScore] = useState(0);
  const [gameFinished, setGameFinished] = useState(false);
  const [timer, setTimer] = useState(0);
  const navigate = useNavigate();

  const userInfo = useSelector((state) => state.auth.userInfo);

  // Hook para registrar la actividad
  const [recordActivity, { isLoading: isRecording, error: recordError }] =
    useRecordActivityMutation();

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
    if (matchedCards.length === images.length * 2) {
      setGameFinished(true);
      toast.success('¡Juego Terminado!');
      saveActivity(score, timer);

      setTimeout(() => {
        navigate('/api/treatments/activities');
      }, 6000);
    }
  }, [matchedCards, navigate, score, timer]);

  const handleCardClick = (index) => {
    if (flippedCards.length === 2 || flippedCards.includes(index) || matchedCards.includes(index)) {
      return;
    }

    const newFlippedCards = [...flippedCards, index];
    setFlippedCards(newFlippedCards);

    if (newFlippedCards.length === 2) {
      const [firstIndex, secondIndex] = newFlippedCards;
      if (cards[firstIndex].src === cards[secondIndex].src) {
        setMatchedCards((prev) => [...prev, firstIndex, secondIndex]);
        setScore((prevScore) => prevScore + 5);
        setFlippedCards([]);
        toast.success('¡Correcto! +5 puntos');
      } else {
        setScore((prevScore) => prevScore - 2);
        toast.error('Incorrecto. -2 puntos');
        setTimeout(() => {
          setFlippedCards([]);
        }, 1000);
      }
    }
  };

  const saveActivity = async (finalScore, timeUsed) => {
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
      timeUsed: timeUsed,
      progress: 'mejorando',
      observations: `El paciente completó el Juego de Memoria con una puntuación de ${finalScore} y tiempo de ${timeUsed} segundos.`,
    };

    try {
      await recordActivity({ treatmentId, activityData }).unwrap();
      toast.success('Actividad guardada correctamente');
    } catch (error) {
      const errorMessage = error?.data?.message || error.message || 'Error desconocido';
      toast.error(`Error al guardar la actividad: ${errorMessage}`);
    }
  };

  return (
    <div className={styles.background}>
      <div className={styles.container}>
        <h1 className={styles.title}>Juego de Memoria</h1>
        <div className={styles.infoContainer}>
          <div className={styles.infoBox}>
            <span>Puntuación:</span>
            <span className={styles.score}>{score}</span>
          </div>
          <div className={styles.infoBox}>
            <span>Tiempo:</span>
            <span className={styles.timer}>{timer} segundos</span>
          </div>
        </div>

        {!gameFinished ? (
          <div className={styles.memoryCardsContainer}>
            {cards.map((card, index) => (
              <div
                key={index}
                className={`${styles.memoryCard} ${
                  flippedCards.includes(index) || matchedCards.includes(index) ? styles.flipped : ''
                }`}
                onClick={() => handleCardClick(index)}
              >
                <div className={styles.memoryCardInner}>
                  <div className={styles.memoryCardBack}></div>
                  <div className={styles.memoryCardFront}>
                    <img src={card.src} alt={`Card ${card.id}`} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.gameFinished}>
            <h2 className={styles.gameTitle}>¡Juego terminado!</h2>
            <p>Tiempo total: {timer} segundos</p>
            <p>Puntaje final: {score}</p>
          </div>
        )}
      </div>
      <ToastContainer />
    </div>
  );
};

export default ActivityScreen7;
