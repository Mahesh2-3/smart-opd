import mongoose from "mongoose";

const AnalyticsSchema = new mongoose.Schema(
  {
    diseaseName: { type: String, required: true, unique: true },
    avgTimeInMinutes: { type: Number, default: 15 },
    totalDataPoints: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.models.Analytics || mongoose.model("Analytics", AnalyticsSchema);
