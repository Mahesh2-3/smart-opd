import mongoose from "mongoose";

const TokenSchema = new mongoose.Schema(
  {
    tokenNumber: { type: String, required: true, unique: true },
    department: { type: String, required: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["waiting", "serving", "finished", "cancelled"], default: "waiting" },
    queuePosition: { type: Number, default: 0 },
    estimatedWaitTime: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.models.Token || mongoose.model("Token", TokenSchema);
