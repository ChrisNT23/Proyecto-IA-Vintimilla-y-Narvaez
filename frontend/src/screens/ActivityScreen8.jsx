// src/screens/ActivityScreen8.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Slider from 'react-slick';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import "slick-carousel/slick/slick.css"; 
import "slick-carousel/slick/slick-theme.css";
import { useRecordActivityMutation } from '../slices/treatmentSlice'; // Importa el hook de mutación
import { useSelector } from 'react-redux';

import styles from '../assets/styles/ActivityScreen8.module.css';

// Definir las lecturas con sus respectivas preguntas
const readings = [
  {
    id: 1,
    title: 'El paisajista',
    story: `Érase una vez un pintor de gran talento que fue enviado por el emperador de China a una provincia lejana y recién conquistada, con la misión de traer a su vuelta imágenes pintadas. Tras un largo viaje en el que visitó en profundidad todos los territorios de la provincia, el pintor regresó, pero sin embargo no portaba ninguna imagen. Ello generó sorpresa en el emperador, quien terminó enfadándose con el pintor.

En ese momento, el artista solicitó que le dejaran un lienzo de pared. En él, el pintor dibujó con gran detalle todo lo que había visto y recorrido en su viaje, tras lo cual el emperador acudió a verlo. Entonces el pintor le explicó cada uno de los rincones del gran paisaje que había dibujado y explorado en sus viajes. Al acabar, el pintor se aproximó a un sendero que había dibujado y que parecía perderse en el espacio. Poco a poco, el pintor se adentró en el sendero, metiéndose en el dibujo y haciéndose cada vez más pequeño hasta desaparecer tras una curva. Y cuando este desapareció, lo hizo todo el paisaje, dejando el muro completamente desnudo.

Este cuento de origen chino es algo complejo de entender. Para ello debemos ponernos en la posición del pintor y lo que hace a lo largo de la historia: por un lado observa la realidad, pero por el otro, y como se ve al final cuando se une a su obra, forma parte intrínseca de ella. Se trata de una alegoría de que aunque podemos ser observadores de lo que acontece en el mundo queramos o no somos parte de él: si algo ocurre en esa realidad nos afecta a nosotros, ya que somos parte de ella, mientras que lo que nos pase a nosotros no está alejado de la realidad.`,
    questions: [
      {
        id: 1,
        question: '¿Cuál fue la misión que el emperador le encomendó al pintor?',
        options: [
          'Crear un mural en el palacio.',
          'Traer imágenes pintadas de una provincia recién conquistada.',
          'Hacer un mapa detallado de las nuevas tierras.'
        ],
        correctAnswer: 'Traer imágenes pintadas de una provincia recién conquistada.'
      },
      {
        id: 2,
        question: '¿Qué hizo el pintor al regresar de su viaje?',
        options: [
          'Entregó un pergamino lleno de dibujos.',
          'Explicó verbalmente lo que vio en su viaje.',
          'Dibujó un gran paisaje en un lienzo de pared.'
        ],
        correctAnswer: 'Dibujó un gran paisaje en un lienzo de pared.'
      },
      {
        id: 3,
        question: '¿Qué ocurrió cuando el pintor se adentró en el sendero dibujado?',
        options: [
          'Se desvaneció junto con el paisaje.',
          'Se quedó atrapado dentro de su obra.',
          'Regresó del sendero con nuevas ideas.'
        ],
        correctAnswer: 'Se desvaneció junto con el paisaje.'
      },
      {
        id: 4,
        question: '¿Qué simboliza el final del cuento, cuando el pintor desaparece en su obra?',
        options: [
          'La separación entre la realidad y la ficción.',
          'La unión entre el observador y la realidad que observa.',
          'El deseo del pintor de abandonar el mundo real.'
        ],
        correctAnswer: 'La unión entre el observador y la realidad que observa.'
      },
      {
        id: 5,
        question: 'Según el cuento, ¿qué lección podemos aprender sobre nuestra relación con la realidad?',
        options: [
          'Que podemos permanecer completamente separados de ella.',
          'Que la realidad y nosotros somos independientes.',
          'Que somos parte de la realidad, y lo que ocurre en ella nos afecta.'
        ],
        correctAnswer: 'Que somos parte de la realidad, y lo que ocurre en ella nos afecta.'
      }
    ]
  },
  {
    id: 2,
    title: 'Tú gobiernas tu mente, no tu mente a ti',
    story: `Érase una vez un estudiante de zen que se lamentaba de que no podía meditar, ya que sus pensamientos se lo impedían. Este le dijo a su maestro que sus pensamientos y las imágenes que generaba no le dejaban meditar, y que aún cuando se iban unos instantes al poco volvían con mayor fuerza, no dejándoles en paz. Su maestro le indicó que esto sólo dependía de sí mismo, y que dejara de cavilar.

Pero el estudiante siguió indicando que los pensamientos le confundían y no le dejaban meditar en paz, y que cada vez que procuraba concentrarse le aparecían pensamientos y reflexiones de manera continuada, a menudo poco útiles e irrelevantes.

A esto el maestro le propuso que cogiera una cuchara y la sostuviera en la mano, mientras se sentaba e intentaba meditar. El alumno obedeció, hasta que de pronto el maestro le indicó que dejara la cuchara. El alumno lo hizo, dejándola caer al suelo. Miró a su maestro, confuso, y este le preguntó que quién agarraba a quién, si él a la cuchara o la cuchara a él.

Este breve cuento parte de la filosofía zen y tiene origen en el budismo. En él se nos hace reflexionar sobre nuestros propios pensamientos, y el hecho de que debemos ser nosotros quienes tengamos el control sobre ellos y no a la inversa.`,
    questions: [
      {
        id: 1,
        question: '¿Por qué el estudiante no podía meditar según su propia explicación?',
        options: [
          'Porque no tenía la postura adecuada.',
          'Porque los pensamientos e imágenes no le dejaban en paz.',
          'Porque no comprendía las enseñanzas de su maestro.'
        ],
        correctAnswer: 'Porque los pensamientos e imágenes no le dejaban en paz.'
      },
      {
        id: 2,
        question: '¿Qué consejo inicial le dio el maestro al estudiante para resolver su problema?',
        options: [
          'Que dejara de cavilar.',
          'Que meditara con los ojos abiertos.',
          'Que se enfocara en un mantra específico.'
        ],
        correctAnswer: 'Que dejara de cavilar.'
      },
      {
        id: 3,
        question: '¿Qué objeto utilizó el maestro para enseñar una lección al estudiante?',
        options: [
          'Una vela.',
          'Una cuchara.',
          'Un libro.'
        ],
        correctAnswer: 'Una cuchara.'
      },
      {
        id: 4,
        question: '¿Cuál fue la pregunta clave que el maestro hizo al estudiante después del ejercicio?',
        options: [
          '"¿Qué pensamientos vinieron a tu mente?"',
          '"¿Quién agarraba a quién, tú a la cuchara o la cuchara a ti?"',
          '"¿Por qué soltaste la cuchara tan rápido?"'
        ],
        correctAnswer: '"¿Quién agarraba a quién, tú a la cuchara o la cuchara a ti?"'
      },
      {
        id: 5,
        question: '¿Cuál es la enseñanza principal del cuento?',
        options: [
          'Que debemos aceptar nuestros pensamientos tal y como son.',
          'Que debemos controlar nuestros pensamientos y no dejar que ellos nos controlen.',
          'Que los pensamientos irrelevantes siempre estarán presentes en la meditación.'
        ],
        correctAnswer: 'Que debemos controlar nuestros pensamientos y no dejar que ellos nos controlen.'
      }
    ]
  },
  {
    id: 3,
    title: 'El sabio y el escorpión',
    story: `Había una vez un sabio monje que paseaba junto a su discípulo en la orilla de un río. Durante su caminar, vio como un escorpión había caído al agua y se estaba ahogando, y tomó la decisión de salvarlo sacándolo del agua. Pero una vez en su mano, el animal le picó.

El dolor hizo que el monje soltara al escorpión, que volvió a caer al agua. El sabio volvió a intentar sacarlo, pero de nuevo el animal le picó provocando que le dejara caer. Ello ocurrió una tercera vez. El discípulo del monje, preocupado, le preguntó por qué continuaba haciéndolo si el animal siempre le picaba.

El monje, sonriendo, le respondió que la naturaleza del escorpión es la de picar, mientras que la de él no era otra que la de ayudar. Dicho esto el monje tomó una hoja y, con su ayuda, consiguió sacar al escorpión del agua y salvarlo sin sufrir su picadura.

Otro cuento procedente de la India, en esta ocasión nos explica que no debemos luchar contra nuestra naturaleza por mucho que otros nos dañan. Hay que tomar precauciones, pero no debemos dejar de ser quienes somos ni actuar en contra de lo que somos.`,
    questions: [
      {
        id: 1,
        question: '¿Qué encontró el sabio monje en el río mientras paseaba con su discípulo?',
        options: [
          'Un pez que nadaba contra la corriente.',
          'Un escorpión que se estaba ahogando.',
          'Una hoja flotando en el agua.'
        ],
        correctAnswer: 'Un escorpión que se estaba ahogando.'
      },
      {
        id: 2,
        question: '¿Qué hizo el escorpión cada vez que el monje intentaba salvarlo?',
        options: [
          'Se quedaba inmóvil.',
          'Picaba al monje.',
          'Se escapaba nadando.'
        ],
        correctAnswer: 'Picaba al monje.'
      },
      {
        id: 3,
        question: '¿Por qué el discípulo cuestionó al monje?',
        options: [
          'Porque pensaba que el escorpión no merecía ser salvado.',
          'Porque el monje seguía ayudando al escorpión a pesar de que le picaba.',
          'Porque el monje no usaba herramientas para salvarlo.'
        ],
        correctAnswer: 'Porque el monje seguía ayudando al escorpión a pesar de que le picaba.'
      },
      {
        id: 4,
        question: '¿Cómo logró finalmente el monje salvar al escorpión sin ser picado?',
        options: [
          'Utilizando una hoja como herramienta.',
          'Esperando a que el escorpión dejara de picar.',
          'Sumergiéndose en el agua para atraparlo.'
        ],
        correctAnswer: 'Utilizando una hoja como herramienta.'
      },
      {
        id: 5,
        question: '¿Qué enseñanza transmite este cuento?',
        options: [
          'Que debemos alejarnos de quienes nos dañan.',
          'Que debemos tomar precauciones pero nunca actuar en contra de nuestra naturaleza.',
          'Que siempre debemos luchar contra quienes nos lastiman.'
        ],
        correctAnswer: 'Que debemos tomar precauciones pero nunca actuar en contra de nuestra naturaleza.'
      }
    ]
  },
  {
    id: 4,
    title: 'Abismos',
    story: `Hacía semanas que no los oía. A Raúl le resultaba extraño que ya no estuvieran deambulando por el jardín los ratoncitos que durante todo el verano lo habían acunado con sus mínimos pasitos en la pared contra la que estaba acomodada su cama.

Se levantó de prisa asustado y descubrió que ya no quedaba ninguno; se habían marchado sin despedirse. Los días siguientes fueron tristes y solitarios para el niño y dejó de reír y de sonreír como solía hacerlo.

Cuando su madre le preguntó qué le ocurría, él le manifestó su tristeza por la ausencia de los ratoncitos. ‘Ni siquiera les había dicho lo especiales e importantes que eran para mí’, sollozaba convulsionado por la pena. ‘No te preocupes, ya volverán’, fue la tranquilizadora respuesta de su madre.

Efectivamente, los ratoncitos regresaron. Pero cuando lo hicieron, había pasado demasiado tiempo y Raúl no los recordaba: se había convertido en un joven apuesto al que ya no le interesaban los asuntos de la infancia, preocupado en volverse mayor.

Por mucho que los visitantes rascaron las paredes, Raúl no les prestó atención. Y continuó con su vida adolescente como si nada. En el fondo de su alma el hueco del abandonado sufrido en la infancia continuó horadando silenciosamente y todos sabemos que, tarde o temprano, volvería a cobrar protagonismo en su vida; porque el tiempo no cura las heridas.`,
    questions: [
      {
        id: 1,
        question: '¿Qué acostumbraba escuchar Raúl durante el verano?',
        options: [
          'Los pasos de los ratoncitos en la pared.',
          'El canto de los pájaros en el jardín.',
          'El sonido del viento contra las ventanas.'
        ],
        correctAnswer: 'Los pasos de los ratoncitos en la pared.'
      },
      {
        id: 2,
        question: '¿Por qué dejó Raúl de reír y sonreír?',
        options: [
          'Porque se había peleado con su madre.',
          'Porque los ratoncitos desaparecieron sin despedirse.',
          'Porque estaba preocupado por sus estudios.'
        ],
        correctAnswer: 'Porque los ratoncitos desaparecieron sin despedirse.'
      },
      {
        id: 3,
        question: '¿Qué le dijo la madre de Raúl cuando él le manifestó su tristeza?',
        options: [
          '"Los ratoncitos no eran reales."',
          '"No te preocupes, ya volverán."',
          '"Debes aprender a olvidarlos."'
        ],
        correctAnswer: '"No te preocupes, ya volverán."'
      },
      {
        id: 4,
        question: '¿Cómo reaccionó Raúl cuando los ratoncitos regresaron?',
        options: [
          'Se emocionó y los recibió con alegría.',
          'No les prestó atención porque ya no recordaba su importancia.',
          'Intentó ahuyentarlos porque ya no los quería cerca.'
        ],
        correctAnswer: 'No les prestó atención porque ya no recordaba su importancia.'
      },
      {
        id: 5,
        question: '¿Cuál es la enseñanza principal del cuento?',
        options: [
          'Que el tiempo siempre cura las heridas.',
          'Que las heridas de la infancia pueden permanecer y afectarnos en el futuro.',
          'Que debemos ignorar las cosas que nos lastiman para seguir adelante.'
        ],
        correctAnswer: 'Que las heridas de la infancia pueden permanecer y afectarnos en el futuro.'
      }
    ]
  },
  {
    id: 5,
    title: 'El espejo chino',
    story: `Había una vez un campesino chino, el cual iba a ir a la ciudad a vender la cosecha de arroz en la que él y su esposa habían estado trabajando. Su mujer le pidió que, aprovechando el viaje, no se olvidase de traerle un peine.

El hombre llegó a la ciudad y una vez allí vendió la cosecha. Tras hacerlo, se encontró y reunió con varios compañeros y se pusieron a beber y a celebrar lo conseguido. Después de ello, y aún un poco desorientado, el campesino recordó que su esposa le había pedido que le trajera algo. Sin embargo no recordaba el qué, con lo que acudió a una tienda y compró el producto que más le llamó la atención. Se trataba de un espejo, con el cual regresó a su hogar. Tras dárselo a su esposa, se marchó de nuevo a trabajar en el campo.

La joven esposa se miró en el espejo, y repentinamente empezó a llorar. La madre de esta le preguntó el por qué de tal reacción, a lo que su hija le pasó el espejo y le respondió que la causa de sus lágrimas era que su marido había traído consigo otra mujer, joven y hermosa. La madre de esta miró también el espejo, y tras hacerlo le respondió a su hija que no tenía de qué preocuparse, dado que se trataba de una vieja.

Un cuento de origen chino, de autor anónimo. Se trata de una narración muy breve que tiene diferentes posibles interpretaciones, pero que entre otras cosas nos habla de cómo nos vemos nosotros mismos reflejados en el mundo, y la diferencia entre cómo nos creemos que somos y cómo somos en realidad, a menudo subestimándonos o sobrevalorándonos.

Para entender el cuento es necesario tener en consideración que ninguno de los personajes se había visto jamás reflejado en un espejo, no sabiendo qué es lo que ve realmente. Así, la esposa no es capaz de comprender que la joven hermosa que ve es ella misma, mientras que la madre tampoco ve que la anciana que ve es ella. También se observa que mientras la primera se preocupa por qué considera que lo que ve en el reflejo es más hermoso que ella misma, la segunda lo minusvalora críticamente, prácticamente burlándose de su propia imagen.`,
    questions: [
      {
        id: 1,
        question: '¿Qué le pidió la esposa al campesino que le trajera de la ciudad?',
        options: [
          'Un espejo.',
          'Un peine.',
          'Una joya.'
        ],
        correctAnswer: 'Un peine.'
      },
      {
        id: 2,
        question: '¿Por qué el campesino compró un espejo?',
        options: [
          'Porque era lo que su esposa le pidió.',
          'Porque era lo único que pudo pagar.',
          'Porque no recordaba lo que su esposa le pidió y el espejo le llamó la atención.'
        ],
        correctAnswer: 'Porque no recordaba lo que su esposa le pidió y el espejo le llamó la atención.'
      },
      {
        id: 3,
        question: '¿Por qué la esposa comenzó a llorar al mirarse en el espejo?',
        options: [
          'Porque pensó que su marido había traído a otra mujer joven y hermosa.',
          'Porque no le gustaba su reflejo.',
          'Porque no entendió cómo funcionaba el espejo.'
        ],
        correctAnswer: 'Porque pensó que su marido había traído a otra mujer joven y hermosa.'
      },
      {
        id: 4,
        question: '¿Qué vio la madre de la esposa al mirarse en el espejo?',
        options: [
          'A una mujer joven y hermosa.',
          'A una anciana, a quien identificó como ella misma.',
          'A otra mujer desconocida.'
        ],
        correctAnswer: 'A una anciana, a quien identificó como ella misma.'
      },
      {
        id: 5,
        question: '¿Cuál es el mensaje principal del cuento?',
        options: [
          'Que los espejos distorsionan la realidad.',
          'Que las personas suelen verse a sí mismas de manera diferente a cómo realmente son.',
          'Que la vanidad causa sufrimiento.'
        ],
        correctAnswer: 'Que las personas suelen verse a sí mismas de manera diferente a cómo realmente son.'
      }
    ]
  }
];

const ActivityScreen8 = ({ activity, treatmentId }) => { // Recibe 'activity' y 'treatmentId' como props
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [score, setScore] = useState(0);
  const [gameFinished, setGameFinished] = useState(false);
  const [timer, setTimer] = useState(0);
  const [currentReading, setCurrentReading] = useState(null);
  const navigate = useNavigate();
  const sliderRef = React.useRef(null);

  const userInfo = useSelector((state) => state.auth.userInfo); // Obtener información del usuario autenticado

  // Hook de la mutación para registrar actividad
  const [recordActivity, { isLoading: isRecording, error: recordError }] = useRecordActivityMutation();

  useEffect(() => {
    window.scrollTo(0, 0); // Se asegura de que la página esté en el tope al cargar
  }, []);

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
    if (gameFinished) {
      const timeout = setTimeout(() => {
        navigate('/api/treatments/activities'); // Navegar a /activities después de 6 segundos
      }, 6000);
      return () => clearTimeout(timeout);
    }
  }, [gameFinished, navigate]);

  // Función para seleccionar una lectura aleatoria
  const selectRandomReading = () => {
    const lastReadingId = localStorage.getItem('lastReadingId');
    let availableReadings = readings;

    if (readings.length > 1 && lastReadingId) {
      availableReadings = readings.filter(reading => reading.id !== parseInt(lastReadingId));
    }

    const randomIndex = Math.floor(Math.random() * availableReadings.length);
    const selected = availableReadings[randomIndex];

    setCurrentReading(selected);
    localStorage.setItem('lastReadingId', selected.id);
  };

  useEffect(() => {
    selectRandomReading();
  }, []);

  const handleOptionClick = (questionId, answer) => {
    setSelectedAnswers((prevAnswers) => ({
      ...prevAnswers,
      [questionId]: answer
    }));
  };

  const handleSubmit = () => {
    if (!currentReading) {
      toast.error('No se ha seleccionado una lectura.');
      return;
    }

    let finalScore = 0;
    currentReading.questions.forEach((question) => {
      if (selectedAnswers[question.id] === question.correctAnswer) {
        finalScore += 1;
      }
    });
    setScore(finalScore);
    setGameFinished(true);
    toast.success('Juego terminado. ¡Revisa tus resultados!');
    saveActivity(finalScore, timer);
  };

  // Función para guardar la actividad en el backend dentro del tratamiento correspondiente
  const saveActivity = async (finalScore, timeUsed) => {
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
      scoreObtained: finalScore,
      timeUsed: timeUsed,
      progress: 'mejorando', // Puedes ajustar esto según la lógica de tu aplicación
      observations: `El paciente respondió correctamente ${finalScore} de ${currentReading.questions.length} preguntas de la lectura "${currentReading.title}".`,
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

  const settings = {
    dots: true,
    infinite: false,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: true,
    swipe: false, // Desactiva el swipe para obligar al uso de botones
    adaptiveHeight: true
  };

  if (!currentReading) {
    return <p className={styles.loading}>Cargando lectura...</p>;
  }

  return (
    <div className={styles.background}>
      <div className={styles.container}>
        <h1 className={styles.title}>Lectura y Preguntas</h1>
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

        {/* Mostrar estado de guardado de la actividad */}
        {isRecording && <p className={styles.recording}>Guardando actividad...</p>}
        {recordError && <p className={styles.error}>Error: {recordError?.data?.message || recordError.message}</p>}

        {!gameFinished ? (
          <>
            <h2 className={styles.readingTitle}>{currentReading.title}</h2>
            <p className={styles.storyText}>
              {currentReading.story}
            </p>

            <div className={styles.questionsContainer}>
              <Slider ref={sliderRef} {...settings}>
                {currentReading.questions.map((question) => (
                  <div key={question.id} className={styles.questionSlide}>
                    <div className={styles.question}>
                      <p className={styles.questionText}>{question.question}</p>
                      <div className={styles.optionsContainer}>
                        {question.options.map((option, index) => (
                          <button
                            key={index}
                            className={styles.optionButton}
                            onClick={() => handleOptionClick(question.id, option)}
                            disabled={gameFinished}
                            style={{
                              backgroundColor: selectedAnswers[question.id] === option ? '#4caf50' : '#f0f0f0',
                              color: selectedAnswers[question.id] === option ? 'white' : 'black'
                            }}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </Slider>
            </div>

            <div className={styles.navigationButtons}>
              <button onClick={() => sliderRef.current.slickPrev()} className={styles.prevButton}>Anterior</button>
              <button onClick={() => sliderRef.current.slickNext()} className={styles.nextButton}>Siguiente</button>
            </div>

            <button
              onClick={handleSubmit}
              className={styles.submitButton}
              disabled={Object.keys(selectedAnswers).length !== currentReading.questions.length}
            >
              Enviar Respuestas
            </button>
          </>
        ) : (
          <div className={styles.results}>
            <h2 className={styles.gameTitle}>¡Juego Terminado!</h2>
            <p>Puntuación final: {score} / {currentReading.questions.length}</p>
            <p>Tiempo total: {timer} segundos</p>
          </div>
        )}
      </div>
      <ToastContainer />
    </div>
  );
};

export default ActivityScreen8;
