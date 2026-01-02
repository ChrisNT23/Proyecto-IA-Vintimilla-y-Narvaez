// src/screens/Activity2L2Screen.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import { useNavigate, useParams } from 'react-router-dom'; 
import 'react-toastify/dist/ReactToastify.css';
import { useRecordActivityMutation } from '../slices/treatmentSlice.js'; // Importa el hook de mutación
import { useSelector } from 'react-redux';
import styles from '../assets/styles/Activity2L2Screen.module.css'; // Importa los estilos específicos

// Importa las imágenes al inicio para evitar usar require dentro del componente
import esponjaImg from '../images/esponja.png';
import jeanImg from '../images/jean.png';
import papasImg from '../images/papas.png';
import alfombraImg from '../images/alfombra.png';
import cortezaArbolImg from '../images/cortezaArbol.png';
import tecladoImg from '../images/teclado.png';
import arenaImg from '../images/arena.png';
import guitarraImg from '../images/guitarra.png';
import sacoTejidoImg from '../images/sacoTejido.png';
import pedazoPastelImg from '../images/pedazoPastel.png';
import hamburguesaImg from '../images/hamburguesa.png';
import unasImg from '../images/unas.png';
import gorraImg from '../images/gorra.png';
import carroImg from '../images/carro.png';
import ojoImg from '../images/ojo.png';
import panImg from '../images/pan.png';
import plantaImg from '../images/planta.png';
import techoImg from '../images/techo.png';
import balconImg from '../images/balcon.png';
import girasolImg from '../images/girasol.png';

// Función de barajado usando el algoritmo de Fisher-Yates para mayor aleatoriedad
const shuffle = (array) => {
  if (!Array.isArray(array)) {
    console.error('La función shuffle esperaba un arreglo, pero recibió:', array);
    return [];
  }

  let currentIndex = array.length, randomIndex;

  // Mientras queden elementos a barajar
  while (currentIndex !== 0) {
    // Seleccionar un elemento restante
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    // Intercambiarlo con el elemento actual
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex],
    ];
  }

  return array;
};

// Definir el arreglo completo de fotos con opciones y IDs únicos
const allPhotos = [
  { _id: 'photo1', src: esponjaImg, name: 'Esponja', options: ['Esponja', 'Almohadilla de fregar', 'Panal de abeja', 'Colchón de espuma'] },
  { _id: 'photo2', src: jeanImg, name: 'Jean', options: ['Jean', 'Camisa de mezclilla', 'Tela de tapicería', 'Pantalón de algodón'] },
  { _id: 'photo3', src: papasImg, name: 'Papas', options: ['Papas', 'Tiras de plátano frito', 'Corteza de pan tostado', 'Tiras de yuca frita'] },
  { _id: 'photo4', src: alfombraImg, name: 'Alfombra', options: ['Alfombra', 'Césped artificial', 'Tela de abrigo de lana', 'Manta tejida'] },
  { _id: 'photo5', src: cortezaArbolImg, name: 'Corteza de árbol', options: ['Corteza de árbol', 'Madera tallada', 'Piel de un coco', 'Corteza de pino'] },
  { _id: 'photo6', src: tecladoImg, name: 'Teclado', options: ['Teclado', 'Botones de un control remoto', 'Teclas de una calculadora', 'Botones de un ascensor'] },
  { _id: 'photo7', src: arenaImg, name: 'Arena', options: ['Arena', 'Azúcar moreno', 'Sal gruesa', 'Polvo de canela'] },
  { _id: 'photo8', src: guitarraImg, name: 'Cuerda de guitarra', options: ['Cuerda de guitarra', 'Hilo de pescar', 'Cuerda de violín', 'Cable de freno de bicicleta'] },
  { _id: 'photo9', src: sacoTejidoImg, name: 'Saco tejido', options: ['Saco tejido', 'Bufanda tejida', 'Manta de lana', 'Suéter de punto grueso'] },
  { _id: 'photo10', src: pedazoPastelImg, name: 'Pedazo de pastel', options: ['Pedazo de pastel', 'Tarta de queso', 'Bizcocho', 'Panque de limón'] },
  { _id: 'photo11', src: hamburguesaImg, name: 'Hamburguesa', options: ['Hamburguesa', 'Pizza', 'Sándwich', 'Hot Dog'] },
  { _id: 'photo12', src: unasImg, name: 'Uñas', options: ['Uñas', 'Manos', 'Pies', 'Dedos'] },
  { _id: 'photo13', src: gorraImg, name: 'Gorra', options: ['Gorra', 'Sombrero', 'Bufanda', 'Guantes'] },
  { _id: 'photo14', src: balconImg, name: 'Balcón', options: ['Balcón', 'Terraza', 'Jardín', 'Patio'] },
  { _id: 'photo15', src: panImg, name: 'Pan', options: ['Pan', 'Arroz', 'Pasta', 'Cereal'] },
  { _id: 'photo16', src: girasolImg, name: 'Girasol', options: ['Girasol', 'Rosa', 'Tulipán', 'Lirio'] },
  { _id: 'photo17', src: carroImg, name: 'Carro', options: ['Carro', 'Moto', 'Bicicleta', 'Camión'] },
  { _id: 'photo18', src: ojoImg, name: 'Ojo', options: ['Ojo', 'Oreja', 'Nariz', 'Boca'] },
  { _id: 'photo19', src: plantaImg, name: 'Planta', options: ['Planta', 'Árbol', 'Flor', 'Hierba'] },
  { _id: 'photo20', src: techoImg, name: 'Techo', options: ['Techo', 'Pared', 'Suelo', 'Ventana'] },
];

// Función para obtener las imágenes utilizadas desde localStorage
const getUsedImageIds = () => {
  const used = localStorage.getItem('usedImageIds_L2'); // Usar una clave única para el nivel 2
  return used ? JSON.parse(used) : [];
};

// Función para guardar las imágenes utilizadas en localStorage
const setUsedImageIds = (ids) => {
  localStorage.setItem('usedImageIds_L2', JSON.stringify(ids)); // Usar una clave única para el nivel 2
};

// Función para seleccionar imágenes aleatorias sin repetición
const selectRandomPhotos = (allPhotos, numberOfPhotos) => {
  let usedImageIds = getUsedImageIds();
  
  // Filtrar las fotos que no han sido utilizadas
  let availablePhotos = allPhotos.filter(photo => !usedImageIds.includes(photo._id));
  
  // Si no hay suficientes fotos disponibles, reiniciar la lista de usadas
  if (availablePhotos.length < numberOfPhotos) {
    usedImageIds = [];
    availablePhotos = [...allPhotos];
    toast.info('Se ha reiniciado la selección de imágenes para evitar repeticiones.');
  }
  
  // Barajar las fotos disponibles
  const shuffled = shuffle([...availablePhotos]);
  
  // Seleccionar el número deseado de fotos
  const selectedPhotos = shuffled.slice(0, numberOfPhotos);
  
  // Actualizar la lista de imágenes utilizadas
  const newUsedImageIds = [...usedImageIds, ...selectedPhotos.map(photo => photo._id)];
  setUsedImageIds(newUsedImageIds);
  
  return selectedPhotos;
};

const Activity2L2Screen = () => {
  const { treatmentId, activityId } = useParams(); // Extrae treatmentId y activityId de la ruta
  const [photoQueue, setPhotoQueue] = useState([]); // Lista barajada de fotos
  const [currentPhoto, setCurrentPhoto] = useState(null);
  const [options, setOptions] = useState([]);
  const [score, setScore] = useState(0);
  const [answeredPhotos, setAnsweredPhotos] = useState(0);
  const [message, setMessage] = useState('');
  const [showAnswer, setShowAnswer] = useState(false);
  const [timer, setTimer] = useState(0);
  const [gameFinished, setGameFinished] = useState(false);
  const [activitySaved, setActivitySaved] = useState(false); // Para evitar el guardado doble
  const navigate = useNavigate();

  // Obtener información del usuario autenticado desde el estado de Redux
  const userInfo = useSelector((state) => state.auth.userInfo);
  const patientId = userInfo?._id;

  // Hook de la mutación para registrar actividad
  const [recordActivity, { isLoading: isRecording, error: recordError }] = useRecordActivityMutation();

  // Inicializar la cola de fotos barajadas al montar el componente
  useEffect(() => {
    console.log('Objeto activity recibido:', activityId);
    console.log('Received treatmentId:', treatmentId); // Verificar que treatmentId no es undefined

    if (!activityId) {
      toast.error('Actividad inválida o no encontrada');
      navigate('/api/treatments/activities'); // Redirige si la actividad no es válida
      return;
    }

    // Seleccionar diez fotos aleatorias sin repetición
    const selectedPhotos = selectRandomPhotos(allPhotos, 10); // Ajusta el número según la cantidad de preguntas
    setPhotoQueue(selectedPhotos);
  }, [activityId, treatmentId, navigate]);

  // Seleccionar la siguiente foto y opciones
  useEffect(() => {
    if (answeredPhotos < photoQueue.length && !gameFinished && photoQueue.length > 0) {
      const nextPhoto = photoQueue[answeredPhotos];
      setCurrentPhoto(nextPhoto);
      setOptions(shuffle(nextPhoto.options));  // Mostrar cuatro opciones aleatorias
    }
  }, [answeredPhotos, gameFinished, photoQueue]);

  // Iniciar el temporizador
  useEffect(() => {
    let interval;
    if (!gameFinished) {
      interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameFinished]);

  // Función para manejar el clic en una opción
  const handleOptionClick = (selectedName) => {
    if (answeredPhotos >= photoQueue.length || gameFinished) return;

    let newScore = score;
    if (selectedName === currentPhoto.name) {
      newScore += 0.5;  // Sumar 0.5 por cada respuesta correcta
      setMessage('¡Correcto! Has ganado 0.5 puntos.');
    } else {
      setMessage(`Incorrecto. La respuesta correcta es ${currentPhoto.name}.`);
    }

    setScore(newScore);
    setShowAnswer(true);

    setTimeout(() => {
      setShowAnswer(false);

      setAnsweredPhotos((prevAnswered) => {
        const newAnswered = prevAnswered + 1;

        if (newAnswered === photoQueue.length && !gameFinished) { // Verificar que el juego no haya terminado
          setGameFinished(true);
        }

        return newAnswered;
      });
    }, 3000); // Mostrar el mensaje por 3 segundos antes de pasar a la siguiente imagen
  };

  // Guardar actividad solo cuando el juego ha terminado
  useEffect(() => {
    if (gameFinished && !activitySaved) {
      saveActivity(score);
      setActivitySaved(true);
    }
  }, [gameFinished, activitySaved, score]);

  // Función para guardar la actividad en el backend
  const saveActivity = async (finalScore) => {
    // Validar que el usuario está autenticado
    if (!userInfo) {
      toast.error('Usuario no autenticado');
      return;
    }

    // Validar que treatmentId está definido
    if (!treatmentId) {
      toast.error('Tratamiento no identificado. No se puede guardar la actividad.');
      return;
    }

    // Construir el objeto de datos de la actividad
    const activityData = {
      activityId, // ID de la actividad principal desde los parámetros de la ruta
      scoreObtained: finalScore,
      timeUsed: parseFloat(timer), 
      progress: 'mejorando', // Puedes ajustar esto según la lógica de tu aplicación
      observations: 'El paciente completó la actividad de asociación de fotos.',
      patientId, // ID del paciente desde el estado de Redux
      difficultyLevel: 2, // Nivel de dificultad
      image: currentPhoto?.src || '', // Reemplazar con la URL real de la imagen si es necesario
    };

    console.log('Guardando actividad con los siguientes datos:', activityData);

    try {
      // Registrar la actividad dentro del tratamiento usando la mutación
      await recordActivity({ treatmentId, activityData }).unwrap();

      console.log('Actividad guardada correctamente');
      toast.success('Actividad guardada correctamente');
      setTimeout(() => navigate('/api/treatments/activities'), 6000); // Redirigir después de 6 segundos
    } catch (error) {
      console.error('Error al guardar la actividad:', error);
      const errorMessage = error?.data?.message || error.message || 'Error desconocido';
      toast.error(`Hubo un problema al guardar la actividad: ${errorMessage}`);
    }
  };

  return (
    <div className={styles.background}>
      <div className={styles.container}>
        <h1 className={styles.title}>Juego de Asociación de Fotos (Nivel 2)</h1>
        
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

export default Activity2L2Screen;
