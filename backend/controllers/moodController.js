// backend/controllers/moodController.js
import asyncHandler from 'express-async-handler';
import Mood from '../models/moodModel.js';
import Patient from '../models/patientModel.js';

// Función para guardar el estado de ánimo del usuario
const saveUserMood = asyncHandler(async (req, res) => {
  const { mood } = req.body;

  if (!mood) {
    res.status(400);
    throw new Error('Por favor, proporciona un estado de ánimo válido');
  }

  const patient = await Patient.findOne({ user: req.user._id });
  if (!patient) {
    res.status(404);
    throw new Error('Paciente no encontrado');
  }

  const newMood = await Mood.create({
    patient: patient._id,
    mood,
  });

  res.status(201).json({
    message: 'Estado de ánimo guardado correctamente',
    mood: newMood,
  });
});

// Función para obtener los estados de ánimo de un paciente específico
const getPatientMoods = asyncHandler(async (req, res) => {
  const { patientId } = req.params;
  const moods = await Mood.find({ patient: patientId }).sort({ date: 1 });
  res.json(moods);
});

// **Nueva función para obtener los estados de ánimo por fecha**
const getMoodsByDate = asyncHandler(async (req, res) => {
  const { date } = req.query;

  if (!date) {
    res.status(400);
    throw new Error('Fecha requerida');
  }

  // Parsear la fecha y obtener el inicio y fin del día
  const startDate = new Date(date);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(date);
  endDate.setHours(23, 59, 59, 999);

  // Buscar los estados de ánimo dentro del rango de fecha
  const moods = await Mood.find({
    date: { $gte: startDate, $lte: endDate },
  }).populate('patient');

  res.json(moods);
});

export { saveUserMood, getPatientMoods, getMoodsByDate };
