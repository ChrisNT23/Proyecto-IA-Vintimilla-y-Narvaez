import mongoose from 'mongoose';

const moodSchema = mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId, // Cambia de user a patient
      required: true,
      ref: 'Patient', // Cambia la referencia de 'User' a 'Patient'
    },
    mood: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const Mood = mongoose.model('Mood', moodSchema);

export default Mood;
