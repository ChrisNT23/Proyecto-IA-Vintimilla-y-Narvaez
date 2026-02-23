// backend/routes/emotionRoutes.js

import express from "express";
import {
  captureEmotion,
  getPatientEmotions,
  getEmotionsByMocaTest,
  linkEmotionToMocaTest,
  getEmotionStats,
  calculateDerivedVariables,
  processEmotionSequence,
  evaluateEmotion,
} from "../controllers/emotionController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Capturar emoción (puede ser inicial o durante el test)
router.post("/capture", protect, captureEmotion);

// Procesar secuencia de frames/video
router.post("/process-sequence", protect, processEmotionSequence);
router.post("/evaluate", protect, evaluateEmotion);

// Obtener emociones de un paciente
router.get("/patient/:patientId", protect, getPatientEmotions);

// Obtener emociones por test MoCA
router.get("/moca/:mocaId", protect, getEmotionsByMocaTest);

// Vincular datos de emociones con un test MoCA
router.put("/:emotionDataId/moca", protect, linkEmotionToMocaTest);

// Calcular variables derivadas
router.post("/:emotionDataId/calculate-derived", protect, calculateDerivedVariables);

// Obtener estadísticas de emociones (incluye variables derivadas)
router.get("/:emotionDataId/stats", protect, getEmotionStats);

export default router;

