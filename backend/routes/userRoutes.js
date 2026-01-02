// backend/routes/userRoutes.js
import express from 'express';
const router = express.Router();
import {
  authUser,
  registerUser,
  logoutUser,
  getUserProfile,
  updateUserProfile,
  getUsers,
  deleteUser,
  getUserByID,
  updateUser,
  getFaceData,
  searchUsers,
  disableUser,
  enableUser
} from '../controllers/userController.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import { saveUserMood, getPatientMoods, getMoodsByDate } from '../controllers/moodController.js'; // Importar getMoodsByDate

// Rutas para manejar estados de ánimo
router.post('/mood', protect, saveUserMood);
router.route('/:patientId/moods').get(protect, admin, getPatientMoods);
router.route('/moods').get(protect, admin, getMoodsByDate); // Nueva ruta para obtener moods por fecha

// Otras rutas de usuarios
router.route('/')
  .post(registerUser)
  .get(protect, admin, getUsers);

router.post('/logout', logoutUser);
router.post('/auth', authUser);
router.post('/facedata', getFaceData);

router.route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

router.get('/search', protect, admin, searchUsers);

router.route('/:id')
  .delete(protect, admin, disableUser)
  .get(protect, admin, getUserByID)
  .put(protect, admin, updateUser);

router.route('/:id/enable')
  .put(protect, admin, enableUser);

export default router;
