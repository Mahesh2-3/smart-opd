import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Token from "@/models/Token";

export async function POST(req) {
  try {
    const { department, patientId } = await req.json();
    await connectDB();

    // Check if patient already has an active token
    const existingToken = await Token.findOne({
      patientId,
      status: { $in: ["waiting", "serving"] },
    });
    if (existingToken) {
      return NextResponse.json(
        { error: "You already have an active token.", token: existingToken },
        { status: 400 },
      );
    }

    // Generate token number logically (e.g. A23)
    const count = await Token.countDocuments({ department });
    const tokenLetter = department.substring(0, 1).toUpperCase();
    const tokenNumberStr = `${tokenLetter}${count + 1}`;

    // Get exact queue position
    const queuePosition =
      (await Token.countDocuments({ department, status: "waiting" })) + 1;

    const newToken = await Token.create({
      tokenNumber: tokenNumberStr,
      department,
      patientId,
      status: "waiting",
      queuePosition,
      estimatedWaitTime: queuePosition * 15, // Fallback wait time prediction
    });

    return NextResponse.json(
      { message: "Token generated", token: newToken },
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
  const { searchParams } = new URL(req.url);
  const patientId = searchParams.get("patientId");

  try {
    await connectDB();
    if (patientId) {
      const tokens = await Token.find({ patientId }).sort({ createdAt: -1 });
      return NextResponse.json({ tokens }, { status: 200 });
    } else {
      const tokens = await Token.find({
        status: { $in: ["waiting", "serving"] },
      }).sort({ createdAt: 1 });
      return NextResponse.json({ tokens }, { status: 200 });
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
