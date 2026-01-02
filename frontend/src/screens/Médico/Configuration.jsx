import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../assets/styles/Configuration.css';
import Image1a from '../../images/tratamientos.png';
import Image2a from '../../images/actividades.png';
import Image3a from '../../images/infopaciente.png';

const Configuration = () => {
  const navigate = useNavigate();
  const [showTreatmentOptions, setShowTreatmentOptions] = useState(false);
  const [selectedOption, setSelectedOption] = useState('');

  // Función para manejar la selección de las opciones de tratamiento
  const handleTreatmentOptionChange = (event) => {
    setSelectedOption(event.target.value);

    // Redirige a la página correspondiente basado en la selección
    if (event.target.value === 'crear') {
      navigate('/admin/treatments');
    } else if (event.target.value === 'visualizar') {
      navigate('/admin/UsersActivities');
      /*/admin/treatments/list'*/
    }
  };

  const navigateToTab = (tab) => {
    if (tab === 'tratamientos') {
      setShowTreatmentOptions(true);
    } else if (tab === 'actividades') {
      navigate('/admin/actividades-asignadas');
    } else if (tab === 'informacion_paciente') {
      navigate('/admin/userlist');
    }
  };

  return (
    <div className="configuration-page">
      {/* Contenedor del título */}
      <div className="config-title-container">
        <h1 className="config-title text-center">Configuración</h1>
      </div>

      <div className="config-card-wrapper">
        {/* Primera fila: Dos cards */}
        <div className="config-row">
          {/* Card para Tratamientos */}
          <div className="config-card" onClick={() => navigateToTab('tratamientos')}>
            <span className="config-card-overlay"></span>
            <div className="config-card-content">
              <img src={Image1a} alt="Tratamientos" className="config-card-image" />
              <div>Tratamientos</div>
            </div>
          </div>
          {/* Mostrar opciones de radio buttons si se selecciona Tratamientos */}
          {showTreatmentOptions && (
            <fieldset className="treatment-options">
              <div className="button-group">
                <input
                  type="radio"
                  id="crear"
                  name="treatment"
                  value="crear"
                  onChange={handleTreatmentOptionChange}
                />
                <label htmlFor="crear">Crear Tratamiento</label>
              </div>

              <div className="button-group">
                <input
                  type="radio"
                  id="visualizar"
                  name="treatment"
                  value="visualizar"
                  onChange={handleTreatmentOptionChange}
                />
                <label htmlFor="visualizar">Visualizar y Editar Tratamiento</label>
              </div>
            </fieldset>

          )}


          {/* Card para Actividades */}
          <div className="config-card" onClick={() => navigateToTab('actividades')}>
            <span className="config-card-overlay"></span>
            <div className="config-card-content">
              <img src={Image2a} alt="Actividades" className="config-card-image" />
              <div>Actividades Asignadas</div>
            </div>
          </div>
        </div>

        {/* Segunda fila: Una card */}
        <div className="config-row-single">
          {/* Card para Información del Paciente */}
          <div className="config-card" onClick={() => navigateToTab('informacion_paciente')}>
            <span className="config-card-overlay"></span>
            <div className="config-card-content">
              <img src={Image3a} alt="Información del Paciente" className="config-card-image" />
              <div>Información del Paciente</div>
            </div>
          </div>
        </div>
      </div>
    </div>


  );
};

export default Configuration;
