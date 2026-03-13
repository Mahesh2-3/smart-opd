import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Appointment from "@/models/Appointment";
import User from "@/models/User";
import Analytics from "@/models/Analytics";

export async function POST(req) {
  try {
    const { patientId, doctorId, department, cause } = await req.json();
    await connectDB();

    if (!patientId || !doctorId || !department || !cause) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Check if patient already has an active appointment for this doctor
    const existing = await Appointment.findOne({
      patientId,
      doctorId,
      status: { $in: ["waiting", "serving"] },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Patient already has an active appointment with this doctor" },
        { status: 400 },
      );
    }

    // Determine queue position
    const count = await Appointment.countDocuments({
      doctorId,
      status: "waiting",
    });
    const queuePosition = count + 1;

    // Generate token number (simple logic: DeptPrefix + DoctorInitials + Number)
    const deptPrefix = department.substring(0, 3).toUpperCase();
    const tokenNumber = `${deptPrefix}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Get doctor's average consultation time
    const doctor = await User.findById(doctorId);
    const doctor_avg_time = doctor?.avgTimePerConsultation || 15;
    
    // Get patient's average
    const patient = await User.findById(patientId);
    const patient_history_avg_time = patient?.avgTimePerConsultation || 0;
    
    // Get disease average
    let disease_avg_time = 0;
    try {
        const stats = await Analytics.findOne({ diseaseName: cause });
        if (stats) disease_avg_time = stats.avgTimeInMinutes;
    } catch(e) {}

    let estimatedWaitTime = queuePosition * doctor_avg_time; // Fallback
    try {
      const aiResponse = await fetch("http://127.0.0.1:8000/api/predict-wait-time", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
           queue_length: queuePosition,
           disease_avg_time,
           doctor_avg_time,
           patient_history_avg_time
        })
      });
      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        estimatedWaitTime = aiData.estimated_wait_time_minutes;
      }
    } catch(err) {
      console.log("Failed to reach Python backend:", err.message);
    }

    const newAppointment = await Appointment.create({
      patientId,
      doctorId,
      department,
      cause,
      tokenNumber,
      queuePosition,
      estimatedWaitTime,
    });

    return NextResponse.json(
      {
        message: "Appointment booked successfully",
        appointment: newAppointment,
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get("patientId");
    const doctorId = searchParams.get("doctorId");

    await connectDB();

    if (patientId) {
      // Return history for a patient
      const appointments = await Appointment.find({ patientId })
        .sort({ createdAt: -1 })
        .populate("doctorId", "name specialty");
      return NextResponse.json({ appointments }, { status: 200 });
    }
    
    if (doctorId) {
      // Return history for a doctor
      const appointments = await Appointment.find({ doctorId })
        .sort({ createdAt: -1 })
        .populate("patientId", "name age healthCondition");
      return NextResponse.json({ appointments }, { status: 200 });
    }

    return NextResponse.json(
      { error: "patientId or doctorId is required" },
      { status: 400 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
