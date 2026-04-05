// src/screens/ActivityPlay.jsx

import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useGetActivityByIdQuery } from '../slices/activitiesSlice.js';
import Loader from '../components/Loader';
import Message from '../components/Message';

const ActivityPlay = () => {
  const { activityId, treatmentId } = useParams(); // Extrae ambos parámetros
  const { data: activity, isLoading, error } = useGetActivityByIdQuery(activityId);
  const [ActivityComponent, setActivityComponent] = useState(null);

  useEffect(() => {
    console.log('treatmentId:', treatmentId);
    console.log('activityId:', activityId);

    if (activity) {
      setActivityComponent(
        <Message variant="info">
          Esta actividad ha sido deshabilitada. El sistema se enfoca actualmente en la prueba MOCA.
        </Message>
      );
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
