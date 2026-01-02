// src/screens/ActivityScreenLevel3.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecordActivityMutation } from '../slices/treatmentSlice'; // Asegúrate de tener este hook configurado
import { useSelector } from 'react-redux';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useDrag, useDrop, DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import '../assets/styles/ActivityScreen6Level3.css'; // Asegúrate de crear y ajustar este archivo CSS

// Importa las imágenes de Tecnología
import tecnologia1Image from '../images/tecnologia1.png';
import tecnologia2Image from '../images/tecnologia2.png';
import tecnologia3Image from '../images/tecnologia3.png';
import tecnologia4Image from '../images/tecnologia4.png';
import tecnologia5Image from '../images/tecnologia5.png';
import tecnologia6Image from '../images/tecnologia6.png';
import tecnologia7Image from '../images/tecnologia7.png';
import tecnologia8Image from '../images/tecnologia8.png';
import tecnologia9Image from '../images/tecnologia9.png';
import tecnologia10Image from '../images/tecnologia10.png';

// Importa las imágenes de Muebles
import muebles1Image from '../images/mueble1.png';
import muebles2Image from '../images/mueble2.png';
import muebles3Image from '../images/mueble3.png';
import muebles4Image from '../images/mueble4.png';
import muebles5Image from '../images/mueble5.png';
import muebles6Image from '../images/mueble6.png';
import muebles7Image from '../images/mueble7.png';
import muebles8Image from '../images/mueble8.png';
import muebles9Image from '../images/mueble9.png';

// Importa las imágenes de Cocina
import cocina1Image from '../images/cocina1.png';
import cocina2Image from '../images/cocina2.png';
import cocina3Image from '../images/cocina3.png';
import cocina4Image from '../images/cocina4.png';
import cocina5Image from '../images/cocina5.png';
import cocina6Image from '../images/cocina6.png';
import cocina7Image from '../images/cocina7.png';
import cocina8Image from '../images/cocina8.png';
import cocina9Image from '../images/cocina9.png';
import cocina10Image from '../images/cocina10.png';

// Importa las imágenes de Animales
import animales1Image from '../images/animal1.png';
import animales2Image from '../images/animal2.png';
import animales3Image from '../images/animal3.png';
import animales4Image from '../images/animal4.png';
import animales5Image from '../images/animal5.png';
import animales6Image from '../images/animal6.png';
import animales7Image from '../images/animal7.png';
import animales8Image from '../images/animal8.png';
import animales9Image from '../images/animal9.png';

// Definir las categorías
const categoriesLevel3 = [
  { id: 1, name: 'Tecnología' },
  { id: 2, name: 'Muebles' },
  { id: 3, name: 'Cocina' },
  { id: 4, name: 'Animales' }
];

// Separar las imágenes por categoría y asignar IDs únicos
const tecnologia = [
  { id: 1, src: tecnologia1Image, category: 'Tecnología', alt: 'Tecnología 1' },
  { id: 2, src: tecnologia2Image, category: 'Tecnología', alt: 'Tecnología 2' },
  { id: 3, src: tecnologia3Image, category: 'Tecnología', alt: 'Tecnología 3' },
  { id: 4, src: tecnologia4Image, category: 'Tecnología', alt: 'Tecnología 4' },
  { id: 5, src: tecnologia5Image, category: 'Tecnología', alt: 'Tecnología 5' },
  { id: 6, src: tecnologia6Image, category: 'Tecnología', alt: 'Tecnología 6' },
  { id: 7, src: tecnologia7Image, category: 'Tecnología', alt: 'Tecnología 7' },
  { id: 8, src: tecnologia8Image, category: 'Tecnología', alt: 'Tecnología 8' },
  { id: 9, src: tecnologia9Image, category: 'Tecnología', alt: 'Tecnología 9' },
  { id: 10, src: tecnologia10Image, category: 'Tecnología', alt: 'Tecnología 10' }
];

const muebles = [
  { id: 11, src: muebles1Image, category: 'Muebles', alt: 'Muebles 1' },
  { id: 12, src: muebles2Image, category: 'Muebles', alt: 'Muebles 2' },
  { id: 13, src: muebles3Image, category: 'Muebles', alt: 'Muebles 3' },
  { id: 14, src: muebles4Image, category: 'Muebles', alt: 'Muebles 4' },
  { id: 15, src: muebles5Image, category: 'Muebles', alt: 'Muebles 5' },
  { id: 16, src: muebles6Image, category: 'Muebles', alt: 'Muebles 6' },
  { id: 17, src: muebles7Image, category: 'Muebles', alt: 'Muebles 7' },
  { id: 18, src: muebles8Image, category: 'Muebles', alt: 'Muebles 8' },
  { id: 19, src: muebles9Image, category: 'Muebles', alt: 'Muebles 9' },
];

const cocina = [
  { id: 21, src: cocina1Image, category: 'Cocina', alt: 'Cocina 1' },
  { id: 22, src: cocina2Image, category: 'Cocina', alt: 'Cocina 2' },
  { id: 23, src: cocina3Image, category: 'Cocina', alt: 'Cocina 3' },
  { id: 24, src: cocina4Image, category: 'Cocina', alt: 'Cocina 4' },
  { id: 25, src: cocina5Image, category: 'Cocina', alt: 'Cocina 5' },
  { id: 26, src: cocina6Image, category: 'Cocina', alt: 'Cocina 6' },
  { id: 27, src: cocina7Image, category: 'Cocina', alt: 'Cocina 7' },
  { id: 28, src: cocina8Image, category: 'Cocina', alt: 'Cocina 8' },
  { id: 29, src: cocina9Image, category: 'Cocina', alt: 'Cocina 9' },
  { id: 30, src: cocina10Image, category: 'Cocina', alt: 'Cocina 10' }
];

const animales = [
  { id: 31, src: animales1Image, category: 'Animales', alt: 'Animales 1' },
  { id: 32, src: animales2Image, category: 'Animales', alt: 'Animales 2' },
  { id: 33, src: animales3Image, category: 'Animales', alt: 'Animales 3' },
  { id: 34, src: animales4Image, category: 'Animales', alt: 'Animales 4' },
  { id: 35, src: animales5Image, category: 'Animales', alt: 'Animales 5' },
  { id: 36, src: animales6Image, category: 'Animales', alt: 'Animales 6' },
  { id: 37, src: animales7Image, category: 'Animales', alt: 'Animales 7' },
  { id: 38, src: animales8Image, category: 'Animales', alt: 'Animales 8' },
  { id: 39, src: animales9Image, category: 'Animales', alt: 'Animales 9' },
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

const ActivityScreenLevel3 = ({ activity, treatmentId }) => { // Recibe 'activity' y 'treatmentId' como props
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
      const randomTecnologia = getRandomElements(tecnologia, 3);
      const randomMuebles = getRandomElements(muebles, 3);
      const randomCocina = getRandomElements(cocina, 3);
      const randomAnimales = getRandomElements(animales, 3);
      const combined = [...randomTecnologia, ...randomMuebles, ...randomCocina, ...randomAnimales];
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
      // Después de 6 segundos de finalizar el juego, redirigir
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
    const calculatedScore = (correctCount * 5) / 12;
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
    const randomTecnologia = getRandomElements(tecnologia, 3);
    const randomMuebles = getRandomElements(muebles, 3);
    const randomCocina = getRandomElements(cocina, 3);
    const randomAnimales = getRandomElements(animales, 3);
    const combined = [...randomTecnologia, ...randomMuebles, ...randomCocina, ...randomAnimales];
    const shuffled = shuffleArray(combined);
    setSelectedImages(shuffled);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="image-classification-wrapper"> {/* Nuevo contenedor para aplicar fondo */}
        <div className="image-classification-level3"> {/* Contenedor existente */}
          <h1 className="title-level3">Clasificación de Imágenes - Nivel 3</h1> {/* Agregar clase 'title-level3' */}
          <p className="timer-level3">Tiempo: {timer} segundos</p> {/* Agregar clase 'timer-level3' */}

          <div className="categories-container-level3">
            {categoriesLevel3.map((category) => (
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

          <div className="images-container-level3">
            {selectedImages
              .filter(image => !Object.keys(assignedCategories).includes(image.id.toString()))
              .map((image) => (
                <ImageItem key={image.id} image={image} />
              ))}
          </div>

          {!gameFinished && (
            <button onClick={checkAnswers} className="submit-button-level3">
              Enviar Respuesta
            </button>
          )}

          {gameFinished && (
            <div className="results-level3">
              <h2>¡Juego Terminado!</h2>
              <p>Puntaje: {score} / 5</p>
              <p>Tiempo total: {timer} segundos</p>
              <button onClick={restartGame} className="restart-button-level3">
                Jugar de Nuevo
              </button>
            </div>
          )}

          {/* Mostrar estado de guardado de la actividad */}
          {isRecording && <p className="recording-level3">Guardando actividad...</p>}
          {recordError && <p className="error-level3">Error: {recordError?.data?.message || recordError.message}</p>}
          
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
      className="image-item-level3"
    >
      <img src={image.src} alt={image.alt} />
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
      className={`category-level3 ${isOver ? 'over' : ''}`} // Añade clase 'over' si está sobre la categoría
    >
      <h3>{category.name}</h3>
      <div className="assigned-images-level3">
        {assignedImages.map((image) => (
          image && (
            <div
              key={image.id}
              className="image-item-level3"
            >
              <img src={image.src} alt={image.alt} />
            </div>
          )
        ))}
      </div>
    </div>
  );
};

export default ActivityScreenLevel3;
