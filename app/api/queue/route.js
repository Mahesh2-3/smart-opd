import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Appointment from "@/models/Appointment";
import User from "@/models/User";
import Analytics from "@/models/Analytics";

export async function POST(req) {
  try {
    const { action, tokenId, department } = await req.json();
    await connectDB();

    if (action === "call_next") {
      const { doctorId } = await req.json().catch(() => ({}));

      // Find the next waiting appointment for this specific doctor
      // Or fallback to department logic if doctorId isn't provided (for backwards comp)
      const query = doctorId
        ? { doctorId, status: "waiting" }
        : { department, status: "waiting" };

      const nextToken = await Appointment.findOne(query).sort({
        queuePosition: 1,
      });

      if (!nextToken) {
        return NextResponse.json(
          { message: "No patients waiting in queue" },
          { status: 404 },
        );
      }

      // Mark it as serving and log start time
      nextToken.status = "serving";
      nextToken.startedTime = new Date();
      await nextToken.save();

      return NextResponse.json(
        { message: "Called next patient", token: nextToken },
        { status: 200 },
      );
    } else if (action === "finish") {
      // Mark current serving appointment as finished
      const servingToken = await Appointment.findById(tokenId);
      if (!servingToken) {
        return NextResponse.json(
          { error: "Appointment not found" },
          { status: 404 },
        );
      }

      servingToken.status = "finished";
      servingToken.completedTime = new Date();

      // Calculate duration
      let durationMinutes = 15; // default fallback
      if (servingToken.startedTime) {
        const durationMs =
          servingToken.completedTime.getTime() -
          new Date(servingToken.startedTime).getTime();
        durationMinutes = Math.max(1, Math.round(durationMs / 60000));
      }
      servingToken.durationMinutes = durationMinutes;
      await servingToken.save();

      // Update Doctor's aggregate metrics
      if (servingToken.doctorId) {
        const doctor = await User.findById(servingToken.doctorId);
        if (doctor) {
          const currentTotal = doctor.totalConsultations || 0;
          const currentAvg = doctor.avgTimePerConsultation || 15;
          const newTotal = currentTotal + 1;
          const newAvg =
            (currentAvg * currentTotal + durationMinutes) / newTotal;
          doctor.totalConsultations = newTotal;
          doctor.avgTimePerConsultation = Math.round(newAvg);
          await doctor.save();
        }
      }

      // Update Patient's aggregate metrics
      if (servingToken.patientId) {
        const patient = await User.findById(servingToken.patientId);
        if (patient) {
          const currentTotal = patient.totalConsultations || 0;
          const currentAvg = patient.avgTimePerConsultation || 15;
          const newTotal = currentTotal + 1;
          const newAvg =
            (currentAvg * currentTotal + durationMinutes) / newTotal;
          patient.totalConsultations = newTotal;
          patient.avgTimePerConsultation = Math.round(newAvg);
          await patient.save();
        }
      }

      // Update Disease / Cause Analytics
      if (servingToken.cause) {
        let diseaseStats = await Analytics.findOne({
          diseaseName: servingToken.cause,
        });
        if (!diseaseStats) {
          diseaseStats = new Analytics({
            diseaseName: servingToken.cause,
            avgTimeInMinutes: durationMinutes,
            totalDataPoints: 1,
          });
        } else {
          const currentTotal = diseaseStats.totalDataPoints || 0;
          const currentAvg = diseaseStats.avgTimeInMinutes || 15;
          const newTotal = currentTotal + 1;
          const newAvg =
            (currentAvg * currentTotal + durationMinutes) / newTotal;
          diseaseStats.totalDataPoints = newTotal;
          diseaseStats.avgTimeInMinutes = Math.round(newAvg);
        }
        await diseaseStats.save();
      }

      // Recalculate queue positions and estimated times for the remaining waiting tokens
      const remainingTokens = await Appointment.find({
        doctorId: servingToken.doctorId,
        status: "waiting",
      }).sort({ queuePosition: 1 });

      for (let i = 0; i < remainingTokens.length; i++) {
        remainingTokens[i].queuePosition = i + 1;
        // Optionally logic can inject the more accurate python AI wait time later, fallback hardcoded for now locally
        remainingTokens[i].estimatedWaitTime = (i + 1) * 15;
        await remainingTokens[i].save();
      }

      return NextResponse.json(
        { message: "Consultation finished" },
        { status: 200 },
      );
    }

    return NextResponse.json({ error: "Invalid action" });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const department = searchParams.get("department");
  const doctorId = searchParams.get("doctorId");

  try {
    await connectDB();
    if (!department && !doctorId) {
      return NextResponse.json(
        { error: "Department or DoctorId is required" },
        { status: 400 },
      );
    }

    // Get current serving patient and the rest of the queue
    const queryBase = doctorId ? { doctorId } : { department };
    const currentserving = await Appointment.findOne({
      ...queryBase,
      status: "serving",
    }).populate("patientId", "name healthCondition age bloodGroup");
    const queue = await Appointment.find({ ...queryBase, status: "waiting" })
      .sort({ queuePosition: 1 })
      .populate("patientId", "name");

    return NextResponse.json({ currentserving, queue }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
