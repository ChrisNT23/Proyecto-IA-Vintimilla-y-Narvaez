// src/screens/Reports/activitiesReportScreen.jsx

import React, { useState, useEffect, useRef } from "react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { skipToken } from "@reduxjs/toolkit/query/react";
import { useGetDoctorWithPatientsQuery } from "../../slices/doctorApiSlice";
import {
  useGetTreatmentsByPatientQuery,
  useGetCompletedActivitiesByTreatmentQuery,
  useGetAssignedActivities2Query, // Usamos el hook correcto
} from "../../slices/treatmentSlice"; // Asegúrate de que el nombre del archivo sea correcto
import "../../assets/styles/ActivityReport.css";
import {
  FaDownload,
  FaPrint,
  FaChartBar,
  FaChartPie,
  FaUser,
  FaBriefcase,
  FaCheckCircle, // Importar el icono para actividades
} from "react-icons/fa";
import Loader from "../../components/Loader";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const ActivityReportScreen = () => {
  // 1. OBTENER LISTA DE PACIENTES
  const {
    data: patients,
    isLoading: isLoadingPatients,
    error: errorPatients,
  } = useGetDoctorWithPatientsQuery();

  // ESTADOS PARA ALMACENAR EL PACIENTE Y TRATAMIENTO SELECCIONADOS
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedTreatment, setSelectedTreatment] = useState(null);

  // 2. OBTENER LISTA DE TRATAMIENTOS PARA EL PACIENTE SELECCIONADO
  const {
    data: treatments,
    isLoading: isLoadingTreatments,
    error: errorTreatments,
  } = useGetTreatmentsByPatientQuery(
    selectedPatient ? selectedPatient._id : skipToken
  );

  // 3. OBTENER ACTIVIDADES COMPLETADAS POR TRATAMIENTO
  const {
    data: completedActivities,
    isLoading: isLoadingActivities,
    error: errorActivities,
  } = useGetCompletedActivitiesByTreatmentQuery(
    selectedTreatment ? selectedTreatment._id : skipToken
  );

  // 4. OBTENER ACTIVIDADES ASIGNADAS AL TRATAMIENTO+PACIENTE (useGetAssignedActivities2Query)
  const {
    data: assignedActivities,
    isLoading: isLoadingAssignedActivities,
    error: errorAssignedActivities,
  } = useGetAssignedActivities2Query(
    selectedTreatment && selectedPatient
      ? {
          treatmentId: selectedTreatment._id,
          patientId: selectedPatient._id,
        }
      : skipToken
  );

  // ESTADOS PARA GRÁFICAS
  const [activityTypes, setActivityTypes] = useState([]);
  const [colorMap, setColorMap] = useState({});
  const [activitiesPieData, setActivitiesPieData] = useState([]); // Nuevo estado para múltiples gráficos de pastel
  const [barChartData, setBarChartData] = useState([]);

  // ESTADO PARA ACTIVIDADES PENDIENTES
  const [pendingActivities, setPendingActivities] = useState([]);

  // COLORES PREDEFINIDOS PARA LAS GRÁFICAS
  const predefinedColors = [
    "#1f77b4",
    "#ff7f0e",
    "#2ca02c",
    "#d62728",
    "#9467bd",
    "#8c564b",
    "#e377c2",
    "#7f7f7f",
    "#bcbd22",
    "#17becf",
  ];

  // DEFINIR PUNTOS TOTALES POR ACTIVIDAD
  const TOTAL_POINTS_PER_ACTIVITY = {
    "Búsqueda de Letras-Nivel 1": 5,
    "Búsqueda de Letras-Nivel 2": 5,
    "Búsqueda de Letras-Nivel 3": 5,
    "Asociación de Fotos-Nivel 1": 25,
    "Asociación de Fotos-Nivel 2": 5,
    "Asociación de Fotos-Nivel 3": 5,
    "Sumas y Restas-Nivel 1": 25,
    "Sumas y Restas-Nivel 2": 40,
    "Sumas y Restas-Nivel 3": 50,
    "Encontrar Diferencias-Nivel 1": 35,
    "Encontrar Diferencias-Nivel 2": 50,
    "Encontrar Diferencias-Nivel 3": 50,
    "Formar Refranes-Nivel 1": 5,
    "Formar Refranes-Nivel 2": 5,
    "Formar Refranes-Nivel 3": 5,
    "Sopa de letras-Nivel 1	": 5,
    "Sopa de letras-Nivel 2	": 10,
    "Sopa de letras-Nivel 3	": 5,
    "Clasificación de Palabras-Nivel 1": 5,
    "Clasificación de Palabras-Nivel 2": 5,
    "Clasificación de Palabras-Nivel 3": 5,
    "Ejercicio de Memoria-Nivel 1": 50,
    "Ejercicio de Memoria-Nivel 2": 50,
    "Ejercicio de Memoria-Nivel 3": 50,
    "Lectura y Preguntas-Nivel 1": 5,
    "Lectura y Preguntas-Nivel 2": 5,
    "Lectura y Preguntas-Nivel 3": 5,
    "Cumplir Instrucciones-Nivel 1": 30,
    "Cumplir Instrucciones-Nivel 2": 30,
    "Cumplir Instrucciones-Nivel 3": 30,
  };

  // REFERENCIA PARA GENERAR PDF
  const reportRef = useRef();

  // ESTADOS PARA MOSTRAR MENSAJES DE ÉXITO O ERROR AL DESCARGAR PDF
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [downloadError, setDownloadError] = useState(false);

  // ----------------------------------------------------------------------------
  // useEffect para calcular las ACTIVIDADES PENDIENTES:
  // (pending = assignedActivities - completedActivities)
  // ----------------------------------------------------------------------------
  useEffect(() => {
    if (assignedActivities && completedActivities) {
      const completedIds = new Set(
        completedActivities.map((c) => c.activity._id.toString())
      );
      const pending = assignedActivities.filter(
        (act) => !completedIds.has(act._id.toString())
      );
      setPendingActivities(pending);
    } else {
      setPendingActivities([]);
    }
  }, [assignedActivities, completedActivities]);

  // ----------------------------------------------------------------------------
  // useEffect para CONFIGURAR LOS DATOS DE LAS GRÁFICAS cuando
  // cambien las actividades completadas o el tratamiento seleccionado
  // ----------------------------------------------------------------------------
  useEffect(() => {
    if (completedActivities && selectedTreatment) {
      // 1. OBTENER NOMBRES DE ACTIVIDAD ÚNICOS
      const types = [
        ...new Set(completedActivities.map((a) => a.activity.name)),
      ];
      setActivityTypes(types);

      // 2. ASIGNAR COLORES
      const colors = {};
      types.forEach((type, index) => {
        colors[type] =
          predefinedColors[index % predefinedColors.length] || "#000000";
      });
      setColorMap(colors);

      // 3. AGRUPAR ACTIVIDADES POR FECHA
      const groupedByDate = {};

      completedActivities.forEach((activity) => {
        const dateObj = new Date(activity.dateCompleted);
        const formattedDate = dateObj.toLocaleDateString("es-ES", {
          day: "2-digit",
          month: "2-digit",
          year: "2-digit",
        });

        if (!groupedByDate[formattedDate]) {
          groupedByDate[formattedDate] = { date: formattedDate };
        }

        const activityName = activity.activity.name;
        // Si no hay puntaje, usar 0
        const score = Math.max(Number(activity.scoreObtained), 0);

        // Sumar el puntaje al tipo de actividad
        if (groupedByDate[formattedDate][activityName]) {
          groupedByDate[formattedDate][activityName] += score;
        } else {
          groupedByDate[formattedDate][activityName] = score;
        }
      });

      // 4. TRANSFORMAR EL OBJETO AGRUPADO EN ARREGLO
      const transformedData = Object.values(groupedByDate);
      setBarChartData(transformedData);

      // 5. PREPARAR DATOS PARA MÚLTIPLES GRÁFICOS DE PASTEL
      const activitiesData = types.map((type) => {
        const obtainedPoints = completedActivities
          .filter((a) => a.activity.name === type)
          .reduce((sum, a) => sum + Math.max(Number(a.scoreObtained), 0), 0);

        const totalPoints = TOTAL_POINTS_PER_ACTIVITY[type] || 100; // Valor por defecto si no se especifica

        return {
          name: type,
          data: [
            { name: "Obtenidos", value: obtainedPoints },
            { name: "Restantes", value: Math.max(totalPoints - obtainedPoints, 0) },
          ],
          color: colors[type],
          totalPoints, // Para mostrar en la etiqueta o tooltip si es necesario
        };
      });

      setActivitiesPieData(activitiesData);
    } else {
      // Si no hay actividades completadas o no hay tratamiento seleccionado
      setActivityTypes([]);
      setColorMap({});
      setActivitiesPieData([]);
      setBarChartData([]);
    }
  }, [completedActivities, selectedTreatment]);

  // ----------------------------------------------------------------------------
  // FUNCIÓN PARA IMPRIMIR
  // ----------------------------------------------------------------------------
  const handlePrint = () => {
    window.print();
  };

  // ----------------------------------------------------------------------------
  // FUNCIÓN PARA DESCARGAR PDF
  // ----------------------------------------------------------------------------
  const handleDownload = () => {
    const input = reportRef.current;
    html2canvas(input, { scale: 2 })
      .then((canvas) => {
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF("p", "mm", "a4");
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
        pdf.save("reporte_actividades.pdf");
        setDownloadSuccess(true);
        setTimeout(() => setDownloadSuccess(false), 3000); // Ocultar después de 3s
      })
      .catch((err) => {
        console.error("Error al generar el PDF:", err);
        setDownloadError(true);
        setTimeout(() => setDownloadError(false), 3000);
      });
  };

  // ----------------------------------------------------------------------------
  // RENDER DEL COMPONENTE
  // ----------------------------------------------------------------------------
  return (
    <div className="activity-report-screen">
      <header className="report-header">
        <h1>Reporte de Actividades de Pacientes</h1>
      </header>

      <div className="content">
        {/* SELECCIÓN DE PACIENTE */}
        <section className="selection-section card">
          <h3>
            <FaUser /> Seleccionar Paciente
          </h3>
          {isLoadingPatients ? (
            <Loader />
          ) : errorPatients ? (
            <p className="error-message">
              Error al cargar pacientes: {errorPatients.message}
            </p>
          ) : (
            <select
              className="patient-select"
              value={selectedPatient ? selectedPatient._id : ""}
              onChange={(e) =>
                setSelectedPatient(
                  patients.find((p) => p._id === e.target.value) || null
                )
              }
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

        {/* SELECCIÓN DE TRATAMIENTO */}
        {selectedPatient && (
          <section className="selection-section card">
            <h3>
              <FaBriefcase /> Seleccionar Tratamiento
            </h3>
            {isLoadingTreatments ? (
              <p>Cargando tratamientos...</p>
            ) : errorTreatments ? (
              <p className="error-message">
                Error al cargar tratamientos: {errorTreatments.message}
              </p>
            ) : (
              <select
                className="patient-select"
                value={selectedTreatment ? selectedTreatment._id : ""}
                onChange={(e) =>
                  setSelectedTreatment(
                    treatments.find((t) => t._id === e.target.value) || null
                  )
                }
              >
                <option value="">-- Seleccionar Tratamiento --</option>
                {treatments?.map((treatment) => (
                  <option key={treatment._id} value={treatment._id}>
                    {treatment.treatmentName}
                  </option>
                ))}
              </select>
            )}
          </section>
        )}

        {/* BOTONES DE ACCIÓN */}
        {selectedTreatment && (
          <div className="action-buttons">
            <button className="btn btn-download" onClick={handleDownload}>
              <FaDownload className="btn-icon" /> Descargar Reporte
            </button>
            <button className="btn btn-print" onClick={handlePrint}>
              <FaPrint className="btn-icon" /> Imprimir Reporte
            </button>
          </div>
        )}

        {/* FEEDBACK AL USUARIO */}
        {downloadSuccess && (
          <p className="success-message">Reporte descargado exitosamente.</p>
        )}
        {downloadError && (
          <p className="error-message">Error al descargar el reporte.</p>
        )}

        {/* SECCIÓN DE GRÁFICOS (CON REF PARA PDF) */}
        {selectedTreatment && (
          <section className="report-section card" ref={reportRef}>
            <h2>
              <FaChartBar /> Reporte de Actividades -{" "}
              {selectedTreatment.treatmentName}
            </h2>

            {isLoadingActivities ? (
              <Loader />
            ) : errorActivities ? (
              <p className="error-message">
                Error al cargar actividades: {errorActivities.message}
              </p>
            ) : completedActivities && completedActivities.length > 0 ? (
              <div className="charts-container">
                {/* GRÁFICO DE BARRAS */}
                <div className="bar-chart-container">
                  <h3>
                    <FaChartBar /> Actividades por Fecha
                  </h3>
                  <ResponsiveContainer width="100%" height="90%">
                    <BarChart
                      data={barChartData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="date"
                        tick={{ angle: -45, textAnchor: "end" }}
                        interval={0}
                        height={60} /* para las etiquetas inclinadas */
                      />
                      <YAxis
                        label={{
                          value: "Puntaje",
                          angle: -90,
                          position: "insideLeft",
                        }}
                      />
                      <Tooltip />
                      <Legend verticalAlign="top" height={36} />

                      {activityTypes.map((type) => (
                        <Bar
                          key={type}
                          dataKey={type}
                          fill={colorMap[type]}
                          stackId="a"
                        />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* NUEVA SECCIÓN DE MÚLTIPLOS GRÁFICOS DE PASTEL */}
                <div className="multiple-pie-charts-container">
                  <h3>
                    <FaChartPie /> Distribución de Actividades Individuales
                  </h3>
                  <div className="individual-pie-charts">
                    {activitiesPieData.map((activity, index) => (
                      <div key={index} className="individual-pie-chart">
                        <h4>{activity.name}</h4>
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie
                              data={activity.data}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              outerRadius={100}
                              label={({ name, percent }) =>
                                `${name}: ${(percent * 100).toFixed(0)}%`
                              }
                            >
                              {activity.data.map((entry, idx) => (
                                <Cell
                                  key={`cell-${idx}`}
                                  fill={
                                    entry.name === "Obtenidos"
                                      ? colorMap[activity.name]
                                      : "#d3d3d3" // Color para los restantes
                                  }
                                />
                              ))}
                            </Pie>
                            <Tooltip />
                            <Legend
                              layout="horizontal"
                              verticalAlign="bottom"
                              align="center"
                            />
                          </PieChart>
                        </ResponsiveContainer>
                        <p>
                          Puntos Obtenidos: {activity.data[0].value} /{" "}
                          {activity.totalPoints}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p>No hay actividades completadas para este tratamiento.</p>
            )}
          </section>
        )}

        {/* SECCIÓN DE ACTIVIDADES PENDIENTES */}
        {selectedTreatment &&
          !isLoadingAssignedActivities &&
          !errorAssignedActivities && (
            <section className="report-section card">
              <h2>
                <FaCheckCircle /> Actividades Pendientes
              </h2>
              {pendingActivities.length > 0 ? (
                <ul className="pending-activities-list">
                  {pendingActivities.map((act) => (
                    <li key={act._id} className="pending-activity-item">
                      <FaCheckCircle className="activity-icon" />
                      <div className="activity-details">
                        <strong>{act.name}</strong>
                        <p>{act.description}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No hay actividades pendientes para este tratamiento.</p>
              )}
            </section>
          )}
      </div>
    </div>
  );
};

export default ActivityReportScreen;