// backend/models/emotionModel.js

import mongoose from "mongoose";

const emotionCaptureSchema = mongoose.Schema(
  {
    emotion: {
      type: String,
      required: true,
    },
    confidence: {
      type: Number,
      required: true,
    },
    timestamp: {
      type: Date,
      required: true,
    },
    captureType: {
      type: String,
      enum: ['initial', 'during_test'],
      required: true,
    },
    currentModule: {
      type: String,
      default: null,
    },
    imageUrl: {
      type: String,
      required: true,
    },
    // Nuevos campos para características extraídas
    emotionProbabilities: {
      type: Map,
      of: Number,
      default: {},
    },
    cnnFeatures: {
      type: [Number], // Vector de características extraídas por CNN
      default: [],
    },
    frameIndex: {
      type: Number, // Índice del frame en la secuencia
      default: null,
    },
    detectionMethod: {
      type: String,
      enum: ['cnn', 'face-api.js', 'hybrid'],
      default: 'face-api.js',
    },
  },
  {
    _id: true,
  }
);

const emotionDataSchema = mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Patient",
    },
    mocaTest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MocaSelf",
      default: null,
    },
    captures: [emotionCaptureSchema],
    testStartTime: {
      type: Date,
      default: Date.now,
    },
    testEndTime: {
      type: Date,
      default: null,
    },
    // Variables derivadas calculadas
    derivedVariables: {
      // Índices de variabilidad emocional
      emotionalVariabilityIndex: {
        type: Number,
        default: null,
      },
      // Consistencia temporal de expresiones
      temporalConsistency: {
        type: Number,
        default: null,
      },
      // Probabilidades promedio por emoción
      averageEmotionProbabilities: {
        type: Map,
        of: Number,
        default: {},
      },
      // Transiciones emocionales
      emotionTransitions: {
        type: Map,
        of: Number,
        default: {},
      },
      // Índices de estrés y ansiedad
      stressIndex: {
        type: Number,
        default: null,
      },
      anxietyIndex: {
        type: Number,
        default: null,
      },
      // Variabilidad temporal (cambios por segundo)
      temporalVariability: {
        type: Number,
        default: null,
      },
    },
    // Metadatos del procesamiento
    processingMetadata: {
      totalFrames: {
        type: Number,
        default: 0,
      },
      processedFrames: {
        type: Number,
        default: 0,
      },
      cnnModel: {
        type: String,
        default: null, // Nombre del modelo CNN usado
      },
      processingDate: {
        type: Date,
        default: null,
      },
    },
  },
  {
    timestamps: true,
  }
);

const EmotionData = mongoose.model("EmotionData", emotionDataSchema);

export default EmotionData;
