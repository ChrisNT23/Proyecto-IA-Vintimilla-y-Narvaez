// backend/routes/patientRoutes.js

import express from 'express';
import {
  getPatients,
  getPatientById,
  getMyPatient,
  updatePatient,
  getMedicalHistoryByPatientId,
  updateMyPatient, // Importar el nuevo controlador
} from '../controllers/patientController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Ruta para obtener todos los pacientes (ahora accesible a todos los usuarios autenticados)
router.get('/', protect, getPatients);

// Ruta para obtener un paciente por ID (solo rol admin)
router.get('/:id', protect, admin, getPatientById);

// Ruta para obtener el paciente asociado al usuario autenticado (sin requerir admin)
router.get('/me', protect, getMyPatient);

// Ruta para actualizar un paciente por ID (solo rol admin)
router.put('/:id', protect, admin, updatePatient);

// Ruta para obtener el historial médico de un paciente específico (solo rol admin)
router.get('/:id/medical-history', protect, admin, getMedicalHistoryByPatientId);

// Nueva ruta para que los pacientes actualicen su propio registro
router.patch('/me', protect, updateMyPatient); 

export default router;
