// backend/controllers/patientController.js

import asyncHandler from 'express-async-handler';
import Patient from '../models/patientModel.js';

/// Obtener todos los pacientes
const getPatients = asyncHandler(async (req, res) => {
  let patients;

  if (req.user.isAdmin) {
    // Si el usuario es administrador, devuelve todos los pacientes con información completa
    patients = await Patient.find({})
      .populate('user', 'name lastName cardId email phoneNumber')
      .populate('doctor', 'user');
  } else {
    // Si el usuario no es administrador, devuelve solo su propio registro
    patients = await Patient.find({ user: req.user._id })
      .populate('user', 'name lastName cardId email phoneNumber')
      .populate('doctor', 'user');
  }

  // Asegurar que todos los pacientes tienen el campo mocaAssigned definido
  const patientsWithMoca = patients.map(patient => ({
    ...patient.toObject(),
    mocaAssigned: patient.mocaAssigned !== undefined ? patient.mocaAssigned : false,
  }));

  res.json(patientsWithMoca);
});

// Obtener un paciente por ID
const getPatientById = asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.params.id)
    .populate('user', 'name lastName cardId email phoneNumber')
    .populate('doctor', 'user');

  if (patient) {
    const patientObj = patient.toObject();
    patientObj.mocaAssigned = patient.mocaAssigned !== undefined ? patient.mocaAssigned : false;
    res.json(patientObj);
  } else {
    res.status(404);
    throw new Error('Paciente no encontrado');
  }
});

// Obtener el paciente asociado al usuario autenticado (sin requerir rol admin)
const getMyPatient = asyncHandler(async (req, res) => {
  // Asumiendo que el modelo de Patient tiene un campo "user" que referencia al ID de User
  const patient = await Patient.findOne({ user: req.user._id })
    .populate('user', 'name lastName cardId email phoneNumber')
    .populate('doctor', 'user');

  if (patient) {
    const patientObj = patient.toObject();
    patientObj.mocaAssigned = patient.mocaAssigned !== undefined ? patient.mocaAssigned : false;
    res.json(patientObj);
  } else {
    res.status(404);
    throw new Error('No se encontró un paciente asociado a este usuario');
  }
});

// Actualizar un paciente
const updatePatient = asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.params.id);

  if (patient) {
    patient.school = req.body.school ?? patient.school;
    patient.birthdate = req.body.birthdate ?? patient.birthdate;
    patient.gender = req.body.gender ?? patient.gender;
    patient.educationalLevel = req.body.educationalLevel ?? patient.educationalLevel;
    patient.familyRepresentative = req.body.familyRepresentative ?? patient.familyRepresentative;
    patient.address = req.body.address ?? patient.address;
    patient.maritalStatus = req.body.maritalStatus ?? patient.maritalStatus;
    patient.profession = req.body.profession ?? patient.profession;
    patient.cognitiveStage = req.body.cognitiveStage ?? patient.cognitiveStage;
    patient.referredTo = req.body.referredTo ?? patient.referredTo;
    patient.doctor = req.body.doctor ?? patient.doctor;

    // Actualizar la asignación de la prueba MOCA
    if (typeof req.body.mocaAssigned === 'boolean') {
      patient.mocaAssigned = req.body.mocaAssigned;
    }

    const updatedPatient = await patient.save();

    res.json({
      _id: updatedPatient._id,
      school: updatedPatient.school,
      birthdate: updatedPatient.birthdate,
      gender: updatedPatient.gender,
      educationalLevel: updatedPatient.educationalLevel,
      familyRepresentative: updatedPatient.familyRepresentative,
      address: updatedPatient.address,
      maritalStatus: updatedPatient.maritalStatus,
      profession: updatedPatient.profession,
      cognitiveStage: updatedPatient.cognitiveStage,
      referredTo: updatedPatient.referredTo,
      doctor: updatedPatient.doctor,
      mocaAssigned: updatedPatient.mocaAssigned,
    });
  } else {
    res.status(404);
    throw new Error('Paciente no encontrado');
  }
});

// Obtener historial médico por ID de paciente
const getMedicalHistoryByPatientId = asyncHandler(async (req, res) => {
  const patientId = req.params.id;
  const patient = await Patient.findById(patientId).populate('user', 'name lastName email phoneNumber cardId');

  if (patient) {
    const patientObj = patient.toObject();
    patientObj.mocaAssigned = patient.mocaAssigned !== undefined ? patient.mocaAssigned : false;
    res.json(patientObj);
  } else {
    res.status(404);
    throw new Error('Paciente no encontrado');
  }
});

const updateMyPatient = asyncHandler(async (req, res) => {
  const patient = await Patient.findOne({ user: req.user._id });

  if (!patient) {
    res.status(404);
    throw new Error('Paciente no encontrado para este usuario');
  }

  const { mocaAssigned } = req.body;

  if (typeof mocaAssigned !== 'boolean') {
    res.status(400);
    throw new Error('Campo mocaAssigned inválido');
  }

  patient.mocaAssigned = mocaAssigned;

  const updatedPatient = await patient.save();
  res.json(updatedPatient);
});

export {
  getPatients,
  getPatientById,
  getMyPatient,
  updatePatient,
  getMedicalHistoryByPatientId,
  updateMyPatient,
};
