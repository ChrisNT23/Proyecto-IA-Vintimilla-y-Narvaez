import { Row, Col } from 'react-bootstrap';
import Activity from '../components/Activity.jsx';   // Nivel 1
import Activity2 from '../components/Activity2.jsx'; // Nivel 2
import Activity3 from '../components/Activity3.jsx'; // Nivel 3
import Loader from '../components/Loader.jsx';
import { useGetActivitiesQuery } from '../slices/activitiesSlice.js';
import '../assets/styles/ActivitiesScreen.css';

const ActivitiesScreen = () => {
  const { data: activities = [], isLoading } = useGetActivitiesQuery();

  if (isLoading) {
    return <Loader />;
  }

  // 1. Agrupar las actividades por su "nombre base" (quitando " - nivel X")
  const groupedActivities = activities.reduce((acc, activity) => {
    // Por ejemplo, si activity.name === "Rompecabezas - nivel 1"
    // quitamos la parte de " - nivel X"
    const baseName = activity.name.replace(/\s*-\s*nivel\s*\d+/i, '').trim();

    // Creamos el array si no existe
    if (!acc[baseName]) {
      acc[baseName] = [];
    }
    acc[baseName].push(activity);

    return acc;
  }, {});

  // 2. Renderizar cada grupo de actividades
  return (
    <>
      <h1>Actividades</h1>
      {Object.entries(groupedActivities).map(([baseName, group]) => {
        // group es el array de actividades que comparten ese baseName
        // Buscamos cuál es nivel 1, 2 o 3 (según el nombre)
        const level1 = group.find((act) => /nivel\s*1/i.test(act.name));
        const level2 = group.find((act) => /nivel\s*2/i.test(act.name));
        const level3 = group.find((act) => /nivel\s*3/i.test(act.name));

        return (
          <div key={baseName} className="activity-container mb-5">
            {/* 2.1. Mostrar sólo el baseName limpio */}
            <h2 className="activity-name mb-3">{baseName}</h2>

            {/* 2.2. Mostrar las 3 columnas (1 por nivel) */}
            <Row className="activity-levels">
              <Col xs={12} md={4} className="mb-4 mb-md-0">
                {level1 && <Activity activity={level1} />}
              </Col>
              <Col xs={12} md={4} className="mb-4 mb-md-0">
                {level2 && <Activity2 activity={level2} />}
              </Col>
              <Col xs={12} md={4}>
                {level3 && <Activity3 activity={level3} />}
              </Col>
            </Row>
          </div>
        );
      })}
    </>
  );
};

export default ActivitiesScreen;
