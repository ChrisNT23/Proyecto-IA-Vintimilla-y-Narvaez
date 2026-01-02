import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
  name: { type: String, required: true }, // Nombre de la actividad 
  description: { type: String }, // Descripción de la actividad
  type: { type: String, required: true }, // Tipo de actividad (ej. asociación_fotos, memoria, etc.)
  dateCompletion: { type: Date, default: Date.now }, // Fecha en que se realizó la actividad
  scoreObtained: { type: Number }, // Puntaje obtenido por el paciente
  timeUsed: { type: Number }, // Tiempo en segundos que tardó el paciente en completar la actividad
  difficultyLevel: { type: Number }, // Nivel de dificultad de la actividad (ej. 1: fácil, 2: medio, 3: difícil)
  observations: { type: String }, // Comentarios adicionales sobre el desempeño del paciente
  progress: { type: String }, // Evaluación cualitativa del progreso del paciente (ej. "mejorando", "estable", "deteriorando")
  image:{ type:String, required:true},
  activeView:{type:Boolean, required:true, default: false },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true }, // Referencia al paciente que realiza la actividad
});

const Activity = mongoose.model('Activity', activitySchema);

export default Activity;
