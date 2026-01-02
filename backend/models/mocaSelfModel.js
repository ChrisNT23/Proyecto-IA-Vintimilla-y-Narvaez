import mongoose from "mongoose";

const mocaSelfSchema = new mongoose.Schema(
  {
    // Referencia al paciente que realizó la prueba
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },

    // Nombre del paciente (opcional, duplicado por conveniencia)
    patientName: { type: String },

    // Estructura para guardar puntajes y respuestas de cada módulo
    // Se utiliza Mixed para mayor flexibilidad en la estructura
    modulesData: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // Puntaje total (suma de todos los módulos)
    totalScore: { type: Number, default: 0 },

    // Fecha de creación de la prueba
    testDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const MocaSelf = mongoose.model("MocaSelf", mocaSelfSchema);
export default MocaSelf;
