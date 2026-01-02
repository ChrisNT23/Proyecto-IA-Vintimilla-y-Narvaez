// src/screens/ActivityScreen2.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom'; 
import { useRecordActivityMutation } from '../slices/treatmentSlice';
import { useSelector } from 'react-redux';
import 'react-toastify/dist/ReactToastify.css';
import styles from '../assets/styles/ActivityScreen2.module.css'; // Importa los estilos

// Importa las imágenes (asegúrate de corregir duplicados y rutas)
import pizzaImg from '../images/pizza.png';
import cafeImg from '../images/cafe.png';
import mariposaImg from '../images/mariposa.png';
import osoImg from '../images/oso.png';
import ensaladaImg from '../images/ensalada.png';
import gatoImg from '../images/gato.png';
import perroImg from '../images/perro.png';
import florImg from '../images/flor.png';
import celularImg from '../images/celular.png';
import almohadaImg from '../images/almohada.png';
import cargadorImg from '../images/cargador.png';
import audifonosImg from '../images/audifonos.png';
import chompaImg from '../images/chompa.png';
import hotdogImg from '../images/hotdog.png'; // Corregido
import jeansImg from '../images/jeans.png';
import jugoImg from '../images/jugo.png';
import mochilaImg from '../images/mochila.png';
import sillaImg from '../images/silla.png';
import camaraImg from '../images/camara.png';
import lenteImg from '../images/lente.png';

// Función de barajado (Fisher-Yates)
const shuffle = (array) => {
  let currentIndex = array.length, randomIndex;

  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex],
    ];
  }

  return array;
};

// Todas las fotos disponibles (asegúrate de que los _id sean únicos)
const allPhotos = [
  { _id: '673902d3d166bf9105cdf757', src: pizzaImg, name: 'Pizza' },
  { _id: '673902d3d166bf9105cdf758', src: cafeImg, name: 'Café' },
  { _id: '673902d3d166bf9105cdf759', src: mariposaImg, name: 'Mariposa' },
  { _id: '673902d3d166bf9105cdf760', src: osoImg, name: 'Oso' },
  { _id: '673902d3d166bf9105cdf761', src: ensaladaImg, name: 'Ensalada' },
  { _id: '673902d3d166bf9105cdf762', src: gatoImg, name: 'Gato' },
  { _id: '673902d3d166bf9105cdf763', src: perroImg, name: 'Perro' },
  { _id: '673902d3d166bf9105cdf764', src: florImg, name: 'Flor' },
  { _id: '673902d3d166bf9105cdf765', src: celularImg, name: 'Celular' },
  { _id: '673902d3d166bf9105cdf766', src: almohadaImg, name: 'Almohada' },
  { _id: '673902d3d166bf9105cdf767', src: cargadorImg, name: 'Cargador' },
  { _id: '673902d3d166bf9105cdf768', src: audifonosImg, name: 'Audífonos' },
  { _id: '673902d3d166bf9105cdf769', src: chompaImg, name: 'Chompa' },
  { _id: '673902d3d166bf9105cdf770', src: hotdogImg, name: 'Hotdog' },
  { _id: '673902d3d166bf9105cdf771', src: jeansImg, name: 'Jean' },
  { _id: '673902d3d166bf9105cdf772', src: jugoImg, name: 'Jugo' },
  { _id: '673902d3d166bf9105cdf773', src: mochilaImg, name: 'Mochila' },
  { _id: '673902d3d166bf9105cdf774', src: sillaImg, name: 'Silla' },
  { _id: '673902d3d166bf9105cdf775', src: camaraImg, name: 'Cámara' },
  { _id: '673902d3d166bf9105cdf776', src: lenteImg, name: 'Lentes' },
];

// Funciones para localStorage
const getUsedImageIds = () => {
  const used = localStorage.getItem('usedImageIds');
  return used ? JSON.parse(used) : [];
};

const setUsedImageIds = (ids) => {
  localStorage.setItem('usedImageIds', JSON.stringify(ids));
};

// Seleccionar fotos aleatorias sin repetir
const selectRandomPhotos = (allPhotos, numberOfPhotos) => {
  let usedImageIds = getUsedImageIds();
  let availablePhotos = allPhotos.filter(photo => !usedImageIds.includes(photo._id));

  if (availablePhotos.length < numberOfPhotos) {
    usedImageIds = [];
    availablePhotos = [...allPhotos];
    toast.info('Se ha reiniciado la selección de imágenes para evitar repeticiones.');
  }

  const shuffled = shuffle([...availablePhotos]);
  const selectedPhotos = shuffled.slice(0, numberOfPhotos);

  const newUsedImageIds = [...usedImageIds, ...selectedPhotos.map(photo => photo._id)];
  setUsedImageIds(newUsedImageIds);

  return selectedPhotos;
};

const ActivityScreen2 = ({ activity, treatmentId }) => {
  const navigate = useNavigate();
  const userInfo = useSelector((state) => state.auth.userInfo);

  const [recordActivity, { isLoading: isRecording, error: recordError }] = useRecordActivityMutation();

  const [photoQueue, setPhotoQueue] = useState([]);
  const [currentPhoto, setCurrentPhoto] = useState(null);
  const [options, setOptions] = useState([]);
  const [score, setScore] = useState(0);
  const [answeredPhotos, setAnsweredPhotos] = useState(0);
  const [message, setMessage] = useState('');
  const [showAnswer, setShowAnswer] = useState(false);
  const [timer, setTimer] = useState(0);
  const [gameFinished, setGameFinished] = useState(false);

  // Memorizar las fotos de la actividad o las globales
  const photos = useMemo(() => {
    return activity.photos || allPhotos;
  }, [activity.photos]);

  // Cargar la cola de fotos al montar
  useEffect(() => {
    console.log('Objeto activity recibido:', activity);
    console.log('ID de la actividad:', activity?._id);
    console.log('Received treatmentId:', treatmentId);

    if (!activity || !activity._id) {
      toast.error('Actividad inválida o no encontrada');
      navigate('/api/treatments/activities');
      return;
    }

    // Seleccionar 5 fotos aleatorias
    const selectedPhotos = selectRandomPhotos(photos, 5);
    setPhotoQueue(selectedPhotos);
  }, [activity, photos, navigate, treatmentId]);

  // Seleccionar la siguiente foto y sus opciones cada vez que avance answeredPhotos
  useEffect(() => {
    if (answeredPhotos < photoQueue.length && !gameFinished && photoQueue.length > 0) {
      const nextPhoto = photoQueue[answeredPhotos];
      const randomOptions = shuffleOptions(nextPhoto);
      setCurrentPhoto(nextPhoto);
      setOptions(randomOptions);
    }
  }, [answeredPhotos, gameFinished, photoQueue]);

  // Iniciar un temporizador (segundos)
  useEffect(() => {
    let interval;
    if (!gameFinished) {
      interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameFinished]);

  // Función para barajar opciones
  const shuffleOptions = (correctPhoto) => {
    const randomNames = photos
      .map((photo) => photo.name)
      .filter((name) => name !== correctPhoto.name);
    const wrongOptions = shuffle(randomNames).slice(0, 2);
    return shuffle([correctPhoto.name, ...wrongOptions]);
  };

  // Manejar el clic en una opción
  const handleOptionClick = (selectedName) => {
    // Evita interacciones si ya terminamos
    if (answeredPhotos >= photoQueue.length || gameFinished) return;

    let newScore = score;
    if (selectedName === currentPhoto.name) {
      newScore += 5;
      setMessage('¡Correcto! Has ganado 5 puntos.');
    } else {
      newScore -= 2;
      setMessage(`Incorrecto. La respuesta correcta es ${currentPhoto.name}. Has perdido 2 puntos.`);
    }

    setScore(newScore);
    setShowAnswer(true);

    setTimeout(() => {
      setShowAnswer(false);

      setAnsweredPhotos((prevAnswered) => {
        const newAnswered = prevAnswered + 1;

        // Si ya contestamos todo, marcamos que el juego terminó
        if (newAnswered === photoQueue.length) {
          setGameFinished(true);
        }
        return newAnswered;
      });
    }, 3000);
  };

  // useEffect que SOLO se ejecuta cuando el juego terminó (gameFinished === true)
  useEffect(() => {
    if (gameFinished) {
      if (!userInfo) {
        toast.error('Usuario no autenticado');
        return;
      }

      if (treatmentId) {
        saveActivity(score, treatmentId);
      } else {
        console.error('treatmentId no está definido. No se puede guardar la actividad.');
        toast.error('Error: treatmentId no está definido.');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameFinished]);

  // Función para guardar la actividad en la base de datos
  const saveActivity = async (finalScore, treatmentId) => {
    const activityData = {
      activityId: activity._id,
      photoId: currentPhoto?._id || null,
      scoreObtained: finalScore,
      timeUsed: timer,
      progress: 'mejorando',
      observations: 'El paciente completó la actividad de asociación de fotos.',
    };

    console.log('Guardando actividad con los siguientes datos:', activityData);

    try {
      await recordActivity({ treatmentId, activityData }).unwrap();
      console.log('Actividad guardada correctamente');
      toast.success('Actividad guardada correctamente');
      setTimeout(() => {
        navigate('/api/treatments/activities');
      }, 6000);
    } catch (error) {
      console.error('Error al guardar la actividad:', error);
      const errorMessage = error?.data?.message || error.message || 'Error desconocido';
      toast.error(`Hubo un problema al guardar la actividad: ${errorMessage}`);
    }
  };

  return (
    <div className={styles.background}>
      <div className={styles.container}>
        <h1 className={styles.title}>Juego de Asociación de Fotos</h1>
        
        <div className={styles.infoContainer}>
          <div className={styles.infoBox}>
            <span>Puntaje: </span>
            <span className={styles.score}>{score}</span>
          </div>
          <div className={styles.infoBox}>
            <span>Tiempo: </span>
            <span className={styles.timer}>{timer} segundos</span>
          </div>
        </div>

        {isRecording && <p className={styles.recording}>Guardando actividad...</p>}
        {recordError && <p className={styles.error}>Error: {recordError?.data?.message || recordError.message}</p>}

        {gameFinished ? (
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
        ) : (
          <>
            {currentPhoto && (
              <div className={styles.photoContainer}>
                <img
                  src={currentPhoto.src}
                  alt={`Imagen de ${currentPhoto.name}`}
                  className={styles.photo}
                />
              </div>
            )}

            <div className={styles.optionsContainer}>
              {options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleOptionClick(option)}
                  className={styles.optionButton}
                >
                  {option}
                </button>
              ))}
            </div>

            {showAnswer && (
              <div className={styles.answerMessage}>
                <p>{message}</p>
              </div>
            )}
          </>
        )}

        <ToastContainer />
      </div>
    </div>
  );
};

export default ActivityScreen2;
