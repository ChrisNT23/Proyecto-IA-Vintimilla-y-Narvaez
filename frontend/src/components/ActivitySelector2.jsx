import React from 'react';
import { Row, Col } from 'react-bootstrap';
import { useGetActivitiesQuery } from '../slices/activitiesSlice.js';
import Loader from './Loader';
import '../assets/styles/ActivityScreenTreatment.css';

const ActivitySelector2 = ({ selectedActivities, setSelectedActivities }) => {
  const { data: activities, isLoading } = useGetActivitiesQuery();

  // Manejar la selección/deselección de actividades
  const handleToggleActivity = (activityId) => {
    if (selectedActivities.includes(activityId)) {
      setSelectedActivities(selectedActivities.filter((id) => id !== activityId));
    } else {
      setSelectedActivities([...selectedActivities, activityId]);
    }
  };

  // Filtrar actividades por nivel
  const filterActivitiesByLevel = (level) =>
    activities?.filter((activity) => activity.difficultyLevel === level);

  return (
    <div className="activity-selector2">
      {isLoading ? (
        <Loader />
      ) : (
        <>
          {[1, 2, 3].map((level) => (
            <div key={level} className="activity-container2 mb-5">
              <h2 className="activity-level-title">Nivel {level}</h2>
              <Row>
                {filterActivitiesByLevel(level)?.map((activity) => {
                  const isChecked = selectedActivities.includes(activity._id);
                  return (
                    <Col key={activity._id} xs={12} md={6} lg={4} className="mb-4">
                      <div className={`activity-card2 ${isChecked ? 'selected' : ''}`}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleActivity(activity._id)}
                          className="activity-checkbox2"
                        />
                        <div className="activity-info">
                          <h3 className="activity-name2">{activity.name}</h3>
                          <p className="activity-description2">{activity.description}</p>
                        </div>
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

export default ActivitySelector2;