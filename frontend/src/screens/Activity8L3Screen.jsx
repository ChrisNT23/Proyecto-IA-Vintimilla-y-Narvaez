// src/screens/ActivityScreen8L3.jsx

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
import styles from '../assets/styles/ActivityScreen8L3.module.css';

// Definir las lecturas con sus respectivas preguntas para el nivel tres
const readings = [
  {
    id: 1,
    title: 'El hombre que contaba historias (Oscar Wilde)',
    story: `Este relato nos sitúa en un pequeño pueblo en medio del bosque y frente al mar, donde vivía un hombre sabio que salía del pueblo cada mañana y por la noche regresaba para contar fantásticas historias a los lugareños que lo escuchaban atentamente.
  
Cuando volvía el hombre sabio le preguntaban insistentemente:
  
- ¿Cuéntanos, ¿Qué has visto hoy?
  
A lo que él respondía con su voz suave y pausada:
  
- He visto a un fauno que tocaba una melodía hermosa con su flauta y con ella obligaba a bailar en círculo a un grupo de silvanos.
  
- ¿Y qué más has visto? Preguntaban insistentemente los aldeanos al hombre sabio.
  
- He visto a 3 sirenas mientras me dirigía a la orilla del mar, todas ellas eran criaturas hermosas que peinaban sus verdes cabellos con un peine de oro.
  
Estas historias fascinaban a todos y cada uno de los habitantes del pueblo, desde niños hasta adultos e incluso a los viejos. Es por eso que todos los vecinos del pueblo lo apreciaban por encima de cualquier otro habitante.
  
Una mañana el hombre que contaba historias salió de nuevo hacia el mar y vio a tres sirenas en el filo de las olas, que peinaban sus largos cabellos verdes con un peine de oro.
  
Asustado, el hombre se dirigió de nuevo hacia el bosque para regresar a casa, y allí vio con sus propios ojos a un fauno que tañía delicadamente su flauta y con sus sonidos hacía bailar a un grupo de silvanos que se encontraban con él.
  
Cuando regresó al pueblo esa misma noche, todos los habitantes le preguntaron, como de costumbre, qué es lo que había visto, a lo que él contestó.
  
- No he visto nada.
  
Este relato corto de Oscar Wilde es uno de los más sorprendentes e imaginativos del genio irlandés, y nos habla de las apariencias, de la mentira y de cómo no siempre todo es lo que parece.`,
    questions: [
      {
        id: 1,
        question: '¿Dónde vivía el hombre que contaba historias?',
        options: [
          'En un valle rodeado de montañas.',
          'En un puente de cristal.',
          'En un pequeño pueblo en medio del bosque y frente al mar.',
          'En una isla desierta.',
          'En una casa sobre un acantilado.',
          'En una ciudad bulliciosa.'
        ],
        correctAnswer: 'En un pequeño pueblo en medio del bosque y frente al mar.'
      },
      {
        id: 2,
        question: '¿Qué personajes mencionaba el hombre sabio en sus relatos?',
        options: [
          'Dragones y unicornios.',
          'Faunos y sirenas.',
          'Magos y caballeros.',
          'Silvanos y ogros.',
          'Sirenas y ninfas del río.',
          'Faunos y gnomos del bosque.'
        ],
        correctAnswer: 'Faunos y sirenas.'
      },
      {
        id: 3,
        question: '¿Qué acción realizaban las sirenas según las historias del hombre sabio?',
        options: [
          'Cantaban melodías mágicas para atraer marineros.',
          'Jugaban en las olas y recogían perlas del mar.',
          'Peinaban sus cabellos verdes con un peine de oro.',
          'Se transformaban en aves para volar sobre el océano.',
          'Tocaban arpas mientras nadaban cerca de la costa.',
          'Bailaban bajo el agua en un círculo encantado.'
        ],
        correctAnswer: 'Peinaban sus cabellos verdes con un peine de oro.'
      },
      {
        id: 4,
        question: '¿Por qué el hombre sabio dijo "No he visto nada" la última vez que regresó al pueblo?',
        options: [
          'Porque estaba cansado de contar historias.',
          'Porque vio que sus relatos eran más valorados que la realidad.',
          'Porque las historias que solía inventar se hicieron realidad.',
          'Porque temía que los aldeanos dejaran de creerle.',
          'Porque no quería que los aldeanos conocieran la verdad.',
          'Porque había olvidado lo que vio ese día.'
        ],
        correctAnswer: 'Porque las historias que solía inventar se hicieron realidad.'
      },
      {
        id: 5,
        question: '¿Cuál es la enseñanza principal de este relato?',
        options: [
          'Las historias imaginarias son más valiosas que la verdad.',
          'No siempre la realidad es como la imaginamos.',
          'Los secretos deben ser guardados para preservar la paz.',
          'El poder de las palabras puede engañar incluso al sabio.',
          'Las criaturas mágicas existen si creemos en ellas.',
          'No se debe mentir, aunque sea para divertir a los demás.'
        ],
        correctAnswer: 'No siempre la realidad es como la imaginamos.'
      }
    ]
  },
  {
    id: 2,
    title: 'El fuego y el Clarín (Jorge Bucay)',
    story: `"Cuenta la leyenda que había un pueblo en el que se producían incendios devastadores con gran frecuencia, que arrasaban con las casas y los edificios de todo el mundo a cada poco tiempo.
  
Los habitantes del pueblo decidieron reunirse un buen día para poner fin a la oleada de incendios que se producían cada vez con más frecuencia y para ello pusieron en común una serie de propuestas aportadas por todos los lugareños.
  
En medio de la reunión y entre todo el griterío que se había organizado, un joven alzó la voz y explicó su propuesta:
  
- Me he dado cuenta de que cruzando el pueblo, al otro lado del bosque hay un pueblo muy similar al nuestro que nunca tiene incendios como los que tenemos nosotros. Propongo viajar hasta allí y averiguar cuál es su secreto.
  
Al escuchar las sabias palabras del joven, todo el pueblo estuvo de acuerdo en que esa era la mejor opción, así que le encomendaron la difícil misión de viajar al otro pueblo y recabar información útil para solventar el problema de los incendios.
  
Tras largas horas de viaje, el joven llegó finalmente al pueblo que se encontraba al final del bosque, donde un grupo de lugareños le esperaba amistosamente para explicar su secreto.
  
- No es que tengamos menos incendios que vosotros - le comentaron los vecinos del nuevo pueblo - Simplemente nos preocupamos más de apagarlos cuanto antes y con más rapidez que vosotros.
  
- ¿Y cómo hacéis para apagarlos antes que nosotros? - preguntó el joven confundido.
  
- Muy sencillo, tenemos un clarín (una especie de corneta), que tocamos en seguida que se produce un incendio para alertar al resto del pueblo.
  
Tras oír el gran secreto, el joven regresó rápidamente al pueblo para contárselo a todo el mundo. Una vez allí compraron un clarín que colocaron en el centro de la plaza del pueblo, sobre un atril.
  
De esta forma, tanto el joven como todos los habitantes del pueblo ya estaban seguros de que sus problemas con los incendios se habrían acabado, ya que haciendo uso del clarín se podía advertir rápidamente a todo el mundo.
  
Sin embargo, en la realidad eso no fue lo que ocurrió, ya que en ese pueblo nadie sabía tocar el clarín y los incendios siguieron sucediéndose y arrasando todo sin que ningún habitante pudiera hacer nada.`,
  
    questions: [
      {
        id: 1,
        question: '¿Qué problema enfrentaba el pueblo de la historia?',
        options: [
          'Inundaciones frecuentes.',
          'Incendios devastadores que arrasaban con todo.',
          'Ataques de animales salvajes.',
          'Falta de alimentos para sobrevivir.',
          'Epidemias constantes entre los habitantes.',
          'Conflictos con pueblos vecinos.'
        ],
        correctAnswer: 'Incendios devastadores que arrasaban con todo.'
      },
      {
        id: 2,
        question: '¿Cuál fue la propuesta del joven durante la reunión?',
        options: [
          'Construir casas más resistentes al fuego.',
          'Investigar por qué los incendios ocurrían con tanta frecuencia.',
          'Viajar a un pueblo cercano que no sufría incendios para aprender su método.',
          'Buscar un río cercano para obtener más agua.',
          'Contratar expertos en apagar incendios.',
          'Evacuar el pueblo y buscar otro lugar para vivir.'
        ],
        correctAnswer: 'Viajar a un pueblo cercano que no sufría incendios para aprender su método.'
      },
      {
        id: 3,
        question: '¿Qué secreto revelaron los habitantes del otro pueblo?',
        options: [
          'Tenían un sistema de riego que apagaba los incendios automáticamente.',
          'Usaban magia para evitar que el fuego se propagara.',
          'Tocaban un clarín para alertar rápidamente a todos sobre el incendio.',
          'Construían sus casas con materiales que no eran inflamables.',
          'Tenían un lago que usaban como fuente de agua para extinguir el fuego.',
          'Plantaban árboles resistentes al fuego alrededor del pueblo.'
        ],
        correctAnswer: 'Tocaban un clarín para alertar rápidamente a todos sobre el incendio.'
      },
      {
        id: 4,
        question: '¿Por qué no funcionó el clarín en el pueblo del joven?',
        options: [
          'Porque nadie sabía tocarlo.',
          'Porque el clarín no era lo suficientemente fuerte.',
          'Porque los incendios ocurrían durante la noche.',
          'Porque no tenían suficiente tiempo para reaccionar.',
          'Porque los incendios eran muy intensos y difíciles de controlar.',
          'Porque no lo colocaron en el lugar correcto.'
        ],
        correctAnswer: 'Porque nadie sabía tocarlo.'
      },
      {
        id: 5,
        question: '¿Qué enseñó esta historia?',
        options: [
          'Los problemas siempre tienen una solución rápida si buscamos ayuda.',
          'Es mejor abandonar los problemas en lugar de enfrentarlos.',
          'Imitar soluciones de otros no siempre funciona si no se adaptan a nuestras circunstancias.',
          'La tecnología siempre es la respuesta a los problemas modernos.',
          'La unión del pueblo puede superar cualquier obstáculo.',
          'Es importante investigar los problemas a fondo antes de actuar.'
        ],
        correctAnswer: 'Imitar soluciones de otros no siempre funciona si no se adaptan a nuestras circunstancias.'
      }
    ]
  },
  {
    id: 3,
    title: 'La casa sin escapatoria',
    story: `En la espesura de un bosque antiguo, donde los árboles se elevan majestuosos guardando secretos de eras pasadas, se ocultaba una mansión cuyas historias se habían entrelazado con el hilo del tiempo hasta volverse leyendas.
  
La familia Morales, seducida por el misterio y la promesa de una vida nueva, eligió este lugar para comenzar de nuevo, ignorando los susurros que se deslizaban entre las sombras del bosque.
  
La vida en la mansión comenzó como un idilio, un retiro pacífico lejos del caos del mundo exterior.
  
Pero a medida que las estaciones cambiaban, el encanto inicial dio paso a una serie de eventos que desafiaban toda explicación lógica.
  
Ruidos en la noche rompían el silencio con una urgencia que helaba la sangre, y sombras sin dueño danzaban en las paredes, como si antiguos habitantes invisibles despertaran.
  
Lucía, la hija menor de los Morales, se encontró en el centro de este torbellino sobrenatural.
  
Noches en vela, acosada por visiones de una dama vestida de luto, cuya presencia se sentía tan real que el aire parecía cargarse con su desesperación silenciosa.
  
Esta aparición, atrapada entre mundos, buscaba desesperadamente comunicarse, extendiendo su dolor más allá de la muerte.
  
Empujados por el amor a su hija y el deseo de desentrañar el misterio, los Morales indagaron en los oscuros rincones de la historia local.
  
Descubrieron que su hogar se erigía sobre un antiguo cementerio, olvidado por el tiempo pero no por aquellos que allí descansaban.
  
La dama de negro era el alma atormentada de una mujer cuyo amor, un sepulturero, había sido enterrado en ese mismo suelo, dejándola vagar en una búsqueda eterna.
  
La decisión de huir se convirtió en su única esperanza, pero la mansión tenía otros planes.
  
Cada intento de escape era frustrado por fenómenos aún más aterradores, con la dama de negro apareciendo en cada salida, sus ojos vacíos reflejando un abismo de soledad y desesperación.
  
La familia Morales se vio forzada a enfrentar la realidad: no eran dueños de su destino, sino peones en un juego macabro orquestado por la mansión y sus antiguos habitantes.
  
La casa, con sus raíces ancladas en el pasado y sus paredes impregnadas de tragedia, los había reclamado.
  
Pero Lucía, cuya conexión con el más allá había crecido, entendió que la clave para su liberación residía no en la huida, sino en la confrontación.
  
Guiada por sus visiones, la familia emprendió una última misión: liberar a la dama de negro de su tormento, uniendo su historia a la de la mansión para desentrañar el nudo de su maldición.
  
A través de rituales olvidados y la fuerza de su voluntad, los Morales lograron apaciguar el espíritu atormentado, ofreciéndole el descanso que tanto anhelaba.
  
Al hacerlo, no solo liberaron a la dama de negro, sino que también rompieron las cadenas que los ataban a la mansión.
  
La casa sin escapatoria se transformó entonces en un lugar de paso, un recordatorio de que incluso en los rincones más oscuros, la luz de la esperanza puede brillar.
  
La familia Morales, ahora custodios de este santuario entre mundos, decidió quedarse, guiando a otros que, como ellos, se encontraran perdidos entre las sombras del miedo y la duda.
  
Y así, la leyenda de la mansión y su dama de negro continúa, no como una historia de terror, sino como un cuento de redención y la eterna búsqueda de la paz.
  
Escucha atentamente, y entre el susurro de las hojas, encontrarás la verdad oculta en el corazón del bosque, en la casa que encontró su escapatoria.
  
Mira más cuentos cortos
  
Moraleja del cuento «La casa sin escapatoria»
Incluso en las sombras más profundas del miedo y la desesperación, la comprensión y la empatía pueden ser las llaves que desbloqueen puertas hacia la redención y la paz.
  
La verdadera libertad se encuentra al enfrentar nuestros miedos y al ayudar a otros a encontrar su camino hacia la luz.`,
  
    questions: [
      {
        id: 1,
        question: '¿Dónde se encuentra la mansión donde vivía la familia Morales?',
        options: [
          'En un valle rodeado de montañas.',
          'En la espesura de un bosque antiguo.',
          'Cerca de un lago cristalino.',
          'En una isla solitaria.',
          'En una casa sobre un acantilado.',
          'En una ciudad abandonada.'
        ],
        correctAnswer: 'En la espesura de un bosque antiguo.'
      },
      {
        id: 2,
        question: '¿Qué descubrieron los Morales al investigar la historia local de la mansión?',
        options: [
          'Que la mansión estaba construida sobre un volcán inactivo.',
          'Que la mansión había pertenecido a un mago.',
          'Que la casa se erigía sobre un antiguo cementerio olvidado.',
          'Que un grupo de exploradores desapareció en ese lugar.',
          'Que la casa tenía un tesoro oculto.',
          'Que la mansión era una ilusión creada por un espíritu.'
        ],
        correctAnswer: 'Que la casa se erigía sobre un antiguo cementerio olvidado.'
      },
      {
        id: 3,
        question: '¿Quién era la dama de negro que aparecía en la mansión?',
        options: [
          'Una bruja que habitaba en el bosque.',
          'Un espíritu atrapado buscando a su amado sepulturero.',
          'La dueña original de la mansión.',
          'La manifestación de los miedos de Lucía.',
          'Un fantasma que protegía un tesoro.',
          'Una figura creada por la imaginación de los Morales.'
        ],
        correctAnswer: 'Un espíritu atrapado buscando a su amado sepulturero.'
      },
      {
        id: 4,
        question: '¿Cómo lograron los Morales liberar a la dama de negro y romper la maldición?',
        options: [
          'Quemando la mansión hasta los cimientos.',
          'Construyendo un nuevo hogar para el espíritu.',
          'Realizando rituales olvidados y ofreciendo descanso al espíritu.',
          'Convenciendo a los habitantes del pueblo de ayudarles.',
          'Dejando ofrendas en el cementerio.',
          'Evitando cualquier contacto con la dama de negro.'
        ],
        correctAnswer: 'Realizando rituales olvidados y ofreciendo descanso al espíritu.'
      },
      {
        id: 5,
        question: '¿Qué mensaje transmite el cuento "La casa sin escapatoria"?',
        options: [
          'La fuerza física siempre supera al miedo.',
          'La comprensión y empatía son claves para la redención y la paz.',
          'Es mejor no involucrarse con lo desconocido.',
          'Las leyendas siempre son peligrosas.',
          'La familia es el único refugio contra el miedo.',
          'La unión del pueblo puede superar cualquier obstáculo.'
        ],
        correctAnswer: 'La comprensión y empatía son claves para la redención y la paz.'
      }
    ]
  },
  {
    id: 4,
    title: 'Los Zapatos de la esquina',
    story: `Bob era un muchacho demasiado rebelde y agitador, todos los profesores se quejaban de él, de sus palabras y conducta. Todos los días tenía que cumplir horas en detención por las cosas malas que hacía y lo peor de todo: Bob era un bully, un chico al que le encantaba burlarse de otros, hacer bromas de mal gusto e inclusive algunas veces golpear a otros compañeros que eran indefensos.
  
Sus padres atribuían su mala conducta al colegio, los maestros se la atribuían a sus padres, a Bob le daba lo mismo, disfrutaba burlarse de los demás en todo momento, tiraba las charolas de las manos de los alumnos, les ponía la zancadilla cada que podía, se burlaba de su forma de vestir e incluso de enfermedades que pudieran tener. Era una persona de muy mal corazón.
  
Caminando hacia su casa, después de salir de una detención un par de zapatos en una esquina llamaron su atención, no eran los más espectaculares que había visto en su vida, pero ¿qué importaba? Estaban abandonados en la calle, parecían nuevos y según su pensamiento, quien encuentra algo se lo queda. Al llegar a su casa decidió ponérselos para ir al cole en la mañana, no veía la hora de poder lanzar una patada o ponerle la zancadilla a alguien con sus nuevos zapatos.
  
El sol anunció la llegada de la mañana, Bob, muy entusiasmado se calzó los zapatos, le sorprendió mucho que fueran de su talla, eran perfectos. Bajó a desayunar sintiendo mucha emoción y se dirigió al cole. En el camino pudo sentir sus piernas temblando de la emoción, lo que le satisfacía en gran medida. A más de medio camino el temblor en sus piernas comenzaba a ser más notorio e incontrolable, como acto de magia sus pies se movieron de una forma divertida y apresurada. Cuando llegó a su salón de clases los alumnos no pudieron resistir una carcajada pues bailaba incontrolablemente y resultaba un espectáculo realmente gracioso.
  
Con cada hora que pasaba sus pies se movían más y más pasando de bailar polka a Flamenco en minutos, en cada salón que visitaba sus compañeros estallaban en carcajadas por sus graciosos movimientos. La noche llegó, Bob se sentía muy mal, por fin había vivido en carne propia lo que significaba ser el sujeto de burla y no le gustó, al llegar a su habitación comenzó a llorar arrepintiéndose de todas las cosas malas que había hecho en contra de sus compañeros, para su sorpresa los zapatos fueron desapareciendo poco a poco y sus piernas comenzaron a responderle. Muy feliz con esto y aprendiendo su lección, decidió pedir disculpas a todos sus compañeros y profesores. Nunca se preguntó el origen de los zapatos, para él lo más relevante fue haber cambiado como persona, ahora era un joven completamente diferente, se preocupaba por los demás y ayudaba de corazón a otras personas. Todo gracias a los zapatos de la esquina… ¿Quién sabe? Si hay un bully molestando quizás los zapatos aparezcan cuando menos se lo espere.`,
  
    questions: [
      {
        id: 1,
        question: '¿Cómo era la personalidad de Bob antes de encontrar los zapatos?',
        options: [
          'Era un chico tímido y reservado.',
          'Era un líder inspirador para sus compañeros.',
          'Era un rebelde y un bully que se burlaba y maltrataba a los demás.',
          'Era muy estudioso y querido por los profesores.',
          'Era indiferente, ni bueno ni malo.',
          'Era un defensor de sus compañeros contra los bullies.'
        ],
        correctAnswer: 'Era un rebelde y un bully que se burlaba y maltrataba a los demás.'
      },
      {
        id: 2,
        question: '¿Qué llamó la atención de Bob en su camino a casa después de la detención?',
        options: [
          'Un perro callejero.',
          'Una tienda de zapatos en liquidación.',
          'Un par de zapatos abandonados en una esquina.',
          'Un charco brillante bajo la luz de la luna.',
          'Un cuaderno olvidado en el suelo.',
          'Una bicicleta oxidada.'
        ],
        correctAnswer: 'Un par de zapatos abandonados en una esquina.'
      },
      {
        id: 3,
        question: '¿Qué le ocurrió a Bob después de ponerse los zapatos para ir al colegio?',
        options: [
          'Sus pies se movían de manera incontrolable y empezó a bailar.',
          'Se sintió más fuerte y comenzó a correr más rápido.',
          'Sintió un dolor terrible en los pies y se los quitó.',
          'Se volvió invisible por unos momentos.',
          'Los zapatos se rompieron antes de llegar al colegio.',
          'Los zapatos hicieron que se tropezara constantemente.'
        ],
        correctAnswer: 'Sus pies se movían de manera incontrolable y empezó a bailar.'
      },
      {
        id: 4,
        question: '¿Qué aprendió Bob después de usar los zapatos mágicos?',
        options: [
          'Que debía cuidar mejor su calzado.',
          'Que es divertido ser el centro de atención.',
          'Que ser el sujeto de burla es doloroso, y se arrepintió de sus actos.',
          'Que los zapatos mágicos pueden resolver todos los problemas.',
          'Que debía buscar zapatos más cómodos.',
          'Que sus compañeros eran muy graciosos.'
        ],
        correctAnswer: 'Que ser el sujeto de burla es doloroso, y se arrepintió de sus actos.'
      },
      {
        id: 5,
        question: '¿Cuál es el mensaje del cuento "Los Zapatos de la esquina"?',
        options: [
          'Quien encuentra algo, se lo queda.',
          'Los zapatos son una herramienta poderosa para cambiar la vida de las personas.',
          'La empatía y el arrepentimiento pueden transformar incluso a los más crueles.',
          'Los objetos mágicos siempre tienen un propósito misterioso.',
          'Debemos tener cuidado con lo que encontramos en la calle.',
          'Los zapatos cómodos son esenciales para el bienestar.'
        ],
        correctAnswer: 'La empatía y el arrepentimiento pueden transformar incluso a los más crueles.'
      }
    ]
  },
  {
    id: 5,
    title: 'El puente de cristal y los caminos cruzados de dos desconocidos',
    story: `Julieta, de mirada penetrante y una curiosidad inagotable, paseaba por las calles empedradas de un pequeño pueblo al sur de España. Su cabello castaño ondeaba con cada brisa, y sus pasos, siempre seguros, la llevaron a descubrir un camino que se desviaba hacia el bosque. En el mismo momento, al otro extremo del bosque, Marcos, con su barba cuidadosamente recortada y sus ojos llenos de historias por contar, decidió emprender un camino desconocido mientras su cámara colgaba de su cuello, listo para capturar la belleza oculta que aquel día le deparara.
  
Mientras Julieta avanzaba, la luz del sol se filtraba a través de los árboles, tiñendo de dorado su camino. No tardó en encontrar una estructura que nunca imaginó: un puente de cristal que cruzaba el río y parecía conducir hacia lo desconocido. Intrigada, dio el primer paso, sintiendo el frío recorrido del material bajo sus pies. «Podría ser el escenario perfecto para una de mis historias», pensó, mientras su corazón latía con la emoción de la aventura.
  
Por su parte, Marcos, inmerso en la magia del bosque, no podía creer la suerte que tenía al encontrar tal obra de arte arquitectónica en medio de la naturaleza. Mientras ajustaba el lente de su cámara, una figura comenzó a dibujarse al otro extremo del puente. «Este día no podría ser más perfecto», murmuró, esperando capturar no solo el puente, sino también el encuentro fortuito que estaba a punto de suceder.
  
Al encontrarse a la mitad del puente de cristal, Julieta y Marcos intercambiaron una mirada llena de preguntas. «¿También sientes que este lugar es mágico?», preguntó él, extendiendo su mano en señal de saludo. «Desde el primer momento que lo vi», respondió ella, estrechando la mano de Marcos con una sonrisa. Fue un apretón firme, como si de alguna manera, ambos comprendieran que este no sería un encuentro efímero.
  
A medida que conversaban, se dieron cuenta de que ambos compartían una pasión incontenible por descubrir y documentar los rincones más inexplorados del mundo. «Estoy escribiendo un libro sobre lugares ocultos y sus leyendas», compartió Julieta, sus ojos brillando con entusiasmo. «Y yo estoy en busca de la fotografía perfecta que cuente una historia sin palabras», confesó Marcos, con un brillo igual en sus ojos.
  
El tiempo parecía haberse detenido mientras compartían historias, sueños y risas. El sol comenzaba a descender, tiñendo el cielo de tonos anaranjados y violetas, creando el perfecto telón de fondo para su inesperado encuentro. «¿Qué te parece si continuamos esta aventura juntos?», propuso Marcos, su voz llena de esperanza. Julieta, sin dudarlo y con una sonrisa que iluminaba su rostro, aceptó la invitación con un entusiasmo compartido.
  
Los días siguientes los llevaron a descubrir no solo los secretos del bosque y los alrededores, sino también la conexión profunda que crecía entre ellos. Fotografías, palabras y silencios compartidos se convirtieron en el lenguaje único de su creciente vínculo. Las historias de Julieta cobraban vida en las imágenes de Marcos, creando un inesperado proyecto colaborativo que ninguno de los dos había anticipado.
  
Una tarde, frente a la puesta del sol, Marcos tomó una fotografía de Julieta en el puente, justo en el lugar donde se encontraron por primera vez. «Para recordar el inicio de nuestra aventura», dijo él, entregándole la imagen. Julieta, emocionada, supo que aquel momento sería solo el comienzo de muchas historias que contarían juntos.
  
Con el paso del tiempo, el libro de Julieta se llenó de palabras que daban sentido a las imágenes capturadas por Marcos. El proyecto, titulado «El puente de cristal y los caminos cruzados», se convirtió en un éxito inesperado, celebrando no solo los lugares y leyendas que habían descubierto juntos, sino también su historia de amor nacida de un encuentro fortuito.
  
En la presentación del libro, rodeados de amigos, familiares y lectores curiosos, Julieta y Marcos compartieron la historia de cómo un camino desconocido y un puente de cristal los había unido. Miradas cómplices y palabras de agradecimiento llenaron la sala, mientras ambos agradecían el destino por haber cruzado sus caminos de la manera más misteriosa y hermosa.
  
«Nuestra aventura juntos nos enseñó que los caminos inesperados son a menudo aquellos que llevan a los descubrimientos más maravillosos», dijo Julieta, con Marcos de la mano. Al finalizar el evento, ambos decidieron cruzar nuevamente el puente de cristal, esta vez como símbolo de los nuevos caminos que explorarían juntos, seguros de que, sin importar hacia dónde los llevara el camino, siempre estarían juntos.
  
La historia de Julieta y Marcos inspiró a muchos a seguir sus propios caminos desconocidos, recordándoles que, en ocasiones, los encuentros más inesperados son los que tienen el poder de cambiar nuestras vidas para siempre.`,
  
    questions: [
      {
        id: 1,
        question: '¿Dónde se encontraron Julieta y Marcos por primera vez?',
        options: [
          'En un pueblo al sur de España.',
          'En un puente de cristal.',
          'En un puente de cristal en medio del bosque.',
          'En una cafetería junto al río.',
          'En una feria de libros y fotografías.',
          'En la cima de una colina con vista al mar.'
        ],
        correctAnswer: 'En un puente de cristal en medio del bosque.'
      },
      {
        id: 2,
        question: '¿Qué compartían en común Julieta y Marcos?',
        options: [
          'Una pasión por la arquitectura moderna.',
          'Un amor por la comida y la gastronomía.',
          'Una pasión por explorar y documentar lugares ocultos.',
          'Un interés en coleccionar objetos antiguos.',
          'Un sueño de viajar en globo aerostático.',
          'Un gusto por escribir poesía romántica.'
        ],
        correctAnswer: 'Una pasión por explorar y documentar lugares ocultos.'
      },
      {
        id: 3,
        question: '¿Cómo se consolidó la conexión entre Julieta y Marcos?',
        options: [
          'A través de su mutuo interés por los deportes extremos.',
          'Por un proyecto colaborativo que unió fotografías y palabras.',
          'Por haber estudiado en el mismo colegio.',
          'Por un viaje que realizaron en barco.',
          'A través de largas caminatas por la playa.',
          'Por trabajar juntos en un museo de arte.'
        ],
        correctAnswer: 'Por un proyecto colaborativo que unió fotografías y palabras.'
      },
      {
        id: 4,
        question: '¿Qué título le dieron al proyecto colaborativo que crearon juntos?',
        options: [
          '"Caminos mágicos de España".',
          '"El arte de lo desconocido".',
          '"El puente de cristal y los caminos cruzados".',
          '"Historias desde el corazón del bosque".',
          '"Sombras y luces en los caminos".',
          '"Leyendas entre imágenes y palabras".'
        ],
        correctAnswer: '"El puente de cristal y los caminos cruzados".'
      },
      {
        id: 5,
        question: '¿Qué aprendieron Julieta y Marcos de su aventura juntos?',
        options: [
          'Que las aventuras son más emocionantes cuando se viaja solo.',
          'Que el destino siempre lleva a lugares seguros.',
          'Que los caminos inesperados conducen a los descubrimientos más maravillosos.',
          'Que la naturaleza siempre guarda secretos.',
          'Que las conexiones profundas solo surgen en viajes largos.',
          'Que todo puente tiene una historia que contar.'
        ],
        correctAnswer: 'Que los caminos inesperados conducen a los descubrimientos más maravillosos.'
      }
    ]
  }
];

const ActivityScreen8L3 = ({ activity, treatmentId }) => { // Recibe 'activity' y 'treatmentId' como props 
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
    const lastReadingId = localStorage.getItem('lastReadingId_Level3');
    let availableReadings = readings;

    if (readings.length > 1 && lastReadingId) {
      availableReadings = readings.filter(reading => reading.id !== parseInt(lastReadingId));
    }

    const randomIndex = Math.floor(Math.random() * availableReadings.length);
    const selected = availableReadings[randomIndex];

    setCurrentReading(selected);
    localStorage.setItem('lastReadingId_Level3', selected.id);
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

export default ActivityScreen8L3;
