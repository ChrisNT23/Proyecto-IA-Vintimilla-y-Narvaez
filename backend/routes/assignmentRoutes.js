// src/routes/assignmentRoutes.js

import express from 'express';
import {
  assignActivityToPatient,
  updateAssignmentResults,
  getAssignedActivities,
  unassignActivityFromPatient,
  getMyAssignedActivities,
} from '../controllers/treatmentController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Ruta para asignar una actividad a un paciente
router.route('/').post(protect, admin, assignActivityToPatient);

// Ruta para actualizar resultados de una asignación
router.route('/:assignmentId/results').put(protect, admin, updateAssignmentResults);

// Ruta para desasignar una actividad de un paciente
router.route('/:assignmentId').delete(protect, admin, unassignActivityFromPatient);


// Ruta para obtener actividades asignadas al paciente autenticado
router.route('/myactivities').get(protect, getMyAssignedActivities);

export default router;
