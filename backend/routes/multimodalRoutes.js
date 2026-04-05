import express from 'express';
import { analyzeMultimodal } from '../controllers/multimodalController.js';

const router = express.Router();

// Ruta para el análisis multimodal integrado
router.post('/multimodal-integration', analyzeMultimodal);

export default router;
