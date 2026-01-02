import React from 'react';
import { useSelector } from 'react-redux';
import { useGetDoctorWithPatientsQuery } from '../../slices/doctorApiSlice';
import { Link } from 'react-router-dom';
import '../../assets/styles/UsersActivities.css';
import Loader from '../../components/Loader.jsx';

const HomeScreenMedico = () => {
  const userInfo = useSelector((state) => state.auth.userInfo);
  
  // Obtener los pacientes del doctor usando RTK Query
  const { data: patients, isLoading, error } = useGetDoctorWithPatientsQuery();

  // Función para obtener iniciales
  const getInitials = (name = '', lastName = '') => {
    const firstInitial = name.charAt(0).toUpperCase() || '';
    const secondInitial = lastName.charAt(0).toUpperCase() || '';
    return firstInitial + secondInitial;
  };

  return (
    <div className="home-container">
      <h2 className="home-title">Pacientes Asignados</h2>

      {isLoading ? (
        <Loader />
      ) : error ? (
        <p className="error-message">
          Error al cargar los pacientes: {error?.data?.message || "Ocurrió un problema inesperado"}
        </p>
      ) : patients && patients.length > 0 ? (
        <div className="patients-grid">
          {patients.map((patient) => {
            const hasPhoto = Boolean(patient.user?.profilePicture);
            const name = patient.user?.name || 'No disponible';
            const lastName = patient.user?.lastName || '';
            const initials = getInitials(name, lastName);

            return (
              <div
                key={patient._id}
                className={`patient-card ${!patient.user?.isActive ? 'inactive' : ''}`}
              >
                {/* Fondo de gradiente */}
                <div className="gradient-background"></div>

                {/* Indicador de Estado */}
                <span className="patient-status"></span>

                {/* Contenedor de la imagen o las iniciales */}
                <div className="patient-photo-container">
                  {hasPhoto ? (
                    <img
                      src={patient.user.profilePicture}
                      alt={`${name} ${lastName}`}
                      className="patient-photo"
                      loading="lazy"
                    />
                  ) : (
                    <div className="patient-initials">
                      {initials || 'NA'} 
                      {/* 'NA' para evitar que se quede vacío 
                          si faltan tanto nombre como apellido */}
                    </div>
                  )}
                </div>

                {/* Información del Paciente */}
                <div className="patient-info">
                  <span className="patient-name">
                    {name} {lastName}
                  </span>
                  <p className="patient-role">
                    {patient.user?.role || "Paciente"}
                  </p>
                </div>

                {/* Botón para Ver Más */}
                <Link
                  to={`/admin/${patient._id}/UserActivity`}
                  className="report-button"
                >
                  Ver más
                </Link>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="no-patients-message">No tienes pacientes asignados.</p>
      )}
    </div>
  );
};

export default HomeScreenMedico;
