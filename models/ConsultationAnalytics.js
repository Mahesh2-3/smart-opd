import mongoose from "mongoose";

const ConsultationAnalyticsSchema = new mongoose.Schema(
  {
    doctor_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    patient_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    token_id: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment", required: true },
    consultation_start: { type: Date, required: true },
    consultation_end: { type: Date, required: true },
    duration: { type: Number, required: true },
    disease_type: { type: String, required: true },
    complexity_score: { type: Number, required: true },
  },
  { timestamps: true }
);

export default mongoose.models.ConsultationAnalytics || mongoose.model("ConsultationAnalytics", ConsultationAnalyticsSchema);
