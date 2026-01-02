import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useGetDoctorWithPatientsQuery } from '../../slices/doctorApiSlice';
import { Link } from 'react-router-dom';
import '../../assets/styles/HomeMedicoScreen.css';
import Loader from '../../components/Loader.jsx';

const HomeScreenMedico = () => {
  const [localPatients, setLocalPatients] = useState([]); // Estado local para manejar los pacientes
  const [isFetchingData, setIsFetchingData] = useState(true); // Controla el estado de carga de los datos
  const { data: patients, isLoading, error, refetch } = useGetDoctorWithPatientsQuery();
  const userInfo = useSelector((state) => state.auth.userInfo);

  // Efecto para limpiar el estado y activar la carga cuando el usuario cambia
  useEffect(() => {
    setLocalPatients([]); // Limpiar los datos actuales
    setIsFetchingData(true); // Mostrar el Loader mientras se obtienen nuevos datos
    if (userInfo) {
      refetch(); // Refetch para obtener los datos del nuevo usuario
    }
  }, [userInfo, refetch]);

  // Actualizar el estado local y desactivar el Loader solo cuando los nuevos datos están listos
  useEffect(() => {
    if (!isLoading && patients) {
      setLocalPatients(patients); // Actualizar con los datos correctos
      console.log(patients);
      setIsFetchingData(false); // Ocultar el Loader una vez los datos estén listos
    }
  }, [isLoading, patients]);

  return (
    <div className="home-medico-container">
       <div className="medico-section">
      <h1>Bienvenido, Dr. {userInfo?.name || 'Médico'}</h1>
      </div>
      <div className="shortcut-cards">
        <Link to="/admin/userlist" className="shortcut-card">
          <div className="card-icon">
            {/* Puedes reemplazar esto con un ícono de tu elección */}
            🗂️
          </div>
          <div className="card-title">Asignar Pacientes</div>
        </Link>
        
        <Link to="/admin/UsersActivities" className="shortcut-card">
          <div className="card-icon">
            💊
          </div>
          <div className="card-title">Visualizar Tratamientos</div>
        </Link>
        
        <Link to="/reports" className="shortcut-card">
          <div className="card-icon">
            📄
          </div>
          <div className="card-title">Buscar Reportes</div>
        </Link>
      </div>
      
      <div className="patients-section">
        <h2>Pacientes Asignados</h2>
        {isFetchingData ? (
          <Loader /> // Mostrar Loader hasta que los datos correctos estén listos
        ) : error ? (
          <p className="error-message">Error al cargar los pacientes: {error?.data?.message || "Ocurrió un problema inesperado"}</p>
        ) : localPatients && localPatients.length > 0 ? (
          <div className="table-responsive">
            <table className="assigned-patients-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Apellido</th>
                  <th>Email</th>
                  <th>Teléfono</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {localPatients.map((patient) => (
                  <tr key={patient._id}>
                    <td>{patient.user?.name || "No disponible"}</td>
                    <td>{patient.user?.lastName || "No disponible"}</td>
                    <td>{patient.user?.email || "No disponible"}</td>
                    <td>{patient.user?.phoneNumber || "No disponible"}</td>
                    <td>{patient.user?.isActive ? "Activo" : "Inactivo"}</td>
                    <td>
                      <Link to={`/patients/${patient._id}/historial-medico`} className="report-link">
                        Historial Médico
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No tienes pacientes asignados.</p>
        )}
      </div>
    </div>
  );
};

export default HomeScreenMedico;
