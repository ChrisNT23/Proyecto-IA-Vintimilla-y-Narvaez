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
  },
  {
    timestamps: true,
  }
);

const EmotionData = mongoose.model("EmotionData", emotionDataSchema);

export default EmotionData;

