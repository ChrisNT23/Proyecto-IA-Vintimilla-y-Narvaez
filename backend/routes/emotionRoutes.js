// backend/routes/emotionRoutes.js

import express from "express";
import {
  captureEmotion,
  getPatientEmotions,
  getEmotionsByMocaTest,
  linkEmotionToMocaTest,
  getEmotionStats,
} from "../controllers/emotionController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Capturar emoción (puede ser inicial o durante el test)
router.post("/capture", protect, captureEmotion);

// Obtener emociones de un paciente
router.get("/patient/:patientId", protect, getPatientEmotions);

// Obtener emociones por test MoCA
router.get("/moca/:mocaId", protect, getEmotionsByMocaTest);

// Vincular datos de emociones con un test MoCA
router.put("/:emotionDataId/moca", protect, linkEmotionToMocaTest);

// Obtener estadísticas de emociones
router.get("/:emotionDataId/stats", protect, getEmotionStats);

export default router;

