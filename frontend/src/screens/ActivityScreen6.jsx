// src/screens/ActivityScreenLevel1.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecordActivityMutation } from '../slices/treatmentSlice'; // Importa el hook de mutación
import { useSelector } from 'react-redux';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useDrag, useDrop, DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

// Importa las imágenes
import rojoImage from '../images/rojo.png';
import amarilloImage from '../images/amarillo.png';
import azulImage from '../images/azul.png';
import celesteImage from '../images/celeste.png';
import moradoImage from '../images/morado.png';
import mentaImage from '../images/menta.png';
import naranjaImage from '../images/naranja.png';
import verdeImage from '../images/verde.png';
import rosadoImage from '../images/rosado.png';
import cuboImage from '../images/cubo.png';
import trianguloImage from '../images/triangulo.png';
import paraleloImage from '../images/paralelo.png';
import cilindroImage from '../images/cilindro.png';
import circuloImage from '../images/circulo.png';
import hexagonoImage from '../images/hexagono.png';
import prismaImage from '../images/prisma.png';
import cuboideImage from '../images/cuboide.png';
import hexagonooImage from '../images/hexagonoo.png';

import '../assets/styles/ActivityScreen6Level1.css';

// Definir las categorías
const categoriesLevel1 = [
  { id: 1, name: 'Colores' },
  { id: 2, name: 'Formas' }
];

// Separar las imágenes por categoría y asignar IDs únicos
const colors = [
  { id: 1, src: rojoImage, category: 'Colores', alt: 'Rojo' },
  { id: 2, src: amarilloImage, category: 'Colores', alt: 'Amarillo' },
  { id: 3, src: azulImage, category: 'Colores', alt: 'Azul' },
  { id: 4, src: moradoImage, category: 'Colores', alt: 'Morado' },
  { id: 5, src: rosadoImage, category: 'Colores', alt: 'Rosado' },
  { id: 6, src: mentaImage, category: 'Colores', alt: 'Menta' },
  { id: 7, src: celesteImage, category: 'Colores', alt: 'Celeste' },
  { id: 8, src: naranjaImage, category: 'Colores', alt: 'Naranja' },
  { id: 9, src: verdeImage, category: 'Colores', alt: 'Verde' }
];

const forms = [
  { id: 10, src: circuloImage, category: 'Formas', alt: 'Círculo' },
  { id: 11, src: cuboImage, category: 'Formas', alt: 'Cubo' },
  { id: 12, src: prismaImage, category: 'Formas', alt: 'Prisma' },
  { id: 13, src: trianguloImage, category: 'Formas', alt: 'Triángulo' },
  { id: 14, src: paraleloImage, category: 'Formas', alt: 'Paralelo' },
  { id: 15, src: cuboideImage, category: 'Formas', alt: 'Cuboide' },
  { id: 16, src: hexagonoImage, category: 'Formas', alt: 'Hexágono' },
  { id: 17, src: cilindroImage, category: 'Formas', alt: 'Cilindro' },
  { id: 18, src: hexagonooImage, category: 'Formas', alt: 'Hexagonoo' }
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

const ActivityScreenLevel1 = ({ activity, treatmentId }) => { // Recibe 'activity' y 'treatmentId' como props
  const [assignedCategories, setAssignedCategories] = useState({});
  const [correctAnswers, setCorrectAnswers] = useState(0);
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
      const randomColors = getRandomElements(colors, 3);
      const randomForms = getRandomElements(forms, 3);
      const combined = [...randomColors, ...randomForms];
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

    // Ajustamos el puntaje para que cada respuesta correcta valga puntos según la cantidad total
    const score = (correctCount * (5 / selectedImages.length)).toFixed(2);

    setCorrectAnswers(score); // Actualizamos el puntaje basado en la cantidad correcta

    setGameFinished(true);
    saveActivity(score); // Guardamos la actividad con el puntaje correcto
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
      scoreObtained: parseFloat(score), // Asegurarse de que es un número
      timeUsed: timer,
      progress: 'mejorando', // Puedes ajustar esto según la lógica de tu aplicación
      observations: `El paciente clasificó correctamente ${score} imágenes.`,
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
    setCorrectAnswers(0);
    setGameFinished(false);
    setTimer(0);
    const randomColors = getRandomElements(colors, 3);
    const randomForms = getRandomElements(forms, 3);
    const combined = [...randomColors, ...randomForms];
    const shuffled = shuffleArray(combined);
    setSelectedImages(shuffled);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="image-classification-wrapper"> {/* Nuevo contenedor para aplicar fondo */}
        <div className="image-classification"> {/* Contenedor existente */}
          <h1 className="title">Clasificación de Imágenes - Nivel 1</h1> {/* Agregar clase 'title' */}
          <div className="infoBox">
          <p className="timer">Tiempo: {timer} segundos</p> {/* Agregar clase 'timer' */}
          </div>
          <div className="categories-container">
            {categoriesLevel1.map((category) => (
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

          <div className="images-container">
            {selectedImages
              .filter(image => !Object.keys(assignedCategories).includes(image.id.toString()))
              .map((image) => (
                <ImageItem key={image.id} image={image} />
              ))}
          </div>

          {!gameFinished && (
            <button onClick={checkAnswers} className="submit-button">
              Enviar Respuesta
            </button>
          )}

          {gameFinished && (
            <div className="results">
              <h2>¡Juego Terminado!</h2>
              <p>Respuestas correctas: {correctAnswers} / 5</p>
              <p>Tiempo total: {timer} segundos</p>
            </div>
          )}

          {/* Mostrar estado de guardado de la actividad */}
          {isRecording && <p className="recording">Guardando actividad...</p>}
          {recordError && <p className="error">Error: {recordError?.data?.message || recordError.message}</p>}
          
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
      className="image-item"
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
      className="category"
      style={{
        backgroundColor: isOver ? '#f0f0f0' : 'white',
        padding: '20px',
        border: '2px dashed gray',
        minHeight: '200px',
        margin: '10px',
        borderRadius: '8px',
        width: '45%' // Ajuste para mejorar el diseño
      }}
    >
      <h3>{category.name}</h3>
      <div className="assigned-images" style={{ display: 'flex', flexWrap: 'wrap' }}>
        {assignedImages.map((image) => (
          <div
            key={image.id}
            className="image-item"
            style={{
              width: '80px',
              height: '80px',
              margin: '5px',
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
        ))}
      </div>
    </div>
  );
};

export default ActivityScreenLevel1;
