// models/treatmentModel.js
import mongoose from 'mongoose';

const completedActivitySchema = new mongoose.Schema({
  activity: { type: mongoose.Schema.Types.ObjectId, ref: 'Activity', required: true }, // Referencia a la actividad
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true }, // Referencia al paciente
  dateCompleted: { type: Date, default: Date.now }, // Fecha de completación
  scoreObtained: { type: Number }, // Puntaje obtenido
  timeUsed: { type: Number }, // Tiempo utilizado en segundos
  difficultyLevel:{type: Number},
  progress: { type: String, enum: ['mejorando', 'estable', 'deteriorando'] }, // Progreso
  observations: { type: String }, // Observaciones
  image: { type: String, required: false }, // URL de la imagen
  activeView: { type: Boolean, default: false }, // Vista activa
});

const treatmentSchema = new mongoose.Schema({
  patients: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Patient' }], // Lista de pacientes
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true }, // Referencia al doctor
  treatmentName: { type: String, required: true }, // Nombre del tratamiento
  description: { type: String, required: true }, // Descripción general del tratamiento
  assignedActivities: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Activity' }], // Actividades asignadas
  completedActivities: [completedActivitySchema], // Actividades completadas
  medications: [
    {
      name: { type: String, required: true }, // Nombre del medicamento
      dosage: { type: String, required: true }, // Dosis
      frequency: { type: String, required: true }, // Frecuencia
      startDate: { type: Date, required: true }, // Fecha de inicio
      endDate: { type: Date }, // Fecha de fin
      imageUrl: { type: String }, // URL de la imagen
      lastTaken: { type: Date, default: null },
    },
  ],
  exerciseVideos: [
    {
      title: { type: String, required: true }, // Título del video
      description: { type: String }, // Descripción
      url: { type: String, required: true }, // URL del video
      duration: { type: Number }, // Duración en segundos
      assignedDate: { type: Date, default: Date.now }, // Fecha de asignación
    },
  ],
  startDate: { type: Date, default: Date.now }, // Fecha de inicio del tratamiento
  endDate: { type: Date }, // Fecha de finalización
  progress: { type: String, enum: ['mejorando', 'estable', 'empeorando'], default: 'estable' },
  adherence: { type: Number, default: 0, min: 0, max: 100 }, // Adherencia
  observations: { type: String }, // Observaciones del doctor
  nextReviewDate: { type: Date }, // Próxima revisión
  createdAt: { type: Date, default: Date.now }, // Fecha de creación
  updatedAt: { type: Date, default: Date.now }, // Fecha de actualización
  active: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

const Treatment = mongoose.model('Treatment', treatmentSchema);
export default Treatment;
