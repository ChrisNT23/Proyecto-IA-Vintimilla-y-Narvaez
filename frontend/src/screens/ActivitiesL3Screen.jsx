import { Row, Col } from 'react-bootstrap';
import Activity3 from '../components/Activity3.jsx'; // Componente de actividad
import Loader from '../components/Loader.jsx';
import { useGetActivitiesQuery } from '../slices/activitiesSlice.js'; // Para obtener actividades

const ActivitiesL3Screen = () => {
  const { data: activities, isLoading } = useGetActivitiesQuery(); // Consultar actividades

  return (
    <>
      {isLoading ? (
        <Loader />
      ) : (
        <>
          <h1>Actividades</h1>
          <Row className="justify-content-center">
            {activities.slice(20, 30).map((activity) => ( // Cambiamos el slice
              <Col key={activity._id} sm={12} md={6} lg={4} xl={3} className="mb-4 d-flex justify-content-center">
                <Activity3 activity={activity} /> {/* Renderiza cada actividad */}
              </Col>
            ))}
          </Row>
        </>
      )}
    </>
  );
};

export default ActivitiesL3Screen;
