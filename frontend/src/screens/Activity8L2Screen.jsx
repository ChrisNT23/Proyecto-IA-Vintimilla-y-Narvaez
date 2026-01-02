// src/screens/ActivityScreen8L2.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Slider from 'react-slick';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import "slick-carousel/slick/slick.css"; 
import "slick-carousel/slick/slick-theme.css";
import { useRecordActivityMutation } from '../slices/treatmentSlice'; // Importa el hook de mutación
import { useSelector } from 'react-redux';

// Importa el CSS Module
import styles from '../assets/styles/ActivityScreen8L2.module.css';

// Definir las lecturas del Nivel Dos con sus respectivas preguntas
const levelTwoReadings = [
  {
    id: 1,
    title: 'Hasta que la muerte nos separe',
    story: `Ezra era un joven que vivía anticipándose a las pérdidas. Se había pasado la mitad de su infancia deseando que ese período no terminara, y el resto de su vida, añorando esos instantes de belleza y libertad. Su hermano Amos era absolutamente diferente, lo único que le importaba era el presente y vivía cada instante como si fuera el último.
    
Entre Amos y Ezra había una extrema conexión; tal es así que cuando eran pequeños solían incluso enfermar juntos. El primero en indisponerse siempre era Ezra y a los pocos días su hermano aparecía a con los exactos síntomas y era diagnosticado y tratado de la misma manera que él. Amos culpaba a Ezra por enfermarse y pasarle su mal; sin embargo, no había días que disfrutara más que aquéllos que transcurría encerrado junto a su hermano.
    
El tiempo pasó y las circunstancias provocaron que entre los hermanos se abriera un abismo. La muerte de los padres fue un detonante importante de aquella separación ya que a Ezra le costó mucho aceptarla y cada vez que se veían se echaba a llorar desconsoladamente como cuando era niño. Amos decidió que no podía seguir viéndolo porque tarde o temprano conseguiría que también él cayera en ese pozo oscuro del que Ezra no mostraba indicios de querer salir. Además, Amos pensó que si dejaba de ver a su hermano evitaría morir de joven, cosa a la que le tenía muchísimo miedo. Estaba convencido de que por la forma de ser de Ezra pronto enfermaría de algo grave y si él lo sabía, posiblemente desarrollaría la misma dolencia. Y si de algo estaba seguro era de no querer morir.
    
Amos no estaba tan equivocado; Ezra enfermó gravemente a los treinta años y debió someterse a dos largos años de tratamiento y sufrimiento, en la más absoluta soledad. Al regresar a su casa, el mismo día en el que le habían dado el alta, encontró un mensaje en el contestador de su teléfono: su hermano, Amos acababa de fallecer de la misma enfermedad que él había vencido.`,
    questions: [
      {
        id: 1,
        question: '¿Cuál era la principal diferencia entre Ezra y Amos?',
        options: [
          'Ezra vivía enfocado en el presente y Amos en el pasado.',
          'Ezra vivía anticipándose a las pérdidas, mientras que Amos vivía cada instante como si fuera el último.',
          'Amos era más optimista y Ezra más pesimista.',
          'Ezra tenía una vida tranquila y Amos era muy activo.'
        ],
        correctAnswer: 'Ezra vivía anticipándose a las pérdidas, mientras que Amos vivía cada instante como si fuera el último.'
      },
      {
        id: 2,
        question: '¿Qué los unía profundamente cuando eran niños?',
        options: [
          'Su gusto por las aventuras.',
          'Su conexión con sus padres.',
          'Su habilidad para enfermar al mismo tiempo.',
          'Su interés por el mismo deporte.'
        ],
        correctAnswer: 'Su habilidad para enfermar al mismo tiempo.'
      },
      {
        id: 3,
        question: '¿Por qué Amos decidió alejarse de Ezra?',
        options: [
          'Porque se peleaban constantemente.',
          'Porque Ezra nunca superó la muerte de sus padres y Amos temía que lo afectara también.',
          'Porque Amos quería mudarse a otro país.',
          'Porque Amos se volvió más independiente con el tiempo.'
        ],
        correctAnswer: 'Porque Ezra nunca superó la muerte de sus padres y Amos temía que lo afectara también.'
      },
      {
        id: 4,
        question: '¿Qué ocurrió con Ezra a los treinta años?',
        options: [
          'Murió debido a una grave enfermedad.',
          'Se separó por completo de Amos.',
          'Enfermó gravemente, pero logró vencer la enfermedad tras dos años de tratamiento.',
          'Decidió buscar a Amos para reconciliarse.'
        ],
        correctAnswer: 'Enfermó gravemente, pero logró vencer la enfermedad tras dos años de tratamiento.'
      },
      {
        id: 5,
        question: '¿Qué le ocurrió a Amos el día en que Ezra recibió el alta médica?',
        options: [
          'Fue a visitarlo para reconciliarse.',
          'Murió de la misma enfermedad que Ezra había superado.',
          'Decidió escribirle una carta de disculpa.',
          'Se mudó a otra ciudad para evitar el reencuentro.'
        ],
        correctAnswer: 'Murió de la misma enfermedad que Ezra había superado.'
      }
    ]
  },
  {
    id: 2,
    title: 'Nahuel quiere cantar',
    story: `‘¡Vete y no vengas más! La música no es para ti’. Al escuchar a su profesora Nahuel se puso muy triste y, completamente confundido y frustrado, abandonó la clase de canto. No hay nada más triste para un niño que oír de labios de un mayor en el que confía que justo lo único que desea hacer en su vida no es para él.
    
Por suerte, Nahuel era un niño muy seguro de sí mismo; y la negativa de su profesora de canto de seguir enseñándole le sirvió como impulso para buscar su propio camino. Le esperaban momentos de mucha desesperación que sabría enfrentar con todas sus energías. Comenzó escuchando todo lo que llegaba a sus manos y entrenando su oído con disciplina. Una tarde se dijo ‘si aprendemos a hablar imitando, ¿por qué no hacer lo mismo con la música?’ Así fue como empezó a imitar a sus cantantes favoritos. Pero tampoco conseguía demasiado con ello; podía imitarlos pero algo había en su voz que sonaba sumamente raro y descontrolado.
    
Una tarde, mientras dejaba pasar el día sentado en el banco de un parque, se le acercó un joven que traía un inmenso armatoste en una mano, su contrabajo. Se pusieron a conversar; Nahuel no perdía un sólo momento para aprender más cosas relacionadas con el mundo de la música del que se sentía totalmente enamorado.
    
En un momento el joven le dijo ‘Tú tienes una voz maravillosa. Tu problema es que no confías en ti e intentas hacer lo que hacen otros; no dejas fluir tu propia voz. Sería bueno que tomaras clases para aprender cuestiones importantes respecto a la técnica, pero antes de ello tienes que encontrar tu voz’.
    
Desde ese día la vida de Nahuel cambió para siempre. Comenzó a soltarse y lo que encontró que era capaz de hacer con su voz lo dejó asombrado. Atrás había quedado ese día en que la profesora lo echó de la clase; pero no en vano.
    
Una tarde mientras ella disfrutaba de un concierto importante que se realizaba en su ciudad descubrió que Nahuel era uno de los cantantes principales. Al finalizar el concierto se le acercó y le pidió disculpas por haberlo tratado tan duramente aquella tarde. Nahuel ya había andado demasiado y se sentía a gusto consigo mismo; le dijo que lo sentía muchísimo pero que no la recordaba, ‘pero le agradezco que haya venido a verme’, le dijo. Y ella abandonó el teatro cabizbaja mientras él continuaba saludando a la gente y haciéndose fotos con el público.`,
    questions: [
      {
        id: 1,
        question: '¿Qué fue lo que la profesora de canto le dijo a Nahuel?',
        options: [
          'Que tenía mucho talento, pero necesitaba práctica.',
          'Que la música no era para él y debía dejar las clases.',
          'Que debería cambiar de instrumento para progresar.',
          'Que debía enfocarse más en su educación general.'
        ],
        correctAnswer: 'Que la música no era para él y debía dejar las clases.'
      },
      {
        id: 2,
        question: '¿Cómo reaccionó Nahuel tras el comentario de su profesora?',
        options: [
          'Abandonó por completo la música.',
          'Decidió cambiar de profesor inmediatamente.',
          'Se sintió triste, pero lo usó como motivación para buscar su propio camino.',
          'Se dedicó únicamente a tocar un instrumento.'
        ],
        correctAnswer: 'Se sintió triste, pero lo usó como motivación para buscar su propio camino.'
      },
      {
        id: 3,
        question: '¿Qué consejo importante le dio el joven del parque a Nahuel?',
        options: [
          'Que imitara a los cantantes famosos para perfeccionar su técnica.',
          'Que tomara clases únicamente de contrabajo.',
          'Que debía encontrar su propia voz antes de preocuparse por la técnica.',
          'Que evitara escuchar música de otros artistas.'
        ],
        correctAnswer: 'Que debía encontrar su propia voz antes de preocuparse por la técnica.'
      },
      {
        id: 4,
        question: '¿Qué ocurrió al final de la historia entre Nahuel y su antigua profesora?',
        options: [
          'Ella le pidió disculpas, pero Nahuel le dijo que no la recordaba.',
          'Se reconciliaron y comenzaron a trabajar juntos nuevamente.',
          'Nahuel decidió evitar hablar con ella después del concierto.',
          'Ella se convirtió en su mayor seguidora.'
        ],
        correctAnswer: 'Ella le pidió disculpas, pero Nahuel le dijo que no la recordaba.'
      },
      {
        id: 5,
        question: '¿Qué lección principal transmite esta historia?',
        options: [
          'La importancia de seguir los consejos de los demás sin cuestionarlos.',
          'Que el éxito solo llega si imitas a los grandes artistas.',
          'La resiliencia y la búsqueda de la autenticidad personal pueden transformar los fracasos en oportunidades.',
          'Que no vale la pena perseguir un sueño si alguien duda de ti.'
        ],
        correctAnswer: 'La resiliencia y la búsqueda de la autenticidad personal pueden transformar los fracasos en oportunidades.'
      }
    ]
  },
  {
    id: 3,
    title: 'La mariposa blanca',
    story: `"Había una vez en Japón un anciano cuyo nombre era el de Takahama, y que vivía desde su juventud en una pequeña casa que él mismo había construido junto a un cementerio, en lo alto de una colina. Era un hombre amado y respetado por su amabilidad y generosidad, pero los lugareños a menudo se preguntaban porqué vivía en soledad al lado del cementerio y por qué nunca se había casado.
    
Un día el anciano enfermó de gravedad, estando cercana ya su muerte, y su cuñada y su sobrino fueron a cuidarle en sus últimos momentos y le aseguraron que estarían junto a él todo lo que necesitara. Especialmente su sobrino, quien no se separaba del anciano.
    
Un día, en que la ventana de la habitación estaba abierta, se coló una pequeña mariposa blanca en el interior. El joven intentó espantarla en varias ocasiones, pero la mariposa siempre volvía al interior, y finalmente, cansado, la dejó revolotear al lado del anciano.
    
Tras largo rato, la mariposa abandonó la habitación y el joven, curioso por su comportamiento y maravillado por su belleza, la siguió. El pequeño ser voló hasta el cementerio que existía al lado de la casa y se dirigió a una tumba, alrededor de la cual revolotearía hasta desaparecer. Aunque la tumba era muy antigua, estaba limpia y cuidada, rodeada de flores blancas frescas. Tras la desaparición de la mariposa, el joven sobrino volvió a la casa con su tío, para descubrir que este había muerto.
    
El joven corrió a contarle a su madre lo sucedido, incluyendo el extraño comportamiento de la mariposa, ante lo que la mujer sonrió y le contó al joven el motivo por el que el anciano Takahana había pasado su vida allí.
    
En su juventud, Takahana conoció y se enamoró de una joven llamada Akiko, con la cual iba a casarse. Sin embargo, pocos días antes del enlace la joven falleció. Ello sumió a Takahama en la tristeza, de la que conseguiría recuperarse. Pero sin embargo decidió que nunca se casaría, y fue entonces cuando construyó la casa al lado del cementerio con el fin de poder visitar y cuidar todos los días la tumba de su amada.
    
El joven reflexionó y entendió quién era la mariposa, y que ahora su tío Takahama se había reunido al fin con su amada Akiko".`,
    questions: [
      {
        id: 1,
        question: '¿Dónde vivía el anciano Takahama?',
        options: [
          'En el centro de un pueblo bullicioso.',
          'En una pequeña casa junto a un cementerio en una colina.',
          'En una casa rodeada de campos de arroz.',
          'En una ciudad cerca del mar.'
        ],
        correctAnswer: 'En una pequeña casa junto a un cementerio en una colina.'
      },
      {
        id: 2,
        question: '¿Qué hizo el joven sobrino cuando vio a la mariposa blanca?',
        options: [
          'La atrapó para observarla más de cerca.',
          'La ignoró porque no parecía importante.',
          'Intentó espantarla, pero al final decidió seguirla.',
          'Cerró la ventana para que no volviera a entrar.'
        ],
        correctAnswer: 'Intentó espantarla, pero al final decidió seguirla.'
      },
      {
        id: 3,
        question: '¿Qué descubrió el joven cuando siguió a la mariposa al cementerio?',
        options: [
          'Que la mariposa desapareció sobre una tumba limpia y cuidada.',
          'Que había muchas mariposas blancas en el lugar.',
          'Que la mariposa se posó en una flor blanca.',
          'Que la mariposa lo llevó a una tumba vacía.'
        ],
        correctAnswer: 'Que la mariposa desapareció sobre una tumba limpia y cuidada.'
      },
      {
        id: 4,
        question: '¿Por qué Takahama vivió junto al cementerio toda su vida?',
        options: [
          'Porque le gustaba la tranquilidad del lugar.',
          'Porque cuidaba la tumba de su amada Akiko, quien murió antes de casarse con él.',
          'Porque temía alejarse de los espíritus.',
          'Porque heredó la casa de su familia.'
        ],
        correctAnswer: 'Porque cuidaba la tumba de su amada Akiko, quien murió antes de casarse con él.'
      },
      {
        id: 5,
        question: '¿Qué simboliza la mariposa blanca en la historia?',
        options: [
          'El alma de la madre de Takahama.',
          'El alma de Akiko, mostrando que ahora Takahama podría reunirse con ella.',
          'La llegada de la primavera y la vida eterna.',
          'Un simple insecto sin conexión con la historia.'
        ],
        correctAnswer: 'El alma de Akiko, mostrando que ahora Takahama podría reunirse con ella.'
      }
    ]
  },
  {
    id: 4,
    title: 'El fantasma provechoso (Daniel Defoe)',
    story: `"Había una vez un caballero que poseía una casa muy muy vieja, construida aprovechando los restos de un antiguo monasterio. El caballero decidió que quería derruirla, pero sin embargo consideraba dicha tarea implicaría demasiado esfuerzo y dinero, y empezó a pensar en alguna manera de lograr hacerlo sin que le supusiera a él ningún costo.
    
El hombre decidió entonces crear y empezar a difundir el rumor de que la casa estaba encantada y habitada por un fantasma. Elaboró también con sábanas un traje o disfraz blanco, junto a un artefacto explosivo que generara una llamarada y dejara tras de sí olor a azufre. Tras contar el rumor a varias personas, entre ellas algunos incrédulos, les convenció de que acudieran a su casa. Allí activó el ingenio, provocando que los vecinos se asustaran y creyeren que el rumor era cierto. Poco a poco más y más gente iría viendo a dicho ente espectral, y el rumor fue creciendo y extendiéndose entre los lugareños.
    
Tras ello, el caballero extendió también el rumor de que el motivo de que el fantasma estuviera allí podría ser el hecho de que hubiese en la casa un tesoro escondido, así que en poco tiempo empezó a excavar para encontrarlo. A pesar de que no lo hacía, los vecinos empezaron también a creer que sí podía haber algún tesoro en el lugar. Y un día, algunos vecinos le preguntaron si podían ayudarle a excavar, a cambio de que pudieran coger el tesoro.
    
El propietario de la casa respondió que no sería justo que le tirasen la casa abajo y se llevaran el tesoro, pero magnánimamente les ofreció que si excavaban y retiraban los escombros que su acción generase y en el proceso encontraban el tesoro, él aceptaría que se llevaran la mitad. Los vecinos aceptaron y se pusieron a trabajar.
    
Al poco tiempo el fantasma desapareció, pero de cara a motivarles el caballero dispuso veintisiete monedas de oro en un agujero de la chimenea que después tapió. Cuando los vecinos lo encontraron, les ofreció quedárselo todo siempre y cuando el resto que hallaran lo repartieran. Ello motivó aún más a los vecinos, que ante la esperanza de encontrar más fueron excavando hasta los cimientos. De hecho, sí encontraron algunos objetos de valor del antiguo monasterio, algo que los espoleó aún más. Al final, la casa fue derruida por entero y los escombros retirados, cumpliendo el caballero con su deseo y empleando para ello apenas un poco de ingenio".`,
    questions: [
      {
        id: 1,
        question: '¿Por qué quería el caballero derruir su casa?',
        options: [
          'Porque quería construir un monasterio en su lugar.',
          'Porque era muy vieja y ya no le gustaba.',
          'Porque los vecinos le pedían que la demoliera.',
          'Porque quería vender el terreno para ganar dinero.'
        ],
        correctAnswer: 'Porque era muy vieja y ya no le gustaba.'
      },
      {
        id: 2,
        question: '¿Cómo convenció el caballero a los vecinos de que la casa estaba encantada?',
        options: [
          'Les mostró libros antiguos que hablaban de fantasmas.',
          'Contrató a actores para fingir apariciones fantasmales.',
          'Creó un disfraz de fantasma con sábanas y usó un artefacto explosivo para simular el olor a azufre.',
          'Contó historias reales de antiguos propietarios que habían muerto allí.'
        ],
        correctAnswer: 'Creó un disfraz de fantasma con sábanas y usó un artefacto explosivo para simular el olor a azufre.'
      },
      {
        id: 3,
        question: '¿Qué rumor añadió el caballero para atraer más interés hacia la casa?',
        options: [
          'Que era el lugar donde vivió un famoso alquimista.',
          'Que había un tesoro escondido en la casa.',
          'Que el fantasma ofrecía oro a quien lo enfrentara.',
          'Que había túneles secretos debajo de la casa.'
        ],
        correctAnswer: 'Que había un tesoro escondido en la casa.'
      },
      {
        id: 4,
        question: '¿Qué estrategia utilizó el caballero para motivar a los vecinos a derruir la casa?',
        options: [
          'Les prometió una gran recompensa si terminaban la demolición.',
          'Les permitió quedarse con parte del tesoro si ayudaban a excavar y retirar los escombros.',
          'Les pidió ayuda en nombre de un supuesto espíritu que quería descansar en paz.',
          'Les ofreció la casa a cambio de su ayuda.'
        ],
        correctAnswer: 'Les permitió quedarse con parte del tesoro si ayudaban a excavar y retirar los escombros.'
      },
      {
        id: 5,
        question: '¿Qué colocó el caballero en la chimenea para mantener la motivación de los vecinos?',
        options: [
          'Un falso tesoro hecho de piedras pintadas.',
          'Veintisiete monedas de oro que los vecinos encontraron.',
          'Una carta que confirmaba la existencia de más tesoros.',
          'Una llave que supuestamente abría un cofre escondido.'
        ],
        correctAnswer: 'Veintisiete monedas de oro que los vecinos encontraron.'
      }
    ]
  },
  {
    id: 5,
    title: 'El ciervo escondido',
    story: `"Había una vez un leñador de Cheng que encontró un ciervo en un campo, al cual mató y posteriormente enterró con hojas y ramas para evitar que otros descubrieran la pieza. Pero al poco tiempo, el leñador se olvidó del lugar donde había ocultado el animal y llegó a creer que en realidad todo el asunto había sido un sueño.
    
Poco después empezaría a contar su supuesto sueño, a lo que uno de los que lo escuchó reaccionó intentando buscar el ciervo. Tras encontrarlo, se lo llevó a su casa y le comentó a su mujer la situación, la cual le indicó que tal vez sería él quien había soñado la conversación con el leñador, pese a que al haber encontrado el animal el sueño sería real. A esto, su esposo contestó que independientemente de si el sueño fuera suyo o del leñador, no había necesidad de saberlo.
    
Pero esa misma noche el leñador que cazó al animal soñó (este vez de verdad) con el lugar donde había escondido el cadáver y con la persona que lo había encontrado. Por la mañana fue a casa del descubridor del cuerpo del animal, tras lo que ambos hombres discutieron respecto a quién pertenecía la pieza. Esta discusión se intentaría zanjar con la ayuda de un juez, el cual repuso que por un lado el leñador había matado a un ciervo en lo que creía un sueño y posteriormente consideró que su segundo sueño era una verdad, mientras que el otro encontró dicho ciervo aunque su esposa consideraba que era él quien soñó haberlo encontrado en base a la historia del primero.
    
La conclusión era que realmente nadie había matado al animal, y se dictó que el caso se resolviera mediante la repartición del animal entre los dos hombres. Posteriormente, esta historia llegaría al rey de Cheng, quien terminaría por preguntarse si realmente no sería el juez quien había soñado haber repartido al ciervo".`,
    questions: [
      {
        id: 1,
        question: '¿Qué le sucedió al leñador después de enterrar el ciervo?',
        options: [
          'Recordó perfectamente dónde lo escondió.',
          'Se olvidó del lugar y llegó a pensar que todo había sido un sueño.',
          'Se lo contó a su esposa para que le ayudara a buscarlo.',
          'Volvió al lugar y encontró el ciervo por casualidad.'
        ],
        correctAnswer: 'Se olvidó del lugar y llegó a pensar que todo había sido un sueño.'
      },
      {
        id: 2,
        question: '¿Quién encontró el ciervo enterrado después de escuchar la historia del leñador?',
        options: [
          'El juez.',
          'Un amigo del leñador.',
          'Un hombre que escuchó el supuesto sueño del leñador.',
          'La esposa del leñador.'
        ],
        correctAnswer: 'Un hombre que escuchó el supuesto sueño del leñador.'
      },
      {
        id: 3,
        question: '¿Qué le aconsejó la esposa del hombre que encontró el ciervo?',
        options: [
          'Que se quedara con el animal y no dijera nada.',
          'Que devolviera el ciervo al leñador.',
          'Que quizás él había soñado encontrar el ciervo tras oír la historia.',
          'Que le contara todo al juez para resolver el problema.'
        ],
        correctAnswer: 'Que quizás él había soñado encontrar el ciervo tras oír la historia.'
      },
      {
        id: 4,
        question: '¿Qué sucedió cuando el leñador soñó nuevamente con el ciervo?',
        options: [
          'Encontró otro ciervo en el mismo lugar.',
          'Recordó dónde lo había enterrado y quién lo había encontrado.',
          'Descubrió que nunca había cazado al ciervo.',
          'Se dio cuenta de que todo había sido un sueño desde el principio.'
        ],
        correctAnswer: 'Recordó dónde lo había enterrado y quién lo había encontrado.'
      },
      {
        id: 5,
        question: '¿Cómo resolvió el juez el conflicto entre los dos hombres?',
        options: [
          'Decidió que el leñador tenía todos los derechos sobre el ciervo.',
          'Dictaminó que el hombre que lo encontró debía quedarse con él.',
          'Determinó que el ciervo no pertenecía a nadie y ordenó repartirlo entre ambos.',
          'Declaró que el ciervo debía ser entregado al rey de Cheng.'
        ],
        correctAnswer: 'Determinó que el ciervo no pertenecía a nadie y ordenó repartirlo entre ambos.'
      }
    ]
  }
];


const ActivityScreen8L2 = ({ activity, treatmentId }) => { // Recibe 'activity' y 'treatmentId' como props 
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
    const lastReadingId = localStorage.getItem('lastReadingId_Level2');
    let availableReadings = levelTwoReadings;

    if (levelTwoReadings.length > 1 && lastReadingId) {
      availableReadings = levelTwoReadings.filter(reading => reading.id !== parseInt(lastReadingId));
    }

    const randomIndex = Math.floor(Math.random() * availableReadings.length);
    const selected = availableReadings[randomIndex];

    setCurrentReading(selected);
    localStorage.setItem('lastReadingId_Level2', selected.id);
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

export default ActivityScreen8L2;
