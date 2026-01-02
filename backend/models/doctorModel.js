import mongoose from "mongoose";

const doctorSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  especialidad: { type: String, required: true },
  patients: [{ type: mongoose.Schema.Types.ObjectId, ref: "Patient" }],
});

const Doctor = mongoose.model("Doctor", doctorSchema);
export default Doctor;
