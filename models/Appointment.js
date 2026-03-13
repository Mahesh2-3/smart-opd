import mongoose from "mongoose";

const AppointmentSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    tokenNumber: { type: String, required: true, unique: true },
    status: { type: String, enum: ["waiting", "serving", "finished", "cancelled"], default: "waiting" },
    cause: { type: String, required: true }, // Disease or reason for visit
    startedTime: { type: Date, default: null },
    completedTime: { type: Date, default: null },
    durationMinutes: { type: Number, default: 0 },
    queuePosition: { type: Number, default: 0 },
    estimatedWaitTime: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.models.Appointment || mongoose.model("Appointment", AppointmentSchema);
