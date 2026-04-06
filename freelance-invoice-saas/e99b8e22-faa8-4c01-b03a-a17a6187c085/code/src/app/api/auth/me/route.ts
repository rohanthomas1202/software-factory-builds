import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function GET(): Promise<Response> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ data: null });
    }

    // Return user without password hash
    const { passwordHash, ...userWithoutPassword } = user;
    return NextResponse.json({ data: userWithoutPassword });
  } catch (error) {
    console.error("Get current user error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}