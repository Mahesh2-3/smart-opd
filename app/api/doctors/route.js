import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Appointment from "@/models/Appointment";

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const specialty = searchParams.get("specialty");
    const place = searchParams.get("place");
    const status = searchParams.get("status");

    let query = { role: "doctor" };
    if (specialty) query.specialty = new RegExp(specialty, "i");
    if (place) query.place = new RegExp(place, "i");
    if (status) query.status = status;

    // Fetch doctors with base stats
    const doctors = await User.find(query).select("-password").lean();

    // Attach live queue wait sizes
    for (let doc of doctors) {
      const queueSize = await Appointment.countDocuments({
        doctorId: doc._id,
        status: "waiting",
      });
      doc.liveQueueSize = queueSize;
      doc.estimatedWaitTime = queueSize * (doc.avgTimePerConsultation || 15);
    }

    return NextResponse.json({ doctors }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
