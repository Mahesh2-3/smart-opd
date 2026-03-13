import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Appointment from "@/models/Appointment";
import User from "@/models/User";

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
    const avgTime = doctor?.avgTimePerConsultation || 15;
    const estimatedWaitTime = queuePosition * avgTime;

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

    await connectDB();

    if (patientId) {
      // Return history for a patient
      const appointments = await Appointment.find({ patientId })
        .sort({ createdAt: -1 })
        .populate("doctorId", "name specialty");
      return NextResponse.json({ appointments }, { status: 200 });
    }

    return NextResponse.json(
      { error: "patientId is required" },
      { status: 400 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
