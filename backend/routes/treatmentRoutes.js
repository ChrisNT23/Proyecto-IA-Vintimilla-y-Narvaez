import express from 'express';
import {
  createTreatment,
  getMyTreatments,
  getTreatmentById,
  updateTreatment,
  getMyMedications,
  getDueMedications,
  getTreatmentsByPatient,
  recordActivity,
  getCompletedActivities,
  getAssignedActivities,
  getActivitiesByUser,
  getActiveTreatment,
  toggleActivateTreatment,
  getCompletedActivitiesByTreatment,
  getTreatmentsByPatient2,
  getTreatmentsByMultiplePatients,
  updateMedicationTakenToday,
  getAssignedActivities2,
  getActiveTreatment2
} from '../controllers/treatmentController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Ruta para obtener medicamentos del paciente
router.route('/my-medications').get(protect, getMyMedications);

// Ruta para obtener tratamientos del médico
router.route('/mytreatments').get(protect, getMyTreatments);

// Ruta para crear un nuevo tratamiento
router.route('/create').post(protect, admin, createTreatment);

// Ruta para obtener tratamientos por múltiples pacientes
router.post('/patients/treatments', protect, getTreatmentsByMultiplePatients);

// Ruta para obtener tratamientos de un paciente específico (admin)
router.route('/patient/:patientId/treatments').get(protect, admin, getTreatmentsByPatient);
router.get('/patient/:patientId/treatments2', protect, getTreatmentsByPatient2);

// Ruta para manejar actividades de un tratamiento específico
router.route('/:treatmentId/activities')
  .post(protect, recordActivity) // Solo pacientes pueden registrar actividades
  .get(protect, getCompletedActivities); // Solo pacientes pueden ver sus actividades

// Ruta para obtener actividades completadas por tratamiento
router.route('/:treatmentId/completedActivities').get(protect, getCompletedActivitiesByTreatment);

// Ruta para obtener actividades asignadas a un tratamiento específico
router.route('/:treatmentId/assignedActivities').get(protect, getAssignedActivities);
router.route('/:treatmentId/assignedActivities2').get(protect, getAssignedActivities2);

// Ruta para obtener tratamiento activo de un paciente
router.route('/:patientId/active-treatment2').get(protect, getActiveTreatment2);

// Ruta para obtener actividades asignadas con treatmentId y patientId
router.get('/:treatmentId/assignedActivities/:patientId', protect, getAssignedActivities2);
router.route('/:treatmentId/assignedActivities2/:patientId').get(protect, getAssignedActivities2);

// Ruta para obtener todas las actividades de un usuario
router.route('/activities').get(protect, getActivitiesByUser);

// Ruta para activar/desactivar un tratamiento
router.route('/:treatmentId/activate').patch(protect, toggleActivateTreatment);

// Ruta para obtener tratamiento activo de un usuario
router.route('/:userId/active-treatment').get(protect, getActiveTreatment);

// se restaura el parámetro :treatmentId en la ruta de medicamentos pendientes
router.route('/:treatmentId/medications/due').get(protect, getDueMedications);

// Ruta para marcar medicamento como tomado
router.patch('/:treatmentId/medications/:medicationId/take', updateMedicationTakenToday);

// Ruta para obtener y actualizar detalles de un tratamiento específico
router
  .route('/:treatmentId')
  .get(protect, getTreatmentById)
  .put(protect, admin, updateTreatment);

export default router;
