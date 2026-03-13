import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(req) {
  try {
    const { email, password, role } = await req.json();
    await connectDB();

    const user = await User.findOne({ email, role });
    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials or role mismatch" },
        { status: 401 },
      );
    }

    if (user.password !== password) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    // Strip password from response
    const { password: _, ...userWithoutPassword } = user.toObject();

    return NextResponse.json(
      { message: "Login successful", user: userWithoutPassword },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
