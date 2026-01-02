// src/screens/Reports/MoodScreen.jsx

import React, { useState, useEffect, useRef } from 'react';
import { useGetDoctorWithPatientsQuery } from '../../slices/doctorApiSlice';
import '../../assets/styles/Mood.css';
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { FaDownload, FaPrint, FaUser } from 'react-icons/fa';
import Loader from "../../components/Loader";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AA336A', '#33AA99'];

const MoodScreen = () => {
  const { data: patients, isLoading, error } = useGetDoctorWithPatientsQuery();
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [moodData, setMoodData] = useState([]);
  const [chartData, setChartData] = useState([]);

  const reportRef = useRef();

  // Estados para feedback al usuario
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [downloadError, setDownloadError] = useState(false);

  const handlePatientClick = async (patient) => {
    setSelectedPatient(patient);
    try {
      const res = await fetch(`/api/users/${patient._id}/moods`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!res.ok) {
        setMoodData([]);
        setChartData([]);
        return;
      }
      const data = await res.json();
      
      // Ordenar los datos de la fecha más reciente a la más antigua
      data.sort((a, b) => new Date(b.date) - new Date(a.date));
      setMoodData(data);
    } catch (err) {
      setMoodData([]);
      setChartData([]);
    }
  };

  useEffect(() => {
    if (moodData.length > 0) {
      const moodCount = moodData.reduce((acc, curr) => {
        acc[curr.mood] = (acc[curr.mood] || 0) + 1;
        return acc;
      }, {});

      const formattedData = Object.keys(moodCount).map((mood) => ({
        name: mood,
        value: moodCount[mood],
      }));

      setChartData(formattedData);
    } else {
      setChartData([]);
    }
  }, [moodData]);

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
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save("reporte_estado_emocional.pdf");
        setDownloadSuccess(true);
        setTimeout(() => setDownloadSuccess(false), 3000);
      })
      .catch((err) => {
        console.error("Error al generar el PDF:", err);
        setDownloadError(true);
        setTimeout(() => setDownloadError(false), 3000);
      });
  };

  return (
    <div className="mood-screen">
      <header className="report-header">
        <h1>Estado Emocional</h1>
      </header>
      <div className="content">
        {/* Selección de Paciente */}
        <section className="selection-section card">
          <h3><FaUser /> Lista de Pacientes</h3>
          {isLoading ? (
            <Loader />
          ) : error ? (
            <p className="error-message">Error al cargar pacientes</p>
          ) : (
            <ul className="patients-list">
              {patients.map((patient) => (
                <li
                  key={patient._id}
                  onClick={() => handlePatientClick(patient)}
                  className={`patient-item ${
                    selectedPatient && selectedPatient._id === patient._id ? 'active' : ''
                  }`}
                >
                  {patient.user.name} {patient.user.lastName}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Botones de Acción */}
        {selectedPatient && (
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

        {/* Sección de Datos Emocionales */}
        {selectedPatient && (
          <div className="mood-data card" ref={reportRef}>
            <h3>Registros de estado emocional de {selectedPatient.user.name}</h3>
            {moodData.length > 0 ? (
              <div className="mood-content">
                {/* Gráfica de Pastel */}
                <div className="mood-chart">
                  <PieChart width={400} height={400}>
                    <Legend
                      layout="horizontal"
                      verticalAlign="top"
                      align="center"
                      wrapperStyle={{ marginBottom: '20px' }}
                    />
                    <Pie
                      data={chartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={150}
                      label
                    >
                      {chartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </div>
                {/* Tabla de Datos Emocionales */}
                <table className="mood-table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Hora</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {moodData.map((item) => {
                      const dateObj = new Date(item.date);
                      const date = dateObj.toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                      });
                      const time = dateObj.toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit',
                      });
                      return (
                        <tr key={item._id}>
                          <td>{date}</td>
                          <td>{time}</td>
                          <td>{item.mood}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p>No hay datos de estado emocional para este paciente.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MoodScreen;
