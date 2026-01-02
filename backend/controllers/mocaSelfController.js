import asyncHandler from "express-async-handler";
import MocaSelf from "../models/mocaSelfModel.js";
import Patient from "../models/patientModel.js";

// Crear un nuevo registro MoCA Self
// Recibe en el body: patientId, patientName (opcional), modulesData (objeto con puntajes y respuestas), totalScore
export const createMocaSelf = asyncHandler(async (req, res) => {
  const { patientId, patientName, modulesData, totalScore } = req.body;

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
  });

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
    .sort({ createdAt: -1 });

  res.status(200).json(mocaSelfRecords);
});

// Obtener un registro MoCA Self por su ID
export const getMocaSelfById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const mocaSelf = await MocaSelf.findById(id).populate("patient", "user");
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
