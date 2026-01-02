// src/screens/Reports/PatientReportScreen.jsx

import React, { useState, useRef } from "react";
import { useGetDoctorWithPatientsQuery } from "../../slices/doctorApiSlice";
import { useGetPatientByIdQuery } from "../../slices/patientApiSlice";
import "../../assets/styles/PatientReport.css";
import Loader from "../../components/Loader";
import { 
  FaUser, 
  FaClinicMedical, 
  FaPhone, 
  FaEnvelope, 
  FaHome, 
  FaBirthdayCake, 
  FaVenusMars, 
  FaSchool, 
  FaSuitcase,
  FaIdCard,
  FaUserFriends,
  FaHandshake,
  FaBriefcase,
  FaBrain,
  FaUserCheck,
  FaDownload, // Icono de Descargar
  FaPrint, // Icono de Imprimir
  FaAllergies,
  FaDiagnoses,
  FaAmbulance
   
} from 'react-icons/fa';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const PatientReportScreen = () => {
  const {
    data: patients,
    isLoading: isLoadingPatients,
    error: errorPatients,
  } = useGetDoctorWithPatientsQuery();

  const [selectedPatientId, setSelectedPatientId] = useState(null);

  const {
    data: patient,
    isLoading: isLoadingPatient,
    error: errorPatient,
  } = useGetPatientByIdQuery(selectedPatientId, {
    skip: !selectedPatientId,
  });

  const handlePatientChange = (e) => {
    const patientId = e.target.value;
    setSelectedPatientId(patientId || null);
  };

  // Referencia para el contenido a imprimir/descargar
  const reportRef = useRef();

  // Estados para feedback al usuario
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [downloadError, setDownloadError] = useState(false);

  // Función para imprimir el reporte
  const handlePrint = () => {
    window.print();
  };

  // Función para descargar el reporte como PDF
  const handleDownload = () => {
    const input = reportRef.current;
    html2canvas(input, { scale: 2 })
      .then((canvas) => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgProps= pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save("reporte_paciente.pdf");
        setDownloadSuccess(true);
        setTimeout(() => setDownloadSuccess(false), 3000); // Ocultar mensaje después de 3 segundos
      })
      .catch((err) => {
        console.error("Error al generar el PDF:", err);
        setDownloadError(true);
        setTimeout(() => setDownloadError(false), 3000);
      });
  };

  return (
    <div className="patient-report-screen">
      <header className="report-header">
        <h1>Reporte de Pacientes Asignados</h1>
      </header>

      <div className="content">
        {/* Selección de Paciente */}
        <section className="selection-section card">
          <h2><FaUser /> Seleccionar Paciente</h2>
          {isLoadingPatients ? (
            <Loader />
          ) : errorPatients ? (
            <p className="error-message">Error al cargar pacientes: {errorPatients.message}</p>
          ) : (
            <select
              className="patient-select"
              value={selectedPatientId || ""}
              onChange={handlePatientChange}
            >
              <option value="">-- Seleccionar Paciente --</option>
              {patients?.map((patient) => (
                <option key={patient._id} value={patient._id}>
                  {patient.user.name} {patient.user.lastName}
                </option>
              ))}
            </select>
          )}
        </section>

        {/* Botones de Acción */}
        {selectedPatientId && (
          <div className="action-buttons">
            <button className="btn btn-download" onClick={handleDownload}>
              <FaDownload className="btn-icon" /> Descargar Reporte
            </button>
            <button className="btn btn-print" onClick={handlePrint}>
              <FaPrint className="btn-icon" /> Imprimir Reporte
            </button>
          </div>
        )}

        {/* Feedback al Usuario */}
        {downloadSuccess && <p className="success-message">Reporte descargado exitosamente.</p>}
        {downloadError && <p className="error-message">Error al descargar el reporte.</p>}

        {/* Reporte Detallado del Paciente */}
        {selectedPatientId && (
          <section className="report-section card" ref={reportRef}>
            <h2><FaClinicMedical /> Detalles del Paciente</h2>
            {isLoadingPatient ? (
              <Loader />
            ) : errorPatient ? (
              <p className="error-message">Error al cargar el paciente: {errorPatient.message}</p>
            ) : patient ? (
              <div className="patient-details">
                {/* Información del Usuario */}
                <div className="details-card">
                  <h3>Información del Usuario</h3>
                  <p><FaUser /> <strong>Nombre:</strong> {patient.user.name} {patient.user.lastName}</p>
                  <p><FaIdCard /> <strong>CI:</strong> {patient.user.cardId}</p>
                  <p><FaEnvelope /> <strong>Email:</strong> {patient.user.email}</p>
                  <p><FaPhone /> <strong>Teléfono:</strong> {patient.user.phoneNumber}</p>
                </div>

                {/* Información del Paciente */}
                <div className="details-card">
                  <h3>Información del Paciente</h3>
                  <p><FaUserFriends /> <strong>Representante Familiar:</strong> {patient.school}</p>
                  <p><FaBirthdayCake /> <strong>Fecha de Nacimiento:</strong> {new Date(patient.birthdate).toLocaleDateString()}</p>
                  <p><FaVenusMars /> <strong>Género:</strong> {patient.gender}</p>
                  <p><FaSuitcase /> <strong>Nivel Educativo:</strong> {patient.educationalLevel}</p>
                  <p><FaAmbulance /> <strong>Tratamientos Previos:</strong> {patient.address}</p>
                  <p><FaHome /> <strong>Dirección:</strong> {patient.address}</p>
                  <p><FaHandshake /> <strong>Estado Civil:</strong> {patient.maritalStatus}</p>
                  <p><FaDiagnoses /> <strong>Diagnósticos previos:</strong> {patient.profession}</p>
                  <p><FaBrain /> <strong>Etapa Cognitiva:</strong> {patient.cognitiveStage}</p>
                  <p><FaAllergies /> <strong>Alergias:</strong> {patient.referredTo}</p>
                </div>
              </div>
            ) : (
              <p>Paciente no encontrado.</p>
            )}
          </section>
        )}
      </div>
    </div>
  );
};

export default PatientReportScreen;
