// backend/controllers/doctorController.js

import asyncHandler from "express-async-handler";
import Doctor from "../models/doctorModel.js";
import Patient from "../models/patientModel.js";

// @desc    Obtener todos los doctores
// @route   GET /api/doctors
// @access  Privado/Admin
const getDoctors = asyncHandler(async (req, res) => {
  const doctors = await Doctor.find({}).populate("user", "name email");
  res.json(doctors);
});

// @desc    Obtener doctores con sus pacientes asignados
// @route   GET /api/doctors/withPatients
// @access  Privado/Admin o Doctor loggeado
const getDoctorWithPatients = asyncHandler(async (req, res) => {
  console.log("ID de usuario autenticado (doctor):", req.user._id);

  // Encuentra al doctor basado en el usuario logueado
  const doctor = await Doctor.findOne({ user: req.user._id });

  if (doctor) {
    console.log("Doctor encontrado:", doctor);

    // Encuentra todos los pacientes que tienen asignado este doctor, excluyendo al doctor mismo
    const patients = await Patient.find({
      doctor: doctor._id,
      user: { $ne: req.user._id }, // Excluir al doctor logueado
    }).populate("user", "name lastName email phoneNumber cardId isActive");

    console.log("Pacientes encontrados:", patients);

    // Mapea los pacientes para incluir solo '_id' y 'user'
    const patientsWithId = patients.map((patient) => ({
      _id: patient._id,
      user: patient.user,
    }));

    res.json(patientsWithId); // Enviamos la lista de pacientes con 'user' y '_id'
  } else {
    console.log("Doctor no encontrado o sin pacientes asignados");
    res.status(404).json({ message: "Doctor no encontrado o no tiene pacientes asignados" });
  }
});

// @desc    Añadir un paciente a un doctor
// @route   POST /api/doctors/:doctorId/addPatient
// @access  Privado/Admin
const addPatientToDoctor = asyncHandler(async (req, res) => {
  const { doctorId } = req.params;
  const { userId } = req.body; // Cambiar a userId en lugar de patientId

  // Buscar el paciente por userId
  const patient = await Patient.findOne({ user: userId });
  if (!patient) {
    res.status(404);
    throw new Error("No existe un paciente vinculado a este usuario.");
  }

  // Verificar si el paciente ya tiene un doctor asignado diferente
  if (patient.doctor && patient.doctor.toString() !== doctorId) {
    // Remover al paciente del doctor anterior
    const previousDoctor = await Doctor.findById(patient.doctor);
    if (previousDoctor) {
      previousDoctor.patients = previousDoctor.patients.filter(
        (p) => p.toString() !== patient._id.toString()
      );
      await previousDoctor.save();
    }
  }

  // Asignar el nuevo doctor al paciente
  patient.doctor = doctorId;
  await patient.save();

  // Añadir el paciente al array de pacientes del nuevo doctor si no está ya
  const newDoctor = await Doctor.findById(doctorId);
  if (!newDoctor) {
    res.status(404);
    throw new Error("Doctor no encontrado");
  }

  if (!newDoctor.patients.includes(patient._id)) {
    newDoctor.patients.push(patient._id);
    await newDoctor.save();
  }

  res.status(200).json({ message: "Paciente reasignado al doctor correctamente" });
});

export { getDoctors, getDoctorWithPatients, addPatientToDoctor };
