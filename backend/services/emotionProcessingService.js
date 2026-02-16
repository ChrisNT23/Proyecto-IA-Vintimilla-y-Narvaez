/**
 * Servicio de procesamiento de características emocionales usando CNN
 * Extrae características de imágenes y calcula probabilidades de emociones
 */

import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// URL del servidor Python de modelos
const PYTHON_SERVER_URL = process.env.PYTHON_SERVER_URL || 'http://localhost:5001';

/**
 * Procesa una imagen usando CNN para extraer características y probabilidades
 * @param {String} imagePath - Ruta a la imagen
 * @param {String} imageBase64 - Imagen en base64 (alternativa a imagePath)
 * @returns {Object} Objeto con características y probabilidades
 */
export const processImageWithCNN = async (imagePath = null, imageBase64 = null) => {
  try {
    let imageData = imageBase64;

    // Si no hay base64, leer la imagen del path
    if (!imageData && imagePath) {
      const imageBuffer = fs.readFileSync(imagePath);
      imageData = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;
    }

    if (!imageData) {
      throw new Error('Se requiere imagePath o imageBase64');
    }

    // Llamar al servidor Python para procesamiento con CNN
    const response = await axios.post(
      `${PYTHON_SERVER_URL}/api/evaluate-emotion`,
      { image: imageData },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000,
      }
    );

    if (response.data && response.data.all_emotions) {
      return {
        emotionProbabilities: new Map(Object.entries(response.data.all_emotions)),
        dominantEmotion: response.data.emotion,
        confidence: response.data.confidence,
        cnnFeatures: response.data.cnn_features || [], // Si el servidor las devuelve
      };
    }

    // Fallback si el servidor no está disponible
    return {
      emotionProbabilities: new Map(),
      dominantEmotion: null,
      confidence: 0,
      cnnFeatures: [],
    };
  } catch (error) {
    console.error('Error procesando imagen con CNN:', error.message);
    console.error('Detalles del error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      code: error.code
    });
    
    // Lanzar el error para que el controlador sepa que CNN falló
    throw new Error(`CNN no disponible: ${error.message}`);
  }
};

/**
 * Procesa múltiples imágenes (secuencia de frames)
 * @param {Array} imagePaths - Array de rutas a imágenes
 * @param {Array} imageBase64Array - Array de imágenes en base64
 * @returns {Array} Array de resultados de procesamiento
 */
export const processImageSequence = async (imagePaths = [], imageBase64Array = []) => {
  const results = [];

  // Procesar cada imagen
  const imagesToProcess = imageBase64Array.length > 0 
    ? imageBase64Array 
    : imagePaths;

  for (let i = 0; i < imagesToProcess.length; i++) {
    try {
      const imagePath = imagePaths[i] || null;
      const imageBase64 = imageBase64Array[i] || null;

      const result = await processImageWithCNN(imagePath, imageBase64);
      results.push({
        frameIndex: i,
        ...result,
      });
    } catch (error) {
      console.error(`Error procesando frame ${i}:`, error.message);
      results.push({
        frameIndex: i,
        error: error.message,
      });
    }
  }

  return results;
};

/**
 * Extrae características usando el modelo CNN del servidor Python
 * @param {String} imageBase64 - Imagen en base64
 * @returns {Array} Vector de características
 */
export const extractCNNFeatures = async (imageBase64) => {
  try {
    const response = await axios.post(
      `${PYTHON_SERVER_URL}/api/extract-features`,
      { image: imageBase64 },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000,
      }
    );

    return response.data.features || [];
  } catch (error) {
    console.error('Error extrayendo características CNN:', error.message);
    return [];
  }
};

