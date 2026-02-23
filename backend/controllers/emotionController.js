// backend/controllers/emotionController.js

import asyncHandler from "../middleware/asyncHandler.js";
import EmotionData from "../models/emotionModel.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  calculateAllDerivedVariables,
  mapToObject
} from "../utils/emotionAnalysis.js";
import {
  processImageWithCNN,
  extractCNNFeatures,
  processImageWithCNN as evaluateWithCNN // Alias para claridad
} from "../services/emotionProcessingService.js";

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

  // Procesar imagen con CNN (MÉTODO ÚNICO - NO HAY FALLBACK)
  let cnnResult = null;
  let cnnFeatures = [];
  let useCNN = false;

  try {
    // Intentar procesar con CNN (MÉTODO PRINCIPAL Y ÚNICO)
    console.log("🔄 Procesando imagen con CNN...");
    cnnResult = await processImageWithCNN(imagePath, image);

    // Si CNN retorna resultados válidos
    if (cnnResult && cnnResult.dominantEmotion && !cnnResult.error) {
      console.log(`✅ CNN detectó: ${cnnResult.dominantEmotion} (${cnnResult.confidence})`);
      useCNN = true;

      // Extraer características CNN
      try {
        cnnFeatures = await extractCNNFeatures(image);
        console.log(`✅ Características CNN extraídas: ${cnnFeatures.length} features`);
      } catch (error) {
        console.warn("⚠️ Error extrayendo características CNN:", error.message);
      }
    } else {
      // CNN no retornó resultados válidos
      console.error("❌ CNN no retornó resultados válidos");
      throw new Error("CNN no retornó resultados válidos");
    }
  } catch (error) {
    // Error al procesar con CNN - NO HAY FALLBACK
    console.error(`❌ Error procesando con CNN: ${error.message}`);
    console.error("❌ CNN es requerido. No se puede procesar sin CNN.");
    res.status(503);
    throw new Error(`CNN no disponible: ${error.message}. El servidor de modelos debe estar corriendo en http://localhost:5001`);
  }

  // Determinar frame index si es durante el test
  let frameIndex = null;
  if (emotionDataId) {
    const existingData = await EmotionData.findById(emotionDataId);
    if (existingData) {
      frameIndex = existingData.captures.length;
    }
  }

  // Determinar emoción y confianza final (SOLO CNN - NO HAY FALLBACK)
  if (!useCNN || !cnnResult?.dominantEmotion) {
    res.status(503);
    throw new Error("CNN es requerido para procesar emociones. El servidor de modelos debe estar corriendo.");
  }

  const finalEmotion = cnnResult.dominantEmotion;
  const finalConfidence = cnnResult.confidence * 100;

  const captureData = {
    emotion: finalEmotion,
    confidence: finalConfidence,
    timestamp: new Date(timestamp),
    captureType,
    currentModule: currentModule || null,
    imageUrl: `/emotion_captures/${imageFilename}`,
    emotionProbabilities: cnnResult?.emotionProbabilities || new Map(),
    cnnFeatures: cnnFeatures,
    frameIndex: frameIndex,
    // Metadatos sobre qué método se usó (siempre CNN ahora)
    detectionMethod: 'cnn',
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

    // Actualizar metadatos de procesamiento
    emotionData.processingMetadata.totalFrames = emotionData.captures.length;
    emotionData.processingMetadata.processedFrames = emotionData.captures.filter(
      c => c.cnnFeatures && c.cnnFeatures.length > 0
    ).length;

    await emotionData.save();
  } else {
    // Crear nuevo registro de emociones (captura inicial)
    emotionData = await EmotionData.create({
      patient: patientId,
      captures: [captureData],
      testStartTime: new Date(timestamp),
      processingMetadata: {
        totalFrames: 1,
        processedFrames: cnnFeatures.length > 0 ? 1 : 0,
        cnnModel: process.env.CNN_MODEL_NAME || 'emotion_cnn',
        processingDate: new Date(),
      },
    });
  }

  const responseData = {
    success: true,
    emotionDataId: emotionData._id.toString(),
    captureId: emotionData.captures[emotionData.captures.length - 1]._id.toString(),
    message: "Emoción capturada exitosamente",
    detectionMethod: 'cnn', // Siempre CNN
    emotion: finalEmotion,
    confidence: finalConfidence,
  };

  console.log("✅ Retornando respuesta al frontend:", responseData);

  res.status(201).json(responseData);
});

// @desc    Evaluar emoción en tiempo real (Proxy a Python)
// @route   POST /api/emotions/evaluate
// @access  Private
const evaluateEmotion = asyncHandler(async (req, res) => {
  const { image } = req.body;
  if (!image) {
    res.status(400);
    throw new Error("Se requiere una imagen");
  }

  try {
    const result = await processImageWithCNN(null, image);
    res.json({
      emotion: result.dominantEmotion,
      confidence: result.confidence,
      all_emotions: mapToObject(result.emotionProbabilities)
    });
  } catch (error) {
    res.status(503);
    throw new Error(`Servidor de modelos no disponible: ${error.message}`);
  }
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

  // Calcular variables derivadas si no están calculadas
  if (!emotionData.derivedVariables ||
    Object.keys(emotionData.derivedVariables).length === 0 ||
    !emotionData.derivedVariables.emotionalVariabilityIndex) {
    const derivedVars = calculateAllDerivedVariables(emotionData.captures);
    emotionData.derivedVariables = {
      emotionalVariabilityIndex: derivedVars.emotionalVariabilityIndex,
      temporalConsistency: derivedVars.temporalConsistency,
      averageEmotionProbabilities: derivedVars.averageEmotionProbabilities,
      emotionTransitions: derivedVars.emotionTransitions,
      stressIndex: derivedVars.stressIndex,
      anxietyIndex: derivedVars.anxietyIndex,
      temporalVariability: derivedVars.temporalVariability,
    };
    await emotionData.save();
  }

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
      : null,
    // Variables derivadas
    derivedVariables: {
      emotionalVariabilityIndex: emotionData.derivedVariables?.emotionalVariabilityIndex,
      temporalConsistency: emotionData.derivedVariables?.temporalConsistency,
      averageEmotionProbabilities: mapToObject(emotionData.derivedVariables?.averageEmotionProbabilities),
      emotionTransitions: mapToObject(emotionData.derivedVariables?.emotionTransitions),
      stressIndex: emotionData.derivedVariables?.stressIndex,
      anxietyIndex: emotionData.derivedVariables?.anxietyIndex,
      temporalVariability: emotionData.derivedVariables?.temporalVariability,
    },
  });
});

// @desc    Calcular y actualizar variables derivadas
// @route   POST /api/emotions/:emotionDataId/calculate-derived
// @access  Private
const calculateDerivedVariables = asyncHandler(async (req, res) => {
  const { emotionDataId } = req.params;

  const emotionData = await EmotionData.findById(emotionDataId);

  if (!emotionData) {
    res.status(404);
    throw new Error("Registro de emociones no encontrado");
  }

  // Calcular todas las variables derivadas
  const derivedVars = calculateAllDerivedVariables(emotionData.captures);

  // Actualizar en la base de datos
  emotionData.derivedVariables = {
    emotionalVariabilityIndex: derivedVars.emotionalVariabilityIndex,
    temporalConsistency: derivedVars.temporalConsistency,
    averageEmotionProbabilities: derivedVars.averageEmotionProbabilities,
    emotionTransitions: derivedVars.emotionTransitions,
    stressIndex: derivedVars.stressIndex,
    anxietyIndex: derivedVars.anxietyIndex,
    temporalVariability: derivedVars.temporalVariability,
  };
  emotionData.processingMetadata.processingDate = new Date();

  await emotionData.save();

  res.json({
    success: true,
    derivedVariables: {
      emotionalVariabilityIndex: derivedVars.emotionalVariabilityIndex,
      temporalConsistency: derivedVars.temporalConsistency,
      averageEmotionProbabilities: mapToObject(derivedVars.averageEmotionProbabilities),
      emotionTransitions: mapToObject(derivedVars.emotionTransitions),
      stressIndex: derivedVars.stressIndex,
      anxietyIndex: derivedVars.anxietyIndex,
      temporalVariability: derivedVars.temporalVariability,
    },
  });
});

// @desc    Procesar secuencia de frames/video
// @route   POST /api/emotions/process-sequence
// @access  Private
const processEmotionSequence = asyncHandler(async (req, res) => {
  const { patientId, emotionDataId, images, timestamps, currentModule } = req.body;

  if (!patientId || !images || !Array.isArray(images) || images.length === 0) {
    res.status(400);
    throw new Error("Se requiere patientId y array de imágenes");
  }

  const results = [];
  const savedCaptures = [];

  // Procesar cada imagen en la secuencia
  for (let i = 0; i < images.length; i++) {
    const image = images[i];
    const timestamp = timestamps ? new Date(timestamps[i]) : new Date();

    // Guardar imagen
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
    const imageBuffer = Buffer.from(base64Data, "base64");
    const imageFilename = `${patientId}_${Date.now()}_${i}.jpg`;
    const imagePath = path.join(EMOTIONS_DIR, imageFilename);
    fs.writeFileSync(imagePath, imageBuffer);

    // Procesar con CNN
    const cnnResult = await processImageWithCNN(imagePath, image);
    const cnnFeatures = await extractCNNFeatures(image);

    const captureData = {
      emotion: cnnResult?.dominantEmotion || 'neutral',
      confidence: cnnResult?.confidence ? (cnnResult.confidence * 100) : 0,
      timestamp,
      captureType: 'during_test',
      currentModule: currentModule || null,
      imageUrl: `/emotion_captures/${imageFilename}`,
      emotionProbabilities: cnnResult?.emotionProbabilities || new Map(),
      cnnFeatures: cnnFeatures,
      frameIndex: i,
    };

    savedCaptures.push(captureData);
    results.push({
      frameIndex: i,
      emotion: captureData.emotion,
      confidence: captureData.confidence,
      processed: true,
    });
  }

  // Guardar todas las capturas
  let emotionData;
  if (emotionDataId) {
    emotionData = await EmotionData.findById(emotionDataId);
    if (!emotionData) {
      res.status(404);
      throw new Error("Registro de emociones no encontrado");
    }
    emotionData.captures.push(...savedCaptures);
  } else {
    emotionData = await EmotionData.create({
      patient: patientId,
      captures: savedCaptures,
      testStartTime: savedCaptures[0].timestamp,
      processingMetadata: {
        totalFrames: savedCaptures.length,
        processedFrames: savedCaptures.filter(c => c.cnnFeatures.length > 0).length,
        cnnModel: process.env.CNN_MODEL_NAME || 'emotion_cnn',
        processingDate: new Date(),
      },
    });
  }

  // Calcular variables derivadas
  const derivedVars = calculateAllDerivedVariables(emotionData.captures);
  emotionData.derivedVariables = {
    emotionalVariabilityIndex: derivedVars.emotionalVariabilityIndex,
    temporalConsistency: derivedVars.temporalConsistency,
    averageEmotionProbabilities: derivedVars.averageEmotionProbabilities,
    emotionTransitions: derivedVars.emotionTransitions,
    stressIndex: derivedVars.stressIndex,
    anxietyIndex: derivedVars.anxietyIndex,
    temporalVariability: derivedVars.temporalVariability,
  };

  await emotionData.save();

  res.status(201).json({
    success: true,
    emotionDataId: emotionData._id,
    processedFrames: results.length,
    results,
    derivedVariables: {
      emotionalVariabilityIndex: derivedVars.emotionalVariabilityIndex,
      temporalConsistency: derivedVars.temporalConsistency,
      stressIndex: derivedVars.stressIndex,
      anxietyIndex: derivedVars.anxietyIndex,
      temporalVariability: derivedVars.temporalVariability,
    },
  });
});

export {
  captureEmotion,
  getPatientEmotions,
  getEmotionsByMocaTest,
  linkEmotionToMocaTest,
  getEmotionStats,
  calculateDerivedVariables,
  processEmotionSequence,
  evaluateEmotion,
};

