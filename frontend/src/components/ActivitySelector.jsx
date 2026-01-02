import React from 'react';
import { Row, Col } from 'react-bootstrap';
import { useGetActivitiesQuery } from '../slices/activitiesSlice.js';
import Loader from './Loader';
import Activity from './Activity';
import Activity2 from './Activity2';
import Activity3 from './Activity3';
import '../assets/styles/ActivitiesScreen.css';

const ActivitySelector = ({ selectedActivities, setSelectedActivities }) => {
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
    <div className="activity-selector">
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
                          onChange={() => handleToggleActivity(activity._id)}
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

export default ActivitySelector;
