import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Appointment from "@/models/Appointment";
import User from "@/models/User";
import Analytics from "@/models/Analytics";
import ConsultationAnalytics from "@/models/ConsultationAnalytics";
import { io } from "socket.io-client";
import redis from "@/lib/redis";
import logger from "@/lib/logger";

// Connect to the local socket server
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const socket = io(SITE_URL);

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

      // Recalculate queue positions and estimated times for the remaining waiting tokens
      const remainingTokens = await Appointment.find({
        doctorId: doctorId || nextToken.doctorId,
        status: "waiting",
      }).sort({ queuePosition: 1 });

      let accumulatedTime = 0;
      let doctorAvg = 15;
      const currentDoctorId = doctorId || nextToken.doctorId;

      if (currentDoctorId) {
        const cachedAvg = await redis.get(`doctor:avg_time:${currentDoctorId}`).catch(() => null);
        if (cachedAvg) {
          doctorAvg = parseInt(cachedAvg, 10);
        } else {
          doctorAvg = (await User.findById(currentDoctorId))?.avgTimePerConsultation || 15;
          await redis.setex(`doctor:avg_time:${currentDoctorId}`, 60, doctorAvg.toString()).catch(() => null);
        }
      }

      for (let i = 0; i < remainingTokens.length; i++) {
        remainingTokens[i].queuePosition = i + 1;

        // Simulation engine logic: predict wait time using complexity and avg
        const complexityWeight = 1.0; // fallback to 1.0 for now

        accumulatedTime += doctorAvg * complexityWeight;
        remainingTokens[i].estimatedWaitTime = Math.round(accumulatedTime);
        await remainingTokens[i].save();
      }

      // Broadcast WebSocket events
      socket.emit("token_called", { doctorId: currentDoctorId, token: nextToken });
      socket.emit("queue_updated", { doctorId: currentDoctorId });

      // Invalidate Redis Cache
      if (currentDoctorId) {
        await redis.del(`queue:${currentDoctorId}`).catch(() => null);
      }

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

      // Record consultation analytics
      if (servingToken.doctorId && servingToken.patientId) {
        await ConsultationAnalytics.create({
          doctor_id: servingToken.doctorId,
          patient_id: servingToken.patientId,
          token_id: servingToken._id,
          consultation_start: servingToken.startedTime || new Date(Date.now() - durationMinutes * 60000),
          consultation_end: servingToken.completedTime,
          duration: durationMinutes,
          disease_type: servingToken.cause || "General",
          complexity_score: 1.0 // default for now, can be modified by actual complexity if tracked
        });
      }

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

          // Invalidate doctor average cache
          await redis.del(`doctor:avg_time:${servingToken.doctorId}`).catch(() => null);
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

      let accumulatedTime = 0;
      let queueDoctorAvg = 15;

      if (servingToken.doctorId) {
        const cachedAvg = await redis.get(`doctor:avg_time:${servingToken.doctorId}`).catch(() => null);
        if (cachedAvg) {
          queueDoctorAvg = parseInt(cachedAvg, 10);
        } else {
          queueDoctorAvg = (await User.findById(servingToken.doctorId))?.avgTimePerConsultation || 15;
          await redis.setex(`doctor:avg_time:${servingToken.doctorId}`, 60, queueDoctorAvg.toString()).catch(() => null);
        }
      }

      for (let i = 0; i < remainingTokens.length; i++) {
        remainingTokens[i].queuePosition = i + 1;

        // Simulation engine logic: predict wait time using complexity and avg
        const complexityWeight = 1.0;

        accumulatedTime += queueDoctorAvg * complexityWeight;
        remainingTokens[i].estimatedWaitTime = Math.round(accumulatedTime);
        await remainingTokens[i].save();
      }

      // Broadcast WebSocket events
      socket.emit("consultation_completed", { doctorId: servingToken.doctorId, tokenId });
      socket.emit("queue_updated", { doctorId: servingToken.doctorId });

      // Invalidate Redis Cache
      if (servingToken.doctorId) {
        await redis.del(`queue:${servingToken.doctorId}`).catch(() => null);
      }

      logger.info("consultation_completed", { doctorId: servingToken.doctorId, tokenId });

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
