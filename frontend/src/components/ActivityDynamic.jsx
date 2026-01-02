// src/components/Activity.jsx

import { Card } from 'react-bootstrap';

const Activity = ({ activity, backgroundImg, onPlay }) => {
  return (
    <Card className="activity-card my-3 p-3 rounded">
      {/* Imagen de fondo */}
      <div className="activity-card__bg">
        <img src={backgroundImg} alt="Activity Background" className="activity-background-image" />
      </div>
      
      {/* Imagen circular que muestra la actividad */}
      <div className="activity-card__avatar">
        <img src={activity.image} alt={activity.name} className="activity-avatar" />
      </div>
      
      <Card.Body className="text-center">
        {/* Título de la actividad */}
        <Card.Title as="h5" className="activity-title">
          <strong>{activity.name}</strong>
        </Card.Title>

        {/* Descripción de la actividad */}
        <Card.Text className="activity-description text-muted">
          {activity.description}
        </Card.Text>

        {/* Botón para jugar */}
        <div className="activity-card__wrapper">
          <button className="activity-card__btn activity-card__btn-solid" onClick={onPlay}>Jugar</button>
        </div>
      </Card.Body>
    </Card>
  );
};

export default Activity;
