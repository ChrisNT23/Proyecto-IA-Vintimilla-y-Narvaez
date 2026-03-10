import asyncHandler from "express-async-handler";
import MocaSelf from "../models/mocaSelfModel.js";
import Patient from "../models/patientModel.js";
import EmotionData from "../models/emotionModel.js";
import { calculateAllDerivedVariables } from "../utils/emotionAnalysis.js";

// Crear un nuevo registro MoCA Self
// Recibe en el body: patientId, patientName (opcional), modulesData, totalScore, emotionDataId (opcional)
export const createMocaSelf = asyncHandler(async (req, res) => {
  const { patientId, patientName, modulesData, totalScore, emotionDataId } = req.body;

  const patient = await Patient.findById(patientId);
  if (!patient) {
    res.status(404);
    throw new Error("No se encontró el paciente con ese ID");
  }

  const newMocaSelf = await MocaSelf.create({
    patient: patientId,
    patientName: patientName || patient.user?.name || "Paciente Desconocido",
    modulesData: modulesData || {},
    totalScore: totalScore || 0,
    testDate: new Date(),
    emotionData: emotionDataId || null,
  });

  // Si viene un emotionDataId, vincular el test MoCA y calcular variables derivadas
  if (emotionDataId) {
    try {
      const emotionDoc = await EmotionData.findById(emotionDataId);
      if (emotionDoc) {
        // Vincular MoCA y cerrar el período de captura
        emotionDoc.mocaTest = newMocaSelf._id;
        emotionDoc.testEndTime = new Date();

        // Calcular variables derivadas automáticamente
        if (emotionDoc.captures.length > 0) {
          const derivedVars = calculateAllDerivedVariables(emotionDoc.captures);
          emotionDoc.derivedVariables = {
            emotionalVariabilityIndex: derivedVars.emotionalVariabilityIndex,
            temporalConsistency: derivedVars.temporalConsistency,
            averageEmotionProbabilities: derivedVars.averageEmotionProbabilities,
            emotionTransitions: derivedVars.emotionTransitions,
            stressIndex: derivedVars.stressIndex,
            anxietyIndex: derivedVars.anxietyIndex,
            temporalVariability: derivedVars.temporalVariability,
          };
          emotionDoc.processingMetadata.processingDate = new Date();
        }

        await emotionDoc.save();
        console.log(`✅ EmotionData ${emotionDataId} vinculado al MoCA ${newMocaSelf._id} y variables derivadas calculadas.`);
      }
    } catch (err) {
      // No fallar el guardado del MoCA si la vinculación de emociones falla
      console.error(`⚠️ Error al vincular EmotionData al MoCA: ${err.message}`);
    }
  }

  res.status(201).json(newMocaSelf);
});

// Obtener todos los registros MoCA Self (opcionalmente filtrando por patientId)
export const getAllMocaSelfs = asyncHandler(async (req, res) => {
  const { patientId } = req.query;
  let query = {};

  if (patientId) {
    query.patient = patientId;
  }

  const mocaSelfRecords = await MocaSelf.find(query)
    .populate("patient", "user")
    .populate("emotionData", "moduleSummaries derivedVariables captures")
    .sort({ createdAt: -1 });

  res.status(200).json(mocaSelfRecords);
});

// Obtener un registro MoCA Self por su ID
export const getMocaSelfById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const mocaSelf = await MocaSelf.findById(id)
    .populate("patient", "user")
    .populate("emotionData", "moduleSummaries derivedVariables captures");

  if (!mocaSelf) {
    res.status(404);
    throw new Error("No se encontró el registro MoCA Self con ese ID");
  }

  res.status(200).json(mocaSelf);
});

// Actualizar un registro MoCA Self por su ID
export const updateMocaSelf = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { modulesData, totalScore } = req.body;

  const mocaSelf = await MocaSelf.findById(id);
  if (!mocaSelf) {
    res.status(404);
    throw new Error("No se encontró el registro MoCA Self con ese ID");
  }

  if (modulesData) {
    mocaSelf.modulesData = modulesData;
  }
  if (typeof totalScore === "number") {
    mocaSelf.totalScore = totalScore;
  }

  const updatedMocaSelf = await mocaSelf.save();
  res.status(200).json(updatedMocaSelf);
});

// Eliminar un registro MoCA Self por su ID
export const deleteMocaSelf = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const mocaSelf = await MocaSelf.findById(id);
  if (!mocaSelf) {
    res.status(404);
    throw new Error("No se encontró el registro MoCA Self para eliminar");
  }

  await mocaSelf.remove();
  res.json({ message: "Registro MoCA Self eliminado exitosamente" });
});
