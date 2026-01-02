// src/screens/Reports/PatientsProgress.jsx

import React, { useState, useMemo, useEffect } from 'react';
import {
  Container,
  Grid,
  CircularProgress,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  OutlinedInput,
  Box,
} from '@mui/material';
import {
  useGetTreatmentsByMultiplePatientsMutation,
  useTakeMedicationMutation,
} from '../../slices/treatmentSlice';
import { useGetDoctorWithPatientsQuery } from '../../slices/doctorApiSlice';
import KPICard from '../../components/KPICard';
import ChartsSection from '../../components/ChartsSection';
import ActivitiesList from '../../components/ActivitiesList';
import MedicationsList from '../../components/MedicationsList';
import { useSnackbar } from 'notistack';

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

const PatientsProgressContent = () => {
  const { enqueueSnackbar } = useSnackbar();

  // **1. Llamar a los Hooks de manera incondicional**
  const {
    data: doctorPatients,
    isLoading: isLoadingPatients,
    isError: isErrorPatients,
    error: errorPatients,
  } = useGetDoctorWithPatientsQuery();

  // **2. Definir la lista de pacientes desde doctorPatients**
  const patients = useMemo(() => {
    if (!doctorPatients) return [];
    return doctorPatients.map(patient => ({
      ...patient,
      _id: patient._id.toString(),
    }));
  }, [doctorPatients]);

  // **3. Estados para los filtros**
  const [selectedPatients, setSelectedPatients] = useState([]);
  const [treatmentStatus, setTreatmentStatus] = useState('all'); // Opciones: 'all', 'active', 'inactive'

  // **4. Manejar cambios en los filtros**
  const handlePatientChange = (event) => {
    const {
      target: { value },
    } = event;
    setSelectedPatients(
      typeof value === 'string' ? value.split(',') : value
    );
  };

  const handleStatusChange = (event) => {
    setTreatmentStatus(event.target.value);
  };

  // **5. Obtener tratamientos para los pacientes seleccionados**
  const [fetchTreatments, { data: treatmentsData, isLoading: isLoadingTreatments, isError: isErrorTreatments, error: errorTreatments }] = useGetTreatmentsByMultiplePatientsMutation();

  useEffect(() => {
    if (selectedPatients.length > 0) {
      console.log('Enviando patientIds:', selectedPatients);
      fetchTreatments({ patientIds: selectedPatients })
        .unwrap()
        .then((data) => {
          console.log('Tratamientos recibidos:', data);
        })
        .catch((error) => {
          console.error('Error al obtener tratamientos:', error);
          enqueueSnackbar(`Error: ${error.data?.message || error.error}`, { variant: 'error' });
        });
    }
  }, [selectedPatients, fetchTreatments, enqueueSnackbar]);

  // **6. Filtrar tratamientos según el estado seleccionado**
  const filteredTreatments = useMemo(() => {
    if (!treatmentsData) return [];

    let filtered = treatmentsData;

    // Filtrar por estado del tratamiento
    if (treatmentStatus === 'active') {
      filtered = filtered.filter((treatment) => treatment.active === true);
    } else if (treatmentStatus === 'inactive') {
      filtered = filtered.filter((treatment) => treatment.active === false);
    }

    console.log('Selected Patients IDs:', selectedPatients);
    console.log('Filtered Treatments after applying filters:', filtered);

    return filtered;
  }, [treatmentsData, treatmentStatus]);

  // **7. Filtrar actividades completadas según los tratamientos filtrados y pacientes seleccionados**
  const filteredActivities = useMemo(() => {
    if (!filteredTreatments) return [];

    let activities = [];
    filteredTreatments.forEach((treatment) => {
      if (treatment.completedActivities && treatment.completedActivities.length > 0) {
        // Agregar todas las actividades completadas
        activities = activities.concat(treatment.completedActivities);
      }
    });
    console.log('Filtered Activities:', activities); // Añadir log
    return activities;
  }, [filteredTreatments]);

  // **8. Filtrar medicamentos según los tratamientos filtrados**
  const filteredMedications = useMemo(() => {
    if (!filteredTreatments) return [];

    let medications = [];
    filteredTreatments.forEach((treatment) => {
      if (treatment.medications && treatment.medications.length > 0) {
        medications = medications.concat(
          treatment.medications.map((med) => ({
            ...med,
            treatmentId: treatment._id.toString(),
          }))
        );
      }
    });
    return medications;
  }, [filteredTreatments]);

  // **9. Calcular KPIs basados en los datos filtrados**
  const totalTreatments = filteredTreatments.length;
  const completedTreatments = filteredTreatments.filter(
    (t) => t.progress === 'empeorando' || t.progress === 'mejorando'
  ).length;
  const treatmentCompletionRate =
    totalTreatments > 0
      ? ((completedTreatments / totalTreatments) * 100).toFixed(2)
      : 0;

  const totalActivities = filteredActivities.length;
  const uniqueActivities = [
    ...new Set(filteredActivities.map((a) => a.activity?.name || 'Sin Nombre')),
  ].length;

  const totalMedications = filteredMedications.length;
  const medicationsTaken = filteredMedications.filter(
    (m) => m.takenToday
  ).length;
  const medicationsComplianceRate =
    totalMedications > 0
      ? ((medicationsTaken / totalMedications) * 100).toFixed(2)
      : 0;

  console.log('KPIs:', {
    totalTreatments,
    completedTreatments,
    treatmentCompletionRate,
    totalActivities,
    uniqueActivities,
    totalMedications,
    medicationsTaken,
    medicationsComplianceRate,
  });

  // **10. Manejar la acción de marcar un medicamento como tomado**
  const [takeMedication] = useTakeMedicationMutation();

  const handleTakeMedicationAction = async (medicationId, treatmentId) => {
    try {
      await takeMedication({ treatmentId, medicationId }).unwrap();
      enqueueSnackbar('Medicamento marcado como tomado', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Error al marcar medicamento como tomado', { variant: 'error' });
    }
  };

  // **11. Manejo de estados de carga y error**
  if (isLoadingPatients || (selectedPatients.length > 0 && isLoadingTreatments)) {
    return (
      <Container style={{ textAlign: 'center', marginTop: '50px' }}>
        <CircularProgress />
        <Typography variant="h6">Cargando datos del dashboard...</Typography>
      </Container>
    );
  }

  if (isErrorPatients || isErrorTreatments) {
    return (
      <Container style={{ textAlign: 'center', marginTop: '50px' }}>
        <Typography variant="h6" color="error">
          Hubo un error al cargar los datos del dashboard: {errorPatients?.data?.message || errorTreatments?.data?.message || "Ocurrió un problema inesperado"}
        </Typography>
      </Container>
    );
  }

  // **12. Renderizar el Dashboard**
  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Dashboard de Progreso de los Pacientes
      </Typography>

      {/* Sección de Filtros */}
      <Box mb={3}>
        <Grid container spacing={2}>
          {/* Filtro por Paciente */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel id="patient-select-label">Filtrar por Paciente</InputLabel>
              <Select
                labelId="patient-select-label"
                multiple
                value={selectedPatients}
                onChange={handlePatientChange}
                input={<OutlinedInput label="Filtrar por Paciente" />}
                renderValue={(selected) =>
                  selected
                    .map((id) => {
                      const patient = patients.find((p) => p._id === id);
                      return patient ? `${patient.user.name} ${patient.user.lastName}` : id;
                    })
                    .join(', ')
                }
                MenuProps={MenuProps}
              >
                {patients.map((patient) => (
                  <MenuItem key={patient._id} value={patient._id}>
                    <Checkbox checked={selectedPatients.indexOf(patient._id) > -1} />
                    <ListItemText primary={`${patient.user.name} ${patient.user.lastName}`} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Filtro por Estado del Tratamiento */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel id="status-select-label">Estado del Tratamiento</InputLabel>
              <Select
                labelId="status-select-label"
                value={treatmentStatus}
                onChange={handleStatusChange}
                label="Estado del Tratamiento"
              >
                <MenuItem value="all">Todos</MenuItem>
                <MenuItem value="active">Activo</MenuItem>
                <MenuItem value="inactive">Inactivo</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Box>

      {/* Sección de KPIs */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={4}>
          <KPICard
            title="Adherencia de Tratamientos"
            value={`${treatmentCompletionRate}%`}
            subtitle="Nivel promedio de adherencia a los tratamientos"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <KPICard
            title="Actividades Completadas"
            value={`${totalActivities}`}
            subtitle={`Actividades únicas: ${uniqueActivities}`}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <KPICard
            title="Cumplimiento de Medicamentos"
            value={`${medicationsComplianceRate}%`}
            subtitle={`${medicationsTaken}/${totalMedications} tomados`}
          />
        </Grid>
      </Grid>

      {/* Sección de Gráficos */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <ChartsSection
            treatments={filteredTreatments}
            completedActivities={filteredActivities}
            medications={filteredMedications}
          />
        </Grid>
      </Grid>
    </Container>
  );
};

const PatientsProgress = () => (
  <PatientsProgressContent />
);

export default PatientsProgress;
