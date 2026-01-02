// backend/controllers/userController.js

import asyncHandler from "../middleware/asyncHandler.js";
import User from "../models/userModel.js";
import generateToken from "../utils/generateToken.js";
import Doctor from "../models/doctorModel.js";
import Patient from "../models/patientModel.js";
import * as faceapi from "face-api.js";

// @desc    Auth user and get token
// @route   POST /api/users/login o /api/users/auth
// @access  Public
const authUser = asyncHandler(async (req, res) => {
  const { email, password, faceData } = req.body;

  // Validación de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.status(400);
    throw new Error("Correo electrónico no válido");
  }

  const user = await User.findOne({ email });

  if (!user) {
    res.status(401);
    throw new Error("Usuario no encontrado");
  }

  if (!user.isActive) {
    res.status(403); // Forbidden
    throw new Error("Usuario inhabilitado. No se puede iniciar sesión.");
  }

  if (faceData) {
    // Autenticación con reconocimiento facial
    if (!user.faceData || user.faceData.length === 0) {
      res.status(401);
      throw new Error("El usuario no tiene datos faciales registrados");
    }

    const storedFaceDescriptor = new Float32Array(user.faceData);
    const queryDescriptor = new Float32Array(faceData);

    const distance = faceapi.euclideanDistance(
      storedFaceDescriptor,
      queryDescriptor
    );

    if (distance < 0.6) {
      generateToken(res, user._id);
      return res.status(200).json({
        _id: user._id,
        name: user.name,
        lastName: user.lastName,
        cardId: user.cardId,
        email: user.email,
        phoneNumber: user.phoneNumber,
        isAdmin: user.isAdmin,
      });
    } else {
      res.status(401);
      throw new Error("Cara no reconocida");
    }
  } else if (password) {
    // Autenticación con contraseña
    if (await user.matchPassword(password)) {
      generateToken(res, user._id);
      res.status(200).json({
        _id: user._id,
        name: user.name,
        lastName: user.lastName,
        cardId: user.cardId,
        email: user.email,
        phoneNumber: user.phoneNumber,
        isAdmin: user.isAdmin,
      });
    } else {
      res.status(401);
      throw new Error("Email o contraseña inválidos");
    }
  } else {
    res.status(400);
    throw new Error(
      "Se requiere contraseña o datos faciales para iniciar sesión"
    );
  }
});

// @desc    Get face data for a user
// @route   POST /api/users/facedata
// @access  Public
const getFaceData = asyncHandler(async (req, res) => {
  const { email } = req.body;
  console.log("Email recibido en getFaceData:", email);

  const user = await User.findOne({ email });
  if (!user) {
    console.error("Usuario no encontrado");
    res.status(404);
    throw new Error("Usuario no encontrado");
  }

  if (!user.faceData || user.faceData.length === 0) {
    console.error("El usuario no tiene datos faciales registrados");
    res.status(400);
    throw new Error("El usuario no tiene datos faciales registrados");
  }

  console.log("faceData del usuario:", user.faceData);
  res.status(200).json({ faceData: user.faceData });
});

// @desc    Register user
// @route   POST /api/users
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const {
    name,
    lastName,
    cardId,
    email,
    phoneNumber,
    password,
    faceDescriptor,
  } = req.body;

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error("Usuario ya existe");
  }

  let parsedFaceDescriptor;
  if (faceDescriptor) {
    try {
      parsedFaceDescriptor =
        typeof faceDescriptor === "string"
          ? JSON.parse(faceDescriptor)
          : faceDescriptor;

      if (
        !Array.isArray(parsedFaceDescriptor) ||
        !parsedFaceDescriptor.every((num) => typeof num === "number")
      ) {
        throw new Error();
      }
    } catch {
      res.status(400);
      throw new Error("Formato inválido de faceDescriptor");
    }
  }

  const userData = {
    name,
    lastName,
    cardId,
    email,
    phoneNumber,
    password,
  };

  if (parsedFaceDescriptor) {
    userData.faceData = parsedFaceDescriptor;
  }

  const user = await User.create(userData);

  if (user) {
    if (!user.isAdmin) {
      // Asignar al usuario como paciente
      const defaultDoctor = await Doctor.findOne();
      if (!defaultDoctor) {
        // Si no hay ningún doctor, crear uno por defecto
        const createdDoctor = await Doctor.create({
          user: null, // Asigna un usuario si tienes uno por defecto
          especialidad: "General",
        });
        userData.doctor = createdDoctor._id;
      } else {
        userData.doctor = defaultDoctor._id;
      }

      const patient = await Patient.create({
        user: user._id,
        school: "N/A",
        birthdate: new Date(),
        gender: "N/A",
        educationalLevel: "N/A",
        familyRepresentative: "N/A",
        address: "N/A",
        maritalStatus: "N/A",
        profession: "N/A",
        cognitiveStage: "N/A",
        referredTo: "N/A",
        doctor: userData.doctor,
      });

      if (defaultDoctor) {
        defaultDoctor.patients.push(patient._id);
        await defaultDoctor.save();
      }
    }

    generateToken(res, user._id);
    res.status(201).json({
      _id: user._id,
      name: user.name,
      lastName: user.lastName,
      cardId: user.cardId,
      email: user.email,
      phoneNumber: user.phoneNumber,
      isAdmin: user.isAdmin,
    });
  } else {
    res.status(400);
    throw new Error("Datos de usuario inválidos");
  }
});

// @desc    Logout user - clear cookie
// @route   POST /api/users/logout
// @access  Private
const logoutUser = asyncHandler(async (req, res) => {
  res.cookie("jwt", "", {
    httpOnly: true,
    expires: new Date(0),
  });

  res.status(200).json({ message: "Sesión cerrada correctamente" });
});

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user) {
    res.status(200).json({
      _id: user._id,
      name: user.name,
      lastName: user.lastName,
      cardId: user.cardId,
      email: user.email,
      phoneNumber: user.phoneNumber,
      isAdmin: user.isAdmin,
    });
  } else {
    res.status(404);
    throw new Error("Usuario no encontrado");
  }
});

// Función para validar la cédula
const validateCedula = (cedula) => {
  if (!/^\d{10}$/.test(cedula)) {
    return false;
  }

  const verificador = parseInt(cedula[9], 10);
  const provincia = parseInt(cedula.substring(0, 2), 10);

  if (provincia < 0 || provincia > 24) {
    return false;
  }

  const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  let suma = 0;

  for (let i = 0; i < 9; i++) {
    let digito = parseInt(cedula[i], 10) * coeficientes[i];
    if (digito >= 10) {
      digito -= 9;
    }
    suma += digito;
  }

  const modulo = suma % 10;
  const resultadoFinal = modulo === 0 ? 0 : 10 - modulo;

  return resultadoFinal === verificador;
};

// Función para validar el formato del email
const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    const {
      name,
      lastName,
      cardId,
      email,
      phoneNumber,
      password,
      faceDescriptor,
    } = req.body;

    // Validación de cédula
    if (cardId && !validateCedula(cardId)) {
      res.status(400);
      throw new Error(
        "Cédula inválida. Asegúrate de que tenga 10 dígitos y sea coherente."
      );
    }

    // Validación de email
    if (email && !validateEmail(email)) {
      res.status(400);
      throw new Error(
        "Correo electrónico inválido. Asegúrate de que sea un formato válido."
      );
    }

    // Actualización de los campos en el perfil
    user.name = name || user.name;
    user.lastName = lastName || user.lastName;
    user.cardId = cardId || user.cardId;
    user.email = email || user.email;
    user.phoneNumber = phoneNumber || user.phoneNumber;

    // Si el usuario actualiza la contraseña
    if (password) {
      user.password = password;
    }

    // Procesamiento de faceDescriptor
    if (faceDescriptor) {
      let parsedDescriptor = faceDescriptor;
      if (typeof parsedDescriptor === "string") {
        try {
          parsedDescriptor = JSON.parse(parsedDescriptor);
        } catch (error) {
          res.status(400);
          throw new Error("Formato inválido de faceDescriptor");
        }
      }

      if (
        Array.isArray(parsedDescriptor) &&
        parsedDescriptor.every((num) => typeof num === "number")
      ) {
        user.faceData = parsedDescriptor;
      } else {
        res.status(400);
        throw new Error("Formato inválido de faceDescriptor");
      }
    }

    // Guardar los cambios en el perfil
    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      lastName: updatedUser.lastName,
      cardId: updatedUser.cardId,
      email: updatedUser.email,
      phoneNumber: updatedUser.phoneNumber,
    });
  } else {
    res.status(404);
    throw new Error("Usuario no encontrado");
  }
});

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find({});
  res.status(200).json(users);
});

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private/Admin
const getUserByID = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select("-password");
  if (user) {
    // Verificar si el usuario es un paciente y obtener su patientId
    let patientId = null;
    if (!user.isAdmin) {
      const patient = await Patient.findOne({ user: user._id });
      if (patient) {
        patientId = patient._id;
      }
    }

    res.status(200).json({
      ...user.toObject(),
      patientId,
    });
  } else {
    res.status(404);
    throw new Error("Usuario no encontrado");
  }
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (user) {
    if (user.isAdmin) {
      res.status(400);
      throw new Error("No se puede eliminar un usuario administrador");
    }

    // Si el usuario es un paciente, eliminarlo de la lista de pacientes del doctor correspondiente y borrar el documento de Patient
    const patient = await Patient.findOne({ user: user._id });
    if (patient) {
      const doctor = await Doctor.findById(patient.doctor);
      if (doctor) {
        doctor.patients = doctor.patients.filter(
          (p) => p.toString() !== patient._id.toString()
        );
        await doctor.save();
      }
      await Patient.deleteOne({ _id: patient._id });
    }

    // Si el usuario es un doctor, eliminar el documento de Doctor y actualizar pacientes
    const doctor = await Doctor.findOne({ user: user._id });
    if (doctor) {
      // Actualizar pacientes para que no tengan doctor asignado
      await Patient.updateMany({ doctor: doctor._id }, { $unset: { doctor: "" } });
      await Doctor.deleteOne({ _id: doctor._id });
    }

    // Finalmente, eliminar el documento del usuario
    await User.deleteOne({ _id: user._id });
    res.status(200).json({ message: "Usuario eliminado correctamente" });
  } else {
    res.status(404);
    throw new Error("Usuario no encontrado");
  }
});

// @desc    Disable user
// @route   PUT /api/users/:id/disable
// @access  Private/Admin
const disableUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (user) {
    user.isActive = false; // Cambiar el estado a inhabilitado
    await user.save(); // Guardar los cambios en la base de datos

    // Si el usuario es un paciente, eliminarlo de la lista de pacientes del doctor correspondiente
    const patient = await Patient.findOne({ user: user._id });
    if (patient) {
      const doctor = await Doctor.findById(patient.doctor);
      if (doctor) {
        doctor.patients = doctor.patients.filter(
          (p) => p.toString() !== patient._id.toString()
        );
        await doctor.save();
      }
    }

    res.status(200).json({ message: "Usuario deshabilitado correctamente" });
  } else {
    res.status(404);
    throw new Error("Usuario no encontrado");
  }
});

// @desc    Enable user
// @route   PUT /api/users/:id/enable
// @access  Private/Admin
const enableUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (user) {
    user.isActive = true; // Cambiar el estado a habilitado
    await user.save(); // Guardar los cambios en la base de datos

    // Si el usuario es un paciente, añadirlo a la lista de pacientes del doctor correspondiente
    const patient = await Patient.findOne({ user: user._id });
    if (patient) {
      const doctor = await Doctor.findById(patient.doctor);
      if (doctor && !doctor.patients.includes(patient._id)) {
        doctor.patients.push(patient._id);
        await doctor.save();
      }
    }

    res.status(200).json({ message: "Usuario habilitado correctamente" });
  } else {
    res.status(404);
    throw new Error("Usuario no encontrado");
  }
});

// @desc    Update user (admin endpoint to change user role and doctor assignment)
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error("Usuario no encontrado");
  }

  const { name, email, role, doctorId } = req.body;

  // Guardar el rol anterior
  const previousIsAdmin = user.isAdmin;

  // Actualizar los campos básicos
  user.name = name || user.name;
  user.email = email || user.email;
  user.isAdmin = role === "doctor";

  // Determinar si hay un cambio de rol
  const isRoleChanged = previousIsAdmin !== user.isAdmin;

  if (isRoleChanged) {
    if (user.isAdmin) {
      // Cambiar de Paciente a Doctor

      // Buscar el paciente
      const patient = await Patient.findOne({ user: user._id });
      if (patient) {
        const previousDoctorId = patient.doctor;

        // Remover al paciente del array de pacientes del doctor anterior
        const previousDoctor = await Doctor.findById(previousDoctorId);
        if (previousDoctor) {
          previousDoctor.patients = previousDoctor.patients.filter(
            (p) => p.toString() !== patient._id.toString()
          );
          await previousDoctor.save();
        }

        // Eliminar el documento de Patient
        await Patient.deleteOne({ _id: patient._id });
      }

      // Crear documento de Doctor si no existe
      const doctorExists = await Doctor.findOne({ user: user._id });
      if (!doctorExists) {
        await Doctor.create({ user: user._id, especialidad: "General" });
      }
    } else {
      // Cambiar de Doctor a Paciente

      // Eliminar documento de Doctor
      const doctor = await Doctor.findOne({ user: user._id });
      if (doctor) {
        await Doctor.deleteOne({ _id: doctor._id });
      }

      // Crear documento de Patient si no existe
      let patient = await Patient.findOne({ user: user._id });
      if (!patient) {
        patient = await Patient.create({
          user: user._id,
          school: "N/A", // Datos de ejemplo
          birthdate: new Date(),
          gender: "N/A",
          educationalLevel: "N/A",
          familyRepresentative: "N/A",
          address: "N/A",
          maritalStatus: "N/A",
          profession: "N/A",
          cognitiveStage: "N/A",
          referredTo: "N/A",
          doctor: doctorId || undefined,
        });

        // Asignar al doctor correspondiente si se proporciona doctorId
        if (doctorId) {
          const newDoctor = await Doctor.findById(doctorId);
          if (newDoctor && !newDoctor.patients.includes(patient._id)) {
            newDoctor.patients.push(patient._id);
            await newDoctor.save();
          }
        }
      }
    }
  } else {
    // Si el rol no ha cambiado, pero puede haber una reasignación de doctor
    if (user.isAdmin) {
      // Usuario es Doctor, podrías actualizar su especialidad u otros campos aquí si es necesario
      // Actualmente, no hay campos adicionales en el modelo Doctor para actualizar
    } else {
      // Usuario es Paciente, manejar la reasignación de doctor
      if (doctorId) {
        const patient = await Patient.findOne({ user: user._id });
        if (patient) {
          if (patient.doctor.toString() !== doctorId) {
            // Remover al paciente del array de pacientes del doctor anterior
            const previousDoctor = await Doctor.findById(patient.doctor);
            if (previousDoctor) {
              previousDoctor.patients = previousDoctor.patients.filter(
                (p) => p.toString() !== patient._id.toString()
              );
              await previousDoctor.save();
            }

            // Asignar el nuevo doctor al paciente
            patient.doctor = doctorId;
            await patient.save();

            // Añadir al nuevo doctor al array de pacientes
            const newDoctor = await Doctor.findById(doctorId);
            if (newDoctor && !newDoctor.patients.includes(patient._id)) {
              newDoctor.patients.push(patient._id);
              await newDoctor.save();
            }
          }
        }
      }
    }
  }

  const updatedUser = await user.save();

  res.status(200).json({
    _id: updatedUser._id,
    name: updatedUser.name,
    email: updatedUser.email,
    isAdmin: updatedUser.isAdmin,
  });
});

// @desc    Search users
// @route   GET /api/users/search
// @access  Private/Admin
const searchUsers = asyncHandler(async (req, res) => {
  const { query } = req.query; // Obtenemos la consulta de búsqueda de los parámetros de la URL

  // Buscamos usuarios que coincidan con la consulta
  const users = await User.find({
    $or: [
      { name: { $regex: query, $options: "i" } },
      { lastName: { $regex: query, $options: "i" } },
      { email: { $regex: query, $options: "i" } },
    ],
  });

  res.status(200).json(users);
});

export {
  authUser,
  registerUser,
  logoutUser,
  getUserProfile,
  updateUserProfile,
  getUsers,
  deleteUser,
  getUserByID,
  updateUser,
  getFaceData,
  searchUsers,
  disableUser,
  enableUser,
};
