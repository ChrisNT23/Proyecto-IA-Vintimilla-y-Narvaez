import React, { useState, useEffect } from 'react';
import { useGetAllMocaSelfsQuery } from '../../slices/mocaSelfApiSlice';
import '../../assets/styles/MocaScreen.css'; // Archivo de estilos
import { Button, Spinner, Alert } from 'react-bootstrap';
import { PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useNavigate } from 'react-router-dom';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AA336A', '#33AA99', '#FF6699', '#9966FF'];

const MocaScreen = () => {
  const { data: mocaRecords = [], isLoading, isError, error } = useGetAllMocaSelfsQuery();
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [averageScore, setAverageScore] = useState(0);
  const [scoreDistribution, setScoreDistribution] = useState([]);
  const [scoreTrend, setScoreTrend] = useState([]);
  const navigate = useNavigate();

  // Extraer lista única de pacientes de los registros MoCA
  const patients = React.useMemo(() => {
    const uniquePatients = {};
    mocaRecords.forEach(record => {
      if (record.patient && record.patient._id && record.patientName) {
        uniquePatients[record.patient._id] = record.patientName;
      }
    });
    return Object.entries(uniquePatients).map(([id, name]) => ({ id, name }));
  }, [mocaRecords]);

  // Manejar la selección de un paciente
  const handlePatientClick = (patient) => {
    setSelectedPatient(patient);
  };

  // Filtrar registros MoCA para el paciente seleccionado
  useEffect(() => {
    if (selectedPatient) {
      const records = mocaRecords.filter(record => record.patient && record.patient._id === selectedPatient.id);
      setFilteredRecords(records);
    } else {
      setFilteredRecords([]);
    }
  }, [selectedPatient, mocaRecords]);

  // Calcular el puntaje promedio y la distribución de puntajes
  useEffect(() => {
    if (filteredRecords.length > 0) {
      const totalScore = filteredRecords.reduce((acc, curr) => acc + (curr.totalScore || 0), 0);
      const avgScore = (totalScore / filteredRecords.length).toFixed(2);
      setAverageScore(avgScore);

      // Distribución de puntajes en rangos
      const distribution = {
        '0-10': 0,
        '11-20': 0,
        '21-30': 0,
      };

      filteredRecords.forEach(record => {
        const score = record.totalScore;
        if (score >= 0 && score <= 10) {
          distribution['0-10'] += 1;
        } else if (score >= 11 && score <= 20) {
          distribution['11-20'] += 1;
        } else if (score >= 21 && score <= 30) {
          distribution['21-30'] += 1;
        }
      });

      const formattedDistribution = Object.keys(distribution).map(range => ({
        range,
        count: distribution[range],
      }));
      setScoreDistribution(formattedDistribution);

      // Tendencia de puntajes a lo largo del tiempo
      const trend = filteredRecords
        .map(record => ({
          date: new Date(record.testDate).toLocaleDateString(),
          score: record.totalScore,
        }))
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      setScoreTrend(trend);
    } else {
      setAverageScore(0);
      setScoreDistribution([]);
      setScoreTrend([]);
    }
  }, [filteredRecords]);

  return (
    <div className="moca-screen">
      <h1>Reporte de Resultados MoCA</h1>
      {isLoading ? (
        <div className="text-center my-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Cargando...</span>
          </Spinner>
          <p>Cargando registros de MoCA...</p>
        </div>
      ) : isError ? (
        <Alert variant="danger" className="my-5">
          {error?.data?.error || 'Hubo un error al cargar los registros de MoCA.'}
        </Alert>
      ) : (
        <>
          {/* Lista de Pacientes */}
          <div className="patients-list">
            <h3>Lista de Pacientes</h3>
            {patients.length === 0 ? (
              <p>No hay pacientes disponibles.</p>
            ) : (
              <ul className="list-group">
                {patients.map(patient => (
                  <li
                    key={patient.id}
                    className={`list-group-item ${selectedPatient && selectedPatient.id === patient.id ? 'active' : ''}`}
                    onClick={() => handlePatientClick(patient)}
                    style={{ cursor: 'pointer' }}
                  >
                    {patient.name}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Reportes para el Paciente Seleccionado */}
          {selectedPatient && (
            <div className="report-details my-5">
              <h3>Resultados de MoCA para: {selectedPatient.name}</h3>
              {filteredRecords.length === 0 ? (
                <Alert variant="info">
                  No se han encontrado registros de MoCA para este paciente.
                </Alert>
              ) : (
                <>
                  {/* Gráfico de Distribución de Puntajes */}
                  <div className="chart-container my-4">
                    <h4>Distribución de Puntajes</h4>
                    <PieChart width={400} height={400}>
                      <Pie
                        data={scoreDistribution}
                        dataKey="count"
                        nameKey="range"
                        cx="50%"
                        cy="50%"
                        outerRadius={150}
                        label
                      >
                        {scoreDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </div>

                  {/* Gráfico de Tendencia de Puntajes */}
                  <div className="chart-container my-4">
                    <h4>Tendencia de Puntajes a lo Largo del Tiempo</h4>
                    <BarChart
                      width={600}
                      height={300}
                      data={scoreTrend}
                      margin={{
                        top: 5, right: 30, left: 20, bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="score" fill="#8884d8" name="Puntaje MoCA" />
                    </BarChart>
                  </div>

                  {/* Puntaje Promedio */}
                  <div className="average-score my-4">
                    <h4>Puntaje Promedio de MoCA: {averageScore}</h4>
                  </div>

                  {/* Tabla de Registros MoCA */}
                  <div className="table-container my-4">
                    <h4>Detalles de los Registros MoCA</h4>
                    <table className="table table-striped">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Fecha de la Prueba</th>
                          <th>Puntaje Total</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRecords.map((record, index) => (
                          <tr key={record._id}>
                            <td>{index + 1}</td>
                            <td>{new Date(record.testDate).toLocaleDateString()}</td>
                            <td>{record.totalScore}</td>
                            <td>
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => navigate(`/moca-final/${record._id}`)}
                              >
                                Ver Detalles
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MocaScreen;
