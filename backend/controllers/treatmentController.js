import asyncHandler from 'express-async-handler';
import mongoose from 'mongoose';
import Treatment from '../models/treatmentModel.js';
import Patient from '../models/patientModel.js';
import Activity from '../models/activityModel.js';
import Doctor from '../models/doctorModel.js';
import { io } from 'socket.io-client';
import { getIO } from '../socket.js';
import { startOfDay, isSameDay, addDays, isBefore, isAfter, isSameWeek, isSameMonth } from 'date-fns';

// @desc    Asignar una actividad a un paciente
// @route   POST /api/assignments
// @access  Privado/Doctor
const assignActivityToPatient = asyncHandler(async (req, res) => {
  const { patientId, doctorId, activityId } = req.body;

  // Agregar logs para verificar que los datos están siendo recibidos
  console.log("Datos recibidos en la solicitud POST:");
  console.log("Patient ID:", patientId);
  console.log("Doctor ID:", doctorId);
  console.log("Activity ID:", activityId);

  // Verificar que el paciente, el doctor y la actividad existen
  const patient = await Patient.findById(patientId);
  const activity = await Activity.findById(activityId);

  if (!patient) {
    console.log("Paciente no encontrado");
    res.status(404);
    throw new Error('Paciente no encontrado');
  }

  if (!activity) {
    console.log("Actividad no encontrada");
    res.status(404);
    throw new Error('Actividad no encontrada');
  }

  // Crear la asignación de actividad para el paciente
  const assignment = await Assignment.create({
    patient: patientId,
    doctor: doctorId,
    activity: activityId,
  });

  console.log("Asignación creada:", assignment);

  // Emite un evento al asignar/desasignar actividad
  // Después de crear la asignación
  io.emit(`activitiesUpdated:${patientId}`, { message: 'Actividad asignada' });
  console.log(`Evento activitiesUpdated emitido para el paciente ${patientId}`);
    
  res.status(201).json({
    message: 'Actividad asignada correctamente al paciente',
    assignment,
  });
});
// @desc    Actualizar resultados de una actividad asignada
// @route   PUT /api/assignments/:assignmentId/results
// @access  Privado/Doctor o Paciente
const updateAssignmentResults = asyncHandler(async (req, res) => {
  const { assignmentId } = req.params;
  const { scoreObtained, timeUsed, progress, observations } = req.body;

  // Buscar la asignación
  const assignment = await Assignment.findById(assignmentId);

  if (!assignment) {
    res.status(404);
    throw new Error('Asignación no encontrada');
  }

  // Actualizar resultados de la asignación
  assignment.scoreObtained = scoreObtained;
  assignment.timeUsed = timeUsed;
  assignment.progress = progress;
  assignment.observations = observations;
  assignment.completionDate = Date.now();

  await assignment.save();

  res.status(200).json({
    message: 'Resultados de la actividad actualizados',
    assignment,
  });
});


const unassignActivityFromPatient = asyncHandler(async (req, res) => {
  const { assignmentId } = req.params;

  console.log('Solicitud para desasignar actividad. Assignment ID:', assignmentId);

  const assignment = await Assignment.findById(assignmentId);

  if (!assignment) {
    console.log('Asignación no encontrada para el ID proporcionado');
    res.status(404);
    throw new Error('Asignación no encontrada');
  }

  await assignment.deleteOne();
  console.log('Asignación eliminada exitosamente');
  // Después de eliminar la asignación
  io.emit(`activitiesUpdated:${assignment.patient}`, { message: 'Actividad desasignada' });
  console.log(`Evento activitiesUpdated emitido para el paciente ${assignment.patient}`);
  
  res.status(200).json({ message: 'Actividad desasignada correctamente' });
});

// @desc    Obtener actividades asignadas al paciente autenticado
// @route   GET /api/treatments/myactivities
// @access  Privado/Paciente
const getMyAssignedActivities = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Obtener el paciente asociado al usuario
  const patient = await Patient.findOne({ user: userId });
  if (!patient) {
    res.status(404);
    throw new Error('Paciente no encontrado');
  }

  // Buscar tratamientos donde el paciente está incluido
  const treatments = await Treatment.find({ patients: patient._id })
    .populate('activities');

  // Extraer las actividades de todos los tratamientos
  const activities = [];
  treatments.forEach(treatment => {
    activities.push(...treatment.activities);
  });

  // Eliminar actividades duplicadas si es necesario
  const uniqueActivities = activities.filter((activity, index, self) =>
    index === self.findIndex((a) => a._id.toString() === activity._id.toString())
  );

  res.status(200).json(uniqueActivities);
});

// @desc    Crear un nuevo tratamiento
// @route   POST /api/treatments/create
// @access  Privado/Admin (Doctor)
const createTreatment = asyncHandler(async (req, res) => {
  const {
    treatmentName,
    description,
    patientIds,
    assignedActivities,
    medications,
    exerciseVideos,
    startDate,
    endDate,
    progress,
    adherence,
    observations,
    nextReviewDate,
  } = req.body;

  console.log('Datos recibidos para crear tratamiento:', req.body); // Depuración

  // Validaciones básicas
  if (!treatmentName || !description || !patientIds || !Array.isArray(patientIds)) {
    res.status(400);
    throw new Error('Por favor, proporciona nombre, descripción y pacientes válidos');
  }

  // Validar que las actividades existen
  if (assignedActivities && assignedActivities.length > 0) {
    const validActivities = await Activity.find({ _id: { $in: assignedActivities } });
    if (validActivities.length !== assignedActivities.length) {
      res.status(400);
      throw new Error('Algunas actividades asignadas no existen');
    }
  }

  // Validar que los pacientes existen
  const validPatients = await Patient.find({ _id: { $in: patientIds } });
  if (validPatients.length !== patientIds.length) {
    res.status(400);
    throw new Error('Algunos pacientes asignados no existen');
  }

  // Crear el tratamiento y asignar el campo 'doctor' desde el usuario autenticado
  const treatment = new Treatment({
    treatmentName,
    description,
    patients: patientIds,
    assignedActivities,
    medications,
    exerciseVideos,
    startDate,
    endDate,
    progress,
    adherence,
    observations,
    nextReviewDate,
    doctor: req.user._id, // Asignar el campo 'doctor'
  });

  const createdTreatment = await treatment.save();
  
  // Asignar el tratamiento a cada paciente seleccionado
  if (treatment && assignedActivities && assignedActivities.length > 0) { // <-- Cambiado aquí
    for (const patientId of patientIds) {
      const patient = await Patient.findById(patientId);

      if (patient) {
        // Agregar el tratamiento al paciente
        patient.treatments = patient.treatments || [];
        patient.treatments.push(treatment._id);

        await patient.save();
      }
    }
  }

  console.log('Tratamiento creado:', createdTreatment); // Depuración

  res.status(201).json(createdTreatment);
});


// @desc    Obtener tratamientos creados por el médico autenticado
// @route   GET /api/treatments/mytreatments
// @access  Privado/Doctor
const getMyTreatments = asyncHandler(async (req, res) => {
  const doctorId = req.user._id;

  const doctor = await Doctor.findOne({ user: doctorId });

  const treatments = await Treatment.find({ doctor: doctor._id })
    .populate({
      path: 'patients',
      populate: { path: 'user', select: 'name lastName email' },
    })
    .populate('activities')
    .populate('doctor', 'user');

  console.log('Tratamientos encontrados:', treatments);

  res.status(200).json(treatments);
});

// @desc    Obtener tratamientos para un paciente específico
// @route   GET /api/treatments/patient/:patientId/treatments
// @access  Privado/Admin (Doctor) o Privado/Paciente
const getTreatmentsByPatient2 = asyncHandler(async (req, res) => {
  const { patientId } = req.params;

  // Validar patientId

  if (!mongoose.Types.ObjectId.isValid(patientId)) {
    res.status(400);
    throw new Error('ID de paciente inválido');
  }

  // Verificar que el paciente existe
  const patient = await Patient.findById(patientId);
  if (!patient) {
    res.status(404);
    throw new Error('Paciente no encontrado');
  }

  // Verificar que el usuario autenticado está autorizado para ver los tratamientos de este paciente
  const userId = req.user._id;

  // Supongo que la relación doctor-paciente está en el modelo Patient (doctor: ObjectId)
  const doctor = await Doctor.findOne({ user: userId });
  const patientOfUser = await Patient.findOne({ user: userId });

  if (doctor) {
    // Si el usuario es un doctor, verificar que está asignado al paciente
    if (!patient.doctor.equals(doctor._id)) {
      res.status(403);
      throw new Error('No autorizado: Doctor no está asignado a este paciente');
    }
  } else if (patientOfUser && patientOfUser._id.equals(patient._id)) {
    // Si el usuario es un paciente, permitirle ver sus propios tratamientos
    // No es necesario hacer nada más
  } else {
    res.status(403);
    throw new Error('No autorizado para ver los tratamientos de este paciente');
  }

  // Buscar tratamientos donde el paciente está incluido
  const treatments = await Treatment.find({ patients: patientId })
    .populate({
      path: 'patients',
      populate: { path: 'user', select: 'name lastName email' },
    })
    .populate('doctor', 'user');

  console.log(`Tratamientos para el paciente ${patientId}:`, treatments);

  res.status(200).json(treatments);
});



// @desc    Obtener tratamiento por ID
// @route   GET /api/treatments/:treatmentId
// @access  Privado/Admin
const getTreatmentById = asyncHandler(async (req, res) => {
  const { treatmentId } = req.params;

  const treatment = await Treatment.findById(treatmentId)
    .populate({
      path: 'assignedActivities',
      select: 'name description', // Campos necesarios de 'Activity'
    })
    .populate({
      path: 'doctor',
      select: 'name email', // Campos necesarios de 'User'
    })
    .populate({
      path: 'patients',
      populate: {
        path: 'user',
        select: 'name lastName', // Campos necesarios de 'User' dentro de 'Patient'
      },
    });

  if (treatment) {
    res.json(treatment);
  } else {
    res.status(404);
    throw new Error('Tratamiento no encontrado');
  }
});

// @desc    Actualizar un tratamiento existente
// @route   PUT /api/treatments/:treatmentId
// @access  Privado/Doctor
const updateTreatment = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const doctorId = req.user._id;
  const { treatmentId } = req.params;

  // Verificar que el usuario es un doctor
  const doctor = await Doctor.findOne({ user: doctorId });
  if (!doctor) {
    res.status(401);
    throw new Error('Acceso no autorizado: No es un doctor');
  }

  // Buscar el tratamiento
  let treatment = await Treatment.findById(treatmentId);
  if (!treatment) {
    res.status(404);
    throw new Error('Tratamiento no encontrado');
  }

  if (treatment.doctor.toString() !== userId.toString()) {
    res.status(401);
    throw new Error('No autorizado para modificar este tratamiento');
  }

  // Actualizar los campos del tratamiento con los datos recibidos
  const {
    patientIds,
    treatmentName,
    description,
    assignedActivities,
    medications,
    exerciseVideos,
    startDate,
    endDate,
    progress,
    adherence,
    observations,
    nextReviewDate,
    active,
  } = req.body;

  treatment.treatmentName = treatmentName || treatment.treatmentName;
  treatment.description = description || treatment.description;
  treatment.assignedActivities = assignedActivities || treatment.assignedActivities;
  treatment.medications = medications || treatment.medications;
  treatment.exerciseVideos = exerciseVideos || treatment.exerciseVideos;
  treatment.startDate = startDate || treatment.startDate;
  treatment.endDate = endDate || treatment.endDate;
  treatment.progress = progress || treatment.progress;
  treatment.adherence = adherence || treatment.adherence;
  treatment.observations = observations || treatment.observations;
  treatment.nextReviewDate = nextReviewDate || treatment.nextReviewDate;

  if (typeof active !== 'undefined') {
    treatment.active = active;

    if (active) {
      // Desactivar otros tratamientos para estos pacientes
      await Treatment.updateMany(
        {
          _id: { $ne: treatment._id },
          patients: { $in: treatment.patients },
        },
        { active: false }
      );
    }
  }

  if (patientIds) {
    // Actualizar pacientes asignados al tratamiento
    const previousPatientIds = treatment.patients.map((id) => id.toString());
    const newPatientIds = patientIds;

    const patientsToRemove = previousPatientIds.filter((id) => !newPatientIds.includes(id));
    const patientsToAdd = newPatientIds.filter((id) => !previousPatientIds.includes(id));

    // Remover el tratamiento de los pacientes que ya no están asignados
    await Patient.updateMany(
      { _id: { $in: patientsToRemove } },
      { $pull: { treatments: treatment._id } }
    );

    // Agregar el tratamiento a los nuevos pacientes asignados
    await Patient.updateMany(
      { _id: { $in: patientsToAdd } },
      { $addToSet: { treatments: treatment._id } }
    );

    treatment.patients = patientIds;
  }

  await treatment.save();

  // Volver a obtener el tratamiento actualizado con campos poblados
  const updatedTreatment = await Treatment.findById(treatment._id)
    .populate({
      path: 'assignedActivities',
      select: 'name description',
    })
    .populate({
      path: 'doctor',
      select: 'name email',
    })
    .populate({
      path: 'patients',
      populate: {
        path: 'user',
        select: 'name lastName',
      },
    });

  res.status(200).json({
    message: 'Tratamiento actualizado exitosamente',
    treatment: updatedTreatment,
  });
});


// @desc    Obtener medicamentos del paciente (solo del tratamiento activo)
// @route   GET /api/treatments/my-medications
// @access  Privado/Paciente
const getMyMedications = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Obtener el paciente asociado al usuario
  const patient = await Patient.findOne({ user: userId });
  if (!patient) {
    res.status(404);
    throw new Error('Paciente no encontrado');
  }

  // Obtener el tratamiento activo
  const activeTreatment = await Treatment.findOne({
    patients: patient._id,
    active: true,
  });

  if (!activeTreatment) {
    res.status(200).json([]); // No hay tratamiento activo
    return;
  }

  const medications = activeTreatment.medications || [];

  res.status(200).json(medications);
});

// @desc    Obtener medicamentos que el paciente debe tomar hoy (solo del tratamiento activo)
// @route   GET /api/treatments/due-medications
// @access  Privado/Paciente
const getDueMedications = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Obtener el paciente asociado al usuario autenticado
  const patient = await Patient.findOne({ user: userId });
  if (!patient) {
    res.status(404);
    throw new Error('Paciente no encontrado');
  }

  const today = startOfDay(new Date());

  // Obtener el tratamiento activo
  const activeTreatment = await Treatment.findOne({
    patients: patient._id,
    active: true,
  });

  if (!activeTreatment) {
    res.status(200).json([]); // No hay tratamiento activo
    return;
  }

  let dueMedications = [];

  activeTreatment.medications.forEach((med) => {
    // Verificar si la fecha actual está dentro del rango de fechas del medicamento
    if (med.startDate <= today && (!med.endDate || med.endDate >= today)) {
      const frequency = med.frequency;
      let isDue = false;

      if (!med.lastTaken) {
        // Nunca se ha tomado, está debido
        isDue = true;
      } else {
        const lastTaken = startOfDay(new Date(med.lastTaken));

        switch (frequency) {
          case 'Diaria':
            isDue = !isSameDay(lastTaken, today);
            break;
          case 'Semanal':
            isDue = !isSameWeek(lastTaken, today, { weekStartsOn: 1 }); // Asumiendo que la semana comienza el lunes
            break;
          case 'Mensual':
            isDue = !isSameMonth(lastTaken, today) || lastTaken.getDate() !== today.getDate();
            break;
          default:
            break;
        }
      }

      if (isDue) {
        dueMedications.push(med);
      }
    }
  });

  res.status(200).json(dueMedications);
});


// @desc    Obtener tratamientos por paciente
// @route   GET /api/treatments/patient/:patientId/treatments
// @access  Privado/Admin (Doctor)
const getTreatmentsByPatient = asyncHandler(async (req, res) => {
  const { patientId } = req.params;

  console.log('Obteniendo tratamientos para el paciente:', patientId);

  // Verificar si el paciente existe
  const patientExists = await Patient.findById(patientId);
  if (!patientExists) {
    res.status(404);
    throw new Error('Paciente no encontrado');
  }

  // Buscar tratamientos donde el paciente esté asignado
  const treatments = await Treatment.find({ patients: patientId })
    .populate({
      path: 'assignedActivities',
      select: 'name description', // Selecciona los campos necesarios
    })
    .populate({
      path: 'doctor',
      select: 'name email', // Selecciona los campos necesarios
    })
    .populate({
      path: 'patients',
      populate: {
        path: 'user',
        select: 'name lastName', // Selecciona los campos necesarios del usuario
      },
    });

  console.log('Tratamientos encontrados:', treatments);

  res.json(treatments);
});

// @desc    Obtener actividades asignadas al usuario (solo del tratamiento activo)
// @route   GET /api/treatments/activities
// @access  Privado/Paciente o Doctor
const getActivitiesByUser = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Buscar el paciente asociado al userId
  const patient = await Patient.findOne({ user: userId });
  if (!patient) {
    res.status(404);
    throw new Error('Paciente no encontrado para este usuario');
  }

  const patientId = patient._id;

  // Obtener el tratamiento activo
  const activeTreatment = await Treatment.findOne({
    patients: patientId,
    active: true,
  }).populate('assignedActivities');

  if (!activeTreatment) {
    res.status(200).json([]); // No hay tratamiento activo
    return;
  }

  const activities = activeTreatment.assignedActivities || [];

  res.status(200).json(activities);
});


// @desc    Obtener actividades asignadas a un tratamiento específico para un paciente
// @route   GET /api/treatments/:treatmentId/assignedActivities
// @access  Privado/Paciente
const getAssignedActivities = asyncHandler(async (req, res) => {
  const { treatmentId } = req.params;
  const userId = req.user._id;

  // Obtener el paciente asociado al usuario autenticado
  const patient = await Patient.findOne({ user: userId });
  if (!patient) {
    res.status(404);
    throw new Error('Paciente no encontrado');
  }

  // Buscar el tratamiento y verificar que el paciente esté incluido
  const treatment = await Treatment.findOne({ _id: treatmentId, patients: patient._id })
    .populate('assignedActivities'); // Esto llenará los detalles de las actividades asignadas

  if (!treatment) {
    res.status(404);
    throw new Error('Tratamiento no encontrado para este paciente');
  }

  res.status(200).json(treatment.assignedActivities);
});


// @desc    Registrar una actividad realizada por el paciente en su tratamiento
// @route   POST /api/treatments/:treatmentId/activities
// @access  Privado/Paciente o Doctor
const recordActivity = asyncHandler(async (req, res) => {
  const { treatmentId } = req.params;
  const { activityId, photoId, scoreObtained, timeUsed, progress, observations } = req.body;

  console.log('Datos recibidos en recordActivity:', req.body);
  console.log('treatmentId:', treatmentId); // Verificar que no es undefined

  if (!treatmentId) {
    res.status(400);
    throw new Error('treatmentId no proporcionado');
  }

  const userId = req.user._id;

  // Obtener el paciente asociado al usuario autenticado
  const patient = await Patient.findOne({ user: userId });
  if (!patient) {
    res.status(404);
    throw new Error('Paciente no encontrado');
  }

  // Buscar el tratamiento y verificar que el paciente esté incluido
  const treatment = await Treatment.findOne({ _id: treatmentId, patients: patient._id }).populate('assignedActivities');
  if (!treatment) {
    res.status(404);
    throw new Error('Tratamiento no encontrado para este paciente');
  }

  // Registro de depuración
  console.log('Actividades asignadas al tratamiento:', treatment.assignedActivities.map(a => a._id.toString()));
  console.log('ActividadId recibida:', activityId);

  // Verificar que la actividad asignada esté dentro del tratamiento
  const isAssigned = treatment.assignedActivities.some(activity => activity._id.toString() === activityId);
  if (!isAssigned) {
    res.status(400);
    throw new Error('Actividad no asignada a este tratamiento');
  }

  // Crear una nueva actividad completada
  const completedActivity = {
    activity: activityId,
    photo: photoId, // Opcional
    patient: patient._id,
    dateCompleted: Date.now(),
    scoreObtained,
    timeUsed,
    progress,
    observations,
    image: '', // Opcional
    activeView: false, // Opcional
  };

  console.log('Datos de la actividad completada:', completedActivity); // Log de la actividad completada

  // Agregar la actividad completada al tratamiento
  treatment.completedActivities.push(completedActivity);
  await treatment.save();

  // Emitir un evento para actualizar en tiempo real (si aplica)
  try {
    const io = getIO(); // Obtener la instancia de Socket.io
    io.emit(`treatmentActivitiesUpdated:${treatmentId}`, { message: 'Actividad registrada' });
    console.log(`Evento treatmentActivitiesUpdated emitido para el tratamiento ${treatmentId}`);
  } catch (error) {
    console.error('Error al emitir el evento de Socket.io:', error.message);
    // Puedes optar por no lanzar un error si el evento falla
  }

  res.status(201).json({
    message: 'Actividad registrada exitosamente en el tratamiento',
    completedActivity,
  });
});

// @desc    Obtener actividades realizadas por el paciente en el tratamiento activo
// @route   GET /api/treatments/completed-activities
// @access  Privado/Paciente
const getCompletedActivities = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Obtener el paciente asociado al usuario autenticado
  const patient = await Patient.findOne({ user: userId });
  if (!patient) {
    res.status(404);
    throw new Error('Paciente no encontrado');
  }

  // Obtener el tratamiento activo
  const activeTreatment = await Treatment.findOne({
    patients: patient._id,
    active: true,
  }).populate('completedActivities.activity');

  if (!activeTreatment) {
    res.status(200).json([]); // No hay tratamiento activo
    return;
  }

  res.status(200).json(activeTreatment.completedActivities);
});


// @desc    Obtener el tratamiento activo de un usuario
// @route   GET /api/treatments/:userId/active-treatment
// @access  Privado/Paciente o Doctor
const getActiveTreatment = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  // Obtener el paciente asociado al usuario autenticado
  const patient = await Patient.findOne({ user: userId });
  if (!patient) {
    res.status(404);
    throw new Error('Paciente no encontrado para este usuario');
  }

  const activeTreatment = await Treatment.findOne({
    patients: patient._id,
    active: true,
  }).populate('assignedActivities');

  if (!activeTreatment) {
    res.status(404);
    throw new Error('No hay tratamiento activo para este paciente');
  }

  res.status(200).json(activeTreatment);
});

// @desc    Obtener el tratamiento activo de un paciente específico
// @route   GET /api/treatments/:patientId/active-treatment2
// @access  Privado/Paciente o Doctor
export const getActiveTreatment2 = asyncHandler(async (req, res) => {
  const { patientId } = req.params; // Extraer 'patientId' correctamente

  console.log("getActiveTreatment2 - patientId:", patientId);

  // Validar que 'patientId' es un ObjectId válido
  if (!mongoose.Types.ObjectId.isValid(patientId)) {
    console.log("getActiveTreatment2 - Invalid patient ID:", patientId);
    res.status(400);
    throw new Error('ID de paciente inválido');
  }

  // Buscar el paciente para asegurar que existe
  const patientObj = await Patient.findById(patientId).populate('doctor');
  if (!patientObj) {
    console.log("getActiveTreatment2 - Paciente no encontrado:", patientId);
    res.status(404);
    throw new Error('Paciente no encontrado');
  }

  console.log("getActiveTreatment2 - Paciente encontrado:", patientObj._id);

  // Verificar autorización
  if (req.user.role === 'doctor') {
    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor) {
      console.log("getActiveTreatment2 - Doctor no encontrado para el userId:", req.user._id);
      res.status(403);
      throw new Error('No autorizado: No eres un doctor');
    }

    if (!patientObj.doctor.equals(doctor._id)) {
      console.log("getActiveTreatment2 - Doctor no asignado al paciente");
      res.status(403);
      throw new Error('No autorizado: Doctor no está asignado a este paciente');
    }
  }

  if (req.user.role === 'patient') {
    if (!patientObj.user.equals(req.user._id)) {
      console.log("getActiveTreatment2 - Paciente intentando acceder a otro paciente");
      res.status(403);
      throw new Error('No autorizado: No puedes acceder al tratamiento de otro paciente');
    }
  }

  // Buscar el tratamiento activo para este paciente
  const activeTreatment = await Treatment.findOne({
    patients: patientId, // Usar 'patientId' directamente
    active: true,
  }).populate('assignedActivities')
  .select('exerciseVideos treatmentName description');
  if (!activeTreatment) {
    console.log("getActiveTreatment2 - No active treatment found for patient:", patientId);
    res.status(404);
    throw new Error('No hay tratamiento activo para este paciente');
  }

  console.log("getActiveTreatment2 - Active treatment found:", activeTreatment._id);

  res.status(200).json(activeTreatment);
});


// backend/controllers/treatmentController.js

export const getAssignedActivities2 = asyncHandler(async (req, res) => {
  const { treatmentId, patientId } = req.params; // Extraer ambos parámetros
  const userId = req.user._id;
  const userRole = req.user.role;

  console.log("getAssignedActivities2 - treatmentId:", treatmentId);
  console.log("getAssignedActivities2 - patientId:", patientId);
  console.log("getAssignedActivities2 - userId:", userId);
  console.log("getAssignedActivities2 - userRole:", userRole);

  // Validar que 'treatmentId' y 'patientId' son ObjectIds válidos
  if (!mongoose.Types.ObjectId.isValid(treatmentId) || !mongoose.Types.ObjectId.isValid(patientId)) {
    console.log("getAssignedActivities2 - Invalid treatmentId or patientId:", treatmentId, patientId);
    res.status(400);
    throw new Error('ID de tratamiento o paciente inválido');
  }

  // Buscar el paciente para asegurar que existe
  const patientObj = await Patient.findById(patientId).populate('doctor');
  if (!patientObj) {
    console.log("getAssignedActivities2 - Paciente no encontrado:", patientId);
    res.status(404);
    throw new Error('Paciente no encontrado');
  }

  console.log("getAssignedActivities2 - Paciente encontrado:", patientObj._id);

  // Verificar autorización
  if (userRole === 'doctor') {
    const doctor = await Doctor.findOne({ user: userId });
    if (!doctor) {
      console.log("getAssignedActivities2 - Doctor no encontrado para el userId:", userId);
      res.status(403);
      throw new Error('No autorizado: No eres un doctor');
    }

    if (!patientObj.doctor.equals(doctor._id)) {
      console.log("getAssignedActivities2 - Doctor no asignado al paciente");
      res.status(403);
      throw new Error('No autorizado: Doctor no está asignado a este paciente');
    }
  }

  if (userRole === 'patient') {
    if (!patientObj.user.equals(userId)) {
      console.log("getAssignedActivities2 - Paciente intentando acceder a otro paciente");
      res.status(403);
      throw new Error('No autorizado: No puedes acceder a las actividades de otro paciente');
    }
  }

  // Buscar el tratamiento y verificar que incluye al paciente
  const treatment = await Treatment.findOne({ _id: treatmentId, patients: patientId })
    .populate('assignedActivities');

  if (!treatment) {
    console.log("getAssignedActivities2 - Treatment not found for patient:", treatmentId, patientId);
    res.status(404);
    throw new Error('Tratamiento no encontrado para este paciente');
  }

  console.log("getAssignedActivities2 - Assigned activities found:", treatment.assignedActivities.length);

  res.status(200).json(treatment.assignedActivities);
});



// @desc    Activar o desactivar un tratamiento
// @route   PATCH /api/treatments/:treatmentId/activate
// @access  Privado/Doctor
const toggleActivateTreatment = asyncHandler(async (req, res) => {
  const { treatmentId } = req.params;
  const { active } = req.body; // true para activar, false para desactivar

  // Buscar el tratamiento
  const treatment = await Treatment.findById(treatmentId).populate('patients');
  if (!treatment) {
    res.status(404);
    throw new Error('Tratamiento no encontrado');
  }

  // Verificar que el usuario autenticado es el doctor que creó el tratamiento
  if (treatment.doctor.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error('No autorizado para modificar este tratamiento');
  }

  // Si se está activando, desactivar otros tratamientos del mismo paciente
  if (active) {
    await Treatment.updateMany(
      { 
        patients: { $in: treatment.patients.map(p => p._id) },
        active: true,
        _id: { $ne: treatmentId }
      },
      { $set: { active: false } }
    );
  }

  // Actualizar el estado activo del tratamiento
  treatment.active = active;
  const updatedTreatment = await treatment.save();

  // Emitir evento para actualizar en tiempo real
  getIO().emit(`treatmentsUpdated:${treatment.doctor}`, { message: 'Tratamiento actualizado', treatment: updatedTreatment });

  res.status(200).json({
    message: `Tratamiento ${active ? 'activado' : 'desactivado'} correctamente`,
    treatment: updatedTreatment,
  });
});

// @desc    Obtener actividades completadas para un tratamiento específico
// @route   GET /api/treatments/:treatmentId/completedActivities
// @access  Privado/Doctor
const getCompletedActivitiesByTreatment = asyncHandler(async (req, res) => {
  const { treatmentId } = req.params;

  console.log(`Received request for completed activities of treatment: ${treatmentId}`);

  // Validar que treatmentId es un ObjectId válido
  if (!mongoose.Types.ObjectId.isValid(treatmentId)) {
    console.log('Invalid treatmentId');
    res.status(400);
    throw new Error('ID de tratamiento inválido');
  }

  // Buscar el tratamiento
  const treatment = await Treatment.findById(treatmentId)
    .populate('completedActivities.activity') // Asegúrate de que esto coincide con tu esquema
    .populate('patients')
    //.populate('Doctor');

  if (!treatment) {
    console.log('Treatment not found');
    res.status(404);
    throw new Error('Tratamiento no encontrado');
  }

  console.log(`Treatment found: ${treatment.treatmentName}`);
  //console.log(`Doctor ID: ${treatment.doctor._id}, User ID: ${req.user._id}`);

  // Verificar que el usuario autenticado es el doctor del tratamiento
  /*if (treatment.doctor.toString() !== req.user._id.toString()) {
    console.log('User not authorized');
    res.status(401);
    throw new Error('No autorizado para ver las actividades de este tratamiento');
  }*/

  console.log(`Returning ${treatment.completedActivities.length} completed activities`);
  res.status(200).json(treatment.completedActivities);
});

// controllers/treatmentController.js



// @desc    Obtener tratamientos para uno o varios pacientes específicos
// @route   POST /api/treatments/patients/treatments
// @access  Privado/Admin (Doctor) - Se ajusta para permitir acceso total a admins o doctores
const getTreatmentsByMultiplePatients = asyncHandler(async (req, res) => {
  const { patientIds } = req.body;

  console.log('Recibiendo patientIds:', patientIds);

  // Validar que patientIds es un arreglo y que cada ID es válido
  if (!Array.isArray(patientIds) || patientIds.some(id => !mongoose.Types.ObjectId.isValid(id))) {
    res.status(400);
    throw new Error('patientIds debe ser un arreglo de IDs de pacientes válidos');
  }

  // Verificar que el usuario autenticado es un doctor o admin
  // 1) Buscar si es doctor
  const doctor = await Doctor.findOne({ user: req.user._id });

  // 2) Verificar si es Admin (según tu lógica, isAdmin en el user)
  const isAdminUser = req.user.isAdmin || false; 

  if (!doctor && !isAdminUser) {
    res.status(401);
    throw new Error('No autorizado: Usuario no es doctor ni admin');
  }

  // Si NO es admin, entonces chequeamos que todos los pacientes estén asignados a este doctor
  if (!isAdminUser && doctor) {
    const patients = await Patient.find({ _id: { $in: patientIds }, doctor: doctor._id });
    if (patients.length !== patientIds.length) {
      // Antes se arrojaba error, ahora lo removemos para permitir acceso total si es Admin.
      console.log('Se ha detectado un paciente no asignado al doctor actual, pero es doctor. Bloqueando acceso.');
      res.status(403);
      throw new Error('No autorizado: Uno o más pacientes no están asignados a este doctor');
    }
  }

  // Buscar tratamientos que incluyan a cualquiera de los pacientes y poblar los campos necesarios
  const treatments = await Treatment.find({ patients: { $in: patientIds } })
    .populate({
      path: 'patients',
      populate: { path: 'user', select: 'name lastName email' },
    })
    .populate({
      path: 'completedActivities.activity',
      select: 'name description',
    })
    .populate({
      path: 'assignedActivities',
      select: 'name description',
    })
    .populate({
      path: 'doctor',
      populate: { path: 'user', select: 'name lastName email' },
    });

  console.log(`Tratamientos para los pacientes ${patientIds}:`, treatments);

  res.status(200).json(treatments);
});

export const updateMedicationTakenToday = async (req, res) => {
  const { treatmentId, medicationId } = req.params;
  console.log(`Received PATCH request: treatmentId=${treatmentId}, medicationId=${medicationId}`);

  try {
    // Buscar el tratamiento por su ID
    const treatment = await Treatment.findById(treatmentId);
    if (!treatment) {
      console.log('Tratamiento no encontrado');
      return res.status(404).json({ message: 'Tratamiento no encontrado' });
    }
    console.log('Tratamiento encontrado:', treatment);

    // Encontrar el medicamento dentro del tratamiento usando el medicationId
    const medication = treatment.medications.id(medicationId);
    if (!medication) {
      console.log('Medicamento no encontrado');
      return res.status(404).json({ message: 'Medicamento no encontrado' });
    }
    console.log('Medicamento encontrado:', medication);

    // Actualizar el campo lastTaken a la fecha actual
    medication.lastTaken = new Date();
    console.log(`Actualizando lastTaken a: ${medication.lastTaken}`);

    // Guardar los cambios en la base de datos
    await treatment.save();
    console.log('Tratamiento actualizado:', treatment);

    return res.status(200).json({
      message: 'Estado de medicamento actualizado correctamente',
      medication,
    });
  } catch (error) {
    console.error('Error al actualizar el medicamento:', error);
    return res.status(500).json({ message: 'Error del servidor' });
  }
};

export { assignActivityToPatient, updateAssignmentResults, 
  getAssignedActivities,unassignActivityFromPatient,getMyAssignedActivities, 
  createTreatment, getMyTreatments, getActivitiesByUser,
  getTreatmentById, updateTreatment, getMyMedications, getDueMedications,
getTreatmentsByPatient,recordActivity,getCompletedActivities, getActiveTreatment,toggleActivateTreatment,
getCompletedActivitiesByTreatment, getTreatmentsByPatient2, getTreatmentsByMultiplePatients};

//takeMedication