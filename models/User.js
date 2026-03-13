import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // Plain text for prototype simplicity
    role: { type: String, enum: ["patient", "doctor"], required: true },
    // Patient Profile Fields
    healthCondition: { type: String, default: "" },
    age: { type: Number, default: null },
    bloodGroup: { type: String, default: "" },
    address: { type: String, default: "" },
    // Doctor Profile Fields
    specialty: { type: String, default: "General Medicine" },
    place: { type: String, default: "" },
    status: { type: String, enum: ["Available", "Offline"], default: "Available" },
    totalConsultations: { type: Number, default: 0 },
    experience: { type: Number, default: 0 },
    avgTimePerConsultation: { type: Number, default: 15 }, // default 15 mins
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model("User", UserSchema);
