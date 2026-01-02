// src/screens/ActivityScreenLevel2.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecordActivityMutation } from '../slices/treatmentSlice'; // Importa el hook de mutación
import { useSelector } from 'react-redux';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useDrag, useDrop, DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import '../assets/styles/ActivityScreen6Level2.css'; // Asegúrate de crear y ajustar este archivo CSS

// Importa las imágenes de Casas
import casa1Image from '../images/casa1.png';
import casa2Image from '../images/casa2.png';
import casa3Image from '../images/casa3.png';
import casa4Image from '../images/casa4.png';
import casa5Image from '../images/casa5.png';
import casa6Image from '../images/casa6.png';
import casa7Image from '../images/casa7.png';
import casa8Image from '../images/casa8.png';
import casa9Image from '../images/casa9.png';
import casa10Image from '../images/casa10.png';

// Importa las imágenes de Ropa
import ropa1Image from '../images/ropa1.png';
import ropa2Image from '../images/ropa2.png';
import ropa3Image from '../images/ropa3.png';
import ropa4Image from '../images/ropa4.png';
import ropa5Image from '../images/ropa5.png';
import ropa6Image from '../images/ropa6.png';
import ropa7Image from '../images/ropa7.png';
import ropa8Image from '../images/ropa8.png';
import ropa9Image from '../images/ropa9.png';
import ropa10Image from '../images/ropa10.png';

// Importa las imágenes de Plantas
import planta1Image from '../images/planta1.png';
import planta2Image from '../images/planta2.png';
import planta3Image from '../images/planta3.png';
import planta4Image from '../images/planta4.png';
import planta5Image from '../images/planta5.png';
import planta6Image from '../images/planta6.png';
import planta7Image from '../images/planta7.png';
import planta8Image from '../images/planta8.png';
import planta9Image from '../images/planta9.png';
import planta10Image from '../images/planta10.png';

// Definir las categorías
const categoriesLevel2 = [
  { id: 1, name: 'Casas' },
  { id: 2, name: 'Ropa' },
  { id: 3, name: 'Plantas' }
];

// Separar las imágenes por categoría y asignar IDs únicos
const casas = [
  { id: 1, src: casa1Image, category: 'Casas', alt: 'Casa 1' },
  { id: 2, src: casa2Image, category: 'Casas', alt: 'Casa 2' },
  { id: 3, src: casa3Image, category: 'Casas', alt: 'Casa 3' },
  { id: 4, src: casa4Image, category: 'Casas', alt: 'Casa 4' },
  { id: 5, src: casa5Image, category: 'Casas', alt: 'Casa 5' },
  { id: 6, src: casa6Image, category: 'Casas', alt: 'Casa 6' },
  { id: 7, src: casa7Image, category: 'Casas', alt: 'Casa 7' },
  { id: 8, src: casa8Image, category: 'Casas', alt: 'Casa 8' },
  { id: 9, src: casa9Image, category: 'Casas', alt: 'Casa 9' },
  { id: 10, src: casa10Image, category: 'Casas', alt: 'Casa 10' }
];

const ropa = [
  { id: 11, src: ropa1Image, category: 'Ropa', alt: 'Ropa 1' },
  { id: 12, src: ropa2Image, category: 'Ropa', alt: 'Ropa 2' },
  { id: 13, src: ropa3Image, category: 'Ropa', alt: 'Ropa 3' },
  { id: 14, src: ropa4Image, category: 'Ropa', alt: 'Ropa 4' },
  { id: 15, src: ropa5Image, category: 'Ropa', alt: 'Ropa 5' },
  { id: 16, src: ropa6Image, category: 'Ropa', alt: 'Ropa 6' },
  { id: 17, src: ropa7Image, category: 'Ropa', alt: 'Ropa 7' },
  { id: 18, src: ropa8Image, category: 'Ropa', alt: 'Ropa 8' },
  { id: 19, src: ropa9Image, category: 'Ropa', alt: 'Ropa 9' },
  { id: 20, src: ropa10Image, category: 'Ropa', alt: 'Ropa 10' }
];

const plantas = [
  { id: 21, src: planta1Image, category: 'Plantas', alt: 'Planta 1' },
  { id: 22, src: planta2Image, category: 'Plantas', alt: 'Planta 2' },
  { id: 23, src: planta3Image, category: 'Plantas', alt: 'Planta 3' },
  { id: 24, src: planta4Image, category: 'Plantas', alt: 'Planta 4' },
  { id: 25, src: planta5Image, category: 'Plantas', alt: 'Planta 5' },
  { id: 26, src: planta6Image, category: 'Plantas', alt: 'Planta 6' },
  { id: 27, src: planta7Image, category: 'Plantas', alt: 'Planta 7' },
  { id: 28, src: planta8Image, category: 'Plantas', alt: 'Planta 8' },
  { id: 29, src: planta9Image, category: 'Plantas', alt: 'Planta 9' },
  { id: 30, src: planta10Image, category: 'Plantas', alt: 'Planta 10' }
];

// Función para seleccionar N elementos aleatorios de un array
const getRandomElements = (array, num) => {
  const shuffled = array.slice().sort(() => 0.5 - Math.random());
  return shuffled.slice(0, num);
};

// Función para mezclar un array usando el algoritmo Fisher-Yates
const shuffleArray = (array) => {
  const shuffled = [...array];
  for(let i = shuffled.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const ActivityScreenLevel2 = ({ activity, treatmentId }) => { // Recibe 'activity' y 'treatmentId' como props
  const [assignedCategories, setAssignedCategories] = useState({});
  const [score, setScore] = useState(0);
  const [gameFinished, setGameFinished] = useState(false);
  const [timer, setTimer] = useState(0);
  const [selectedImages, setSelectedImages] = useState([]);
  const navigate = useNavigate();

  const userInfo = useSelector((state) => state.auth.userInfo); // Obtener información del usuario autenticado

  // Hook de la mutación para registrar actividad
  const [recordActivity, { isLoading: isRecording, error: recordError }] = useRecordActivityMutation();

  // Seleccionar y mezclar imágenes aleatorias al montar el componente o reiniciar el juego
  useEffect(() => {
    const selectAndShuffleImages = () => {
      const randomCasas = getRandomElements(casas, 3);
      const randomRopa = getRandomElements(ropa, 3);
      const randomPlantas = getRandomElements(plantas, 3);
      const combined = [...randomCasas, ...randomRopa, ...randomPlantas];
      const shuffled = shuffleArray(combined);
      setSelectedImages(shuffled);
    };

    selectAndShuffleImages();
  }, []); // Ejecutar solo una vez al montar

  // Iniciar el temporizador al montar el componente
  useEffect(() => {
    let interval;
    if (!gameFinished) {
      interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer + 1);
      }, 1000);
    } else {
      setTimeout(() => {
        navigate('/api/treatments/activities');
      }, 6000);
    }
    return () => clearInterval(interval);
  }, [gameFinished, navigate]);

  // Manejar el drop de una imagen en una categoría
  const handleDrop = (image, category) => {
    setAssignedCategories((prevAssigned) => ({
      ...prevAssigned,
      [image.id]: category.name
    }));
  };

  // Verificar las respuestas y calcular el puntaje
  const checkAnswers = () => {
    let correctCount = 0;

    selectedImages.forEach((image) => {
      // Verificamos si la categoría asignada coincide con la categoría correcta de la imagen
      if (assignedCategories[image.id] && assignedCategories[image.id] === image.category) {
        correctCount += 1;
      }
    });

    // Calculamos el puntaje proporcional
    const calculatedScore = (correctCount * 5) / 9;
    const finalScore = parseFloat(calculatedScore.toFixed(2));

    setScore(finalScore); // Actualizamos el puntaje basado en la cantidad correcta
    setGameFinished(true);
    saveActivity(finalScore); // Guardamos la actividad con el puntaje correcto
  };

  // Función para guardar la actividad en el backend dentro del tratamiento correspondiente
  const saveActivity = async (score) => {
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
      activityId: activity._id, // ID de la actividad principal
      scoreObtained: score, // Puntaje calculado
      timeUsed: timer,
      progress: 'mejorando', // Puedes ajustar esto según la lógica de tu aplicación
      observations: `El paciente obtuvo un puntaje de ${score} puntos al clasificar correctamente las imágenes.`,
      // Puedes agregar más campos si es necesario
    };

    console.log('Guardando actividad con los siguientes datos:', activityData);

    try {
      // Registrar la actividad dentro del tratamiento usando la mutación
      await recordActivity({ treatmentId, activityData }).unwrap();

      console.log('Actividad guardada correctamente');
      toast.success('Actividad guardada correctamente');
    } catch (error) {
      console.error('Error al guardar la actividad:', error);
      const errorMessage = error?.data?.message || error.message || 'Error desconocido';
      toast.error(`Hubo un problema al guardar la actividad: ${errorMessage}`);
    }
  };

  // Función para reiniciar el juego
  const restartGame = () => {
    setAssignedCategories({});
    setScore(0);
    setGameFinished(false);
    setTimer(0);
    const randomCasas = getRandomElements(casas, 3);
    const randomRopa = getRandomElements(ropa, 3);
    const randomPlantas = getRandomElements(plantas, 3);
    const combined = [...randomCasas, ...randomRopa, ...randomPlantas];
    const shuffled = shuffleArray(combined);
    setSelectedImages(shuffled);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="image-classification-wrapper"> {/* Nuevo contenedor para aplicar fondo */}
        <div className="image-classification-level2"> {/* Contenedor existente */}
          <h1 className="title-level2">Clasificación de Imágenes - Nivel 2</h1> {/* Agregar clase 'title-level2' */}
          <p className="timer-level2">Tiempo: {timer} segundos</p> {/* Agregar clase 'timer-level2' */}

          <div className="categories-container-level2">
            {categoriesLevel2.map((category) => (
              <Category
                key={category.id}
                category={category}
                assignedImages={Object.keys(assignedCategories)
                  .filter((imageId) => assignedCategories[imageId] === category.name)
                  .map((imageId) => selectedImages.find((image) => image.id === parseInt(imageId)))}
                onDrop={(image) => handleDrop(image, category)}
              />
            ))}
          </div>

          <div className="images-container-level2">
            {selectedImages
              .filter(image => !Object.keys(assignedCategories).includes(image.id.toString()))
              .map((image) => (
                <ImageItem key={image.id} image={image} />
              ))}
          </div>

          {!gameFinished && (
            <button onClick={checkAnswers} className="submit-button-level2">
              Enviar Respuesta
            </button>
          )}

          {gameFinished && (
            <div className="results-level2">
              <h2>¡Juego Terminado!</h2>
              <p>Puntaje: {score} / 5</p>
              <p>Tiempo total: {timer} segundos</p>
            </div>
          )}

          {/* Mostrar estado de guardado de la actividad */}
          {isRecording && <p className="recording-level2">Guardando actividad...</p>}
          {recordError && <p className="error-level2">Error: {recordError?.data?.message || recordError.message}</p>}
          
          <ToastContainer />
        </div>
      </div>
    </DndProvider>
  );
};

// Componente ImageItem
const ImageItem = ({ image }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'IMAGE',
    item: image,
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging()
    })
  }));

  return (
    <div
      ref={drag}
      className="image-item-level2"
      style={{
        opacity: isDragging ? 0.5 : 1,
        width: '100px',
        height: '100px',
        margin: '10px',
        cursor: 'grab',
        border: '1px solid #ccc',
        borderRadius: '8px',
        overflow: 'hidden',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f9f9f9'
      }}
    >
      <img src={image.src} alt={image.alt} style={{ maxWidth: '100%', maxHeight: '100%' }} />
    </div>
  );
};

// Componente Category
const Category = ({ category, assignedImages, onDrop }) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'IMAGE',
    drop: (item) => onDrop(item),
    collect: (monitor) => ({
      isOver: !!monitor.isOver()
    })
  }));

  return (
    <div
      ref={drop}
      className="category-level2"
    >
      <h3>{category.name}</h3>
      <div className="assigned-images-level2">
        {assignedImages.map((image) => (
          image && (
            <div
              key={image.id}
              className="image-item-level2"
            >
              <img src={image.src} alt={image.alt} />
            </div>
          )
        ))}
      </div>
    </div>
  );
};

export default ActivityScreenLevel2;
