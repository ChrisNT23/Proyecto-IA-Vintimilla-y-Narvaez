import React, { useEffect, useState } from 'react';
import { Row, Col, Button } from 'react-bootstrap';
import { useParams } from 'react-router-dom';
import { useGetActivitiesQuery, useGetAssignedActivitiesQuery, useAssignActivityToPatientMutation, useDeleteAssignedActivityMutation } from '../../slices/treatmentSlice';
import { useSelector } from 'react-redux';
import Loader from '../../components/Loader';
import Activity from '../../components/Activity';
import Activity2 from '../../components/Activity2';
import Activity3 from '../../components/Activity3';
import '../../assets/styles/ActivitiesScreen.css';

const UserActivity = () => {
  const { patientId } = useParams();
  const { data: activities, isLoading } = useGetActivitiesQuery();
  const { data: assignedActivitiesData, refetch } = useGetAssignedActivitiesQuery(patientId);
  const [assignActivityToPatient] = useAssignActivityToPatientMutation();
  const [deleteAssignedActivity] = useDeleteAssignedActivityMutation();
  const [selectedActivities, setSelectedActivities] = useState([]);


  const userInfo = useSelector((state) => state.auth.userInfo);

  // Inicializar las actividades ya asignadas al paciente al cargar la página
  useEffect(() => {
    if (assignedActivitiesData) {
      const assignedActivities = assignedActivitiesData.map((assignment) => assignment.activity._id);
      setSelectedActivities(assignedActivities);
    }
  }, [assignedActivitiesData]);

  // Manejar la asignación o desasignación al marcar/desmarcar el checkbox
  const handleToggleActivity = async (activity) => {
    const isSelected = selectedActivities.includes(activity._id);
  
    if (isSelected) {
      // Desasignar la actividad
      const assignment = assignedActivitiesData.find(
        (assignment) => assignment.activity._id === activity._id
      );
  
      if (assignment && assignment.assignmentId) {
        try {
          await deleteAssignedActivity({ 
            assignmentId: assignment.assignmentId, 
            patientId 
          });
          setSelectedActivities((prev) => prev.filter((id) => id !== activity._id));
          alert('Actividad desasignada correctamente');
          refetch();
        } catch (error) {
          console.error('Error al desasignar la actividad:', error);
        }
      }
    } else {
      // Asignar la actividad
      try {
        const response = await assignActivityToPatient({
          patientId,
          doctorId: userInfo._id,
          activityId: activity._id,
        });
        if (response?.data?.assignment?._id) {
          setSelectedActivities((prev) => [...prev, activity._id]);
          alert('Actividad asignada correctamente');
          refetch();
        }
      } catch (error) {
        console.error('Error al asignar la actividad:', error);
      }
    }
  };
  
  // Filtrar actividades por nivel
  const filterActivitiesByLevel = (level) => activities?.filter((activity) => activity.difficultyLevel === level);

  return (
    <div className="user-activity-container">
      <h1 className="text-center mb-5">Asignación de Actividades</h1>
      {isLoading ? (
        <Loader />
      ) : (
        <>
          {[1, 2, 3].map((level) => (
            <div key={level} className="activity-container mb-5">
              <h2 className="activity-name mb-3">Nivel {level}</h2>
              <Row className="activity-levels">
                {filterActivitiesByLevel(level)?.map((activity) => {
                  const isChecked = selectedActivities.includes(activity._id);
                  return (
                    <Col key={activity._id} xs={12} md={6} lg={4} className="mb-4">
                      <div className={`activity-card ${isChecked ? 'selected' : ''}`}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleActivity(activity)}
                          className="activity-checkbox"
                        />
                        {level === 1 && <Activity activity={activity} />}
                        {level === 2 && <Activity2 activity={activity} />}
                        {level === 3 && <Activity3 activity={activity} />}
                      </div>
                    </Col>
                  );
                })}
              </Row>
            </div>
          ))}
        </>
      )}
    </div>
  );
};

export default UserActivity;