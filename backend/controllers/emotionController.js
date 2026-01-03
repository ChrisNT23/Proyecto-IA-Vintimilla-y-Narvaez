// backend/controllers/emotionController.js

import asyncHandler from "../middleware/asyncHandler.js";
import EmotionData from "../models/emotionModel.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directorio para guardar las imágenes de emociones
const EMOTIONS_DIR = path.join(__dirname, "..", "emotion_captures");
if (!fs.existsSync(EMOTIONS_DIR)) {
  fs.mkdirSync(EMOTIONS_DIR, { recursive: true });
}

// @desc    Capturar foto con emoción
// @route   POST /api/emotions/capture
// @access  Private
const captureEmotion = asyncHandler(async (req, res) => {
  const { patientId, emotionDataId, image, emotion, confidence, timestamp, captureType, currentModule } = req.body;

  if (!patientId || !image || !emotion || !confidence || !timestamp || !captureType) {
    res.status(400);
    throw new Error("Faltan datos requeridos");
  }

  // Decodificar y guardar la imagen
  const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
  const imageBuffer = Buffer.from(base64Data, "base64");
  const imageFilename = `${patientId}_${Date.now()}.jpg`;
  const imagePath = path.join(EMOTIONS_DIR, imageFilename);

  fs.writeFileSync(imagePath, imageBuffer);

  const captureData = {
    emotion,
    confidence: parseFloat(confidence),
    timestamp: new Date(timestamp),
    captureType,
    currentModule: currentModule || null,
    imageUrl: `/emotion_captures/${imageFilename}`,
  };

  let emotionData;

  if (emotionDataId) {
    // Agregar captura a un registro existente
    emotionData = await EmotionData.findById(emotionDataId);
    if (!emotionData) {
      res.status(404);
      throw new Error("Registro de emociones no encontrado");
    }
    emotionData.captures.push(captureData);
    await emotionData.save();
  } else {
    // Crear nuevo registro de emociones (captura inicial)
    emotionData = await EmotionData.create({
      patient: patientId,
      captures: [captureData],
      testStartTime: new Date(timestamp),
    });
  }

  res.status(201).json({
    success: true,
    emotionDataId: emotionData._id,
    captureId: emotionData.captures[emotionData.captures.length - 1]._id,
    message: "Emoción capturada exitosamente",
  });
});

// @desc    Obtener datos de emociones de un paciente
// @route   GET /api/emotions/patient/:patientId
// @access  Private
const getPatientEmotions = asyncHandler(async (req, res) => {
  const { patientId } = req.params;

  const emotionData = await EmotionData.find({ patient: patientId })
    .populate("patient", "name")
    .populate("mocaTest", "totalScore date")
    .sort({ createdAt: -1 });

  res.json(emotionData);
});

// @desc    Obtener datos de emociones por test MoCA
// @route   GET /api/emotions/moca/:mocaId
// @access  Private
const getEmotionsByMocaTest = asyncHandler(async (req, res) => {
  const { mocaId } = req.params;

  const emotionData = await EmotionData.findOne({ mocaTest: mocaId })
    .populate("patient", "name")
    .populate("mocaTest", "totalScore date");

  if (!emotionData) {
    res.status(404);
    throw new Error("No se encontraron datos de emociones para este test MoCA");
  }

  res.json(emotionData);
});

// @desc    Actualizar el test MoCA asociado a los datos de emociones
// @route   PUT /api/emotions/:emotionDataId/moca
// @access  Private
const linkEmotionToMocaTest = asyncHandler(async (req, res) => {
  const { emotionDataId } = req.params;
  const { mocaTestId } = req.body;

  if (!mocaTestId) {
    res.status(400);
    throw new Error("Se requiere el ID del test MoCA");
  }

  const emotionData = await EmotionData.findById(emotionDataId);

  if (!emotionData) {
    res.status(404);
    throw new Error("Registro de emociones no encontrado");
  }

  emotionData.mocaTest = mocaTestId;
  emotionData.testEndTime = new Date();
  await emotionData.save();

  res.json({
    success: true,
    message: "Test MoCA vinculado exitosamente",
  });
});

// @desc    Obtener estadísticas de emociones durante un test
// @route   GET /api/emotions/:emotionDataId/stats
// @access  Private
const getEmotionStats = asyncHandler(async (req, res) => {
  const { emotionDataId } = req.params;

  const emotionData = await EmotionData.findById(emotionDataId);

  if (!emotionData) {
    res.status(404);
    throw new Error("Registro de emociones no encontrado");
  }

  // Calcular estadísticas
  const emotionCounts = {};
  const emotionsByModule = {};
  let totalConfidence = 0;

  emotionData.captures.forEach((capture) => {
    // Contar emociones
    emotionCounts[capture.emotion] = (emotionCounts[capture.emotion] || 0) + 1;

    // Agrupar por módulo
    if (capture.currentModule) {
      if (!emotionsByModule[capture.currentModule]) {
        emotionsByModule[capture.currentModule] = [];
      }
      emotionsByModule[capture.currentModule].push({
        emotion: capture.emotion,
        confidence: capture.confidence,
        timestamp: capture.timestamp,
      });
    }

    totalConfidence += capture.confidence;
  });

  const avgConfidence = emotionData.captures.length > 0 
    ? (totalConfidence / emotionData.captures.length).toFixed(2)
    : 0;

  // Emoción dominante
  const dominantEmotion = Object.entries(emotionCounts).reduce((a, b) => 
    emotionCounts[a[0]] > emotionCounts[b[0]] ? a : b
  );

  res.json({
    totalCaptures: emotionData.captures.length,
    emotionCounts,
    dominantEmotion: {
      emotion: dominantEmotion[0],
      count: dominantEmotion[1],
    },
    avgConfidence: parseFloat(avgConfidence),
    emotionsByModule,
    testDuration: emotionData.testEndTime 
      ? Math.round((new Date(emotionData.testEndTime) - new Date(emotionData.testStartTime)) / 1000 / 60)
      : null, // en minutos
  });
});

export {
  captureEmotion,
  getPatientEmotions,
  getEmotionsByMocaTest,
  linkEmotionToMocaTest,
  getEmotionStats,
};

