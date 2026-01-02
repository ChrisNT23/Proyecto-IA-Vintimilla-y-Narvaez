// src/screens/FluidezVerbalActivityLevel3.jsx

import React, { useState, useEffect, useRef } from "react";
import { Button, Form, Spinner } from "react-bootstrap";
import { FaPlay, FaStop } from "react-icons/fa";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useRecordActivityMutation } from '../slices/treatmentSlice'; // Asegúrate de que la ruta sea correcta
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

// Importa el CSS Module del Nivel 1
import styles from '../assets/styles/FluidezVerbalActivityM.module.css';

const FluidezVerbalActivityLevel3 = ({
  onComplete = () => {}, 
  isSpeaking,
  speakInstructions,
  onPrevious,
  isFirstModule,
  activity,
  treatmentId
}) => {
  // Estado para el temporizador
  const [timer, setTimer] = useState(60);
  
  // Estado para controlar si la actividad está corriendo
  const [isRunning, setIsRunning] = useState(false);
  
  // Lista de palabras ingresadas
  const [wordList, setWordList] = useState([]);
  
  // Estado para el input de palabras
  const [inputWord, setInputWord] = useState("");
  
  // Estado para controlar el uso de voz
  const [useVoice, setUseVoice] = useState(true);
  
  // Estado para controlar si está escuchando
  const [listening, setListening] = useState(false);
  
  // Estado para la combinación de tres letras
  const [currentPrefix, setCurrentPrefix] = useState("ACE"); // Inicialización con una combinación válida
  
  // Referencia para el reconocimiento de voz
  const recognitionRef = useRef(null);
  
  // Referencia para evitar doble guardado
  const scoreCalculatedRef = useRef(false);
  
  // Información del usuario desde Redux
  const userInfo = useSelector((state) => state.auth.userInfo);
  
  // Hook para registrar la actividad
  const [recordActivity, { isLoading: isRecording, error: recordError }] = useRecordActivityMutation();
  
  // Hook de navegación
  const navigate = useNavigate();

  // Arreglo de combinaciones de tres letras válidas en español
  const threeLetterCombinations = [
    "ACE", "ACT", "ADE", "AGI", "ALE", "ALI", "AMA", "AME", "AMI", "ANA",
    "ANE", "ANI", "ANO", "ARA", "ARE", "ARI", "ARO", "ASA", "ASE", "ASI",
    "ATO", "AVA", "AVE", "AVI", "AZU", "CAL", "CAN", "CAR", "CAS", "CAT",
    "CEL", "CER", "CIM", "CIN", "CIR", "CIT", "COC", "COL", "COM", "CON",
    "COR", "COS", "COT", "CRE", "CRI", "CUL", "CUN", "CUR", "DAL", "DAM",
    "DAN", "DAR", "DAS", "DEL", "DEN", "DES", "DIU", "DOM", "DOR", "DOS",
    "DUL", "ECO", "ELI", "ELA", "EMA", "EMI", "ENO", "ERA", "ERE", "ERI",
    "ERO", "ESA", "ESC", "ESI", "EST", "ETI", "EVA", "EVE", "EVI",
    "FAC", "FAL", "FAN", "FAR", "FAS", "FAT", "FIL", "FIN", "FIR", "FIT",
    "FLA", "FON", "FOR", "FOT", "FRA", "FRE", "FRI", "FRO", "FUA", "GAC",
    "GAL", "GAM", "GAR", "GAS", "GAT", "GEL", "GEN", "GER", "GIM", "GIR",
    "GIT", "GLA", "GOL", "GOR", "GRA", "GRE", "GRI", "GRO", "GUA", "GUE",
    "GUI", "GUL", "GUR", "HAC", "HAL", "HAM", "HAR", "HAS", "HAT", "HEL",
    "HEM", "HER", "HET", "HIL", "HIN", "HIS", "HIT", "HOL", "HOR", "HOS",
    "HUM", "HUR", "HUS", "JAC", "JAL", "JAM", "JAR", "JAS", "JAT", "JER",
    "JES", "JET", "JIL", "JIM", "JIN", "JIR", "JIT", "JOL", "JOR", "JOS",
    "JUT", "KAC", "KAN", "KAR", "KAS", "KAT", "KEN", "KER", "KIL", "KIN",
    "KIR", "KIT", "KOL", "KON", "KOR", "KOT", "KUL", "KUR", "LAB", "LAC",
    "LAM", "LAN", "LAR", "LAS", "LAT", "LEC", "LEI", "LEN", "LER", "LES",
    "LET", "LIA", "LIM", "LIN", "LIR", "LIT", "LOM", "LON", "LOR", "LOS",
    "LOT", "LUC", "LUL", "LUM", "LUN", "LUR", "LUS", "MAC", "MAL", "MAN",
    "MAR", "MAS", "MAT", "MEC", "MEI", "MEN", "MER", "MES", "MET", "MIC",
    "MIL", "MIN", "MIR", "MIT", "MOC", "MOL", "MON", "MOR", "MOS", "MOT",
    "MUC", "MUL", "MUN", "MUR", "MUS", "NAC", "NAL", "NAM", "NAN", "NAR",
    "NAS", "NAT", "NEL", "NEM", "NER", "NES", "NET", "NIA", "NIM", "NIN",
    "NIR", "NIT", "NOC", "NOL", "NOR", "NOS", "NOT", "NUC", "NUL", "NUM",
    "NUN", "NUR", "NUS", "OCE", "OCI", "OCO", "ODA", "ODE", "ODI", "ODO",
    "OLA", "OLE", "OLI", "OLM", "OLN", "OLP", "OLR", "OLS", "OLU", "OMA",
    "OME", "OMI", "ONO", "ORA", "ORE", "ORI", "ORO", "ORS", "ORT", "OSA",
    "OSE", "OSI", "OSM", "OSN", "OSR", "OST", "OTA", "OTE", "OTI", "OTO",
    "OTU", "OVA", "OVE", "OVI", "PAC", "PAL", "PAM", "PAN", "PAR", "PAS",
    "PAT", "PEC", "PEL", "PEN", "PER", "PES", "PET", "PIC", "PIL", "PIN",
    "PIR", "PIT", "PLO", "POL", "PON", "POR", "POS", "POT", "PUC", "PUL",
    "PUN", "PUR", "PUS", "QUA", "QUE", "QUI", "QUO", "RAL", "RAM", "RAN",
    "RAR", "RAS", "RAT", "REC", "REL", "REM", "REN", "REP", "RET", "RIC",
    "RIM", "RIN", "RIR", "RIT", "ROC", "ROL", "RON", "ROR", "ROS", "ROT",
    "RUC", "RUL", "RUM", "RUN", "RUR", "RUS", "SAL", "SAM", "SAN", "SAR",
    "SAS", "SAT", "SEC", "SEL", "SEM", "SEN", "SER", "SES", "SET", "SIC",
    "SIL", "SIM", "SIN", "SIR", "SIS", "SIT", "SOC", "SOL", "SON", "SOR",
    "SOS", "SOT", "SUC", "SUL", "SUM", "SUN", "SUR", "SUS", "TAC", "TAL",
    "TAM", "TAN", "TAR", "TAS", "TAT", "TEC", "TEL", "TEM", "TEN", "TER",
    "TES", "TET", "TIC", "TIL", "TIM", "TIN", "TIR", "TIS", "TIT", "TOC",
    "TOL", "TON", "TOR", "TOS", "TOT", "TUC", "TUL", "TUM", "TUN", "TUR",
    "TUS", "ULM", "UMA", "UME", "UMI", "UMO", "UNA", "UNE", "UNI", "UNO",
    "URA", "URE", "URI", "URO", "URS", "UTA", "UTE", "UTI", "UTO", "UVA",
    "UVE", "UVI", "VAC", "VAL", "VAN", "VAR", "VAS", "VAT", "VEL", "VEN",
    "VER", "VES", "VET", "VIC", "VIL", "VIN", "VIR", "VIT", "VOL", "VON",
    "VOR", "VOS", "VOT", "VUC", "VUL", "VUM", "VUN", "VUR", "VUS",
  ];

  // Función para seleccionar una combinación de tres letras aleatoria
  const getRandomPrefix = () => {
    const randomIndex = Math.floor(Math.random() * threeLetterCombinations.length);
    return threeLetterCombinations[randomIndex];
  };

  // Efecto para manejar el temporizador
  useEffect(() => {
    let interval = null;
    if (isRunning && timer > 0) {
      interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 1000);
    } else if (timer === 0) {
      setIsRunning(false);
      clearInterval(interval);
      if (listening) handleStopListening();
      if (!scoreCalculatedRef.current) { // Verificación de la bandera
        calculateScore();
        scoreCalculatedRef.current = true; // Actualización de la bandera
      }
    }
    return () => clearInterval(interval);
  }, [isRunning, timer, listening]);

  // Efecto para configurar el reconocimiento de voz
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setUseVoice(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "es-ES";
    recognition.interimResults = false;
    recognition.continuous = true;

    recognition.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          const result = event.results[i][0].transcript.toLowerCase().trim();
          const words = result
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9\sÑñ]/g, "") // Incluir la letra 'Ñ'
            .split(/\s+/)
            .filter((w) => w && w.startsWith(currentPrefix.toLowerCase()) && w.length > 2); // Uso de currentPrefix y longitud > 2
          setWordList((prevList) => {
            const combined = [...prevList, ...words];
            // Eliminar duplicados
            return combined.filter((word, index, self) => self.indexOf(word) === index);
          });
        }
      }
    };

    recognition.onerror = () => {
      setListening(false);
      toast.error("Error al reconocer la voz. Intente de nuevo.");
    };

    recognition.onend = () => {
      if (listening) recognition.start();
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [currentPrefix]); // Dependencia agregada para reiniciar reconocimiento al cambiar prefijo

  // Función para iniciar la actividad
  const handleStart = () => {
    setIsRunning(true);
    scoreCalculatedRef.current = false; // Reiniciar la bandera al iniciar
    const prefix = getRandomPrefix();
    setCurrentPrefix(prefix); // Establecer la combinación aleatoria
    setWordList([]); // Reiniciar la lista de palabras
    setTimer(60); // Reiniciar el temporizador
  };

  // Manejo del cambio en el input de palabras
  const handleInputChange = (e) => {
    setInputWord(e.target.value);
  };

  // Función para agregar una palabra manualmente
  const handleAddWord = () => {
    if (inputWord.trim()) {
      const word = inputWord
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\sÑñ]/g, "") // Incluir la letra 'Ñ'
        .trim();
      if (word.startsWith(currentPrefix.toLowerCase()) && word.length > 2) { // Uso de currentPrefix y longitud > 2
        setWordList((prevList) =>
          [...prevList, word].filter(
            (w, idx, arr) => arr.indexOf(w) === idx
          )
        );
      } else {
        // Mostrar una advertencia si la palabra no cumple con el prefijo
        toast.warn(`La palabra "${word}" no comienza con "${currentPrefix}".`);
      }
      setInputWord("");
    }
  };

  // Manejo de la tecla Enter para agregar palabras
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddWord();
    }
  };

  // Función para iniciar el reconocimiento de voz
  const handleListen = () => {
    if (!recognitionRef.current) {
      toast.error("Reconocimiento de voz no disponible.");
      return;
    }
    if (!isRunning) {
      toast.error("Primero inicie el tiempo antes de hablar.");
      return;
    }
    setListening(true);
    recognitionRef.current.start();
  };

  // Función para detener el reconocimiento de voz
  const handleStopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setListening(false);
  };

  // Función para calcular y guardar el puntaje
  const calculateScore = async () => {
    // Filtrar palabras válidas que comienzan con la combinación de tres letras
    const validWords = wordList.filter((w) => 
      w.startsWith(currentPrefix.toLowerCase()) && 
      w.length > 2
    );
    const correctAnswers = validWords.length;
    const incorrectAnswers = 0; // Puedes ajustar esto si tienes lógica para respuestas incorrectas
    const timeUsed = 60 - timer;
    const patientId = userInfo ? userInfo._id : null;
    const activityId = activity ? activity._id : null;

    // Construir el objeto con la cantidad real de palabras en scoreObtained
    const activityData = {
      activityId: activityId,
      correctAnswers: correctAnswers,
      incorrectAnswers: incorrectAnswers,
      timeUsed: timeUsed,
      scoreObtained: parseFloat(correctAnswers.toFixed(2)), 
      progress: 'mejorando',
      observations: 'El paciente completó la actividad de clasificación de palabras en nivel avanzado.',
      patientId: patientId,
      difficultyLevel: 3,
      image: '',
    };

    if (treatmentId && activityId && patientId) {
      try {
        await recordActivity({ treatmentId, activityData }).unwrap();
        toast.success("Actividad guardada correctamente");
      } catch (error) {
        console.error("Error al guardar la actividad:", error);
        const errorMessage = error?.data?.message || error.message || "Error desconocido";
        toast.error(`Hubo un problema al guardar la actividad: ${errorMessage}`);
      }
    } else {
      console.warn("No se pudo guardar la actividad: faltan datos (treatmentId, activityId o patientId).");
    }

    // Llamar a onComplete con la cantidad de palabras correctas
    onComplete(correctAnswers);
  };

  return (
    <div className={styles.background}>
      <div className={styles.container}>
        {/* Encabezado de la Actividad */}
        <div className={styles.activityHeader}>
          <h4 className={styles.title}>
            Fluidez verbal - Combinación "{currentPrefix}"
          </h4>
          <Button
            variant="link"
            onClick={() =>
              speakInstructions(
                `Me gustaría que me diga el mayor número posible de palabras que comiencen por la combinación "${currentPrefix}". Puede hablar o escribirlas. ¿Está listo? Presione el botón para iniciar.`
              )
            }
            className={styles.voiceButton}
          >
            {isSpeaking ? <FaStop /> : <FaPlay />}
          </Button>
        </div>

        {/* Instrucciones */}
        <p className={styles.instructions}>
          Me gustaría que me diga el mayor número posible de palabras que comiencen por la combinación "{currentPrefix}". Puede hablar o escribirlas. Presione el botón para iniciar.
        </p>

        {/* Botón de Inicio o Contenido de la Actividad */}
        {!isRunning ? (
          <div className="text-center">
            <Button variant="primary" onClick={handleStart}>
              Iniciar
            </Button>
          </div>
        ) : (
          <>
            {/* Temporizador */}
            <div className={styles.infoBox}>
              <span>Tiempo: </span>
              <span className={styles.timer}>{timer} segundos</span>
            </div>

            {/* Controles de la Actividad */}
            <div className={styles.controlsContainer}>
              {useVoice && !listening ? (
                <Button variant="primary" onClick={handleListen}>
                  Hablar
                </Button>
              ) : listening ? (
                <div className={styles.listeningContainer}>
                  <Spinner animation="grow" variant="primary" />
                  <Button variant="danger" onClick={handleStopListening}>
                    Detener
                  </Button>
                </div>
              ) : null}

              {/* Formulario de Ingreso de Palabras */}
              <Form onSubmit={(e) => e.preventDefault()} className={styles.formContainer}>
                <Form.Control
                  type="text"
                  placeholder={`Escriba una palabra que comience con "${currentPrefix}"`}
                  value={inputWord}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  className={styles.wordInput}
                />
                <Button
                  variant="success"
                  onClick={handleAddWord}
                  className="ms-2"
                >
                  Agregar
                </Button>
              </Form>
            </div>

            {/* Listado de Palabras Registradas */}
            <div className={styles.wordListSection}>
              <h5>Palabras registradas:</h5>
              <ul className={styles.wordList}>
                {wordList.map((word, index) => (
                  <li key={index}>{word}</li>
                ))}
              </ul>
            </div>
          </>
        )}

        {/* Botones Finales */}
        <div className={styles.footerButtons}>
          <Button variant="secondary" onClick={onPrevious} disabled={isFirstModule}>
            Regresar
          </Button>
          {isRunning && timer === 0 && (
            <Button
              variant="primary"
              onClick={calculateScore}
              className={styles.submitButton}
              disabled={timer > 0}
            >
              Enviar Respuestas
            </Button>
          )}
        </div>

        {/* Mensajes de Estado */}
        {isRecording && <p className={styles.recording}>Guardando actividad...</p>}
        {recordError && <p className={styles.error}>Error: {recordError?.data?.message || recordError.message}</p>}

        {/* Contenedor de Toasts */}
        <ToastContainer />
      </div>
    </div>
  );
};

export default FluidezVerbalActivityLevel3;
