// src/screens/Activity2L3Screen.jsx

import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import { useNavigate, useParams } from 'react-router-dom'; 
import 'react-toastify/dist/ReactToastify.css';
import { useRecordActivityMutation } from '../slices/treatmentSlice'; // Asegúrate de que la ruta sea correcta
import { useSelector } from 'react-redux';
import styles from '../assets/styles/Activity2L3Screen.module.css'; // Importa los estilos específicos

// Importa las imágenes al inicio para evitar usar require dentro del componente
import lentesImg from '../images/lentes.png';
import ventanaImg from '../images/ventana.png';
import copaImg from '../images/copa.png';
import personaImg from '../images/persona.png';
import camaraFotosImg from '../images/camara.png';
import corazonImg from '../images/corazon.png';
import focoImg from '../images/foco.png';
import palmeraImg from '../images/palmera.png';
import audifonosImg from '../images/audifono.png';
import camaImg from '../images/cama.png';
import caraImg from '../images/cara.png';
import carteraImg from '../images/cartera.png';
import collarImg from '../images/collar.png';
import computadoraImg from '../images/computadora.png';
import elefanteImg from '../images/elefante.png';
import lamparaImg from '../images/lampara.png';
import leonImg from '../images/leon.png';
import puertaImg from '../images/puerta.png';
import relojImg from '../images/reloj.png';
import vasoImg from '../images/vaso.png';

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
  {
    _id: 'photo1',
    src: lentesImg,
    name: 'Lentes',
    options: ['Lentes', 'Vidrio de una lupa', 'Reloj de bolsillo', 'Pantalla de un teléfono móvil', 'Visor de una cámara']
  },
  {
    _id: 'photo2',
    src: audifonosImg,
    name: 'Audífonos',
    options: ['Audífonos', 'Casco', 'Gorra', 'Diadema', 'Airpods']
  },
  {
    _id: 'photo3',
    src: ventanaImg,
    name: 'Ventana',
    options: ['Marco de cuadro', 'Espejo', 'Mueble', 'Cristal de automóvil', 'Ventana']
  },
  {
    _id: 'photo4',
    src: camaImg,
    name: 'Cama',
    options: ['Sofá', 'Cama', 'Sillón', 'Mesa', 'Velador']
  },
  {
    _id: 'photo5',
    src: copaImg,
    name: 'Copa',
    options: ['Copa', 'Jarra de vidrio', 'Botella de vino', 'Tazón de cerámica', 'Taza de té']
  },
  {
    _id: 'photo6',
    src: personaImg,
    name: 'Persona',
    options: ['Persona', 'Estatua de cera', 'Figura de acción', 'Maniquí', 'Escultura de algún animal']
  },
  {
    _id: 'photo7',
    src: camaraFotosImg,
    name: 'Cámara de fotos',
    options: ['Cámara de fotos', 'Mirilla de puerta', 'Lente de un telescopio', 'Cámara de seguridad', 'Foco de un proyector']
  },
  {
    _id: 'photo8',
    src: corazonImg,
    name: 'Corazón',
    options: ['Corazón', 'Pulmón', 'Riñón', 'Estómago', 'Cerebro']
  },
  {
    _id: 'photo9',
    src: focoImg,
    name: 'Foco',
    options: ['Foco', 'Linterna', 'Luz de emergencia', 'Lámpara de escritorio', 'Proyector']
  },
  {
    _id: 'photo10',
    src: palmeraImg,
    name: 'Palmera',
    options: ['Palmera', 'Árbol de plátano', 'Bambú', 'Tronco de cocotero', 'Árbol de eucalipto']
  },
  {
    _id: 'photo11',
    src: caraImg,
    name: 'Cara',
    options: ['Pelo', 'Cara', 'Brazo', 'Caderas', 'Piernas']
  },
  {
    _id: 'photo12',
    src: carteraImg,
    name: 'Cartera',
    options: ['Mochila', 'Cartuchera', 'Cartera', 'Bolsa de plástico', 'Cangurera']
  },
  {
    _id: 'photo13',
    src: collarImg,
    name: 'Collar',
    options: ['Pulsera', 'Cinturón', 'Collar', 'Anillos', 'Aretes']
  },
  {
    _id: 'photo14',
    src: elefanteImg,
    name: 'Elefante',
    options: ['Jirafa', 'Koala', 'Elefante', 'Cocodrilo', 'Oso panda']
  },
  {
    _id: 'photo15',
    src: computadoraImg,
    name: 'Computadora',
    options: ['Teléfono', 'Control remoto', 'Computadora', 'Tablet', 'Smartwatch']
  },
  {
    _id: 'photo16',
    src: lamparaImg,
    name: 'Lámpara',
    options: ['Jarro', 'Lámpara', 'Adorno', 'Vela', 'Escultura']
  },
  {
    _id: 'photo17',
    src: leonImg,
    name: 'León',
    options: ['León', 'Oso', 'Leopardo', 'Perro', 'Gato']
  },
  {
    _id: 'photo18',
    src: puertaImg,
    name: 'Puerta',
    options: ['Portón', 'Garage', 'Puerta', 'Ventana', 'Balcón']
  },
  {
    _id: 'photo19',
    src: relojImg,
    name: 'Reloj',
    options: ['Juguete', 'Plato', 'Cuadro decorativo', 'Reloj', 'Balón de basket']
  },
  {
    _id: 'photo20',
    src: vasoImg,
    name: 'Vaso',
    options: ['Tomatodo', 'Jarra', 'Bambú', 'Cafetera', 'Vaso']
  },
];

// Función para obtener las imágenes utilizadas desde localStorage
const getUsedImageIds = () => {
  const used = localStorage.getItem('usedImageIds_L3'); // Usar una clave única para el Nivel 3
  return used ? JSON.parse(used) : [];
};

// Función para guardar las imágenes utilizadas en localStorage
const setUsedImageIds = (ids) => {
  localStorage.setItem('usedImageIds_L3', JSON.stringify(ids)); // Usar una clave única para el Nivel 3
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

const Activity2L3Screen = () => {
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
      setOptions(shuffle(nextPhoto.options));  // Mostrar cinco opciones aleatorias
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
    if (answeredPhotos >= 10 || gameFinished) return;

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

        if (newAnswered === 10 && !gameFinished) { // Verificar que el juego no haya terminado
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
      difficultyLevel: 3, // Nivel de dificultad
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
        <h1 className={styles.title}>Juego de Asociación de Fotos (Nivel 3)</h1>
        
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

export default Activity2L3Screen;
