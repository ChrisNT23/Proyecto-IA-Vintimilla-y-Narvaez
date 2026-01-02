// src/screens/ActivityPlay.jsx

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetActivityByIdQuery } from '../slices/activitiesSlice.js';
import ActivityDynamic from '../components/ActivityDynamic.jsx';
import Loader from '../components/Loader';
import Message from '../components/Message';
import { ACTIVITY_TYPES, ACTIVITY_LEVELS } from '../constants.js'; // Define tus constantes
import ActivityScreen1 from '../screens/ActivityScreen1';
import ActivityScreen2 from '../screens/ActivityScreen2';
import ActivityScreen3 from '../screens/ActivityScreen3';
import ActivityScreen4 from '../screens/ActivityScreen4.jsx';
import ActivityScreen5 from '../screens/ActivityScreen5.jsx';
import ActivityScreen6 from '../screens/ActivityScreen6.jsx';
import ActivityScreen7 from '../screens/ActivityScreen7.jsx';
import ActivityScreen8 from '../screens/ActivityScreen8.jsx';
import ActivityScreen9 from '../screens/ActivityScreen9.jsx';
import ActivityScreen10 from '../screens/ActivityScreen10.jsx';
import ActivityScreen1L2 from '../screens/Activity1L2Screen.jsx'
import ActivityScreen1L3 from '../screens/Activity1L3Screen.jsx';
import ActivityScreen2L2 from '../screens/Activity2L2Screen.jsx';
import ActivityScreen2L3 from '../screens/Activity2L3Screen.jsx';
import ActivityScreen3L2 from '../screens/Activity3L2Screen.jsx';
import ActivityScreen3L3 from '../screens/Activity3L3Screen.jsx';
import ActivityScreen4L2 from '../screens/Activity4L2Screen.jsx';
import ActivityScreen4L3 from '../screens/Activity4L3Screen.jsx';
import ActivityScreen5L2 from '../screens/Activity5L2Screen.jsx';
import ActivityScreen5L3 from '../screens/Activity5L3Screen.jsx';
import ActivityScreen6L2 from '../screens/Activity6L2Screen.jsx';
import ActivityScreen6L3 from '../screens/Activity6L3Screen.jsx';
import ActivityScreen7L2 from '../screens/Activity7L2Screen.jsx';
import ActivityScreen7L3 from '../screens/Activity7L3Screen.jsx';
import ActivityScreen8L2 from '../screens/Activity8L2Screen.jsx';
import ActivityScreen8L3 from '../screens/Activity8L3Screen.jsx';
import ActivityScreen9L2 from '../screens/Activity9L2Screen.jsx';
import ActivityScreen9L3 from '../screens/Activity9L3Screen.jsx';
import ActivityScreen10L2 from '../screens/Activity10L2Screen.jsx';
import ActivityScreen10L3 from '../screens/Activity10L3Screen.jsx';

const backgroundImages = {
  1: require('../images/background1.png'), // Nivel 1
  2: require('../images/background2.png'), // Nivel 2
  3: require('../images/background3.png'), // Nivel 3
};

const activityComponents = {
  [ACTIVITY_TYPES.BUSQUEDA_LETRAS]: {
    1: ActivityScreen1,
    2: ActivityScreen1L2,
    3: ActivityScreen1L3,
  },
  [ACTIVITY_TYPES.ASOCIACION_FOTOS]: {
    1: ActivityScreen2,
    2: ActivityScreen2L2,
    3: ActivityScreen2L3,
  },
  [ACTIVITY_TYPES.MATEMATICAS]: {
    1: ActivityScreen3,
    2: ActivityScreen3L2,
    3: ActivityScreen3L3,
  },
  [ACTIVITY_TYPES.DIFERENCIAS]: {
    1: ActivityScreen4,
    2: ActivityScreen4L2,
    3: ActivityScreen4L3,
  },
  [ACTIVITY_TYPES.FORMAR_REFRANES]: {
    1: ActivityScreen5,
    2: ActivityScreen5L2,
    3: ActivityScreen5L3,
  },
  [ACTIVITY_TYPES.CLASIFICACION_PALABRAS]: {
    1: ActivityScreen6,
    2: ActivityScreen6L2,
    3: ActivityScreen6L3,
  },
  [ACTIVITY_TYPES.MEMORIA_OBJETOS]: {
    1: ActivityScreen7,
    2: ActivityScreen7L2,
    3: ActivityScreen7L3,
  },
  [ACTIVITY_TYPES.LECTURA_PREGUNTAS]: {
    1: ActivityScreen8,
    2: ActivityScreen8L2,
    3: ActivityScreen8L3,
  },
  [ACTIVITY_TYPES.CUMPLIR_INSTRUCCIONES]: {
    1: ActivityScreen9,
    2: ActivityScreen9L2,
    3: ActivityScreen9L3,
  },
  [ACTIVITY_TYPES.IDENTIFICAR_OBJETOS]: {
    1: ActivityScreen10,
    2: ActivityScreen10L2,
    3: ActivityScreen10L3,
  },
  // ...otros tipos
};

const ActivityPlay = () => {
  const { activityId, treatmentId } = useParams(); // Extrae ambos parámetros
  const { data: activity, isLoading, error } = useGetActivityByIdQuery(activityId);
  const [backgroundImg, setBackgroundImg] = useState(null);
  const [ActivityComponent, setActivityComponent] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    console.log('treatmentId:', treatmentId);
    console.log('activityId:', activityId);

    if (activity) {
      console.log('Actividad obtenida en ActivityPlay:', activity);
      
      const { type, difficultyLevel } = activity;

      // Validar que el nivel es válido
      if (!ACTIVITY_LEVELS.includes(difficultyLevel)) {
        setActivityComponent(<Message variant="danger">Nivel de actividad inválido.</Message>);
        return;
      }

      // Obtener el componente basado en tipo y nivel
      const typeComponents = activityComponents[type];
      
      if (typeComponents) {
        const Component = typeComponents[difficultyLevel];
        
        if (Component) {
          setActivityComponent(<Component activity={activity} treatmentId={treatmentId} />);
          setBackgroundImg(backgroundImages[difficultyLevel]);
        } else {
          setActivityComponent(<Message variant="danger">Componente de actividad no encontrado para este nivel.</Message>);
        }
      } else {
        setActivityComponent(<Message variant="danger">Tipo de actividad desconocido.</Message>);
      }
    }
  }, [activity, treatmentId]);

  if (isLoading) return <Loader />;
  if (error) return <Message variant="danger">Error al cargar la actividad: {error?.data?.message || error.message}</Message>;

  return (
    <div>
      {ActivityComponent}
    </div>
  );
};

export default ActivityPlay;
